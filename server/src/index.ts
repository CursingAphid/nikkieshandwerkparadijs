import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const app = express();

// Middleware
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || undefined;
app.use(cors({
  origin: FRONTEND_ORIGIN || true, // allow configured origin or all in dev
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET || 'change-me'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Helpers ---
function parseCategoryIds(input: unknown): number[] | null {
  if (input == null) return null;
  if (Array.isArray(input)) {
    const out = input.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    return out.length ? out : [];
  }
  if (typeof input === 'string') {
    try {
      const arr = JSON.parse(input);
      if (Array.isArray(arr)) {
        const out = arr.map((v) => Number(v)).filter((n) => Number.isFinite(n));
        return out.length ? out : [];
      }
    } catch (_) {
      // not JSON, try comma separated
      const out = input
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));
      return out.length ? out : [];
    }
  }
  return [];
}

// --- Admin auth ---
function isAuthed(req: express.Request): boolean {
  const token = req.signedCookies?.admin || '';
  return token === '1';
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAuthed(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME || '';
  const expectedPass = process.env.ADMIN_PASSWORD || '';
  if (!expectedUser || !expectedPass) {
    res.status(500).json({ error: 'Admin credentials not configured' });
    return;
  }
  if (username === expectedUser && password === expectedPass) {
    // Cross-site cookie for separate frontend/backend domains requires SameSite=None; Secure
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'lax' | 'none' = FRONTEND_ORIGIN ? 'none' : 'lax';
    
    console.log('Login successful, setting cookie with:', {
      isProd,
      sameSite,
      FRONTEND_ORIGIN,
      domain: req.get('host'),
      origin: req.get('origin')
    });
    
    res.cookie('admin', '1', {
      httpOnly: true,
      sameSite,
      secure: isProd,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  const authed = isAuthed(req);
  console.log('Auth check:', {
    authed,
    signedCookies: req.signedCookies,
    cookies: req.cookies,
    origin: req.get('origin'),
    host: req.get('host')
  });
  res.json({ authed });
});
// File upload to Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/items', requireAdmin, upload.array('images', 50), async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const bucket = process.env.SUPABASE_BUCKET || 'items';
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const nameRaw = (req.body.name ?? '').toString().trim();
    if (!nameRaw) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const priceRaw = (req.body.price ?? '').toString().trim();
    const priceValue = priceRaw === '' ? null : Number(priceRaw);
    const price = priceValue !== null && Number.isFinite(priceValue) ? priceValue : null;

    const files = (req.files as Express.Multer.File[]) || [];
    const datePrefix = new Date().toISOString().slice(0, 10);
    const urls: string[] = [];
    for (const file of files) {
      const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const unique = crypto.randomUUID();
      const objectPath = `${datePrefix}/${unique}-${safeBase}`;

      let { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (uploadError) {
        const message = (uploadError as any)?.message || '';
        const isBucketMissing = /bucket/i.test(message) && /not\s*found|does\s*not\s*exist/i.test(message);
        if (isBucketMissing) {
          const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
          if (createError && (createError as any)?.statusCode !== '409') {
            res.status(500).json({ error: `Bucket missing and could not be created: ${createError.message}` });
            return;
          }
          const retry = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
          uploadError = retry.error || null as any;
        }
      }
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      let url = publicData.publicUrl;
      if (!url) {
        const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
        url = signedData?.signedUrl || '';
      }
      if (url) urls.push(url);
    }

    // Insert item row
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: nameRaw,
        price,
        images: urls.length ? urls : null,
        is_favorite: String(req.body.is_favorite || '').toLowerCase() === 'true'
      })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Link categories if provided
    const categoryIds = parseCategoryIds(req.body.categoryIds);
    if (categoryIds && categoryIds.length > 0) {
      const rows = categoryIds.map((cid) => ({ item_id: data.id as number, category_id: cid }));
      const { error: linkErr } = await supabase.from('item_categories').insert(rows);
      if (linkErr) {
        res.status(500).json({ error: linkErr.message });
        return;
      }
    }

    res.status(201).json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Create item failed' });
  }
});

// List items
app.get('/api/items', async (_req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List items failed' });
  }
});

// Bulk update item orders (MUST be before /api/items/:id route)
app.patch('/api/items/orders', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Items must be an array' });
      return;
    }
    
    // Update each item's order
    const updates = items.map((item: { id: number; order: number }) => 
      supabase
        .from('items')
        .update({ order: item.order })
        .eq('id', item.id)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        res.status(500).json({ error: result.error.message });
        return;
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Bulk update item orders failed' });
  }
});

// Bulk update category orders (used by HeadCategoryCategories page)
app.patch('/api/categories/orders', requireAdmin, async (req, res) => {
  try {
    const { categories } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    if (!Array.isArray(categories)) {
      res.status(400).json({ error: 'Categories must be an array' });
      return;
    }
    
    // Update each category's order
    const updates = categories.map((category: { id: number; order: number }) => 
      supabase
        .from('categories')
        .update({ order: category.order })
        .eq('id', category.id)
    );
    
    const results = await Promise.all(updates);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        res.status(500).json({ error: result.error.message });
        return;
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Bulk update category orders failed' });
  }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Get item failed' });
  }
});

// Update item (append images)
app.patch('/api/items/:id', requireAdmin, upload.array('images', 25), async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const bucket = process.env.SUPABASE_BUCKET || 'items';
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load existing item
    const { data: existing, error: getErr } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (getErr || !existing) { res.status(404).json({ error: 'Not found' }); return; }

    const nameRaw = (req.body.name ?? existing.name ?? '').toString();
    if (!nameRaw.trim()) { res.status(400).json({ error: 'Name is required' }); return; }
    const priceRaw = (req.body.price ?? (existing.price ?? '')).toString().trim();
    const priceValue = priceRaw === '' ? null : Number(priceRaw);
    const price = priceValue !== null && Number.isFinite(priceValue) ? priceValue : null;

    const files = (req.files as Express.Multer.File[]) || [];
    const datePrefix = new Date().toISOString().slice(0, 10);
    const newUrls: string[] = [];
    for (const file of files) {
      const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const unique = crypto.randomUUID();
      const objectPath = `${datePrefix}/${unique}-${safeBase}`;
      let { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (uploadError) {
        const message = (uploadError as any)?.message || '';
        const isBucketMissing = /bucket/i.test(message) && /not\s*found|does\s*not\s*exist/i.test(message);
        if (isBucketMissing) {
          const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
          if (createError && (createError as any)?.statusCode !== '409') {
            res.status(500).json({ error: `Bucket missing and could not be created: ${createError.message}` });
            return;
          }
          const retry = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
          uploadError = retry.error || null as any;
        }
      }
      if (uploadError) { res.status(500).json({ error: uploadError.message }); return; }
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      let url = publicData.publicUrl;
      if (!url) {
        const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
        url = signedData?.signedUrl || '';
      }
      if (url) newUrls.push(url);
    }

    const mergedImages: string[] | null = Array.isArray(existing.images)
      ? [...existing.images, ...newUrls]
      : (newUrls.length ? newUrls : null);

    const updatePayload: any = {
      name: nameRaw,
      price,
      images: mergedImages,
    };
    if (typeof req.body.is_favorite !== 'undefined') {
      updatePayload.is_favorite = String(req.body.is_favorite).toLowerCase() === 'true';
    }

    const { data, error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }

    // If categoryIds provided, replace links
    const categoryIds = parseCategoryIds(req.body.categoryIds);
    if (categoryIds !== null) {
      const itemId = data.id as number;
      const { error: delErr } = await supabase.from('item_categories').delete().eq('item_id', itemId);
      if (delErr) { res.status(500).json({ error: delErr.message }); return; }
      if (categoryIds.length > 0) {
        const rows = categoryIds.map((cid) => ({ item_id: itemId, category_id: cid }));
        const { error: insErr } = await supabase.from('item_categories').insert(rows);
        if (insErr) { res.status(500).json({ error: insErr.message }); return; }
      }
    }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Update item failed' });
  }
});

// Delete a single image from an item (by exact URL match)
app.delete('/api/items/:id/images', requireAdmin, async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const imageUrl = (req.query.url || '').toString();
    if (!imageUrl) { res.status(400).json({ error: 'Missing image url' }); return; }

    // Load existing item
    const { data: existing, error: getErr } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (getErr || !existing) { res.status(404).json({ error: 'Not found' }); return; }

    const current: string[] = Array.isArray(existing.images) ? existing.images : [];
    const next = current.filter((u) => u !== imageUrl);

    const { data, error } = await supabase
      .from('items')
      .update({ images: next.length ? next : null })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Delete item image failed' });
  }
});

// --- Categories ---
// List categories
app.get('/api/categories', async (_req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (categoriesError) { 
      res.status(500).json({ error: categoriesError.message }); 
      return; 
    }
    
    // Get headcategory links for all categories
    const { data: links, error: linksError } = await supabase
      .from('headcategories_categories')
      .select('category_id, headcategory_id');
    
    if (linksError) {
      console.error('Failed to load headcategory links:', linksError);
      // Continue without links - categories will have headcategory_id as null
    }
    
    // Add headcategory_id to each category
    const categoriesWithHeadcategory = (categories || []).map(category => ({
      ...category,
      headcategory_id: links?.find(link => link.category_id === category.id)?.headcategory_id || null
    }));
    
    res.json(categoriesWithHeadcategory);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'List categories failed' });
  }
});

// Create category
app.post('/api/categories', requireAdmin, upload.single('headimage'), async (req, res) => {
  try {
    const { name, slug, description, type, headcategoryId } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    let headimageurl = null;
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .upload(`categories/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .getPublicUrl(`categories/${fileName}`);
      headimageurl = urlData.publicUrl;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert({ 
        name: String(name || '').trim(), 
        slug: String(slug || '').trim(),
        description: description ? String(description).trim() : null,
        type: type ? String(type).trim() : null,
        headimageurl
      })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    
    // Link to headcategory if provided
    if (headcategoryId && parseInt(headcategoryId)) {
      const { error: linkErr } = await supabase
        .from('headcategories_categories')
        .insert({ 
          headcategory_id: parseInt(headcategoryId), 
          category_id: data.id 
        });
      if (linkErr) {
        console.error('Failed to link category to headcategory:', linkErr);
        // Don't fail the request, just log the error
      }
    }
    
    res.status(201).json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Create category failed' });
  }
});

// Update category
app.patch('/api/categories/:id', requireAdmin, upload.single('headimage'), async (req, res) => {
  try {
    const { name, slug, description, type } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    const updateData: any = {
      name: name != null ? String(name) : undefined,
      slug: slug != null ? String(slug) : undefined,
      description: description != null ? String(description).trim() : undefined,
      type: type != null ? String(type).trim() : undefined
    };
    
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .upload(`categories/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .getPublicUrl(`categories/${fileName}`);
      updateData.headimageurl = urlData.publicUrl;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Update category failed' });
  }
});

// Remove category head image (sets headimageurl to null)
app.delete('/api/categories/:id/headimage', requireAdmin, async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('categories')
      .update({ headimageurl: null })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Delete head image failed' });
  }
});

// Items in a category
app.get('/api/categories/:id/items', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .in(
        'id',
        (await supabase
          .from('item_categories')
          .select('item_id')
          .eq('category_id', req.params.id)).data?.map((r: any) => r.item_id) || []
      )
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List items for category failed' });
  }
});

// Categories for an item
app.get('/api/items/:id/categories', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .in(
        'id',
        (await supabase
          .from('item_categories')
          .select('category_id')
          .eq('item_id', req.params.id)).data?.map((r: any) => r.category_id) || []
      )
      .order('name', { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List categories for item failed' });
  }
});

// Update item order
app.patch('/api/items/:id/order', requireAdmin, async (req, res) => {
  try {
    const { order } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    if (typeof order !== 'number' || order < 0) {
      res.status(400).json({ error: 'Order must be a non-negative number' });
      return;
    }
    
    const { data, error } = await supabase
      .from('items')
      .update({ order })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) { 
      res.status(500).json({ error: error.message }); 
      return; 
    }
    
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Update item order failed' });
  }
});

// --- Headcategories ---
// List headcategories
app.get('/api/headcategories', async (_req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase.from('headcategories').select('*').order('order', { ascending: true }).order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List headcategories failed' });
  }
});

// Get single headcategory
app.get('/api/headcategories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase.from('headcategories').select('*').eq('id', id).single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Headcategory not found' }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Get headcategory failed' });
  }
});

// Create headcategory
app.post('/api/headcategories', requireAdmin, upload.single('headimage'), async (req, res) => {
  try {
    const { name, slug, description, type } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    let headimageurl = null;
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `headcategory-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .upload(`headcategories/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .getPublicUrl(`headcategories/${fileName}`);
      headimageurl = urlData.publicUrl;
    }
    
    const { data, error } = await supabase
      .from('headcategories')
      .insert({ 
        name: String(name || '').trim(), 
        slug: String(slug || '').trim(),
        description: description ? String(description).trim() : null,
        type: type ? String(type).trim() : null,
        headimageurl
      })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(201).json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Create headcategory failed' });
  }
});

// Update headcategory
app.patch('/api/headcategories/:id', requireAdmin, upload.single('headimage'), async (req, res) => {
  try {
    const { name, slug, description, type } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    const updateData: any = {
      name: name != null ? String(name) : undefined,
      slug: slug != null ? String(slug) : undefined,
      description: description != null ? String(description).trim() : undefined,
      type: type != null ? String(type).trim() : undefined
    };
    
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `headcategory-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .upload(`headcategories/${fileName}`, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET || 'uploads')
        .getPublicUrl(`headcategories/${fileName}`);
      updateData.headimageurl = urlData.publicUrl;
    }
    
    const { data, error } = await supabase
      .from('headcategories')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Update headcategory failed' });
  }
});

// Delete headcategory
app.delete('/api/headcategories/:id', requireAdmin, async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { error } = await supabase.from('headcategories').delete().eq('id', req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Delete headcategory failed' });
  }
});

// Remove headcategory head image
app.delete('/api/headcategories/:id/headimage', requireAdmin, async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('headcategories')
      .update({ headimageurl: null })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Remove headcategory head image failed' });
  }
});

// Get categories for a headcategory
app.get('/api/headcategories/:id/categories', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .in(
        'id',
        (await supabase
          .from('headcategories_categories')
          .select('category_id')
          .eq('headcategory_id', req.params.id)).data?.map((r: any) => r.category_id) || []
      )
      .order('order', { ascending: true })
      .order('name', { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List categories for headcategory failed' });
  }
});

// Link categories to headcategory
app.post('/api/headcategories/:id/categories', requireAdmin, async (req, res) => {
  try {
    const { categoryIds } = req.body || {};
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const rows = categoryIds.map((cid: number) => ({ 
        headcategory_id: parseInt(req.params.id), 
        category_id: cid 
      }));
      const { error: linkErr } = await supabase.from('headcategories_categories').insert(rows);
      if (linkErr) {
        res.status(500).json({ error: linkErr.message });
        return;
      }
    }
    
    res.json({ success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Link categories to headcategory failed' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY; // Prefer service role key; anon key may need storage policies
    const bucket = process.env.SUPABASE_BUCKET || 'uploads';
    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: 'Supabase env vars not configured' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = crypto.randomUUID();
    const objectPath = `${new Date().toISOString().slice(0, 10)}/${unique}-${safeBase}`;

    let { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (uploadError) {
      const message = (uploadError as any)?.message || '';
      const isBucketMissing = /bucket/i.test(message) && /not\s*found|does\s*not\s*exist/i.test(message);
      if (isBucketMissing) {
        // Attempt to create bucket if using a service role key
        try {
          const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
          if (createError && (createError as any)?.statusCode !== '409') {
            res.status(500).json({ error: `Bucket missing and could not be created: ${createError.message}` });
            return;
          }
          // Retry upload after creating bucket (or if it already existed)
          const retry = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
          uploadError = retry.error || null as any;
        } catch (err: any) {
          res.status(500).json({ error: 'Bucket missing and auto-create failed. Create a public bucket named "uploads" in Supabase.' });
          return;
        }
      }
      if (uploadError) {
        res.status(500).json({ error: uploadError.message });
        return;
      }
    }

    // Try to get a public URL; if bucket not public, create a signed URL
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    let url = publicData.publicUrl;
    if (!url) {
      const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
      if (signedError || !signedData) {
        res.status(200).json({ path: objectPath, bucket, message: 'Uploaded, but URL could not be generated', note: 'Make the bucket public or use signed URLs' });
        return;
      }
      url = signedData.signedUrl;
    }

    res.json({ path: objectPath, bucket, url });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 404 handler for API
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT) || 5174;
app.listen(port, () => {
  console.log(`[server] listening on :${port}`);
});


