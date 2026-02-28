import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Platform, View as RNView, Pressable, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Themed';
import { useCelebrityData } from '@/hooks/useCelebrityData';
import { getAliveStatus, getDeadStatus, getLegacyQuote } from '@/utils/statusHelpers';
import { Ionicons } from '@expo/vector-icons';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: celebrities, isLoading } = useCelebrityData();
  const celebrity = useMemo(() => celebrities.find(c => c.id === id), [celebrities, id]);
  
  const [legacyQuote, setLegacyQuote] = useState<string | null>(null);

  const handleReadLegacy = useCallback(() => {
    const quote = getLegacyQuote();
    setLegacyQuote(quote);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const isDead = celebrity?.status === 'dead';
  
  const statusPhrase = useMemo(() => {
    if (!celebrity) return '';
    return isDead ? getDeadStatus() : getAliveStatus();
  }, [isDead, celebrity]);

  const timeline = useMemo(() => {
    if (!celebrity) return '';
    const birthYear = new Date(celebrity.birthDate).getFullYear();
    if (isDead && celebrity.deathDate) {
      const deathYear = new Date(celebrity.deathDate).getFullYear();
      return `${birthYear} — ${deathYear}`;
    }
    return `${birthYear} — Present`;
  }, [celebrity, isDead]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <RNView style={styles.centerContent}>
          <Text style={styles.loadingText}>靜候時間的低語...</Text>
        </RNView>
      </SafeAreaView>
    );
  }

  if (!celebrity) {
    return (
      <SafeAreaView style={styles.container}>
        <RNView style={styles.centerContent}>
          <Text style={styles.notFoundText}>此人已消逝在時光中</Text>
        </RNView>
      </SafeAreaView>
    );
  }

  const textColor = isDead ? '#A0A09A' : '#121212';
  const dimColor = 'rgba(18, 18, 18, 0.4)';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '', 
        headerTransparent: true,
        headerTintColor: '#121212' 
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <RNView style={styles.header}>
          {/* Image Placeholder or Image */}
          <RNView style={styles.imageContainer}>
            {celebrity.image ? (
              <Image source={{ uri: celebrity.image }} style={styles.profileImage} />
            ) : (
              <RNView style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {celebrity.name.charAt(0).toUpperCase()}
                </Text>
              </RNView>
            )}
          </RNView>

          {/* Status Icon */}
          <RNView style={styles.statusIconContainer}>
            {isDead ? (
              <Ionicons name="leaf-outline" size={20} color="#A0A09A" />
            ) : (
              <Ionicons name="flame-outline" size={20} color="#121212" />
            )}
          </RNView>

          <Text style={[
            styles.name, 
            { color: textColor, fontFamily: SERIF_FONT }
          ]}>
            {celebrity.name}
          </Text>

          <Text style={[styles.timeline, { color: dimColor, fontFamily: SERIF_FONT }]}>
            {timeline}
          </Text>

          <Text style={[
            styles.statusLabel, 
            { color: isDead ? '#A0A09A' : '#121212', fontFamily: SERIF_FONT }
          ]}>
            {statusPhrase}
          </Text>
        </RNView>

        <RNView style={styles.contentSection}>
          <Text style={[styles.bioText, { color: '#121212', fontFamily: SERIF_FONT }]}>
            {celebrity.occupation}
          </Text>
          
          <RNView style={styles.divider} />
          
          <Text style={[styles.description, { color: 'rgba(18, 18, 18, 0.7)', fontFamily: SERIF_FONT }]}>
            每一段生命都是時間長河中的一朵浪花，在這裡，我們銘記曾經或正在閃爍的光芒。
          </Text>
        </RNView>

        <RNView style={styles.legacySection}>
          {legacyQuote ? (
            <RNView style={styles.quoteContainer}>
              <Text style={[styles.quoteText, { color: '#121212', fontFamily: SERIF_FONT }]}>
                「{legacyQuote}」
              </Text>
            </RNView>
          ) : (
            <Pressable 
              onPress={handleReadLegacy}
              style={({ pressed }) => [
                styles.legacyLink,
                { opacity: pressed ? 0.6 : 1 }
              ]}
            >
              <Text style={[styles.legacyLinkText, { fontFamily: SERIF_FONT }]}>
                探尋生命留下的迴響 →
              </Text>
            </Pressable>
          )}
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  scrollContent: {
    padding: 32,
    paddingTop: 100,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
  },
  imageContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(18, 18, 18, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.05)',
  },
  placeholderText: {
    fontSize: 40,
    fontFamily: SERIF_FONT,
    color: 'rgba(18, 18, 18, 0.2)',
  },
  statusIconContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 36,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 12,
  },
  timeline: {
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    letterSpacing: 4,
    opacity: 0.8,
  },
  contentSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 60,
  },
  bioText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.1)',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  legacySection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 40,
  },
  quoteContainer: {
    paddingHorizontal: 24,
  },
  quoteText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  legacyLink: {
    paddingVertical: 12,
  },
  legacyLinkText: {
    fontSize: 15,
    color: '#121212',
    letterSpacing: 1,
    opacity: 0.6,
  },
  centerContent: {
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
  notFoundText: {
    fontSize: 18,
    fontFamily: SERIF_FONT,
    letterSpacing: 1,
    color: 'rgba(18, 18, 18, 0.4)',
  },
});
