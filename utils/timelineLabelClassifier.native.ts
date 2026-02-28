import { Asset } from 'expo-asset';
import { encodeText } from '@/utils/bertTokenizer';

export type TimelineLabel = 'work' | 'study' | 'life';

type Vec = number[];

const LABEL_ANCHORS: Record<TimelineLabel, string[]> = {
  work: ['工作', '项目推进', '汇报会议', '客户沟通', '任务清单', '日报周报'],
  study: ['学习', '复习', '阅读教材', '写作业', '考试', '练习题'],
  life: ['生活', '运动健身', '购物', '出行', '家人朋友', '休闲娱乐'],
};

type OrtModule = typeof import('onnxruntime-react-native');

let ortPromise: Promise<OrtModule> | null = null;
let sessionPromise: Promise<import('onnxruntime-react-native').InferenceSession> | null = null;
let labelVecPromise: Promise<Record<TimelineLabel, Vec>> | null = null;

const MODEL_ASSET = require('../assets/models/sbert/model.onnx');

function cosine(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function l2Normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

function meanPool(hidden: Float32Array, attentionMask: number[], hiddenSize: number): number[] {
  const seqLen = attentionMask.length;
  const out = new Array(hiddenSize).fill(0);
  let count = 0;

  for (let i = 0; i < seqLen; i++) {
    if (!attentionMask[i]) continue;
    count += 1;
    const offset = i * hiddenSize;
    for (let j = 0; j < hiddenSize; j++) {
      out[j] += hidden[offset + j];
    }
  }

  if (count > 0) {
    for (let j = 0; j < hiddenSize; j++) out[j] /= count;
  }

  return l2Normalize(out);
}

function averageVec(vectors: Vec[]): Vec {
  if (!vectors.length) return [];
  const out = new Array(vectors[0].length).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < v.length; i++) out[i] += v[i];
  }
  for (let i = 0; i < out.length; i++) out[i] /= vectors.length;
  return l2Normalize(out);
}

function isMeaningfulText(input: string): boolean {
  const t = input.trim();
  if (t.length < 2) return false;
  if (/^[\W_]+$/u.test(t)) return false;
  const unique = new Set(t.replace(/\s+/g, '').split(''));
  if (unique.size <= 2 && t.length >= 8) return false;
  return true;
}

async function getOrt(): Promise<OrtModule> {
  if (!ortPromise) {
    ortPromise = import('onnxruntime-react-native');
  }
  return ortPromise;
}

async function getSession() {
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    const ort = await getOrt();
    const asset = Asset.fromModule(MODEL_ASSET);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri || asset.uri;
    if (!uri) throw new Error('model asset missing');
    return ort.InferenceSession.create(uri);
  })();
  return sessionPromise;
}

async function embed(text: string): Promise<Vec> {
  const { inputIds, attentionMask, tokenTypeIds } = await encodeText(text, 256);
  const ort = await getOrt();
  const session = await getSession();

  const ids = BigInt64Array.from(inputIds.map((v) => BigInt(v)));
  const mask = BigInt64Array.from(attentionMask.map((v) => BigInt(v)));
  const types = BigInt64Array.from(tokenTypeIds.map((v) => BigInt(v)));
  const seqLen = inputIds.length;

  const feeds: Record<string, import('onnxruntime-react-native').Tensor> = {
    input_ids: new ort.Tensor('int64', ids, [1, seqLen]),
    attention_mask: new ort.Tensor('int64', mask, [1, seqLen]),
    token_type_ids: new ort.Tensor('int64', types, [1, seqLen]),
  };

  const results = await session.run(feeds);
  const output = results.last_hidden_state || results[Object.keys(results)[0]];
  const data = output.data as Float32Array;
  const hiddenSize = output.dims[2];
  return meanPool(data, attentionMask, hiddenSize);
}

async function getLabelVectors(): Promise<Record<TimelineLabel, Vec>> {
  if (labelVecPromise) return labelVecPromise;
  labelVecPromise = (async () => {
    const entries = await Promise.all(
      (Object.keys(LABEL_ANCHORS) as TimelineLabel[]).map(async (label) => {
        const vectors = await Promise.all(LABEL_ANCHORS[label].map((t) => embed(t)));
        return [label, averageVec(vectors)] as const;
      })
    );
    return entries.reduce((acc, [label, vec]) => {
      acc[label] = vec;
      return acc;
    }, {} as Record<TimelineLabel, Vec>);
  })();
  return labelVecPromise;
}

export async function classifyTimelineLabel(
  userText: string
): Promise<{ label: TimelineLabel; score: number }> {
  const cleaned = userText.trim();
  if (!isMeaningfulText(cleaned)) return { label: 'life', score: 0 };

  const q = await embed(cleaned);
  const labelVecs = await getLabelVectors();
  let bestLabel: TimelineLabel = 'life';
  let bestScore = -Infinity;

  (Object.keys(labelVecs) as TimelineLabel[]).forEach((label) => {
    const score = cosine(q, labelVecs[label]);
    if (score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  });

  return { label: bestLabel, score: bestScore };
}
