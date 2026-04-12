import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as RNImage, Platform, Pressable, SafeAreaView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Themed';
import { useWaterDropMemory } from '@/hooks/useWaterDropMemory';

type BubbleData = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  duration: number;
};

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

const TITLE_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

const GOLDFISH_IMG = require('@/assets/companyPet/goldfish.png');
// NOTE: Ensure you have placed your fishbowl image at assets/companyPet/fishtank.png
const TANK_IMG = require('@/assets/companyPet/fishtank.png');

const Bubble = React.memo(({ data, onComplete }: { data: BubbleData; onComplete: (id: number) => void }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: data.duration, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(onComplete)(data.id);
        }
      }
    );
  }, [data.duration, data.id, onComplete, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const x = data.startX + (data.endX - data.startX) * progress.value;
    const y = data.startY + (data.endY - data.startY) * progress.value;
    const scale = 0.5 + 2.5 * progress.value; 
    const opacity = 0.9 * (1 - progress.value); 

    return {
      opacity,
      left: x,
      top: y,
      transform: [
        { scale: scale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.bubbleContainer, animatedStyle]}>
        <View style={[styles.bubble, { width: data.size, height: data.size }]} />
    </Animated.View>
  );
});

export default function FishSkin() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { recordClick } = useWaterDropMemory();
  const [count, setCount] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const idRef = useRef(1);

  // Responsive Tank layout
  const isWeb = Platform.OS === 'web';
  // If the window is very wide (Web), we cap the size based on height to prevent goldfish disappearing
  // We want it "Giant", so it should take up a significant portion of the screen
  const tankSize = Math.min(width * 1.4, height * 1.2); 
  const tankLeft = (width - tankSize) / 2;
  
  // Positioning the tank so its top is visible but it's large and grounded
  // We use a combination of screen height and tank size to keep it responsive
  // Reducing the top significantly to move the tank closer to the text
  // We use a smaller value because the image itself has white space
  const tankTop = height * 0.01; 
  
  // Water surface in the bowl image (where bubbles should stop)
  const waterSurfaceY = tankTop + tankSize * 0.42; 

  const spawnBubble = useCallback(() => {
    const size = 18 + Math.random() * 12; // Bigger bubbles
    // Spawn exactly where the goldfish is (mouth area)
    // The fish image has some space, we adjust to the left-side of the fish center
    const startX = width / 2 - (tankSize * 0.05) + (Math.random() - 0.5) * 20;
    const startY = tankTop + tankSize * 0.51; // Shifted down by ~1cm from 0.48
    const endX = startX + (Math.random() - 0.5) * (tankSize * 0.15);
    const endY = waterSurfaceY; 
    
    const data: BubbleData = {
      id: idRef.current++,
      startX,
      startY,
      endX,
      endY,
      size,
      duration: 1500 + Math.random() * 800, // Faster rise
    };
    setBubbles((prev) => [...prev, data]);
  }, [width, tankTop, tankSize, waterSurfaceY]);

  const handleBubbleComplete = useCallback((id: number) => {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleTap = useCallback(() => {
    recordClick();
    setCount((prev) => prev + 1);
    spawnBubble();
  }, [spawnBubble, recordClick]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <Pressable style={styles.tapArea} onPress={handleTap}>
        <View style={styles.hud} pointerEvents="box-none">
          <View style={styles.hudLeft}>
            <Pressable style={styles.fortuneBtn} onPress={() => router.push('/companyPet/fortune')}>
              <Text style={styles.fortuneBtnText}>Fortune</Text>
            </Pressable>
          </View>
          <View style={styles.hudCenter} pointerEvents="none">
            <Text style={styles.title}>GIANT BOWL</Text>
            <Text style={styles.counterLabel}>Water Bubbles</Text>
            <Text style={styles.counter}>{count.toLocaleString()}</Text>
            <Text style={styles.hint}>Tap anywhere to blow a bubble</Text>
          </View>
          <View style={styles.hudRight}>
            <Pressable style={styles.fortuneBtn} onPress={() => router.push('/companyPet/memory')}>
              <Text style={styles.fortuneBtnText}>Memory</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stage} pointerEvents="none">
          {/* Fish Bowl Image Background */}
          <ExpoImage
            source={TANK_IMG}
            contentFit="contain"
            style={[
              styles.tankImage,
              {
                width: tankSize,
                height: tankSize,
                left: tankLeft,
                top: tankTop,
              },
            ]}
          />

          {/* Goldfish significantly moved DOWN slightly into the water (~1cm) */}
          <ExpoImage
            source={GOLDFISH_IMG}
            contentFit="contain"
            style={[
              styles.goldfish,
              {
                width: Math.min(tankSize * 0.22, 180),
                height: Math.min(tankSize * 0.22, 180),
                left: width / 2 - Math.min(tankSize * 0.11, 90),
                top: tankTop + tankSize * 0.50, // Shifted down from 0.45
              },
            ]}
          />

          {bubbles.map((bubble) => (
            <Bubble key={bubble.id} data={bubble} onComplete={handleBubbleComplete} />
          ))}
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tapArea: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  hudLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  hudRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
  },
  fortuneBtn: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  fortuneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: MONO_FONT,
    color: '#333',
  },
  title: {
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: TITLE_FONT,
    color: '#006064',
  },
  counterLabel: {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#00838f',
  },
  counter: {
    marginTop: 4,
    fontSize: 36,
    letterSpacing: 2,
    fontFamily: MONO_FONT,
    color: '#006064',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: '#00acc1',
  },
  stage: {
    flex: 1,
    zIndex: 1,
    backgroundColor: '#fff',
  },
  tankImage: {
    position: 'absolute',
    zIndex: 1,
  },
  goldfish: {
    position: 'absolute',
    zIndex: 2,
  },
  bubbleContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10, // Higher than everything
  },
  bubble: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#004d40', // Deep dark green/blue for high contrast
    backgroundColor: 'rgba(224, 247, 250, 0.9)', // Very bright cyan-white
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 8,
  },
});

