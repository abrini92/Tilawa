/**
 * Comments Service
 * Post and view comments on recitations
 */

import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';
import { trackEvent } from './analytics';

export interface Comment {
  id: string;
  recitation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Check if ID is a valid UUID
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Get comments for a recitation
 */
export async function getComments(recitationId: string): Promise<Comment[]> {
  try {
    // Skip if not a valid UUID (demo recitations)
    if (!isValidUUID(recitationId)) {
      console.log('Skipping comments for demo recitation:', recitationId);
      return [];
    }

    // Load comments first
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('recitation_id', recitationId)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;
    if (!comments || comments.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(comments.map(c => c.user_id))];

    // Load profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Could not load profiles:', profilesError);
    }

    // Create profiles map
    const profilesMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    // Merge comments with profiles
    const commentsWithProfiles = comments.map(comment => ({
      ...comment,
      profiles: profilesMap.get(comment.user_id),
    }));

    return commentsWithProfiles;
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

/**
 * Post a comment
 */
export async function postComment(recitationId: string, content: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!content.trim() || content.length > 500) {
      throw new Error('Comment must be between 1 and 500 characters');
    }

    const { error } = await supabase
      .from('comments')
      .insert({
        recitation_id: recitationId,
        user_id: user.id,
        content: content.trim(),
      });

    if (error) throw error;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent('comment_posted', { recitationId });
    
    return true;
  } catch (error) {
    console.error('Error posting comment:', error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return false;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent('comment_deleted', { commentId });
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

/**
 * Get comment count for a recitation
 */
export async function getCommentCount(recitationId: string): Promise<number> {
  try {
    // Skip if not a valid UUID (demo recitations)
    if (!isValidUUID(recitationId)) {
      return 0;
    }

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('recitation_id', recitationId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
}
