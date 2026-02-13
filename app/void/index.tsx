import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Dimensions,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useGlobalSettings } from '@/context/GlobalSettings';

const { width, height } = Dimensions.get('window');

const CONTRIBUTORS = [
  'GiserWong',
  'SunGiavin',
  'OpenSource',
  'Trae',
  'Gemini',
  'Expo',
  'React Native',
];

interface Particle {
  id: number;
  name: string;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  scale: number;
}

export default function VoidTerminal() {
  const router = useRouter();
  const { gravityScale, setGravityScale, wireframeMode, setWireframeMode } = useGlobalSettings();
  const [particles, setParticles] = useState<Particle[]>([]);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      true
    );
  }, []);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const spawnParticle = (x: number, y: number) => {
    const id = Date.now();
    const name = CONTRIBUTORS[Math.floor(Math.random() * CONTRIBUTORS.length)];
    
    // Add random drift and scale for more "beautiful" movement
    const driftX = (Math.random() - 0.5) * 60; // Random horizontal drift
    const driftY = -50 - Math.random() * 50;   // Always drift upwards
    const scale = 0.8 + Math.random() * 0.4;  // Random scale
    
    const newParticle = { id, name, x, y, driftX, driftY, scale };
    setParticles((prev) => [...prev.slice(-15), newParticle]); // Keep max 15 particles

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 2000);
  };

  const handleTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    spawnParticle(locationX, locationY);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.terminalText}>
          {'> 萬象之門已開啟'}
          <Animated.Text style={[styles.terminalText, animatedCursorStyle]}>_</Animated.Text>
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>[ 歸塵 ]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ 造物主律令 ]</Text>
        <View style={styles.controlRow}>
          <Text style={styles.label}>萬有引力 (GRAVITY): {gravityScale.toFixed(1)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={0.1}
            value={gravityScale}
            onValueChange={setGravityScale}
            minimumTrackTintColor="#00FF00"
            maximumTrackTintColor="#333"
            thumbTintColor="#00FF00"
          />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.label}>虛實之界 (WIREFRAME)</Text>
          <Switch
            value={wireframeMode}
            onValueChange={setWireframeMode}
            trackColor={{ false: '#333', true: '#00FF00' }}
            thumbColor={wireframeMode ? '#FFF' : '#666'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>[ 客體名冊 ]</Text>
        <Pressable onPress={handleTouch} style={styles.voidArea}>
          <Text style={styles.voidPlaceholder}>此處無物，唯有迴響 (點擊喚醒)</Text>
          {particles.map((p) => (
            <ParticleView key={p.id} particle={p} />
          ))}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>浮生錄 ． 虛空內核</Text>
        <Text style={styles.footerText}>一切終將歸於寂靜</Text>
      </View>
    </View>
  );
}

function ParticleView({ particle }: { particle: Particle }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(particle.scale * 0.8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1000, withTiming(0, { duration: 700 }))
    );
    translateX.value = withTiming(particle.driftX, { duration: 2000, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(particle.driftY, { duration: 2000, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(particle.scale, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: particle.x - 50, top: particle.y - 10 },
        animatedStyle,
      ]}
    >
      <Text style={styles.particleText}>{particle.name}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  terminalText: {
    color: '#00FF00',
    fontSize: 18,
    fontFamily: 'SpaceMono-Regular', // Use available mono font
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#00FF00',
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    color: '#00FF00',
    fontSize: 16,
    fontFamily: 'SpaceMono-Regular',
    marginBottom: 20,
    opacity: 0.8,
  },
  controlRow: {
    marginBottom: 20,
  },
  label: {
    color: '#00FF00',
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  voidArea: {
    height: 200,
    borderWidth: 1,
    borderColor: '#00FF0033',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  voidPlaceholder: {
    color: '#00FF0033',
    fontFamily: 'SpaceMono-Regular',
    fontSize: 12,
  },
  particle: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  particleText: {
    color: '#00FF00',
    fontFamily: 'SpaceMono-Regular',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  footerText: {
    color: '#00FF0033',
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular',
    marginBottom: 4,
  },
});
