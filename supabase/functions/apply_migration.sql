-- Create stored procedure for applying migrations
CREATE OR REPLACE FUNCTION apply_migration(sql_content TEXT)
RETURNS VOID AS $$
BEGIN
    -- Execute the SQL content directly
    EXECUTE sql_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
