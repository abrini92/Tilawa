-- ============================================
-- CRÉER TON PROFIL AUTOMATIQUEMENT
-- Exécute ça MAINTENANT dans Supabase SQL Editor
-- ============================================

-- Créer un profil pour TOUS les users qui n'en ont pas
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Vérifier que ton profil existe maintenant
SELECT id, email, full_name FROM profiles;

-- ============================================
-- DONE! Ton profil est créé
-- ============================================
