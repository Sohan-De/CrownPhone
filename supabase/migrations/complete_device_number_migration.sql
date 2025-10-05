-- Complete migration to add device_number column to products table
-- Run this in your Supabase SQL Editor

BEGIN;

-- Add the device_number column to the products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS device_number VARCHAR(50);

-- Add a comment to describe the column
COMMENT ON COLUMN products.device_number IS 'Unique device number or identifier for the product';

-- Create an index on device_number for better query performance
CREATE INDEX IF NOT EXISTS idx_products_device_number ON products(device_number);

-- Update existing products with device numbers based on their ID
-- This will generate device numbers like: DEV-000001, DEV-000002, etc.
UPDATE products 
SET device_number = 'DEV-' || LPAD(EXTRACT(EPOCH FROM created_at)::bigint::text, 8, '0')
WHERE device_number IS NULL;

-- Add a unique constraint to ensure device numbers are unique
ALTER TABLE products 
ADD CONSTRAINT unique_device_number UNIQUE (device_number);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'device_number';

COMMIT;
