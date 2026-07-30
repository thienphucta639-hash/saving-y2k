export interface ChallengeData {
  id: string; name: string; type: string; totalDays: number;
  completedDays: boolean[]; totalTarget: number; startDate: string;
  isActive: boolean; isCompleted: boolean; streak: number; totalCups: number;
}

export interface Bill {
  id: string; name: string; amount: number;
  dueDay: number; dueMonth: number; // 1-31, 1-12
}

export interface PiggyEntry {
  id: string; amount: number; date: string; type: 'deposit' | 'withdraw'; reason?: string;
}

export interface BudgetDraft {
  salary: number; bills: Bill[]; spendingMoney: number; savedAt: string;
}

export interface AppData {
  challenges: ChallengeData[];
  activeChallengeId: string | null;
  userName: string;
  piggy: PiggyEntry[];    // con heo = global, không nằm trong budget
  draft?: BudgetDraft;    // bản nháp chi tiêu
}

const STORAGE_KEY = 'y2k_savings_data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as AppData;
      d.challenges = d.challenges.map(c => ({ ...c, streak: c.streak ?? 0, totalCups: c.totalCups ?? (c.isCompleted ? 1 : 0) }));
      if (!d.piggy) d.piggy = [];
      // migrate old budget to draft
      if ((d as any).budget) {
        const b = (d as any).budget;
        if (!d.draft && b.salary > 0) {
          d.draft = { salary: b.salary, bills: b.bills || [], spendingMoney: b.spendingMoney || 0, savedAt: new Date().toISOString() };
        }
        if (!d.piggy.length && b.piggy) d.piggy = b.piggy;
        delete (d as any).budget;
      }
      return d;
    }
  } catch (e) { console.error(e); }
  return { challenges: [], activeChallengeId: null, userName: 'Tiết Kiệm Human', piggy: [] };
}

export function saveData(data: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
}
