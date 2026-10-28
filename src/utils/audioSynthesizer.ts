/**
 * High-quality Web Audio procedural music generator.
 * Creates rhythmic African backing tracks (Afrobeats, Amapiano, Highlife)
 * and exports them as playable Object URLs so preloaded tracks always play
 * real musical sound offline and sandboxed!
 */

interface TrackStyle {
  bpm: number;
  rootFreq: number; // e.g. 130.81 (C3)
  scale: number[]; // semitone offsets
  style: 'afrobeats' | 'amapiano' | 'highlife' | 'afrosoul';
  duration: number; // in seconds
}

export async function generateAfricanTrackAudio(styleConfig: TrackStyle): Promise<string> {
  const sampleRate = 44100;
  const duration = Math.min(styleConfig.duration, 180); // Up to 3 minutes
  const totalSamples = sampleRate * duration;

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const bpm = styleConfig.bpm;
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4;
  const totalBars = Math.ceil(duration / barDuration);

  // Master bus
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(offlineCtx.destination);

  // Reverb simulation
  const convolver = offlineCtx.createConvolver();
  convolver.buffer = createReverbBuffer(offlineCtx, 1.5, 2.0);
  const reverbGain = offlineCtx.createGain();
  reverbGain.gain.value = 0.25;
  convolver.connect(reverbGain);
  reverbGain.connect(masterGain);

  // Generate instrument parts bar by bar
  for (let bar = 0; bar < totalBars; bar++) {
    const barTime = bar * barDuration;
    if (barTime >= duration) break;

    // 1. Drum Foundation: Kick, Shaker, Clave / Rimshot
    scheduleDrums(offlineCtx, masterGain, barTime, beatDuration, styleConfig.style);

    // 2. Bassline / Amapiano Log Drum
    scheduleBass(offlineCtx, masterGain, barTime, beatDuration, styleConfig);

    // 3. Kalimba / Marimba / Guitar Melodic Arpeggios
    scheduleMelody(offlineCtx, masterGain, convolver, barTime, beatDuration, bar, styleConfig);

    // 4. Warm Pad / Chords
    scheduleChords(offlineCtx, masterGain, convolver, barTime, barDuration, bar, styleConfig);
  }

  // Render buffer
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}

function scheduleDrums(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  barTime: number,
  beatDuration: number,
  style: string
) {
  const step16 = beatDuration / 4;

  // 16 steps per bar
  for (let step = 0; step < 16; step++) {
    const time = barTime + step * step16;

    // Kick pattern
    if (style === 'amapiano') {
      // 4-on-the-floor kick
      if (step % 4 === 0) playKick(ctx, dest, time);
    } else {
      // Syncopated Afrobeats kick
      if (step === 0 || step === 6 || step === 10 || step === 14) {
        playKick(ctx, dest, time);
      }
    }

    // Shakers / Hi-hat (syncopated 16th groove)
    const isAccent = step % 4 === 2 || step % 4 === 0;
    playShaker(ctx, dest, time, isAccent ? 0.35 : 0.18);

    // Rimshot / Woodblock / Clave
    if (step === 4 || step === 12 || step === 7 || step === 15) {
      playRimshot(ctx, dest, time);
    }
  }
}

function playKick(ctx: OfflineAudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.1);

  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + 0.3);
}

function playShaker(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol: number) {
  const bufferSize = ctx.sampleRate * 0.05;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  whiteNoise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  whiteNoise.start(time);
  whiteNoise.stop(time + 0.05);
}

function playRimshot(ctx: OfflineAudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, time);
  osc.frequency.exponentialRampToValueAtTime(320, time + 0.04);

  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + 0.07);
}

function scheduleBass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  barTime: number,
  beatDuration: number,
  config: TrackStyle
) {
  const root = config.rootFreq;
  const step16 = beatDuration / 4;

  // Bass pitches
  const pitches = [root, root * Math.pow(2, 3 / 12), root * Math.pow(2, 7 / 12), root * Math.pow(2, 5 / 12)];

  // 16th groove for bass
  const triggerSteps = [0, 3, 6, 8, 11, 14];
  triggerSteps.forEach((st, idx) => {
    const time = barTime + st * step16;
    const freq = pitches[idx % pitches.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (config.style === 'amapiano') {
      // Amapiano log drum character: rich low saturated pulse with pitch drop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, time + 0.08);

      gain.gain.setValueAtTime(0.65, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    } else {
      // Warm round electric bass
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    }

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.4);
  });
}

function scheduleMelody(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverb: AudioNode,
  barTime: number,
  beatDuration: number,
  barIndex: number,
  config: TrackStyle
) {
  const step16 = beatDuration / 4;
  const scale = [0, 2, 4, 7, 9, 12, 14, 16]; // Pentatonic warmth
  const baseFreq = config.rootFreq * 2; // 1 octave higher

  // Playful Kalimba / marimba notes on selected 16ths
  for (let s = 0; s < 16; s++) {
    // Syncopated melody pattern
    if ((s + barIndex) % 3 === 0 || s === 2 || s === 10) {
      const time = barTime + s * step16;
      const noteOffset = scale[(s + barIndex * 2) % scale.length];
      const freq = baseFreq * Math.pow(2, noteOffset / 12);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Bell-like kalimba envelope
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(dest);
      gain.connect(reverb);

      osc.start(time);
      osc.stop(time + 0.35);
    }
  }
}

function scheduleChords(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  reverb: AudioNode,
  barTime: number,
  barDuration: number,
  barIndex: number,
  config: TrackStyle
) {
  // Gentle ambient electric piano chord per bar
  const root = config.rootFreq * 2;
  const chordSteps = barIndex % 2 === 0 ? [0, 4, 7, 11] : [5, 9, 12, 16]; // Major 7th vibes

  chordSteps.forEach((semitones) => {
    const freq = root * Math.pow(2, semitones / 12);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.value = 750;

    osc.frequency.setValueAtTime(freq, barTime);
    gain.gain.setValueAtTime(0.08, barTime);
    gain.gain.linearRampToValueAtTime(0.05, barTime + barDuration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, barTime + barDuration - 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    gain.connect(reverb);

    osc.start(barTime);
    osc.stop(barTime + barDuration);
  });
}

function createReverbBuffer(ctx: OfflineAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const buffer = ctx.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const factor = Math.pow(1 - i / length, decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return buffer;
}

/**
 * Encodes AudioBuffer into standard 16-bit PCM WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2;
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([bufferArray], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
