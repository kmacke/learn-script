# LearnScript plan

## Why this exists

The user wants an iPhone app as capable as **LineLearner** for memorizing play/musical lines. An earlier EchoScript attempt did not get far and must be left untouched. This repository is the home for the plan, the product, and the code.

LineLearner’s strength is looped audio rehearsal with gaps for your lines and a Prompt button. Its weakness is setup: you usually record every line by hand, and PDF import is mostly a visual overlay. LearnScript should match the rehearsal loop and **beat LineLearner on setup** by turning an imported script into distinct character voices automatically.

## Constraints of this environment

- Cloud agent runs on Linux. Xcode, the iOS Simulator, and App Store signing are not available.
- The user needs something that works well **on an iPhone now**.
- Work must be resumable from repo documents when credits run out.

Therefore the plan is:

1. Ship an iPhone-first **Progressive Web App** that can be added to the Home Screen from Safari.
2. Use on-device speech synthesis for automatic character voices (no paid TTS required).
3. Keep a path to a native iOS app later (Capacitor or SwiftUI) once the rehearsal engine is proven.
4. Treat `docs/STATUS.md` + `docs/TASKS.md` + the code as the only memory between sessions.

## Phases

### Phase 0 — Plan and product definition (this session, first checkpoint)

Document LineLearner parity, architecture, tasks, and resume protocol.

### Phase 1 — Rehearsal engine MVP (this session)

A working iPhone-sized web app that can:

- Load sample scripts
- Parse plain-text plays
- Pick “my character”
- Auto-assign voices and pitches
- Choose start/end scene or line
- Loop rehearsal in the core play modes
- Prompt the current line

Quality bar: an actor can memorize a short scene using only the phone’s browser.

### Phase 2 — Import that is good enough for real scripts

- Paste / `.txt` / `.md` / Fountain-ish files
- PDF text extraction with a review screen
- Character merge, line edits, scene fixes
- Numbered-line and musical parenthetical handling

### Phase 3 — LineLearner parity in the player

- Line / scene / A–B loop
- Extra gap time, speed control, pause-after-gap
- Stage directions on/off
- Mark problem lines
- Recap-my-lines-only
- Optional manual recording to replace TTS for a character

### Phase 4 — iPhone polish and install

- PWA icons, offline cache of scripts, safe areas, large tap targets
- Standalone display, no Safari chrome surprises
- GitHub Pages (or similar) so the phone can open a URL
- First-run coaching: import → pick role → rehearse

### Phase 5 — Native iOS (later, needs a Mac)

- Capacitor wrapper **or** SwiftUI app sharing the same data model
- `AVSpeechSynthesizer` for more reliable voices
- Microphone recording, background audio, optional App Store

### Phase 6 — Nice-to-haves (after the above is solid)

- Share a script with cast members
- Sleep timer
- Musical: song vs spoken, optional backing-track later
- Cloud backup

## Delivery strategy for each session

1. Pick the next incomplete task from `docs/TASKS.md`.
2. Implement the smallest slice that an actor can feel on an iPhone.
3. Write or update automated tests for parser/rehearsal logic.
4. Exercise the UI (browser and/or computer-use at iPhone width).
5. Judge: is this actually usable for memorizing lines? Fix the worst problems.
6. Update docs, commit, push, update the PR.
7. If credits are low, stop after step 6 rather than starting a new phase.

## Success criteria (product)

A user with an iPhone can:

- Open LearnScript in Safari and add it to the Home Screen.
- Import a text script (and later a PDF) of a scene they are in.
- Hear other characters in different voices/pitches without recording.
- Loop lines 12–40 or Scene 2 until the words stick.
- Hide their own audio and still get a Prompt if they go up.

## Non-goals for early phases

- Do not build a social network, teleprompter-first product, or video self-tape studio.
- Do not spend the first sessions on App Store metadata or Swift scaffolding that cannot run here.
- Do not require paid cloud TTS for the default path.
