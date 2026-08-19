# Testing

## Automated (every session)

From the repo root:

```bash
node --test tests/*.test.mjs
```

These cover:

- Parser: title, acts/scenes, `NAME:` sides, play-format cues, numbered lines, stage directions, character lists
- Rehearsal: line/scene range, each play mode, loop wrapping, prompt target, gap estimates

Add a failing test before fixing parser bugs found in real scripts.

## Manual rehearsal checklist (iPhone width, 390×844)

Use the sample **The Green Room**.

1. Library shows the sample; opening it assigns characters.
2. Cast: set Maya as me; preview Jules and Director; pitches differ.
3. Range: Scene 1 only; then lines 3–8.
4. Full scene: voices change by character; Maya is gold.
5. Cues: Maya is a gap; Prompt speaks Maya’s current line.
6. Line → gap and Gap → line feel timed, not clipped.
7. Loop returns to the start of the range without a stuck utterance.
8. Pause stops audio immediately.
9. Import paste of a tiny custom scene parses and plays.

## Quality judgment (required in STATUS)

After a UI pass, answer in `docs/STATUS.md`:

- Can an actor learn eight lines with this in ten minutes?
- What is the most confusing control?
- What is the worst iPhone layout bug?
- What is the next highest-leverage fix?

## Visual / computer-use

When a browser subagent is available, test at 390×844, no hover. Record notes, not just screenshots.
