import { pipeline, env } from "@xenova/transformers";
import type { Pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import quoteTexts from "@/components/data/quote_texts.json";
import quoteVectors from "@/components/data/quote_vectors.json";


//直接让@xenova/transformers库自己做
type Vec = number[];

export interface SimilarQuote {
  text: string;
  score: number;
}

let embedder: FeatureExtractionPipeline | null = null;
let loadingPromise: Promise<FeatureExtractionPipeline> | null = null;

const TEXTS: string[] = quoteTexts as unknown as string[];
const VECTORS: Vec[] = quoteVectors as unknown as Vec[];

// Configure for browser usage to avoid fs access in bundlers like Expo Web
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
// Explicit remote host/path to avoid file-system probes in the browser
env.remoteHost = "https://huggingface.co";
env.remotePathTemplate = "{model}/resolve/main";
// Reduce threading issues in browsers that don't support WASM threads
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.wasmPaths =
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
}

// lazy load model
async function getEmbedder() {
  if (embedder) return embedder;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const pl: Pipeline = (await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        quantized: true,
      })) as Pipeline;
      embedder = pl as FeatureExtractionPipeline;
      return embedder!;
    })();
  }
  return loadingPromise;
}

function cosine(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function embed(text: string): Promise<Vec> {
  const model = await getEmbedder();
  const output: any = await model(text, { pooling: "mean", normalize: true });
  // output.data is a typed array
  return Array.from(output.data as Float32Array);
}

function isBadQuoteText(s: unknown): boolean {
  if (typeof s !== 'string') return true;
  const t = s.trim();
  if (t.length < 4) return true;
  if (/^[\W_]+$/u.test(t)) return true; // 纯符号
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

export async function findSimilarQuotes(
  userText: string,
  topK = 3,
  minScore = 0.25
): Promise<SimilarQuote[]> {
  const cleaned = userText.trim();
  if (!isMeaningfulText(cleaned)) return [];

  const q = await embed(cleaned);
  const scores = VECTORS.map((v, idx) => ({ idx, score: cosine(q, v) }));
  scores.sort((a, b) => b.score - a.score);

  const candidates = scores
    .filter((r) => r.score >= minScore)
    .map((r) => ({ text: TEXTS[r.idx], score: r.score }))
    .filter((x) => !isBadQuoteText(x.text));

  return candidates.slice(0, topK);
}
