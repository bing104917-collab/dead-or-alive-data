import { useEffect } from 'react';
import { Gyroscope } from 'expo-sensors';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import { useGlobalSettings } from '@/context/GlobalSettings';

/**
 * useParallax Hook
 *
 * Creates a subtle parallax effect based on device gyroscope data.
 *
 * @param sensitivity - How much the elements move in response to tilt (default: 1)
 * @param maxOffset - Maximum displacement in pixels (default: 15)
 */
export function useParallax(sensitivity = 1, maxOffset = 15) {
  const { gravityScale } = useGlobalSettings();
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);

  useEffect(() => {
    // Gyroscope is usually not available on web or simulators without sensors
    if (Platform.OS === 'web') {
      const handleMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;
        
        // Calculate normalized position (-1 to 1)
        const x = (clientX / innerWidth) * 2 - 1;
        const y = (clientY / innerHeight) * 2 - 1;
        
        // Apply sensitivity and gravity
        rotationX.value = x * 10 * sensitivity * gravityScale;
        rotationY.value = y * 10 * sensitivity * gravityScale;
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }

    Gyroscope.setUpdateInterval(16); // ~60fps for smooth motion

    const subscription = Gyroscope.addListener((data) => {
      // We use the rotation rate to influence the current offset
      // data.y is rotation around Y axis (left/right tilt) -> influences translateX
      // data.x is rotation around X axis (up/down tilt) -> influences translateY
      
      // Sensitivity multiplier influenced by Global Gravity Scale
      const dx = data.y * sensitivity * gravityScale;
      const dy = data.x * sensitivity * gravityScale;

      // Update shared values with a damping effect
      rotationX.value = Math.max(Math.min(rotationX.value + dx, 10), -10);
      rotationY.value = Math.max(Math.min(rotationY.value + dy, 10), -10);
    });

    // Slow return to center when not moving
    const interval = setInterval(() => {
      rotationX.value = rotationX.value * 0.95;
      rotationY.value = rotationY.value * 0.95;
    }, 16);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [sensitivity, gravityScale]);

  const animatedStyle = useAnimatedStyle(() => {
    // Map the accumulated rotation to the desired pixel offset
    const translateX = withSpring(
      interpolate(
        rotationX.value,
        [-10, 10],
        [-maxOffset, maxOffset],
        Extrapolate.CLAMP
      ),
      { damping: 20, stiffness: 90 }
    );

    const translateY = withSpring(
      interpolate(
        rotationY.value,
        [-10, 10],
        [-maxOffset, maxOffset],
        Extrapolate.CLAMP
      ),
      { damping: 20, stiffness: 90 }
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return animatedStyle;
}
