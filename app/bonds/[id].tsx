import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity, View as RNView, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface Bond {
  id: string;
  name: string;
  status: '此岸' | '彼岸' | '失聯';
  date: string;
  description: string;
  imageUri?: string;
}

const STORAGE_KEY = 'ikide_bonds_v2';

export default function BondDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [bond, setBond] = useState<Bond | null>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    loadBond();
  }, [id]);

  const loadBond = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const bonds: Bond[] = JSON.parse(stored);
        const found = bonds.find(b => b.id === id);
        if (found) setBond(found);
      }
    } catch (e) {
      console.error('Failed to load bond');
    }
  };

  const isAlive = bond?.status === '此岸';

  useEffect(() => {
    if (isAlive) {
      scale.value = withRepeat(
        withTiming(1.02, { duration: 2000 }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 500 });
    }
  }, [isAlive]);

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const pulsatingBadgeStyle = useSharedValue(1);
  useEffect(() => {
    if (isAlive) {
      pulsatingBadgeStyle.value = withRepeat(
        withTiming(0.4, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [isAlive]);

  const animatedBadgeStyle = useAnimatedStyle(() => {
    return {
      opacity: pulsatingBadgeStyle.value,
    };
  });

  if (!bond) return null;

  return (
    <SafeAreaView style={[styles.container, !isAlive && styles.containerDead]}>
      <Stack.Screen options={{ 
        headerShown: false,
        animation: 'fade'
      }} />

      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={isAlive ? "#121212" : "#888"} />
        </TouchableOpacity>
      </RNView>

      <ScrollView contentContainerStyle={styles.content}>
        <RNView style={styles.imageSection}>
          <Animated.View style={[styles.imageContainer, animatedImageStyle, !isAlive && styles.imageContainerDead]}>
            {bond.imageUri ? (
              <Image 
                source={{ uri: bond.imageUri }} 
                style={[styles.image, !isAlive && styles.imageDead]} 
                contentFit="cover"
              />
            ) : (
              <RNView style={styles.placeholder}>
                <Ionicons name="image-outline" size={48} color={isAlive ? "#CCC" : "#666"} />
              </RNView>
            )}
          </Animated.View>
          {isAlive && (
            <Animated.View style={[styles.aliveBadge, animatedBadgeStyle]} />
          )}
        </RNView>

        <RNView style={styles.infoSection}>
          <Text style={[styles.name, !isAlive && styles.nameDead]}>{bond.name}</Text>
          <Text style={[styles.status, !isAlive && styles.statusDead]}>{bond.status}</Text>
          <Text style={[styles.date, !isAlive && styles.dateDead]}>{bond.date || '未知時光'}</Text>
          
          <RNView style={styles.divider} />
          
          <Text style={[styles.description, !isAlive && styles.descriptionDead]}>
            {bond.description || '這段關係尚未留下隻言片語。'}
          </Text>
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
  containerDead: {
    backgroundColor: '#EBEBE6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  imageSection: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  imageContainerDead: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#D0D0CA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDead: {
    tintColor: 'gray', // For expo-image grayscale effect
    opacity: 0.8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  aliveBadge: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  infoSection: {
    marginTop: 50,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  name: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 8,
    color: '#121212',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 10,
  },
  nameDead: {
    color: '#888',
  },
  status: {
    fontSize: 12,
    letterSpacing: 4,
    color: '#999990',
    marginBottom: 20,
  },
  statusDead: {
    color: '#AAA',
  },
  date: {
    fontSize: 14,
    color: '#CCC',
    letterSpacing: 2,
    marginBottom: 30,
  },
  dateDead: {
    color: '#BBB',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#D0D0CA',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
  },
  descriptionDead: {
    color: '#999',
  },
});
