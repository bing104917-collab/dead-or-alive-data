import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, View as RNView, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  birthDate: string;
  mood: string;
  creed: string;
}

interface DailyInsight {
  date: string;
  content: string;
}

const PROFILE_KEY = 'ikide_profile';
const INSIGHTS_KEY = 'ikide_insights';
const REVEAL_KEY = 'ikide_last_reveal_date';

const PRESET_INSIGHTS = [
  "生如夏花之絢爛，死如秋葉之靜美。",
  "這世界我來過，我愛過，我努力過。",
  "死亡不是失去生命，而是走出時間。",
  "每一個不曾起舞的日子，都是對生命的辜負。",
  "人生的意義在於內心的寧靜。",
  "我們最終都會成為星塵。",
  "活在當下，便是永恆。",
];

export default function MonologuePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({ birthDate: '', mood: '', creed: '' });
  const [insight, setInsight] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    loadData();
    
    // 設置今日隨機語錄 (基於日期的種子，確保每日更新且全天一致)
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // 使用年份 + 一年中的第幾天作為種子，確保每年每天都不一樣
    const seed = today.getFullYear() * 1000 + dayOfYear;
    setDailyQuote(PRESET_INSIGHTS[seed % PRESET_INSIGHTS.length]);
  }, []);

  const loadData = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (storedProfile) setProfile(JSON.parse(storedProfile));

      const today = new Date().toISOString().split('T')[0];
      
      // 檢查今日是否已揭密
      const lastRevealDate = await AsyncStorage.getItem(REVEAL_KEY);
      if (lastRevealDate === today) {
        setIsRevealed(true);
      }

      const storedInsights = await AsyncStorage.getItem(INSIGHTS_KEY);
      if (storedInsights) {
        const insights: DailyInsight[] = JSON.parse(storedInsights);
        const todayInsight = insights.find(i => i.date === today);
        if (todayInsight) setInsight(todayInsight.content);
      }
    } catch (e) {
      console.error('Failed to load profile data');
    }
  };

  const handleReveal = async () => {
    if (isRevealed) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(REVEAL_KEY, today);
      setIsRevealed(true);
    } catch (e) {
      console.error('Failed to save reveal status');
      setIsRevealed(true); // 即便保存失敗也讓用戶看到，但下次進入會重置
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setIsEditingProfile(false);
    } catch (e) {
      Alert.alert('封存失敗');
    }
  };

  const saveDailyInsight = async () => {
    if (!insight.trim()) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedInsights = await AsyncStorage.getItem(INSIGHTS_KEY);
      let insights: DailyInsight[] = storedInsights ? JSON.parse(storedInsights) : [];
      
      const index = insights.findIndex(i => i.date === today);
      if (index > -1) {
        insights[index].content = insight;
      } else {
        insights.push({ date: today, content: insight });
      }

      await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights));
      Alert.alert('封存成功', '今日的感悟已入冊。');
    } catch (e) {
      Alert.alert('封存失敗');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '獨 白',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        animation: 'fade',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#121212" />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Daily Insight Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DAILY INSIGHT</Text>
            <TouchableOpacity onPress={() => router.push('/monologue/history')}>
              <Text style={styles.historyButtonText}>HISTORY</Text>
            </TouchableOpacity>
          </RNView>
          
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handleReveal}
            onLongPress={handleReveal}
          >
            <RNView style={[styles.quoteCard, !isRevealed && styles.quoteCardSealed]}>
              {isRevealed ? (
                <Text style={styles.quoteText}>"{dailyQuote}"</Text>
              ) : (
                <RNView style={styles.sealedContainer}>
                  <Ionicons name="eye-off-outline" size={24} color="#D0D0CA" />
                  <Text style={styles.sealedText}>點擊以揭示今日的命運</Text>
                </RNView>
              )}
            </RNView>
          </TouchableOpacity>

          <TextInput
            style={styles.insightInput}
            placeholder="此刻的想法..."
            value={insight}
            onChangeText={setInsight}
            multiline
            placeholderTextColor="#CCC"
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveDailyInsight}>
            <Text style={styles.saveButtonText}>封存今日</Text>
          </TouchableOpacity>
        </RNView>

        {/* Profile Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ABOUT ME</Text>
            <TouchableOpacity onPress={() => isEditingProfile ? saveProfile() : setIsEditingProfile(true)}>
              <Text style={styles.editButtonText}>{isEditingProfile ? '封存' : '修改'}</Text>
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.profileContent}>
            <RNView style={styles.profileItem}>
              <Text style={styles.profileLabel}>降生</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.profileInput}
                  value={profile.birthDate}
                  onChangeText={text => setProfile({ ...profile, birthDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#EEE"
                />
              ) : (
                <Text style={styles.profileValue}>{profile.birthDate || '未設置'}</Text>
              )}
            </RNView>

            <RNView style={styles.profileItem}>
              <Text style={styles.profileLabel}>當下心情</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.profileInput}
                  value={profile.mood}
                  onChangeText={text => setProfile({ ...profile, mood: text })}
                  placeholder="平靜、喜悅、思考中..."
                  placeholderTextColor="#EEE"
                />
              ) : (
                <Text style={styles.profileValue}>{profile.mood || '未設置'}</Text>
              )}
            </RNView>

            <RNView style={styles.profileItem}>
              <Text style={styles.profileLabel}>人生信條</Text>
              {isEditingProfile ? (
                <TextInput
                  style={[styles.profileInput, styles.multilineInput]}
                  value={profile.creed}
                  onChangeText={text => setProfile({ ...profile, creed: text })}
                  placeholder="你的人生信條..."
                  multiline
                  placeholderTextColor="#EEE"
                />
              ) : (
                <Text style={styles.profileValue}>{profile.creed || '未設置'}</Text>
              )}
            </RNView>
          </RNView>
        </RNView>

        <RNView style={styles.footer}>
          <Text style={styles.footerText}>在時間的流逝中，留下一點痕跡。</Text>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  content: {
    padding: 30,
  },
  section: {
    marginBottom: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#999',
    fontWeight: 'bold',
  },
  quoteCard: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#121212',
    lineHeight: 28,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  quoteCardSealed: {
    backgroundColor: '#E8E8E0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D0D0CA',
  },
  sealedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  sealedText: {
    fontSize: 10,
    color: '#999990',
    marginTop: 10,
    letterSpacing: 2,
  },
  insightInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 15,
    fontSize: 16,
    color: '#000',
    minHeight: 60,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  profileContent: {
    gap: 30,
  },
  profileItem: {
    borderLeftWidth: 1,
    borderLeftColor: '#D0D0CA',
    paddingLeft: 15,
  },
  profileLabel: {
    fontSize: 10,
    color: '#999990',
    marginBottom: 5,
    letterSpacing: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#121212',
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  profileInput: {
    fontSize: 18,
    color: '#000',
    paddingVertical: 5,
  },
  multilineInput: {
    minHeight: 40,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textDecorationLine: 'underline',
  },
  historyButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    textDecorationLine: 'underline',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#EEE',
    fontStyle: 'italic',
  },
});
