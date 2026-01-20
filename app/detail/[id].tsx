import React, { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Platform, View as RNView, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Text, View } from '@/components/Themed';
import { useCelebrityData } from '@/hooks/useCelebrityData';
import { getAliveStatus, getDeadStatus, getSurvivalLabel, calculateDaysBetween, getLegacyQuote, calculateLifeProgress } from '@/utils/statusHelpers';
import { LivingClock } from '@/components/LivingClock';
import { LifeProgressBar } from '@/components/LifeProgressBar';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { data: celebrities, isLoading } = useCelebrityData();
  const celebrity = useMemo(() => celebrities.find(c => c.id === id), [celebrities, id]);
  
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [legacyQuote, setLegacyQuote] = useState<string | null>(null);

  const scale = useSharedValue(1);

  useEffect(() => {
    if (celebrity?.status === 'alive') {
      scale.value = withRepeat(
        withTiming(1.02, {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [celebrity?.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: 1,
  }));

  const triggerHeartbeat = useCallback(async () => {
    // Heartbeat pattern: thump-thump... pause
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);
  }, []);

  const handleLongPress = useCallback(() => {
    if (celebrity?.status === 'alive') {
      triggerHeartbeat();
      hapticIntervalRef.current = setInterval(triggerHeartbeat, 1000);
    }
  }, [celebrity?.status, triggerHeartbeat]);

  const handlePressOut = useCallback(() => {
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
  }, []);

  const handleReadLegacy = useCallback(() => {
    const quote = getLegacyQuote();
    setLegacyQuote(quote);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const isDead = celebrity?.status === 'dead';
  
  const statusPhrase = useMemo(() => {
    if (!celebrity) return '';
    return isDead ? getDeadStatus() : getAliveStatus();
  }, [isDead, celebrity]);

  const lifePercentage = useMemo(() => {
    if (!celebrity) return 0;
    return calculateLifeProgress(celebrity.birthDate, celebrity.deathDate);
  }, [celebrity]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <RNView style={styles.centerContent}>
          <Text style={styles.loadingText}>LOADING...</Text>
        </RNView>
      </SafeAreaView>
    );
  }

  if (!celebrity) {
    return (
      <SafeAreaView style={styles.container}>
        <RNView style={styles.centerContent}>
          <Text style={styles.notFoundText}>NOT FOUND</Text>
        </RNView>
      </SafeAreaView>
    );
  }

  const survivalLabel = getSurvivalLabel(celebrity.status, celebrity.birthDate, celebrity.deathDate);
  const daysLived = isDead && celebrity.deathDate ? calculateDaysBetween(celebrity.birthDate, celebrity.deathDate) : 0;

  const bgColor = isDead ? '#1a1a1a' : '#FFFFFF';
  const textColor = isDead ? '#888888' : '#000000';
  const dimColor = isDead ? '#555555' : '#666666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ 
        title: '', 
        headerTransparent: true,
        headerTintColor: textColor 
      }} />
      
      <Pressable 
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
        disabled={isDead}
      >
        <Animated.View style={animatedStyle}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <RNView style={styles.header}>
              <Text style={[
                styles.name, 
                { color: textColor, fontFamily: SERIF_FONT },
                isDead && styles.textLineThrough
              ]}>
                {celebrity.name.toUpperCase()}
              </Text>

              <RNView style={styles.progressContainer}>
                <LifeProgressBar percentage={lifePercentage} isDead={isDead} />
              </RNView>
              
              <RNView style={[
                styles.statusBadge, 
                { borderColor: isDead ? '#555' : '#00FF00' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: isDead ? '#555' : '#00FF00', fontFamily: SERIF_FONT }
                ]}>
                  {statusPhrase.toUpperCase()}
                </Text>
              </RNView>

              {!isDead ? (
                <LivingClock birthDate={celebrity.birthDate} color={textColor} />
              ) : (
                <RNView style={styles.summaryContainer}>
                  <Text style={[styles.survivalTime, { color: dimColor, fontFamily: SERIF_FONT }]}>
                    {survivalLabel.toUpperCase()}
                  </Text>
                  <RNView style={styles.finalStats}>
                    <Text style={[styles.statLine, { color: textColor, fontFamily: SERIF_FONT }]}>
                      TOTAL TIME ON EARTH: {daysLived.toLocaleString()} DAYS
                    </Text>
                    <Text style={[styles.statSubLine, { color: dimColor, fontFamily: SERIF_FONT }]}>
                      THAT'S ROUGHLY {daysLived.toLocaleString()} SUNRISES.
                    </Text>
                  </RNView>
                </RNView>
              )}
            </RNView>

            <RNView style={styles.infoSection}>
              <RNView style={[styles.infoRow, { borderBottomColor: isDead ? '#333' : '#eee' }]}>
                <Text style={[styles.label, { color: dimColor, fontFamily: SERIF_FONT }]}>OCCUPATION</Text>
                <Text style={[styles.value, { color: textColor, fontFamily: SERIF_FONT }]}>{celebrity.occupation.toUpperCase()}</Text>
              </RNView>

              <RNView style={[styles.infoRow, { borderBottomColor: isDead ? '#333' : '#eee' }]}>
                <Text style={[styles.label, { color: dimColor, fontFamily: SERIF_FONT }]}>BORN</Text>
                <Text style={[styles.value, { color: textColor, fontFamily: SERIF_FONT }]}>{celebrity.birthDate}</Text>
              </RNView>

              {isDead && (
                <RNView style={[styles.infoRow, { borderBottomColor: isDead ? '#333' : '#eee' }]}>
                  <Text style={[styles.label, { color: dimColor, fontFamily: SERIF_FONT }]}>DIED</Text>
                  <Text style={[styles.value, { color: textColor, fontFamily: SERIF_FONT }]}>{celebrity.deathDate}</Text>
                </RNView>
              )}
            </RNView>

            <RNView style={styles.bioSection}>
              <Text style={[styles.label, { color: dimColor, fontFamily: SERIF_FONT }]}>BIO</Text>
              <Text style={[styles.bioText, { color: textColor, fontFamily: SERIF_FONT }]}>{celebrity.description}</Text>
            </RNView>

            {isDead && (
              <RNView style={styles.legacySection}>
                {legacyQuote && (
                  <Text style={[styles.quoteText, { color: textColor, fontFamily: SERIF_FONT }]}>
                    "{legacyQuote}"
                  </Text>
                )}
                <Pressable 
                  onPress={handleReadLegacy}
                  style={({ pressed }) => [
                    styles.legacyButton,
                    { borderColor: textColor, opacity: pressed ? 0.6 : 1 }
                  ]}
                >
                  <Text style={[styles.legacyButtonText, { color: textColor, fontFamily: SERIF_FONT }]}>
                    READ LEGACY
                  </Text>
                </Pressable>
              </RNView>
            )}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  name: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 56,
  },
  progressContainer: {
    width: '60%',
    marginTop: 12,
  },
  textLineThrough: {
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 3,
  },
  statusText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
  },
  survivalTime: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryContainer: {
    alignItems: 'center',
  },
  finalStats: {
    marginTop: 24,
    alignItems: 'center',
  },
  statLine: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  statSubLine: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  bioSection: {
  },
  bioText: {
    fontSize: 18,
    lineHeight: 28,
    marginTop: 12,
    opacity: 0.9,
    fontStyle: 'italic',
  },
  legacySection: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  legacyButton: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 2,
  },
  legacyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  centerContent: {
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
  notFoundText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#999',
  },
});
