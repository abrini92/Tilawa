-- ============================================
-- REFRESH SCHEMA CACHE
-- Exécute ça pour forcer Supabase à recharger
-- ============================================

-- Notifier PostgREST de recharger le schema
NOTIFY pgrst, 'reload schema';

-- Alternative : Vérifier que la foreign key existe bien
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'recitations';

-- Si aucune foreign key n'apparaît, on la crée différemment
-- En utilisant la référence directe à auth.users au lieu de profiles

-- D'abord, supprimer l'ancienne contrainte si elle existe
ALTER TABLE recitations 
DROP CONSTRAINT IF EXISTS recitations_user_id_fkey;

-- Recréer avec référence à auth.users (pas profiles)
ALTER TABLE recitations
ADD CONSTRAINT recitations_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Maintenant créer une VIEW qui fait le JOIN
CREATE OR REPLACE VIEW recitations_with_profiles AS
SELECT 
  r.*,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name as profile_full_name,
  p.avatar_url as profile_avatar_url
FROM recitations r
LEFT JOIN profiles p ON p.id = r.user_id;

-- Donner les permissions sur la view
GRANT SELECT ON recitations_with_profiles TO authenticated;
GRANT SELECT ON recitations_with_profiles TO anon;

-- ============================================
-- DONE! Schema refreshed
-- ============================================
