import { parseScript } from "../app/js/parser.js";
import test from "node:test";
import assert from "node:assert/strict";

const GREEN_ROOM = `THE GREEN ROOM
A short rehearsal scene

CHARACTERS
MAYA - an anxious lead
JULES - a patient stage manager
DIRECTOR - offstage voice

SCENE 1. Backstage, five minutes to places.

JULES
Places in five, Maya. You good?

MAYA
I forgot the second-act speech. The whole thing just—gone.

JULES
You haven't forgotten it. You're just listening to the fear instead of the line.

[A knock. The DIRECTOR calls from the hall.]

DIRECTOR
Maya? If you're going to throw up, do it downstage of the curtain this time.

MAYA
I'm not going to throw up.

SCENE 2. The same, after the scene.

MAYA
I remembered.

JULES
You always do.
`;

test("parses title, characters, scenes, and dialogue cues", () => {
  const script = parseScript(GREEN_ROOM);
  assert.match(script.title, /Green Room/i);
  assert.equal(script.characters.length, 3);
  assert.ok(script.characters.some((c) => c.name === "Maya"));
  assert.ok(script.characters.some((c) => c.name === "Jules"));
  assert.equal(script.scenes.length, 2);
  assert.ok(script.lines.length >= 7);
  const first = script.lines.find((l) => l.type === "dialogue");
  assert.equal(script.characters.find((c) => c.id === first.characterId).name, "Jules");
  assert.match(first.text, /Places in five/);
  const direction = script.lines.find((l) => l.type === "direction");
  assert.ok(direction);
  assert.match(direction.text, /knock/i);
  script.lines.forEach((line, i) => assert.equal(line.number, i + 1));
});

test("parses NAME: sides on one line", () => {
  const script = parseScript(`Cold Read

ROMEO: Did my heart love till now?
JULIET: You kiss by the book.
`);
  assert.equal(script.characters.map((c) => c.name).sort().join(","), "Juliet,Romeo");
  assert.equal(script.lines.filter((l) => l.type === "dialogue").length, 2);
  assert.match(script.lines[0].text, /heart love/);
});

test("parses numbered sides", () => {
  const script = parseScript(`Sides

1. HAMLET: To be, or not to be, that is the question.
2. HORATIO: This bodes some strange eruption to our state.
3. HAMLET: Whether 'tis nobler in the mind to suffer
`);
  assert.equal(script.lines.length, 3);
  assert.equal(script.characters.length, 2);
  assert.match(script.lines[2].text, /nobler/);
});

test("single character is marked as me", () => {
  const script = parseScript(`Monologue\n\nMARIA\nThe hills are alive.`);
  assert.equal(script.characters.length, 1);
  assert.equal(script.characters[0].isMe, true);
});

test("ignores character-list only names until dialogue", () => {
  const script = parseScript(`Cast List Play

CHARACTERS
ALICE - curious
BOB - tired

SCENE 1

ALICE
Hello Bob.

BOB
Hi.
`);
  assert.deepEqual(
    script.characters.map((c) => c.name).sort(),
    ["Alice", "Bob"]
  );
});
