-- ============================================
-- FIX URGENT : Ajouter la relation recitations -> profiles
-- Exécute ça MAINTENANT dans Supabase SQL Editor
-- ============================================

-- Option 1: Si la table profiles existe déjà avec des users
-- On doit d'abord créer les profils manquants

-- Créer automatiquement un profil pour chaque user qui a uploadé
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT DISTINCT 
  r.user_id,
  u.email,
  NOW(),
  NOW()
FROM recitations r
JOIN auth.users u ON u.id = r.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = r.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Maintenant on peut ajouter la foreign key
-- (Elle existe peut-être déjà, donc on utilise IF NOT EXISTS via une fonction)

DO $$ 
BEGIN
  -- Vérifier si la contrainte existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recitations_user_id_fkey'
    AND table_name = 'recitations'
  ) THEN
    -- Ajouter la foreign key
    ALTER TABLE recitations
    ADD CONSTRAINT recitations_user_id_fkey
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Créer une fonction trigger pour auto-créer le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil quand un user s'inscrit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE! La relation est maintenant créée
-- ============================================

-- Vérifier que ça marche :
SELECT 
  r.id,
  r.surah_name,
  p.email,
  p.full_name
FROM recitations r
LEFT JOIN profiles p ON p.id = r.user_id
LIMIT 5;
