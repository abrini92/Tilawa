-- ============================================
-- FIX DELETE POLICY FOR RECITATIONS
-- Permet aux users de supprimer leurs propres récitations
-- ============================================

-- 1. Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Users can delete own recitations" ON recitations;

-- 2. Créer la nouvelle policy
CREATE POLICY "Users can delete own recitations"
ON recitations FOR DELETE
USING (auth.uid() = user_id);

-- 3. Vérifier que RLS est activé
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE! Les users peuvent maintenant supprimer leurs récitations
-- ============================================

-- Pour tester :
-- DELETE FROM recitations WHERE id = 'ton-id' AND user_id = auth.uid();
