import { estimateSpeechMs } from "./model.js";

export const PLAY_MODES = [
  { id: "full", label: "Full scene", hint: "Hear everyone, including you" },
  { id: "mine", label: "My lines", hint: "Drill only your speeches" },
  { id: "cues", label: "Cues", hint: "Others speak; you fill the gaps" },
  { id: "line-gap", label: "Line → gap", hint: "Hear yours, then say it" },
  { id: "gap-line", label: "Gap → line", hint: "Say yours, then check" },
];

export function sceneById(script, sceneId) {
  return script.scenes.find((s) => s.id === sceneId) || null;
}

export function myCharacter(script) {
  return script.characters.find((c) => c.isMe) || script.characters[0] || null;
}

/**
 * Inclusive line-number range. If startSceneId/endSceneId are set, they
 * bound the range (and can be mixed with explicit startLine/endLine).
 */
export function resolveRange(script, options = {}) {
  const numbers = script.lines.map((l) => l.number);
  const minN = numbers.length ? Math.min(...numbers) : 1;
  const maxN = numbers.length ? Math.max(...numbers) : 1;

  let start = options.startLine != null ? Number(options.startLine) : minN;
  let end = options.endLine != null ? Number(options.endLine) : maxN;

  if (options.startSceneId) {
    const inScene = script.lines.filter((l) => l.sceneId === options.startSceneId);
    if (inScene.length) start = inScene[0].number;
  }
  if (options.endSceneId) {
    const inScene = script.lines.filter((l) => l.sceneId === options.endSceneId);
    if (inScene.length) end = inScene[inScene.length - 1].number;
  }

  if (!Number.isFinite(start)) start = minN;
  if (!Number.isFinite(end)) end = maxN;
  start = Math.max(minN, Math.min(start, maxN));
  end = Math.max(minN, Math.min(end, maxN));
  if (end < start) [start, end] = [end, start];
  return { start, end };
}

export function linesInRange(script, range) {
  return script.lines.filter((l) => l.number >= range.start && l.number <= range.end);
}

function isMine(line, me) {
  return Boolean(me && line.characterId === me.id);
}

function isDirection(line) {
  return line.type === "direction" || !line.characterId;
}

/**
 * Build an ordered playlist of speak/gap steps for one pass through the range.
 */
export function buildPlaylist(script, options = {}) {
  const me = myCharacter(script);
  const range = resolveRange(script, options);
  const mode = options.mode || "full";
  const includeOthers = options.includeOthers !== false;
  const playDirections = Boolean(options.playDirections);
  const extraGapMs = Math.max(0, Number(options.extraGapMs) || 0);
  const gapMultiplier = Math.max(0.6, Number(options.gapMultiplier) || 1.25);
  const rate = Math.max(0.5, Number(options.rate) || 1);

  const selected = linesInRange(script, range).filter((line) => {
    if (isDirection(line) && !playDirections) return false;
    if (mode === "mine") return isMine(line, me);
    if (!includeOthers && !isMine(line, me) && !isDirection(line)) return false;
    return true;
  });

  const steps = [];
  for (const line of selected) {
    const mine = isMine(line, me);
    const durationMs = estimateSpeechMs(line.text, rate) + (mine ? extraGapMs : 0);
    const gapMs = Math.round(durationMs * gapMultiplier) + extraGapMs;

    if (isDirection(line)) {
      steps.push({ kind: "speak", line, durationMs, role: "direction" });
      continue;
    }

    if (mode === "full") {
      steps.push({ kind: "speak", line, durationMs, role: mine ? "me" : "other" });
    } else if (mode === "mine") {
      steps.push({ kind: "speak", line, durationMs, role: "me" });
    } else if (mode === "cues") {
      if (mine) steps.push({ kind: "gap", line, durationMs: gapMs, role: "me" });
      else steps.push({ kind: "speak", line, durationMs, role: "other" });
    } else if (mode === "line-gap") {
      if (mine) {
        steps.push({ kind: "speak", line, durationMs, role: "me" });
        steps.push({ kind: "gap", line, durationMs: gapMs, role: "me-repeat" });
      } else {
        steps.push({ kind: "speak", line, durationMs, role: "other" });
      }
    } else if (mode === "gap-line") {
      if (mine) {
        steps.push({ kind: "gap", line, durationMs: gapMs, role: "me-try" });
        steps.push({ kind: "speak", line, durationMs, role: "me" });
      } else {
        steps.push({ kind: "speak", line, durationMs, role: "other" });
      }
    } else {
      steps.push({ kind: "speak", line, durationMs, role: mine ? "me" : "other" });
    }
  }

  return {
    range,
    mode,
    me,
    steps,
    lineCount: selected.length,
  };
}

export function promptLineForIndex(playlist, index) {
  if (!playlist.steps.length) return null;
  const i = Math.max(0, Math.min(index, playlist.steps.length - 1));
  for (let k = i; k >= 0; k -= 1) {
    const step = playlist.steps[k];
    if (step.role === "me" || step.role === "me-try" || step.role === "me-repeat") {
      return step.line;
    }
  }
  const me = playlist.me;
  return playlist.steps.find((s) => me && s.line.characterId === me.id)?.line || playlist.steps[i].line;
}

export function nextIndex(playlist, index, loop) {
  if (!playlist.steps.length) return 0;
  const n = index + 1;
  if (n < playlist.steps.length) return n;
  return loop ? 0 : playlist.steps.length;
}

export function nextMarkedStepIndex(playlist, fromIndex, wrap = true) {
  const steps = playlist?.steps || [];
  if (!steps.length) return null;
  const start = Math.max(0, fromIndex) + 1;
  const limit = wrap ? steps.length : steps.length - start;
  for (let i = 0; i < limit; i += 1) {
    const idx = wrap ? (start + i) % steps.length : start + i;
    if (idx === fromIndex) continue;
    if (steps[idx]?.line?.marked) return idx;
  }
  return null;
}

export function isPlaylistComplete(playlist, index, loop) {
  return !loop && index >= playlist.steps.length;
}
