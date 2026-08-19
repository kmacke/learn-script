# Product spec — LearnScript

LearnScript is a personal rehearsal partner for plays and musicals. You import a script, claim a role, and run a scene on a loop until the lines are in your body.

## User

An actor (or singer-actor) with an iPhone, a PDF or text script, and a scene to memorize. They may be alone. They want to hear cues, say their lines in the gaps, and drill the sticky bits.

## Core loop

1. **Get a script in** — sample, paste, text file, or PDF.
2. **Confirm the parse** — characters, scenes, numbered lines. Fix mistakes.
3. **Claim a role** — one character is “me.”
4. **Hear the cast** — each other character gets a distinct TTS voice and pitch. Preview and tweak.
5. **Set a range** — start/end scene or line number.
6. **Rehearse** — play modes below, loop until done.
7. **Prompt** — if the gap is silence and the line is gone, tap Prompt.

## Play modes (LineLearner-aligned)

| Mode | What you hear | When to use |
| --- | --- | --- |
| **Full scene** | Every line, including yours | First passes, “learn it like a song” |
| **My lines** | Only your speeches (optional cues off) | Drill your text |
| **Cues** | Other characters; gap for you | Real rehearsal |
| **Line → gap** | Your line, then a gap to repeat | Echo / shadowing |
| **Gap → line** | You try, then hear the line | Test, then check |
| **Cues + recap** | Cues plus your line only (no extra other chatter) | LineLearner “recap my lines” |

Always available:

- Loop the selected range
- Prompt current / last own line
- Playback speed
- Extra gap time
- Skip backward/forward by line
- Stage directions spoken or silent

## Script model

- **Script** — title, source text, optional original PDF bytes
- **Character** — name, color, `isMe`, `voiceURI`, `pitch`, `rate`
- **Scene** — name, optional act, order
- **Line** — sequential number (1…n), scene, character or stage direction, text, optional recording blob

Line numbers are the actor-facing index used for “start at 12, end at 40.”

## Import expectations

The parser should handle common play layouts:

- `CHARACTER` on its own line, dialogue below (standard play)
- `CHARACTER: dialogue` (simple sides)
- `CHARACTER. Dialogue`
- `12. HAMLET: To be…` (numbered sides)
- `ACT I` / `SCENE 2` / `SCENE 2. The balcony`
- `[Enter Romeo]` and other bracket stage directions
- Parentheticals `(sings)`, `(aside)`
- A `CHARACTERS` list at the top

PDF import extracts text, then uses the same parser. Because PDFs are messy, the user always sees a review screen before rehearsal.

## Voice policy

- Default path is **on-device speech synthesis** (Safari / iOS voices).
- Auto-assign: unique voice when possible, otherwise unique pitch.
- “Me” can still have a voice for Full / Line→gap / Gap→line, and is silent in Cues mode.
- Manual recordings may later override TTS per line or per character. Not required for MVP.

## iPhone UX principles

- One-handed rehearsal: huge Play / Prompt targets.
- Readable playbill typography for dialogue; system font for chrome.
- Dark theatre palette, gold for “my lines.”
- Safe-area aware; Home Screen standalone.
- No feature that only works with hover.
- Offline after first load for scripts already stored on device.

## Out of scope for MVP

Sharing `.llz` files with LineLearner, bluetooth clicker, sleep timer, App Store listing, paid neural voices.
