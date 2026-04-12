// Web stub: semantic similarity is disabled on web for now.
// Keep API shape to avoid breaking imports.

export interface SimilarQuote {
  text: string;
  score: number;
}

export function isMeaningfulText(input: string): boolean {
  return input.trim().length > 0;
}

export async function findSimilarQuotes(
  _userText: string,
  _topK = 3,
  _minScore = 0.25
): Promise<SimilarQuote[]> {
  return [];
}
