# LineLearner research (parity checklist)

Source: LineLearner App Store listing, [linelearner.wordpress.com](https://linelearner.wordpress.com/), play/record/FAQ pages, and actor-app roundups (2026). LearnScript should match the rehearsal value and exceed the setup story.

## What LineLearner does well

1. Record a scene, then listen on a loop until it sticks like a song.
2. Replace your lines with a **gap** sized to the recording.
3. **Prompt** plays your line if you dry.
4. Loop a line, a scene, a shooting day, the whole play, or an **A–B** range.
5. Play modes: my lines; both with line→gap or gap→line; gap only; recap my lines; pause after gap.
6. Extra gap delay; speed 0.5x–8x; stage directions on/off.
7. Multiple characters; mark one as you (gold star); pitch high/low so “them” does not sound like you.
8. Script tree: days, scenes, lines; assign character; move/delete.
9. Optional PDF/Word overlay while recording or playing (reference, not structured parse).
10. Share recordings with cast (`.llz`).

## What LineLearner does not do (our opening)

- It does not automatically turn a PDF/text into spoken character voices.
- Recording every cue is the tax. That is the main thing LearnScript should remove.
- PDF is a viewer, not a structured script importer.

## LearnScript parity map

| LineLearner | MVP | Later |
| --- | --- | --- |
| Record me / them | TTS auto-voice | Optional mic recording |
| Pitch per character | `pitch` + voice URI | Native AVSpeech voices |
| Play my lines | Yes | |
| Gap for my lines | Yes | Duration from TTS estimate, later from recording length |
| Line→gap / gap→line | Yes | |
| Prompt | Yes | |
| Loop scene | Yes | |
| A–B / line numbers | Line number + scene range in MVP; explicit A–B pins later | |
| Speed | Yes (TTS rate) | |
| Extra gap | Yes | |
| Stage directions | Parse + toggle | |
| PDF overlay | Skip overlay at first | Extract text, then optional original-PDF viewer |
| Share script | JSON export later | |
| Sleep timer | No | Phase 6 |
| Bluetooth remote | No | Native phase |

## Learning method we should coach in-app

From LineLearner’s own “how I use it” guide:

1. First passes: **Full scene** or **My lines** with cues.
2. Then **Line → gap** (hear, then say).
3. Then **Gap → line** (say, then check).
4. Then **Cues** only, Prompt if needed.
5. When a section is sticky, shrink the range and loop it.
