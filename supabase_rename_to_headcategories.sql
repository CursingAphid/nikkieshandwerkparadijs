-- Rename headcategory table to headcategories
ALTER TABLE headcategory RENAME TO headcategories;

-- Rename the junction table to match
ALTER TABLE headcategory_categories RENAME TO headcategories_categories;

-- Update foreign key references in the junction table
-- Note: headcategory_id column name stays the same, only table name changes

-- Update indexes
DROP INDEX IF EXISTS idx_headcategory_slug;
DROP INDEX IF EXISTS idx_headcategory_type;
DROP INDEX IF EXISTS idx_headcategory_categories_headcategory_id;
DROP INDEX IF EXISTS idx_headcategory_categories_category_id;

CREATE INDEX IF NOT EXISTS idx_headcategories_slug ON headcategories(slug);
CREATE INDEX IF NOT EXISTS idx_headcategories_type ON headcategories(type);
CREATE INDEX IF NOT EXISTS idx_headcategories_categories_headcategory_id ON headcategories_categories(headcategory_id);
CREATE INDEX IF NOT EXISTS idx_headcategories_categories_category_id ON headcategories_categories(category_id);

-- Update RLS policies (drop old ones first)
DROP POLICY IF EXISTS "headcategory_public_read" ON headcategories;
DROP POLICY IF EXISTS "headcategory_admin_all" ON headcategories;
DROP POLICY IF EXISTS "headcategory_categories_public_read" ON headcategories_categories;
DROP POLICY IF EXISTS "headcategory_categories_admin_all" ON headcategories_categories;

-- Create new RLS policies
CREATE POLICY "headcategories_public_read" ON headcategories
    FOR SELECT USING (true);

CREATE POLICY "headcategories_admin_all" ON headcategories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "headcategories_categories_public_read" ON headcategories_categories
    FOR SELECT USING (true);

CREATE POLICY "headcategories_categories_admin_all" ON headcategories_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
