-- ============================================
-- CRÉER LA TABLE COMMENTS
-- Exécute ça dans Supabase SQL Editor
-- ============================================

-- 1. Créer la table comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recitation_id UUID REFERENCES recitations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can post comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_comments_recitation_id ON comments(recitation_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 5. Function to update updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger
DROP TRIGGER IF EXISTS update_comments_timestamp ON comments;
CREATE TRIGGER update_comments_timestamp
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comments_updated_at();

-- ============================================
-- DONE! Table comments créée
-- ============================================

-- Vérifier
SELECT * FROM comments;
