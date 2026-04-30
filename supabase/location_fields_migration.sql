-- Migration to add Country and City fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Update RLS or indexes if needed (optional)
-- CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
