import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, SafeAreaView, View as RNView, TextInput, Modal, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Bond {
  id: string;
  name: string;
  status: '此岸' | '彼岸' | '失聯';
  date: string;
  description: string;
}

const STORAGE_KEY = 'ikide_bonds_v2';

export default function BondsPage() {
  const router = useRouter();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingBond, setEditingBond] = useState<Bond | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'此岸' | '彼岸' | '失聯'>('此岸');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

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

  const handleAddOrEdit = () => {
    if (!name.trim()) return Alert.alert('請輸入名字');
    
    const newBond: Bond = {
      id: editingBond?.id || Date.now().toString(),
      name,
      status,
      date,
      description,
    };

    const updatedBonds = editingBond 
      ? bonds.map(b => b.id === editingBond.id ? newBond : b)
      : [newBond, ...bonds];

    saveBonds(updatedBonds);
    closeModal();
  };

  const handleDelete = (id: string) => {
    Alert.alert('放下', '確定要放下這段羈絆嗎？', [
      { text: '留步', style: 'cancel' },
      { text: '放下', style: 'destructive', onPress: () => {
        const updated = bonds.filter(b => b.id !== id);
        saveBonds(updated);
      }},
    ]);
  };

  const openModal = (bond?: Bond) => {
    if (bond) {
      setEditingBond(bond);
      setName(bond.name);
      setStatus(bond.status);
      setDate(bond.date);
      setDescription(bond.description);
    } else {
      setEditingBond(null);
      setName('');
      setStatus('此岸');
      setDate('');
      setDescription('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBond(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '羈 絆',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
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
          <TouchableOpacity 
            style={[styles.card, item.status === '彼岸' && styles.cardAfterlife]} 
            onLongPress={() => handleDelete(item.id)}
            onPress={() => openModal(item)}
            activeOpacity={0.7}
          >
            <RNView style={styles.cardHeader}>
              <Text style={[styles.cardName, item.status === '彼岸' && styles.textAfterlife]}>{item.name}</Text>
              <Text style={[styles.statusBadge, { color: item.status === '此岸' ? '#121212' : '#999' }]}>
                {item.status}
              </Text>
            </RNView>
            <Text style={styles.cardDate}>{item.date || '未知時光'}</Text>
            <Text style={styles.cardDesc}>{item.description || '無言'}</Text>
          </TouchableOpacity>
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

            <TextInput
              style={styles.input}
              placeholder="降生 (如 1990-01-01)"
              value={date}
              onChangeText={setDate}
              placeholderTextColor="#CCC"
            />

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
            </RNView>
          </RNView>
        </RNView>
      </Modal>
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
  listContent: {
    padding: 20,
  },
  card: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0CA',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#121212',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  statusBadge: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '300',
    color: '#999990',
  },
  cardDate: {
    fontSize: 10,
    color: '#CCC',
    marginBottom: 10,
    letterSpacing: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: '#999990',
    lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
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
    marginVertical: 15,
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
    gap: 15,
    marginTop: 20,
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonSave: {
    flex: 2,
    backgroundColor: '#000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonTextCancel: {
    color: '#999',
  },
  buttonTextSave: {
    color: '#F5F5F0',
    fontWeight: 'bold',
  },
  cardAfterlife: {
    opacity: 0.6,
    borderBottomColor: '#D0D0CA',
  },
  textAfterlife: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
});
