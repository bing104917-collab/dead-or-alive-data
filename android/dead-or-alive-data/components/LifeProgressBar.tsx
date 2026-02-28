import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { View, Text } from './Themed';

interface LifeProgressBarProps {
  percentage: number;
  isDead?: boolean;
}

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export const LifeProgressBar: React.FC<LifeProgressBarProps> = ({ percentage, isDead }) => {
  const isBonusRound = percentage >= 100;
  const barColor = isBonusRound ? '#FFD700' : (isDead ? '#888888' : '#000000');
  
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View 
          style={[
            styles.bar, 
            { 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: barColor 
            }
          ]} 
        />
      </View>
      {isBonusRound && (
        <Text style={[styles.bonusLabel, { color: barColor, fontFamily: SERIF_FONT }]}>
          BONUS ROUND
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  barContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
  },
  bonusLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 1,
  },
});
