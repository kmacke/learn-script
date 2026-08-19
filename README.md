# LearnScript

An iPhone-first app for learning lines in a play or musical. Import a script, claim your role, hear the rest of the cast in distinct voices, and loop a scene until the words stick.

This repository is the home for the product. Do not change EchoScript; it is reference-only.

## Use it on your iPhone

The app is a Safari web app (PWA), not an App Store build yet. That is deliberate: it can run on your phone this week, without Xcode.

1. Serve the `app/` folder over HTTP, or open the GitHub Pages URL once Pages is enabled for this repo.
2. In **Safari**, tap Share → **Add to Home Screen**.
3. Open **LearnScript**, load a sample, pick your character, tap **Rehearse**.

Local server from this repo:

```bash
npm start
# → http://localhost:4173
```

On a phone on the same Wi-Fi, use your computer’s LAN IP instead of localhost. Speech will not start until you tap Play (an iOS rule).

Details: [`docs/IPHONE.md`](docs/IPHONE.md)

## What works now

- Sample scripts (original scene + Romeo & Juliet balcony excerpt)
- Paste / `.txt` import and PDF text extraction
- Character picker, auto voices and pitch, preview
- Start/end by **scene** or **line number**
- Play modes: full scene, my lines, cues (gaps for you), line→gap, gap→line
- Loop, extra gap, speed, Prompt button
- Scripts stored on the phone (IndexedDB)

## Docs for continuing the work

If a coding agent is picking this up after credits reset, start here:

1. [`docs/AGENT.md`](docs/AGENT.md) — resume protocol
2. [`docs/STATUS.md`](docs/STATUS.md) — where we left off
3. [`docs/TASKS.md`](docs/TASKS.md) — next incomplete task
4. [`docs/PLAN.md`](docs/PLAN.md) — phases and north star

## Tests

```bash
npm test
```

## Target

Match [LineLearner](https://linelearner.wordpress.com/) as a rehearsal partner, and beat it on setup: no need to record every line by hand before you can run a scene.
