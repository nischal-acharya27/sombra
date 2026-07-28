# Playtest log

First human hands on this game. Everything about *correctness* is measured by
`tools/sim.js`; nothing about *feel* is. This file is the evidence the next
round of tuning comes from.

**How to use it:** play the gate 3–4 times and write as you go, not afterwards.
Rough notes beat tidy ones, and a note that contradicts an earlier note is more
useful than a polished summary — it usually means the answer is "it depends",
which is itself the finding. Tag lines `[feel]`, `[bug]` or `[balance]`.

```bash
cd /Users/nischal/Desktop/Vault/03_Projects/Games/sombra && python3 -m http.server 8000
```

Then <http://localhost:8000>. `Esc` pauses, `R` restarts from the pause screen.

> Played on: `809c2ec` (SOMBRA rename) · keyboard · no ARISE mechanic yet.

---

## Run log

One line per attempt. Time, how far you got, what killed you.

| # | Reached | Died to | Time | Note |
|---|---------|---------|------|------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |

---

## The questions that block the next block of work

### 1. Does the slash have weight?

*Three swings: two fast, then a heavier finisher. Hit-stop is 50/55/115 ms.
The finisher does 31 damage against 13 and 15, lunges further, and shakes the
camera three times as hard.*

- Does a hit feel like contact, or like the enemy just loses numbers?
- Is the hit-stop noticeable at all? Too much?
- Is the third swing obviously different from the first two, or does the chain
  read as three of the same thing?

>

### 2. Does the beast's pounce read?

*This decides whether the whole telegraph design works. The beast stops, crouches,
its eyes flare and grow, and it growls — 0.42 s — then leaps. Bodies are harmless;
the leap is the only thing that can hurt you.*

- Did you learn the tell, or did you just get hit and eventually adapt?
- Is 0.42 s enough to react, or do you need the windup to be longer?
- Did you ever realise the bodies are safe to stand next to?

>

### 3. Is the launcher → air combo discoverable?

*`K` on the ground launches an enemy upward. It is jump-cancellable, so the
intended line is: launch, `Space` to chase, then `J` `J` in the air. Nothing in
the game tells you this.*

- Did you find it on your own? If so, when — and what prompted it?
- If you didn't, did you use `K` at all, or ignore it?

>

### 4. How many attempts to clear the Guardian?

*Target is second or third. The scripted bots say mashing wins with 72 of 134 HP
left, dodging with 83 — so it should be beatable badly and comfortable when read.*

- Attempts to first clear:
- Which of its four attacks (charge, slam, sweep, volley) did you learn to read?
- Which one never read?
- Did you notice the second phase when the core turns red?

>

### 5. Is the chasm tense or trivial?

*Gaps are 3.8 units against a 6.08-unit running jump — about a third in reserve,
plus a double jump. Deliberately forgiving, possibly too forgiving.*

- Did you ever feel at risk of missing a jump?
- Did you fall? If so, was it the jump or something knocking you off?

>

### 6. Is the bridge ambush fair?

*Six enemies over seven seconds. This is the fight the scripted bot only barely
survives, and the tuning was set against that bot rather than a person.*

- Overwhelming, or the best fight in the level?
- Did the wisps feel like a threat, or noise?

>

### 7. Did you notice the style meter?

*Top right. Rewards variety; repeating a move scores a fraction, and taking a hit
costs you over half the meter.*

- Did you see it during play, or only when you stopped to look?
- Did it ever change what you did?

>

---

## Anything lost

*Any moment the camera lost you, or you lost track of where the floor was, or
you didn't know what killed you. These are usually bugs rather than taste.*

>

## Where were you bored?

*The most valuable question in the document, and the easiest to skip. Name the
seconds you wanted to skip past.*

>

## Everything else

*Anything that struck you — especially things that felt wrong that you can't
articulate. Write it badly rather than not at all.*

>
