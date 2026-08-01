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
| 1 | The wisps part| Falling while trying to kill those things | |Perfect difficulty I would say. |
| 2 | The wisps? thing after the shadow beasts| Falling while trying to kill those things | |Perfect difficulty I would say. |
| 3 | After the part of shadow beasts| Fell while using dash (shift key) | | |
| 4 | The boss| The boss | | Perfect difficulty I would say. |
| 5 | The wisps again| Fell jumping trying to kill them | | Maybe decrease the difficulty against these things a tiny little bit for the first level. |
| 5 | The wisps again after the shadow beasts| Fell trying to escape their shooting | Finally noted.. takes ~26 seconds to get there, and ~29 second to die. | Maybe decrease the difficulty against these things a tiny little bit for the first level. |
| 5 | Boss | - | 1m28s |  |

 
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
- The hit feels like contact, and the enemy loses numbers.

- The keyboard strokes are not registered if they are tapped very quickly in succession. There needs to be a litttlle delay between the key-strokes if it is pressed 2 or 3 times.

- The 3rd strike is different, the 3rd strike always produces this different kind of style that feels a little heavier, yes.
That being said, the impact area, or the area the swing covers doesn't seem to be broader than the first two strikes. I feel like it should look the shape of something like a piece of pizza. Right now, it's more like a part of concentric circles, like a 1/4th part of a donut, for examples.




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
- I didn't find it on my own. But I attempted after reading this, and the time/distance is too short for launching the air-combo. 'K' launches the enemy in the air, but by the time that I jump to hit 'J' 'J', the enemy is already down on the ground.

- I used 'K' after discovering it, and it eased the game/killing the enemies a lot, you just jump, and press 'K', whcich pushes the enemies away, and also deals damage at the same time.

### 4. How many attempts to clear the Guardian?

*Target is second or third. The scripted bots say mashing wins with 72 of 134 HP
left, dodging with 83 — so it should be beatable badly and comfortable when read.*

- Attempts to first clear:
- Which of its four attacks (charge, slam, sweep, volley) did you learn to read?
- Which one never read?
- Did you notice the second phase when the core turns red?

>
- It took quitea a few attempts to clear the boss... maybe 4 or 5? When I cleared it. 
I used a lot of 'magic' ('L') in the last round when I cleared it. 
- I am not sure if I saw 'volley' from the boss... The boss used some kind of a magic/shooting techniques too in one of the attempts, so that is something that I noticed as well. The other attacks were not that difficult to read.
- 
- I did notice the second phase when the core turns red.

### 5. Is the chasm tense or trivial?

*Gaps are 3.8 units against a 6.08-unit running jump — about a third in reserve,
plus a double jump. Deliberately forgiving, possibly too forgiving.*

- Did you ever feel at risk of missing a jump?
- Did you fall? If so, was it the jump or something knocking you off?

>
- Jumps and distances are fine. 
- Yes, I fell. But it was usually during the fight with those things that shoot at you.

### 6. Is the bridge ambush fair?

*Six enemies over seven seconds. This is the fight the scripted bot only barely
survives, and the tuning was set against that bot rather than a person.*

- Overwhelming, or the best fight in the level?
- Did the wisps feel like a threat, or noise?

> 
- I would say it was a bit overwhelming until I learned to jump and press 'K'. The wisps are a real threat.

### 7. Did you notice the style meter?

*Top right. Rewards variety; repeating a move scores a fraction, and taking a hit
costs you over half the meter.*

- Did you see it during play, or only when you stopped to look?
- Did it ever change what you did?

> 
- I think I didn't notice it until I read this question. 
- I don't think it changed what I did after I saw it though.

---

## Anything lost

*Any moment the camera lost you, or you lost track of where the floor was, or
you didn't know what killed you. These are usually bugs rather than taste.*

> 


## Where were you bored?

*The most valuable question in the document, and the easiest to skip. Name the
seconds you wanted to skip past.*

> Not bored at all.

## Everything else

*Anything that struck you — especially things that felt wrong that you can't
articulate. Write it badly rather than not at all.*

>
- Hitting 'R' when paused with Esc doesn't restart the gate.
- if you jump and go forawrd, and attack, the motion stops. I would like the motion to continue even when you're attacking.

---
---

# Round 2 — build `cb10a5d`

Round 1 above stays untouched. It is the evidence every change in `cb10a5d` was
made from, and the baseline this round is measured against — if one of those
changes turns out to be wrong, that log is how we find out.

This round is deliberately short. It asks three things: **did the fixes land**,
**did anything get worse**, and the one question round 1 left blank.

Restart the server from the renamed folder first:

```bash
cd /Users/nischal/Desktop/Vault/03_Projects/Games/sombra && python3 -m http.server 8000
```

## A. Did the fixes land?

Tick or strike each one. A "no" here is more useful than a polite "yes".

| # | What was broken | What should be true now | Verdict |
|---|---|---|---|
| 1 | Taps swallowed unless you paused between them | Mash `J` as fast as you like — the chain runs 1→2→3 with nothing dropped | |
| 2 | Forward motion died when you attacked mid-jump | Jump forward, press `J` — you keep travelling | |
| 3 | `R` on the pause screen did nothing visible | `Esc` then `R` restarts the gate immediately | |
| 4 | Launch → air combo impossible; enemy landed first | `K` to launch, `Space` to chase, `J` `J` connects | |
| 5 | Finisher felt no wider than the first two swings | Third swing visibly sweeps a wide wedge and reaches further | |
| 6 | Style meter unnoticed | You see `S / SOVEREIGN` flash top-right without looking for it | |
| 7 | Wisps killed you four times in seven runs | Still dangerous, no longer the main cause of death | |

## B. Did anything get worse?

*Toning the slam down was your call, but the slam was also part of how you beat
the Guardian. The dodge bot went from finishing with 83 HP to 49. This is the
change I am least confident in.*

- Is jump-`K` still useful, or did it get gutted?
- **Boss attempts this time** (was 4–5):
- Did the boss feel worse, or just different?

>

## C. The question round 1 left blank

*This is the one that matters most, because every enemy in the game and the whole
ARISE design assume telegraphs are readable. The beast stops, crouches, its eyes
flare and grow, it growls — 0.42 s — then leaps. Its body is harmless; only the
leap can hurt you.*

- Did you learn the tell, or did you just get hit until you adapted?
- Is 0.42 s long enough to react to?
- Did you ever realise you can stand right next to a beast safely?

>

## D. Anything new

*Round 1's "anything lost" and "where were you bored" were left blank or "not
bored" — worth a second look now that the controls respond differently.*

>
