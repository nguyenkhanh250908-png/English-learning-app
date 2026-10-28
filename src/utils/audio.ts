import confetti from 'canvas-confetti';

// Audio Context Singleton for instant, zero-latency sound effects
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a pleasant celebratory chime when a user answers correctly
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Arpeggio chord (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  } catch (e) {
    console.warn('Audio effect error:', e);
  }
}

/**
 * Play a gentle low tone for incorrect attempts
 */
export function playErrorBuzz() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {
    console.warn('Audio effect error:', e);
  }
}

/**
 * Soft subtle click / tap feedback
 */
export function playPop() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.warn('Audio effect error:', e);
  }
}

/**
 * Celebratory streak fanfare
 */
export function playStreakFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.55);
    });
  } catch (e) {
    console.warn('Audio effect error:', e);
  }
}

/**
 * Confetti celebration trigger
 */
export function triggerCelebration() {
  playSuccessChime();
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'],
  });
}

/**
 * Native Text-to-Speech using Web Speech API
 */
export function speakText(
  text: string,
  options: {
    rate?: number;
    accent?: 'en-US' | 'en-GB';
    pitch?: number;
    onEnd?: () => void;
  } = {}
) {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    options.onEnd?.();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.accent || 'en-US';
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;

  // Attempt to select a high quality natural English voice
  const voices = window.speechSynthesis.getVoices();
  const targetLang = options.accent || 'en-US';
  const matchedVoice = voices.find(
    (v) => v.lang === targetLang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
