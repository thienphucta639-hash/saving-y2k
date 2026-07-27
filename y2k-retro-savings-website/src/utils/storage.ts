export interface ChallengeData {
  id: string;
  name: string;
  type: string;
  totalDays: number;
  completedDays: boolean[];
  totalTarget: number;
  startDate: string;
  isActive: boolean;
  isCompleted: boolean;
}

export interface AppData {
  challenges: ChallengeData[];
  activeChallengeId: string | null;
  userName: string;
}

const STORAGE_KEY = 'y2k_savings_data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  return {
    challenges: [],
    activeChallengeId: null,
    userName: 'Tiết Kiệm Human',
  };
}

export function saveData(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data', e);
  }
}
