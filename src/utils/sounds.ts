// Y2K Sound System — Mỗi âm thanh KHÁC NHAU, không lặp lại
// Volume vừa phải (0.12 - 0.2), 1 AudioContext duy nhất

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function unlockAudio() {
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const o = c.createOscillator(); const g = c.createGain();
    g.gain.setValueAtTime(0.001, c.currentTime);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.01);
  } catch (_) { /**/ }
}

function note(freq: number, type: OscillatorType, vol: number, start: number, dur: number, ctx: AudioContext) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.006);
  g.gain.setValueAtTime(vol * 0.8, start + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + dur + 0.01);
}

function sweep(from: number, to: number, type: OscillatorType, vol: number, start: number, dur: number, ctx: AudioContext) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(from, start);
  o.frequency.exponentialRampToValueAtTime(to, start + dur);
  g.gain.setValueAtTime(vol, start); g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + dur + 0.01);
}

function drum(freq: number, vol: number, start: number, ctx: AudioContext) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, start);
  o.frequency.exponentialRampToValueAtTime(20, start + 0.15);
  g.gain.setValueAtTime(vol, start); g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
  o.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + 0.16);
}

// ========== 8 CLICK SOUNDS — mỗi challenge 1 tiếng riêng ==========

// 0: Flame — "bụp" lửa bùng
export function clickFlame() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(400, 100, 'sine', 0.18, n, 0.08, c);
    note(600, 'square', 0.12, n, 0.04, c);
  } catch(_) {/**/}
}

// 1: Lightning — "zắp" điện giật
export function clickLightning() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(2000, 400, 'sawtooth', 0.14, n, 0.07, c);
    note(1500, 'square', 0.08, n + 0.02, 0.03, c);
  } catch(_) {/**/}
}

// 2: Skull — "tọc" xương gõ
export function clickSkull() {
  try { const c = getCtx(), n = c.currentTime;
    note(200, 'triangle', 0.16, n, 0.05, c);
    note(150, 'square', 0.1, n + 0.03, 0.04, c);
  } catch(_) {/**/}
}

// 3: Dragon — "grào" rồng gầm nhỏ
export function clickDragon() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(300, 80, 'sawtooth', 0.13, n, 0.12, c);
    note(250, 'triangle', 0.08, n + 0.04, 0.06, c);
  } catch(_) {/**/}
}

// 4: Star — "ting" ngôi sao lấp lánh
export function clickStar() {
  try { const c = getCtx(), n = c.currentTime;
    note(1800, 'sine', 0.14, n, 0.06, c);
    note(2400, 'sine', 0.1, n + 0.04, 0.08, c);
  } catch(_) {/**/}
}

// 5: Trophy — "clang" kim loại
export function clickTrophy() {
  try { const c = getCtx(), n = c.currentTime;
    note(800, 'triangle', 0.15, n, 0.1, c);
    note(1200, 'sine', 0.08, n + 0.02, 0.12, c);
    note(600, 'triangle', 0.06, n + 0.05, 0.08, c);
  } catch(_) {/**/}
}

// 6: Flame-Red — "boom" nổ nhỏ
export function clickBoom() {
  try { const c = getCtx(), n = c.currentTime;
    drum(150, 0.2, n, c);
    sweep(800, 200, 'square', 0.1, n, 0.06, c);
  } catch(_) {/**/}
}

// 7: Dragon-Blue — "whoosh" gió
export function clickWhoosh() {
  try { const c = getCtx(), n = c.currentTime;
    // White noise burst
    const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); const g = c.createGain();
    s.buffer = buf; g.gain.setValueAtTime(0.12, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.08);
    s.connect(g); g.connect(c.destination); s.start(n);
    sweep(600, 1200, 'sine', 0.06, n, 0.1, c);
  } catch(_) {/**/}
}

// ========== Array để gọi theo index ==========
const CLICK_SOUNDS = [clickFlame, clickLightning, clickSkull, clickDragon, clickStar, clickTrophy, clickBoom, clickWhoosh];
export function playClickByIndex(idx: number) { CLICK_SOUNDS[idx % 8](); }

// ========== NAVIGATE — chuyển trang ==========
export function playNavigate() {
  try { const c = getCtx(), n = c.currentTime;
    note(500, 'square', 0.1, n, 0.04, c);
    note(700, 'square', 0.1, n + 0.04, 0.04, c);
    note(900, 'sine', 0.08, n + 0.08, 0.06, c);
  } catch(_) {/**/}
}

// ========== BACK — quay lại ==========
export function playBack() {
  try { const c = getCtx(), n = c.currentTime;
    note(600, 'square', 0.1, n, 0.04, c);
    note(400, 'square', 0.1, n + 0.04, 0.06, c);
  } catch(_) {/**/}
}

// ========== TOGGLE DAY — bỏ tiền heo ==========
export function playY2KSuccess() {
  try { const c = getCtx(), n = c.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => note(f, 'square', 0.15, n + i * 0.07, 0.09, c));
    sweep(1000, 3500, 'sawtooth', 0.06, n + 0.28, 0.2, c);
  } catch(_) {/**/}
}

// ========== UNTOGGLE DAY — bỏ tick ==========
export function playUntoggle() {
  try { const c = getCtx(), n = c.currentTime;
    note(600, 'square', 0.12, n, 0.05, c);
    note(400, 'square', 0.1, n + 0.05, 0.07, c);
  } catch(_) {/**/}
}

// ========== QUIT WARNING — cảnh báo thoát ==========
export function playQuitWarn(step: number) {
  try { const c = getCtx(), n = c.currentTime;
    // Mỗi bước cảnh báo nghe khác nhau, càng nguy hiểm càng nặng
    if (step === 1) {
      note(400, 'square', 0.12, n, 0.1, c); note(300, 'square', 0.12, n + 0.1, 0.15, c);
    } else if (step === 2) {
      note(350, 'sawtooth', 0.13, n, 0.08, c); note(250, 'sawtooth', 0.13, n + 0.08, 0.12, c); drum(80, 0.15, n + 0.15, c);
    } else if (step === 3) {
      [300, 250, 200].forEach((f, i) => note(f, 'square', 0.14, n + i * 0.08, 0.1, c));
      drum(100, 0.18, n + 0.2, c);
    } else {
      drum(120, 0.2, n, c); drum(80, 0.2, n + 0.15, c);
      [200, 150, 100].forEach((f, i) => note(f, 'sawtooth', 0.15, n + i * 0.1, 0.12, c));
    }
  } catch(_) {/**/}
}

// ========== QUIT STAY — chọn ở lại ==========
export function playStay() {
  try { const c = getCtx(), n = c.currentTime;
    note(400, 'sine', 0.12, n, 0.06, c);
    note(600, 'sine', 0.12, n + 0.06, 0.06, c);
    note(800, 'sine', 0.1, n + 0.12, 0.1, c);
  } catch(_) {/**/}
}

// ========== WIN — fanfare chiến thắng ==========
export function playY2KWin() {
  try { const c = getCtx(), n = c.currentTime;
    const m = [
      { f: 392, s: 0 }, { f: 392, s: 0.12 }, { f: 392, s: 0.24 },
      { f: 523, s: 0.36 }, { f: 440, s: 0.72 }, { f: 494, s: 0.84 },
      { f: 523, s: 0.96 }, { f: 659, s: 1.14 }, { f: 784, s: 1.32 }, { f: 1047, s: 1.32 },
    ];
    m.forEach(x => note(x.f, 'square', 0.16, n + x.s, x.s > 1 ? 0.5 : 0.14, c));
    [523, 659].forEach(f => note(f, 'triangle', 0.08, n + 1.32, 0.5, c));
    [0, 0.36, 1.32].forEach(t => drum(100, 0.18, n + t, c));
    // Cymbal
    const buf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const s = c.createBufferSource(); const g = c.createGain();
    s.buffer = buf; g.gain.setValueAtTime(0.08, n + 1.32);
    g.gain.exponentialRampToValueAtTime(0.001, n + 1.57);
    s.connect(g); g.connect(c.destination); s.start(n + 1.32);
  } catch(_) {/**/}
}

// ========== WHEEL TICK ==========
export function playWheelTick() {
  try { const c = getCtx(); note(1800, 'square', 0.1, c.currentTime, 0.025, c); } catch(_) {/**/}
}

// ========== INPUT CHANGE — khi thay đổi số ==========
export function playInputTick() {
  try { const c = getCtx(); note(1200 + Math.random() * 400, 'sine', 0.06, c.currentTime, 0.03, c); } catch(_) {/**/}
}

// Giữ tương thích cũ
export function playY2KClick() { playClickByIndex(0); }

// ========== ICON TAP SOUNDS — mỗi icon 1 tiếng vui riêng ==========

// Flame icon: lửa "phựt phựt"
export function tapFlame() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(500, 150, 'sawtooth', 0.12, n, 0.06, c);
    sweep(450, 120, 'sawtooth', 0.1, n + 0.07, 0.05, c);
    note(800, 'sine', 0.05, n + 0.03, 0.04, c);
  } catch(_) {/**/}
}

// Lightning icon: sét "chíu"
export function tapLightning() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(3000, 500, 'square', 0.1, n, 0.05, c);
    sweep(2500, 800, 'square', 0.07, n + 0.04, 0.04, c);
  } catch(_) {/**/}
}

// Skull icon: xương "cạch cạch"
export function tapSkull() {
  try { const c = getCtx(), n = c.currentTime;
    note(300, 'triangle', 0.13, n, 0.03, c);
    note(250, 'triangle', 0.11, n + 0.06, 0.03, c);
    note(350, 'triangle', 0.09, n + 0.1, 0.03, c);
  } catch(_) {/**/}
}

// Dragon icon: rồng "gầm"
export function tapDragon() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(200, 60, 'sawtooth', 0.14, n, 0.15, c);
    note(180, 'triangle', 0.06, n + 0.05, 0.08, c);
  } catch(_) {/**/}
}

// Star icon: sao "leng keng"
export function tapStar() {
  try { const c = getCtx(), n = c.currentTime;
    note(2000, 'sine', 0.1, n, 0.05, c);
    note(2800, 'sine', 0.08, n + 0.05, 0.06, c);
    note(3200, 'sine', 0.06, n + 0.1, 0.08, c);
  } catch(_) {/**/}
}

// Trophy icon: cúp "cling clong"
export function tapTrophy() {
  try { const c = getCtx(), n = c.currentTime;
    note(1000, 'triangle', 0.12, n, 0.08, c);
    note(1500, 'sine', 0.08, n + 0.06, 0.1, c);
    note(1200, 'triangle', 0.06, n + 0.12, 0.06, c);
  } catch(_) {/**/}
}

// Title "THỬ THÁCH" tap: retro coin
export function tapTitle() {
  try { const c = getCtx(), n = c.currentTime;
    note(988, 'square', 0.1, n, 0.06, c);
    note(1319, 'square', 0.1, n + 0.06, 0.08, c);
  } catch(_) {/**/}
}

// Subtitle "TIẾT KIỆM" tap: power up
export function tapSubtitle() {
  try { const c = getCtx(), n = c.currentTime;
    [440, 554, 659, 880].forEach((f, i) => note(f, 'sine', 0.08, n + i * 0.05, 0.06, c));
  } catch(_) {/**/}
}

// User panel tap: "boop"
export function tapUser() {
  try { const c = getCtx(), n = c.currentTime;
    sweep(600, 300, 'sine', 0.12, n, 0.08, c);
  } catch(_) {/**/}
}

// Footer icon taps: mỗi cái pitch khác
export function tapFooterIcon(idx: number) {
  try { const c = getCtx(), n = c.currentTime;
    const pitches = [400, 500, 600, 700, 900, 1100];
    note(pitches[idx % 6], 'triangle', 0.1, n, 0.06, c);
    note(pitches[idx % 6] * 1.5, 'sine', 0.06, n + 0.04, 0.05, c);
  } catch(_) {/**/}
}

// Separator star spin tap: sparkle
export function tapSparkle() {
  try { const c = getCtx(), n = c.currentTime;
    [1600, 2200, 1800].forEach((f, i) => note(f, 'sine', 0.06, n + i * 0.04, 0.05, c));
  } catch(_) {/**/}
}

// Map icon filename -> tap function
const ICON_TAP_MAP: Record<string, () => void> = {
  'y2k-flame': tapFlame,
  'y2k-lightning': tapLightning,
  'y2k-skull': tapSkull,
  'y2k-dragon': tapDragon,
  'y2k-star': tapStar,
  'y2k-trophy': tapTrophy,
};

export function tapIconByName(src: string) {
  const key = Object.keys(ICON_TAP_MAP).find(k => src.includes(k));
  if (key) ICON_TAP_MAP[key]();
  else tapStar(); // fallback
}
