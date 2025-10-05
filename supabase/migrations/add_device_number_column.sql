-- Add device_number column to products table
-- Migration: Add device_number column to products table

-- Add the device_number column to the products table
ALTER TABLE products 
ADD COLUMN device_number VARCHAR(50);

-- Add a comment to describe the column
COMMENT ON COLUMN products.device_number IS 'Unique device number or identifier for the product';

-- Create an index on device_number for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_products_device_number ON products(device_number);

-- Update existing products with placeholder device numbers (optional)
-- You can modify this based on your needs
UPDATE products 
SET device_number = 'DEV-' || LPAD(id::text, 6, '0')
WHERE device_number IS NULL;
