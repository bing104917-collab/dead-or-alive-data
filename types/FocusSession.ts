export interface FocusSession {
  /**
   * UUID
   */
  id: string;

  /**
   * Timestamp (ISO string)
   */
  startTime: string;

  /**
   * Duration in seconds
   */
  duration: number;

  /**
   * User's reflection note (optional)
   */
  userNote?: string | null;

  /**
   * AI generated philosophical insight (optional)
   */
  aiInsight?: string | null;

  /**
   * Session mode: 'silent' (no note) or 'recorded' (with note)
   */
  mode: 'silent' | 'recorded';

  /**
   * Optional tags for categorization
   */
  tags?: string[];
}
