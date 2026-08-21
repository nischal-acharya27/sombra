// All sound is synthesised in the Web Audio graph at runtime. No files.
//
// Impact sounds are built the same way a foley editor would layer them: a
// noise burst for the transient, a pitched body for weight, and a filter sweep
// for movement. The three-part structure is what stops a synthesised hit from
// sounding like a beep.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.enabled = true;
    this.noiseBuf = null;
    this.music = null;
    this.intensity = 0;
    this.targetIntensity = 0;
  }

  /** Browsers require a user gesture before audio can start. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      this.enabled = false;
      return;
    }
    const ctx = new AC();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.75;

    // A gentle limiter, so a six-enemy pile-up doesn't clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 22;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;

    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.34;
    this.musicBus.connect(this.master);

    // Shared reverb: one short convolution gives everything the same room.
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(1.7, 2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.24;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.master);

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  get now() {
    return this.ctx.currentTime;
  }

  // -- primitives -----------------------------------------------------------

  _env(node, t, { a = 0.002, d = 0.1, s = 0, r = 0.05, peak = 1, sustainTime = 0 }) {
    const g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + a);
    if (s > 0) {
      g.exponentialRampToValueAtTime(Math.max(0.0001, peak * s), t + a + d);
      g.setValueAtTime(Math.max(0.0001, peak * s), t + a + d + sustainTime);
      g.exponentialRampToValueAtTime(0.0001, t + a + d + sustainTime + r);
      return a + d + sustainTime + r;
    }
    g.exponentialRampToValueAtTime(0.0001, t + a + d);
    return a + d;
  }

  _tone({ freq, freq2, type = 'sine', gain = 0.3, a = 0.002, d = 0.2, s = 0, r = 0.08, sustainTime = 0, detune = 0, dest, at = 0, send = 0 }) {
    const ctx = this.ctx;
    const t = this.now + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freq2 !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq2), t + a + d + sustainTime);
    if (detune) osc.detune.value = detune;
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(dest || this.sfxBus);
    if (send > 0) {
      const sg = ctx.createGain();
      sg.gain.value = send;
      g.connect(sg);
      sg.connect(this.reverbSend);
    }
    const total = this._env(g, t, { a, d, s, r, peak: gain, sustainTime });
    osc.start(t);
    osc.stop(t + total + 0.05);
    return total;
  }

  _noise({ gain = 0.3, a = 0.001, d = 0.15, filter = 'bandpass', freq = 1200, freq2, q = 1, at = 0, send = 0, dest }) {
    const ctx = this.ctx;
    const t = this.now + at;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freq2 !== undefined) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq2), t + a + d);
    f.Q.value = q;
    const g = ctx.createGain();
    src.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxBus);
    if (send > 0) {
      const sg = ctx.createGain();
      sg.gain.value = send;
      g.connect(sg);
      sg.connect(this.reverbSend);
    }
    const total = this._env(g, t, { a, d, peak: gain });
    src.start(t);
    src.stop(t + total + 0.05);
    return total;
  }

  // -- the sound bank -------------------------------------------------------

  play(name) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const r = () => 0.94 + Math.random() * 0.12; // per-shot detune, kills machine-gun repetition

    switch (name) {
      case 'slash':
        this._noise({ gain: 0.20, a: 0.001, d: 0.13, filter: 'bandpass', freq: 2600 * r(), freq2: 700, q: 1.1, send: 0.2 });
        this._tone({ freq: 380 * r(), freq2: 160, type: 'triangle', gain: 0.10, a: 0.001, d: 0.11 });
        break;
      case 'slash2':
        this._noise({ gain: 0.21, a: 0.001, d: 0.14, filter: 'bandpass', freq: 3100 * r(), freq2: 820, q: 1.2, send: 0.2 });
        this._tone({ freq: 460 * r(), freq2: 190, type: 'triangle', gain: 0.10, a: 0.001, d: 0.12 });
        break;
      case 'heavy':
        this._noise({ gain: 0.30, a: 0.002, d: 0.30, filter: 'bandpass', freq: 1700 * r(), freq2: 260, q: 0.8, send: 0.35 });
        this._tone({ freq: 190, freq2: 62, type: 'sawtooth', gain: 0.20, a: 0.002, d: 0.28, send: 0.2 });
        break;
      case 'launch':
        this._noise({ gain: 0.22, a: 0.004, d: 0.34, filter: 'bandpass', freq: 500, freq2: 3400, q: 1.6, send: 0.3 });
        this._tone({ freq: 160, freq2: 720, type: 'triangle', gain: 0.18, a: 0.004, d: 0.32 });
        break;
      case 'slam':
        this._noise({ gain: 0.42, a: 0.001, d: 0.42, filter: 'lowpass', freq: 900, freq2: 90, q: 0.7, send: 0.45 });
        this._tone({ freq: 120, freq2: 34, type: 'sine', gain: 0.42, a: 0.002, d: 0.44 });
        this._tone({ freq: 74, freq2: 28, type: 'square', gain: 0.14, a: 0.002, d: 0.34 });
        break;
      case 'impact':
        this._noise({ gain: 0.24, a: 0.001, d: 0.075, filter: 'bandpass', freq: 1500 * r(), q: 0.9 });
        this._tone({ freq: 240 * r(), freq2: 90, type: 'square', gain: 0.13, a: 0.001, d: 0.08 });
        break;
      case 'kill':
        this._noise({ gain: 0.26, a: 0.002, d: 0.42, filter: 'bandpass', freq: 1900, freq2: 220, q: 0.7, send: 0.5 });
        this._tone({ freq: 300, freq2: 60, type: 'sawtooth', gain: 0.16, a: 0.002, d: 0.40, send: 0.3 });
        break;
      case 'jump':
        this._tone({ freq: 260, freq2: 520, type: 'triangle', gain: 0.11, a: 0.003, d: 0.12 });
        break;
      case 'land':
        this._noise({ gain: 0.16, a: 0.001, d: 0.11, filter: 'lowpass', freq: 700, freq2: 160 });
        break;
      case 'dash':
        this._noise({ gain: 0.20, a: 0.002, d: 0.22, filter: 'bandpass', freq: 900, freq2: 3600, q: 2.2, send: 0.25 });
        this._tone({ freq: 520, freq2: 1400, type: 'sine', gain: 0.07, a: 0.002, d: 0.18 });
        break;
      case 'magic':
        this._tone({ freq: 320, freq2: 1500, type: 'sawtooth', gain: 0.13, a: 0.004, d: 0.26, send: 0.4 });
        this._tone({ freq: 640, freq2: 3000, type: 'sine', gain: 0.08, a: 0.004, d: 0.22 });
        this._noise({ gain: 0.10, a: 0.004, d: 0.3, filter: 'highpass', freq: 1800, send: 0.3 });
        break;
      case 'hurt':
        this._tone({ freq: 220, freq2: 92, type: 'sawtooth', gain: 0.22, a: 0.002, d: 0.26 });
        this._noise({ gain: 0.16, a: 0.001, d: 0.14, filter: 'lowpass', freq: 1300, freq2: 300 });
        break;
      case 'death':
        this._tone({ freq: 300, freq2: 48, type: 'sawtooth', gain: 0.28, a: 0.01, d: 1.1, send: 0.6 });
        this._tone({ freq: 150, freq2: 30, type: 'sine', gain: 0.2, a: 0.01, d: 1.3 });
        break;
      case 'growl':
        this._tone({ freq: 84, freq2: 62, type: 'sawtooth', gain: 0.15, a: 0.03, d: 0.36, send: 0.3 });
        this._noise({ gain: 0.09, a: 0.02, d: 0.36, filter: 'lowpass', freq: 420, freq2: 200 });
        break;
      case 'pounce':
        this._tone({ freq: 180, freq2: 420, type: 'sawtooth', gain: 0.16, a: 0.004, d: 0.2 });
        this._noise({ gain: 0.14, a: 0.002, d: 0.18, filter: 'bandpass', freq: 800, freq2: 2200, q: 1.4 });
        break;
      case 'wispShot':
        this._tone({ freq: 900 * r(), freq2: 420, type: 'sine', gain: 0.10, a: 0.003, d: 0.20, send: 0.3 });
        this._tone({ freq: 1800 * r(), freq2: 800, type: 'triangle', gain: 0.05, a: 0.003, d: 0.16 });
        break;
      case 'bossTell':
        this._tone({ freq: 120, freq2: 300, type: 'sawtooth', gain: 0.16, a: 0.05, d: 0.5, send: 0.5 });
        this._tone({ freq: 61, type: 'square', gain: 0.10, a: 0.05, d: 0.5 });
        break;
      case 'bossCharge':
        this._noise({ gain: 0.30, a: 0.01, d: 0.6, filter: 'lowpass', freq: 500, freq2: 1600, q: 1, send: 0.3 });
        this._tone({ freq: 70, freq2: 130, type: 'sawtooth', gain: 0.24, a: 0.01, d: 0.6 });
        break;
      case 'bossSweep':
        this._noise({ gain: 0.32, a: 0.004, d: 0.4, filter: 'bandpass', freq: 2400, freq2: 400, q: 0.8, send: 0.4 });
        this._tone({ freq: 150, freq2: 54, type: 'sawtooth', gain: 0.2, a: 0.004, d: 0.4 });
        break;
      case 'bossLeap':
        this._tone({ freq: 90, freq2: 340, type: 'sawtooth', gain: 0.2, a: 0.01, d: 0.36 });
        break;
      case 'bossDeath':
        this._tone({ freq: 180, freq2: 26, type: 'sawtooth', gain: 0.34, a: 0.02, d: 2.2, send: 0.7 });
        this._tone({ freq: 90, freq2: 20, type: 'square', gain: 0.2, a: 0.02, d: 2.4 });
        this._noise({ gain: 0.26, a: 0.02, d: 2.0, filter: 'lowpass', freq: 1400, freq2: 80, send: 0.6 });
        break;
      case 'curseTransform':
        // A pained, human cry curdling into something else — descending and
        // rough, distinct from the flat animal 'growl' every quadruped
        // charger already uses. Taraka's curse-reveal beat, not a monster
        // roar: this is the moment the hunter is meant to read as done *to*
        // her rather than chosen by her.
        this._tone({ freq: 480, freq2: 90, type: 'sawtooth', gain: 0.22, a: 0.01, d: 0.9, send: 0.5 });
        this._tone({ freq: 640, freq2: 140, type: 'sine', gain: 0.14, a: 0.01, d: 0.7 });
        this._noise({ gain: 0.18, a: 0.02, d: 0.8, filter: 'bandpass', freq: 1200, freq2: 300, q: 1.6, send: 0.4 });
        break;
      case 'illusionBreak':
        // Shurpanakha's reveal. Glass-bright and shattering rather than
        // curdling — the opposite gesture to Taraka's 'curseTransform' one
        // act-slot back, because hers is a curse landing *on* her and this is
        // a disguise she was holding up herself finally dropping. Rising, not
        // descending, so the two reveals never read as the same event.
        this._tone({ freq: 220, freq2: 900, type: 'triangle', gain: 0.18, a: 0.006, d: 0.5, send: 0.5 });
        this._noise({ gain: 0.22, a: 0.002, d: 0.7, filter: 'highpass', freq: 900, send: 0.5 });
        this._tone({ freq: 300, freq2: 70, type: 'sawtooth', gain: 0.16, a: 0.02, d: 1.0, at: 0.12, send: 0.4 });
        break;
      case 'waking':
        // Kumbhakarna's phase-transition. Neither Taraka's descending curdle
        // nor Shurpanakha's rising glass-break: a low, slow, enormous intake
        // — a mountain sitting up. Rising in pitch but starting far below
        // either of them, so at a glance it is unmistakably the third
        // reveal in the act and not a recolour of one of the first two.
        this._tone({ freq: 34, freq2: 120, type: 'sine', gain: 0.34, a: 0.35, d: 1.6, send: 0.6 });
        this._tone({ freq: 68, freq2: 96, type: 'sawtooth', gain: 0.14, a: 0.4, d: 1.4, send: 0.4 });
        this._noise({ gain: 0.2, a: 0.5, d: 1.5, filter: 'lowpass', freq: 240, freq2: 900, send: 0.5 });
        break;
      case 'enrage':
        this._tone({ freq: 60, freq2: 240, type: 'sawtooth', gain: 0.3, a: 0.02, d: 0.9, send: 0.5 });
        this._noise({ gain: 0.2, a: 0.02, d: 0.9, filter: 'highpass', freq: 400, send: 0.4 });
        break;
      case 'deny':
        this._tone({ freq: 210, freq2: 150, type: 'square', gain: 0.09, a: 0.002, d: 0.11 });
        break;
      case 'systemOpen':
        // The System's window chime: a clean stacked fifth.
        this._tone({ freq: NOTE(88), type: 'sine', gain: 0.09, a: 0.004, d: 0.5, send: 0.5 });
        this._tone({ freq: NOTE(95), type: 'sine', gain: 0.06, a: 0.004, d: 0.55, at: 0.04, send: 0.5 });
        break;
      case 'levelup':
        [76, 80, 83, 88].forEach((n, i) =>
          this._tone({ freq: NOTE(n), type: 'triangle', gain: 0.11, a: 0.005, d: 0.42, at: i * 0.075, send: 0.55 })
        );
        break;
      case 'rankUp':
        [72, 79, 84].forEach((n, i) =>
          this._tone({ freq: NOTE(n), type: 'square', gain: 0.055, a: 0.003, d: 0.22, at: i * 0.05, send: 0.3 })
        );
        break;
      case 'gateOpen':
        this._tone({ freq: 110, freq2: 440, type: 'sawtooth', gain: 0.2, a: 0.4, d: 1.6, send: 0.7 });
        this._noise({ gain: 0.14, a: 0.4, d: 1.6, filter: 'highpass', freq: 900, send: 0.6 });
        break;
      case 'exp':
        this._tone({ freq: NOTE(84) * r(), type: 'sine', gain: 0.045, a: 0.002, d: 0.16 });
        break;
    }
  }

  // -- music ----------------------------------------------------------------

  /**
   * Two layers on a shared clock: a slow drone that always plays, and a
   * percussive pulse that fades in with combat intensity.
   */
  startMusic() {
    if (!this.ctx || this.music) return;
    const ctx = this.ctx;
    const out = this.musicBus;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    droneGain.connect(out);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 420;
    filt.Q.value = 1.2;
    filt.connect(droneGain);

    const oscs = [];
    // An A minor drone: root, fifth, minor third, plus a detuned octave.
    for (const [note, det, gain] of [[33, 0, 0.5], [40, 6, 0.32], [48, -5, 0.22], [45, 9, 0.18]]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = NOTE(note);
      o.detune.value = det;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g);
      g.connect(filt);
      o.start();
      oscs.push(o);
    }

    // A slow LFO on the filter keeps the drone from sitting still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 190;
    lfo.connect(lfoGain);
    lfoGain.connect(filt.frequency);
    lfo.start();

    const combatGain = ctx.createGain();
    combatGain.gain.value = 0;
    combatGain.connect(out);

    this.music = { oscs, lfo, filt, droneGain, combatGain, step: 0, nextStep: ctx.currentTime + 0.2, playing: true };
  }

  setIntensity(v) {
    this.targetIntensity = Math.max(0, Math.min(1, v));
  }

  /** Called every frame; advances the sequencer and eases the combat layer. */
  updateMusic(dt) {
    if (!this.music || !this.ctx) return;
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * 0.9);
    const m = this.music;
    m.combatGain.gain.value = this.intensity * 0.55;
    m.filt.frequency.value = 380 + this.intensity * 620;

    // 16th-note grid at 82 BPM.
    const spb = 60 / 82 / 4;
    const t = this.ctx.currentTime;
    while (m.nextStep < t + 0.12) {
      this._musicStep(m, m.nextStep, m.step);
      m.step = (m.step + 1) % 32;
      m.nextStep += spb;
    }
  }

  _musicStep(m, at, step) {
    if (this.intensity < 0.02) return;
    const ctx = this.ctx;
    const beat = step % 4 === 0;

    if (beat) {
      // Kick.
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, at);
      o.frequency.exponentialRampToValueAtTime(38, at + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.55, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      o.connect(g);
      g.connect(m.combatGain);
      o.start(at);
      o.stop(at + 0.3);
    }

    if (step % 8 === 4) {
      // Snare-ish noise hit.
      const s = ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      s.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2100;
      f.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.3, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      s.connect(f);
      f.connect(g);
      g.connect(m.combatGain);
      s.start(at);
      s.stop(at + 0.2);
    }

    // A sparse minor-pentatonic ostinato high above the drone.
    const MEL = [69, null, 72, null, 74, null, 69, 76, null, null, 72, null, 67, null, 69, null];
    const note = MEL[step % 16];
    if (note !== null && note !== undefined && this.intensity > 0.35) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = NOTE(note + 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.10 * this.intensity, at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.30);
      o.connect(g);
      g.connect(m.combatGain);
      const send = ctx.createGain();
      send.gain.value = 0.4;
      g.connect(send);
      send.connect(this.reverbSend);
      o.start(at);
      o.stop(at + 0.35);
    }
  }
}
