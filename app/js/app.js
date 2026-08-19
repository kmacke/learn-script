import { parseScript, setMyCharacter, updateCharacter, characterMap } from "./parser.js";
import { buildPlaylist, PLAY_MODES, promptLineForIndex, myCharacter } from "./rehearsal.js";
import { TtsEngine, assignVoices } from "./tts.js";
import * as db from "./db.js";
import { extractPdfText } from "./pdfImport.js";
import { SAMPLE_SCRIPTS } from "./samples.js";
import { estimateSpeechMs } from "./model.js";

const tts = new TtsEngine();
const $ = (sel) => document.querySelector(sel);
const appEl = $("#app");

const state = {
  route: "library",
  scriptId: null,
  scripts: [],
  script: null,
  voices: [],
  importText: "",
  importTitle: "",
  importError: "",
  importPreview: null,
  setup: {
    mode: "cues",
    startLine: 1,
    endLine: 1,
    startSceneId: "",
    endSceneId: "",
    loop: true,
    includeOthers: true,
    playDirections: false,
    extraGapMs: 400,
    rate: 1,
  },
  player: {
    playing: false,
    index: 0,
    playlist: null,
    abort: false,
  },
};

function parseRoute() {
  const hash = (location.hash || "#/library").replace(/^#/, "");
  const parts = hash.split("/").filter(Boolean);
  if (parts[0] === "import") return { route: "import" };
  if (parts[0] === "s" && parts[1]) {
    const id = parts[1];
    const sub = parts[2] || "script";
    return { route: sub, scriptId: id };
  }
  return { route: "library" };
}

function go(path) {
  location.hash = path;
}

window.addEventListener("hashchange", () => bootRoute());

async function bootRoute() {
  const next = parseRoute();
  state.route = next.route;
  state.scriptId = next.scriptId || null;
  if (state.scriptId) {
    state.script = await db.getScript(state.scriptId);
    if (!state.script) {
      go("/library");
      return;
    }
    syncSetupBounds();
  } else {
    state.script = null;
  }
  if (state.route === "library") state.scripts = await db.listScripts();
  render();
}

function syncSetupBounds() {
  if (!state.script?.lines?.length) return;
  const nums = state.script.lines.map((l) => l.number);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (!state.setup.startLine) state.setup.startLine = min;
  if (!state.setup.endLine || state.setup.endLine > max) state.setup.endLine = max;
  if (state.setup.startLine < min) state.setup.startLine = min;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function icon(name) {
  const icons = {
    back: '<path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    play: '<path d="M9 6l12 8-12 8V6z" fill="currentColor"/>',
    pause: '<path d="M8 6h3v16H8zM17 6h3v16h-3z" fill="currentColor"/>',
    star: '<path d="M12 3l2.6 5.4L20.5 9l-4.2 4.1L17.5 19 12 16.2 6.5 19l1.2-5.9L3.5 9l5.9-.6L12 3z" fill="currentColor"/>',
    close: '<path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ""}</svg>`;
}

function topbar(title, { back, action } = {}) {
  return `
    <header class="topbar">
      ${back ? `<button class="icon-btn" data-act="back" aria-label="Back">${icon("back")}</button>` : `<div class="brand"><small>LearnScript</small><h1>${escapeHtml(title)}</h1></div>`}
      ${back ? `<h1>${escapeHtml(title)}</h1>` : ""}
      ${action || `<span style="width:44px"></span>`}
    </header>`;
}

function render() {
  if (state.route === "library") appEl.innerHTML = renderLibrary();
  else if (state.route === "import") appEl.innerHTML = renderImport();
  else if (state.route === "cast") appEl.innerHTML = renderCast();
  else if (state.route === "setup") appEl.innerHTML = renderSetup();
  else if (state.route === "play") appEl.innerHTML = renderPlay();
  else if (state.route === "script") appEl.innerHTML = renderScript();
  else appEl.innerHTML = renderLibrary();
  bind();
}

function renderLibrary() {
  const cards = state.scripts
    .map(
      (s) => `
      <button class="card" data-act="open" data-id="${s.id}">
        <h3>${escapeHtml(s.title)}</h3>
        <p>${s.characters?.length || 0} characters · ${s.lines?.length || 0} lines · ${s.scenes?.length || 0} scenes</p>
        <div class="meta"><span>${s.characters?.find((c) => c.isMe)?.name ? "You: " + escapeHtml(s.characters.find((c) => c.isMe).name) : "Pick a role"}</span></div>
      </button>`
    )
    .join("");

  const samples = SAMPLE_SCRIPTS.map(
    (s) => `
      <button class="card" data-act="sample" data-key="${s.key}">
        <span class="pill">Sample</span>
        <h3 style="margin-top:8px">${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.blurb)}</p>
      </button>`
  ).join("");

  return `
    ${topbar("Your scripts")}
    <div class="screen">
      <div class="hero">
        <h2>Learn the scene until it sings.</h2>
        <p>Import a script, claim your role, and loop the lines. Other characters speak in their own voices. You fill the gaps.</p>
      </div>
      <div class="fab-row">
        <button class="btn primary" data-act="goto-import">Import script</button>
        <button class="btn" data-act="goto-import">Paste text</button>
      </div>
      <div class="stack">
        ${cards || `<p class="hint">No scripts on this phone yet. Start with a sample, then import your sides.</p>`}
        ${samples}
      </div>
    </div>`;
}

function renderImport() {
  const preview = state.importPreview;
  const previewHtml = preview
    ? `<div class="card">
        <h3>${escapeHtml(preview.title)}</h3>
        <p>${preview.characters.length} characters · ${preview.scenes.length} scenes · ${preview.lines.length} lines</p>
        <p class="hint" style="margin-top:8px">${preview.characters.map((c) => escapeHtml(c.name)).join(" · ") || "No characters detected — check formatting."}</p>
      </div>
      <button class="btn primary" data-act="save-import" ${preview.lines.length ? "" : "disabled"}>Save and open</button>`
    : "";
  return `
    ${topbar("Import", { back: true })}
    <div class="screen">
      <p class="hint">Paste a play, musical sides, or <code>NAME: line</code> text. Or choose a .txt / .pdf file. You will review the parse before rehearsing.</p>
      <div class="field">
        <label>Title (optional)</label>
        <input id="import-title" value="${escapeHtml(state.importTitle)}" placeholder="Spring Awakening — Act 2 sides" />
      </div>
      <div class="field">
        <label>Script text</label>
        <textarea id="import-text" placeholder="SCENE 1&#10;&#10;JULES&#10;Places in five.">${escapeHtml(state.importText)}</textarea>
      </div>
      <div class="btn-row" style="margin-bottom:14px">
        <label class="btn file-btn">Choose file
          <input id="import-file" type="file" accept=".txt,.md,.fountain,.pdf,text/plain,application/pdf" />
        </label>
        <button class="btn primary" data-act="parse-import">Preview</button>
      </div>
      ${state.importError ? `<p class="error">${escapeHtml(state.importError)}</p>` : ""}
      <div class="stack">${previewHtml}</div>
    </div>`;
}

function renderScript() {
  const s = state.script;
  const me = myCharacter(s);
  const grouped = s.scenes.map((scene) => {
    const lines = s.lines.filter((l) => l.sceneId === scene.id);
    const body = lines
      .slice(0, 6)
      .map((line) => lineRow(s, line))
      .join("");
    const more = lines.length > 6 ? `<p class="hint">+ ${lines.length - 6} more lines in this scene</p>` : "";
    return `<div class="scene-label">${escapeHtml(scene.name)}</div>${body}${more}`;
  }).join("");

  return `
    ${topbar(s.title, { back: true, action: `<button class="icon-btn" data-act="delete-script" aria-label="Delete">${icon("close")}</button>` })}
    <div class="screen">
      <div class="hero">
        <h2>${escapeHtml(s.title)}</h2>
        <p>${s.lines.length} lines · ${s.scenes.length} scenes · Your role: <strong>${escapeHtml(me?.name || "not set")}</strong></p>
      </div>
      <div class="btn-row" style="margin-bottom:16px">
        <button class="btn" data-act="goto-cast">Cast & voices</button>
        <button class="btn primary" data-act="goto-setup">Rehearse</button>
      </div>
      ${grouped}
    </div>`;
}

function lineRow(script, line) {
  const ch = script.characters.find((c) => c.id === line.characterId);
  const cls = !ch ? "dir" : ch.isMe ? "" : "other";
  const who = ch ? ch.name : "Stage direction";
  return `<div class="list-line">
    <div class="who ${cls}"><span>${escapeHtml(who)}</span><span class="num">${line.number}</span></div>
    <div class="txt">${escapeHtml(line.text)}</div>
  </div>`;
}

function renderCast() {
  const s = state.script;
  const rows = s.characters
    .map((c) => {
      const count = s.lines.filter((l) => l.characterId === c.id).length;
      const voiceOpts = state.voices
        .map((v) => {
          const sel = v.voiceURI === c.voiceURI ? " selected" : "";
          return `<option value="${escapeHtml(v.voiceURI)}"${sel}>${escapeHtml(v.name)}</option>`;
        })
        .join("");
      return `<div class="char-row">
        <div class="swatch" style="background:${c.color}"></div>
        <div style="flex:1;min-width:0">
          <h3>${escapeHtml(c.name)}</h3>
          <div class="sub">${count} lines · pitch ${Number(c.pitch).toFixed(2)}</div>
          <select data-act="voice" data-id="${c.id}" style="margin-top:8px;width:100%;background:var(--bg-3);border:1px solid var(--line);border-radius:12px;padding:8px;font-size:16px">
            <option value="">Default device voice</option>
            ${voiceOpts}
          </select>
          <input type="range" min="0.7" max="1.5" step="0.02" value="${c.pitch}" data-act="pitch" data-id="${c.id}" style="width:100%;margin-top:8px" />
        </div>
        <button class="star ${c.isMe ? "on" : ""}" data-act="me" data-id="${c.id}" aria-label="This is me">${icon("star")}</button>
        <button class="icon-btn" data-act="preview" data-id="${c.id}" aria-label="Preview">▶</button>
      </div>`;
    })
    .join("");

  return `
    ${topbar("Cast & voices", { back: true })}
    <div class="screen">
      <p class="hint">Gold star = your role (those lines become gaps in Cues mode). Preview each voice. Pitch is the LineLearner trick: everyone should sound different.</p>
      ${rows || `<p class="error">No characters parsed. Go back and check the script formatting.</p>`}
      <div class="btn-row" style="margin-top:18px">
        <button class="btn primary" data-act="goto-setup">Rehearse this cast</button>
      </div>
    </div>`;
}

function renderSetup() {
  const s = state.script;
  const st = state.setup;
  const modes = PLAY_MODES.map(
    (m) => `<button class="${st.mode === m.id ? "on" : ""}" data-act="mode" data-id="${m.id}">${m.label}</button>`
  ).join("");
  const modeHint = PLAY_MODES.find((m) => m.id === st.mode)?.hint || "";
  const sceneOpts = (selected) =>
    s.scenes
      .map((sc) => `<option value="${sc.id}"${sc.id === selected ? " selected" : ""}>${escapeHtml(sc.name)}</option>`)
      .join("");
  return `
    ${topbar("Rehearse", { back: true })}
    <div class="screen">
      <p class="hint">Pick a start and end — scene or line number — then loop it. ${escapeHtml(modeHint)}</p>
      <div class="field"><label>Mode</label><div class="seg">${modes}</div></div>
      <div class="field">
        <label>Start scene</label>
        <select id="start-scene"><option value="">(use line number)</option>${sceneOpts(st.startSceneId)}</select>
      </div>
      <div class="field">
        <label>End scene</label>
        <select id="end-scene"><option value="">(use line number)</option>${sceneOpts(st.endSceneId)}</select>
      </div>
      <div class="btn-row">
        <div class="field" style="flex:1"><label>Start line</label><input id="start-line" type="number" inputmode="numeric" value="${st.startLine}" /></div>
        <div class="field" style="flex:1"><label>End line</label><input id="end-line" type="number" inputmode="numeric" value="${st.endLine}" /></div>
      </div>
      <div class="toggle"><span>Loop this range</span><button class="switch ${st.loop ? "on" : ""}" data-act="toggle" data-key="loop"></button></div>
      <div class="toggle"><span>Include other characters</span><button class="switch ${st.includeOthers ? "on" : ""}" data-act="toggle" data-key="includeOthers"></button></div>
      <div class="toggle"><span>Speak stage directions</span><button class="switch ${st.playDirections ? "on" : ""}" data-act="toggle" data-key="playDirections"></button></div>
      <div class="field"><label>Extra gap (${st.extraGapMs} ms)</label><input id="extra-gap" type="range" min="0" max="2500" step="100" value="${st.extraGapMs}" /></div>
      <div class="field"><label>Speed (${st.rate.toFixed(2)}×)</label><input id="rate" type="range" min="0.7" max="1.4" step="0.05" value="${st.rate}" /></div>
      <button class="btn primary" data-act="start-play" style="width:100%;margin-top:8px">Start rehearsal</button>
    </div>`;
}

function sceneByIdName(script, step) {
  if (!step) return "no range";
  const scene = script.scenes.find((sc) => sc.id === step.line.sceneId);
  return scene?.name || "scene";
}

function renderPlay() {
  const s = state.script;
  const p = state.player;
  const playlist = p.playlist || buildPlaylist(s, state.setup);
  const step = playlist.steps[p.index] || playlist.steps[0];
  const chars = characterMap(s);
  const ch = step ? chars.get(step.line.characterId) : null;
  const kicker = !step
    ? "No lines in this range"
    : step.kind === "gap"
      ? `Line ${step.line.number} · your gap`
      : ch?.isMe
        ? `Line ${step.line.number} · you · ${ch.name}`
        : ch
          ? `Line ${step.line.number} · ${ch.name}`
          : `Line ${step.line.number} · stage direction`;
  const kickerClass = step?.kind === "gap" ? "gap" : ch && !ch.isMe ? "other" : "";
  const next = playlist.steps[p.index + 1];
  const pct = playlist.steps.length ? (Math.min(p.index, playlist.steps.length) / playlist.steps.length) * 100 : 0;
  return `
    ${topbar("Player", { back: true, action: `<button class="btn ghost" data-act="goto-setup" style="min-height:44px;padding:8px 10px">Range</button>` })}
    <div class="player">
      <div class="progress"><span style="width:${pct}%"></span></div>
      <p class="hint" style="margin:0 0 8px">${playlist.mode} · ${escapeHtml(sceneByIdName(s, step))} · lines ${playlist.range.start}–${playlist.range.end} · ${playlist.steps.length ? Math.min(p.index + 1, playlist.steps.length) : 0}/${playlist.steps.length}${state.setup.loop ? " · loop" : ""}</p>
      <div class="player-stage">
        <div class="player-kicker ${kickerClass}">${escapeHtml(kicker)}</div>
        <p class="player-text">${escapeHtml(step ? (step.kind === "gap" ? "Your line — speak it. Prompt if you dry." : step.line.text) : "Nothing to play. Change the range.")}</p>
        <p class="player-next">${
          !playlist.steps.length
            ? "No lines in this range. Tap Range and widen start/end."
            : next
              ? "Next: " + escapeHtml((chars.get(next.line.characterId)?.name || "Direction") + " — " + next.line.text)
              : state.setup.loop
                ? "Next: loop to start"
                : "End of range"
        }</p>
      </div>
      ${tts.lastOk === false ? `<p class="hint">Silent rehearsal — this browser could not speak, but timing still runs. On iPhone use Safari.</p>` : ""}
      <div class="transport">
        <button class="side-btn" data-act="prompt">Prompt<small>hear your line</small></button>
        <button class="play-btn" data-act="toggle-play" aria-label="${p.playing ? "Pause" : "Play"}">${p.playing ? icon("pause") : icon("play")}</button>
        <button class="side-btn" data-act="skip">Skip<small>next beat</small></button>
      </div>
    </div>`;
}

function bind() {
  appEl.onclick = async (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    if (btn.tagName === "SELECT" || btn.matches("input[type=range]")) return;
    const act = btn.dataset.act;
    try {
      await handleAct(act, btn);
    } catch (err) {
      console.error(err);
      state.importError = String(err.message || err);
      render();
    }
  };
  appEl.onchange = async (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    await handleAct(el.dataset.act, el);
  };
  appEl.oninput = async (ev) => {
    const el = ev.target;
    if (el.dataset.act === "pitch") await handleAct("pitch", el);
  };

  const importText = $("#import-text");
  if (importText) {
    importText.oninput = () => {
      state.importText = importText.value;
    };
  }
  const importTitle = $("#import-title");
  if (importTitle) importTitle.oninput = () => (state.importTitle = importTitle.value);
  const file = $("#import-file");
  if (file) file.onchange = () => onFile(file.files?.[0]);

  const startScene = $("#start-scene");
  if (startScene) startScene.onchange = () => (state.setup.startSceneId = startScene.value);
  const endScene = $("#end-scene");
  if (endScene) endScene.onchange = () => (state.setup.endSceneId = endScene.value);
  const startLine = $("#start-line");
  if (startLine) startLine.oninput = () => (state.setup.startLine = Number(startLine.value));
  const endLine = $("#end-line");
  if (endLine) endLine.oninput = () => (state.setup.endLine = Number(endLine.value));
  const extra = $("#extra-gap");
  if (extra) extra.oninput = () => {
    state.setup.extraGapMs = Number(extra.value);
  };
  const rate = $("#rate");
  if (rate) rate.oninput = () => {
    state.setup.rate = Number(rate.value);
  };
}

async function handleAct(act, btn) {
  if (act === "back") {
    stopPlayer();
    if (state.route === "play") return go(`/s/${state.scriptId}/setup`);
    if (state.route === "setup" || state.route === "cast") return go(`/s/${state.scriptId}`);
    return go("/library");
  }
  if (act === "goto-import") return go("/import");
  if (act === "open") return go(`/s/${btn.dataset.id}`);
  if (act === "goto-cast") return go(`/s/${state.scriptId}/cast`);
  if (act === "goto-setup") return go(`/s/${state.scriptId}/setup`);
  if (act === "sample") return addSample(btn.dataset.key);
  if (act === "parse-import") return previewImport();
  if (act === "save-import") return saveImport();
  if (act === "delete-script") return removeScript();
  if (act === "me") return claimRole(btn.dataset.id);
  if (act === "voice") return changeVoice(btn.dataset.id, btn.value);
  if (act === "pitch") return changePitch(btn.dataset.id, btn.value);
  if (act === "preview") return previewCharacter(btn.dataset.id);
  if (act === "mode") {
    state.setup.mode = btn.dataset.id;
    render();
    return;
  }
  if (act === "toggle") {
    state.setup[btn.dataset.key] = !state.setup[btn.dataset.key];
    render();
    return;
  }
  if (act === "start-play") return startPlay();
  if (act === "toggle-play") return togglePlay();
  if (act === "prompt") return promptNow();
  if (act === "skip") return skipStep();
}

async function addSample(key) {
  const sample = SAMPLE_SCRIPTS.find((s) => s.key === key);
  if (!sample) return;
  let script = parseScript(sample.text, { title: sample.title, sourceType: "sample" });
  script = await withVoices(script);
  const existing = (await db.listScripts()).find((s) => s.sourceType === "sample" && s.title === sample.title);
  if (existing) {
    script = { ...script, id: existing.id, createdAt: existing.createdAt };
  }
  await db.saveScript(script);
  go(`/s/${script.id}`);
}

async function withVoices(script) {
  const voices = await tts.waitForVoices();
  state.voices = voices;
  return { ...script, characters: assignVoices(script.characters, voices) };
}

function previewImport() {
  state.importError = "";
  const text = ($("#import-text")?.value || state.importText || "").trim();
  if (!text) {
    state.importError = "Paste a script or choose a file first.";
    render();
    return;
  }
  state.importText = text;
  state.importPreview = parseScript(text, { title: state.importTitle, sourceType: "text" });
  render();
}

async function saveImport() {
  if (!state.importPreview) return;
  let script = await withVoices(state.importPreview);
  if (state.importTitle) script = { ...script, title: state.importTitle };
  await db.saveScript(script);
  state.importPreview = null;
  state.importText = "";
  go(`/s/${script.id}`);
}

async function onFile(file) {
  if (!file) return;
  state.importError = "";
  state.importTitle = state.importTitle || file.name.replace(/\.[^.]+$/, "");
  try {
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      const buf = await file.arrayBuffer();
      state.importText = await extractPdfText(buf);
    } else {
      state.importText = await file.text();
    }
    state.importPreview = parseScript(state.importText, { title: state.importTitle, sourceType: file.name.endsWith(".pdf") ? "pdf" : "text" });
  } catch (err) {
    state.importError = `Could not read file: ${err.message || err}`;
  }
  render();
}

async function removeScript() {
  if (!state.script) return;
  if (!confirm(`Delete “${state.script.title}”?`)) return;
  await db.deleteScript(state.script.id);
  go("/library");
}

async function claimRole(id) {
  state.script = setMyCharacter(state.script, id);
  await db.saveScript(state.script);
  render();
}

async function changeVoice(id, voiceURI) {
  state.script = updateCharacter(state.script, id, { voiceURI });
  await db.saveScript(state.script);
}

async function changePitch(id, pitch) {
  state.script = updateCharacter(state.script, id, { pitch: Number(pitch) });
  await db.saveScript(state.script);
}

async function previewCharacter(id) {
  tts.unlock();
  const ch = state.script.characters.find((c) => c.id === id);
  const line = state.script.lines.find((l) => l.characterId === id);
  const text = line?.text || `Hello, I am ${ch.name}.`;
  await tts.speak(text, { ...ch, durationMs: estimateSpeechMs(text, state.setup.rate) });
}

function captureSetupFromForm() {
  const startLine = $("#start-line");
  const endLine = $("#end-line");
  const startScene = $("#start-scene");
  const endScene = $("#end-scene");
  const extra = $("#extra-gap");
  const rate = $("#rate");
  if (startLine) state.setup.startLine = Number(startLine.value);
  if (endLine) state.setup.endLine = Number(endLine.value);
  if (startScene) state.setup.startSceneId = startScene.value;
  if (endScene) state.setup.endSceneId = endScene.value;
  if (extra) state.setup.extraGapMs = Number(extra.value);
  if (rate) state.setup.rate = Number(rate.value);
}

function startPlay() {
  captureSetupFromForm();
  const playlist = buildPlaylist(state.script, state.setup);
  state.player = { playing: false, index: 0, playlist, abort: false, abortStep: false, runId: 0 };
  go(`/s/${state.scriptId}/play`);
}

function stopPlayer() {
  state.player.abort = true;
  state.player.abortStep = true;
  state.player.playing = false;
  tts.cancel();
}

function shouldAbortStep() {
  return Boolean(state.player.abort || state.player.abortStep);
}

async function togglePlay() {
  if (state.player.playing) {
    stopPlayer();
    render();
    return;
  }
  tts.unlock();
  if (!state.player.playlist) state.player.playlist = buildPlaylist(state.script, state.setup);
  state.player.abort = false;
  state.player.abortStep = false;
  state.player.playing = true;
  state.player.runId = (state.player.runId || 0) + 1;
  const runId = state.player.runId;
  render();
  await runLoop(runId);
}

async function runLoop(runId) {
  const playlist = state.player.playlist;
  const chars = characterMap(state.script);
  while (state.player.playing && !state.player.abort && state.player.runId === runId) {
    if (!playlist.steps.length) break;
    if (state.player.index >= playlist.steps.length) {
      if (state.setup.loop) state.player.index = 0;
      else break;
    }
    state.player.abortStep = false;
    render();
    const step = playlist.steps[state.player.index];
    const ch = chars.get(step.line.characterId);
    const rate = (ch?.rate || 1) * state.setup.rate;
    if (step.kind === "speak") {
      await tts.speak(
        step.line.text,
        {
          voiceURI: ch?.voiceURI,
          pitch: ch?.pitch || 1,
          rate,
          durationMs: step.durationMs,
        },
        shouldAbortStep
      );
    } else {
      await tts.gap(step.durationMs, shouldAbortStep);
    }
    if (state.player.abort || state.player.runId !== runId) break;
    state.player.index += 1;
  }
  if (state.player.runId === runId) state.player.playing = false;
  if (state.route === "play") render();
}

async function promptNow() {
  tts.unlock();
  const playlist = state.player.playlist || buildPlaylist(state.script, state.setup);
  const line = promptLineForIndex(playlist, state.player.index);
  if (!line) return;
  const ch = state.script.characters.find((c) => c.id === line.characterId);
  await tts.speak(line.text, { ...ch, durationMs: estimateSpeechMs(line.text, state.setup.rate) }, shouldAbortStep);
}

function skipStep() {
  if (!state.player.playlist?.steps.length) return;
  if (state.player.playing) {
    state.player.abortStep = true;
    tts.cancel();
    return;
  }
  state.player.index += 1;
  if (state.player.index >= state.player.playlist.steps.length) {
    state.player.index = state.setup.loop ? 0 : state.player.playlist.steps.length - 1;
  }
  render();
}

async function boot() {
  tts.waitForVoices().then((v) => {
    state.voices = v;
  });
  if (!location.hash) location.hash = "/library";
  await bootRoute();
}

boot();
