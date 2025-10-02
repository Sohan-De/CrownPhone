-- Add support for multiple product images
-- This migration adds a new column to store multiple images as JSON array

-- Step 1: Add new column for multiple images
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing image_url to images array
UPDATE products 
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '';

-- Step 3: Add some sample multiple images for existing products
UPDATE products 
SET images = '[
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop"
]'::jsonb
WHERE name = 'VoltShield Pro';

UPDATE products 
SET images = '[
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop"
]'::jsonb
WHERE name = 'FortiBox 3000';

UPDATE products 
SET images = '[
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop"
]'::jsonb
WHERE name = 'CoreProtect X-Series';

-- Step 4: Verify the changes
SELECT name, images, jsonb_array_length(images) as image_count 
FROM products 
WHERE images IS NOT NULL 
ORDER BY name;
