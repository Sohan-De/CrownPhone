-- Migration: Add order column to products table
-- Date: 2025-01-27
-- Description: Adds an order column to control product display sequence

-- Add order column to products table
ALTER TABLE products 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add comment to document the new column
COMMENT ON COLUMN products.display_order IS 'Controls the display order of products (lower numbers appear first)';

-- Update existing products with order values
-- Featured products first (1-3)
UPDATE products 
SET display_order = 1 
WHERE name = 'VoltShield Pro';

UPDATE products 
SET display_order = 2 
WHERE name = 'FortiBox 3000';

UPDATE products 
SET display_order = 3 
WHERE name = 'CoreProtect X-Series';

-- New products next (4-6)
UPDATE products 
SET display_order = 4 
WHERE name = 'CircuitVault X1';

UPDATE products 
SET display_order = 5 
WHERE name = 'PulseGuard Enclosure';

UPDATE products 
SET display_order = 6 
WHERE name = 'AeroGuard Casing';

-- Regular products last (7-10)
UPDATE products 
SET display_order = 7 
WHERE name = 'SafeCore Unit';

UPDATE products 
SET display_order = 8 
WHERE name = 'ThermaFlow Case';

UPDATE products 
SET display_order = 9 
WHERE name = 'NexaVault Enclosure';

UPDATE products 
SET display_order = 10 
WHERE name = 'EdgeShield Enclosure';

-- Create index for better performance when ordering
CREATE INDEX idx_products_display_order ON products(display_order);

-- Verify the order column was added and populated
SELECT 
    name, 
    display_order, 
    is_feature, 
    is_new,
    price
FROM products 
ORDER BY display_order ASC;
