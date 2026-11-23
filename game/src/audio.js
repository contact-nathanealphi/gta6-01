// Sound: all synthesized with WebAudio, no audio files, no network.

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenLfo = null;
  let sirenGain = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;
  const BASSLINE_A = [55, 55, 65.41, 82.41, 55, 49, 82.41, 73.42];
  const BASSLINE_B = [55, 65.41, 82.41, 98, 82.41, 73.42, 65.41, 49];
  const BASS_STEP = 60 / 112 / 2;
  let radioLine = null, radioStep = BASS_STEP, radioWave = 'sawtooth';

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 420;
      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'triangle';
      sirenOsc.frequency.value = 780;
      sirenLfo = ctx.createOscillator();
      sirenLfo.type = 'square';
      sirenLfo.frequency.value = 0.7;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      sirenLfo.connect(lfoGain);
      lfoGain.connect(sirenOsc.frequency);
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();
      sirenLfo.start();
      startMusic();
      return true;
    } catch {
      return false;
    }
  }

  function setMuted(value) {
    muted = value;
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (muted) stopMusic();
    else if (ctx) startMusic();
  }

  function playBassNote(freq, when) {
    if (!ctx || !Number.isFinite(freq)) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = radioWave;
    osc.frequency.value = freq;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + radioStep * 0.95);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + radioStep);
  }

  function startMusic() {
    if (!ctx || musicTimer || muted) return;
    musicStep = 0;
    musicTimer = setInterval(() => {
      const loop = Math.floor(musicStep / 8) % 5;
      const line = radioLine || (loop === 4 ? BASSLINE_B : BASSLINE_A);
      playBassNote(line[musicStep % line.length], 0);
      musicStep += 1;
    }, radioStep * 1000);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function blip(freq, seconds, type, volume, when) {
    if (!ctx) return;
    const t = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  function noise(seconds, volume, filterFreq, filterType, q) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType || 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    if (q) filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t);
    source.stop(t + seconds + 0.02);
  }

  return {
    ensure,
    setMuted,
    isMuted() { return muted; },
    music(on) { if (on) startMusic(); else stopMusic(); },
    station(bass, bpm, wave) {
      radioLine = bass; radioStep = 60 / bpm / 2; radioWave = wave || 'sawtooth';
      if (ctx && !muted) { stopMusic(); startMusic(); }
    },
    engine(speed01, driving) {
      if (!ctx) return;
      const target = driving ? 0.05 + speed01 * 0.09 : 0;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
      engineOsc.frequency.setTargetAtTime(55 + speed01 * 110, ctx.currentTime, 0.08);
    },
    siren(on) {
      if (!ctx) return;
      sirenGain.gain.setTargetAtTime(on ? 0.045 : 0, ctx.currentTime, 0.2);
    },
    shot() { noise(0.12, 0.35, 2600); blip(160, 0.08, 'square', 0.12); },
    punch() { blip(95, 0.12, 'sine', 0.3); noise(0.08, 0.15, 500); },
    crash() { noise(0.3, 0.4, 700); blip(70, 0.25, 'sawtooth', 0.2); },
    pickup() { blip(880, 0.1, 'sine', 0.2); blip(1320, 0.14, 'sine', 0.2, 0.08); },
    mission() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => blip(freq, 0.16, 'triangle', 0.2, i * 0.11));
    },
    story() {
      const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
      notes.forEach((freq, i) => blip(freq, 0.22, 'triangle', 0.22, i * 0.13));
    },
    horn() {
      blip(370, 0.18, 'square', 0.12);
      blip(466, 0.18, 'square', 0.12);
    },
    cash() { blip(1320, 0.07, 'sine', 0.18); blip(1760, 0.12, 'sine', 0.18, 0.07); },
    screech() { noise(0.35, 0.12, 900, 'bandpass', 2); },
    busted() { blip(220, 0.3, 'sawtooth', 0.2); blip(165, 0.4, 'sawtooth', 0.2, 0.25); },
    click() { blip(660, 0.06, 'square', 0.12); },
  };
}
