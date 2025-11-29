-- ============================================
-- CRÉER LA TABLE NOTIFICATIONS
-- Exécute ça dans Supabase SQL Editor
-- ============================================

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'milestone', 'upload_complete')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 5. Function to send notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  recitation_owner UUID;
  recitation_name TEXT;
  liker_name TEXT;
BEGIN
  -- Get recitation owner and name
  SELECT user_id, surah_name INTO recitation_owner, recitation_name
  FROM recitations
  WHERE id = NEW.recitation_id;

  -- Get liker name
  SELECT COALESCE(full_name, email) INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't notify if user likes their own recitation
  IF recitation_owner != NEW.user_id THEN
    -- Create notification
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      recitation_owner,
      'like',
      'New Like ❤️',
      liker_name || ' liked your recitation of ' || recitation_name,
      jsonb_build_object(
        'recitation_id', NEW.recitation_id,
        'liker_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to send notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  recitation_owner UUID;
  recitation_name TEXT;
  commenter_name TEXT;
BEGIN
  -- Get recitation owner and name
  SELECT user_id, surah_name INTO recitation_owner, recitation_name
  FROM recitations
  WHERE id = NEW.recitation_id;

  -- Get commenter name
  SELECT COALESCE(full_name, email) INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't notify if user comments on their own recitation
  IF recitation_owner != NEW.user_id THEN
    -- Create notification
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      recitation_owner,
      'comment',
      'New Comment 💬',
      commenter_name || ' commented on ' || recitation_name,
      jsonb_build_object(
        'recitation_id', NEW.recitation_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to send notification on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower name
  SELECT COALESCE(full_name, email) INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Create notification
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New Follower 👥',
    follower_name || ' started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Triggers
DROP TRIGGER IF EXISTS notify_like ON likes;
CREATE TRIGGER notify_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_like();

DROP TRIGGER IF EXISTS notify_comment ON comments;
CREATE TRIGGER notify_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();

DROP TRIGGER IF EXISTS notify_follow ON follows;
CREATE TRIGGER notify_follow
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow();

-- ============================================
-- DONE! Notifications system créé
-- ============================================

-- Vérifier
SELECT * FROM notifications;
