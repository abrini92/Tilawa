import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { getComments, postComment, Comment } from '../lib/comments';
import * as Haptics from 'expo-haptics';

interface CommentsSectionProps {
  recitationId: string;
}

export default function CommentsSection({ recitationId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recitationId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await getComments(recitationId);
    setComments(data);
    setLoading(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (newComment.length > 500) {
      Alert.alert('Error', 'Comment is too long (max 500 characters)');
      return;
    }

    setPosting(true);
    const success = await postComment(recitationId, newComment);
    
    if (success) {
      setNewComment('');
      await loadComments(); // Reload comments
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Error', 'Failed to post comment');
    }
    
    setPosting(false);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.profiles?.full_name || item.profiles?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentInfo}>
          <Text style={styles.commentAuthor}>
            {item.profiles?.full_name || item.profiles?.email?.split('@')[0] || 'Anonymous'}
          </Text>
          <Text style={styles.commentDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments ({comments.length})</Text>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#94a3b8"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.postButton, posting && styles.postButtonDisabled]}
          onPress={handlePostComment}
          disabled={posting}
        >
          <Text style={styles.postButtonText}>
            {posting ? '...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Character count */}
      <Text style={styles.charCount}>{newComment.length}/500</Text>

      {/* Comments List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading comments...</Text>
      ) : comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to comment!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 44,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginBottom: 16,
  },
  commentsList: {
    marginTop: 8,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  commentDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  commentContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
