import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { classifyTimelineLabel, type TimelineLabel } from '@/utils/timelineLabelClassifier';

const { width } = Dimensions.get('window');

type NodeCategory = TimelineLabel;

type TimelineNode = {
  id: string;
  title: string;
  time: Date;
  category: NodeCategory;
  source: 'ai' | 'manual';
};

const DAY_WINDOW = 3;
const CHART_HEIGHT = 360;
const CHART_LEFT = 56;
const CHART_RIGHT = 16;
const CHART_TOP = 20;
const CHART_BOTTOM = 32;

const CATEGORY_META: Record<NodeCategory, { label: string; icon: string; color: string }> = {
  work: { label: '工作', icon: 'briefcase-outline', color: '#60A5FA' },
  study: { label: '学习', icon: 'book-open-page-variant', color: '#34D399' },
  life: { label: '生活', icon: 'coffee-outline', color: '#FBBF24' },
};

const CATEGORY_IMAGE: Record<NodeCategory, any> = {
  work: require('@/assets/images/timeline-work.png'),
  study: require('@/assets/images/timeline-study.png'),
  life: require('@/assets/images/timeline-life.png'),
};

const DEFAULT_DATE = new Date();
const STORAGE_KEY = 'timeline_nodes_v1';

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date) {
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${m}/${d}`;
}

function clampHour(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(23, value));
}

function parseTimeFromText(text: string, baseDate: Date) {
  let date = new Date(baseDate);
  let foundDate = false;
  let foundTime = false;

  const normalized = text.replace(/\s+/g, '');

  if (normalized.includes('大后天')) {
    date.setDate(date.getDate() + 3);
    foundDate = true;
  } else if (normalized.includes('后天')) {
    date.setDate(date.getDate() + 2);
    foundDate = true;
  } else if (normalized.includes('明天')) {
    date.setDate(date.getDate() + 1);
    foundDate = true;
  } else if (normalized.includes('今天')) {
    foundDate = true;
  }

  const explicitDate = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (explicitDate) {
    const y = Number(explicitDate[1]);
    const m = Number(explicitDate[2]) - 1;
    const d = Number(explicitDate[3]);
    const next = new Date(date);
    next.setFullYear(y, m, d);
    date = next;
    foundDate = true;
  } else {
    const md = normalized.match(/(\d{1,2})月(\d{1,2})日/);
    if (md) {
      const m = Number(md[1]) - 1;
      const d = Number(md[2]);
      const next = new Date(date);
      next.setMonth(m, d);
      date = next;
      foundDate = true;
    }
  }

  const timeMatch = normalized.match(/(\d{1,2})(?:[:点时h])(?:(\d{1,2}))?/);
  if (timeMatch) {
    let hour = clampHour(Number(timeMatch[1]));
    const period = normalized.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上)/);
    if (period) {
      const p = period[1];
      if ((p === '下午' || p === '晚上' || p === '傍晚') && hour < 12) hour += 12;
      if (p === '中午' && hour < 11) hour += 12;
      if (p === '凌晨' && hour === 12) hour = 0;
    }
    date.setHours(hour, 0, 0, 0);
    foundTime = true;
  }

  return { date, foundDate, foundTime };
}

async function classifyNodeWithAI(text: string): Promise<NodeCategory> {
  const { label } = await classifyTimelineLabel(text);
  return label;
}

function buildNodeTitle(text: string) {
  return text.trim() || '未命名节点';
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayDiff(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function usePulse() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  return useAnimatedStyle(() => {
    const scale = 1 + 0.08 * pulse.value;
    const opacity = 0.7 + 0.3 * pulse.value;
    return { transform: [{ scale }], opacity };
  });
}

function seedNodes() {
  const today = new Date();
  today.setMinutes(0, 0, 0);
  const meeting = new Date(today);
  meeting.setDate(meeting.getDate() + 1);
  meeting.setHours(15, 0, 0, 0);
  const deadline = new Date(today);
  deadline.setHours(20, 0, 0, 0);
  const idea = new Date(today);
  idea.setHours(10, 0, 0, 0);

  return [
    { id: 'seed-1', title: '明天下午三点开会', time: meeting, category: 'work', source: 'ai' },
    { id: 'seed-2', title: '提交版本回顾', time: deadline, category: 'work', source: 'manual' },
    { id: 'seed-3', title: '灵感收集：新叙事结构', time: idea, category: 'study', source: 'manual' },
  ];
}

export default function TimelineScreen() {
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const [inputText, setInputText] = useState('');
  const [dateText, setDateText] = useState(formatDate(DEFAULT_DATE));
  const [hourText, setHourText] = useState(DEFAULT_DATE.getHours().toString().padStart(2, '0'));
  const [isAdding, setIsAdding] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Array<Omit<TimelineNode, 'time'> & { time: string }>;
          const restored = parsed.map((n) => ({ ...n, time: new Date(n.time) }));
          setNodes(restored);
        } else {
          setNodes(seedNodes());
        }
      } catch (error) {
        setNodes(seedNodes());
      } finally {
        setHydrated(true);
      }
    };

    loadNodes();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const persist = async () => {
      try {
        const payload = nodes.map((n) => ({ ...n, time: n.time.toISOString() }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (error) {
        // ignore persistence errors
      }
    };

    persist();
  }, [nodes, hydrated]);

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [nodes]);

  const selectedPulse = usePulse();
  const windowDates = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: DAY_WINDOW * 2 + 1 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i - DAY_WINDOW);
      return d;
    });
  }, []);

  const windowStart = windowDates[0];
  const windowEnd = new Date(windowDates[windowDates.length - 1]);
  windowEnd.setHours(23, 59, 59, 999);

  const windowNodes = useMemo(() => {
    return sortedNodes.filter((n) => n.time >= windowStart && n.time <= windowEnd);
  }, [sortedNodes, windowStart, windowEnd]);

  const selectedNode = windowNodes.find((n) => n.id === selectedId) || null;

  const chartWidth = width - 32;
  const chartInnerWidth = chartWidth - CHART_LEFT - CHART_RIGHT;
  const chartInnerHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;

  const getPoint = (time: Date) => {
    const idx = dayDiff(time, windowStart);
    const x = CHART_LEFT + (idx / (windowDates.length - 1)) * chartInnerWidth;
    const hour = time.getHours() + time.getMinutes() / 60;
    const y = CHART_TOP + (1 - hour / 24) * chartInnerHeight;
    return { x, y };
  };

  const handleAddNode = async () => {
    if (!inputText.trim()) return;
    setIsAdding(true);

    const baseDate = new Date();
    const manualDate = new Date(baseDate);
    const manualDateMatch = dateText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (manualDateMatch) {
      manualDate.setFullYear(Number(manualDateMatch[1]), Number(manualDateMatch[2]) - 1, Number(manualDateMatch[3]));
    }
    const manualHour = clampHour(Number(hourText));
    manualDate.setHours(manualHour, 0, 0, 0);

    const parsed = parseTimeFromText(inputText, manualDate);
    const finalTime = parsed.foundTime || parsed.foundDate ? parsed.date : manualDate;

    const category = await classifyNodeWithAI(inputText);

    const newNode: TimelineNode = {
      id: `${Date.now()}`,
      title: buildNodeTitle(inputText),
      time: finalTime,
      category,
      source: 'ai',
    };

    setNodes((prev) => [...prev, newNode]);
    setInputText('');
    setIsAdding(false);
  };

  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  const startEditing = (node: TimelineNode) => {
    setEditingId(node.id);
    setEditingText(node.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEditing = () => {
    if (!editingId) return;
    const nextTitle = editingText.trim();
    setNodes((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, title: nextTitle || n.title } : n))
    );
    cancelEditing();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.backgroundLayer} />
      <View style={styles.backgroundGlow} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <MaterialCommunityIcons name="history" size={14} color="#F4F1DE" />
            <Text style={styles.historyButtonText}>历史记录</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>时间轴控制台</Text>
        <Text style={styles.subtitle}>将自然语言转化为可视节点</Text>
      </View>

      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="sparkles" size={18} color="#F4D58D" />
          <Text style={styles.inputLabel}>时间轴创建</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="例：明天下午三点开会"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={inputText}
          onChangeText={setInputText}
        />
        <View style={styles.manualRow}>
          <View style={styles.manualField}>
            <Text style={styles.manualLabel}>日期</Text>
            <TextInput
              style={styles.manualInput}
              value={dateText}
              onChangeText={setDateText}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>
          <View style={styles.manualField}>
            <Text style={styles.manualLabel}>小时</Text>
            <TextInput
              style={styles.manualInput}
              value={hourText}
              onChangeText={setHourText}
              placeholder="00-23"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNode} disabled={isAdding}>
            {isAdding ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.addButtonText}>创建节点</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.tipRow}>
          <Text style={styles.tipText}>支持：今天 / 明天 / 后天 / 具体日期 / 上午下午</Text>
        </View>
      </View>

      <ScrollView style={styles.timelineContainer} contentContainerStyle={styles.timelineContent}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>时间折线图</Text>
            <Text style={styles.chartHint}>仅显示当前日前后三天</Text>
          </View>

          <View style={[styles.chartArea, { width: chartWidth, height: CHART_HEIGHT }]}>
            {[0, 6, 12, 18, 24].map((h) => {
              const y = CHART_TOP + (1 - h / 24) * chartInnerHeight;
              return (
                <View key={h} style={[styles.gridLine, { top: y }]}>
                  <Text style={styles.yAxisLabel}>{`${h.toString().padStart(2, '0')}:00`}</Text>
                </View>
              );
            })}

            {windowNodes.map((node, idx) => {
              if (idx === windowNodes.length - 1) return null;
              const next = windowNodes[idx + 1];
              const p1 = getPoint(node.time);
              const p2 = getPoint(next.time);
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              return (
                <View
                  key={`${node.id}-line`}
                  style={[
                    styles.lineSegment,
                    {
                      left: midX - length / 2,
                      top: midY,
                      width: length,
                      transform: [{ rotateZ: `${angle}rad` }],
                    },
                  ]}
                />
              );
            })}

            {windowNodes.map((node) => {
              const meta = CATEGORY_META[node.category];
              const { x, y } = getPoint(node.time);
              const isSelected = selectedId === node.id;
              return (
                <TouchableOpacity
                  key={node.id}
                  style={[styles.point, { left: x - 8, top: y - 8, borderColor: meta.color }]}
                  onPress={() => setSelectedId(node.id)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.pointInner,
                      { backgroundColor: meta.color },
                      isSelected ? selectedPulse : null,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.xAxisRow}>
            {windowDates.map((d) => (
              <Text key={d.toISOString()} style={styles.xAxisLabel}>
                {formatDayLabel(d)}
              </Text>
            ))}
          </View>
        </View>

        {selectedNode ? (
          <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.detailCard}>
            <View style={styles.nodeHeader}>
              <View style={[styles.nodeIconWrap, { backgroundColor: CATEGORY_META[selectedNode.category].color }]}>
                <Image source={CATEGORY_IMAGE[selectedNode.category]} style={styles.nodeIconImage} />
              </View>
              {editingId === selectedNode.id ? (
                <TextInput
                  style={styles.nodeTitleInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  placeholder="修改节点内容"
                  placeholderTextColor="rgba(244,241,222,0.5)"
                />
              ) : (
                <Text style={styles.nodeTitle} numberOfLines={2}>{selectedNode.title}</Text>
              )}
              <View style={styles.nodeBadge}>
                <Text style={styles.nodeBadgeText}>{CATEGORY_META[selectedNode.category].label}</Text>
              </View>
            </View>
            <View style={styles.nodeActions}>
              {editingId === selectedNode.id ? (
                <>
                  <TouchableOpacity style={styles.nodeActionBtn} onPress={saveEditing}>
                    <MaterialCommunityIcons name="check" size={14} color="#CFE3FF" />
                    <Text style={styles.nodeActionText}>保存</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nodeActionBtn} onPress={cancelEditing}>
                    <MaterialCommunityIcons name="close" size={14} color="#F2CC8F" />
                    <Text style={styles.nodeActionText}>取消</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.nodeActionBtn} onPress={() => startEditing(selectedNode)}>
                    <MaterialCommunityIcons name="pencil-outline" size={14} color="#CFE3FF" />
                    <Text style={styles.nodeActionText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nodeActionBtn} onPress={() => handleDeleteNode(selectedNode.id)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="#F6A6A6" />
                    <Text style={styles.nodeActionText}>删除</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nodeActionBtn} onPress={() => setSelectedId(null)}>
                    <MaterialCommunityIcons name="close-circle-outline" size={14} color="#A3A3A3" />
                    <Text style={styles.nodeActionText}>关闭</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={styles.detailMetaRow}>
              <Text style={styles.nodeTime}>{formatDate(selectedNode.time)} {selectedNode.time.getHours().toString().padStart(2, '0')}:00</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cursor-default-click-outline" size={28} color="#555" />
            <Text style={styles.emptyText}>点击折线点查看详情</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showHistory} transparent animationType="fade" onRequestClose={() => setShowHistory(false)}>
        <View style={styles.historyOverlay}>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>历史记录</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#F4F1DE" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList} contentContainerStyle={styles.historyListContent}>
              {sortedNodes.length ? (
                sortedNodes.map((node) => (
                  <View key={`history-${node.id}`} style={styles.historyRow}>
                    <Text style={styles.historyText}>{node.title}</Text>
                    <Text style={styles.historyTime}>
                      {formatDate(node.time)} {node.time.getHours().toString().padStart(2, '0')}:00
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.historyEmpty}>暂无记录</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C0C10',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0C0C10',
  },
  backgroundGlow: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width,
    backgroundColor: 'rgba(88, 99, 255, 0.12)',
    top: -width * 0.6,
    right: -width * 0.2,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(244,241,222,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  historyButtonText: {
    color: '#F4F1DE',
    fontSize: 11,
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F4F1DE',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(244,241,222,0.65)',
    marginTop: 6,
  },
  inputCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 24, 34, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    color: '#F4D58D',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#F4F1DE',
    fontSize: 16,
  },
  manualRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  manualField: {
    flex: 1,
  },
  manualLabel: {
    color: 'rgba(244,241,222,0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  manualInput: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#F4F1DE',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F4D58D',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 92,
  },
  addButtonText: {
    color: '#0B0B0B',
    fontWeight: '600',
  },
  tipRow: {
    marginTop: 10,
  },
  tipText: {
    color: 'rgba(244,241,222,0.45)',
    fontSize: 12,
  },
  timelineContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  timelineContent: {
    paddingBottom: 40,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#F4F1DE',
    fontSize: 16,
    fontWeight: '600',
  },
  chartHint: {
    color: 'rgba(244,241,222,0.55)',
    fontSize: 11,
  },
  chartArea: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  yAxisLabel: {
    position: 'absolute',
    left: 0,
    top: -8,
    color: 'rgba(244,241,222,0.5)',
    fontSize: 10,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(244,241,222,0.4)',
    borderRadius: 2,
    pointerEvents: 'none',
  },
  point: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0C10',
  },
  pointInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxisRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: CHART_LEFT,
    paddingRight: CHART_RIGHT,
  },
  xAxisLabel: {
    color: 'rgba(244,241,222,0.6)',
    fontSize: 10,
  },
  detailCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeIconImage: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  nodeTitle: {
    flex: 1,
    color: '#F4F1DE',
    fontSize: 15,
    fontWeight: '600',
  },
  nodeTitleInput: {
    flex: 1,
    color: '#F4F1DE',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  nodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  nodeBadgeText: {
    color: '#E5E1FF',
    fontSize: 11,
  },
  detailMetaRow: {
    marginTop: 10,
  },
  nodeActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 12,
  },
  nodeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  nodeActionText: {
    color: 'rgba(244,241,222,0.8)',
    fontSize: 12,
  },
  nodeTime: {
    color: 'rgba(244,241,222,0.7)',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  emptyText: {
    color: 'rgba(244,241,222,0.55)',
  },
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  historyCard: {
    backgroundColor: '#14141A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '70%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    color: '#F4F1DE',
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    maxHeight: '100%',
  },
  historyListContent: {
    gap: 12,
    paddingBottom: 4,
  },
  historyRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyText: {
    color: '#F4F1DE',
    fontSize: 14,
    marginBottom: 6,
  },
  historyTime: {
    color: 'rgba(244,241,222,0.6)',
    fontSize: 11,
  },
  historyEmpty: {
    color: 'rgba(244,241,222,0.6)',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
