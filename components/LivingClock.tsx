import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Text } from './Themed';

interface LivingClockProps {
  birthDate: string;
  color: string;
}

const MONOSPACE_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  web: 'monospace',
});

export function LivingClock({ birthDate, color }: LivingClockProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const calculateSeconds = () => {
      const birth = new Date(birthDate);
      const now = new Date();
      return Math.floor((now.getTime() - birth.getTime()) / 1000);
    };

    setSeconds(calculateSeconds());

    const interval = setInterval(() => {
      setSeconds(calculateSeconds());
    }, 1000);

    return () => clearInterval(interval);
  }, [birthDate]);

  return (
    <Text style={[styles.clock, { color, fontFamily: MONOSPACE_FONT }]}>
      {seconds.toLocaleString()} SECONDS
    </Text>
  );
}

const styles = StyleSheet.create({
  clock: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
});
