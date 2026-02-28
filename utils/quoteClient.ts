// utils/quoteClient.ts
//将来做后端API式推理可用
export interface SimilarQuote {
  text: string;
  score: number;
}

const API_BASE = 'http://localhost:8000'; // 替换为你的后端地址

export async function fetchSimilarQuotes(text: string, k = 3): Promise<SimilarQuote[]> {
  if (!text.trim()) return [];
  const res = await fetch(`${API_BASE}/similar?text=${encodeURIComponent(text)}&k=${k}`);
  if (!res.ok) throw new Error(`similar API ${res.status}`);
  return res.json();
}
