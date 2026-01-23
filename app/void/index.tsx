import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Dimensions,
  Platform,
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
  runOnJS,
  cancelAnimation,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useGlobalSettings } from '@/context/GlobalSettings';

const { width, height } = Dimensions.get('window');

// Matrix characters: Binary, Katakana, and English
const CHARS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';

const CONTRIBUTORS = [
  'GiserWong',
  'SunGiavin',
  'OpenSource',
  'Expo',
  'React Native',
];

const COLUMN_COUNT = 15;
const COLUMN_WIDTH = width / COLUMN_COUNT;

/**
 * A single falling column of the Digital Rain
 */
function RainColumn({ index }: { index: number }) {
  const { gravityScale } = useGlobalSettings();
  const translateY = useSharedValue(-height);
  const opacity = useSharedValue(0.8);
  
  // Randomize characteristics for each column
  const columnData = useMemo(() => {
    const charCount = Math.floor(Math.random() * 20) + 10;
    
    const chars = Array.from({ length: charCount })
      .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
      .join('\n');
      
    const duration = 2000 + Math.random() * 5000;
    const delay = Math.random() * 3000;
    const fontSize = 10 + Math.random() * 8;
    return { chars, duration, delay, fontSize };
  }, []);

  useEffect(() => {
    // Cancel previous animation to prevent overlap
    cancelAnimation(translateY);
    
    // Speed is affected by gravityScale
    const adjustedDuration = columnData.duration / (0.5 + gravityScale * 0.5);
    
    // Calculate progress to resume from current position
    // Since we use withRepeat, we need to handle the loop correctly
    translateY.value = withRepeat(
      withTiming(height, {
        duration: adjustedDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [gravityScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(
      translateY.value,
      [-height, height * 0.1, height * 0.8, height],
      [0, 1, 0.8, 0]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.column,
        { left: index * COLUMN_WIDTH, width: COLUMN_WIDTH },
        animatedStyle,
      ]}
    >
      <Text style={[styles.rainText, { fontSize: columnData.fontSize }]}>
        {columnData.chars}
      </Text>
    </Animated.View>
  );
}

function Particle({ angle, x, y }: { angle: number; x: number; y: number }) {
  const distance = useSharedValue(0);
  const opacity = useSharedValue(1);
  const size = useMemo(() => 2 + Math.random() * 4, []);
  const maxDistance = useMemo(() => 50 + Math.random() * 100, []);

  useEffect(() => {
    distance.value = withTiming(maxDistance, {
      duration: 800 + Math.random() * 400,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(0, {
      duration: 800 + Math.random() * 400,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = Math.cos(angle) * distance.value;
    const ty = Math.sin(angle) * distance.value;
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function FireworkBurst({ 
  x, 
  y, 
  name, 
  onComplete 
}: { 
  x: number; 
  y: number; 
  name: string; 
  onComplete: () => void 
}) {
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);

  useEffect(() => {
    // Text animation
    textOpacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withDelay(1000, withTiming(0, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      }))
    );
    textScale.value = withTiming(1.2, { 
      duration: 2000,
      easing: Easing.out(Easing.quad) 
    });
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => (
      <Particle key={i} angle={(i * Math.PI * 2) / 12} x={x} y={y} />
    ));
  }, [x, y]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles}
      <Animated.View
        style={[
          styles.burstTextContainer,
          { left: x - 100, top: y - 20 },
          textStyle,
        ]}
      >
        <Text style={styles.burstText}>{name}</Text>
      </Animated.View>
    </View>
  );
}

function ContributorName({ name, index }: { name: string; index: number }) {
  const { gravityScale } = useGlobalSettings();
  const translateX = useSharedValue(-width);
  
  // Randomize initial position and speed for each name
  const config = useMemo(() => {
    const duration = 3000 + Math.random() * 5000;
    const delay = Math.random() * 10000;
    const top = 100 + Math.random() * (height - 200); // Random vertical position
    const fontSize = 14 + Math.random() * 10;
    return { duration, delay, top, fontSize };
  }, []);

  useEffect(() => {
    cancelAnimation(translateX);
    
    // Adjust speed based on gravity
    const adjustedDuration = config.duration / (0.5 + gravityScale * 0.5);

    translateX.value = withRepeat(
      withTiming(width, {
        duration: adjustedDuration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [gravityScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(
      translateX.value,
      [-width, -width * 0.8, width * 0.8, width],
      [0, 1, 1, 0]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.contributorContainer,
        { top: config.top },
        animatedStyle,
      ]}
    >
      <Text style={[styles.contributorText, { fontSize: config.fontSize }]}>
        {name}
      </Text>
    </Animated.View>
  );
}

export default function VoidTerminal() {
  const router = useRouter();
  const { gravityScale, setGravityScale, wireframeMode, setWireframeMode } = useGlobalSettings();
  const cursorOpacity = useSharedValue(1);
  const [activeBursts, setActiveBursts] = useState<{ id: number; x: number; y: number; name: string }[]>([]);

  const handlePress = (event: any) => {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    // Use pageX/pageY if locationX/Y are unreliable due to nesting
    const x = locationX || pageX;
    const y = locationY || pageY;
    
    const name = CONTRIBUTORS[Math.floor(Math.random() * CONTRIBUTORS.length)];
    const id = Date.now() + Math.random();
    setActiveBursts((prev) => [...prev, { id, x, y, name }]);
  };

  const removeBurst = (id: number) => {
    setActiveBursts((prev) => prev.filter((b) => b.id !== id));
  };

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Digital Rain Background */}
      <View style={[StyleSheet.absoluteFill, styles.rainContainer]} pointerEvents="none">
        {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
          <RainColumn key={i} index={i} />
        ))}
        {CONTRIBUTORS.map((name, i) => (
          <ContributorName key={`contributor-${i}`} name={name} index={i} />
        ))}
      </View>

      {/* Firework Bursts Layer - Placed above background but below HUD */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {activeBursts.map((burst) => (
          <FireworkBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            name={burst.name}
            onComplete={() => removeBurst(burst.id)}
          />
        ))}
      </View>

      {/* Interaction Layer - Placed below HUD but above background */}
      <Pressable 
        onPress={handlePress} 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} 
      />

      {/* HUD Overlay - Placed at the very top, using box-none to allow clicks to pass through its empty areas */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <View pointerEvents="none">
            <Text style={styles.terminalText}>
              {'> 萬象之門已開啟'}
              <Animated.Text style={[styles.terminalText, animatedCursorStyle]}>_</Animated.Text>
            </Text>
            <Text style={styles.subHeaderText}>SYSTEM STATUS: ANOMALY DETECTED</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>[ 歸塵 ]</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hudContainer} pointerEvents="box-none">
          <View style={[styles.hudSection, wireframeMode && styles.wireframeHud]} pointerEvents="auto">
            <Text style={styles.sectionTitle}>[ 造物主律令 / GOD MODE ]</Text>
            
            <View style={styles.controlRow}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>萬有引力 (GRAVITY)</Text>
                <Text style={styles.valueText}>{gravityScale.toFixed(1)}G</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                step={0.1}
                value={gravityScale}
                onValueChange={setGravityScale}
                minimumTrackTintColor="#00FF00"
                maximumTrackTintColor="#113311"
                thumbTintColor="#00FF00"
              />
            </View>

            <View style={styles.controlRow}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>虛實之界 (WIREFRAME)</Text>
                <Switch
                  value={wireframeMode}
                  onValueChange={setWireframeMode}
                  trackColor={{ false: '#113311', true: '#00FF00' }}
                  thumbColor={wireframeMode ? '#FFF' : '#666'}
                />
              </View>
            </View>
          </View>

          <View style={[styles.hudSection, styles.mt20, wireframeMode && styles.wireframeHud]} pointerEvents="none">
            <Text style={styles.sectionTitle}>[ 核心監測 / KERNEL ]</Text>
            <Text style={styles.statusText}>ARCH: REACT_NATIVE_REANIMATED</Text>
            <Text style={styles.statusText}>RENDER_MODE: {wireframeMode ? 'WIREFRAME' : 'CYBER_GLITCH'}</Text>
            <Text style={styles.statusText}>GRAVITY_INTENSITY: {(gravityScale * 10).toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.footer} pointerEvents="none">
          <Text style={styles.footerText}>© 2024 IKIDE TERMINAL. ALL RIGHTS RESERVED.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  rainContainer: {
    backgroundColor: '#000',
    opacity: 0.8,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#00FF00',
    zIndex: 999,
  },
  burstTextContainer: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  burstText: {
    color: '#00FF00',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  contributorContainer: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 30, 0, 0.5)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#00FF0033',
  },
  contributorText: {
    color: '#00FF00',
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  column: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  rainText: {
    color: '#00FF00',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  terminalText: {
    color: '#00FF00',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  subHeaderText: {
    color: '#00FF00',
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    opacity: 0.6,
    marginTop: 4,
  },
  closeButton: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#00FF00',
    borderRadius: 4,
  },
  closeButtonText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  hudContainer: {
    flex: 1,
  },
  hudSection: {
    backgroundColor: 'rgba(0, 20, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#00FF00',
  },
  wireframeHud: {
    borderWidth: 1,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  sectionTitle: {
    color: '#00FF00',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginBottom: 15,
    fontWeight: 'bold',
  },
  controlRow: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  valueText: {
    color: '#00FF00',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 30,
  },
  statusText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginBottom: 4,
    opacity: 0.8,
  },
  mt20: {
    marginTop: 20,
  },
  footer: {
    marginBottom: 40,
  },
  footerText: {
    color: '#00FF00',
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    marginBottom: 4,
    opacity: 0.4,
  },
});
