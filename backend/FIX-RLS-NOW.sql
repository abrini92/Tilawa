-- ============================================
-- FIX URGENT : Voir ses propres récitations
-- Exécute ça MAINTENANT dans Supabase SQL Editor
-- ============================================

-- Ajouter policy pour voir SES PROPRES récitations (peu importe le status)
CREATE POLICY "Users can view their own recitations"
ON recitations FOR SELECT
USING (auth.uid() = user_id);

-- Ajouter colonne 'likes' si elle n'existe pas
ALTER TABLE recitations 
ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;

-- Créer table follows si elle n'existe pas
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS sur follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy pour follows
CREATE POLICY "Follows are viewable by everyone"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- Ajouter push_token à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- ============================================
-- DONE! Maintenant tu peux voir tes récitations
-- ============================================
