const SOUND_KEY = "pos.sound.enabled";

let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "0";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function playSuccessSound(): void {
  if (!isSoundEnabled()) return;
  if (!ctx || ctx.state !== "running") return;
  try {
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.09, 0.12);
    playTone(ctx, 1318.5, now + 0.09, 0.14, 0.12);
  } catch {
    // abaikan error audio agar tidak mengganggu transaksi
  }
}

function playTone(
  audioContext: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  peak: number,
): void {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}