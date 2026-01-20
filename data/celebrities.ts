export type CelebrityStatus = 'alive' | 'dead';

export interface Celebrity {
  id: string;
  name: string;
  status: CelebrityStatus;
  birthDate: string; // ISO format: YYYY-MM-DD
  deathDate: string | null; // ISO format: YYYY-MM-DD or null if alive
  occupation: string;
  image: string | null;
}

// 這裡不再存放硬編碼數據，所有數據均通過 useCelebrityData 鉤子從雲端獲取
export const celebrities: Celebrity[] = [];
