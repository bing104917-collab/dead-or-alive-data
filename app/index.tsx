import React, { useState, useMemo } from 'react';
import { StyleSheet, TextInput, FlatList, SafeAreaView, View as RNView, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { CelebrityCard } from '@/components/CelebrityCard';
import { MirrorView } from '@/components/MirrorView';
import { useCelebrityData } from '@/hooks/useCelebrityData';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const { data: celebrities, isLoading } = useCelebrityData();

  const isMirrorTriggered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return query === 'me' || query === 'myself';
  }, [search]);

  const filteredCelebrities = useMemo(() => {
    if (!search.trim()) {
      return [...celebrities].sort(() => 0.5 - Math.random());
    }
    const query = search.toLowerCase();
    return celebrities.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.description.toLowerCase().includes(query)
    );
  }, [search, celebrities]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <RNView style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH NAME..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoFocus
          autoCapitalize="characters"
        />
      </RNView>

      {isLoading && !celebrities.length ? (
        <RNView style={styles.loadingState}>
          <Text style={styles.loadingText}>LOADING...</Text>
        </RNView>
      ) : isMirrorTriggered ? (
        <MirrorView />
      ) : (
        <FlatList
          data={filteredCelebrities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CelebrityCard celebrity={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <RNView style={styles.emptyState}>
              <Text style={styles.emptyText}>NO RESULTS FOUND</Text>
            </RNView>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  searchInput: {
    fontSize: 36,
    fontWeight: '900',
    borderBottomWidth: 6,
    borderBottomColor: '#000000',
    paddingVertical: 12,
    letterSpacing: -1.5,
    fontFamily: SERIF_FONT,
    color: '#000000',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    opacity: 0.3,
    fontFamily: SERIF_FONT,
    letterSpacing: 2,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#000',
  },
});
