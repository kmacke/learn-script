/**
 * iOS-aware speech synthesis.
 * Play must call unlock() inside the tap handler before speaking.
 */

export class TtsEngine {
  constructor() {
    this.unlocked = false;
    this.audioCtx = null;
    this.keepAlive = null;
    this.current = null;
    this.voicesCache = [];
  }

  get supported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices() {
    if (!this.supported) return [];
    const list = window.speechSynthesis.getVoices() || [];
    if (list.length) this.voicesCache = list;
    return this.voicesCache.length ? this.voicesCache : list;
  }

  waitForVoices() {
    return new Promise((resolve) => {
      const have = this.getVoices();
      if (have.length) {
        resolve(have);
        return;
      }
      const done = () => resolve(this.getVoices());
      if (this.supported) {
        window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
      }
      setTimeout(done, 600);
    });
  }

  unlock() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.startKeepAlive();
    this.unlocked = true;
  }

  startKeepAlive() {
    if (this.audioCtx) {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.audioCtx = new AC();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    this.keepAlive = osc;
  }

  cancel() {
    this.current = null;
    if (this.supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  speak(text, voiceSettings = {}) {
    const spoken = String(text || "").trim();
    if (!spoken) return Promise.resolve();
    if (!this.supported) {
      return new Promise((r) => setTimeout(r, voiceSettings.durationMs || 800));
    }

    return new Promise((resolve, reject) => {
      this.cancel();
      const utter = new SpeechSynthesisUtterance(spoken);
      const voices = this.getVoices();
      if (voiceSettings.voiceURI) {
        const match = voices.find((v) => v.voiceURI === voiceSettings.voiceURI || v.name === voiceSettings.voiceURI);
        if (match) {
          utter.voice = match;
          utter.lang = match.lang;
        }
      }
      utter.pitch = clamp(Number(voiceSettings.pitch) || 1, 0.6, 1.8);
      utter.rate = clamp(Number(voiceSettings.rate) || 1, 0.5, 1.8);
      utter.volume = 1;
      this.current = utter;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (this.current === utter) this.current = null;
        resolve();
      };
      utter.onend = finish;
      utter.onerror = (ev) => {
        if (ev.error === "interrupted" || ev.error === "canceled") {
          finish();
          return;
        }
        settled = true;
        reject(ev.error || ev);
      };
      window.speechSynthesis.speak(utter);
      // iOS can drop onend; safety timeout based on estimate.
      const wait = Math.max(2500, (voiceSettings.durationMs || spoken.length * 50) + 1500);
      setTimeout(finish, wait);
    });
  }

  async gap(ms, shouldAbort) {
    const total = Math.max(200, ms || 1000);
    const start = Date.now();
    while (Date.now() - start < total) {
      if (shouldAbort && shouldAbort()) return;
      await sleep(Math.min(200, total - (Date.now() - start)));
    }
  }
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function pickEnglishVoices(voices) {
  const list = voices || [];
  const en = list.filter((v) => /^en(-|_)/i.test(v.lang) || /english/i.test(v.name));
  const pool = en.length ? en : list;
  const uniq = [];
  const seen = new Set();
  for (const v of pool) {
    const key = v.name.replace(/\s*\(.*\)/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(v);
  }
  return uniq;
}

const PITCHES = [0.78, 0.92, 1.05, 1.18, 1.32, 0.7, 1.4];

export function assignVoices(characters, voices) {
  const pool = pickEnglishVoices(voices);
  return characters.map((ch, i) => {
    const voice = pool[i % Math.max(pool.length, 1)];
    const pitch = pool.length >= characters.length ? 1 : PITCHES[i % PITCHES.length];
    return {
      ...ch,
      voiceURI: ch.voiceURI || (voice ? voice.voiceURI : ""),
      pitch: ch.pitch && ch.pitch !== 1 ? ch.pitch : pitch,
    };
  });
}
