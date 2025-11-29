-- ============================================
-- TILAWA - ROW LEVEL SECURITY (RLS) POLICIES
-- Sécurité complète de la base de données
-- ============================================

-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES POLICIES
-- ============================================

-- Anyone can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users cannot delete profiles
-- (Handled by Supabase Auth cascade)

-- 3. RECITATIONS POLICIES
-- ============================================

-- Everyone can view ready recitations
CREATE POLICY "Ready recitations are viewable by everyone"
ON recitations FOR SELECT
USING (status = 'ready');

-- Users can view their own recitations (any status)
CREATE POLICY "Users can view their own recitations"
ON recitations FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own recitations
CREATE POLICY "Users can insert their own recitations"
ON recitations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recitations
CREATE POLICY "Users can update own recitations"
ON recitations FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own recitations
CREATE POLICY "Users can delete own recitations"
ON recitations FOR DELETE
USING (auth.uid() = user_id);

-- 4. FOLLOWS POLICIES
-- ============================================

-- Everyone can view follows (for public follower/following lists)
CREATE POLICY "Follows are viewable by everyone"
ON follows FOR SELECT
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- 5. STORAGE POLICIES (Recitations Bucket)
-- ============================================

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('recitations', 'recitations', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view recitations (public bucket)
CREATE POLICY "Public recitations are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'recitations');

-- Users can upload to their own folder
CREATE POLICY "Users can upload their own recitations"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recitations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "Users can update own recitations"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recitations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete own recitations"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recitations' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. ADDITIONAL SECURITY FUNCTIONS
-- ============================================

-- Function to check if user owns recitation
CREATE OR REPLACE FUNCTION is_recitation_owner(recitation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM recitations
    WHERE id = recitation_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid() AND following_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RATE LIMITING (Using PostgreSQL + Triggers)
-- ============================================

-- Create rate limit table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, action, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  action_name TEXT,
  max_count INTEGER,
  window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count actions in current window
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM rate_limits
  WHERE user_id = auth.uid()
    AND action = action_name
    AND window_start > NOW() - (window_minutes || ' minutes')::INTERVAL;

  -- Check if limit exceeded
  IF current_count >= max_count THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  INSERT INTO rate_limits (user_id, action, count, window_start)
  VALUES (auth.uid(), action_name, 1, NOW())
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce upload rate limit (10 per day)
CREATE OR REPLACE FUNCTION enforce_upload_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit('upload_recitation', 10, 1440) THEN
    RAISE EXCEPTION 'Upload limit exceeded. Maximum 10 uploads per day.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_upload_rate_limit
BEFORE INSERT ON recitations
FOR EACH ROW
EXECUTE FUNCTION enforce_upload_rate_limit();

-- 8. AUDIT LOG (Track important actions)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Only admins can view audit log"
ON audit_log FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Function to log actions
CREATE OR REPLACE FUNCTION log_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER audit_recitations
AFTER INSERT OR UPDATE OR DELETE ON recitations
FOR EACH ROW
EXECUTE FUNCTION log_action();

-- 9. INDEXES FOR PERFORMANCE
-- ============================================

-- Recitations indexes
CREATE INDEX IF NOT EXISTS idx_recitations_user_id ON recitations(user_id);
CREATE INDEX IF NOT EXISTS idx_recitations_status ON recitations(status);
CREATE INDEX IF NOT EXISTS idx_recitations_created_at ON recitations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recitations_plays ON recitations(plays DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- DONE! RLS IS NOW FULLY CONFIGURED
-- ============================================

-- To verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To test policies:
-- SET ROLE authenticated;
-- SELECT * FROM recitations; -- Should only see ready recitations + own recitations
