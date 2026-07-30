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

// Hóa đơn nhận từ web khác
export interface ReceivedInvoice {
  id: string;
  from: string;        // tên web gửi (VD: "Daily Tracker")
  date: string;        // ngày nhận (ISO)
  items: { name: string; amount: number }[];
  total: number;
  note?: string;
  read: boolean;       // đã xem chưa
}

export interface AppData {
  challenges: ChallengeData[];
  activeChallengeId: string | null;
  userName: string;
  piggy: PiggyEntry[];
  draft?: BudgetDraft;
  invoices: ReceivedInvoice[];  // hóa đơn nhận từ bên ngoài
}

const STORAGE_KEY = 'y2k_savings_data';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as AppData;
      d.challenges = d.challenges.map(c => ({ ...c, streak: c.streak ?? 0, totalCups: c.totalCups ?? (c.isCompleted ? 1 : 0) }));
      if (!d.piggy) d.piggy = [];
      if (!d.invoices) d.invoices = [];
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
  return { challenges: [], activeChallengeId: null, userName: 'Tiết Kiệm Human', piggy: [], invoices: [] };
}

export function saveData(data: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error(e); }
}
