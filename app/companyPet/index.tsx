import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as RNImage, Platform, Pressable, SafeAreaView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Themed';
import { useGlobalSettings } from '@/context/GlobalSettings';
import { useWaterDropMemory } from '@/hooks/useWaterDropMemory';
import FishSkin from './fishskin';

type StreamMode = 'none' | 'medium' | 'heavy';

type DropletData = {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  size: number;
  duration: number;
  rotation: number;
};

const COUNTER_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

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

const BAMBOO_IMG = require('@/assets/companyPet/bamboo.png');
const ROCK_IMG = require('@/assets/companyPet/rock.png');
const DROPLET_IMG = require('@/assets/companyPet/droplet.png');

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedNativeImage = Animated.createAnimatedComponent(RNImage);

const WaterStreamSvg = React.memo(
  ({
    mode,
    startX,
    startY,
    endX,
    endY,
  }: {
    mode: StreamMode;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }) => {
    const dashOffset1 = useSharedValue(0);
    const dashOffset2 = useSharedValue(0);
    const dashOffset3 = useSharedValue(0);
    const pulse = useSharedValue(0);
    const turbulence = useSharedValue(0);

    const dx = endX - startX;
    const dy = endY - startY;

    useEffect(() => {
      cancelAnimation(dashOffset1);
      cancelAnimation(dashOffset2);
      cancelAnimation(dashOffset3);
      cancelAnimation(pulse);
      cancelAnimation(turbulence);
      dashOffset1.value = 0;
      dashOffset2.value = 0;
      dashOffset3.value = 0;
      pulse.value = 0;
      turbulence.value = 0;

      if (mode !== 'none') {
        dashOffset1.value = withRepeat(withTiming(-220, { duration: 550, easing: Easing.linear }), -1, false);
        dashOffset2.value = withRepeat(withTiming(-280, { duration: 750, easing: Easing.linear }), -1, false);
        dashOffset3.value = withRepeat(withTiming(-180, { duration: 450, easing: Easing.linear }), -1, false);
        turbulence.value = withRepeat(withTiming(1, { duration: 280, easing: Easing.inOut(Easing.sin) }), -1, true);
        pulse.value = withRepeat(withTiming(1, { duration: 380, easing: Easing.inOut(Easing.sin) }), -1, true);
      }
    }, [mode]);

    const getPath = (offset: number = 0, curve: number = 0.5) => {
      const midX = startX + dx * curve + offset;
      const midY = startY + dy * 0.5;
      return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
    };

    const mainProps = useAnimatedProps(() => ({
      d: getPath(turbulence.value * 3, 0.45),
      strokeWidth: (mode === 'heavy' ? 18 : 10) + pulse.value * 2,
    }));

    const innerProps = useAnimatedProps(() => ({
      d: getPath(-turbulence.value * 2, 0.55),
      strokeWidth: (mode === 'heavy' ? 8 : 4) + pulse.value,
      strokeDashoffset: dashOffset1.value,
    }));

    const highlightProps = useAnimatedProps(() => ({
      d: getPath(turbulence.value * 4, 0.5),
      strokeDashoffset: dashOffset2.value,
    }));

    const rapidProps = useAnimatedProps(() => ({
      d: getPath(-turbulence.value * 3, 0.48),
      strokeDashoffset: dashOffset3.value,
    }));

    if (mode === 'none') return null;

    return (
      <>
        {/* Layer 1: Volumetric Base - Clear/White/Light Blue Mix */}
        <AnimatedPath
          animatedProps={mainProps}
          stroke="rgba(200, 230, 255, 0.25)"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Layer 2: Main Cohesive Stream - Braided look */}
        <AnimatedPath
          animatedProps={innerProps}
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth={mode === 'heavy' ? 4 : 2.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="80 15"
        />

        {/* Layer 3: Intertwined Flow - Semi-transparent blue */}
        <AnimatedPath
          animatedProps={highlightProps}
          stroke="rgba(127, 194, 255, 0.45)"
          strokeWidth={mode === 'heavy' ? 10 : 6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="50 30"
        />

        {/* Layer 4: Glistening Highlights - Rapid white streaks */}
        <AnimatedPath
          animatedProps={rapidProps}
          stroke="#ffffff"
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="10 120"
          opacity={0.9}
        />

        {/* Layer 5: Occasional "Light catching" beads */}
        <AnimatedPath
          animatedProps={innerProps}
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="2 200"
          opacity={0.8}
        />

        {/* Impact Splash - SVG circles at endX, endY */}
        {mode === 'heavy' && (
           <Animated.Circle
             cx={endX + (turbulence.value - 0.5) * 15}
             cy={endY - 5}
             r={8 + pulse.value * 4}
             fill="rgba(255, 255, 255, 0.4)"
           />
        )}
      </>
    );
  }
);

const Droplet = React.memo(({ data, onComplete }: { data: DropletData; onComplete: (id: number) => void }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: data.duration, easing: Easing.linear }, // use linear to manually interpolate easing per phase
      (finished) => {
        if (finished) {
          runOnJS(onComplete)(data.id);
        }
      }
    );
  }, [data.duration, data.id, onComplete, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Phase 1: Slide along bamboo (0 to 0.3)
    // Phase 2: Free fall (0.3 to 1.0)
    const phase1End = 0.35;
    let x, y, scale, opacity;

    if (progress.value < phase1End) {
      const p = progress.value / phase1End;
      // Linear slide along bamboo
      x = data.startX + (data.midX - data.startX) * p;
      y = data.startY + (data.midY - data.startY) * p;
      scale = 0.6 + 0.4 * p; // grows as it gathers at the edge
      opacity = 0.8 + 0.2 * p;
    } else {
      const p = (progress.value - phase1End) / (1 - phase1End);
      const easedP = Easing.in(Easing.quad)(p);
      // Parabolic fall
      x = data.midX + (data.endX - data.midX) * easedP;
      y = data.midY + (data.endY - data.midY) * easedP;
      scale = 1.0 - 0.15 * easedP;
      opacity = 1.0 - 0.2 * easedP;
    }

    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotateZ: `${data.rotation}deg` },
        { scale: scale },
      ],
    };
  });

  return (
    <AnimatedNativeImage
      source={DROPLET_IMG}
      resizeMode="contain"
      style={[
        styles.droplet,
        { width: data.size, height: data.size },
        animatedStyle,
      ]}
    />
  );
});

export default function CompanyPet() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { petSkinMode } = useGlobalSettings();
  const { recordClick } = useWaterDropMemory();
  const [count, setCount] = useState(0);
  const [droplets, setDroplets] = useState<DropletData[]>([]);
  const [streamMode, setStreamMode] = useState<StreamMode>('none');

  if (petSkinMode) {
    return <FishSkin />;
  }

  const idRef = useRef(1);
  const tapTimesRef = useRef<number[]>([]);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = useMemo(() => {
    const tubeLength = Math.min(width * 0.7, 320);
    const tubeWidth = Math.min(width * 0.7, 320);
    const angleDeg = 12;
    const angleRad = (angleDeg * Math.PI) / 180;
    const tubeOriginX = width * 0.32;
    const tubeOriginY = height * 0.32;
    const tubeCenterX = tubeOriginX + tubeLength / 2;
    const tubeCenterY = tubeOriginY;

    // Red arrow points to inner surface (further back)
    const innerInset = Math.max(20, tubeWidth * 0.45);
    const innerX = tubeCenterX + (tubeLength / 2 - innerInset) * Math.cos(angleRad);
    const innerY = tubeCenterY + (tubeLength / 2 - innerInset) * Math.sin(angleRad);

    // Spout (where it leaves the bamboo) - Adjusted to the central bottom of the U-cut
    const spoutInset = 65; // Middle of the cut-out length
    const diameterOffset = 42; // Offset to reach the bottom edge of the bamboo tube
    const spoutX = tubeCenterX + (tubeLength / 2 - spoutInset) * Math.cos(angleRad) - diameterOffset * Math.sin(angleRad);
    const spoutY = tubeCenterY + (tubeLength / 2 - spoutInset) * Math.sin(angleRad) + diameterOffset * Math.cos(angleRad);

    const rockWidth = Math.min(width * 0.70, 520);
    const rockHeight = Math.max(180, rockWidth * 0.60);
    const rockX = width / 2 - rockWidth / 2;
    const rockBaseY = height * 0.62;
    const rockImgTop = rockBaseY - rockHeight * 0.12;
    const rockImgHeight = rockHeight * 1.05;
    const rockImpactY = rockImgTop + rockImgHeight * 0.30;

    return {
      tubeLength,
      tubeWidth,
      angleDeg,
      tubeOriginX,
      tubeOriginY,
      tubeCenterX,
      tubeCenterY,
      innerX,
      innerY,
      spoutX,
      spoutY,
      rockWidth,
      rockHeight,
      rockX,
      rockImgTop,
      rockImgHeight,
      rockImpactY,
      rockCenterX: rockX + rockWidth / 2,
    };
  }, [height, width]);

  const spawnDroplet = useCallback(() => {
    const size = 18 + Math.random() * 10;
    const endX = layout.rockCenterX + (Math.random() - 0.5) * layout.rockWidth * 0.18 - size / 2;
    const endY = layout.rockImpactY - size * 0.3;
    const data: DropletData = {
      id: idRef.current++,
      startX: layout.innerX - size / 2,
      startY: layout.innerY - size * 0.2,
      midX: layout.spoutX - size / 2,
      midY: layout.spoutY - size * 0.2,
      endX,
      endY,
      size,
      duration: 550 + Math.random() * 250, // total duration
      rotation: (Math.random() - 0.5) * 10,
    };
    setDroplets((prev) => [...prev, data]);
  }, [layout.innerX, layout.innerY, layout.rockCenterX, layout.rockImpactY, layout.rockWidth, layout.spoutX, layout.spoutY]);

  const handleDropletComplete = useCallback((id: number) => {
    setDroplets((prev) => prev.filter((drop) => drop.id !== id));
  }, []);

  const handleTap = useCallback(() => {
    recordClick();
    const now = Date.now();
    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t < 900);
    tapTimesRef.current.push(now);
    const taps = tapTimesRef.current.length;
    const mode: StreamMode = taps >= 7 ? 'heavy' : taps >= 3 ? 'medium' : 'none';

    setStreamMode(mode);
    if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    streamTimeoutRef.current = setTimeout(() => setStreamMode('none'), 700);

    setCount((prev) => prev + 1);
    if (mode === 'none') {
      spawnDroplet();
    }
  }, [spawnDroplet]);

  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <Pressable style={styles.tapArea} onPress={handleTap}>
        <View style={styles.hud} pointerEvents="box-none">
          <View style={styles.hudLeft}>
            <Pressable style={styles.fortuneBtn} onPress={() => router.push('/companyPet/fortune')}>
              <Text style={styles.fortuneBtnText}>每日签运</Text>
            </Pressable>
          </View>
          <View style={styles.hudCenter} pointerEvents="none">
            <Text style={styles.title}>CYBER Pet</Text>
            <Text style={styles.counterLabel}>Water Drops</Text>
            <Text style={styles.counter}>{count.toLocaleString()}</Text>
            <Text style={styles.hint}>Tap anywhere to let a drop fall</Text>
          </View>
          <View style={styles.hudRight}>
            <Pressable style={styles.fortuneBtn} onPress={() => router.push('/companyPet/memory')}>
              <Text style={styles.fortuneBtnText}>水滴记忆</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stage} pointerEvents="none">
          <ExpoImage
            source={BAMBOO_IMG}
            contentFit="contain"
            style={[
              styles.bamboo,
              {
                width: layout.tubeLength,
                height: layout.tubeWidth,
                left: layout.tubeOriginX,
                top: layout.tubeOriginY - layout.tubeWidth / 2,
                transform: [{ rotate: `${layout.angleDeg}deg` }],
              },
            ]}
          />

          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <WaterStreamSvg
              mode={streamMode}
              startX={layout.spoutX}
              startY={layout.spoutY + 6}
              endX={layout.rockCenterX - layout.rockWidth * 0.02}
              endY={layout.rockImpactY}
            />
          </Svg>

          <ExpoImage
            source={ROCK_IMG}
            contentFit="contain"
            style={[
              styles.rock,
              {
                width: layout.rockWidth,
                height: layout.rockImgHeight,
                left: layout.rockX,
                top: layout.rockImgTop,
              },
            ]}
          />

          {droplets.map((drop) => (
            <Droplet key={drop.id} data={drop} onComplete={handleDropletComplete} />
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
    zIndex: 2,
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
  },// offset the larger fortune button to keep title centered
  fortuneBtn: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  fortuneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: MONO_FONT,
    color: '#222',
  },
  title: {
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: TITLE_FONT,
    color: '#1b1b1b',
  },
  counterLabel: {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#626262',
  },
  counter: {
    marginTop: 4,
    fontSize: 36,
    letterSpacing: 2,
    fontFamily: COUNTER_FONT,
    color: '#111111',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: '#8c8c8c',
  },
  stage: {
    flex: 1,
    zIndex: 1,
  },
  bamboo: {
    position: 'absolute',
  },
  rock: {
    position: 'absolute',
  },
  droplet: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
