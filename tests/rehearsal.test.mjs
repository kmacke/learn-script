import test from "node:test";
import assert from "node:assert/strict";
import { parseScript, setMyCharacter } from "../app/js/parser.js";
import {
  buildPlaylist,
  resolveRange,
  promptLineForIndex,
  nextIndex,
  isPlaylistComplete,
} from "../app/js/rehearsal.js";

const src = `Demo

SCENE 1

JULES
Cue one.

MAYA
My first line.

JULES
Cue two.

MAYA
My second line.

SCENE 2

JULES
Later cue.

MAYA
Later line.
`;

function demo() {
  let script = parseScript(src);
  const maya = script.characters.find((c) => c.name === "Maya");
  script = setMyCharacter(script, maya.id);
  return script;
}

test("scene range covers only that scene's line numbers", () => {
  const script = demo();
  const scene1 = script.scenes[0];
  const range = resolveRange(script, { startSceneId: scene1.id, endSceneId: scene1.id });
  assert.equal(range.start, 1);
  assert.equal(range.end, 4);
});

test("full mode speaks every dialogue line", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "full", playDirections: false });
  assert.equal(playlist.steps.length, 6);
  assert.ok(playlist.steps.every((s) => s.kind === "speak"));
});

test("mine mode speaks only my lines", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "mine" });
  assert.equal(playlist.steps.length, 3);
  assert.ok(playlist.steps.every((s) => s.role === "me"));
});

test("cues mode gaps my lines and speaks others", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "cues", startLine: 1, endLine: 4 });
  const kinds = playlist.steps.map((s) => `${s.kind}:${s.role}`);
  assert.deepEqual(kinds, ["speak:other", "gap:me", "speak:other", "gap:me"]);
});

test("line-gap inserts a repeat gap after my speech", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "line-gap", startLine: 1, endLine: 2 });
  assert.equal(playlist.steps[0].kind, "speak");
  assert.equal(playlist.steps[1].kind, "speak");
  assert.equal(playlist.steps[2].kind, "gap");
  assert.equal(playlist.steps[2].role, "me-repeat");
});

test("gap-line lets me try first", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "gap-line", startLine: 2, endLine: 2 });
  assert.equal(playlist.steps[0].kind, "gap");
  assert.equal(playlist.steps[1].kind, "speak");
});

test("includeOthers false keeps only my lines even in cues-ish setup", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "full", includeOthers: false });
  assert.equal(playlist.steps.length, 3);
});

test("prompt finds the current or previous own line", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "cues", startLine: 1, endLine: 4 });
  const prompted = promptLineForIndex(playlist, 1);
  assert.match(prompted.text, /My first line/);
});

test("loop wraps; without loop it completes", () => {
  const script = demo();
  const playlist = buildPlaylist(script, { mode: "mine" });
  const last = playlist.steps.length - 1;
  assert.equal(nextIndex(playlist, last, true), 0);
  assert.equal(nextIndex(playlist, last, false), playlist.steps.length);
  assert.equal(isPlaylistComplete(playlist, playlist.steps.length, false), true);
  assert.equal(isPlaylistComplete(playlist, 0, true), false);
});
