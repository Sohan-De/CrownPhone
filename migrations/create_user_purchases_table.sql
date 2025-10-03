-- Create user_purchases table for one-time payments
CREATE TABLE IF NOT EXISTS user_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES products(id),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_intent_id TEXT,
    payment_method VARCHAR(50) DEFAULT 'card',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases" ON user_purchases
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert purchases
CREATE POLICY "Authenticated users can insert purchases" ON user_purchases
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow admin to manage all purchases
CREATE POLICY "Admin can manage all purchases" ON user_purchases
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );
