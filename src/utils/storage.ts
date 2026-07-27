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
  streak: number;        // số lần hoàn thành liên tiếp
  totalCups: number;     // tổng cup tích lũy
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
      const d = JSON.parse(raw) as AppData;
      // Migration: thêm streak/totalCups cho data cũ
      d.challenges = d.challenges.map(c => ({
        ...c,
        streak: c.streak ?? 0,
        totalCups: c.totalCups ?? (c.isCompleted ? 1 : 0),
      }));
      return d;
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
