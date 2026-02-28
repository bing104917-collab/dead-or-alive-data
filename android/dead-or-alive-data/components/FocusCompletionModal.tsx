import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text } from './Themed';
import { useFocusHistory } from '../hooks/useFocusHistory';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideOutDown,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FocusCompletionModalProps {
  visible: boolean;
  durationSeconds: number;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

/**
 * Placeholder for AI Insight generation
 */
const generateAiInsight = async (note: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Mock insights
  const insights = [
    "此刻的安靜，是靈魂在深呼吸。",
    "專注不是一種努力，而是一場回歸。",
    "時間的厚度，取決於你投注其中的純粹。",
    "在寂靜中創造，在專注中遇見自己。",
    "每一秒的聚焦，都是對生命的一次致敬。"
  ];
  
  return insights[Math.floor(Math.random() * insights.length)];
};

export default function FocusCompletionModal({
  visible,
  durationSeconds,
  onClose,
  onSaveSuccess,
}: FocusCompletionModalProps) {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveSession } = useFocusHistory();

  const minutes = Math.floor(durationSeconds / 60);
  const displayDuration = minutes > 0 ? `${minutes} Minutes` : `${durationSeconds} Seconds`;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let aiInsight = null;
      let mode: 'silent' | 'recorded' = 'silent';

      if (note.trim()) {
        mode = 'recorded';
        aiInsight = await generateAiInsight(note);
      }

      await saveSession({
        startTime: new Date().toISOString(),
        duration: durationSeconds,
        userNote: note.trim() || null,
        aiInsight: aiInsight,
        mode: mode,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaveSuccess?.();
      onClose();
      setNote(''); // Reset for next time
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut} 
            style={StyleSheet.absoluteFillObject}
          >
            <View style={styles.backdrop} />
          </Animated.View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <Animated.View 
              entering={SlideInUp.springify().damping(15)} 
              exiting={SlideOutDown}
              style={styles.modalContent}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Time Condensed</Text>
                <Text style={styles.durationText}>{displayDuration}</Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="此刻的心流..."
                  placeholderTextColor="#AAA"
                  multiline
                  value={note}
                  onChangeText={setNote}
                  autoFocus
                />
              </View>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[styles.button, note.trim() ? styles.buttonActive : styles.buttonSilent]} 
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={note.trim() ? "#FFF" : "#666"} />
                  ) : (
                    <Text style={[styles.buttonText, note.trim() ? styles.buttonTextActive : styles.buttonTextSilent]}>
                      {note.trim() ? "銘記此刻" : "無聲歸檔"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onClose}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>放棄記錄</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#F9F9F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 8,
  },
  durationText: {
    fontSize: 32,
    fontWeight: '200',
    color: '#111',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  inputContainer: {
    flex: 1,
    minHeight: 120,
    marginBottom: 24,
  },
  input: {
    fontSize: 18,
    color: '#444',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlignVertical: 'top',
    lineHeight: 28,
  },
  footer: {
    gap: 12,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonActive: {
    backgroundColor: '#2C2C2C',
  },
  buttonSilent: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '400',
  },
  buttonTextActive: {
    color: '#FFF',
  },
  buttonTextSilent: {
    color: '#666',
  },
  cancelButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#999',
    letterSpacing: 1,
  },
});
