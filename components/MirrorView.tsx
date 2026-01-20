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
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long',
    };
    return new Date().toLocaleDateString('zh-CN', options);
  }, []);

  const handleGoLive = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (Platform.OS === 'web') {
      Alert.alert(
        "歸去",
        "世界正在門外守候。放下螢幕，去生活吧。",
        [{ text: "好" }]
      );
    } else {
      Alert.alert(
        "重返現實",
        "故事還在繼續。你準備好去書寫自己的篇章了嗎？",
        [
          {
            text: "停留",
            style: "cancel"
          },
          { 
            text: "出發", 
            style: "destructive",
            onPress: () => {
              if (Platform.OS === 'android') {
                BackHandler.exitApp();
              } else {
                Alert.alert("再見", "放下手機，去感受此刻。我們會在這裡等你歸來。");
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
        <Text style={styles.title}>生 命 之 書，仍 在 續 寫</Text>
        
        <View style={styles.giftContainer}>
          <Text style={styles.giftLabel}>今 日 是 一 份 饋 贈</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        <Text style={styles.quote}>
          「生命，就是在你忙著制定其他計畫時，悄然發生的一切。」
        </Text>
      </View>

      <Pressable 
        onPress={handleGoLive}
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed ? 0.6 : 1 }
        ]}
      >
        <Text style={styles.buttonText}>重 返 現 實</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    fontFamily: SERIF_FONT,
    letterSpacing: 4,
    lineHeight: 48,
    marginBottom: 60,
    color: '#121212',
  },
  giftContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  giftLabel: {
    fontSize: 12,
    letterSpacing: 6,
    color: 'rgba(18, 18, 18, 0.4)',
    marginBottom: 12,
    fontFamily: SERIF_FONT,
  },
  dateText: {
    fontSize: 18,
    fontFamily: SERIF_FONT,
    color: '#121212',
    letterSpacing: 1,
  },
  quote: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 80,
    opacity: 0.5,
    lineHeight: 28,
    fontFamily: SERIF_FONT,
    color: '#121212',
    paddingHorizontal: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: 'rgba(18, 18, 18, 0.2)',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 0,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 4,
    fontFamily: SERIF_FONT,
    color: '#121212',
  },
});
