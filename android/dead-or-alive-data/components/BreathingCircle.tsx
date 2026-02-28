import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface BreathingCircleProps {
  isRunning: boolean;
}

export default function BreathingCircle({ isRunning }: BreathingCircleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.05);

  useEffect(() => {
    if (isRunning) {
      // 4-second cycle (2s in, 2s out)
      scale.value = withRepeat(
        withTiming(1.4, {
          duration: 2000,
          easing: Easing.bezier(0.42, 0, 0.58, 1), // Ease-in-out
        }),
        -1, // Infinite
        true // Reverse
      );
      
      opacity.value = withRepeat(
        withTiming(0.12, {
          duration: 2000,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        }),
        -1,
        true
      );
    } else {
      // Gently return to initial state
      scale.value = withTiming(1, { duration: 1000 });
      opacity.value = withTiming(0.05, { duration: 1000 });
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [isRunning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.circle, animatedStyle]} />;
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#000',
    zIndex: 0,
  },
});
