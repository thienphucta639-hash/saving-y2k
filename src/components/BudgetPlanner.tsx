import { useState } from 'react';
import { Bill, BudgetDraft } from '../utils/storage';
import { playClickByIndex, playInputTick, playNavigate, playBack, playY2KSuccess } from '../utils/sounds';

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];
const CATS = ['Tiền nhà / trọ','Tiền điện','Tiền nước','Wifi','Xe / Xăng','Trả góp','Trả nợ','Bảo hiểm','Điện thoại','Gửi gia đình','Tiền học','Subscription'];
let _id = Date.now();

function Ic({ src, size = 16, className = '', tap = false }: { src: string; size?: number; className?: string; tap?: boolean }) {
  return <img src={src} alt="" width={size} height={size} onClick={tap ? () => playClickByIndex(Math.floor(Math.random()*8)) : undefined}
    className={`y2k-icon inline-block ${tap ? 'cursor-pointer' : ''} ${className}`} style={{ opacity: 0.85 }} />;
}

interface Props {
  draft?: BudgetDraft;
  onSaveDraft: (d: BudgetDraft) => void;
  onDeposit: (amount: number) => void;
  onBack: () => void;
}

export default function BudgetPlanner({ draft, onSaveDraft, onDeposit, onBack }: Props) {
  const [salary, setSalary] = useState(draft?.salary || 0);
  const [salaryStr, setSalaryStr] = useState(draft?.salary ? String(draft.salary) : '');
  const [bills, setBills] = useState<Bill[]>(draft?.bills || []);
  const [spending, setSpending] = useState(draft?.spendingMoney || 0);
  const [spendingStr, setSpendingStr] = useState(draft?.spendingMoney ? String(draft.spendingMoney) : '');

  // Form states
  const [editId, setEditId] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fName, setFName] = useState('');
  const [fAmt, setFAmt] = useState('');
  const [fDay, setFDay] = useState(1);
  const [fMonth, setFMonth] = useState(0); // 0 = hàng tháng cố định, 1-12 = tháng cụ thể
  const [fRecurring, setFRecurring] = useState(true); // true = hàng tháng
  const [showCal, setShowCal] = useState(false);
  const [showCats, setShowCats] = useState(false);

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const remaining = salary - totalBills - spending;

  const saveBill = () => {
    const amt = parseInt(fAmt) || 0;
    if (!fName || amt <= 0) return;
    const month = fRecurring ? 0 : fMonth;
    if (editId) {
      setBills(bills.map(b => b.id === editId ? { ...b, name: fName, amount: amt, dueDay: fDay, dueMonth: month } : b));
    } else {
      setBills([...bills, { id: String(++_id), name: fName, amount: amt, dueDay: fDay, dueMonth: month }]);
    }
    resetForm(); playClickByIndex(4);
  };

  const resetForm = () => { setFName(''); setFAmt(''); setFDay(1); setFMonth(new Date().getMonth()+1); setFRecurring(true); setEditId(null); setShowForm(false); setShowCal(false); setShowCats(false); };

  const startEdit = (b: Bill) => {
    setFName(b.name); setFAmt(String(b.amount)); setFDay(b.dueDay);
    if (b.dueMonth === 0) { setFRecurring(true); setFMonth(new Date().getMonth()+1); }
    else { setFRecurring(false); setFMonth(b.dueMonth); }
    setEditId(b.id); setShowForm(true); playClickByIndex(3);
  };

  const doSaveDraft = () => {
    onSaveDraft({ salary, bills, spendingMoney: spending, savedAt: new Date().toISOString() });
    playNavigate(); onBack();
  };

  const doDeposit = () => {
    if (remaining <= 0) return;
    onDeposit(remaining);
    playY2KSuccess(); onBack();
  };

  const dlReceipt = () => {
    playClickByIndex(5);
    const L: string[] = ['══════════════════════════════', '       HÓA ĐƠN CHI TIÊU', '          MONEY BABY', '══════════════════════════════',
      `Ngày: ${pad(new Date().getDate())}/${pad(new Date().getMonth()+1)}/${new Date().getFullYear()} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`,
      '──────────────────────────────', `LƯƠNG:           ${fmt(salary)}`, '──────────────────────────────'];
    bills.forEach((b,i) => L.push(`${i+1}. ${b.name} (${b.dueMonth === 0 ? `ngày ${b.dueDay} hàng tháng` : `${pad(b.dueDay)}/${pad(b.dueMonth)}`}): -${fmt(b.amount)}`));
    if (spending > 0) L.push(`Tiêu vặt:        -${fmt(spending)}`);
    L.push('══════════════════════════════', `TỔNG CHI:        -${fmt(totalBills+spending)}`, `CÒN DƯ:          ${remaining>=0?'+':''}${fmt(remaining)}`, '──────────────────────────────', '        ~ MONEY BABY ~');
    const c = document.createElement('canvas'); c.width = 440; c.height = L.length * 20 + 30;
    const x = c.getContext('2d')!; x.fillStyle = '#0a0a12'; x.fillRect(0,0,c.width,c.height); x.font = '13px monospace';
    L.forEach((l,i) => { x.fillStyle = l.includes('LƯƠNG') ? '#ffd700' : l.includes('TỔNG') ? '#ff4400' : l.includes('CÒN') ? (remaining>=0?'#39ff14':'#ff2020') : l.includes('MONEY') ? '#00d4ff' : '#ccc'; x.fillText(l, 14, 20+i*20); });
    const a = document.createElement('a'); a.download = `hoa-don-${Date.now()}.png`; a.href = c.toDataURL(); a.click();
  };

  const today = new Date();

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <div className="relative z-10 p-2 sm:p-4 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => { playBack(); onBack(); }} className="btn-3d px-3 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Ic src="/images/y2k-flame.png" size={12} tap /> {'<<<'} VỀ
          </button>
          <button onClick={dlReceipt} className="btn-3d px-2 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '13px' }}>
            <Ic src="/images/y2k-star.png" size={11} /> HÓA ĐƠN
          </button>
        </div>

        {/* Header compact */}
        <div className="text-center mb-3 vhs-jitter">
          <Ic src="/images/y2k-trophy.png" size={32} className="animate-float mx-auto" tap />
          <h2 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#e8a020', lineHeight: '2' }}>QUẢN LÝ CHI TIÊU</h2>
        </div>

        {/* ===== LƯƠNG — compact ===== */}
        <div className="retro-panel p-2.5 mb-2 y2k-card tilt-1">
          <div className="flex items-center gap-2">
            <Ic src="/images/y2k-trophy.png" size={14} tap className="animate-float" />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ffd700' }}>Lương:</span>
            <input type="text" inputMode="numeric" value={salaryStr}
              onChange={e => { const v = e.target.value.replace(/\D/g,''); setSalaryStr(v); setSalary(parseInt(v)||0); playInputTick(); }}
              placeholder="Nhập lương" className="flex-1 text-center py-1" style={{ fontSize: '18px', borderColor: '#ffd70066' }} />
          </div>
          {salary > 0 && <p className="text-right" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#ffd700' }}>{fmt(salary)}</p>}
        </div>

        {/* ===== KHOẢN PHÍ — collapsible ===== */}
        <div className="retro-panel-fire p-2.5 mb-2 y2k-card tilt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ff4400' }}>
              <Ic src="/images/y2k-flame.png" size={14} tap className="animate-flame" /> Chi phí ({bills.length}):
            </span>
            {totalBills > 0 && <span className="glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#ff4400' }}>-{fmt(totalBills)}</span>}
          </div>

          {/* Bills list — compact */}
          <div className="max-h-36 overflow-y-auto space-y-0.5 mb-1.5">
            {bills.sort((a,b) => a.dueDay - b.dueDay).map(b => {
              const isMonthly = b.dueMonth === 0;
              const diff = isMonthly ? b.dueDay - today.getDate() : -999;
              const urgent = diff >= 0 && diff <= 5;
              return (
                <div key={b.id} className="flex items-center gap-1 py-1 px-1.5 rounded" style={{
                  background: urgent ? '#ffd70006' : '#ffffff03', border: urgent ? '1px solid #ffd70015' : '1px solid #ffffff06',
                }}>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#ccc' }}>{b.name} </span>
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: urgent ? '#ffd700' : '#555' }}>
                      {isMonthly ? `ngày ${b.dueDay}/tháng` : `${pad(b.dueDay)}/${pad(b.dueMonth)}`}
                      {urgent ? ` (${diff}d!)` : ''}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#ff4400' }}>{fmt(b.amount)}</span>
                  <button onClick={() => startEdit(b)} style={{ color: '#00d4ff66', cursor: 'pointer', fontSize: '12px', fontFamily: "'VT323'" }}>✎</button>
                  <button onClick={() => { setBills(bills.filter(x => x.id !== b.id)); playClickByIndex(2); }} style={{ color: '#ff202044', cursor: 'pointer', fontSize: '14px', fontFamily: "'VT323'" }}>×</button>
                </div>
              );
            })}
          </div>

          {/* Add buttons */}
          {!showForm && !showCats && (
            <div className="flex gap-1">
              <button onClick={() => { setShowCats(true); playClickByIndex(1); }} className="flex-1 py-1 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#00d4ff', border: '1px outset #00d4ff33', cursor: 'pointer' }}>+ Danh mục</button>
              <button onClick={() => { resetForm(); setShowForm(true); playClickByIndex(3); }} className="flex-1 py-1 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#39ff14', border: '1px outset #39ff1433', cursor: 'pointer' }}>+ Tự nhập</button>
            </div>
          )}

          {showCats && (
            <div className="grid grid-cols-3 gap-0.5 mb-1 animate-bounce-in">
              {CATS.filter(c => !bills.some(b => b.name === c)).map((c,i) => (
                <button key={i} onClick={() => { setFName(c); setShowCats(false); setShowForm(true); playClickByIndex(i%8); }}
                  className="py-1 px-1 rounded text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', color: '#aaa', border: '1px solid #1a1a1a', cursor: 'pointer' }}>{c}</button>
              ))}
              <button onClick={() => setShowCats(false)} className="col-span-3 py-0.5 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#555', cursor: 'pointer' }}>Hủy</button>
            </div>
          )}

          {/* Form thêm/sửa — compact */}
          {showForm && (
            <div className="p-2 rounded animate-bounce-in space-y-1" style={{ border: '1px solid #222', background: '#080812' }}>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Tên khoản" className="w-full py-1 px-2" style={{ fontSize: '15px' }} />
              <input type="text" inputMode="numeric" value={fAmt} onChange={e => { setFAmt(e.target.value.replace(/\D/g,'')); playInputTick(); }}
                placeholder="Số tiền (VNĐ)" className="w-full py-1 px-2" style={{ fontSize: '15px' }} />
              {parseInt(fAmt) > 0 && <p style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#ff4400' }}>{fmt(parseInt(fAmt))}</p>}

              {/* Loại ngày hạn */}
              <div className="flex gap-1">
                <button onClick={() => { setFRecurring(true); playClickByIndex(1); }}
                  className="flex-1 py-1 rounded text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: fRecurring ? '#ffd700' : '#555', border: `1px solid ${fRecurring ? '#ffd700' : '#222'}`, background: fRecurring ? '#ffd70008' : 'transparent', cursor: 'pointer' }}>
                  Hàng tháng
                </button>
                <button onClick={() => { setFRecurring(false); setFMonth(today.getMonth()+1); playClickByIndex(5); }}
                  className="flex-1 py-1 rounded text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: !fRecurring ? '#00d4ff' : '#555', border: `1px solid ${!fRecurring ? '#00d4ff' : '#222'}`, background: !fRecurring ? '#00d4ff08' : 'transparent', cursor: 'pointer' }}>
                  Tháng cụ thể
                </button>
              </div>

              {/* Chọn tháng (nếu không recurring) */}
              {!fRecurring && (
                <div className="flex gap-0.5 flex-wrap">
                  {MONTHS.map((m,i) => (
                    <button key={i} onClick={() => { setFMonth(i+1); playClickByIndex(i%8); }}
                      className="px-1 py-0.5 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '11px', cursor: 'pointer', color: fMonth === i+1 ? '#000' : '#777', background: fMonth === i+1 ? '#00d4ff' : 'transparent', border: fMonth === i+1 ? '1px solid #00d4ff' : '1px solid #1a1a1a' }}>{m}</button>
                  ))}
                </div>
              )}

              {/* Chọn ngày */}
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#888' }}>Ngày:</span>
                <button onClick={() => setShowCal(!showCal)} className="px-2 py-0.5 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#ffd700', border: '1px solid #ffd70044', cursor: 'pointer' }}>
                  {pad(fDay)} {showCal ? '▲' : '▼'}
                </button>
              </div>
              {showCal && (
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 31 }, (_, i) => i+1).map(d => (
                    <button key={d} onClick={() => { setFDay(d); setShowCal(false); playClickByIndex(d%8); }}
                      className="py-0.5 rounded text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', cursor: 'pointer', color: d === fDay ? '#000' : '#888', background: d === fDay ? '#ffd700' : '#0a0a15', border: d === fDay ? '1px solid #ffd700' : '1px solid #111' }}>{d}</button>
                  ))}
                </div>
              )}

              <div className="flex gap-1 pt-1">
                <button onClick={saveBill} className={`flex-1 py-1 rounded ${fName && parseInt(fAmt) > 0 ? '' : 'opacity-30'}`}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#39ff14', border: '1px solid #39ff14', cursor: 'pointer' }}>{editId ? 'CẬP NHẬT' : 'THÊM'}</button>
                <button onClick={resetForm} className="py-1 px-3 rounded" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#555', border: '1px solid #333', cursor: 'pointer' }}>HỦY</button>
              </div>
            </div>
          )}
        </div>

        {/* ===== TIÊU VẶT — inline ===== */}
        <div className="retro-panel p-2.5 mb-2 y2k-card tilt-3">
          <div className="flex items-center gap-2">
            <Ic src="/images/y2k-star.png" size={14} tap className="animate-float" />
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ff8800' }}>Tiêu vặt:</span>
            <input type="text" inputMode="numeric" value={spendingStr}
              onChange={e => { const v = e.target.value.replace(/\D/g,''); setSpendingStr(v); setSpending(parseInt(v)||0); playInputTick(); }}
              placeholder="Ăn uống, cafe..." className="flex-1 text-center py-1" style={{ fontSize: '18px', borderColor: '#ff880066' }} />
          </div>
          {spending > 0 && <p className="text-right" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#ff8800' }}>{fmt(spending)}</p>}
        </div>

        {/* ===== KẾT QUẢ + ACTIONS ===== */}
        {salary > 0 && (
          <div className="p-3 mb-3 rounded-[14px] card-enter" style={{
            background: remaining > 0 ? 'linear-gradient(135deg, #001a00, #040408)' : 'linear-gradient(135deg, #1a0000, #040408)',
            border: `3px outset ${remaining > 0 ? '#39ff14' : '#ff2020'}`,
          }}>
            {/* Tóm tắt 1 dòng */}
            <div className="flex justify-between items-center mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '15px' }}>
              <span style={{ color: '#aaa' }}>{fmt(salary)} - {fmt(totalBills + spending)} =</span>
              <span className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: remaining > 0 ? '#39ff14' : '#ff2020' }}>{remaining >= 0 ? '+' : ''}{fmt(remaining)}</span>
            </div>
            {remaining > 0 && <p className="text-center mb-2 glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#39ff14' }}>≈ {fmt(Math.round(remaining/30))}/ngày</p>}

            {/* Actions — 1 hàng */}
            <div className="flex gap-1.5">
              <button onClick={doSaveDraft} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1"
                style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#00d4ff', cursor: 'pointer', border: '2px outset #00d4ff44', background: '#00d4ff06' }}>
                <Ic src="/images/y2k-lightning.png" size={13} /> LƯU TẠM
              </button>
              {remaining > 0 && (
                <button onClick={doDeposit} className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 animate-pulse-glow"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#fff', cursor: 'pointer', background: 'linear-gradient(180deg, #ffd700aa, #ffd70044)', border: '2px outset #ffd700', textShadow: '0 0 4px #ffd700' }}>
                  <Ic src="/images/y2k-trophy.png" size={13} /> BỎ HEO {fmt(remaining)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
