import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

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
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleLike = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle like
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => newLiked ? prev + 1 : prev - 1);
    
    // Save to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newLiked) {
        // Add like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            recitation_id: recitationId,
          });
      } else {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('recitation_id', recitationId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
    
    if (onLike) {
      onLike(newLiked);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleLike}
      activeOpacity={0.7}
    >
      <Animated.Text 
        style={[
          styles.icon, 
          liked && styles.iconLiked,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {liked ? '❤️' : '🤍'}
      </Animated.Text>
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
