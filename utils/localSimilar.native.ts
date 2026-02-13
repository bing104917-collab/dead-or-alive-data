import { Asset } from 'expo-asset';
import quoteTexts from '@/components/data/quote_texts.json';
import quoteVectors from '@/components/data/quote_vectors.json';
import { encodeText } from '@/utils/bertTokenizer';

export interface SimilarQuote {
  text: string;
  score: number;
}

type Vec = number[];

type OrtModule = typeof import('onnxruntime-react-native');

const TEXTS: string[] = quoteTexts as unknown as string[];
const VECTORS: Vec[] = quoteVectors as unknown as Vec[];

let ortPromise: Promise<OrtModule> | null = null;
let sessionPromise: Promise<import('onnxruntime-react-native').InferenceSession> | null = null;

//使用ONNX 模型 → 生成句向量
const MODEL_ASSET = require('@/assets/models/sbert/model.onnx');

//和本地 quoteVectors 做余弦相似度
function cosine(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
//归一化
function l2Normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}
//指定384/768 维向量
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
    try {
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
    } catch (error) {
      const err = new Error('model asset missing');
      (err as any).code = 'MODEL_MISSING';
      throw err;
    }
    const uri = asset.localUri || asset.uri;
    if (!uri) {
      const err = new Error('model asset missing');
      (err as any).code = 'MODEL_MISSING';
      throw err;
    }
    return ort.InferenceSession.create(uri);
  })();
  return sessionPromise;
}

function isBadQuoteText(s: unknown): boolean {
  if (typeof s !== 'string') return true;
  const t = s.trim();
  if (t.length < 4) return true;
  if (/^[\W_]+$/u.test(t)) return true;
  return false;
}

export function isMeaningfulText(input: string): boolean {
  const t = input.trim();
  if (t.length < 4) return false;
  if (/^[\W_]+$/u.test(t)) return false;
  const unique = new Set(t.replace(/\s+/g, '').split(''));
  if (unique.size <= 2 && t.length >= 8) return false;
  return true;
}
//文本转换成句向量
async function embed(text: string): Promise<Vec> {
  const { inputIds, attentionMask, tokenTypeIds } = await encodeText(text, 256);
  const ort = await getOrt();
  const session = await getSession();

  const ids = BigInt64Array.from(inputIds.map((v) => BigInt(v)));
  const mask = BigInt64Array.from(attentionMask.map((v) => BigInt(v)));
  const types = BigInt64Array.from(tokenTypeIds.map((v) => BigInt(v)));
  const seqLen = inputIds.length;

  const feeds: Record<string, import('onnxruntime-react-native').Tensor> = {
    input_ids: new ort.Tensor('int64', ids, [1, seqLen]),//文字信息
    attention_mask: new ort.Tensor('int64', mask, [1, seqLen]),//分辨掩码
    token_type_ids: new ort.Tensor('int64', types, [1, seqLen]),//区分句子A和B
  };

  const results = await session.run(feeds);
  const output = results.last_hidden_state || results[Object.keys(results)[0]];
  const data = output.data as Float32Array;
  const hiddenSize = output.dims[2];
  return meanPool(data, attentionMask, hiddenSize);
}


export async function findSimilarQuotes(
  userText: string,
  topK = 3,//取最相似的3条
  minScore = 0.25
): Promise<SimilarQuote[]> {
  if (!isMeaningfulText(userText)) return [];

  const q = await embed(userText.trim());
  const scores = VECTORS.map((v, idx) => ({ idx, score: cosine(q, v) }));
  scores.sort((a, b) => b.score - a.score);

  const candidates = scores
    .filter((r) => r.score >= minScore)
    .map((r) => ({ text: TEXTS[r.idx], score: r.score }))
    .filter((x) => !isBadQuoteText(x.text));

  return candidates.slice(0, topK);
}
