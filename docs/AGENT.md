# Agent resume instructions

Read this file first on every new session. Then read `docs/STATUS.md` and `docs/TASKS.md`. Do not restart the product from scratch.

## Mission

Build **LearnScript**, an iPhone-first app for learning lines in a play or musical. Target capability is **LineLearner**, plus automatic character voices from imported PDF/text so the user can rehearse a scene without recording every line by hand.

## Hard rules

- Work only in the **learn-script** repository (`github.com/kmacke/learn-script`).
- Do **not** change the EchoScript repository. Use it only as read-only reference if it becomes available. It was not accessible from the first session.
- Prefer completing the next unfinished task in `docs/TASKS.md` over inventing a new architecture.
- Keep the product usable on an iPhone in Safari (Add to Home Screen PWA). Native Swift/Capacitor wrapping is a later phase.
- Commit, push, and update the PR at each checkpoint.
- If this run is about to run out of credits, stop at a clean checkpoint: tests passing or documented, `docs/STATUS.md` updated, no half-edited core files.

## Session bootstrap (do this in order)

1. `git status` and `git log --oneline -15`.
2. Read `docs/STATUS.md`, `docs/TASKS.md`, `docs/PLAN.md`, `docs/DECISIONS.md`.
3. Skim `docs/TESTING.md` and run `npm test` (or `node --test`).
4. Open the app locally and complete the current task, including a quality pass.
5. Update task checkboxes and `docs/STATUS.md` before you finish.

## Product north star

The user should be able to:

1. Import a script (text or PDF) or open a sample.
2. Pick **their character**.
3. Assign distinct voices/pitches to other characters (automatic, editable).
4. Choose a start and end **scene or line number**.
5. Loop **their lines**, optionally with other characters as cues.
6. Use LineLearner-style modes: hear all → line-then-gap → gap-then-line → cues only with a Prompt button.

## Where the code lives

| Path | What |
| --- | --- |
| `app/` | iPhone-first PWA |
| `app/js/parser.js` | Script text → scenes/lines/characters |
| `app/js/rehearsal.js` | Playlist / modes / looping |
| `app/js/tts.js` | Speech synthesis + iOS workarounds |
| `app/js/pdfImport.js` | PDF text extraction |
| `docs/` | Plan, tasks, status, research |

## Credit-aware stopping

When the session must pause:

1. Finish or revert any in-progress file so `main` feature branch builds.
2. Mark the current task `in progress` or `blocked` in `docs/TASKS.md` with a one-line note.
3. Rewrite `docs/STATUS.md` so the next agent can continue without chat history.
4. Commit and push.
