import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import * as Haptics from 'expo-haptics';
import { pulse } from '../lib/animations';
import Icon from './Icon';

interface LikeButtonProps {
  recitationId: string;
  initialLikes: number;
  isLiked?: boolean;
  onLike?: (liked: boolean) => void;
}

export default function LikeButton({ 
  recitationId,
  initialLikes, 
  isLiked = false,
  onLike 
}: LikeButtonProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(initialLikes);
  const scale = useRef(new Animated.Value(1)).current;

  const handleLike = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate with pulse
    pulse(scale).start();

    // ✨ OPTIMISTIC UI - Update immediately
    const newLiked = !liked;
    const previousLiked = liked;
    const previousLikes = likes;
    
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);
    
    if (onLike) {
      onLike(newLiked);
    }
    
    // Save to Supabase in background
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Rollback if no user
        setLiked(previousLiked);
        setLikes(previousLikes);
        return;
      }

      if (newLiked) {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            recitation_id: recitationId,
          });
        
        if (error) throw error;
      } else {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('recitation_id', recitationId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleLike}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={{ transform: [{ scale }] }}
      >
        <Icon name="heart" size={20} color={liked ? '#ef4444' : '#94a3b8'} filled={liked} />
      </Animated.View>
      <Text style={[styles.count, liked && styles.countLiked]}>
        {likes.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 20,
  },
  iconLiked: {
    // Animation handled by Animated.Text
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  countLiked: {
    color: '#ef4444',
  },
});
