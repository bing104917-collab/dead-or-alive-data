import React, { useState, useMemo } from 'react';
import { StyleSheet, TextInput, FlatList, SafeAreaView, View as RNView, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { CelebrityCard } from '@/components/CelebrityCard';
import { MirrorView } from '@/components/MirrorView';
import { useCelebrityData } from '@/hooks/useCelebrityData';

import { Ionicons } from '@expo/vector-icons';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const { data: celebrities, isLoading } = useCelebrityData();
  const router = useRouter();

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
      c.occupation.toLowerCase().includes(query)
    );
  }, [search, celebrities]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        title: '眾 生',
        headerTitleStyle: { 
          fontFamily: SERIF_FONT,
          fontSize: 20,
          color: '#121212',
        },
        headerStyle: {
          backgroundColor: '#F5F5F0',
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#121212" />
          </TouchableOpacity>
        ),
      }} />
      
      <RNView style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="尋覓名字中的迴響..."
          placeholderTextColor="rgba(18, 18, 18, 0.3)"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </RNView>

      {isLoading && !celebrities.length ? (
        <RNView style={styles.loadingState}>
          <Text style={styles.loadingText}>靜候時間的低語...</Text>
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
              <Text style={styles.emptyText}>無人應答，唯有空谷迴響</Text>
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
    backgroundColor: '#F5F5F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  searchInput: {
    fontSize: 24,
    fontWeight: '300',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(18, 18, 18, 0.1)',
    paddingVertical: 12,
    letterSpacing: 1,
    fontFamily: SERIF_FONT,
    color: '#121212',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.4,
    fontFamily: SERIF_FONT,
    letterSpacing: 1,
    color: '#121212',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F0',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: SERIF_FONT,
    letterSpacing: 2,
    color: '#121212',
    opacity: 0.6,
  },
});
