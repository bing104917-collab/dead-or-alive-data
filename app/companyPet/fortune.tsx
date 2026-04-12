import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Themed';

type FortuneLevel = '大吉' | '中吉' | '小吉' | '吉' | '末吉' | '凶' | '大凶';

type Fortune = {
  level: FortuneLevel;
  verse: string;
  hint: string;
};

type StoredFortune = {
  date: string; // YYYY-MM-DD
  fortune: Fortune;
};

const STORAGE_KEY = 'companypet_fortune_v1';

const BUCKET_IMG = require('@/assets/companyPet/bucket.png');
const STICK_IMG = require('@/assets/companyPet/stick.png');

const TITLE_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pickFortune(): Fortune {
  // Weighted-ish distribution: more good than bad, but keep extremes rare.
  const bag: FortuneLevel[] = [
    '大吉',
    '中吉',
    '中吉',
    '小吉',
    '小吉',
    '吉',
    '吉',
    '末吉',
    '凶',
    '大凶',
  ];
  const level = bag[Math.floor(Math.random() * bag.length)];

  const lines: Record<FortuneLevel, Fortune> = {
    大吉: { level, verse: '顺水行舟，风也为你让路。', hint: '把今天最重要的一件事做完再庆祝。' },
    中吉: { level, verse: '光在你前方半步，抬头就能看见。', hint: '别贪多，选一个方向走深一点。' },
    小吉: { level, verse: '小确幸在路边，捡起来就会发亮。', hint: '给自己留一点余裕，别赶尽杀绝。' },
    吉: { level, verse: '不疾不徐，恰好抵达。', hint: '稳住节奏，比冲刺更重要。' },
    末吉: { level, verse: '云遮一瞬，月仍在。', hint: '少一点纠结，多一点执行。' },
    凶: { level, verse: '风紧时，别硬拗方向。', hint: '能避就避，能拖就拖，明天再战。' },
    大凶: { level, verse: '别逞强，先把自己护好。', hint: '今天只做必要的事，其他都放过。' },
  };
  return lines[level];
}

export default function CompanyPetFortune() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const autostart = params?.autostart === '1';

  const [loaded, setLoaded] = useState(false);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [hasToday, setHasToday] = useState(false);
  const drawingRef = useRef(false);

  const bucketOpacity = useSharedValue(1);
  const bucketScale = useSharedValue(1);
  const bucketRotate = useSharedValue(0);

  const stickOpacity = useSharedValue(0);
  const stickY = useSharedValue(120);
  const stickRotate = useSharedValue(-8);

  const paperOpacity = useSharedValue(0);
  const paperScale = useSharedValue(0.88);
  const paperY = useSharedValue(10);

  const dateKey = useMemo(() => todayKey(), []);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredFortune;
      if (parsed?.date === dateKey && parsed?.fortune) {
        setFortune(parsed.fortune);
        setHasToday(true);
      }
    } catch {
      // ignore
    }
  }, [dateKey]);

  useEffect(() => {
    (async () => {
      await load();
      setLoaded(true);
    })();
  }, [load]);

  const bucketStyle = useAnimatedStyle(() => ({
    opacity: bucketOpacity.value,
    transform: [{ scale: bucketScale.value }, { rotateZ: `${bucketRotate.value}deg` }],
  }));

  const stickStyle = useAnimatedStyle(() => ({
    opacity: stickOpacity.value,
    transform: [{ translateY: stickY.value }, { rotateZ: `${stickRotate.value}deg` }],
  }));

  const paperStyle = useAnimatedStyle(() => ({
    opacity: paperOpacity.value,
    transform: [{ translateY: paperY.value }, { scale: paperScale.value }],
  }));

  const showPaperInstant = useCallback(() => {
    bucketOpacity.value = 0;
    stickOpacity.value = 0;
    paperOpacity.value = 1;
    paperScale.value = 1;
    paperY.value = 0;
  }, [bucketOpacity, paperOpacity, paperScale, paperY, stickOpacity]);

  useEffect(() => {
    if (!loaded) return;
    if (hasToday) {
      showPaperInstant();
      return;
    }
    if (autostart) {
      // small delay so the screen feels intentional
      const t = setTimeout(() => {
        if (!drawingRef.current) startDraw();
      }, 450);
      return () => clearTimeout(t);
    }
  }, [autostart, hasToday, loaded, showPaperInstant]);

  const persistFortune = useCallback(
    async (f: Fortune) => {
      const payload: StoredFortune = { date: dateKey, fortune: f };
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    },
    [dateKey]
  );

  const startDraw = useCallback(async () => {
    if (drawingRef.current || hasToday) return;
    drawingRef.current = true;

    // pick first so we can guarantee day-level persistence
    const picked = pickFortune();
    setFortune(picked);
    await persistFortune(picked);

    cancelAnimation(bucketRotate);
    cancelAnimation(stickY);
    cancelAnimation(stickOpacity);
    cancelAnimation(paperOpacity);

    bucketOpacity.value = 1;
    bucketScale.value = 1;
    bucketRotate.value = 0;

    stickOpacity.value = 0;
    stickY.value = 120;
    stickRotate.value = -8;

    paperOpacity.value = 0;
    paperScale.value = 0.88;
    paperY.value = 10;

    // Shake bucket
    bucketRotate.value = withSequence(
      withTiming(-5, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(6, { duration: 90 }),
      withTiming(-6, { duration: 90 }),
      withTiming(4, { duration: 85 }),
      withTiming(-3, { duration: 80 }),
      withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) })
    );

    // Stick emerges
    stickOpacity.value = withTiming(1, { duration: 140 });
    stickY.value = withDelay(
      120,
      withTiming(-140, { duration: 760, easing: Easing.out(Easing.cubic) }, () => {
        // Bucket disappears, slip appears
        bucketOpacity.value = withTiming(0, { duration: 220 });
        bucketScale.value = withTiming(0.92, { duration: 220 });
        stickOpacity.value = withTiming(0, { duration: 140 });
        paperOpacity.value = withDelay(120, withTiming(1, { duration: 220 }));
        paperScale.value = withDelay(120, withTiming(1, { duration: 320, easing: Easing.out(Easing.back(1.8)) }));
        paperY.value = withDelay(120, withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) }, (done) => {
          if (done) runOnJS(setHasToday)(true);
        }));
      })
    );

    stickRotate.value = withDelay(140, withTiming(2.5, { duration: 760, easing: Easing.out(Easing.cubic) }));
  }, [
    bucketOpacity,
    bucketRotate,
    bucketScale,
    hasToday,
    paperOpacity,
    paperScale,
    paperY,
    persistFortune,
    stickOpacity,
    stickRotate,
    stickY,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>DAILY LOT</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.stage}>
        <Pressable style={styles.tapCatcher} onPress={startDraw}>
          <View />
        </Pressable>

        <Animated.View style={[styles.bucketWrap, bucketStyle]} pointerEvents="none">
          <Image source={BUCKET_IMG} style={styles.bucket} contentFit="contain" />
          <Animated.View style={[styles.stickWrap, stickStyle]}>
            <Image source={STICK_IMG} style={styles.stick} contentFit="contain" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.paperWrap, paperStyle]} pointerEvents="none">
          <View style={styles.paper}>
            <Text style={styles.paperLevel}>{fortune?.level ?? ''}</Text>
            <Text style={styles.paperVerse}>{fortune?.verse ?? ''}</Text>
            <Text style={styles.paperHint}>{fortune?.hint ?? ''}</Text>
            <Text style={styles.paperDate}>{dateKey}</Text>
          </View>
        </Animated.View>

        {!hasToday && (
          <View style={styles.footer} pointerEvents="none">
            <Text style={styles.footerHint}>Tap to draw today’s lot</Text>
            <Text style={styles.footerSub}>One draw per day</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 72,
    height: 34,
    justifyContent: 'center',
  },
  backText: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: '#1b1b1b',
  },
  headerTitle: {
    fontFamily: TITLE_FONT,
    letterSpacing: 2,
    fontSize: 14,
    color: '#1b1b1b',
  },
  stage: {
    flex: 1,
  },
  tapCatcher: {
    ...StyleSheet.absoluteFillObject,
  },
  bucketWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '18%',
    alignItems: 'center',
  },
  bucket: {
    width: 280,
    height: 260,
  },
  stickWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stick: {
    width: 120,
    height: 320,
  },
  paperWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '28%',
    alignItems: 'center',
  },
  paper: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fbfbfb',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  paperLevel: {
    fontFamily: TITLE_FONT,
    fontSize: 34,
    letterSpacing: 6,
    textAlign: 'center',
    color: '#111',
  },
  paperVerse: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#222',
  },
  paperHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: '#6a6a6a',
  },
  paperDate: {
    marginTop: 14,
    fontFamily: MONO_FONT,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    color: '#8a8a8a',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 34,
    alignItems: 'center',
  },
  footerHint: {
    fontFamily: TITLE_FONT,
    fontSize: 16,
    letterSpacing: 1.2,
    color: '#1b1b1b',
  },
  footerSub: {
    marginTop: 6,
    fontFamily: MONO_FONT,
    fontSize: 11,
    color: '#7a7a7a',
  },
});

