// Procedural Web Audio API synthesizer for cute cat meow, purr, and mechanical keyboard thock
class CatSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastMeowTime = 0;
    this.lastPurrTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Cute high-pitched kitten meow when aggressively rubbed (like 00:13 in the video)
  playMeow() {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastMeowTime < 1100) return;
    this.lastMeowTime = nowMs;

    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'triangle';

    // Pitch contour: "Meee-aow~" (580Hz -> 920Hz -> 760Hz -> 440Hz)
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(940, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.38);
    osc.frequency.exponentialRampToValueAtTime(430, now + 0.65);

    osc2.frequency.setValueAtTime(566, now);
    osc2.frequency.exponentialRampToValueAtTime(948, now + 0.14);
    osc2.frequency.exponentialRampToValueAtTime(785, now + 0.38);
    osc2.frequency.exponentialRampToValueAtTime(435, now + 0.65);

    // Formant bandpass filter opening and closing like a cat mouth
    filter.type = 'bandpass';
    filter.Q.value = 3.2;
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(1250, now + 0.65);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain.gain.setValueAtTime(0.18, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.7);
    osc2.stop(now + 0.7);
  }

  // Rapid purr / trill burst while rubbing face back and forth (00:14-00:16)
  playPurrTick(intensity = 1) {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastPurrTime < 55) return;
    this.lastPurrTime = nowMs;

    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 160 + Math.min(260, intensity * 12);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + 0.045);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.052);
  }

  // Crisp mechanical keycap thock sound
  playKeyClick(isSpace = false) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isSpace ? 210 : 320 + Math.random() * 90;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.032);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.038);
  }
}

window.catSound = new CatSoundEngine();
