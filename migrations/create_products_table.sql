-- Simple products table for CrownPhone project
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_feature BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert/update/delete (for admin)
CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, is_feature, is_new) VALUES 
('CrownPhone Pro', 'Professional Android screen mirroring software', 29.99, 'https://example.com/crownphone-pro.jpg', true, false),
('CrownPhone Business', 'Enterprise screen mirroring solution', 99.99, 'https://example.com/crownphone-business.jpg', true, true),
('CrownPhone Free', 'Free trial version', 0.00, 'https://example.com/crownphone-free.jpg', false, true);
