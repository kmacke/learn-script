/**
 * iOS-aware speech synthesis.
 * Play must call unlock() inside the tap handler before speaking.
 * Speech failure must never freeze rehearsal: we always hold the beat.
 */

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export class TtsEngine {
  constructor() {
    this.unlocked = false;
    this.audioCtx = null;
    this.keepAlive = null;
    this.current = null;
    this.voicesCache = [];
    this.lastOk = null;
    this._generation = 0;
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
    if (!this.supported) {
      this.unlocked = true;
      return;
    }
    this.startKeepAlive();
    try {
      const warm = new SpeechSynthesisUtterance(".");
      warm.volume = 0;
      warm.rate = 2;
      window.speechSynthesis.speak(warm);
    } catch {
      /* ignore */
    }
    this.unlocked = true;
  }

  startKeepAlive() {
    if (this.audioCtx) {
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.audioCtx = new AC();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      this.keepAlive = osc;
    } catch {
      this.audioCtx = null;
    }
  }

  cancel() {
    this._generation += 1;
    this.current = null;
    if (this.supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Speak text, then hold remaining estimated time if synthesis fails.
   * Always resolves. Pass shouldAbort() to return early on pause/skip.
   */
  async speak(text, voiceSettings = {}, shouldAbort) {
    const spoken = String(text || "").trim();
    const durationMs = Math.max(700, Number(voiceSettings.durationMs) || 900);
    if (!spoken) {
      await this.gap(Math.min(400, durationMs), shouldAbort);
      return { ok: true };
    }

    const start = Date.now();
    const gen = this._generation;
    let ok = false;
    if (this.supported) {
      ok = await this.utter(spoken, voiceSettings, shouldAbort, durationMs);
    }
    if (this._generation !== gen || (shouldAbort && shouldAbort())) {
      return { ok: false, aborted: true };
    }
    this.lastOk = ok;
    const elapsed = Date.now() - start;
    if (!ok) {
      await this.gap(Math.max(0, durationMs - elapsed), shouldAbort);
    }
    return { ok };
  }

  utter(spoken, voiceSettings, shouldAbort, durationMs) {
    return new Promise((resolve) => {
      let settled = false;
      const gen = this._generation;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        if (this.current === utter) this.current = null;
        resolve(Boolean(ok));
      };

      let utter;
      try {
        utter = new SpeechSynthesisUtterance(spoken);
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
        utter.onend = () => done(true);
        utter.onerror = () => done(false);
        window.speechSynthesis.speak(utter);
      } catch {
        done(false);
        return;
      }

      const poll = setInterval(() => {
        if (this._generation !== gen || (shouldAbort && shouldAbort())) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            /* ignore */
          }
          done(false);
        }
      }, 120);

      setTimeout(() => done(false), Math.max(4000, durationMs + 2500));
    });
  }

  async gap(ms, shouldAbort) {
    const total = Math.max(0, ms || 0);
    const start = Date.now();
    while (Date.now() - start < total) {
      if (shouldAbort && shouldAbort()) return;
      await sleep(Math.min(180, total - (Date.now() - start)));
    }
  }
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
