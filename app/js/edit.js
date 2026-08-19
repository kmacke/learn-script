import { slugify, titleCaseName, newId, CHARACTER_COLORS } from "./model.js";

export function touch(script, patch) {
  return { ...script, ...patch, updatedAt: Date.now() };
}

export function renumberLines(script) {
  const lines = script.lines.map((line, i) => ({ ...line, number: i + 1 }));
  return touch(script, { lines });
}

export function addCharacter(script, rawName) {
  const name = titleCaseName(rawName);
  if (!name || name === "Unknown") return script;
  const existing = script.characters.find((c) => slugify(c.name) === slugify(name));
  if (existing) return script;
  let id = slugify(name);
  const used = new Set(script.characters.map((c) => c.id));
  if (used.has(id)) id = newId(id);
  const character = {
    id,
    name,
    isMe: script.characters.length === 0,
    voiceURI: "",
    pitch: 1,
    rate: 1,
    color: CHARACTER_COLORS[script.characters.length % CHARACTER_COLORS.length],
  };
  return touch(script, { characters: [...script.characters, character] });
}

export function renameCharacter(script, characterId, rawName) {
  const name = titleCaseName(rawName);
  if (!name || name === "Unknown") return script;
  return touch(script, {
    characters: script.characters.map((c) => (c.id === characterId ? { ...c, name } : c)),
  });
}

export function mergeCharacters(script, fromId, toId) {
  if (!fromId || !toId || fromId === toId) return script;
  const from = script.characters.find((c) => c.id === fromId);
  const to = script.characters.find((c) => c.id === toId);
  if (!from || !to) return script;
  const lines = script.lines.map((line) =>
    line.characterId === fromId ? { ...line, characterId: toId, type: "dialogue" } : line
  );
  const characters = script.characters
    .filter((c) => c.id !== fromId)
    .map((c) => (c.id === toId ? { ...c, isMe: c.isMe || from.isMe } : c));
  return touch(script, { lines, characters });
}

/**
 * speaker: null | "" for stage direction, existing character id, or a new name.
 */
export function setLineCharacter(script, lineId, speaker) {
  const line = script.lines.find((l) => l.id === lineId);
  if (!line) return script;
  if (speaker == null || speaker === "" || speaker === "__direction__") {
    return touch(script, {
      lines: script.lines.map((l) =>
        l.id === lineId ? { ...l, characterId: null, type: "direction" } : l
      ),
    });
  }
  let next = script;
  let character = next.characters.find((c) => c.id === speaker);
  if (!character) {
    next = addCharacter(next, speaker);
    character = next.characters.find((c) => slugify(c.name) === slugify(speaker));
  }
  if (!character) return script;
  return touch(next, {
    lines: next.lines.map((l) =>
      l.id === lineId ? { ...l, characterId: character.id, type: "dialogue" } : l
    ),
  });
}

export function updateLineText(script, lineId, text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return script;
  return touch(script, {
    lines: script.lines.map((l) => (l.id === lineId ? { ...l, text: trimmed } : l)),
  });
}

export function deleteLine(script, lineId) {
  const lines = script.lines.filter((l) => l.id !== lineId);
  return renumberLines(touch(script, { lines }));
}

export function insertLineAfter(script, lineId, patch = {}) {
  const idx = script.lines.findIndex((l) => l.id === lineId);
  if (idx < 0) return script;
  const prev = script.lines[idx];
  const created = {
    id: newId("line"),
    number: prev.number + 1,
    sceneId: prev.sceneId,
    characterId: prev.characterId,
    type: prev.type,
    text: "New line",
    ...patch,
  };
  const lines = [...script.lines.slice(0, idx + 1), created, ...script.lines.slice(idx + 1)];
  return renumberLines(touch(script, { lines }));
}

export function splitLine(script, lineId, atIndex) {
  const line = script.lines.find((l) => l.id === lineId);
  if (!line) return script;
  const idx = Math.max(0, Math.min(Number(atIndex), line.text.length));
  const left = line.text.slice(0, idx).trim();
  const right = line.text.slice(idx).trim();
  if (!left || !right) return script;
  const updated = updateLineText(script, lineId, left);
  return insertLineAfter(updated, lineId, {
    characterId: line.characterId,
    type: line.type,
    sceneId: line.sceneId,
    text: right,
  });
}

export function splitLineOnNewlines(script, lineId) {
  const line = script.lines.find((l) => l.id === lineId);
  if (!line) return script;
  const parts = line.text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return script;
  let next = updateLineText(script, lineId, parts[0]);
  let afterId = lineId;
  for (const part of parts.slice(1)) {
    next = insertLineAfter(next, afterId, {
      characterId: line.characterId,
      type: line.type,
      sceneId: line.sceneId,
      text: part,
    });
    const created = next.lines.find((l, i, arr) => {
      const prev = arr[i - 1];
      return prev && prev.id === afterId && l.text === part;
    });
    afterId = created ? created.id : afterId;
  }
  return next;
}

export function renameScene(script, sceneId, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return script;
  return touch(script, {
    scenes: script.scenes.map((s) => (s.id === sceneId ? { ...s, name: trimmed } : s)),
  });
}

export function toggleLineMark(script, lineId) {
  return touch(script, {
    lines: script.lines.map((l) => (l.id === lineId ? { ...l, marked: !l.marked } : l)),
  });
}

export function clearLineMarks(script) {
  return touch(script, {
    lines: script.lines.map((l) => (l.marked ? { ...l, marked: false } : l)),
  });
}

export function markedCount(script) {
  return script.lines.filter((l) => l.marked).length;
}

export const SCRIPT_FILE_VERSION = 1;

export function serializeScript(script) {
  return JSON.stringify(
    {
      learnScriptVersion: SCRIPT_FILE_VERSION,
      title: script.title,
      sourceText: script.sourceText,
      sourceType: script.sourceType,
      characters: script.characters,
      scenes: script.scenes,
      lines: script.lines,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export function deserializeScript(raw, fallbackId) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!data || !Array.isArray(data.lines) || !Array.isArray(data.characters)) {
    throw new Error("Not a LearnScript file");
  }
  return touch(
    {
      id: fallbackId || data.id || newId("script"),
      title: data.title || "Imported script",
      sourceText: data.sourceText || "",
      sourceType: data.sourceType || "json",
      characters: data.characters,
      scenes: data.scenes || [],
      lines: data.lines,
      createdAt: Date.now(),
    },
    {}
  );
}
