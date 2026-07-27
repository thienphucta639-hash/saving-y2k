import { useState, useEffect, useCallback, useRef } from 'react';
import { loadData, saveData, AppData, ChallengeData } from './utils/storage';
import { playY2KSuccess, playY2KClick, playY2KWin } from './utils/sounds';

// ===== Challenge Definitions =====
interface ChallengeTemplate {
  id: string;
  name: string;
  desc: string;
  icon: string;
  type: string;
  defaultDays: number;
  getDayAmount: (day: number, totalDays: number) => number;
  color: string;
}

const CHALLENGES: ChallengeTemplate[] = [
  {
    id: '365day',
    name: '365 NGÀY CHINH PHỤC',
    desc: 'Ngày 1 = 1.000đ, Ngày 2 = 2.000đ... Mỗi ngày leo thêm 1 bậc!',
    icon: '/images/y2k-flame.png',
    type: 'incremental',
    defaultDays: 365,
    getDayAmount: (day) => day * 1000,
    color: '#ff4400',
  },
  {
    id: '52week',
    name: '52 TUẦN THÉP',
    desc: 'Tuần 1 = 10k, tuần 2 = 20k... Ý chí sắt đá mỗi tuần!',
    icon: '/images/y2k-lightning.png',
    type: 'weekly',
    defaultDays: 52,
    getDayAmount: (week) => week * 10000,
    color: '#00d4ff',
  },
  {
    id: 'countdown30',
    name: '30 NGÀY ĐẾM NGƯỢC',
    desc: 'Từ 30k giảm dần về 1k! Bắt đầu mạnh, về đích nhẹ nhàng~',
    icon: '/images/y2k-skull.png',
    type: 'countdown',
    defaultDays: 30,
    getDayAmount: (day, total) => (total - day + 1) * 1000,
    color: '#c0c0c0',
  },
  {
    id: 'double14',
    name: '14 NGÀY NHÂN ĐÔI',
    desc: '1k > 2k > 4k > 8k... Nhân đôi mỗi ngày, cấp số nhân!',
    icon: '/images/y2k-dragon.png',
    type: 'double',
    defaultDays: 14,
    getDayAmount: (day) => Math.pow(2, day - 1) * 1000,
    color: '#39ff14',
  },
  {
    id: 'random30',
    name: '30 NGÀY MAY RỦI',
    desc: 'Quay vòng xoay số phận - mỗi ngày 1 con số bất ngờ!',
    icon: '/images/y2k-star.png',
    type: 'random',
    defaultDays: 30,
    getDayAmount: () => {
      const amounts = [5000, 10000, 15000, 20000, 25000, 30000, 50000, 2000, 8000, 12000];
      return amounts[Math.floor(Math.random() * amounts.length)];
    },
    color: '#ffd700',
  },
  {
    id: 'fixed90',
    name: '90 NGÀY KỶ LUẬT',
    desc: 'Mỗi ngày đúng 20k. Không thêm không bớt. Kỷ luật tạo nên chiến thắng!',
    icon: '/images/y2k-lightning.png',
    type: 'fixed',
    defaultDays: 90,
    getDayAmount: () => 20000,
    color: '#00aaff',
  },
  {
    id: 'step7',
    name: '7 NGÀY BÃO TỐ',
    desc: '7 ngày tăng dã man: 5k>10k>20k>50k>100k>200k>500k!',
    icon: '/images/y2k-flame.png',
    type: 'steps',
    defaultDays: 7,
    getDayAmount: (day) => [5000, 10000, 20000, 50000, 100000, 200000, 500000][day - 1] || 5000,
    color: '#ff2020',
  },
  {
    id: 'payday',
    name: '12 THÁNG ĐẠI CHIẾN',
    desc: 'Mỗi tháng bỏ 500k. 1 năm = 6 triệu. Trận chiến dài hơi!',
    icon: '/images/y2k-dragon.png',
    type: 'monthly',
    defaultDays: 12,
    getDayAmount: () => 500000,
    color: '#22cc88',
  },
];

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function getTemplate(id: string): ChallengeTemplate | undefined {
  return CHALLENGES.find(c => c.id === id);
}

// ===== Y2K Icon Component =====
function Y2KIcon({ src, size = 40, className = '' }: { src: string; size?: number; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`y2k-icon inline-block ${className}`}
      style={{ imageRendering: 'auto', opacity: 0.8 }}
    />
  );
}

// Inline mini Y2K icon for use inside text
function MiniIcon({ src, size = 16 }: { src: string; size?: number }) {
  return (
    <img src={src} alt="" width={size} height={size}
      className="y2k-icon inline-block align-middle"
      style={{ imageRendering: 'auto', opacity: 0.75, margin: '0 2px' }}
    />
  );
}

// ===== Floating Background Icons =====
function FloatingIcons() {
  const icons = ['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map((icon, i) => (
        <img key={i} src={icon} alt="" className="absolute y2k-icon"
          style={{
            width: 25 + (i * 8), height: 25 + (i * 8), opacity: 0.07,
            left: `${10 + i * 18}%`, top: `${8 + (i % 4) * 25}%`,
            animation: `float-y2k ${3 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`, filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}

// ===== Retro Marquee =====
function RetroMarquee() {
  return (
    <div className="overflow-hidden py-1" style={{
      background: 'linear-gradient(90deg, #ff2020, #ff8800, #ffd700, #39ff14, #00d4ff, #ff2020)',
      borderTop: '2px solid #333', borderBottom: '2px solid #333',
    }}>
      <div className="animate-marquee whitespace-nowrap flex items-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: '#000', fontWeight: 'bold' }}>
        <MiniIcon src="/images/y2k-lightning.png" size={14} />
        {' '}TIẾT KIỆM LÀ SỨC MẠNHH{' '}
        <MiniIcon src="/images/y2k-flame.png" size={14} />
        {' '}ĐỪNG BỎ CUỘC BRO{' '}
        <MiniIcon src="/images/y2k-star.png" size={14} />
        {' '}MONEY MONEY MONEYY{' '}
        <MiniIcon src="/images/y2k-lightning.png" size={14} />
        {' '}TÍCH TIỂU THÀNH ĐẠI{' '}
        <MiniIcon src="/images/y2k-skull.png" size={14} />
        {' '}CHIẾN BINH TIẾT KIỆM{' '}
        <MiniIcon src="/images/y2k-dragon.png" size={14} />
        {' '}GOM TỪNG ĐỒNGG{' '}
        <MiniIcon src="/images/y2k-flame.png" size={14} />
        {' '}LVL UP MỖI NGÀYY{' '}
        <MiniIcon src="/images/y2k-star.png" size={14} />
      </div>
    </div>
  );
}

// ===== Lucky Wheel =====
function LuckyWheel({ onResult, amounts }: { onResult: (amount: number) => void; amounts: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const segCount = amounts.length;
  const colors = ['#ff2020', '#00d4ff', '#ffd700', '#39ff14', '#ff8800', '#c0c0c0', '#00aaff', '#ff4400', '#22cc88', '#9944ff'];

  useEffect(() => { drawWheel(rotation); }, [rotation]);

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const anglePerSeg = (2 * Math.PI) / segCount;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < segCount; i++) {
      const startAngle = rot + i * anglePerSeg;
      const endAngle = startAngle + anglePerSeg;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      const baseColor = colors[i % colors.length];
      grad.addColorStop(0, '#222');
      grad.addColorStop(0.3, baseColor);
      grad.addColorStop(1, baseColor + '99');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + anglePerSeg / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px VT323, monospace';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText((amounts[i] / 1000) + 'k', radius * 0.62, 5);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(center - 4, center - 4, 0, center, center, 22);
    hubGrad.addColorStop(0, '#555');
    hubGrad.addColorStop(0.5, '#222');
    hubGrad.addColorStop(1, '#111');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 12px VT323';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 6;
    ctx.fillText('SPIN', center, center + 4);
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(center - 12, 5);
    ctx.lineTo(center + 12, 5);
    ctx.lineTo(center, 26);
    ctx.closePath();
    ctx.fillStyle = '#ff2020';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    playY2KClick();
    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
    const startRot = rotation;
    const duration = 4000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + totalRotation * eased;
      setRotation(currentRot);
      drawWheel(currentRot);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalAngle = currentRot % (2 * Math.PI);
        const anglePerSeg = (2 * Math.PI) / segCount;
        const pointerAngle = (2 * Math.PI - finalAngle + Math.PI * 1.5) % (2 * Math.PI);
        const segIndex = Math.floor(pointerAngle / anglePerSeg) % segCount;
        setResult(amounts[segIndex]);
        setSpinning(false);
        onResult(amounts[segIndex]);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 240, height: 240 }}>
        <canvas ref={canvasRef} width={240} height={240} style={{ borderRadius: '50%', border: '3px outset #444' }} />
      </div>
      <button onClick={spin} disabled={spinning} className="btn-3d-red px-6 py-2 flex items-center gap-2" style={{ fontFamily: "'VT323', monospace", fontSize: '22px' }}>
        <MiniIcon src="/images/y2k-star.png" size={18} />
        {spinning ? ' ĐANG QUAY...' : ' QUAY NGAY!'}
        <MiniIcon src="/images/y2k-star.png" size={18} />
      </button>
      {result !== null && (
        <div className="text-center animate-bounce-in flex items-center gap-2 justify-center" style={{ fontFamily: "'VT323', monospace" }}>
          <MiniIcon src="/images/y2k-lightning.png" size={20} />
          <span className="text-2xl" style={{ color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.6), 2px 2px 0 #000' }}>
            {formatVND(result)}
          </span>
          <MiniIcon src="/images/y2k-lightning.png" size={20} />
        </div>
      )}
    </div>
  );
}

// ===== Confetti =====
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    color: ['#ff2020', '#00d4ff', '#ffd700', '#39ff14', '#ff8800', '#c0c0c0'][i % 6],
    size: 5 + Math.random() * 10,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-20px',
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '0',
          animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ===== Win Certificate =====
function WinCertificate({ challenge, userName, total, onClose }: {
  challenge: ChallengeData; userName: string; total: number; onClose: () => void;
}) {
  useEffect(() => { playY2KWin(); }, []);
  const decorIcons = ['/images/y2k-flame.png', '/images/y2k-lightning.png', '/images/y2k-skull.png', '/images/y2k-dragon.png', '/images/y2k-star.png'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <Confetti />
      <div className="animate-bounce-in relative max-w-lg w-full p-1" style={{
        background: 'linear-gradient(135deg, #ffd700, #ff4400, #00d4ff, #ffd700)',
      }}>
        <div className="p-6 text-center" style={{
          background: 'linear-gradient(135deg, #0a0a18, #111122)', border: '3px inset #ffd700',
        }}>
          <Y2KIcon src="/images/y2k-trophy.png" size={80} className="mx-auto mb-3" />

          <h2 className="mb-2 animate-electric" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '14px', lineHeight: '2',
          }}>
            <MiniIcon src="/images/y2k-star.png" size={16} /> BẢNG VÀNG VINH DANH <MiniIcon src="/images/y2k-star.png" size={16} />
          </h2>
          <h3 className="mb-1" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#ffd700', lineHeight: '1.8',
          }}>
            ~ CHIẾN BINH TIẾT KIỆM XUẤT SẮC ~
          </h3>

          <div className="my-4 py-3 px-4" style={{ border: '2px solid #ffd700', background: 'rgba(255,215,0,0.03)' }}>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: '#00d4ff' }}>
              Tuyên dương chiến biinhh
            </p>
            <p className="my-2" style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '13px',
              color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.5), 2px 2px 0 #000', lineHeight: '2',
            }}>
              {userName}
            </p>
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#aaa' }}>
              Đã hoàn thành xuất sắcc thử thách
            </p>
            <p className="mt-1" style={{
              fontFamily: "'VT323', monospace", fontSize: '22px',
              color: '#ff4400', textShadow: '0 0 8px rgba(255,68,0,0.5)',
            }}>
              "{challenge.name}"
            </p>
          </div>

          <div className="my-3">
            <p style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#888' }}>
              Tổng tiền đã tiết kiệmm:
            </p>
            <p className="animate-electric" style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '16px', lineHeight: '2.5',
            }}>
              {formatVND(total)}
            </p>
          </div>

          <div className="flex justify-center gap-3 my-3">
            {decorIcons.map((ic, i) => (
              <Y2KIcon key={i} src={ic} size={30} className="" />
            ))}
          </div>

          <p style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#555' }}>
            ~ Bro quá đỉnhh! Tiếp tục chiến nha ~
          </p>

          <button onClick={onClose} className="btn-3d-gold mt-4 px-8 py-2 flex items-center gap-2 mx-auto" style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
            <MiniIcon src="/images/y2k-lightning.png" size={16} /> ĐÓNG <MiniIcon src="/images/y2k-lightning.png" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Challenge Progress View =====
function ChallengeProgress({
  challenge, template, onToggleDay, onBack, userName,
}: {
  challenge: ChallengeData; template: ChallengeTemplate;
  onToggleDay: (dayIndex: number, amount: number) => void;
  onBack: () => void; userName: string;
}) {
  const [showWin, setShowWin] = useState(false);
  const [wheelDay, setWheelDay] = useState<number | null>(null);

  const completedCount = challenge.completedDays.filter(Boolean).length;
  const progress = (completedCount / challenge.totalDays) * 100;
  const dayAmounts = Array.from({ length: challenge.totalDays }, (_, i) =>
    template.getDayAmount(i + 1, challenge.totalDays)
  );
  const totalSaved = challenge.completedDays.reduce((sum, done, i) => done ? sum + dayAmounts[i] : sum, 0);
  const totalTarget = dayAmounts.reduce((sum, a) => sum + a, 0);
  const isCompleted = completedCount === challenge.totalDays;

  const handleDayClick = (dayIndex: number) => {
    if (challenge.completedDays[dayIndex]) { onToggleDay(dayIndex, dayAmounts[dayIndex]); return; }
    if (template.type === 'random') { setWheelDay(dayIndex); }
    else { onToggleDay(dayIndex, dayAmounts[dayIndex]); playY2KSuccess(); }
  };

  const handleWheelResult = (amount: number) => {
    if (wheelDay !== null) {
      dayAmounts[wheelDay] = amount;
      setTimeout(() => { onToggleDay(wheelDay, amount); playY2KSuccess(); setWheelDay(null); }, 1500);
    }
  };

  useEffect(() => { if (isCompleted && !showWin) setShowWin(true); }, [isCompleted]);

  const labelForDay = template.type === 'weekly' ? 'Tuần' : template.type === 'monthly' ? 'Tháng' : 'Ngày';

  return (
    <div className="min-h-screen grid-pattern relative">
      <FloatingIcons />
      {showWin && <WinCertificate challenge={challenge} userName={userName} total={totalSaved} onClose={() => setShowWin(false)} />}

      <div className="relative z-10 p-3 max-w-5xl mx-auto">
        <button onClick={onBack} className="btn-3d px-4 py-1 mb-3" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
          {'<<<'} QUAY LẠII
        </button>

        {/* Challenge Header */}
        <div className="retro-panel p-4 mb-4">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Y2KIcon src={template.icon} size={50} className="animate-flame" />
            <div className="flex-1 min-w-0">
              <h2 className="flex items-center gap-2 flex-wrap" style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
                color: template.color, textShadow: `0 0 12px ${template.color}80`, lineHeight: '1.8',
              }}>
                <MiniIcon src={template.icon} size={16} /> {challenge.name}
              </h2>
              <p style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: '#999' }}>
                {template.desc}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="retro-panel-fire p-2 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#ff4400' }}>
                <MiniIcon src="/images/y2k-flame.png" size={12} /> ĐÃ GOM
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#ffd700', lineHeight: '2.2' }}>
                {formatVND(totalSaved)}
              </p>
            </div>
            <div className="retro-panel-cyan p-2 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#00d4ff' }}>
                <MiniIcon src="/images/y2k-star.png" size={12} /> MỤC TIÊU
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#fff', lineHeight: '2.2' }}>
                {formatVND(totalTarget)}
              </p>
            </div>
            <div className="retro-panel-green p-2 text-center">
              <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#39ff14' }}>
                <MiniIcon src="/images/y2k-lightning.png" size={12} /> TIẾN ĐỘ
              </p>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '10px', color: '#fff', lineHeight: '2.2' }}>
                {completedCount}/{challenge.totalDays}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-7" style={{ background: '#0a0a12', border: '3px inset #333' }}>
            <div className="h-full progress-stripe transition-all duration-500" style={{
              width: `${progress}%`, background: `linear-gradient(90deg, ${template.color}, #ffd700)`,
            }} />
            <span className="absolute inset-0 flex items-center justify-center" style={{
              fontFamily: "'VT323', monospace", fontSize: '16px', color: '#fff',
              textShadow: '1px 1px 3px #000, 0 0 5px #000',
            }}>
              {progress.toFixed(1)}% HOÀN THÀNHH
            </span>
          </div>
        </div>

        {/* Lucky Wheel Modal */}
        {wheelDay !== null && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
            <div className="retro-panel p-5 text-center">
              <h3 className="mb-3 animate-electric flex items-center justify-center gap-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', lineHeight: '2' }}>
                <MiniIcon src="/images/y2k-star.png" size={16} /> VÒNG QUAY SỐ PHẬN <MiniIcon src="/images/y2k-star.png" size={16} />
              </h3>
              <p className="mb-3" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#999' }}>
                {labelForDay} {wheelDay + 1} - Quay để xem số phận!
              </p>
              <LuckyWheel onResult={handleWheelResult} amounts={[5000, 10000, 15000, 20000, 25000, 30000, 50000, 2000, 8000, 12000]} />
              <button onClick={() => setWheelDay(null)} className="btn-3d mt-4 px-4 py-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                HỦY
              </button>
            </div>
          </div>
        )}

        {/* Day Grid */}
        <div className="retro-panel p-3">
          <h3 className="mb-3 text-center flex items-center justify-center gap-2" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.4)', lineHeight: '1.8',
          }}>
            <MiniIcon src="/images/y2k-lightning.png" size={14} /> BẢNG CHIẾN TÍCHH <MiniIcon src="/images/y2k-lightning.png" size={14} />
          </h3>

          <div className={`grid gap-2 ${
            challenge.totalDays <= 14 ? 'grid-cols-4 sm:grid-cols-7' :
            challenge.totalDays <= 52 ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10' :
            'grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20'
          }`}>
            {Array.from({ length: challenge.totalDays }, (_, i) => {
              const done = challenge.completedDays[i];
              const amount = dayAmounts[i];
              return (
                <button key={i} onClick={() => handleDayClick(i)}
                  className="relative transition-all duration-150 hover:scale-110 hover:z-10"
                  style={{
                    background: done
                      ? `linear-gradient(135deg, ${template.color}cc, ${template.color}55)`
                      : 'linear-gradient(135deg, #111120, #0a0a15)',
                    border: done ? `2px solid ${template.color}` : '2px outset #2a2a3a',
                    boxShadow: done ? `0 0 10px ${template.color}44, inset 0 0 12px ${template.color}22` : '2px 2px 0 #050508',
                    padding: '3px 2px',
                    minHeight: challenge.totalDays <= 14 ? '70px' : '48px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: challenge.totalDays <= 30 ? '14px' : '11px', color: done ? '#fff' : '#555' }}>
                    {labelForDay.charAt(0)}{i + 1}
                  </span>
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: challenge.totalDays <= 30 ? '12px' : '9px', color: done ? '#ffd700' : '#444' }}>
                    {amount >= 1000000 ? (amount / 1000000).toFixed(0) + 'tr' : (amount / 1000).toFixed(0) + 'k'}
                  </span>
                  {done && <MiniIcon src="/images/y2k-star.png" size={challenge.totalDays <= 30 ? 14 : 10} />}
                </button>
              );
            })}
          </div>
        </div>

        {isCompleted && (
          <div className="text-center mt-4">
            <button onClick={() => setShowWin(true)} className="btn-3d-gold px-6 py-3 animate-pulse-glow flex items-center gap-2 mx-auto"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px' }}>
              <Y2KIcon src="/images/y2k-trophy.png" size={20} /> XEM BẢNG VINH DANH <Y2KIcon src="/images/y2k-trophy.png" size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(data.activeChallengeId);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [tempName, setTempName] = useState(data.userName);
  const [customDays, setCustomDays] = useState<Record<string, number>>({});

  const updateData = useCallback((newData: AppData) => { setData(newData); saveData(newData); }, []);

  const startChallenge = (templateId: string) => {
    const template = getTemplate(templateId);
    if (!template) return;
    const days = customDays[templateId] || template.defaultDays;
    const existing = data.challenges.find(c => c.id === templateId);
    if (existing) { setSelectedChallenge(templateId); updateData({ ...data, activeChallengeId: templateId }); return; }
    const dayAmounts = Array.from({ length: days }, (_, i) => template.getDayAmount(i + 1, days));
    const totalTarget = dayAmounts.reduce((s, a) => s + a, 0);
    const newChallenge: ChallengeData = {
      id: templateId, name: template.name, type: template.type,
      totalDays: days, completedDays: new Array(days).fill(false),
      totalTarget, startDate: new Date().toISOString(), isActive: true, isCompleted: false,
    };
    playY2KClick();
    updateData({ ...data, challenges: [...data.challenges, newChallenge], activeChallengeId: templateId });
    setSelectedChallenge(templateId);
  };

  const toggleDay = (challengeId: string, dayIndex: number, _amount: number) => {
    const challenges = data.challenges.map(c => {
      if (c.id !== challengeId) return c;
      const newCompleted = [...c.completedDays];
      newCompleted[dayIndex] = !newCompleted[dayIndex];
      return { ...c, completedDays: newCompleted, isCompleted: newCompleted.every(Boolean) };
    });
    updateData({ ...data, challenges });
  };

  const deleteChallenge = (id: string) => {
    updateData({ ...data, challenges: data.challenges.filter(c => c.id !== id), activeChallengeId: null });
    setSelectedChallenge(null);
  };

  const saveName = () => { updateData({ ...data, userName: tempName }); setShowNameEdit(false); };

  if (selectedChallenge) {
    const challenge = data.challenges.find(c => c.id === selectedChallenge);
    const template = getTemplate(selectedChallenge);
    if (challenge && template) {
      return (
        <ChallengeProgress challenge={challenge} template={template}
          onToggleDay={(dayIndex, amount) => toggleDay(selectedChallenge, dayIndex, amount)}
          onBack={() => { setSelectedChallenge(null); updateData({ ...data, activeChallengeId: null }); }}
          userName={data.userName}
        />
      );
    }
  }

  // ====== MAIN MENU ======
  return (
    <div className="min-h-screen grid-pattern relative">
      <FloatingIcons />
      <RetroMarquee />

      <div className="relative z-10 max-w-4xl mx-auto p-3 pb-10">

        {/* ===== HEADER ===== */}
        <div className="text-center py-6">
          <div className="flex justify-center items-center gap-3 mb-3">
            <Y2KIcon src="/images/y2k-flame.png" size={45} className="animate-flame" />
            <Y2KIcon src="/images/y2k-lightning.png" size={50} className="animate-float" />
            <Y2KIcon src="/images/y2k-flame.png" size={45} className="animate-flame" />
          </div>
          <h1 className="flex items-center justify-center gap-2" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '18px', lineHeight: '2.2',
            background: 'linear-gradient(180deg, #fff, #c0c0c0, #fff, #808080)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(3px 3px 0 #000) drop-shadow(0 0 15px rgba(0,170,255,0.3))',
          }}>
            <MiniIcon src="/images/y2k-lightning.png" size={20} /> THỬ THÁCH <MiniIcon src="/images/y2k-lightning.png" size={20} />
          </h1>
          <h2 style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '14px', lineHeight: '2',
            background: 'linear-gradient(180deg, #ffd700, #ff8800)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 2px 0 #000)',
          }}>
            TIẾT KIỆM TIỀNN
          </h2>
          <div className="flex justify-center gap-3 mt-3">
            <Y2KIcon src="/images/y2k-flame.png" size={20} />
            <Y2KIcon src="/images/y2k-star.png" size={20} />
            <Y2KIcon src="/images/y2k-lightning.png" size={20} />
            <Y2KIcon src="/images/y2k-star.png" size={20} />
            <Y2KIcon src="/images/y2k-flame.png" size={20} />
          </div>
        </div>

        {/* ===== USER INFO ===== */}
        <div className="retro-panel p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Y2KIcon src="/images/y2k-skull.png" size={35} />
            <div>
              <p style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#555' }}>
                Yo, chào bro
              </p>
              {showNameEdit ? (
                <div className="flex gap-2 items-center">
                  <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="px-2 py-1" />
                  <button onClick={saveName} className="btn-3d-blue px-3 py-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>OK</button>
                </div>
              ) : (
                <p style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
                  color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.4)', lineHeight: '1.8', cursor: 'pointer',
                }} onClick={() => setShowNameEdit(true)}>
                  {data.userName} ~
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#555' }}>
                Trạng tháii:
              </p>
              <p className="flex items-center gap-1 justify-end" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#39ff14' }}>
                <MiniIcon src="/images/y2k-lightning.png" size={14} />
                {data.challenges.filter(c => !c.isCompleted).length} đang chiến
                {' '}<MiniIcon src="/images/y2k-star.png" size={14} />{' '}
                {data.challenges.filter(c => c.isCompleted).length} đã GG
              </p>
            </div>
            <Y2KIcon src="/images/y2k-trophy.png" size={35} />
          </div>
        </div>

        {/* ===== ACTIVE CHALLENGES ===== */}
        {data.challenges.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2" style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
              color: '#ff4400', textShadow: '0 0 10px rgba(255,68,0,0.4)', lineHeight: '1.8',
            }}>
              <Y2KIcon src="/images/y2k-flame.png" size={22} className="animate-flame" />
              THỬ THÁCH ĐANG CHIẾN
            </h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {data.challenges.map(ch => {
                const tmpl = getTemplate(ch.id);
                if (!tmpl) return null;
                const done = ch.completedDays.filter(Boolean).length;
                const prog = (done / ch.totalDays) * 100;
                const amounts = Array.from({ length: ch.totalDays }, (_, i) => tmpl.getDayAmount(i + 1, ch.totalDays));
                const saved = ch.completedDays.reduce((s, d, i) => d ? s + amounts[i] : s, 0);
                return (
                  <div key={ch.id} className="retro-panel-fire p-3 relative">
                    {ch.isCompleted && (
                      <div className="absolute top-1 right-2">
                        <Y2KIcon src="/images/y2k-trophy.png" size={22} />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Y2KIcon src={tmpl.icon} size={24} />
                      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: tmpl.color, lineHeight: '1.6' }}>
                        {ch.name}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mb-2" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                      <span style={{ color: '#ffd700', textShadow: '0 0 5px rgba(255,215,0,0.3)' }}>{formatVND(saved)}</span>
                      <span style={{ color: '#666' }}>{done}/{ch.totalDays}</span>
                    </div>
                    <div className="h-4 mb-2" style={{ background: '#0a0a12', border: '2px inset #222' }}>
                      <div className="h-full progress-stripe" style={{ width: `${prog}%`, background: `linear-gradient(90deg, ${tmpl.color}, #ffd700)` }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { playY2KClick(); setSelectedChallenge(ch.id); updateData({ ...data, activeChallengeId: ch.id }); }}
                        className="btn-3d-blue flex-1 py-1 flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '18px' }}>
                        <MiniIcon src="/images/y2k-flame.png" size={14} /> CHIẾN TIẾPP
                      </button>
                      <button onClick={() => { if (confirm('Xóa thử thách này? Dữ liệu sẽ mất hết!')) deleteChallenge(ch.id); }}
                        className="btn-3d py-1 px-3" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ff2020' }}>
                        X
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== CHALLENGE SELECTION ===== */}
        <div>
          <h3 className="mb-3 flex items-center gap-2" style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.4)', lineHeight: '1.8',
          }}>
            <Y2KIcon src="/images/y2k-lightning.png" size={22} className="animate-float" />
            CHỌN THỬ THÁCH MỚII
          </h3>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {CHALLENGES.map((tmpl) => {
              const exists = data.challenges.some(c => c.id === tmpl.id);
              const days = customDays[tmpl.id] || tmpl.defaultDays;
              const previewAmounts = Array.from({ length: days }, (_, i) => tmpl.getDayAmount(i + 1, days));
              const previewTotal = previewAmounts.reduce((s, a) => s + a, 0);
              return (
                <div key={tmpl.id} className="retro-panel-cyan p-4 relative overflow-hidden" style={{ transition: 'transform 0.15s' }}>
                  <div className="absolute top-0 right-0 opacity-10">
                    <Y2KIcon src={tmpl.icon} size={70} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-3 mb-2">
                      <Y2KIcon src={tmpl.icon} size={40} className="animate-float flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="flex items-center gap-1" style={{
                          fontFamily: "'Press Start 2P', monospace", fontSize: '9px',
                          color: tmpl.color, textShadow: `0 0 8px ${tmpl.color}55`, lineHeight: '1.8',
                        }}>
                          {tmpl.name}
                        </h4>
                        <p className="mt-1" style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: '#999', lineHeight: '1.3' }}>
                          {tmpl.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#666' }}>
                        Số {tmpl.type === 'weekly' ? 'tuần' : tmpl.type === 'monthly' ? 'tháng' : 'ngày'}:
                      </span>
                      <input type="number" value={days}
                        onChange={(e) => setCustomDays({ ...customDays, [tmpl.id]: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-20 text-center" min={1} max={999} />
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#ffd700', textShadow: '0 0 5px rgba(255,215,0,0.3)' }}>
                        = {formatVND(previewTotal)}
                      </span>
                    </div>

                    <div className="flex gap-1 mb-3 flex-wrap">
                      {previewAmounts.slice(0, 5).map((amt, i) => (
                        <span key={i} className="px-1.5 py-0.5" style={{
                          background: 'rgba(255,255,255,0.03)', border: `1px solid ${tmpl.color}33`,
                          fontFamily: "'VT323', monospace", fontSize: '13px', color: tmpl.color,
                        }}>
                          {(amt / 1000)}k
                        </span>
                      ))}
                      {days > 5 && <span style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#444' }}>...+{days - 5}</span>}
                    </div>

                    <button onClick={() => startChallenge(tmpl.id)}
                      className={`${exists ? 'btn-3d-gold' : 'btn-3d-red'} w-full py-2 flex items-center justify-center gap-2`}
                      style={{ fontFamily: "'VT323', monospace", fontSize: '20px' }}>
                      <MiniIcon src={exists ? "/images/y2k-star.png" : "/images/y2k-flame.png"} size={16} />
                      {exists ? 'TIẾP TỤC CHIẾNN' : 'BẮT ĐẦU'}
                      <MiniIcon src={exists ? "/images/y2k-star.png" : "/images/y2k-flame.png"} size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-3 mb-2">
            <Y2KIcon src="/images/y2k-flame.png" size={18} />
            <Y2KIcon src="/images/y2k-lightning.png" size={18} />
            <Y2KIcon src="/images/y2k-skull.png" size={18} />
            <Y2KIcon src="/images/y2k-dragon.png" size={18} />
            <Y2KIcon src="/images/y2k-star.png" size={18} />
          </div>
          <p className="flex items-center justify-center gap-1" style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#444' }}>
            <MiniIcon src="/images/y2k-lightning.png" size={12} /> Chiến Binh Tiết Kiệm <MiniIcon src="/images/y2k-lightning.png" size={12} /> Made for the boys <MiniIcon src="/images/y2k-flame.png" size={12} />
          </p>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#333' }}>
            Dữ liệu lưu trên trình duyệtt ~ đừng xóa cache nhaa bro
          </p>
        </div>
      </div>

      <RetroMarquee />
    </div>
  );
}
