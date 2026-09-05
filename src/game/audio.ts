let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let muted = false;

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.connect(master);
    master.connect(ctx.destination);
    master.gain.value = 0.7;
    sfx.gain.value = 0.85;
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(v: boolean) {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.7, ctx.currentTime, 0.03);
}

export function isMuted() {
  return muted;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide?: number) {
  if (!ctx || !sfx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(sfx);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfxPlay = {
  jump: () => beep(420, 0.12, "square", 0.07, 180),
  attack: () => beep(240, 0.08, "sawtooth", 0.06, 140),
  hit: () => beep(180, 0.1, "square", 0.09, 80),
  hurt: () => beep(140, 0.16, "sawtooth", 0.1, 60),
  pickup: () => {
    beep(520, 0.08, "sine", 0.07);
    setTimeout(() => beep(720, 0.1, "sine", 0.06), 50);
  },
  level: () => {
    beep(392, 0.12, "triangle", 0.08);
    setTimeout(() => beep(523, 0.14, "triangle", 0.08), 90);
    setTimeout(() => beep(659, 0.18, "triangle", 0.09), 180);
  },
  portal: () => beep(300, 0.22, "triangle", 0.08, 520),
  death: () => beep(110, 0.35, "sawtooth", 0.1, 40),
};
