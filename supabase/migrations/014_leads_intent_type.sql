-- Add intent_type column to leads table (classifier v2)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_type text;
