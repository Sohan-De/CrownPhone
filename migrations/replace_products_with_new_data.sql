-- Replace existing products with new product data
-- This migration replaces all existing products with 10 new products

-- Step 1: Clear existing products first
DELETE FROM products;

-- Step 2: Insert 10 new products with proper categorization
INSERT INTO products (name, description, price, image_url, is_feature, is_new, status) VALUES 

-- Featured and New products (will show in both featured section and new arrivals swiper)
('VoltShield Pro', 'Heavy-duty enclosure for protecting telecom and server hardware, built with reinforced steel and advanced ventilation.', 149.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', true, true, 'active'),

('FortiBox 3000', 'Industrial-grade casing for telecom, IoT, and edge computing applications — durable and field-ready.', 179.00, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop', true, true, 'active'),

('CoreProtect X-Series', 'Professional-grade housing for mission-critical electronics, with advanced durability features.', 189.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop', true, false, 'active'),

-- New products only (will show in new arrivals swiper)
('CircuitVault X1', 'Rugged electronic housing engineered for reliable cooling and safe operation of communication boards.', 122.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop', false, true, 'active'),

('PulseGuard Enclosure', 'Precision-crafted box with heat-resistant design, preventing component failure in demanding environments.', 139.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', false, true, 'active'),

('AeroGuard Casing', 'Sleek enclosure with engineered airflow channels, ensuring optimal cooling and stability for electronics.', 139.00, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop', false, true, 'active'),

-- Regular products (will show in product list page)
('SafeCore Unit', 'Compact protective unit that shields sensitive electronics while maintaining airflow and structural integrity.', 99.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop', false, false, 'active'),

('ThermaFlow Case', 'Optimized ventilation system for high-performance modules, reducing overheating risks during heavy usage.', 119.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', false, false, 'active'),

('NexaVault Enclosure', 'Next-generation modular protective box designed for scalable systems with secure housing.', 159.00, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=500&fit=crop', false, false, 'active'),

('EdgeShield Enclosure', 'Minimalist yet robust box for edge computing and telecom hardware, balancing design and protection.', 169.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop', false, false, 'active');

-- Step 3: Verify the data
SELECT 
    name, 
    price, 
    is_feature, 
    is_new, 
    status,
    created_at
FROM products 
ORDER BY created_at DESC;
