export type TimelineLabel = 'work' | 'study' | 'life';

const KEYWORDS: Record<TimelineLabel, string[]> = {
  work: ['工作', '开会', '会议', '汇报', '项目', '客户', '需求', '任务', '排期', '对接'],
  study: ['学习', '复习', '作业', '考试', '阅读', '课程', '练习', '背诵', '论文', '笔记'],
  life: ['生活', '运动', '健身', '购物', '出行', '家人', '朋友', '休闲', '旅行', '聚会'],
};

function isMeaningfulText(input: string): boolean {
  const t = input.trim();
  if (t.length < 2) return false;
  if (/^[\W_]+$/u.test(t)) return false;
  return true;
}

function scoreByKeywords(text: string, keywords: string[]): number {
  let score = 0;
  for (const key of keywords) {
    if (text.includes(key)) score += 1;
  }
  return score;
}

export async function classifyTimelineLabel(
  userText: string
): Promise<{ label: TimelineLabel; score: number }> {
  const cleaned = userText.trim();
  if (!isMeaningfulText(cleaned)) return { label: 'life', score: 0 };

  const scores = (Object.keys(KEYWORDS) as TimelineLabel[]).map((label) => ({
    label,
    score: scoreByKeywords(cleaned, KEYWORDS[label]),
  }));

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score === 0) return { label: 'life', score: 0 };
  return { label: best.label, score: best.score };
}
