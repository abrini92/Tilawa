-- ============================================
-- CRÉER LE BUCKET STORAGE + POLICIES
-- Exécute ça MAINTENANT dans Supabase SQL Editor
-- ============================================

-- 1. Créer le bucket (si pas déjà fait)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recitations', 'recitations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 3. Policy : Tout le monde peut voir
CREATE POLICY "Anyone can view recitations"
ON storage.objects FOR SELECT
USING (bucket_id = 'recitations');

-- 4. Policy : Users authentifiés peuvent upload
CREATE POLICY "Authenticated users can upload recitations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recitations' AND
  auth.role() = 'authenticated'
);

-- 5. Policy : Users peuvent update leurs fichiers
CREATE POLICY "Users can update own recitations"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recitations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Policy : Users peuvent delete leurs fichiers
CREATE POLICY "Users can delete own recitations"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recitations' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- DONE! Storage bucket configuré
-- ============================================

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'recitations';
