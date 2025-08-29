-- SQL functions for dynamic table management in Supabase

-- Function to get all table names in public schema
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.tablename::text
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations', '_prisma_migrations');
END;
$$;

-- Function to get table columns information
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Function to execute dynamic SQL (for creating tables)
-- BE VERY CAREFUL WITH THIS - Only use for controlled table creation
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add basic SQL injection protection
  IF query ~* '(DROP|DELETE|TRUNCATE|ALTER\s+USER|CREATE\s+USER|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Dangerous SQL operation detected';
  END IF;
  
  EXECUTE query;
END;
$$;

-- Example table structure for sheet-based data
-- This is a template for how sheet-based tables might look
-- Note: Actual table names should follow format: gs_tablename
CREATE TABLE IF NOT EXISTS "gs_dakota_free" (
  id SERIAL PRIMARY KEY,
  "Schedule Tab" TEXT,
  "Scheduled Date" TEXT,
  "Type" TEXT,
  "TIME PST" TEXT,
  "MESSAGE TYPE" TEXT,
  "Creator Name" TEXT,
  "PAYWALL CONTENT" TEXT,
  "Content Style" TEXT,
  "Caption" TEXT,
  "CAPTION STYLE" TEXT,
  "Price" TEXT,
  "OUTCOME" TEXT,
  "Performance" TEXT,
  "Revenue" TEXT,
  "Buys" TEXT,
  "Image URL" TEXT,
  "Video URL" TEXT,
  "Notes" TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gs_dakota_free_message_type ON "gs_dakota_free"(message_type);
CREATE INDEX IF NOT EXISTS idx_gs_dakota_free_outcome ON "gs_dakota_free"(outcome);
CREATE INDEX IF NOT EXISTS idx_gs_dakota_free_content_style ON "gs_dakota_free"(content_style);

-- Favorites system table (replaces Google Sheets favorites)
CREATE TABLE IF NOT EXISTS "user_favorites" (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_id, table_name)
);

-- PTR/Releases tracking table (replaces Google Sheets PTR tracking)
CREATE TABLE IF NOT EXISTS "ptr_tracking" (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  title TEXT,
  marked_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(item_id, table_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON "user_favorites"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item_id ON "user_favorites"(item_id);
CREATE INDEX IF NOT EXISTS idx_ptr_tracking_item_id ON "ptr_tracking"(item_id);

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;