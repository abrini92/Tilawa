import React, { useState, useMemo } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Surah {
  number: number;
  name: string;
  arabicName: string;
  verses: number;
}

interface SearchBarProps {
  surahs: Surah[];
  onSelect: (surah: Surah) => void;
  placeholder?: string;
}

export default function SearchBar({ surahs, onSelect, placeholder = 'Search Surah...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Fuzzy search implementation
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    
    return surahs.filter(surah => 
      surah.name.toLowerCase().includes(lowerQuery) ||
      surah.arabicName.includes(query) ||
      surah.number.toString() === query
    ).slice(0, 10); // Limit to 10 results
  }, [query, surahs]);

  const handleSelect = (surah: Surah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
    setIsFocused(false);
    onSelect(surah);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFocused && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.resultNumber}>
                  <Text style={styles.resultNumberText}>{item.number}</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultArabic}>{item.arabicName}</Text>
                </View>
                <Text style={styles.resultVerses}>{item.verses} verses</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchBoxFocused: {
    borderColor: '#10b981',
    backgroundColor: '#fff',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#94a3b8',
  },
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1000,
  },
  resultsList: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  resultNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  resultArabic: {
    fontSize: 13,
    color: '#64748b',
  },
  resultVerses: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
