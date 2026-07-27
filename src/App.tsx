import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData, AppData, ChallengeData } from './utils/storage';
import { playY2KSuccess, playY2KWin, unlockAudio, playClickByIndex, playNavigate, playBack, playQuitWarn, playStay, playUntoggle, playInputTick, tapIconByName, tapTitle, tapSubtitle, tapUser, tapFooterIcon, tapSparkle } from './utils/sounds';
import { useClickEffect, ClickParticles, EffectType } from './components/ClickEffects';

interface ChallengeTemplate {
  id: string; name: string; desc: string; icon: string; type: string;
  defaultDays: number; getDayAmount: (day: number, totalDays: number) => number;
  color: string; colorDark: string; canEditAmount: boolean;
}

// iconFilter: CSS filter to make reused base icons look unique
const CHALLENGES: ChallengeTemplate[] = [
  // flame = cam đỏ lửa
  { id: '365day', name: '365 NGÀY CHINH PHỤC', desc: 'Tăng dần mỗi ngày! Ngày 1 = 1k, Ngày 2 = 2k...', icon: '/images/y2k-flame.png', type: 'incremental', defaultDays: 365, getDayAmount: (d) => d * 1000, color: '#ff5500', colorDark: '#1a0800', canEditAmount: false },
  // lightning = xanh cyan điện
  { id: '52week', name: '52 TUẦN THÉP', desc: 'Tuần 1 = 10k, tuần 2 = 20k... Mỗi tuần tăng!', icon: '/images/y2k-lightning.png', type: 'weekly', defaultDays: 52, getDayAmount: (w) => w * 10000, color: '#00d4ff', colorDark: '#001520', canEditAmount: false },
  // skull = bạc trắng xám
  { id: 'countdown30', name: '30 NGÀY ĐẾM NGƯỢC', desc: 'Từ cao giảm dần! Bắt đầu mạnh, về đích nhẹ~', icon: '/images/y2k-skull.png', type: 'countdown', defaultDays: 30, getDayAmount: (d, t) => (t - d + 1) * 1000, color: '#b8b8cc', colorDark: '#101018', canEditAmount: false },
  // dragon = xanh lá neon
  { id: 'double14', name: '14 NGÀY NHÂN ĐÔI', desc: '1k > 2k > 4k > 8k... Nhân đôi mỗi ngày!', icon: '/images/y2k-dragon.png', type: 'double', defaultDays: 14, getDayAmount: (d) => Math.pow(2, d - 1) * 1000, color: '#39ff14', colorDark: '#001a00', canEditAmount: false },
  // star = vàng gold
  { id: 'random30', name: '30 NGÀY MAY RỦI', desc: 'Quay vòng xoay số phận mỗi ngày!', icon: '/images/y2k-star.png', type: 'random', defaultDays: 30, getDayAmount: () => [5000, 10000, 15000, 20000, 25000, 30000, 50000, 2000, 8000, 12000][Math.floor(Math.random() * 10)], color: '#ffd700', colorDark: '#1a1500', canEditAmount: false },
  // trophy = vàng đồng
  { id: 'fixed90', name: '90 NGÀY KỶ LUẬT', desc: 'Mỗi ngày đúng 1 số tiền cố định. Tự chọn!', icon: '/images/y2k-trophy.png', type: 'fixed', defaultDays: 90, getDayAmount: () => 20000, color: '#e8a020', colorDark: '#181000', canEditAmount: true },
  // flame hue-shifted → tím đỏ (khác flame gốc)
  { id: 'step7', name: '7 NGÀY BÃO TỐ', desc: '7 ngày tăng dã man: 5k>10k>20k>50k>100k>200k>500k!', icon: '/images/y2k-flame.png', type: 'steps', defaultDays: 7, getDayAmount: (d) => [5000, 10000, 20000, 50000, 100000, 200000, 500000][d - 1] || 5000, color: '#ff2020', colorDark: '#1a0505', canEditAmount: false },
  // dragon hue-shifted → xanh dương (khác dragon gốc)
  { id: 'payday', name: '12 THÁNG ĐẠI CHIẾN', desc: 'Mỗi tháng 1 số tiền cố định. Tự chọn!', icon: '/images/y2k-dragon.png', type: 'monthly', defaultDays: 12, getDayAmount: () => 500000, color: '#4488ff', colorDark: '#080e1a', canEditAmount: true },
];

// CSS filter cho 2 challenge cuối để icon nhìn khác biệt
const ICON_FILTERS: Record<string, string> = {
  step7: 'hue-rotate(320deg) saturate(1.5) brightness(1.1)',
  payday: 'hue-rotate(180deg) saturate(1.3) brightness(1.05)',
};

const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';
const getTemplate = (id: string) => CHALLENGES.find(c => c.id === id);

// ===== Y2K ICON — click phát tiếng =====
function Ic({ src, size = 40, className = '', glitch = false, filter, tap = false }: { src: string; size?: number; className?: string; glitch?: boolean; filter?: string; tap?: boolean }) {
  const handleTap = tap ? () => tapIconByName(src) : undefined;
  return <img src={src} alt="" width={size} height={size} onClick={handleTap}
    className={`y2k-icon inline-block ${glitch ? 'y2k-icon-glitch' : ''} ${tap ? 'cursor-pointer' : ''} ${className}`}
    style={{ opacity: 0.85, filter: filter || undefined }} />;
}

// Helper to get icon filter for a challenge
function icFilter(id: string) { return ICON_FILTERS[id]; }

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
    if (spinning) return; setSpinning(true); setResult(null); playClickByIndex(4);
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

// ===== SETUP SCREEN — mỗi challenge setup khác biệt =====
function SetupScreen({ template, onStart, onBack }: { template: ChallengeTemplate; onStart: (days: number, fixedAmount: number) => void; onBack: () => void }) {
  const [days, setDays] = useState(template.defaultDays);
  const [fixedAmt, setFixedAmt] = useState(template.type === 'monthly' ? 500000 : 20000);
  const lbl = template.type === 'weekly' ? 'tuần' : template.type === 'monthly' ? 'tháng' : 'ngày';
  const idx = CHALLENGES.findIndex(c => c.id === template.id);
  const f = icFilter(template.id);
  const c = template.color;
  const cd = template.colorDark;

  const getAmt = (d: number) => template.canEditAmount ? fixedAmt : template.getDayAmount(d, days);
  const previewAmounts = Array.from({ length: days }, (_, i) => getAmt(i + 1));
  const total = previewAmounts.reduce((s, a) => s + a, 0);

  // Unique setup shape per challenge
  const shapes = ['rounded-[22px]', 'rounded-tl-[30px] rounded-br-[30px]', '', 'rounded-tr-[28px] rounded-bl-[28px]', 'rounded-[35px]', 'rounded-[3px]', '', 'rounded-tl-[32px] rounded-br-[32px] rounded-tr-[6px] rounded-bl-[6px]'];
  const shape = shapes[idx] || '';
  const clips = [undefined, undefined, 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))', undefined, undefined, undefined, 'polygon(5% 0%, 95% 0%, 100% 8%, 100% 92%, 95% 100%, 5% 100%, 0% 92%, 0% 8%)', undefined];
  const clip = clips[idx];

  // Unique "QUẤT" text per challenge
  const quatTexts = ['LÊN ĐƯỜNG !!!', 'SẴN SÀNG !!!', 'XUẤT KÍCH !!!', 'KÍCH HOẠT !!!', 'THỬ VẬN MAY !!!', 'BẮT ĐẦU KỶ LUẬT !!!', 'XÔNG PHA !!!', 'CHIẾN ĐẤU !!!'];
  const quatText = quatTexts[idx] || 'QUẤT !!!';

  // Unique badge shape for icon
  const badgeStyles: React.CSSProperties[] = [
    { width: 70, height: 70, borderRadius: '50%' },
    { width: 64, height: 64, transform: 'rotate(45deg)', borderRadius: '12px' },
    { width: 66, height: 66, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' },
    { width: 64, height: 64, borderRadius: '16px' },
    { width: 72, height: 72, borderRadius: '50%' },
    { width: 60, height: 60, borderRadius: '4px' },
    { width: 66, height: 66, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
    { width: 60, height: 74, borderRadius: '40%' },
  ];
  const badgeRotate = idx === 1 ? '-rotate-45' : '';

  // Unique separator
  const separators = [
    <div className="flex gap-1 my-4 justify-center">{[...Array(16)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background: `${c}${30 + i * 4}` }} />)}</div>,
    <div className="h-[3px] my-4" style={{ background: `repeating-linear-gradient(90deg, ${c}, ${c} 6px, transparent 6px, transparent 12px)` }} />,
    <div className="flex items-center gap-2 my-4 justify-center"><div className="flex-1 h-[1px] max-w-[80px]" style={{ background: `${c}44` }} /><Ic src={template.icon} size={12} filter={f} /><div className="flex-1 h-[1px] max-w-[80px]" style={{ background: `${c}44` }} /></div>,
    <div className="h-[2px] my-4" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />,
    <div className="flex gap-2 my-4 justify-center">{[...Array(5)].map((_, i) => <Ic key={i} src={template.icon} size={9 + (i === 2 ? 4 : 0)} filter={f} />)}</div>,
    <><div className="h-[1px] mt-4 mb-1" style={{ background: `${c}55` }} /><div className="h-[1px] mb-4" style={{ background: `${c}22` }} /></>,
    <div className="h-[3px] my-4" style={{ background: `repeating-linear-gradient(135deg, ${c}88 0px, ${c}88 4px, transparent 4px, transparent 8px)` }} />,
    <div className="h-[2px] my-4 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${c}88, ${c}, ${c}88, transparent)` }} />,
  ];

  // Unique button shape
  const btnShapes = ['rounded-full', 'rounded-tl-[18px] rounded-br-[18px]', 'rounded-none', 'rounded-tr-[18px] rounded-bl-[18px]', 'rounded-full', 'rounded-[3px]', 'rounded-[8px]', 'rounded-tl-[22px] rounded-br-[22px]'];

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <FloatingIcons />
      <div className="relative z-10 p-2 sm:p-4 max-w-lg mx-auto">
        <button onClick={() => { playBack(); onBack(); }} className="btn-3d px-3 py-1 mb-3 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
          <Ic src={template.icon} size={12} filter={f} /> {'<<<'} QUAY LẠI
        </button>

        <div className={`p-5 sm:p-6 vhs-jitter overflow-hidden relative ${shape}`} style={{
          background: `linear-gradient(${130 + idx * 18}deg, ${cd} 0%, #040408 50%, ${cd}cc 100%)`,
          border: `3px outset ${c}`,
          boxShadow: `inset 0 0 40px ${c}08, 4px 4px 0 #030306, 0 0 22px ${c}12`,
          clipPath: clip,
        }}>
          {/* BG watermark */}
          <div className="absolute -top-6 -right-6 opacity-[0.04]"><Ic src={template.icon} size={120} filter={f} /></div>

          {/* Header — icon badge */}
          <div className="text-center mb-3 relative z-10">
            <div className="mx-auto mb-3 flex items-center justify-center" style={{ ...badgeStyles[idx], background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}55`, boxShadow: `0 0 20px ${c}25` }}>
              <div className={badgeRotate}><Ic src={template.icon} size={38} className="animate-flame" glitch filter={f} /></div>
            </div>
            <h2 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: c, lineHeight: '2.2' }}>{template.name}</h2>
            <p className="mt-1 glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#aaa' }}>{template.desc}</p>
          </div>

          {/* Unique separator */}
          <div className="relative z-10">{separators[idx]}</div>

          {/* Config: Days */}
          <div className="mb-3 relative z-10">
            <label className="flex items-center gap-2 mb-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: c }}>
              <Ic src={template.icon} size={14} filter={f} /> Số {lbl}:
            </label>
            <input type="number" value={days} onChange={e => { setDays(Math.max(1, Math.min(999, parseInt(e.target.value) || 1))); playInputTick(); }}
              className="w-full text-center py-2" min={1} max={999} style={{ fontSize: '22px', borderColor: `${c}88` }} />
          </div>

          {/* Config: Amount */}
          {template.canEditAmount && (
            <div className="mb-3 relative z-10">
              <label className="flex items-center gap-2 mb-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#ffd700' }}>
                <Ic src={template.icon} size={14} filter={f} /> Số tiền mỗi {lbl} (VNĐ):
              </label>
              <input type="number" value={fixedAmt} onChange={e => { setFixedAmt(Math.max(1000, parseInt(e.target.value) || 1000)); playInputTick(); }}
                className="w-full text-center py-2" min={1000} step={1000} style={{ fontSize: '22px', borderColor: `${c}88` }} />
            </div>
          )}

          {/* Preview */}
          <div className="p-3 mb-4 relative z-10" style={{ background: `linear-gradient(145deg, ${cd}, #030306)`, border: `2px outset ${c}33`, boxShadow: `inset 0 0 20px ${c}05` }}>
            <p className="flex items-center gap-1 mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: c }}>
              <Ic src={template.icon} size={13} filter={f} /> Xem trước:
            </p>
            <div className="flex gap-1 flex-wrap mb-2">
              {previewAmounts.slice(0, 6).map((a, i) => (
                <span key={i} className="px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c}44`, fontFamily: "'VT323', monospace", fontSize: '14px', color: c }}>
                  {lbl.charAt(0).toUpperCase()}{i + 1}: {a >= 1000000 ? (a / 1000000).toFixed(1) + 'tr' : (a / 1000) + 'k'}
                </span>
              ))}
              {days > 6 && <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#555' }}>...+{days - 6}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#888' }}>Tổng:</span>
              <span className="flex items-center gap-1" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#ffd700', textShadow: '0 0 6px rgba(255,215,0,0.4)' }}>
                <Ic src={template.icon} size={11} filter={f} /> {formatVND(total)}
              </span>
            </div>
          </div>

          {/* Unique QUẤT button */}
          <button onClick={() => { playClickByIndex(idx); onStart(days, fixedAmt); }}
            className={`w-full py-3 flex items-center justify-center gap-3 animate-pulse-glow relative z-10 ${btnShapes[idx]}`}
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#fff', cursor: 'pointer',
              background: `linear-gradient(180deg, ${c}dd, ${c}77, ${c}44)`,
              border: `3px outset ${c}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 3px 3px 0 #080808, 0 0 22px ${c}40`,
              textShadow: `0 0 10px ${c}, 2px 2px 3px #000`,
            }}>
            <Ic src={template.icon} size={20} filter={f} /> {quatText} <Ic src={template.icon} size={20} filter={f} />
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
  const [quitStep, setQuitStep] = useState(0); // 0=none, 1-4=confirm steps

  const getAmt = (d: number) => template.canEditAmount ? fixedAmt : template.getDayAmount(d, challenge.totalDays);
  const dayAmts = Array.from({ length: challenge.totalDays }, (_, i) => getAmt(i + 1));
  const cc = challenge.completedDays.filter(Boolean).length;
  const prog = (cc / challenge.totalDays) * 100;
  const saved = challenge.completedDays.reduce((s, d, i) => d ? s + dayAmts[i] : s, 0);
  const target = dayAmts.reduce((s, a) => s + a, 0);
  const isDone = cc === challenge.totalDays;
  const lbl = template.type === 'weekly' ? 'Tuần' : template.type === 'monthly' ? 'Tháng' : 'Ngày';

  const clickDay = (di: number) => {
    if (challenge.completedDays[di]) { playUntoggle(); onToggleDay(di); return; }
    if (template.type === 'random') setWheelDay(di);
    else { onToggleDay(di); playY2KSuccess(); }
  };
  const wheelResult = (_a: number) => { if (wheelDay !== null) { setTimeout(() => { onToggleDay(wheelDay); playY2KSuccess(); setWheelDay(null); }, 1500); } };
  useEffect(() => { if (isDone && !showWin) setShowWin(true); }, [isDone]);

  // Quit confirmation — 4 BƯỚC mới cho thoát
  const quitIcons = ['/images/y2k-skull.png', '/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-dragon.png'];
  const quitColors = ['#ff2020', '#ff6600', '#ff0000', '#cc0000'];
  const QuitModal = () => {
    const qi = quitStep - 1;
    const qc = quitColors[qi] || '#ff2020';
    const steps = [
      { title: 'BRO CHẮC CHƯA?', msg: 'Thoát sẽ XÓA hết tiến trình thử thách nàyy!', stay: 'Ở LẠI CHIẾN', go: 'VẪN MUỐN THOÁT' },
      { title: 'NGHĨ LẠI ĐI BRO!', msg: `Bro đã cố gắng ${cc} ngày rồi mà bỏ hả??`, stay: 'ỪA ĐÚNG, Ở LẠI', go: 'KHÔNG, THOÁT THẬT' },
      { title: 'LẦN 3 HỎI NHA!', msg: `Tiền tiết kiệm ${formatVND(saved)} sẽ mất hếtt!`, stay: 'GIỮ TIỀN CỦA TAO', go: 'KỆ, MẤT THÌ MẤT' },
      { title: 'LẦN CUỐI CÙNGG!', msg: 'Đây là cơ hội cuối! Bấm XÓA = mất hết vĩnh viễnn!', stay: 'KHÔNG THOÁT NỮA', go: 'XÓA VĨNH VIỄN' },
    ];
    const s = steps[qi] || steps[0];
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3" style={{ background: `rgba(${qi * 10},0,0,${0.88 + qi * 0.03})` }}>
        <div key={quitStep} className="retro-panel p-4 sm:p-5 text-center w-full max-w-sm animate-bounce-in" style={{ borderColor: qc }}>
          <Ic src={quitIcons[qi]} size={45 + qi * 5} className={`mx-auto mb-3 ${qi >= 2 ? 'animate-flame' : 'animate-float'}`} />
          {/* Step indicator */}
          <div className="flex justify-center gap-1.5 mb-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="rounded-full" style={{ width: i <= qi ? 10 : 6, height: i <= qi ? 10 : 6, background: i <= qi ? qc : '#333', boxShadow: i <= qi ? `0 0 6px ${qc}` : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: `${9 + qi}px`, color: qc, lineHeight: '2.2', textShadow: qi >= 2 ? `0 0 10px ${qc}` : 'none' }}>{s.title}</p>
          <p className={`mt-2 ${qi >= 2 ? 'glitch-text' : ''}`} style={{ fontFamily: "'VT323', monospace", fontSize: `${17 + qi}px`, color: qi >= 2 ? qc : '#999' }}>{s.msg}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { playStay(); setQuitStep(0); }} className={`flex-1 py-2 flex items-center justify-center gap-1 ${qi >= 2 ? 'btn-3d-blue' : 'btn-3d'}`} style={{ fontFamily: "'VT323', monospace", fontSize: '17px' }}>
              <Ic src="/images/y2k-lightning.png" size={13} /> {s.stay}
            </button>
            <button onClick={() => { playQuitWarn(qi + 1); qi >= 3 ? (() => { setQuitStep(0); onQuit(); })() : setQuitStep(quitStep + 1); }}
              className="btn-3d-red flex-1 py-2 flex items-center justify-center gap-1"
              style={{ fontFamily: "'VT323', monospace", fontSize: '17px', boxShadow: qi >= 2 ? `0 0 15px ${qc}40` : undefined }}>
              <Ic src={quitIcons[Math.min(qi + 1, 3)]} size={13} /> {s.go}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] grid-pattern relative scanlines">
      <FloatingIcons />
      {showWin && <WinScreen challenge={challenge} userName={userName} total={saved} onClose={() => setShowWin(false)} />}
      {quitStep > 0 && <QuitModal />}

      <div className="relative z-10 p-2 sm:p-3 max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-3 gap-2">
          <button onClick={() => { playBack(); onBack(); }} className="btn-3d px-3 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>
            <Ic src="/images/y2k-flame.png" size={12} /> {'<<<'} VỀ
          </button>
          <button onClick={() => { playQuitWarn(1); setQuitStep(1); }} className="btn-3d-red px-3 py-1 flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '14px' }}>
            <Ic src="/images/y2k-skull.png" size={12} /> THOÁT
          </button>
        </div>

        {/* Challenge info */}
        <div className="p-3 sm:p-4 mb-3 vhs-jitter" style={{
          background: `linear-gradient(145deg, ${template.colorDark} 0%, #050509 50%, ${template.colorDark} 100%)`,
          border: `3px outset ${template.color}`,
          boxShadow: `inset 0 0 40px ${template.color}08, 4px 4px 0 #030306, 0 0 20px ${template.color}12`,
        }}>
          <div className="flex items-center gap-3 mb-3">
            <Ic src={template.icon} size={42} className="animate-flame" glitch />
            <div className="flex-1 min-w-0">
              <h2 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: template.color, lineHeight: '2' }}>{challenge.name}</h2>
            </div>
            <Ic src={template.icon} size={22} className="animate-float opacity-40" />
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { label: 'ĐÃ GOM', value: formatVND(saved), c: template.color },
              { label: 'MỤC TIÊU', value: formatVND(target), c: '#ffd700' },
              { label: 'LVL', value: `${cc}/${challenge.totalDays}`, c: '#39ff14' },
            ].map((s, i) => (
              <div key={i} className="p-1.5 text-center" style={{
                background: `linear-gradient(145deg, ${template.colorDark}, #030306)`,
                border: `2px outset ${s.c}55`,
                boxShadow: `inset 0 0 15px ${s.c}06`,
              }}>
                <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '12px', color: s.c }}>
                  <Ic src={template.icon} size={9} /> {s.label}
                </p>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: i === 0 ? '#ffd700' : '#fff', lineHeight: '2.5' }}>{s.value}</p>
              </div>
            ))}
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

// ===== LOADING SCREEN =====
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=loading, 1=ready

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 2 + Math.random() * 5;
        if (next >= 100) { clearInterval(interval); setPhase(1); return 100; }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const icons = ['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png', '/images/y2k-trophy.png'];

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center" style={{ background: '#020204' }}>
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)' }} />

      {/* Floating icons */}
      {icons.map((ic, i) => (
        <img key={i} src={ic} alt="" className="absolute y2k-icon" style={{ width: 20 + i * 5, height: 20 + i * 5, opacity: 0.06, left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%`, animation: `float-y2k ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}

      <div className="relative z-10 text-center px-4">
        {/* MONEY BABY title — glitchy Y2K font */}
        <div className="vhs-jitter mb-2">
          <h1 style={{
            fontFamily: "'Press Start 2P', 'VT323', monospace",
            fontSize: 'clamp(28px, 10vw, 52px)',
            lineHeight: '1.4',
            color: '#ffd700',
            textShadow: '3px 3px 0 #ff4400, -2px -2px 0 #00d4ff, 5px 0 0 #ff002088, -5px 0 0 #00d4ff88, 0 0 20px rgba(255,215,0,0.4)',
            letterSpacing: '-2px',
          }}>
            M0NEY
          </h1>
          <h1 className="glitch-text" style={{
            fontFamily: "'Press Start 2P', 'VT323', monospace",
            fontSize: 'clamp(32px, 12vw, 60px)',
            lineHeight: '1.2',
            color: '#00d4ff',
            textShadow: '3px 3px 0 #ff2020, -2px -2px 0 #39ff14, 4px 0 0 #ff440088, -4px 0 0 #00ff0088, 0 0 25px rgba(0,212,255,0.5)',
            letterSpacing: '-3px',
          }}>
            BABYYY
          </h1>
        </div>

        {/* Decorative icons row */}
        <div className="flex justify-center gap-3 my-4">
          {icons.slice(0, 5).map((ic, i) => (
            <img key={i} src={ic} alt="" className="y2k-icon" style={{ width: 24 + (i === 2 ? 8 : 0), height: 24 + (i === 2 ? 8 : 0), opacity: 0.7, animation: `float-y2k ${2 + i * 0.3}s ease-in-out infinite` }} />
          ))}
        </div>

        {/* Loading bar */}
        <div className="w-64 sm:w-80 mx-auto mb-3" style={{ border: '3px outset #333', background: '#0a0a12', height: 20 }}>
          <div className="h-full progress-stripe transition-all duration-200" style={{ width: `${progress}%`, background: `linear-gradient(90deg, #ff4400, #ffd700, #00d4ff)` }} />
        </div>

        {/* Loading text */}
        <p className="glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#666' }}>
          {phase === 0 ? `ĐANG TẢI... ${Math.floor(progress)}%` : ''}
        </p>

        {/* Enter button */}
        {phase === 1 && (
          <button onClick={onDone}
            className="mt-4 px-8 py-3 animate-bounce-in animate-pulse-glow rounded-full cursor-pointer"
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#000',
              background: 'linear-gradient(180deg, #ffd700, #ff8800)',
              border: '3px outset #ffcc00',
              boxShadow: '0 0 30px rgba(255,215,0,0.4), 3px 3px 0 #333',
              textShadow: '0 0 0',
            }}>
            VÀO NGAYY !!!
          </button>
        )}

        {/* Subtitle */}
        <p className="mt-4" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#333' }}>
          ~ thử thách tiết kiệm tiềnn ~
        </p>
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
  const [loading, setLoading] = useState(true);
  const { particles, spawn } = useClickEffect();

  const save = useCallback((d: AppData) => { setData(d); saveData(d); }, []);

  // Unlock audio on first user interaction
  useEffect(() => {
    const handler = () => { unlockAudio(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
    playNavigate();
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

  // ===== LOADING SCREEN =====
  if (loading) return <LoadingScreen onDone={() => { setLoading(false); unlockAudio(); }} />;

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
      <ClickParticles particles={particles} />
      <Marquee />
      <div className="relative z-10 max-w-4xl mx-auto px-2 sm:px-4 pb-8">

        {/* HEADER */}
        <div className="text-center py-5 sm:py-8">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-3">
            <Ic src="/images/y2k-flame.png" size={32} className="animate-flame" glitch tap />
            <Ic src="/images/y2k-lightning.png" size={38} className="animate-float" glitch tap />
            <Ic src="/images/y2k-trophy.png" size={42} className="vhs-jitter" glitch tap />
            <Ic src="/images/y2k-lightning.png" size={38} className="animate-float" glitch tap />
            <Ic src="/images/y2k-flame.png" size={32} className="animate-flame" glitch tap />
          </div>
          <h1 onClick={tapTitle} className="glitch-text flex items-center justify-center gap-1 cursor-pointer" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(14px, 5vw, 22px)', lineHeight: '2.5', color: '#e0e0e0' }}>
            <Ic src="/images/y2k-star.png" size={18} tap /> THỬ THÁCH <Ic src="/images/y2k-star.png" size={18} tap />
          </h1>
          <h2 onClick={tapSubtitle} className="glitch-flicker cursor-pointer" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(10px, 3.5vw, 16px)', lineHeight: '2.2', background: 'linear-gradient(180deg, #ffd700, #ff8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 2px 0 #000)' }}>TIẾT KIỆM TIỀNN</h2>
          
          {/* Decorative line */}
          <div className="flex items-center gap-2 mt-3 max-w-xs mx-auto">
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }} />
            <Ic src="/images/y2k-dragon.png" size={18} className="animate-float" tap />
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #ff4400, transparent)' }} />
          </div>
        </div>

        {/* USER */}
        <div onClick={tapUser} className="retro-panel p-3 sm:p-4 mb-4 y2k-card vhs-jitter cursor-pointer">
          <div className="flex items-center gap-3 relative z-10">
            <Ic src="/images/y2k-skull.png" size={35} glitch tap />
            <div className="flex-1">
              <p className="glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#666' }}>Yo, chào bro</p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.5)', lineHeight: '2' }}>{data.userName}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Ic src="/images/y2k-trophy.png" size={28} glitch tap />
              <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#39ff14', textShadow: '0 0 6px rgba(57,255,20,0.4)' }}>
                {data.challenges.filter(c => c.isCompleted).length} GG
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE CHALLENGE BANNER */}
        {hasActive && activeChallenge && activeTemplate && (
          <div className="mb-4">
            <div className="p-4 sm:p-5 cursor-pointer y2k-card border-glow shape-pill relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${activeTemplate.colorDark} 0%, #050509 50%, ${activeTemplate.colorDark} 100%)`,
                border: `3px outset ${activeTemplate.color}`,
                boxShadow: `inset 0 0 40px ${activeTemplate.color}10, 4px 4px 0 #030306, 0 0 30px ${activeTemplate.color}20`,
              }}
              onClick={() => setScreen('progress')}>
              {/* BG watermark */}
              <div className="absolute -right-4 -top-4 opacity-[0.05]"><Ic src={activeTemplate.icon} size={90} filter={icFilter(activeChallenge.id)} /></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="flex-shrink-0 rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: `radial-gradient(circle, ${activeTemplate.colorDark}, ${activeTemplate.color}18)`, border: `2px solid ${activeTemplate.color}55`, boxShadow: `0 0 15px ${activeTemplate.color}25` }}>
                  <Ic src={activeTemplate.icon} size={34} className="animate-flame" glitch filter={icFilter(activeChallenge.id)} />
                </div>
                <div className="flex-1">
                  <p className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: activeTemplate.color, lineHeight: '2' }}>{activeChallenge.name}</p>
                  <p className="glitch-flicker" style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#bbb' }}>
                    {activeChallenge.completedDays.filter(Boolean).length}/{activeChallenge.totalDays} - Đang chiến!
                  </p>
                </div>
                <Ic src={activeTemplate.icon} size={22} className="animate-float" filter={icFilter(activeChallenge.id)} />
              </div>
              <div className="h-[2px] mb-3 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${activeTemplate.color}, transparent)` }} />
              <button onClick={(e) => { const ai = CHALLENGES.findIndex(ch => ch.id === activeChallenge.id); spawn(e, (ai % 8) as EffectType, activeTemplate.color, activeTemplate.icon, icFilter(activeChallenge.id)); }}
                className="w-full py-2.5 flex items-center justify-center gap-2 rounded-full relative z-10"
                style={{
                  fontFamily: "'VT323', monospace", fontSize: '19px', color: '#fff', cursor: 'pointer',
                  background: `linear-gradient(180deg, ${activeTemplate.color}cc 0%, ${activeTemplate.color}55 100%)`,
                  border: `3px outset ${activeTemplate.color}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 3px 3px 0 #0a0a0a, 0 0 18px ${activeTemplate.color}40`,
                  textShadow: `0 0 10px ${activeTemplate.color}, 1px 1px 2px #000`,
                }}>
                <Ic src={activeTemplate.icon} size={16} filter={icFilter(activeChallenge.id)} /> VÀO CHIẾN TIẾPP <Ic src={activeTemplate.icon} size={16} filter={icFilter(activeChallenge.id)} />
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
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
            {CHALLENGES.map((tm, idx) => {
              const isActive = data.activeChallengeId === tm.id;
              const dis = hasActive && !isActive;
              const f = icFilter(tm.id);
              const c = tm.color;
              const cd = tm.colorDark;
              const tiltClass = `tilt-${idx + 1}`;
              const idleClass = ['idle-breathe', 'idle-sway', 'idle-drift', 'idle-breathe', 'idle-sway', 'idle-drift', 'idle-breathe', 'idle-sway'][idx];

              // ===== 8 COMPLETELY UNIQUE CARDS =====
              // Mỗi card: shape, badge, layout, divider, button, rotate idle, text khác biệt hoàn toàn
              const CARD = (children: React.ReactNode) => (
                <div key={tm.id}
                  className={`relative overflow-hidden card-enter ${dis ? 'opacity-20 grayscale' : `y2k-card ${tiltClass} ${idleClass}`}`}
                  style={{ animationDelay: `${idx * 0.08}s`, ['--glow-c' as string]: `${c}20` }}>
                  {children}
                </div>
              );

              const efx = (idx % 8) as EffectType;
              const BTN = (text: string, radius: string) => isActive ? (
                <button onClick={(e) => { playClickByIndex(idx); spawn(e, efx, c, tm.icon, f); setScreen('progress'); }} className={`w-full py-2 flex items-center justify-center gap-2 ${radius}`}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#fff', cursor: 'pointer', background: `linear-gradient(180deg, ${c}cc, ${c}55)`, border: `2px outset ${c}`, textShadow: `0 0 6px ${c}` }}>
                  <Ic src={tm.icon} size={14} filter={f} tap /> CHIẾN TIẾPP <Ic src={tm.icon} size={14} filter={f} tap />
                </button>
              ) : dis ? (
                <div className={`w-full py-1.5 text-center ${radius}`} style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#222', border: '1px dashed #1a1a1a' }}>Hoàn thành thử thách hiện tại trước</div>
              ) : (
                <button onClick={(e) => { playClickByIndex(idx); spawn(e, efx, c, tm.icon, f); openSetup(tm.id); }} className={`w-full py-2.5 flex items-center justify-center gap-2 ${radius}`}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '19px', color: '#fff', cursor: 'pointer', background: `linear-gradient(180deg, ${c}cc, ${c}55)`, border: `3px outset ${c}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), 3px 3px 0 #080808, 0 0 15px ${c}30`, textShadow: `0 0 8px ${c}aa, 1px 1px 2px #000` }}>
                  <Ic src={tm.icon} size={16} filter={f} tap /> {text} <Ic src={tm.icon} size={16} filter={f} tap />
                </button>
              );

              // ===== CARD 0: FLAME — tròn, icon lớn trên đầu, centered =====
              if (idx === 0) return CARD(
                <div className="rounded-[22px] p-5" style={{ background: `linear-gradient(150deg, ${cd}, #040408, ${cd}cc)`, border: `3px outset ${c}`, boxShadow: `inset 0 0 40px ${c}06, 5px 5px 0 #030306, 0 0 25px ${c}10` }}>
                  <div className="absolute -top-4 -right-4 opacity-[0.04]"><Ic src={tm.icon} size={100} filter={f} /></div>
                  <div className="text-center mb-3 relative z-10">
                    <div className="w-[64px] h-[64px] rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}55`, boxShadow: `0 0 20px ${c}25` }}>
                      <Ic src={tm.icon} size={38} className="animate-flame" glitch={!dis} filter={f} tap />
                    </div>
                    <h4 className="glitch-flicker" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: c, lineHeight: '2.2' }}>{tm.name}</h4>
                    <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: '#aaa' }}>{tm.desc}</p>
                  </div>
                  <div className="flex gap-1 mb-3 justify-center relative z-10">{[...Array(14)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `${c}${30 + i * 5}` }} />)}</div>
                  <div className="relative z-10">{BTN('>>> CHIẾN >>>', 'rounded-full')}</div>
                </div>
              );

              // ===== CARD 1: LIGHTNING — vát, icon kim cương, ngang =====
              if (idx === 1) return CARD(
                <div className="p-5 rounded-tl-[28px] rounded-br-[28px] rounded-tr-[4px] rounded-bl-[4px]" style={{ background: `linear-gradient(160deg, ${cd}, #040408, ${cd})`, border: `3px outset ${c}`, boxShadow: `inset 0 0 30px ${c}06, 4px 5px 0 #030306, 0 0 20px ${c}10` }}>
                  <div className="absolute -bottom-6 -right-6 opacity-[0.04] rotate-45"><Ic src={tm.icon} size={90} filter={f} /></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 52, height: 52, transform: 'rotate(45deg)', borderRadius: '10px', background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}44`, boxShadow: `0 0 14px ${c}22` }}>
                      <div className="-rotate-45"><Ic src={tm.icon} size={28} className="animate-float" glitch={!dis} filter={f} tap /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: c, textShadow: `0 0 8px ${c}55`, lineHeight: '2.2' }}>{tm.name}</h4>
                      <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    </div>
                  </div>
                  <div className="h-[3px] mb-3 relative z-10" style={{ background: `repeating-linear-gradient(90deg, ${c}, ${c} 8px, transparent 8px, transparent 14px)` }} />
                  <div className="relative z-10">{BTN('[ BẮT ĐẦU ]', 'rounded-tl-[16px] rounded-br-[16px]')}</div>
                </div>
              );

              // ===== CARD 2: SKULL — cắt góc, dọc centered, hexagon badge =====
              if (idx === 2) return CARD(
                <div className="p-5" style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))', background: `linear-gradient(180deg, ${cd}, #040408, ${cd}cc)`, border: `3px outset ${c}`, boxShadow: `inset 0 0 35px ${c}06, 4px 4px 0 #030306` }}>
                  <div className="absolute top-2 left-2 opacity-[0.04]"><Ic src={tm.icon} size={50} filter={f} /></div>
                  <div className="text-center relative z-10">
                    <div className="w-[56px] h-[56px] mx-auto mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: `linear-gradient(180deg, ${cd}, ${c}22)`, boxShadow: `0 0 14px ${c}22` }}>
                      <Ic src={tm.icon} size={28} className="animate-float" glitch={!dis} filter={f} tap />
                    </div>
                    <h4 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: c, lineHeight: '2.2' }}>{tm.name}</h4>
                    <p className="mt-1 mb-3" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    <div className="flex items-center gap-2 mb-3 justify-center"><div className="flex-1 h-[1px] max-w-[50px]" style={{ background: `${c}44` }} /><Ic src={tm.icon} size={10} filter={f} tap /><div className="flex-1 h-[1px] max-w-[50px]" style={{ background: `${c}44` }} /></div>
                    {BTN('/// KHỞI ĐỘNG ///', 'rounded-none')}
                  </div>
                </div>
              );

              // ===== CARD 3: DRAGON — icon bên phải (reverse), bo ngược =====
              if (idx === 3) return CARD(
                <div className="p-5 rounded-tr-[26px] rounded-bl-[26px] rounded-tl-[4px] rounded-br-[4px]" style={{ background: `linear-gradient(200deg, ${cd}, #040408, ${cd})`, border: `3px outset ${c}`, boxShadow: `inset 0 0 30px ${c}06, 4px 4px 0 #030306, 0 0 20px ${c}10` }}>
                  <div className="absolute top-0 left-0 opacity-[0.04]"><Ic src={tm.icon} size={70} filter={f} /></div>
                  <div className="flex flex-row-reverse items-center gap-3 mb-3 relative z-10">
                    <div className="flex-shrink-0 w-[52px] h-[52px] rounded-[14px] flex items-center justify-center" style={{ background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}44`, boxShadow: `0 0 14px ${c}22` }}>
                      <Ic src={tm.icon} size={30} className="animate-float" glitch={!dis} filter={f} tap />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="glitch-flicker" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: c, textShadow: `0 0 8px ${c}55`, lineHeight: '2.2' }}>{tm.name}</h4>
                      <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    </div>
                  </div>
                  <div className="h-[2px] mb-3 relative z-10" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
                  <div className="relative z-10">{BTN('NHÂN ĐÔI >>>', 'rounded-tr-[18px] rounded-bl-[18px]')}</div>
                </div>
              );

              // ===== CARD 4: STAR — pill cực tròn, icon circle lớn, ngang =====
              if (idx === 4) return CARD(
                <div className="p-5 rounded-[32px]" style={{ background: `linear-gradient(145deg, ${cd}, #040408, ${cd}cc)`, border: `3px outset ${c}`, boxShadow: `inset 0 0 35px ${c}06, 4px 4px 0 #030306, 0 0 25px ${c}10` }}>
                  <div className="absolute -top-5 right-4 opacity-[0.05] rotate-12"><Ic src={tm.icon} size={80} filter={f} /></div>
                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}55`, boxShadow: `0 0 18px ${c}25` }}>
                      <Ic src={tm.icon} size={34} className="animate-spin-slow" glitch={!dis} filter={f} tap />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: c, textShadow: `0 0 8px ${c}55`, lineHeight: '2.2' }}>{tm.name}</h4>
                      <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-3 justify-center relative z-10">{[...Array(7)].map((_, i) => <Ic key={i} src={tm.icon} size={7 + (i === 3 ? 4 : 0)} filter={f} className={i === 3 ? 'animate-spin-slow' : ''} />)}</div>
                  <div className="relative z-10">{BTN('~ QUAY MAY MẮN ~', 'rounded-full')}</div>
                </div>
              );

              // ===== CARD 5: TROPHY — vuông cứng quân đội, ngang, double border =====
              if (idx === 5) return CARD(
                <div className="p-4 rounded-[3px]" style={{ background: `linear-gradient(135deg, ${cd}, #040408)`, border: `4px double ${c}`, boxShadow: `inset 0 0 25px ${c}05, 3px 3px 0 #030306` }}>
                  <div className="absolute bottom-0 right-0 opacity-[0.04]"><Ic src={tm.icon} size={60} filter={f} /></div>
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="flex-shrink-0 w-[46px] h-[46px] rounded-[3px] flex items-center justify-center" style={{ background: `${cd}`, border: `2px solid ${c}55` }}>
                      <Ic src={tm.icon} size={26} className="animate-float" glitch={!dis} filter={f} tap />
                    </div>
                    <div className="flex-1">
                      <h4 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: c, letterSpacing: '2px', lineHeight: '2' }}>{tm.name}</h4>
                      <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#aaa' }}>{tm.desc}</p>
                    </div>
                  </div>
                  <div className="relative z-10"><div className="h-[1px] mb-1" style={{ background: `${c}55` }} /><div className="h-[1px] mb-3" style={{ background: `${c}22` }} /></div>
                  <div className="relative z-10">{BTN('||| KỶ LUẬT |||', 'rounded-[2px]')}</div>
                </div>
              );

              // ===== CARD 6: FLAME-RED — octagon, dọc centered, star badge =====
              if (idx === 6) return CARD(
                <div className="p-5" style={{ clipPath: 'polygon(6% 0%, 94% 0%, 100% 10%, 100% 90%, 94% 100%, 6% 100%, 0% 90%, 0% 10%)', background: `linear-gradient(165deg, ${cd}, #040408, ${cd}ee)`, border: `3px outset ${c}`, boxShadow: `inset 0 0 40px ${c}08` }}>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-[0.04]"><Ic src={tm.icon} size={80} filter={f} /></div>
                  <div className="text-center relative z-10">
                    <div className="w-[54px] h-[54px] mx-auto mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', background: `linear-gradient(180deg, ${cd}, ${c}30)` }}>
                      <Ic src={tm.icon} size={26} className="animate-flame" glitch={!dis} filter={f} tap />
                    </div>
                    <h4 className="glitch-text" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: c, lineHeight: '2.2' }}>{tm.name}</h4>
                    <p className="mt-1 mb-3" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    <div className="h-[3px] mb-3" style={{ background: `repeating-linear-gradient(135deg, ${c}88 0px, ${c}88 4px, transparent 4px, transparent 8px)` }} />
                    {BTN('<<< BÃO TỐ >>>', 'rounded-[6px]')}
                  </div>
                </div>
              );

              // ===== CARD 7: DRAGON-BLUE — wave bo, badge oval, icon trái =====
              return CARD(
                <div className="p-5 rounded-tl-[30px] rounded-tr-[8px] rounded-br-[30px] rounded-bl-[8px]" style={{ background: `linear-gradient(175deg, ${cd}, #040408, ${cd})`, border: `3px outset ${c}`, boxShadow: `inset 0 0 35px ${c}06, 4px 4px 0 #030306, 0 0 20px ${c}10` }}>
                  <div className="absolute top-3 right-3 opacity-[0.04] -rotate-12"><Ic src={tm.icon} size={70} filter={f} /></div>
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 44, height: 58, borderRadius: '40%', background: `radial-gradient(circle, ${cd}, ${c}20)`, border: `2px solid ${c}44`, boxShadow: `0 0 14px ${c}22` }}>
                      <Ic src={tm.icon} size={28} className="animate-float" glitch={!dis} filter={f} tap />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="glitch-flicker" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: c, textShadow: `0 0 8px ${c}55`, lineHeight: '2.2' }}>{tm.name}</h4>
                      <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#aaa' }}>{tm.desc}</p>
                    </div>
                  </div>
                  <div className="h-[2px] mb-3 relative z-10" style={{ background: `linear-gradient(90deg, transparent, ${c}88, ${c}, ${c}88, transparent)` }} />
                  <div className="relative z-10">{BTN('ĐẠI CHIẾN !!!', 'rounded-tl-[20px] rounded-br-[20px]')}</div>
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
            <Ic src="/images/y2k-star.png" size={12} className="animate-spin-slow cursor-pointer" tap />
            <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, #333, transparent)' }} />
          </div>
          <div className="flex justify-center gap-2 mb-3">
            {['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png', '/images/y2k-trophy.png'].map((ic, i) => (
              <span key={i} onClick={() => tapFooterIcon(i)} className="cursor-pointer">
                <Ic src={ic} size={16} glitch className={i % 2 === 0 ? 'animate-float' : ''} />
              </span>
            ))}
          </div>
          <p onClick={tapSparkle} className="glitch-flicker flex items-center justify-center gap-1 cursor-pointer" style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#444' }}>
            <Ic src="/images/y2k-flame.png" size={12} tap /> Chiến Binh Tiết Kiệm <Ic src="/images/y2k-flame.png" size={12} tap />
          </p>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#2a2a2a' }}>Dữ liệu lưu trên trình duyệtt ~ đừng xóa cache nhaa</p>
        </div>
      </div>
      <Marquee />
    </div>
  );
}
