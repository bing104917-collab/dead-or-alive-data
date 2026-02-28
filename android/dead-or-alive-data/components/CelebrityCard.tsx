import React, { useMemo } from 'react';
import { StyleSheet, Pressable, View as RNView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from './Themed';
import { Celebrity } from '@/data/celebrities';
import { getAliveStatus, getDeadStatus } from '@/utils/statusHelpers';

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

  const yearsDisplay = useMemo(() => {
    const birthYear = new Date(celebrity.birthDate).getFullYear();
    if (isDead && celebrity.deathDate) {
      const deathYear = new Date(celebrity.deathDate).getFullYear();
      return `${birthYear} — ${deathYear}`;
    }
    return `降生於 ${birthYear}`;
  }, [celebrity.birthDate, celebrity.deathDate, isDead]);

  return (
    <Link href={`/detail/${celebrity.id}`} asChild>
      <Pressable>
        <View style={styles.card}>
          <RNView style={styles.info}>
            <RNView style={styles.nameContainer}>
              <Text style={[
                styles.name, 
                isDead ? styles.textDead : styles.textAlive,
              ]}>
                {celebrity.name}
              </Text>
              <Text style={[
                styles.statusText,
                isDead ? styles.textDeadDim : styles.textAliveDim
              ]}>
                {statusPhrase}
              </Text>
            </RNView>
            
            <RNView style={styles.metaContainer}>
              <Text style={[
                styles.occupation,
                isDead ? styles.textDeadDim : styles.textAliveDim
              ]}>
                {celebrity.occupation}
              </Text>
              <Text style={[
                styles.years,
                isDead ? styles.textDeadDim : styles.textAliveDim
              ]}>
                {yearsDisplay}
              </Text>
            </RNView>
          </RNView>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginVertical: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(18, 18, 18, 0.1)',
  },
  info: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '500',
    fontFamily: SERIF_FONT,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: SERIF_FONT,
    letterSpacing: 2,
    opacity: 0.6,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  textAlive: {
    color: '#121212',
  },
  textDead: {
    color: '#A0A09A',
  },
  textAliveDim: {
    color: '#666666',
  },
  textDeadDim: {
    color: '#A0A09A',
  },
  occupation: {
    fontSize: 14,
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  years: {
    fontSize: 13,
    fontFamily: SERIF_FONT,
    opacity: 0.7,
  },
});
