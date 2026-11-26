# Analysis framework — how to learn the creator

Goal: after this, you should be able to predict what the creator would do in a situation they've never been in. Surface stats (average length, cuts per minute) matter less than the *decisions* behind them.

## 0. Inputs

Each file in `creator/transcripts/` looks like this (the fetch script writes it; hand-pasted transcripts should copy the layout):

```markdown
---
id: dQw4w9WgXcQ
title: "The video title"
url: https://www.youtube.com/watch?v=dQw4w9WgXcQ
upload_date: 2026-03-14
duration: "12:31"
duration_seconds: 751
views: 48210
likes: 3100
comments: 412
words: 1960
words_per_minute: 157
subtitles: auto-en      # manual-en, auto-en, pasted …
---
## Description
…
## Chapters
- 00:00 Intro …
## Tags
…
## Transcript
[00:00] first ~30 seconds of speech …
[00:30] …
## Top comments
- (1.2K likes) …
```

Auto-generated subtitles have no punctuation and mishear names. Read for meaning; don't quote mistranscriptions as catchphrases.

## 1. Per-video breakdown → `creator/videos/Vxx_<short-name>.md`

Number videos in upload order (V01 = oldest). Use this template. Fill every section; write "n/a" or "can't tell from transcript" rather than guessing.

```markdown
# V03 — <title>
<url> · <upload date> · <length> · <views> views (<x>× channel median) · subtitles: <type>

## One-line
What this video is, in one sentence the creator might say to a friend.

## The idea
- Idea engine: what question/situation/itch produced this video? ("What happens if I…", "Nobody explains X properly", "I was angry about…", "I got access to…")
- Why now / why them: what gives the creator the right to make this?
- Promise to the viewer: what the viewer is told they'll get, and when they're told.

## Hook (first 30–60 s)
- Verbatim opening lines (first ~3 sentences, cleaned up).
- Hook type(s): cold open on climax / bold claim / question / stakes / in-medias-res / personal confession / visual stunt / other.
- How fast they get to the point (seconds until the premise is clear).
- Open loops planted (what the viewer is made to wait for).

## Beat sheet
| Time | % | Beat | What happens | Purpose (tension, info, payoff, comedy, reset) |
|---|---|---|---|---|
| 00:00 | 0% | Hook | … | … |

## Story crafting
- Protagonist and the creator's role (hero / guide / underdog / narrator / investigator).
- Stakes: what could go wrong or be lost; how they're raised.
- Conflict / obstacles and how they're introduced.
- Turning points and reveals; how reveals are set up.
- Open loops: where opened → where closed.
- Callbacks, running jokes, recurring characters.
- Emotional curve (where it's funny, tense, warm, sad).

## Voice
- Tone in 3 words.
- Sentence style (short punchy / long rambling / mixed), pace (words per minute).
- How they address the viewer ("you guys", direct questions, inside jokes).
- Humour type (self-deprecating, absurd, dry, roast, reaction).
- Signature phrases or verbal habits (only if clearly deliberate or repeated).
- Language(s), slang, swearing level.
- 3–5 short representative quotes with timestamps.

## Visual & edit (from transcript cues, description, user notes, screenshots)
- Format: talking head / vlog / voiceover + b-roll / screen / mixed.
- Cues of editing style (zooms, sound effects, memes, on-screen text, music) — mark as inferred if only guessed from the transcript.

## Packaging
- Title formula (e.g. "I [did extreme thing] for [time]", "Why X is Y", question, number list).
- Thumbnail (if known): subject, expression, text, colours.
- Does the video deliver what the title promises, and when?

## Ending
- How it resolves; last lines verbatim; CTA type and placement; any tease of next video.

## Audience reaction (from comments, if available)
- What viewers quote, praise, joke about or ask for.

## What makes this one work (or not)
- 2–4 hypotheses, tied to views vs median and comments.

## Reusable principles
- Principles (not content) worth carrying into new videos.
```

## 2. Cross-video pattern pass

After all breakdowns exist, compare them side by side. For every attribute, decide:

- **signature** — present in most videos (≥ ~70%), or every video since the creator's style settled.
- **recurring** — in 2+ videos.
- **one-off** — once. Keep it; it may become recurring.
- **evolving** — changed over time. Note the direction; newer videos usually reflect where the creator is heading, weight them higher.

Also look for:
- **The idea engine** — the 1–3 underlying questions that generate almost all their videos. This is the single most important thing to get right.
- **The default beat sheet** — average the beat sheets into their typical shape with % timing.
- **Best vs worst performers** — what the top 20% have in common that the bottom 20% lack. Normalise for video age (older videos have had more time) and note it's a small sample.
- **Anti-patterns** — things they consistently avoid (topics, tones, clickbait styles, sponsors, swearing, faces in thumbnails…). Absences are as defining as habits.
- **Contradictions** — where videos disagree. Don't average them away; record both and the context.

## 3. Write `creator/PROFILE.md`

Rewrite the whole profile (keep the section order of the template). Rules:
- Every bullet carries a confidence tag and evidence: `[signature · V01 V02 V04 V05]`.
- Prefer concrete over abstract: "opens with the worst moment of the story, then rewinds — V02 @00:00, V05 @00:00" beats "uses strong hooks".
- Keep the **Corrections** section untouched except to add to it; it overrides everything else.
- Update the front matter (`status: learned`, video count, date range, last updated).
- Fill **Open questions** with what you couldn't learn from transcripts, so the user can answer.

## 4. Update `creator/catalogue.md`

Add a `V#` column mapping to breakdown files if the script didn't, and a one-line summary per video.

## 5. Report back to the user

Short summary: what the creator's engine is, their default structure, 3 things you're confident about, 3 open questions. Then offer the first batch of ideas.
