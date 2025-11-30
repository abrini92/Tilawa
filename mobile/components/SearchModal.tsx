import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSurahStore, type Surah } from '../lib/surahStore';
import * as Haptics from 'expo-haptics';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (surah: Surah) => void;
}

export function SearchModal({ visible, onClose, onSelect }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { searchQuery, searchResults, setSearchQuery } = useSurahStore();

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  const handleSelect = (surah: Surah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(surah);
    setQuery('');
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <BlurView intensity={80} style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#718096" />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, number, or Arabic..."
                placeholderTextColor="#A0AEC0"
                autoFocus={true}
                clearButtonMode="while-editing"
              />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                <View style={styles.numberCircle}>
                  <Text style={styles.number}>{item.number}</Text>
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>{item.name.transliteration}</Text>
                  <Text style={styles.resultArabic}>{item.name.arabic}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#CBD5E0" />
                  <Text style={styles.emptyText}>No surahs found</Text>
                  <Text style={styles.emptyHint}>
                    Try searching by name, number, or use filters like "short", "meccan"
                  </Text>
                </View>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  closeButton: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  numberCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B5E3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  resultArabic: {
    fontSize: 14,
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
});
