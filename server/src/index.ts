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
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET || 'change-me'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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
    res.cookie('admin', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true when behind HTTPS
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
  res.json({ authed: isAuthed(req) });
});
// File upload to Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create Item: name (required), description (optional), price (optional), images[] (optional)
app.post('/api/items', requireAdmin, upload.array('images', 10), async (req, res) => {
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
    const descriptionRaw = (req.body.description ?? '').toString();
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
        description: descriptionRaw || null,
        price,
        images: urls.length ? urls : null,
      })
      .select()
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
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
      .order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'List items failed' });
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
app.patch('/api/items/:id', requireAdmin, upload.array('images', 10), async (req, res) => {
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
    const description = (req.body.description ?? existing.description ?? '') as string;
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

    const { data, error } = await supabase
      .from('items')
      .update({
        name: nameRaw,
        description: description || null,
        price,
        images: mergedImages,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: 'Update item failed' });
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


