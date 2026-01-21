import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, SafeAreaView, View as RNView, TextInput, Modal, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS, 
  interpolateColor,
  withRepeat,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

interface Bond {
  id: string;
  name: string;
  status: '此岸' | '彼岸' | '失聯';
  date: string;
  description: string;
  imageUri?: string;
}

const STORAGE_KEY = 'ikide_bonds_v2';
const LONG_PRESS_DURATION = 1500;
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif' });
const YEAR_MIN = 1900;
const YEAR_MAX = 2026;

function BondItem({ 
  item, 
  onDelete, 
  onEdit, 
  onStatusChange,
  onPress
}: { 
  item: Bond; 
  onDelete: (id: string) => void; 
  onEdit: (bond: Bond) => void;
  onStatusChange: (id: string, newStatus: '此岸' | '彼岸' | '失聯') => void;
  onPress: (id: string) => void;
}) {
  const progress = useSharedValue(0);
  const isPressing = useSharedValue(false);

  const handleComplete = useCallback(() => {
    if (item.status === '此岸') {
      onStatusChange(item.id, '彼岸');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (item.status === '彼岸') {
      onStatusChange(item.id, '此岸');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [item, onStatusChange]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION)
    .onStart(() => {
      isPressing.value = true;
      progress.value = withTiming(1, { duration: LONG_PRESS_DURATION });
    })
    .onEnd((event, success) => {
      isPressing.value = false;
      if (success) {
        runOnJS(handleComplete)();
      }
      progress.value = withTiming(0, { duration: 300 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onPress)(item.id);
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const isDead = item.status === '彼岸';
    const baseOpacity = isDead ? 0.6 : 1.0;
    const currentOpacity = isPressing.value 
      ? baseOpacity - (progress.value * 0.2) 
      : baseOpacity;

    return {
      opacity: currentOpacity,
    };
  });

  const animatedNameStyle = useAnimatedStyle(() => {
    const startColor = item.status === '此岸' ? '#121212' : '#999990';
    const endColor = item.status === '此岸' ? '#999990' : '#121212';
    
    return {
      color: interpolateColor(progress.value, [0, 1], [startColor, endColor]),
      transform: [
        { scale: 1 + (progress.value * 0.02) }
      ]
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
      opacity: progress.value > 0 ? 1 : 0,
    };
  });

  const combinedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  return (
    <RNView style={styles.cardContainer}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <RNView style={styles.cardMain}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
            ) : (
              <RNView style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={20} color="#CCC" />
              </RNView>
            )}
            <RNView style={styles.cardContent}>
              <RNView style={styles.cardHeader}>
                <RNView style={styles.statusIndicator}>
                  <RNView style={[
                    styles.statusDot, 
                    item.status === '此岸' ? styles.statusDotAlive : 
                    item.status === '彼岸' ? styles.statusDotDead : 
                    styles.statusDotLost
                  ]} />
                  <Text style={[
                    styles.statusLabel,
                    item.status === '失聯' && styles.statusLabelLost
                  ]}>{item.status}</Text>
                </RNView>
                <Animated.Text style={[styles.cardName, animatedNameStyle]}>
                  {item.name}
                </Animated.Text>
              </RNView>
              <Text style={styles.cardDate}>{item.date || '未知時光'}</Text>
            </RNView>
          </RNView>
          
          <RNView style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressBarStyle]} />
          </RNView>
        </Animated.View>
      </GestureDetector>

      <TouchableOpacity 
        style={styles.editButton} 
        onPress={() => onEdit(item)}
        activeOpacity={0.6}
      >
        <Text style={styles.editText}>拂塵</Text>
      </TouchableOpacity>
    </RNView>
  );
}

function isValidISODate(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return { ok: false, msg: '請用 YYYY-MM-DD 格式' };
  const [yStr, mStr, dStr] = input.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (m < 1 || m > 12) return { ok: false, msg: '月份需在 01-12' };
  if (d < 1 || d > 31) return { ok: false, msg: '日期需在 01-31' };
  const dt = new Date(Date.UTC(y, m - 1, d));
  const y2 = dt.getUTCFullYear();
  const m2 = dt.getUTCMonth() + 1;
  const d2 = dt.getUTCDate();
  if (y !== y2 || m !== m2 || d !== d2) return { ok: false, msg: '不存在的日期' };
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (dt.getTime() > todayUTC.getTime()) return { ok: false, msg: '降生日期不能晚於今天' };
  return { ok: true as const };
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const birthDateString = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

export default function BondsPage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editingBond, setEditingBond] = useState<Bond | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'此岸' | '彼岸' | '失聯'>('此岸');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const [birthYear, setBirthYear] = useState<number>(2000);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);

  useEffect(() => {
    const maxD = daysInMonth(birthYear, birthMonth);
    if (birthDay > maxD) setBirthDay(maxD);
  }, [birthYear, birthMonth]);

  useEffect(() => {
    loadBonds();
  }, []);

  const loadBonds = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setBonds(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load bonds');
    }
  };

  const saveBonds = async (newBonds: Bond[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newBonds));
      setBonds(newBonds);
    } catch (e) {
      console.error('Failed to save bonds');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddOrEdit = () => {
    if (!name.trim()) return Alert.alert('請輸入名字');
    
    const newDate = birthDateString(birthYear, birthMonth, birthDay);
    const v = isValidISODate(newDate);
    if (!v.ok) {
      Alert.alert('日期無效', v.msg);
      return;
    }

    const newBond: Bond = {
      id: editingBond?.id || Date.now().toString(),
      name,
      status,
      date: newDate,
      description,
      imageUri,
    };

    const updatedBonds = editingBond 
      ? bonds.map(b => b.id === editingBond.id ? newBond : b)
      : [newBond, ...bonds];

    saveBonds(updatedBonds);
    closeModal();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (editingBond) {
      const updated = bonds.filter(b => b.id !== editingBond.id);
      saveBonds(updated);
      setDeleteConfirmVisible(false);
      closeModal();
    }
  };

  const handleStatusChange = (id: string, newStatus: '此岸' | '彼岸' | '失聯') => {
    const updated = bonds.map(b => b.id === id ? { ...b, status: newStatus } : b);
    saveBonds(updated);
  };

  const handleNavigateToDetail = (id: string) => {
    router.push(`/bonds/${id}`);
  };

  const openModal = (bond?: Bond) => {
    if (bond) {
      setEditingBond(bond);
      setName(bond.name);
      setStatus(bond.status);
      setDate(bond.date);
      setDescription(bond.description);
      setImageUri(bond.imageUri);

      // Parse date
      const m = bond.date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        setBirthYear(Number(m[1]));
        setBirthMonth(Number(m[2]));
        setBirthDay(Number(m[3]));
      } else {
        setBirthYear(2000);
        setBirthMonth(1);
        setBirthDay(1);
      }
    } else {
      setEditingBond(null);
      setName('');
      setStatus('此岸');
      setDate('');
      setDescription('');
      setImageUri(undefined);
      setBirthYear(2000);
      setBirthMonth(1);
      setBirthDay(1);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBond(null);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ 
          title: '羈 絆',
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
          headerShown: true,
          headerStyle: { backgroundColor: '#F5F5F0' },
          animation: 'fade',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="chevron-back" size={24} color="#121212" />
            </TouchableOpacity>
          ),
        }} />

        <FlatList
          data={bonds}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BondItem 
              item={item} 
              onDelete={handleDelete}
              onEdit={openModal}
              onStatusChange={handleStatusChange}
              onPress={handleNavigateToDetail}
            />
          )}
          ListEmptyComponent={
            <RNView style={styles.emptyContainer}>
              <Text style={styles.emptyText}>尚無任何羈絆</Text>
              <Text style={styles.emptySubtext}>點擊右下角按鈕新增那些無法割捨的聯繫</Text>
            </RNView>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
          <Text style={styles.fabText}>銘記</Text>
        </TouchableOpacity>

        <Modal visible={isModalVisible} animationType="slide" transparent={true}>
          <RNView style={styles.modalOverlay}>
            <RNView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingBond ? '修改羈絆' : '新增羈絆'}</Text>
              
              <RNView style={styles.photoSection}>
                <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                  ) : (
                    <RNView style={styles.emptyPhoto}>
                      <Ionicons name="image-outline" size={32} color="#CCC" />
                      <Text style={styles.photoLabel}>留影</Text>
                    </RNView>
                  )}
                </TouchableOpacity>
              </RNView>

              <TextInput
                style={styles.input}
                placeholder="名字"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#CCC"
              />

              <RNView style={styles.statusContainer}>
                {(['此岸', '彼岸', '失聯'] as const).map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.statusOption, status === s && styles.statusSelected]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.statusText, status === s && styles.statusTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </RNView>

              <RNView style={styles.datePickerContainer}>
                <RNView style={{ flex: 1.5 }}>
                  <Picker
                    selectedValue={birthYear}
                    onValueChange={(v: number) => setBirthYear(v)}
                    dropdownIconColor="#000"
                    style={styles.picker}
                  >
                    {Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i).map(y => (
                      <Picker.Item key={y} label={`${y}`} value={y} />
                    ))}
                  </Picker>
                </RNView>

                <RNView style={{ flex: 1 }}>
                  <Picker
                    selectedValue={birthMonth}
                    onValueChange={(v: number) => setBirthMonth(v)}
                    dropdownIconColor="#000"
                    style={styles.picker}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <Picker.Item key={m} label={`${m}月`} value={m} />
                    ))}
                  </Picker>
                </RNView>

                <RNView style={{ flex: 1 }}>
                  <Picker
                    selectedValue={birthDay}
                    onValueChange={(v: number) => setBirthDay(v)}
                    dropdownIconColor="#000"
                    style={styles.picker}
                  >
                    {Array.from({ length: daysInMonth(birthYear, birthMonth) }, (_, i) => i + 1).map(d => (
                      <Picker.Item key={d} label={`${d}日`} value={d} />
                    ))}
                  </Picker>
                </RNView>
              </RNView>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="一句描述"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#CCC"
              />

              <RNView style={styles.modalButtons}>
                <TouchableOpacity style={styles.buttonCancel} onPress={closeModal}>
                  <Text style={styles.buttonTextCancel}>留步</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.buttonSave} onPress={handleAddOrEdit}>
                  <Text style={styles.buttonTextSave}>封存</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.buttonCancel} 
                  onPress={() => editingBond && handleDelete(editingBond.id)}
                  disabled={!editingBond}
                >
                  {editingBond ? (
                    <Text style={styles.buttonTextDelete}>放下</Text>
                  ) : (
                    <RNView style={styles.buttonPlaceholder} />
                  )}
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>

        <Modal visible={isDeleteConfirmVisible} animationType="fade" transparent={true}>
          <RNView style={styles.confirmOverlay}>
            <RNView style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>放下</Text>
              <Text style={styles.confirmMessage}>
                確定要放下與「{editingBond?.name}」的這段羈絆嗎？
              </Text>
              <Text style={styles.confirmSubMessage}>
                過往種種，皆成雲煙。
              </Text>
              
              <RNView style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={styles.confirmButtonCancel} 
                  onPress={() => setDeleteConfirmVisible(false)}
                >
                  <Text style={styles.confirmButtonTextCancel}>留步</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButtonDelete} 
                  onPress={confirmDelete}
                >
                  <Text style={styles.confirmButtonTextDelete}>放下</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  listContent: {
    padding: 20,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0CA',
  },
  card: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  cardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D0D0CA',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 5,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#121212',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  cardDate: {
    fontSize: 10,
    color: '#CCC',
    letterSpacing: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusDotAlive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  statusDotDead: {
    backgroundColor: '#999990',
  },
  statusDotLost: {
    backgroundColor: '#B8860B', // 暗黃色
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  statusLabel: {
    fontSize: 11,
    color: '#999990',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 3,
    fontWeight: '300',
  },
  statusLabelLost: {
    color: '#B8860B',
  },
  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 10,
  },
  editText: {
    fontSize: 12,
    color: '#999990',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(153, 153, 144, 0.5)',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0CA',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  emptyPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    letterSpacing: 2,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DDD',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#EEE',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 40,
    backgroundColor: '#121212',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#F5F5F0',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F5F5F0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '300',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 6,
    color: '#121212',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0CA',
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 10,
    color: '#121212',
    fontWeight: '300',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  picker: {
    color: '#000',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    alignItems: 'center',
    borderRadius: 5,
  },
  statusSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
  statusTextSelected: {
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 30,
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSave: {
    flex: 2,
    backgroundColor: '#121212',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonTextCancel: {
    color: '#999990',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 2,
  },
  buttonTextSave: {
    color: '#F5F5F0',
    fontSize: 16,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 4,
  },
  buttonTextDelete: {
     color: 'rgba(255, 68, 68, 0.6)',
     fontSize: 14,
     fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
     letterSpacing: 2,
   },
   buttonPlaceholder: {
     width: 40, // 佔位寬度
   },
   progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.05)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(18, 18, 18, 0.3)',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  confirmContent: {
    backgroundColor: '#F5F5F0',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#121212',
    letterSpacing: 6,
    marginBottom: 20,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  confirmMessage: {
    fontSize: 16,
    color: '#121212',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  confirmSubMessage: {
    fontSize: 12,
    color: '#999990',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  confirmButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#D0D0CA',
  },
  confirmButtonDelete: {
    flex: 1,
    backgroundColor: '#121212',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  confirmButtonTextCancel: {
    color: '#999990',
    fontSize: 14,
    letterSpacing: 2,
  },
  confirmButtonTextDelete: {
    color: '#F5F5F0',
    fontSize: 14,
    letterSpacing: 2,
  },
});
