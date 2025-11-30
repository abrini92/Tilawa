-- Add Auphonic tracking columns to recitations table
-- Execute this in Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE recitations 
ADD COLUMN IF NOT EXISTS audio_url_original text,
ADD COLUMN IF NOT EXISTS audio_url_enhanced text,
ADD COLUMN IF NOT EXISTS auphonic_production_id text,
ADD COLUMN IF NOT EXISTS enhancement text CHECK (enhancement IN ('clean', 'studio', 'mosque_light', 'mosque_deep'));

-- Update existing records to have audio_url_original
UPDATE recitations 
SET audio_url_original = audio_url 
WHERE audio_url_original IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN recitations.audio_url IS 'Current audio URL (enhanced if available, otherwise original)';
COMMENT ON COLUMN recitations.audio_url_original IS 'Original uploaded file URL';
COMMENT ON COLUMN recitations.audio_url_enhanced IS 'Auphonic processed file URL (if available)';
COMMENT ON COLUMN recitations.auphonic_production_id IS 'Auphonic production UUID for tracking';
COMMENT ON COLUMN recitations.enhancement IS 'Type of audio enhancement applied: clean, studio, mosque_light, mosque_deep';
