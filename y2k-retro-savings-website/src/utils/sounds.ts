// Y2K Sound Effects - Aggressive/Masculine version
const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

export function playY2KSuccess() {
  try {
    const ctx = audioCtx();
    const now = ctx.currentTime;

    // Power-up chiptune sound
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    const durations = [0.08, 0.08, 0.08, 0.12, 0.08, 0.3];

    let time = now;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + durations[i]);
      time += durations[i] * 0.7;
    });

    // Electric zap sweep
    const zap = ctx.createOscillator();
    const zapGain = ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(800, now + 0.35);
    zap.frequency.exponentialRampToValueAtTime(3000, now + 0.55);
    zapGain.gain.setValueAtTime(0.04, now + 0.35);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    zap.connect(zapGain);
    zapGain.connect(ctx.destination);
    zap.start(now + 0.35);
    zap.stop(now + 0.6);

    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.log('Audio not available');
  }
}

export function playY2KClick() {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    setTimeout(() => ctx.close(), 300);
  } catch (e) {}
}

export function playY2KWin() {
  try {
    const ctx = audioCtx();
    const now = ctx.currentTime;

    // Epic victory fanfare
    const melody = [
      { freq: 392.00, dur: 0.12, start: 0 },
      { freq: 392.00, dur: 0.12, start: 0.12 },
      { freq: 392.00, dur: 0.12, start: 0.24 },
      { freq: 523.25, dur: 0.35, start: 0.36 },
      { freq: 440.00, dur: 0.12, start: 0.75 },
      { freq: 493.88, dur: 0.12, start: 0.87 },
      { freq: 523.25, dur: 0.18, start: 0.99 },
      { freq: 493.88, dur: 0.1, start: 1.2 },
      { freq: 523.25, dur: 0.15, start: 1.35 },
      { freq: 659.25, dur: 0.25, start: 1.35 },
      { freq: 783.99, dur: 0.5, start: 1.6 },
      { freq: 1046.50, dur: 0.6, start: 1.6 },
    ];

    melody.forEach(({ freq, dur, start }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.1, now + start + 0.015);
      gain.gain.setValueAtTime(0.1, now + start + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.01);
    });

    // Bass drum hits
    [0, 0.36, 1.6].forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now + t);
      osc.frequency.exponentialRampToValueAtTime(40, now + t + 0.15);
      gain.gain.setValueAtTime(0.15, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.15);
    });

    setTimeout(() => ctx.close(), 4000);
  } catch (e) {}
}

export function playWheelTick() {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
    setTimeout(() => ctx.close(), 200);
  } catch (e) {}
}
