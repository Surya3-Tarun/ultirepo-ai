/**
 * SoundManager
 * ------------
 * Central place for every sound effect trigger in the app. By default it
 * synthesizes simple royalty-free blips/whooshes/charge-up tones with the
 * Web Audio API, so the app is fully sound-reactive out of the box with
 * zero bundled audio assets.
 *
 * To use your own licensed SFX/voice-over pack: drop files into
 * /public/sounds/ named to match the keys in FILE_MAP below, and this
 * module will automatically prefer the audio file over the synthesized
 * placeholder. No component code needs to change.
 */

const FILE_MAP = {
  uiClick: "/sounds/ui-click.mp3",
  energyCharge: "/sounds/energy-charge.mp3",
  portalOpen: "/sounds/portal-open.mp3",
  scan: "/sounds/scan.mp3",
  alienActivate: "/sounds/alien-activate.mp3",
  transformation: "/sounds/transformation.mp3",
};

let audioContext = null;
let soundEnabled = true;
const missingFileCache = new Set();

function getContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
  }
  return audioContext;
}

function playSynthTone({ freqStart, freqEnd, duration, type = "sine", gain = 0.05 }) {
  if (!soundEnabled) return;
  try {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freqStart, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio context unavailable (e.g. autoplay policy) - fail silently.
  }
}

async function tryPlayFile(key) {
  if (missingFileCache.has(key)) return false;
  const src = FILE_MAP[key];
  if (!src) return false;
  try {
    const audio = new Audio(src);
    audio.volume = 0.4;
    await audio.play();
    return true;
  } catch {
    missingFileCache.add(key); // avoid repeated 404 attempts for the rest of the session
    return false;
  }
}

async function trigger(key, synthFallback) {
  const playedFile = await tryPlayFile(key);
  if (!playedFile) synthFallback();
}

export const SoundManager = {
  setEnabled(enabled) {
    soundEnabled = enabled;
  },
  isEnabled() {
    return soundEnabled;
  },

  playUIClick() {
    trigger("uiClick", () => playSynthTone({ freqStart: 800, freqEnd: 400, duration: 0.08, type: "square", gain: 0.03 }));
  },
  playEnergyCharge() {
    trigger("energyCharge", () => playSynthTone({ freqStart: 120, freqEnd: 900, duration: 0.9, type: "sawtooth", gain: 0.04 }));
  },
  playPortalOpen() {
    trigger("portalOpen", () => playSynthTone({ freqStart: 300, freqEnd: 60, duration: 0.6, type: "sine", gain: 0.05 }));
  },
  playScan() {
    trigger("scan", () => playSynthTone({ freqStart: 500, freqEnd: 1400, duration: 0.4, type: "triangle", gain: 0.03 }));
  },
  playAlienActivate() {
    trigger("alienActivate", () => playSynthTone({ freqStart: 200, freqEnd: 1200, duration: 1.1, type: "sawtooth", gain: 0.05 }));
  },
  playTransformation() {
    trigger("transformation", () => playSynthTone({ freqStart: 80, freqEnd: 1600, duration: 1.6, type: "sawtooth", gain: 0.05 }));
  },

  /**
   * Speaks a short Omnitrix-style page announcement using the Web Speech
   * API, pitched low and slowed down to read as a deep robotic alien
   * voice. Always paired with an on-screen caption by the caller since
   * autoplay/audio may be blocked or muted.
   */
  announcePage(text) {
    if (!soundEnabled) return;
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.3;
      utterance.rate = 0.85;
      utterance.volume = 0.7;
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find((v) => /male|david|daniel|google uk english male/i.test(v.name));
      if (deepVoice) utterance.voice = deepVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis unavailable - the on-screen caption still communicates the announcement.
    }
  },
};

export default SoundManager;
