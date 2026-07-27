import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData, AppData, ChallengeData } from './utils/storage';
import { playY2KSuccess, playY2KClick, playY2KWin } from './utils/sounds';

interface ChallengeTemplate {
  id: string; name: string; desc: string; icon: string; type: string;
  defaultDays: number; getDayAmount: (day: number, totalDays: number) => number;
  color: string; canEditAmount: boolean;
}

const CHALLENGES: ChallengeTemplate[] = [
  { id: '365day', name: '365 NGÀY CHINH PHỤC', desc: 'Tăng dần mỗi ngày! Ngày 1 = 1k, Ngày 2 = 2k...', icon: '/images/y2k-flame.png', type: 'incremental', defaultDays: 365, getDayAmount: (d) => d * 1000, color: '#ff4400', canEditAmount: false },
  { id: '52week', name: '52 TUẦN THÉP', desc: 'Tuần 1 = 10k, tuần 2 = 20k... Mỗi tuần tăng!', icon: '/images/y2k-lightning.png', type: 'weekly', defaultDays: 52, getDayAmount: (w) => w * 10000, color: '#00d4ff', canEditAmount: false },
  { id: 'countdown30', name: '30 NGÀY ĐẾM NGƯỢC', desc: 'Từ cao giảm dần! Bắt đầu mạnh, về đích nhẹ~', icon: '/images/y2k-skull.png', type: 'countdown', defaultDays: 30, getDayAmount: (d, t) => (t - d + 1) * 1000, color: '#c0c0c0', canEditAmount: false },
  { id: 'double14', name: '14 NGÀY NHÂN ĐÔI', desc: '1k > 2k > 4k > 8k... Nhân đôi mỗi ngày!', icon: '/images/y2k-dragon.png', type: 'double', defaultDays: 14, getDayAmount: (d) => Math.pow(2, d - 1) * 1000, color: '#39ff14', canEditAmount: false },
  { id: 'random30', name: '30 NGÀY MAY RỦI', desc: 'Quay vòng xoay số phận mỗi ngày!', icon: '/images/y2k-star.png', type: 'random', defaultDays: 30, getDayAmount: () => [5000, 10000, 15000, 20000, 25000, 30000, 50000, 2000, 8000, 12000][Math.floor(Math.random() * 10)], color: '#ffd700', canEditAmount: false },
  { id: 'fixed90', name: '90 NGÀY KỶ LUẬT', desc: 'Mỗi ngày đúng 1 số tiền cố định. Tự chọn!', icon: '/images/y2k-lightning.png', type: 'fixed', defaultDays: 90, getDayAmount: () => 20000, color: '#00aaff', canEditAmount: true },
  { id: 'step7', name: '7 NGÀY BÃO TỐ', desc: '7 ngày tăng dã man: 5k>10k>20k>50k>100k>200k>500k!', icon: '/images/y2k-flame.png', type: 'steps', defaultDays: 7, getDayAmount: (d) => [5000, 10000, 20000, 50000, 100000, 200000, 500000][d - 1] || 5000, color: '#ff2020', canEditAmount: false },
  { id: 'payday', name: '12 THÁNG ĐẠI CHIẾN', desc: 'Mỗi tháng 1 số tiền cố định. Tự chọn!', icon: '/images/y2k-dragon.png', type: 'monthly', defaultDays: 12, getDayAmount: () => 500000, color: '#22cc88', canEditAmount: true },
];

const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const getTemplate = (id: string) => CHALLENGES.find(c => c.id === id);

// ===== Y2K ICON =====
function Ic({ src, size = 40, className = '', glitch = false }: { src: string; size?: number; className?: string; glitch?: boolean }) {
  return <img src={src} alt="" width={size} height={size} className={`y2k-icon inline-block ${glitch ? 'y2k-icon-glitch' : ''} ${className}`} style={{ opacity: 0.85 }} />;
}

// ===== FLOATING BG =====
function FloatingIcons() {
  const all = ['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png', '/images/y2k-trophy.png'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {all.map((ic, i) => (
        <img key={i} src={ic} alt="" className="absolute y2k-icon" style={{ width: 20 + i * 7, height: 20 + i * 7, opacity: 0.045, left: `${5 + i * 16}%`, top: `${5 + (i % 3) * 30}%`, animation: `float-y2k ${3 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`, filter: 'blur(0.3px)' }} />
      ))}
    </div>
  );
}

// ===== MARQUEE =====
function Marquee() {
  return (
    <div className="overflow-hidden py-0.5" style={{ background: 'linear-gradient(90deg, #ff2020, #ff8800, #ffd700, #39ff14, #00d4ff, #ff2020)', borderTop: '2px solid #333', borderBottom: '2px solid #333' }}>
      <div className="animate-marquee whitespace-nowrap flex items-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#000', fontWeight: 'bold' }}>
        <Ic src="/images/y2k-lightning.png" size={13} /> TIẾT KIỆM LÀ SỨC MẠNHH
        <Ic src="/images/y2k-flame.png" size={13} /> ĐỪNG BỎ CUỘC BRO
        <Ic src="/images/y2k-star.png" size={13} /> MONEY MONEY MONEYY
        <Ic src="/images/y2k-skull.png" size={13} /> GOM TỪNG ĐỒNGG
        <Ic src="/images/y2k-dragon.png" size={13} /> LVL UP MỖI NGÀYY
        <Ic src="/images/y2k-trophy.png" size={13} /> CHIẾN BINH TIẾT KIỆM
        <Ic src="/images/y2k-star.png" size={13} />
      </div>
    </div>
  );
}

// ===== LUCKY WHEEL =====
function LuckyWheel({ onResult, amounts }: { onResult: (a: number) => void; amounts: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rot, setRot] = useState(0);
  const n = amounts.length;
  const cols = ['#ff2020', '#00d4ff', '#ffd700', '#39ff14', '#ff8800', '#c0c0c0', '#00aaff', '#ff4400', '#22cc88', '#9944ff'];

  useEffect(() => { draw(rot); }, [rot]);

  const draw = (r: number) => {
    const c = ref.current; if (!c) return; const x = c.getContext('2d'); if (!x) return;
    const s = c.width, ct = s / 2, rd = ct - 8, ap = (2 * Math.PI) / n;
    x.clearRect(0, 0, s, s);
    x.beginPath(); x.arc(ct, ct, rd + 4, 0, 2 * Math.PI); x.strokeStyle = '#333'; x.lineWidth = 3; x.stroke();
    for (let i = 0; i < n; i++) {
      const sa = r + i * ap;
      x.beginPath(); x.moveTo(ct, ct); x.arc(ct, ct, rd, sa, sa + ap); x.closePath();
      const g = x.createRadialGradient(ct, ct, 0, ct, ct, rd);
      g.addColorStop(0, '#222'); g.addColorStop(0.3, cols[i % cols.length]); g.addColorStop(1, cols[i % cols.length] + '99');
      x.fillStyle = g; x.fill(); x.strokeStyle = '#111'; x.lineWidth = 1.5; x.stroke();
      x.save(); x.translate(ct, ct); x.rotate(sa + ap / 2);
      x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `bold ${s < 200 ? 12 : 15}px VT323, monospace`;
      x.shadowColor = '#000'; x.shadowBlur = 3; x.fillText((amounts[i] / 1000) + 'k', rd * 0.6, 4); x.shadowBlur = 0; x.restore();
    }
    x.beginPath(); x.arc(ct, ct, 18, 0, 2 * Math.PI);
    const hg = x.createRadialGradient(ct - 3, ct - 3, 0, ct, ct, 18);
    hg.addColorStop(0, '#555'); hg.addColorStop(1, '#111');
    x.fillStyle = hg; x.fill(); x.strokeStyle = '#00d4ff'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#00d4ff'; x.font = 'bold 11px VT323'; x.textAlign = 'center';
    x.shadowColor = '#00d4ff'; x.shadowBlur = 5; x.fillText('SPIN', ct, ct + 4); x.shadowBlur = 0;
    x.beginPath(); x.moveTo(ct - 10, 3); x.lineTo(ct + 10, 3); x.lineTo(ct, 20); x.closePath();
    x.fillStyle = '#ff2020'; x.fill(); x.strokeStyle = '#ffd700'; x.lineWidth = 1.5; x.stroke();
  };

  const spin = () => {
    if (spinning) return; setSpinning(true); setResult(null); playY2KClick();
    const tr = Math.PI * 2 * (5 + Math.random() * 5), sr = rot, d = 4000, st = Date.now();
    const a = () => {
      const p = Math.min((Date.now() - st) / d, 1), e = 1 - Math.pow(1 - p, 3), c = sr + tr * e;
      setRot(c); draw(c);
      if (p < 1) requestAnimationFrame(a);
      else { const f = c % (2 * Math.PI), ap2 = (2 * Math.PI) / n, pa = (2 * Math.PI - f + Math.PI * 1.5) % (2 * Math.PI), si = Math.floor(pa / ap2) % n; setResult(amounts[si]); setSpinning(false); onResult(amounts[si]); }
    };
    requestAnimationFrame(a);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
        <canvas ref={ref} width={240} height={240} className="w-full h-full" style={{ borderRadius: '50%', border: '3px outset #444' }} />
      </div>
      <button onClick={spin} disabled={spinning} className="btn-3d-red px-4 py-2 flex items-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
        <Ic src="/images/y2k-star.png" size={16} /> {spinning ? 'ĐANG QUAY...' : 'QUAY NGAY!'} <Ic src="/images/y2k-star.png" size={16} />
      </button>
      {result !== null && (
        <div className="animate-bounce-in flex items-center gap-2" style={{ fontFamily: "'VT323', monospace" }}>
          <Ic src="/images/y2k-star.png" size={18} />
          <span style={{ color: '#ffd700', fontSize: '22px', textShadow: '0 0 10px rgba(255,215,0,0.6), 2px 2px 0 #000' }}>{formatVND(result)}</span>
          <Ic src="/images/y2k-star.png" size={18} />
        </div>
      )}
    </div>
  );
}

// ===== CONFETTI =====
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 40 }, (_, i) => <div key={i} style={{ position: 'absolute', left: `${Math.random() * 100}%`, top: '-20px', width: 5 + Math.random() * 8, height: 5 + Math.random() * 8, background: ['#ff2020', '#00d4ff', '#ffd700', '#39ff14', '#ff8800', '#c0c0c0'][i % 6], borderRadius: i % 3 === 0 ? '50%' : '0', animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 3}s infinite` }} />)}
    </div>
  );
}

// ===== WIN =====
function WinScreen({ challenge, userName, total, onClose }: { challenge: ChallengeData; userName: string; total: number; onClose: () => void }) {
  useEffect(() => { playY2KWin(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <Confetti />
      <div className="animate-bounce-in w-full max-w-md p-[3px]" style={{ background: 'linear-gradient(135deg, #ffd700, #ff4400, #00d4ff, #ffd700)' }}>
        <div className="p-4 sm:p-6 text-center" style={{ background: 'linear-gradient(135deg, #0a0a18, #111122)', border: '2px inset #ffd700' }}>
          <div className="flex justify-center items-end gap-2 mb-2">
            <Ic src="/images/y2k-flame.png" size={28} className="animate-flame" />
            <Ic src="/images/y2k-trophy.png" size={60} />
            <Ic src="/images/y2k-flame.png" size={28} className="animate-flame" />
          </div>
          <Ic src="/images/y2k-star.png" size={30} className="animate-spin-slow mx-auto mb-1" />
          <h2 className="mb-1 animate-electric" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', lineHeight: '2' }}>BẢNG VÀNG VINH DANH</h2>
          <h3 className="mb-1 flex items-center justify-center gap-1 flex-wrap" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ffd700', lineHeight: '2' }}>
            <Ic src="/images/y2k-star.png" size={10} /> CHIẾN BINH XUẤT SẮC <Ic src="/images/y2k-star.png" size={10} />
          </h3>
          <div className="my-3 py-2 px-3" style={{ border: '2px solid #ffd700', background: 'rgba(255,215,0,0.03)' }}>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#00d4ff' }}>Tuyên dương chiến biinhh</p>
            <p className="my-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.5), 2px 2px 0 #000', lineHeight: '2' }}>{userName}</p>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#aaa' }}>Hoàn thành xuất sắcc</p>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#ff4400', textShadow: '0 0 8px rgba(255,68,0,0.5)' }}>"{challenge.name}"</p>
          </div>
          <div className="my-2">
            <p className="flex items-center justify-center gap-2 mb-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#888' }}>
              <Ic src="/images/y2k-star.png" size={14} /> Tổng tiền tiết kiệmm <Ic src="/images/y2k-star.png" size={14} />
            </p>
            <p className="animate-electric" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '14px', lineHeight: '2.5' }}>{formatVND(total)}</p>
          </div>
          <div className="flex justify-center gap-2 my-2">
            {['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png'].map((ic, i) => (
              <Ic key={i} src={ic} size={22} className={i % 2 === 0 ? 'animate-flame' : 'animate-float'} />
            ))}
          </div>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#555' }}>~ Bro quá đỉnhh! ~</p>
          <button onClick={onClose} className="btn-3d-gold mt-3 px-6 py-2 flex items-center gap-2 mx-auto" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
            <Ic src="/images/y2k-lightning.png" size={14} /> ĐÓNG <Ic src="/images/y2k-lightning.png" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== SETUP SCREEN (before starting) =====
function SetupScreen({ template, onStart, onBack }: { template: ChallengeTemplate; onStart: (days: number, fixedAmount: number) => void; onBack: () => void }) {
  const [days, setDays] = useState(template.defaultDays);
  const [fixedAmt, setFixedAmt] = useState(template.type === 'monthly' ? 500000 : 20000);
  const lbl = template.type === 'weekly' ? 'tuần' : template.type === 'monthly' ? 'tháng' : 'ngày';

  const getAmt = (d: number) => template.canEditAmount ? fixedAmt : template.getDayAmount(d, days);
  const previewAmounts = Array.from({ length: days }, (_, i) => getAmt(i + 1));
  const total = previewAmounts.reduce((s, a) => s + a, 0);

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <FloatingIcons />
      <div className="relative z-10 p-2 sm:p-4 max-w-lg mx-auto">
        <button onClick={onBack} className="btn-3d px-3 py-1 mb-3 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
          <Ic src="/images/y2k-flame.png" size={12} /> {'<<<'} QUAY LẠI
        </button>

        <div className="retro-panel p-4 sm:p-5 vhs-jitter">
          {/* Header */}
          <div className="text-center mb-4">
            <Ic src={template.icon} size={60} className="animate-flame mx-auto mb-2" glitch />
            <h2 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '12px', color: template.color, lineHeight: '2.2' }}>
              {template.name}
            </h2>
            <p className="mt-1 glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#aaa' }}>{template.desc}</p>
          </div>

          {/* Separator */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${template.color}, transparent)` }} />
            <Ic src="/images/y2k-star.png" size={16} className="animate-spin-slow" />
            <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${template.color}, transparent)` }} />
          </div>

          {/* Config: Days */}
          <div className="mb-3">
            <label className="flex items-center gap-2 mb-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#00d4ff' }}>
              <Ic src="/images/y2k-lightning.png" size={16} /> Số {lbl}:
            </label>
            <input type="number" value={days} onChange={e => setDays(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
              className="w-full text-center py-2" min={1} max={999} style={{ fontSize: '22px' }} />
          </div>

          {/* Config: Amount (for fixed/monthly) */}
          {template.canEditAmount && (
            <div className="mb-3">
              <label className="flex items-center gap-2 mb-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#ffd700' }}>
                <Ic src="/images/y2k-star.png" size={16} /> Số tiền mỗi {lbl} (VNĐ):
              </label>
              <input type="number" value={fixedAmt} onChange={e => setFixedAmt(Math.max(1000, parseInt(e.target.value) || 1000))}
                className="w-full text-center py-2" min={1000} step={1000} style={{ fontSize: '22px' }} />
            </div>
          )}

          {/* Preview */}
          <div className="retro-panel-fire p-3 mb-3">
            <p className="flex items-center gap-1 mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ff4400' }}>
              <Ic src="/images/y2k-flame.png" size={14} /> Xem trước:
            </p>
            <div className="flex gap-1 flex-wrap mb-2">
              {previewAmounts.slice(0, 6).map((a, i) => (
                <span key={i} className="px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${template.color}44`, fontFamily: "'VT323', monospace", fontSize: '14px', color: template.color }}>
                  {lbl.charAt(0).toUpperCase()}{i + 1}: {a >= 1000000 ? (a / 1000000).toFixed(1) + 'tr' : (a / 1000) + 'k'}
                </span>
              ))}
              {days > 6 && <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#555' }}>...+{days - 6} nữa</span>}
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#888' }}>Tổng mục tiêu:</span>
              <span className="flex items-center gap-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#ffd700', textShadow: '0 0 6px rgba(255,215,0,0.4)' }}>
                <Ic src="/images/y2k-star.png" size={12} /> {formatVND(total)}
              </span>
            </div>
          </div>

          {/* QUẤT button */}
          <button onClick={() => { playY2KClick(); onStart(days, fixedAmt); }}
            className="btn-3d-red w-full py-3 flex items-center justify-center gap-2 animate-pulse-glow"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '14px' }}>
            <Ic src="/images/y2k-flame.png" size={20} /> QUẤT <Ic src="/images/y2k-flame.png" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== CHALLENGE PROGRESS =====
function ChallengeProgress({ challenge, template, fixedAmt, onToggleDay, onBack, onQuit, userName }: {
  challenge: ChallengeData; template: ChallengeTemplate; fixedAmt: number;
  onToggleDay: (d: number) => void; onBack: () => void; onQuit: () => void; userName: string;
}) {
  const [showWin, setShowWin] = useState(false);
  const [wheelDay, setWheelDay] = useState<number | null>(null);
  const [quitStep, setQuitStep] = useState(0); // 0=none, 1=first confirm, 2=confirmed

  const getAmt = (d: number) => template.canEditAmount ? fixedAmt : template.getDayAmount(d, challenge.totalDays);
  const dayAmts = Array.from({ length: challenge.totalDays }, (_, i) => getAmt(i + 1));
  const cc = challenge.completedDays.filter(Boolean).length;
  const prog = (cc / challenge.totalDays) * 100;
  const saved = challenge.completedDays.reduce((s, d, i) => d ? s + dayAmts[i] : s, 0);
  const target = dayAmts.reduce((s, a) => s + a, 0);
  const isDone = cc === challenge.totalDays;
  const lbl = template.type === 'weekly' ? 'Tuần' : template.type === 'monthly' ? 'Tháng' : 'Ngày';

  const clickDay = (di: number) => {
    if (challenge.completedDays[di]) { onToggleDay(di); return; }
    if (template.type === 'random') setWheelDay(di);
    else { onToggleDay(di); playY2KSuccess(); }
  };
  const wheelResult = (_a: number) => { if (wheelDay !== null) { setTimeout(() => { onToggleDay(wheelDay); playY2KSuccess(); setWheelDay(null); }, 1500); } };
  useEffect(() => { if (isDone && !showWin) setShowWin(true); }, [isDone]);

  // Quit confirmation modal
  const QuitModal = () => (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="retro-panel p-4 sm:p-5 text-center w-full max-w-sm animate-bounce-in">
        <Ic src="/images/y2k-skull.png" size={50} className="mx-auto mb-3" />
        {quitStep === 1 ? (
          <>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#ff2020', lineHeight: '2' }}>BRO CHẮC CHƯA?</p>
            <p className="mt-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#999' }}>Thoát sẽ XÓA hết tiến trình thử thách nàyy!</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setQuitStep(0)} className="btn-3d flex-1 py-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                <Ic src="/images/y2k-flame.png" size={14} /> TIẾP TỤC CHIẾN
              </button>
              <button onClick={() => setQuitStep(2)} className="btn-3d-red flex-1 py-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                THOÁT THẬT
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#ff2020', lineHeight: '2' }}>LẦN CUỐI HỎI NHA!</p>
            <p className="mt-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#ff4400' }}>Đã tiết kiệm được {formatVND(saved)}, bỏ hết luôn hả bro??</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setQuitStep(0)} className="btn-3d-blue flex-1 py-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                <Ic src="/images/y2k-lightning.png" size={14} /> KHÔNG, CHIẾN TIẾP
              </button>
              <button onClick={() => { setQuitStep(0); onQuit(); }} className="btn-3d-red flex-1 py-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                <Ic src="/images/y2k-skull.png" size={14} /> XÓA LUÔN
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <FloatingIcons />
      {showWin && <WinScreen challenge={challenge} userName={userName} total={saved} onClose={() => setShowWin(false)} />}
      {quitStep > 0 && <QuitModal />}

      <div className="relative z-10 p-2 sm:p-3 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-3 gap-2">
          <button onClick={onBack} className="btn-3d px-3 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Ic src="/images/y2k-flame.png" size={12} /> {'<<<'} VỀ
          </button>
          <button onClick={() => setQuitStep(1)} className="btn-3d-red px-3 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}>
            <Ic src="/images/y2k-skull.png" size={12} /> THOÁT
          </button>
        </div>

        {/* Challenge info */}
        <div className="retro-panel p-3 sm:p-4 mb-3 vhs-jitter">
          <div className="flex items-center gap-3 mb-3">
            <Ic src={template.icon} size={40} className="animate-flame" glitch />
            <div className="flex-1 min-w-0">
              <h2 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: template.color, lineHeight: '2' }}>{challenge.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="retro-panel-fire p-1.5 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#ff4400' }}>
                <Ic src="/images/y2k-flame.png" size={10} /> ĐÃ GOM
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#ffd700', lineHeight: '2.5' }}>{formatVND(saved)}</p>
            </div>
            <div className="retro-panel-cyan p-1.5 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#00d4ff' }}>
                <Ic src="/images/y2k-star.png" size={10} /> MỤC TIÊU
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#fff', lineHeight: '2.5' }}>{formatVND(target)}</p>
            </div>
            <div className="retro-panel-green p-1.5 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: '#39ff14' }}>
                <Ic src="/images/y2k-lightning.png" size={10} /> LVL
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#fff', lineHeight: '2.5' }}>{cc}/{challenge.totalDays}</p>
            </div>
          </div>

          <div className="relative h-6" style={{ background: '#0a0a12', border: '2px inset #333' }}>
            <div className="h-full progress-stripe transition-all duration-500" style={{ width: `${prog}%`, background: `linear-gradient(90deg, ${template.color}, #ffd700)` }} />
            <span className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#fff', textShadow: '1px 1px 3px #000, 0 0 5px #000' }}>{prog.toFixed(1)}% HOÀN THÀNHH</span>
          </div>
        </div>

        {/* Wheel */}
        {wheelDay !== null && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.92)' }}>
            <div className="retro-panel p-4 text-center w-full max-w-sm">
              <h3 className="mb-2 animate-electric flex items-center justify-center gap-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', lineHeight: '2' }}>
                <Ic src="/images/y2k-star.png" size={14} /> VÒNG QUAY <Ic src="/images/y2k-star.png" size={14} />
              </h3>
              <p className="mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#999' }}>{lbl} {wheelDay + 1}</p>
              <LuckyWheel onResult={wheelResult} amounts={[5000, 10000, 15000, 20000, 25000, 30000, 50000, 2000, 8000, 12000]} />
              <button onClick={() => setWheelDay(null)} className="btn-3d mt-3 px-4 py-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>HỦY</button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="retro-panel p-2 sm:p-3">
          <h3 className="mb-2 text-center flex items-center justify-center gap-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#ffd700', lineHeight: '1.8' }}>
            <Ic src="/images/y2k-lightning.png" size={12} /> BẢNG CHIẾN TÍCHH <Ic src="/images/y2k-lightning.png" size={12} />
          </h3>
          <div className={`grid gap-1 sm:gap-1.5 ${challenge.totalDays <= 14 ? 'grid-cols-4 sm:grid-cols-7' : challenge.totalDays <= 52 ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10' : 'grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20'}`}>
            {dayAmts.map((amt, i) => {
              const d = challenge.completedDays[i];
              return (
                <button key={i} onClick={() => clickDay(i)} className="transition-all duration-150 active:scale-95 sm:hover:scale-110"
                  style={{
                    background: d ? `linear-gradient(135deg, ${template.color}cc, ${template.color}55)` : 'linear-gradient(135deg, #111120, #0a0a15)',
                    border: d ? `2px solid ${template.color}` : '1px outset #2a2a3a',
                    boxShadow: d ? `0 0 8px ${template.color}44` : '1px 1px 0 #050508',
                    padding: '2px 1px', minHeight: challenge.totalDays <= 14 ? '60px' : '38px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: challenge.totalDays <= 30 ? '12px' : '10px', color: d ? '#fff' : '#555' }}>{lbl.charAt(0)}{i + 1}</span>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: challenge.totalDays <= 30 ? '11px' : '8px', color: d ? '#ffd700' : '#444' }}>{amt >= 1000000 ? (amt / 1000000).toFixed(0) + 'tr' : (amt / 1000).toFixed(0) + 'k'}</span>
                  {d && <Ic src="/images/y2k-star.png" size={challenge.totalDays <= 30 ? 11 : 8} />}
                </button>
              );
            })}
          </div>
        </div>

        {isDone && (
          <div className="text-center mt-3">
            <button onClick={() => setShowWin(true)} className="btn-3d-gold px-4 py-2 animate-pulse-glow flex items-center gap-2 mx-auto" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}>
              <Ic src="/images/y2k-trophy.png" size={18} /> XEM VINH DANH <Ic src="/images/y2k-trophy.png" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
type Screen = 'home' | 'setup' | 'progress';

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [screen, setScreen] = useState<Screen>(data.activeChallengeId ? 'progress' : 'home');
  const [setupId, setSetupId] = useState<string | null>(null);
  const [fixedAmts, setFixedAmts] = useState<Record<string, number>>({});

  const save = useCallback((d: AppData) => { setData(d); saveData(d); }, []);

  const activeChallenge = data.activeChallengeId ? data.challenges.find(c => c.id === data.activeChallengeId) : null;
  const activeTemplate = data.activeChallengeId ? getTemplate(data.activeChallengeId) : null;

  // Go to setup
  const openSetup = (tid: string) => {
    // If already has this challenge, go straight to progress
    const existing = data.challenges.find(c => c.id === tid);
    if (existing) {
      save({ ...data, activeChallengeId: tid });
      setScreen('progress');
      return;
    }
    setSetupId(tid);
    setScreen('setup');
  };

  // Start challenge from setup
  const startChallenge = (tid: string, days: number, fixedAmt: number) => {
    const t = getTemplate(tid); if (!t) return;
    const da = Array.from({ length: days }, (_, i) => t.canEditAmount ? fixedAmt : t.getDayAmount(i + 1, days));
    const nc: ChallengeData = {
      id: tid, name: t.name, type: t.type, totalDays: days,
      completedDays: new Array(days).fill(false), totalTarget: da.reduce((s, a) => s + a, 0),
      startDate: new Date().toISOString(), isActive: true, isCompleted: false,
    };
    setFixedAmts({ ...fixedAmts, [tid]: fixedAmt });
    save({ ...data, challenges: [...data.challenges, nc], activeChallengeId: tid });
    setScreen('progress');
    playY2KClick();
  };

  const toggle = (di: number) => {
    if (!data.activeChallengeId) return;
    const cid = data.activeChallengeId;
    save({ ...data, challenges: data.challenges.map(c => {
      if (c.id !== cid) return c;
      const nc = [...c.completedDays]; nc[di] = !nc[di];
      return { ...c, completedDays: nc, isCompleted: nc.every(Boolean) };
    }) });
  };

  const quitChallenge = () => {
    if (!data.activeChallengeId) return;
    save({ ...data, challenges: data.challenges.filter(c => c.id !== data.activeChallengeId), activeChallengeId: null });
    setScreen('home');
  };

  const goHome = () => { setScreen('home'); };

  // ===== SETUP SCREEN =====
  if (screen === 'setup' && setupId) {
    const t = getTemplate(setupId);
    if (t) return <SetupScreen template={t} onStart={(d, a) => startChallenge(setupId, d, a)} onBack={goHome} />;
  }

  // ===== PROGRESS SCREEN =====
  if (screen === 'progress' && activeChallenge && activeTemplate) {
    return (
      <ChallengeProgress
        challenge={activeChallenge} template={activeTemplate}
        fixedAmt={fixedAmts[activeChallenge.id] || (activeTemplate.type === 'monthly' ? 500000 : 20000)}
        onToggleDay={toggle} onBack={goHome} onQuit={quitChallenge} userName={data.userName}
      />
    );
  }

  // ===== HOME SCREEN =====
  const hasActive = !!data.activeChallengeId;

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <FloatingIcons />
      <Marquee />
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4 pb-8">

        {/* HEADER */}
        <div className="text-center py-5 sm:py-8">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3">
            <Ic src="/images/y2k-flame.png" size={32} className="animate-flame" glitch />
            <Ic src="/images/y2k-lightning.png" size={38} className="animate-float" glitch />
            <Ic src="/images/y2k-trophy.png" size={42} className="vhs-jitter" glitch />
            <Ic src="/images/y2k-lightning.png" size={38} className="animate-float" glitch />
            <Ic src="/images/y2k-flame.png" size={32} className="animate-flame" glitch />
          </div>
          <h1 className="glitch-text flex items-center justify-center gap-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(14px, 5vw, 22px)', lineHeight: '2.5', color: '#e0e0e0' }}>
            <Ic src="/images/y2k-star.png" size={18} /> THỬ THÁCH <Ic src="/images/y2k-star.png" size={18} />
          </h1>
          <h2 className="glitch-flicker" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(10px, 3.5vw, 16px)', lineHeight: '2.2', background: 'linear-gradient(180deg, #ffd700, #ff8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 2px 0 #000)' }}>TIẾT KIỆM TIỀNN</h2>
          
          {/* Decorative line */}
          <div className="flex items-center gap-2 mt-3 max-w-xs mx-auto">
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }} />
            <Ic src="/images/y2k-dragon.png" size={18} className="animate-float" />
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #ff4400, transparent)' }} />
          </div>
        </div>

        {/* USER */}
        <div className="retro-panel p-3 sm:p-4 mb-4 y2k-card vhs-jitter">
          <div className="flex items-center gap-3 relative z-10">
            <Ic src="/images/y2k-skull.png" size={35} glitch />
            <div className="flex-1">
              <p className="glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#666' }}>Yo, chào bro</p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.5)', lineHeight: '2' }}>{data.userName}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Ic src="/images/y2k-trophy.png" size={28} glitch />
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#39ff14', textShadow: '0 0 6px rgba(57,255,20,0.4)' }}>
                {data.challenges.filter(c => c.isCompleted).length} GG
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE CHALLENGE BANNER */}
        {hasActive && activeChallenge && activeTemplate && (
          <div className="mb-4">
            <div className="retro-panel-fire p-3 sm:p-4 animate-pulse-glow cursor-pointer y2k-card border-glow" onClick={() => setScreen('progress')}>
              <div className="flex items-center gap-2 mb-2">
                <Ic src={activeTemplate.icon} size={28} className="animate-flame" />
                <div className="flex-1">
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: activeTemplate.color, lineHeight: '1.8' }}>{activeChallenge.name}</p>
                  <p style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#888' }}>
                    {activeChallenge.completedDays.filter(Boolean).length}/{activeChallenge.totalDays} - Đang chiến!
                  </p>
                </div>
                <Ic src="/images/y2k-lightning.png" size={20} className="animate-float" />
              </div>
              <button className="btn-3d-blue w-full py-2 flex items-center justify-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                <Ic src="/images/y2k-flame.png" size={14} /> VÀO CHIẾN TIẾPP <Ic src="/images/y2k-flame.png" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* CHALLENGE LIST */}
        <div>
          <h3 className="mb-2 flex items-center gap-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#00d4ff', lineHeight: '1.8' }}>
            <Ic src="/images/y2k-lightning.png" size={16} className="animate-float" />
            {hasActive ? 'CÁC THỬ THÁCH (đang bận 1 thử thách)' : 'CHỌN THỬ THÁCH'}
          </h3>
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
            {CHALLENGES.map(tm => {
              const isActive = data.activeChallengeId === tm.id;
              const disabled = hasActive && !isActive;
              return (
                <div key={tm.id} className={`retro-panel-cyan p-3 sm:p-4 relative overflow-hidden ${disabled ? 'opacity-30 grayscale' : 'y2k-card'}`}>
                  <div className="absolute top-0 right-0 opacity-10"><Ic src={tm.icon} size={55} /></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Ic src={tm.icon} size={30} className={disabled ? '' : 'animate-float'} />
                      <div className="min-w-0">
                        <h4 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: disabled ? '#444' : tm.color, lineHeight: '1.8' }}>{tm.name}</h4>
                        <p style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: disabled ? '#444' : '#999', lineHeight: '1.3' }}>{tm.desc}</p>
                      </div>
                    </div>

                    {isActive ? (
                      <button onClick={() => setScreen('progress')} className="btn-3d-gold w-full py-2 flex items-center justify-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                        <Ic src="/images/y2k-flame.png" size={14} /> CHIẾN TIẾPP <Ic src="/images/y2k-flame.png" size={14} />
                      </button>
                    ) : disabled ? (
                      <div className="w-full py-2 text-center" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#444', border: '2px dashed #333', background: 'rgba(0,0,0,0.3)' }}>
                        <Ic src="/images/y2k-skull.png" size={14} /> Hoàn thành thử thách hiện tại trước
                      </div>
                    ) : (
                      <button onClick={() => openSetup(tm.id)} className="btn-3d-red w-full py-2 flex items-center justify-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                        <Ic src="/images/y2k-flame.png" size={14} /> BẮT ĐẦU <Ic src="/images/y2k-flame.png" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center">
          {/* Decorative separator */}
          <div className="flex items-center gap-2 mb-4 max-w-sm mx-auto">
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #333, transparent)' }} />
            <Ic src="/images/y2k-star.png" size={12} className="animate-spin-slow" />
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #333, transparent)' }} />
          </div>
          <div className="flex justify-center gap-2 mb-3">
            {['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png', '/images/y2k-trophy.png'].map((ic, i) => (
              <Ic key={i} src={ic} size={16} glitch className={i % 2 === 0 ? 'animate-float' : ''} />
            ))}
          </div>
          <p className="glitch-flicker flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#444' }}>
            <Ic src="/images/y2k-flame.png" size={12} /> Chiến Binh Tiết Kiệm <Ic src="/images/y2k-flame.png" size={12} />
          </p>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#2a2a2a' }}>Dữ liệu lưu trên trình duyệtt ~ đừng xóa cache nhaa</p>
        </div>
      </div>
      <Marquee />
    </div>
  );
}
