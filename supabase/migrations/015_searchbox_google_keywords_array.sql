-- Add google_keywords array to accumulate all keywords a post ranks for
ALTER TABLE public.searchbox_results
  ADD COLUMN IF NOT EXISTS google_keywords text[] NOT NULL DEFAULT '{}';

-- Backfill existing rows with their single keyword
UPDATE public.searchbox_results
SET google_keywords = ARRAY[google_keyword]
WHERE array_length(google_keywords, 1) IS NULL;
