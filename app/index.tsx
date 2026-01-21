import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, View as RNView, Platform, Pressable, Alert, TouchableWithoutFeedback } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
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
  interpolateColor
} from 'react-native-reanimated';

import { useParallax } from '@/hooks/useParallax';
import { useGlobalSettings } from '@/context/GlobalSettings';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

function FloatingItem({ children, delay = 0, duration = 3000, offset = 10, style, parallaxStyle }: { children: React.ReactNode, delay?: number, duration?: number, offset?: number, style?: any, parallaxStyle?: any }) {
  const translateY = useSharedValue(0);
  const { gravityScale } = useGlobalSettings();

  useEffect(() => {
    // Adjust the offset and duration based on gravityScale
    // Higher gravity = more movement (larger offset) and faster movement (shorter duration)
    const adjustedOffset = offset * gravityScale;
    const adjustedDuration = duration / (0.5 + gravityScale * 0.5); // Gravity 1 = normal, Gravity 10 = ~2x faster

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-adjustedOffset, { duration: adjustedDuration, easing: Easing.inOut(Easing.sin) }),
          withTiming(adjustedOffset, { duration: adjustedDuration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, duration, offset, gravityScale]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, parallaxStyle, floatingStyle]}>
      {children}
    </Animated.View>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { wireframeMode } = useGlobalSettings();
  const [showCountdown, setShowCountdown] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');
  const [isHeartbeating, setIsHeartbeating] = useState(false);
  const heartbeatAnim = useSharedValue(0);
  const heartbeatIntervalRef = useRef<any>(null);

  // Secret Gate logic
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  
  // Parallax styles for different layers
  const titleParallax = useParallax(0.4, 6); // Subtle background layer
  const menuParallax = useParallax(1.2, 12); // Active foreground layer

  const calculateRemaining = useCallback(() => {
    // 核心假設：以 2000 年 1 月 1 日為出生日期，並假設人的一生平均長度為 80 歲
    // 此處僅作為哲學冥想的倒計時參考
    const birthDate = new Date('2000-01-01T00:00:00');
    const deathDate = new Date(birthDate.getTime() + 80 * 365.25 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = deathDate.getTime() - now.getTime();

    if (diff <= 0) return '長 命 百 歲';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    return `餘 下 ${days.toLocaleString()} 晝 夜 ${hours} 時 ${minutes} 分 ${seconds} 秒`;
  }, []);

  useEffect(() => {
    let interval: any;
    if (showCountdown) {
      setRemainingTime(calculateRemaining());
      interval = setInterval(() => {
        setRemainingTime(calculateRemaining());
      }, 1000);

      const timer = setTimeout(() => {
        setShowCountdown(false);
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [showCountdown, calculateRemaining]);

  // Heartbeat logic
  const startHeartbeat = async () => {
    setIsHeartbeating(true);
    
    // Initial heartbeat visual pulse
    heartbeatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(0.6, { duration: 100 }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      false
    );

    // Haptics loop
    const runHapticCycle = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 150);
    };

    runHapticCycle();
    heartbeatIntervalRef.current = setInterval(runHapticCycle, 1200);
  };

  const stopHeartbeat = () => {
    setIsHeartbeating(false);
    heartbeatAnim.value = withTiming(0, { duration: 300 });
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        heartbeatAnim.value,
        [0, 1],
        ['#F5F5F0', '#EFEBE0']
      ),
    };
  });

  const handleTitlePress = async () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 800) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    console.log(`[Gate] Tap count: ${tapCountRef.current}`);

    if (tapCountRef.current === 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('[Gate] 2 more steps to the void...');
    } else if (tapCountRef.current === 5) {
      tapCountRef.current = 0; // Reset immediately
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const title = "真理之門";
      const message = "歡迎來到秘密世界。目前此門通往虛無，未來將會開啟更多驚喜。";

      if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}\n\n是否進入？`)) {
          router.push('/void');
        }
      } else {
        Alert.alert(
          title,
          message,
          [
            { text: "進入", onPress: () => router.push('/void') },
            { text: "取消", style: "cancel" }
          ],
          { cancelable: true }
        );
      }
    }
  };

  const navItems = [
    {
      title: '眾 生',
      subtitle: 'THE MULTITUDE',
      path: '/celebrities',
      description: '歷史長河中的芸芸眾生',
      style: { alignSelf: 'flex-start', marginLeft: 20, marginTop: 40 } as const,
      fontSize: 42,
      delay: 0,
    },
    {
      title: '羈 絆',
      subtitle: 'BONDS',
      path: '/bonds',
      description: '與我產生深刻聯繫的個體',
      style: { alignSelf: 'flex-end', marginRight: 40, marginTop: 20 } as const,
      fontSize: 36,
      delay: 500,
    },
    {
      title: '專 注',
      subtitle: 'G A Z E',
      path: '/focus',
      description: '凝視時間的流逝',
      style: { alignSelf: 'flex-start', marginLeft: 30, marginTop: 40 } as const,
      fontSize: 40,
      delay: 1000,
    },
    {
      title: '獨 白',
      subtitle: 'MONOLOGUE',
      path: '/monologue',
      description: '與內心自我的對話',
      style: { alignSelf: 'flex-end', marginRight: 20, marginTop: 30 } as const,
      fontSize: 48,
      delay: 1500,
    },
  ];

  return (
    <Pressable 
      style={{ flex: 1 }}
      onLongPress={startHeartbeat}
      onPressOut={stopHeartbeat}
      delayLongPress={400}
    >
      <Animated.View style={[styles.container, animatedBackgroundStyle]}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
          
          <Animated.View style={[styles.header, titleParallax]}>
            <TouchableWithoutFeedback onPress={handleTitlePress}>
              <RNView style={{ alignItems: 'center' }}>
                <Text style={styles.title}>浮 生 錄</Text>
                <Text style={styles.tagline}>生 與 死 的 哲 學 冥 想</Text>
              </RNView>
            </TouchableWithoutFeedback>
          </Animated.View>

          <RNView style={styles.menu}>
            {navItems.map((item, index) => (
              <FloatingItem 
                key={index} 
                delay={item.delay} 
                style={item.style}
                parallaxStyle={menuParallax}
              >
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    wireframeMode && { borderWidth: 1, borderColor: '#000', borderStyle: 'dashed' }
                  ]}
                  onPress={() => router.push(item.path as any)}
                  activeOpacity={0.6}
                >
                  <RNView style={styles.menuItemContent}>
                    <Text style={[styles.menuItemTitle, { fontSize: item.fontSize }]}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.menuItemDesc}>{item.description}</Text>
                  </RNView>
                </TouchableOpacity>
              </FloatingItem>
            ))}
          </RNView>

          <TouchableOpacity 
            style={styles.footer} 
            onPress={() => setShowCountdown(true)}
            activeOpacity={0.8}
          >
            {showCountdown ? (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)}>
                <Text style={styles.countdownText}>{remainingTime}</Text>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)}>
                <Text style={styles.footerText}>MOMENTO MORI</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    marginTop: 80,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: 15,
    color: '#121212',
    fontFamily: SERIF_FONT,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 6,
    color: '#999990',
    marginTop: 15,
    fontWeight: '300',
  },
  menu: {
    flex: 1,
    marginTop: 40,
  },
  menuItem: {
    padding: 10,
  },
  menuItemContent: {
    backgroundColor: 'transparent',
  },
  menuItemTitle: {
    fontWeight: '300',
    color: '#121212',
    letterSpacing: 8,
    fontFamily: SERIF_FONT,
  },
  menuItemSubtitle: {
    fontSize: 10,
    color: '#999990',
    marginTop: 2,
    letterSpacing: 3,
    fontWeight: '300',
    textAlign: 'center',
  },
  menuItemDesc: {
    fontSize: 10,
    color: '#CCC',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
    minHeight: 100, // Ensure enough space for countdown
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 4,
    color: '#D0D0CA',
    fontWeight: '300',
  },
  countdownText: {
    fontSize: 12,
    fontFamily: SERIF_FONT,
    color: '#999990',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
});
