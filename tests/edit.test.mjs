import test from "node:test";
import assert from "node:assert/strict";
import { parseScript, setMyCharacter } from "../app/js/parser.js";
import {
  addCharacter,
  mergeCharacters,
  setLineCharacter,
  updateLineText,
  deleteLine,
  splitLine,
  splitLineOnNewlines,
  renameScene,
  serializeScript,
  deserializeScript,
} from "../app/js/edit.js";

function demo() {
  return parseScript(`Sides

ALICE: Hello there.
BOB: Hi Alice.
ALICE: Let's begin.
`);
}

test("setLineCharacter reassigns a speech and can create a new person", () => {
  let script = demo();
  const bobLine = script.lines.find((l) => l.text.includes("Hi Alice"));
  script = setLineCharacter(script, bobLine.id, "Carol");
  const carol = script.characters.find((c) => c.name === "Carol");
  assert.ok(carol);
  const updated = script.lines.find((l) => l.id === bobLine.id);
  assert.equal(updated.characterId, carol.id);
  assert.equal(updated.type, "dialogue");
});

test("setLineCharacter can turn a line into a stage direction", () => {
  let script = demo();
  const first = script.lines[0];
  script = setLineCharacter(script, first.id, "__direction__");
  assert.equal(script.lines[0].characterId, null);
  assert.equal(script.lines[0].type, "direction");
});

test("mergeCharacters moves lines and keeps the gold star", () => {
  let script = demo();
  const alice = script.characters.find((c) => c.name === "Alice");
  const bob = script.characters.find((c) => c.name === "Bob");
  script = setMyCharacter(script, bob.id);
  script = mergeCharacters(script, bob.id, alice.id);
  assert.equal(script.characters.some((c) => c.id === bob.id), false);
  assert.equal(script.characters.find((c) => c.id === alice.id).isMe, true);
  assert.ok(script.lines.every((l) => l.characterId !== bob.id));
  assert.equal(script.lines.filter((l) => l.characterId === alice.id).length, 3);
});

test("splitLine and deleteLine keep sequential numbers", () => {
  let script = demo();
  const first = script.lines[0];
  script = updateLineText(script, first.id, "Hello there. Keep going.");
  const cut = script.lines[0].text.indexOf("Keep");
  script = splitLine(script, first.id, cut);
  assert.equal(script.lines.length, 4);
  assert.equal(script.lines[0].text, "Hello there.");
  assert.equal(script.lines[1].text, "Keep going.");
  script.lines.forEach((line, i) => assert.equal(line.number, i + 1));
  script = deleteLine(script, script.lines[1].id);
  assert.equal(script.lines.length, 3);
  script.lines.forEach((line, i) => assert.equal(line.number, i + 1));
});

test("splitLineOnNewlines makes one speech per paragraph", () => {
  let script = demo();
  const first = script.lines[0];
  script = updateLineText(script, first.id, "Hello there.\n\nI missed this beat.");
  script = splitLineOnNewlines(script, first.id);
  assert.equal(script.lines[0].text, "Hello there.");
  assert.equal(script.lines[1].text, "I missed this beat.");
  assert.equal(script.lines.length, 4);
});

test("addCharacter is idempotent by name and renameScene works", () => {
  let script = demo();
  const before = script.characters.length;
  script = addCharacter(script, "alice");
  assert.equal(script.characters.length, before);
  script = addCharacter(script, "Director");
  assert.ok(script.characters.some((c) => c.name === "Director"));
  const scene = script.scenes[0];
  script = renameScene(script, scene.id, "The kitchen");
  assert.equal(script.scenes[0].name, "The kitchen");
});

test("JSON round-trip preserves lines and characters", () => {
  const script = demo();
  const raw = serializeScript(script);
  const copy = deserializeScript(raw);
  assert.equal(copy.title, script.title);
  assert.equal(copy.lines.length, script.lines.length);
  assert.equal(copy.characters.map((c) => c.name).join(","), script.characters.map((c) => c.name).join(","));
});
