import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text } from './Themed';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';

interface FocusSettlementModalProps {
  visible: boolean;
  durationSeconds: number;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function FocusSettlementModal({
  visible,
  durationSeconds,
  onClose,
  onSave,
}: FocusSettlementModalProps) {
  const [note, setNote] = useState('');

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeStr = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(note);
    setNote('');
  };

  const handleDiscard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut} 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
          />
        </TouchableWithoutFeedback>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View 
            entering={SlideInUp} 
            exiting={SlideOutDown}
            style={styles.content}
          >
            <Text style={styles.title}>專注結束</Text>
            <Text style={styles.subtitle}>你專注了 {timeStr}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="此刻的心流..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
              autoFocus={false}
            />
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
                <Text style={styles.discardText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Record</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#F5F5F0',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  input: {
    width: '100%',
    minHeight: 80,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  discardButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#333',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  discardText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
