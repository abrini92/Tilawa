-- ============================================
-- CRÉER LA TABLE LIKES
-- Exécute ça dans Supabase SQL Editor
-- ============================================

-- 1. Créer la table likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recitation_id UUID REFERENCES recitations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, recitation_id)
);

-- 2. Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Users can like recitations"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike recitations"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_recitation_id ON likes(recitation_id);

-- 5. Function to update likes count
CREATE OR REPLACE FUNCTION update_recitation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recitations
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = NEW.recitation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recitations
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = OLD.recitation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-update likes count
DROP TRIGGER IF EXISTS update_likes_count ON likes;
CREATE TRIGGER update_likes_count
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_recitation_likes_count();

-- ============================================
-- DONE! Table likes créée
-- ============================================

-- Vérifier
SELECT * FROM likes;
