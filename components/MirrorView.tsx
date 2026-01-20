import React, { useMemo } from 'react';
import { StyleSheet, Platform, Pressable, Alert, BackHandler } from 'react-native';
import { Text, View } from './Themed';
import * as Haptics from 'expo-haptics';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export function MirrorView() {
  const today = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  const handleGoLive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (Platform.OS === 'web') {
      Alert.alert(
        "Goodbye",
        "The world is waiting for you. Put the phone down and go live.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Go Live",
        "The story is outside. Are you ready to continue writing yours?",
        [
          {
            text: "STAY",
            style: "cancel"
          },
          { 
            text: "GO LIVE", 
            style: "destructive",
            onPress: () => {
              // On Android we can exit the app, on iOS we just show a message 
              // as Apple doesn't allow programmatic exit easily
              if (Platform.OS === 'android') {
                BackHandler.exitApp();
              } else {
                Alert.alert("Goodbye", "Put your phone down. We'll be here when you're done.");
              }
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>THE STORY IS STILL BEING WRITTEN.</Text>
        
        <View style={styles.giftContainer}>
          <Text style={styles.giftLabel}>TODAY IS A GIFT</Text>
          <Text style={styles.dateText}>{today.toUpperCase()}</Text>
        </View>

        <Text style={styles.quote}>
          "Life is what happens while you're busy making other plans."
        </Text>
      </View>

      <Pressable 
        onPress={handleGoLive}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.6 : 1 }
        ]}
      >
        <Text style={styles.buttonText}>GO LIVE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: SERIF_FONT,
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 40,
  },
  giftContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  giftLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#888',
    marginBottom: 8,
    fontFamily: SERIF_FONT,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: SERIF_FONT,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60,
    opacity: 0.6,
    lineHeight: 24,
    fontFamily: SERIF_FONT,
  },
  button: {
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 0,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: SERIF_FONT,
  },
});
