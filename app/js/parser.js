import { emptyScript, slugify, titleCaseName, newId, CHARACTER_COLORS } from "./model.js";

const META_HEADINGS = /^(characters?|cast|dramatis personae|persons of the play|setting|time|place|notes?)\s*:?\s*$/i;
const SCENE_HEADINGS =
  /^(act\s+(?:[ivxlcdm]+|\d+)|scene\s+(?:[ivxlcdm]+|\d+)|prologue|epilogue)(\b.*)?$/i;
const NUMBERED_CUE =
  /^\s*(\d+)\s*[.)]\s+([A-Za-z][A-Za-z0-9 .'\-]{0,40})\s*[:.—–-]\s*(.*)$/;
const INLINE_CUE = /^([A-Z][A-Z0-9 .'\-]{0,40}?)\s*:\s+(.+)$/;
const CUE_ONLY =
  /^([A-Z][A-Z0-9 .'\-]{0,40}?)(?:\s*\(([^)]*)\))?\s*([:.]?)\s*$/;
const BRACKET_DIRECTION = /^\s*[\[(].+[\])]\s*$/;
const STAGE_VERBS = /^(enter|exit|exeunt|aside|lights|blackout|fade|curtain|end of)/i;
const NOT_CHARACTER = new Set([
  "act",
  "scene",
  "scenes",
  "characters",
  "character",
  "cast",
  "title",
  "end",
  "finis",
  "prologue",
  "epilogue",
  "intermission",
  "interval",
  "setting",
  "time",
  "place",
  "notes",
  "song",
  "lyrics",
  "music",
]);

function normalizeText(raw) {
  return String(raw || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "  ");
}

function isBlank(line) {
  return !String(line || "").trim();
}

function looksLikeCueName(name) {
  const n = String(name || "").trim();
  if (!n) return false;
  const lower = n.toLowerCase();
  if (NOT_CHARACTER.has(lower)) return false;
  if (SCENE_HEADINGS.test(n)) return false;
  const words = n.split(/\s+/);
  if (words.length > 5) return false;
  if (n.length > 42) return false;
  if (/[.!?]$/.test(n) && n.length > 18) return false;
  const letters = n.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  // Play cues are usually ALL CAPS; also allow Title Case names before a colon.
  return upper / letters.length >= 0.65 || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}$/.test(n);
}

function isSceneHeading(line) {
  const t = line.trim();
  if (SCENE_HEADINGS.test(t)) return true;
  if (/^scene\s+\d+/i.test(t)) return true;
  return false;
}

function isActHeading(line) {
  return /^act\s+(?:[ivxlcdm]+|\d+)\b/i.test(line.trim());
}

function isStageDirectionLine(line) {
  const t = line.trim();
  if (BRACKET_DIRECTION.test(t) && t.length < 240) return true;
  if (STAGE_VERBS.test(t) && t.length < 180) return true;
  return false;
}

function parseSceneHeading(line) {
  const t = line.trim().replace(/\.+$/, "");
  const act = t.match(/^act\s+([ivxlcdm]+|\d+)/i);
  const scene = t.match(/scene\s+([ivxlcdm]+|\d+)/i);
  return {
    raw: t,
    act: act ? act[1].toUpperCase() : null,
    scene: scene ? scene[1] : null,
    name: t,
  };
}

function addCharacter(map, name) {
  const display = titleCaseName(name);
  const key = slugify(display);
  if (!map.has(key)) {
    map.set(key, {
      id: key,
      name: display,
      isMe: false,
      voiceURI: "",
      pitch: 1,
      rate: 1,
      color: CHARACTER_COLORS[map.size % CHARACTER_COLORS.length],
    });
  }
  return map.get(key);
}

/**
 * Parse a play, musical sides, or simple "NAME: line" script into a structured script.
 */
export function parseScript(rawText, options = {}) {
  const sourceText = normalizeText(rawText);
  const linesIn = sourceText.split("\n");
  const characters = new Map();
  const scenes = [];
  const items = [];

  let title = options.title || "";
  let i = 0;

  while (i < linesIn.length && isBlank(linesIn[i])) i += 1;

  const bodyAt = indexOfBodyStart(linesIn, i);
  if (!title) {
    const titleParts = [];
    let t = i;
    while (t < bodyAt && titleParts.length < 3) {
      if (!isBlank(linesIn[t])) titleParts.push(linesIn[t].trim());
      t += 1;
    }
    title = titleParts.join(": ");
  }
  i = bodyAt;

  // Optional CHARACTERS block
  while (i < linesIn.length) {
    if (isBlank(linesIn[i])) {
      i += 1;
      continue;
    }
    if (META_HEADINGS.test(linesIn[i].trim())) {
      i += 1;
      while (i < linesIn.length && !isBlank(linesIn[i]) && !isSceneHeading(linesIn[i]) && !looksLikeCueLine(linesIn[i])) {
        const row = linesIn[i].trim();
        const name = row.split(/[-–—:]/)[0].trim();
        if (looksLikeCueName(name.replace(/\(.*\)/g, "").trim())) {
          addCharacter(characters, name.replace(/\(.*\)/g, "").trim());
        }
        i += 1;
      }
      continue;
    }
    break;
  }

  let currentScene = null;
  const ensureScene = (headingLine) => {
    const parsed = headingLine ? parseSceneHeading(headingLine) : { name: "Scene 1", act: null, scene: "1" };
    currentScene = {
      id: newId("scene"),
      name: parsed.name,
      act: parsed.act,
      order: scenes.length,
    };
    scenes.push(currentScene);
    return currentScene;
  };

  let currentSpeech = null;

  const flushSpeech = () => {
    if (!currentSpeech) return;
    const text = currentSpeech.text.join("\n").trim();
    if (text) {
      items.push({
        type: currentSpeech.type,
        characterName: currentSpeech.characterName,
        text,
        sceneId: currentSpeech.sceneId,
      });
    }
    currentSpeech = null;
  };

  const startSpeech = (type, characterName, firstText) => {
    flushSpeech();
    if (!currentScene) ensureScene("Scene 1");
    currentSpeech = {
      type,
      characterName,
      text: firstText ? [firstText] : [],
      sceneId: currentScene.id,
    };
  };

  for (; i < linesIn.length; i += 1) {
    const raw = linesIn[i];
    const trimmed = raw.trim();
    if (isBlank(raw)) {
      flushSpeech();
      continue;
    }
    if (/^-{3,}$/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
      flushSpeech();
      continue;
    }
    if (isActHeading(trimmed) || isSceneHeading(trimmed)) {
      flushSpeech();
      ensureScene(trimmed);
      continue;
    }

    const numbered = trimmed.match(NUMBERED_CUE);
    if (numbered) {
      const name = numbered[2].trim();
      const rest = numbered[3].trim();
      if (looksLikeCueName(name)) {
        addCharacter(characters, name);
        startSpeech("dialogue", titleCaseName(name), rest);
        continue;
      }
    }

    if (isStageDirectionLine(trimmed) && !INLINE_CUE.test(trimmed)) {
      startSpeech("direction", null, trimmed.replace(/^\[|\]$/g, "").replace(/^\(|\)$/g, "").trim());
      flushSpeech();
      continue;
    }

    const inline = trimmed.match(INLINE_CUE);
    if (inline && looksLikeCueName(inline[1])) {
      addCharacter(characters, inline[1]);
      startSpeech("dialogue", titleCaseName(inline[1]), inline[2].trim());
      continue;
    }

    const cueOnly = trimmed.match(CUE_ONLY);
    if (cueOnly && looksLikeCueName(cueOnly[1]) && trimmed.length < 48) {
      addCharacter(characters, cueOnly[1]);
      const parenthetical = cueOnly[2] ? `(${cueOnly[2]})` : "";
      startSpeech("dialogue", titleCaseName(cueOnly[1]), parenthetical);
      continue;
    }

    if (currentSpeech) {
      currentSpeech.text.push(trimmed);
    } else {
      if (!currentScene) ensureScene("Scene 1");
      startSpeech("direction", null, trimmed);
    }
  }
  flushSpeech();

  if (!scenes.length) ensureScene("Scene 1");

  const scriptLines = items.map((item, index) => {
    const character = item.characterName ? characters.get(slugify(item.characterName)) : null;
    return {
      id: newId("line"),
      number: index + 1,
      sceneId: item.sceneId || scenes[0].id,
      characterId: character ? character.id : null,
      type: item.type,
      text: item.text,
    };
  });

  const charList = [...characters.values()];
  if (charList.length === 1) charList[0].isMe = true;

  return emptyScript({
    title: title || "Untitled script",
    sourceText,
    sourceType: options.sourceType || "text",
    characters: charList,
    scenes,
    lines: scriptLines,
  });
}

function looksLikeCueLine(line) {
  const trimmed = String(line || "").trim();
  if (NUMBERED_CUE.test(trimmed)) return true;
  const inline = trimmed.match(INLINE_CUE);
  if (inline && looksLikeCueName(inline[1])) return true;
  const cueOnly = trimmed.match(CUE_ONLY);
  if (cueOnly && looksLikeCueName(cueOnly[1]) && trimmed.length < 48) return true;
  return false;
}

function nextNonBlankIsDialogue(lines, index) {
  let j = index + 1;
  while (j < lines.length && isBlank(lines[j])) j += 1;
  if (j >= lines.length) return false;
  const next = lines[j].trim();
  if (META_HEADINGS.test(next) || isSceneHeading(next) || isActHeading(next)) return false;
  if (looksLikeCueLine(next)) return false;
  if (isStageDirectionLine(next)) return true;
  return next.length > 0;
}

function indexOfBodyStart(lines, from = 0) {
  for (let i = from; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (!t) continue;
    if (META_HEADINGS.test(t) || isSceneHeading(t) || isActHeading(t)) return i;
  }
  for (let i = from; i < lines.length; i += 1) {
    const t = lines[i].trim();
    if (!t) continue;
    if (NUMBERED_CUE.test(t)) return i;
    const inline = t.match(INLINE_CUE);
    if (inline && looksLikeCueName(inline[1])) return i;
    if (looksLikeCueLine(t) && nextNonBlankIsDialogue(lines, i)) return i;
  }
  return from;
}

export function setMyCharacter(script, characterId) {
  return {
    ...script,
    characters: script.characters.map((c) => ({ ...c, isMe: c.id === characterId })),
    updatedAt: Date.now(),
  };
}

export function updateCharacter(script, characterId, patch) {
  return {
    ...script,
    characters: script.characters.map((c) => (c.id === characterId ? { ...c, ...patch } : c)),
    updatedAt: Date.now(),
  };
}

export function characterMap(script) {
  return new Map(script.characters.map((c) => [c.id, c]));
}
