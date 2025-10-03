-- Migration: Add long_description and specifications columns to products table
-- Date: 2025-01-27
-- Description: Adds two new text columns for enhanced product information

-- Add long_description column
ALTER TABLE products 
ADD COLUMN long_description TEXT;

-- Add specifications column  
ALTER TABLE products 
ADD COLUMN specifications TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN products.long_description IS 'Detailed product description for product details page';
COMMENT ON COLUMN products.specifications IS 'Product specifications and technical details';
