import { useState, useCallback } from 'react';

interface Particle {
  id: number; x: number; y: number; type: number;
  color: string; icon?: string; filter?: string;
}

let _pid = 0;

// 8 kiểu hiệu ứng click khác nhau
export type EffectType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function useClickEffect() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawn = useCallback((e: React.MouseEvent, type: EffectType, color: string, icon?: string, filter?: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const count = type === 4 ? 12 : type === 2 ? 8 : type === 6 ? 15 : 10;
    const newP: Particle[] = Array.from({ length: count }, () => ({
      id: ++_pid, x, y, type, color, icon, filter,
    }));
    setParticles(prev => [...prev, ...newP]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newP.includes(p))), 1200);
  }, []);

  return { particles, spawn };
}

// Render particles
export function ClickParticles({ particles }: { particles: Particle[] }) {
  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {particles.map((p, i) => {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 30 + Math.random() * 80;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const size = 4 + Math.random() * 8;
        const dur = 0.5 + Math.random() * 0.5;
        const delay = Math.random() * 0.15;

        // Type 0: Lửa — tia phun ra + xoay
        if (p.type === 0) return (
          <div key={p.id + '-' + i} className="absolute" style={{
            left: p.x, top: p.y, width: size, height: size * 2,
            background: `linear-gradient(180deg, ${p.color}, #ff8800, transparent)`,
            borderRadius: '50% 50% 20% 20%',
            animation: `fx-fire ${dur}s ease-out ${delay}s forwards`,
            ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty - 30}px`,
          }} />
        );

        // Type 1: Sấm sét — đường chớp zigzag
        if (p.type === 1) return (
          <svg key={p.id + '-' + i} className="absolute" style={{
            left: p.x - 15, top: p.y - 15, width: 30, height: 30,
            animation: `fx-bolt ${dur * 0.7}s ease-out ${delay}s forwards`,
            ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`,
          }}>
            <polyline
              points={`15,0 ${12 + Math.random() * 6},${8 + Math.random() * 4} ${16 + Math.random() * 4},${14 + Math.random() * 4} ${10 + Math.random() * 6},${22 + Math.random() * 4} 15,30`}
              stroke={p.color} strokeWidth="2" fill="none" opacity="0.9"
            />
          </svg>
        );

        // Type 2: Sóng tròn lan ra
        if (p.type === 2 && i < 4) return (
          <div key={p.id + '-' + i} className="absolute rounded-full" style={{
            left: p.x, top: p.y, width: 0, height: 0,
            border: `2px solid ${p.color}`,
            transform: 'translate(-50%, -50%)',
            animation: `fx-ripple ${0.6 + i * 0.2}s ease-out ${i * 0.1}s forwards`,
          }} />
        );

        // Type 3: Pixel vỡ — ô vuông nhỏ bay ra
        if (p.type === 3) return (
          <div key={p.id + '-' + i} className="absolute" style={{
            left: p.x, top: p.y, width: 3 + Math.random() * 5, height: 3 + Math.random() * 5,
            background: i % 3 === 0 ? p.color : i % 3 === 1 ? '#fff' : `${p.color}88`,
            animation: `fx-pixel ${dur}s ease-out ${delay}s forwards`,
            ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`,
            ['--rot' as string]: `${Math.random() * 720}deg`,
          }} />
        );

        // Type 4: Tia sáng — đường thẳng phóng ra từ tâm
        if (p.type === 4) return (
          <div key={p.id + '-' + i} className="absolute" style={{
            left: p.x, top: p.y, width: 2, height: 15 + Math.random() * 20,
            background: `linear-gradient(180deg, ${p.color}, transparent)`,
            transformOrigin: 'top center',
            transform: `rotate(${angle}rad)`,
            animation: `fx-ray ${dur * 0.6}s ease-out ${delay}s forwards`,
          }} />
        );

        // Type 5: Ngôi sao xoay bay ra
        if (p.type === 5) return (
          <div key={p.id + '-' + i} className="absolute" style={{
            left: p.x, top: p.y, fontSize: `${8 + Math.random() * 10}px`,
            color: i % 2 === 0 ? p.color : '#ffd700',
            animation: `fx-star ${dur}s ease-out ${delay}s forwards`,
            ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`,
          }}>✦</div>
        );

        // Type 6: Khói — blob mờ phình ra
        if (p.type === 6) return (
          <div key={p.id + '-' + i} className="absolute rounded-full" style={{
            left: p.x, top: p.y, width: size, height: size,
            background: `radial-gradient(circle, ${p.color}44, transparent)`,
            transform: 'translate(-50%, -50%)',
            animation: `fx-smoke ${dur + 0.3}s ease-out ${delay}s forwards`,
            ['--tx' as string]: `${tx * 0.5}px`, ['--ty' as string]: `${ty * 0.5 - 20}px`,
          }} />
        );

        // Type 7: Rồng lửa — tia cong
        return (
          <div key={p.id + '-' + i} className="absolute" style={{
            left: p.x, top: p.y, width: 4, height: 4,
            background: i % 2 === 0 ? p.color : '#39ff14',
            borderRadius: '50%',
            animation: `fx-dragon ${dur}s cubic-bezier(0.2,0.8,0.3,1) ${delay}s forwards`,
            ['--tx' as string]: `${tx}px`, ['--ty' as string]: `${ty}px`,
            ['--mid' as string]: `${tx * 0.5 + (Math.random() - 0.5) * 40}px`,
          }} />
        );
      })}
    </div>
  );
}
