import React from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, View as RNView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { StatusBar } from 'expo-status-bar';

const SERIF_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, serif',
});

export default function LandingPage() {
  const router = useRouter();

  const navItems = [
    {
      title: '眾 生',
      subtitle: 'THE MULTITUDE',
      path: '/celebrities',
      description: '歷史長河中的芸芸眾生',
      style: { alignSelf: 'flex-start', marginLeft: 20, marginTop: 40 } as const,
      fontSize: 42,
    },
    {
      title: '羈 絆',
      subtitle: 'BONDS',
      path: '/bonds',
      description: '與我產生深刻聯繫的個體',
      style: { alignSelf: 'flex-end', marginRight: 40, marginTop: 20 } as const,
      fontSize: 36,
    },
    {
      title: '獨 白',
      subtitle: 'MONOLOGUE',
      path: '/monologue',
      description: '與內心自我的對話',
      style: { alignSelf: 'center', marginTop: 30 } as const,
      fontSize: 48,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      
      <RNView style={styles.header}>
        <Text style={styles.title}>浮 生 錄</Text>
        <Text style={styles.tagline}>生 與 死 的 哲 學 冥 想</Text>
      </RNView>

      <RNView style={styles.menu}>
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.style]}
            onPress={() => router.push(item.path as any)}
            activeOpacity={0.6}
          >
            <RNView style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { fontSize: item.fontSize }]}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              <Text style={styles.menuItemDesc}>{item.description}</Text>
            </RNView>
          </TouchableOpacity>
        ))}
      </RNView>

      <RNView style={styles.footer}>
        <Text style={styles.footerText}>MOMENTO MORI</Text>
      </RNView>
    </SafeAreaView>
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
  },
  footerText: {
    fontSize: 9,
    letterSpacing: 4,
    color: '#D0D0CA',
    fontWeight: '300',
  },
});
