import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, SafeAreaView, View as RNView, Platform, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import FocusSettlementModal from '@/components/FocusSettlementModal';
import BreathingCircle from '@/components/BreathingCircle';
import { useFocusHistory } from '@/hooks/useFocusHistory';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

const DURATIONS = [
  { label: '15m', value: 15 },
  { label: '25m', value: 25 },
  { label: '45m', value: 45 },
  { label: '自定義', value: 0 },
];

export default function FocusScreen() {
  const router = useRouter();
  
  // States
  const [selectedDuration, setSelectedDuration] = useState(25); // in minutes
  const [customDuration, setCustomDuration] = useState(25); // for the slider
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(0); 
  
  const timerRef = useRef<any>(null);
  const { saveSession } = useFocusHistory();

  // Keep screen awake only when running
  useKeepAwake(); 

  // Helper: Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Logic: Start/Pause toggle
  const toggleTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(prev => !prev);
  }, []);

  // Logic: Reset
  const resetTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    setTimeLeft((isCustomMode ? customDuration : selectedDuration) * 60);
  }, [selectedDuration, customDuration, isCustomMode]);

  // Logic: Select Preset
  const handleSelectDuration = (mins: number) => {
    if (isRunning) {
      setIsRunning(false);
    }
    Haptics.selectionAsync();
    
    if (mins === 0) {
      setIsCustomMode(true);
      setSelectedDuration(0);
      setTimeLeft(customDuration * 60);
    } else {
      setIsCustomMode(false);
      setSelectedDuration(mins);
      setTimeLeft(mins * 60);
    }
  };

  const handleCustomDurationChange = (value: number) => {
    const mins = Math.round(value);
    setCustomDuration(mins);
    if (!isRunning) {
      setTimeLeft(mins * 60);
    }
  };

  // Logic: Finish Early
  const finishEarly = useCallback(() => {
    console.log('Finish Early clicked');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Pause timer immediately
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const activeDuration = isCustomMode ? customDuration : selectedDuration;
    const elapsed = (activeDuration * 60) - timeLeft;
    setCompletedDuration(elapsed > 0 ? elapsed : 0);
    setIsModalVisible(true);
  }, [selectedDuration, customDuration, isCustomMode, timeLeft]);

  // Logic: Save Session
  const handleSaveSession = async (note: string) => {
    try {
      await saveSession({
        startTime: new Date().toISOString(),
        duration: completedDuration,
        userNote: note.trim() || null,
        mode: note.trim() ? 'recorded' : 'silent',
      });
      setIsModalVisible(false);
      resetTimer();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // Effect: Countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      const activeDuration = isCustomMode ? customDuration : selectedDuration;
      setCompletedDuration(activeDuration * 60);
      setIsModalVisible(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, selectedDuration, customDuration, isCustomMode]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <RNView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>G A Z E</Text>
        <TouchableOpacity onPress={() => router.push('/focus/history')} style={styles.historyButton}>
           <Ionicons name="time-outline" size={24} color="#333" />
        </TouchableOpacity>
      </RNView>

      <RNView style={styles.content}>
        {/* Preset Selection */}
        <RNView style={[styles.presetContainer, isRunning && styles.dimmed]}>
          {DURATIONS.map((d) => (
            <TouchableOpacity 
              key={d.label} 
              onPress={() => handleSelectDuration(d.value)}
              style={styles.presetButton}
              disabled={isRunning}
            >
              <Text style={[
                styles.presetText, 
                (selectedDuration === d.value && d.value !== 0) && styles.presetTextActive,
                (isCustomMode && d.value === 0) && styles.presetTextActive
              ]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </RNView>

        {/* Custom Duration Slider */}
        {isCustomMode && (
          <RNView style={[styles.customSliderContainer, isRunning && styles.dimmed]}>
            <Text style={styles.customDurationText}>{customDuration} 分鐘</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={120}
              step={1}
              value={customDuration}
              onValueChange={handleCustomDurationChange}
              disabled={isRunning}
              minimumTrackTintColor="#333"
              maximumTrackTintColor="#D0D0CA"
              thumbTintColor="#333"
            />
          </RNView>
        )}

        {/* Timer Display with Breathing Circle */}
        <RNView style={styles.timerContainer}>
          <BreathingCircle isRunning={isRunning} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </RNView>

        {/* Controls */}
        <RNView style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.mainButton, isRunning ? styles.mainButtonRunning : styles.mainButtonPaused]} 
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            <Text style={[styles.mainButtonText, isRunning ? styles.mainButtonTextRunning : styles.mainButtonTextPaused]}>
              {isRunning ? 'PAUSE' : 'START'}
            </Text>
          </TouchableOpacity>

          <RNView style={styles.secondaryControls}>
            {(timeLeft !== (isCustomMode ? customDuration : selectedDuration) * 60 && !isRunning) && (
              <TouchableOpacity style={styles.textButton} onPress={resetTimer}>
                <Text style={styles.textButtonLabel}>RESET</Text>
              </TouchableOpacity>
            )}

            {(isRunning) && (
              <TouchableOpacity 
                style={styles.textButton} 
                onPress={finishEarly}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.textButtonLabel}>FINISH EARLY</Text>
              </TouchableOpacity>
            )}
          </RNView>
        </RNView>
      </RNView>

      {/* Completion Modal */}
      <FocusSettlementModal
        visible={isModalVisible}
        durationSeconds={completedDuration}
        onClose={() => {
          setIsModalVisible(false);
          resetTimer();
        }}
        onSave={handleSaveSession}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },
  backButton: {
    padding: 4,
  },
  historyButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: 4,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  presetContainer: {
    flexDirection: 'row',
    marginBottom: 60,
    gap: 30,
  },
  dimmed: {
    opacity: 0.3,
  },
  presetButton: {
    padding: 10,
  },
  presetText: {
    fontSize: 16,
    color: '#AAA',
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  presetTextActive: {
    color: '#333',
    fontWeight: '500',
  },
  customSliderContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 40,
  },
  customDurationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timerContainer: {
    marginBottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 300,
  },
  timerText: {
    fontSize: 88,
    fontWeight: '200',
    color: '#111',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontVariant: ['tabular-nums'],
    zIndex: 1,
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  mainButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  mainButtonPaused: {
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  mainButtonRunning: {
    borderColor: 'transparent',
    backgroundColor: '#333',
  },
  mainButtonText: {
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: '300',
  },
  mainButtonTextPaused: {
    color: '#333',
  },
  mainButtonTextRunning: {
    color: '#F5F5F0',
  },
  secondaryControls: {
    minHeight: 44, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    zIndex: 10, // Ensure it's on top
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonLabel: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 2,
    fontWeight: '300',
  },
});
