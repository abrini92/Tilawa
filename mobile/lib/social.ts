/**
 * Social Features Service
 * Follow/Followers, Comments, etc.
 */

import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';
import Analytics from './analytics';

/**
 * Follow a user
 */
export async function followUser(followingId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      });

    if (error) throw error;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Analytics.trackEvent('user_followed', { followingId });
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followingId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Analytics.trackEvent('user_unfollowed', { followingId });
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

/**
 * Check if following a user
 */
export async function isFollowing(followingId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

/**
 * Get followers count
 */
export async function getFollowersCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting followers count:', error);
    return 0;
  }
}

/**
 * Get following count
 */
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting following count:', error);
    return 0;
  }
}

/**
 * Get followers list
 */
export async function getFollowers(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('following_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
}

/**
 * Get following list
 */
export async function getFollowing(userId: string) {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
}

/**
 * Get personalized feed (from followed users)
 */
export async function getPersonalizedFeed(limit: number = 20) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get IDs of users I follow
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (!following || following.length === 0) {
      // If not following anyone, return popular recitations
      return getPopularRecitations(limit);
    }

    const followingIds = following.map(f => f.following_id);

    // Get recitations from followed users
    const { data, error } = await supabase
      .from('recitations')
      .select(`
        *,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .in('user_id', followingIds)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting personalized feed:', error);
    return [];
  }
}

/**
 * Get popular recitations (fallback)
 */
async function getPopularRecitations(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('recitations')
      .select(`
        *,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'ready')
      .order('plays', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting popular recitations:', error);
    return [];
  }
}
