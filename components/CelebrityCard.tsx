import React, { useMemo } from 'react';
import { StyleSheet, Pressable, View as RNView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from './Themed';
import { Celebrity } from '@/data/celebrities';
import { getAliveStatus, getDeadStatus, calculateLifeProgress } from '@/utils/statusHelpers';
import { LifeProgressBar } from './LifeProgressBar';

interface CelebrityCardProps {
  celebrity: Celebrity;
}

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export function CelebrityCard({ celebrity }: CelebrityCardProps) {
  const isDead = celebrity.status === 'dead';

  const statusPhrase = useMemo(() => {
    return isDead ? getDeadStatus() : getAliveStatus();
  }, [isDead]);

  const lifePercentage = useMemo(() => {
    return calculateLifeProgress(celebrity.birthDate, celebrity.deathDate);
  }, [celebrity.birthDate, celebrity.deathDate]);

  return (
    <Link href={`/detail/${celebrity.id}`} asChild>
      <Pressable>
        <View style={[
          styles.card, 
          isDead ? styles.cardDead : styles.cardAlive
        ]}>
          <RNView style={styles.info}>
            <Text style={[
              styles.name, 
              isDead ? styles.textDead : styles.textAlive,
              isDead && styles.textLineThrough
            ]}>
              {celebrity.name.toUpperCase()}
            </Text>
            
            <LifeProgressBar percentage={lifePercentage} isDead={isDead} />
            
            <Text style={[
              styles.occupation,
              isDead ? styles.textDeadDim : styles.textAliveDim
            ]}>
              {statusPhrase.toUpperCase()}
            </Text>
          </RNView>
          
          <RNView style={styles.statusContainer}>
            {isDead ? (
              <Text style={[styles.deadIcon, styles.textDeadDim]}>†</Text>
            ) : (
              <RNView style={styles.aliveIndicator} />
            )}
          </RNView>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
  },
  cardAlive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EEEEEE',
  },
  cardDead: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
  },
  info: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: SERIF_FONT,
  },
  textAlive: {
    color: '#000000',
  },
  textDead: {
    color: '#888888',
  },
  textLineThrough: {
    textDecorationLine: 'line-through',
  },
  textAliveDim: {
    color: '#666666',
  },
  textDeadDim: {
    color: '#555555',
  },
  occupation: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
  },
  statusContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deadIcon: {
    fontSize: 28,
    fontFamily: SERIF_FONT,
  },
  aliveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
