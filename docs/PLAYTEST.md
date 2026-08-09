# Playtest log

First human hands on this game. Everything about *correctness* is measured by
`tools/sim.js`; nothing about *feel* is. This file is the evidence the next
round of tuning comes from.

**How to use it:** play the gate 3–4 times and write as you go, not afterwards.
Rough notes beat tidy ones, and a note that contradicts an earlier note is more
useful than a polished summary — it usually means the answer is "it depends",
which is itself the finding. Tag lines `[feel]`, `[bug]` or `[balance]`.

```bash
python3 tools/serve.py
```

Then <http://localhost:8000>. `Esc` pauses, `R` restarts from the pause screen.

**Not `python3 -m http.server`,** which is what this line used to say.
It sends no `Cache-Control`, the browser keeps your ES modules, and the way that
fails here is that you play the *old* build and write notes about the new one —
round 3 § "Start the server with the new script" records a round-2 verdict that
happened to. Also play in a real browser window rather than an embedded one:
embedded browsers throttle `requestAnimationFrame`, which is enough on its own
to make the game feel wrong.

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
| 1 | Taps swallowed unless you paused between them | Mash `J` as fast as you like — the chain runs 1→2→3 with nothing dropped | Yes |
| 2 | Forward motion died when you attacked mid-jump | Jump forward, press `J` — you keep travelling | No |
| 3 | `R` on the pause screen did nothing visible | `Esc` then `R` restarts the gate immediately | Now that I think about it, I guess it was working already. Pressing 'R' on pause screen kind of jumped the screen a little before, and stayed on the Pause screen, so I thought it was not working. Now it's the same. But probably the problem was that pressing 'R' restarted the game, but the 'PAUSED' screen was (and is) still displayed.|
| 4 | Launch → air combo impossible; enemy landed first | `K` to launch, `Space` to chase, `J` `J` connects |The time is too short. Launches the enemy, but then Space jumps too high, and doesn't land. Maybe K-SPACE-J woule be better instead of 'J' 'J' |
| 5 | Finisher felt no wider than the first two swings | Third swing visibly sweeps a wide wedge and reaches further | It is still similar. What I wanted was a design change, rather than a 'reach' change.|
| 6 | Style meter unnoticed | You see `S / SOVEREIGN` flash top-right without looking for it | No. |
| 7 | Wisps killed you four times in seven runs | Still dangerous, no longer the main cause of death | Now they are too easy. The previous difficulty was good enough.|

## B. Did anything get worse?

*Toning the slam down was your call, but the slam was also part of how you beat
the Guardian. The dodge bot went from finishing with 83 HP to 49. This is the
change I am least confident in.*

- Is jump-`K` still useful, or did it get gutted?
- **Boss attempts this time** (was 4–5):
- Did the boss feel worse, or just different?

>
- It's still useful.
- I am not sure if I am just used to playing the game now, but the boss felt a little easier than all other attempts before. Cleared it in the first attempt.

## C. The question round 1 left blank

*This is the one that matters most, because every enemy in the game and the whole
ARISE design assume telegraphs are readable. The beast stops, crouches, its eyes
flare and grow, it growls — 0.42 s — then leaps. Its body is harmless; only the
leap can hurt you.*

- Did you learn the tell, or did you just get hit until you adapted?
- Is 0.42 s long enough to react to?
- Did you ever realise you can stand right next to a beast safely?

>
- I noticed it. 
- Yes.
- Realised it only after I read this question.

## D. Anything new

*Round 1's "anything lost" and "where were you bored" were left blank or "not
bored" — worth a second look now that the controls respond differently.*

>
- Still not bored. 
- MAJOR COMMENT: Now, before the enemies appear, the screen seems to pause, like there's a little lag or something before the next frame. This bug was not present before.

---
---

# Round 3 — build `e1ea490`

Rounds 1 and 2 above stay untouched.

**Start the server with the new script.** This matters more than it sounds:

```bash
cd /Users/nischal/Desktop/Vault/03_Projects/Games/sombra && python3 tools/serve.py
```

`python3 -m http.server` sends no `Cache-Control`, so the browser decides for
itself how long to keep your ES modules and CSS — and it keeps them. At least
one round-2 verdict was measured against code that had already been fixed:
item 3 was reported as still broken, and the fix is verifiably working on a
fresh build. `tools/serve.py` is the same server with caching switched off.

If anything below looks unchanged, hard-reload once (`Cmd-Shift-R`) before
writing "no" — and then do write "no", because two of round 2's "no"s were
completely correct and found real bugs.

## A. The two that were genuinely broken

*Round 2 said no to both of these and was right both times. The round-1 fixes
had addressed a symptom next to the cause.*

| # | What was actually wrong | What should be true now | Verdict |
|---|---|---|---|
| 1 | Air attacks ignored the direction key outright — holding forward and letting go produced identical trajectories. `vx` had been fixed; nobody had checked whether the game was still *listening*. | Jump forward, press `J`, and keep holding forward — you keep driving. Let go mid-swing and you visibly coast instead. Steering works during a swing, at 75% of normal air control. | It's okay now. |
| 2 | A launched enemy's upward speed was **assigned** by the next hit rather than floored, so the aerial that was meant to extend a juggle was the hit that ended it — the enemy peaked 1.4 units up while you sailed to 6.6. | `K` → `Space` → a single `J` connects, and the enemy stays up. There is a 0.40 s window to press `J`, not an instant. A second `J` extends it further but is not required. | The enemy is launched too high. An average of the first implementation and the current one would be just right. |

## B. The finisher, again

*You asked for a design change rather than a reach change. The wedge was already
there in round 2 at a quarter opacity, which over a lit sky is very nearly
nothing — so "still similar" was a fair reading of something that was, visually,
barely present.*

The third swing is now **amber** where the first two are white-blue, it strikes
**twice** — a second sweep crosses the first — and it is the only sword hit in
the game that puts a ring on the ground.

- Does the third swing read as a *different move* now, or still as a bigger one?
- Two shakes a beat apart instead of one big one: heavier, or just messier?

>
- It's all good for now. 

## C. The style meter, for the third time

*Round 1 didn't notice it. Round 2 didn't notice it after the letter grew by a
third and gained a flash. Making the thing in the corner louder was the wrong
answer twice, so it now comes to you: a rank-up prints the rank across the
middle of the screen, once, and then gets out of the way.*

- Did you see it without looking for it this time?
- Is it in the way?

> 
- Yeah, it's good. The meter on the top right of the screen is still not thaaat visible.
But it's there if I look for it.

## D. The stutter — the one I could not reproduce

*This is the most important thing in this round, because I have a theory and no
evidence. Measured in-session: no new shaders compiled on spawn, 1.7 ms to build
a beast, 0.5 ms for the System window's DOM. None of that is a visible pause.
The measuring instrument was the problem — the preview I test in throttles the
frame clock, so frame timing there is meaningless.*

**Leading theory:** the "THREAT DETECTED" window is the only element in the game
using `backdrop-filter`, and it opens at exactly the moment you describe. The
first one forces the compositor to allocate a blur texture, which is a known
hitch on some GPUs. There is now a warm-up at boot that pays that cost during
the title screen.

**Please run this one in a real browser window, not embedded:**

```bash
python3 tools/serve.py
```

then <http://localhost:8000/?perf>. A panel appears bottom-left listing every
frame over 28 ms and what the game was doing just before it.

- Is the stutter still there at all?
- If it is: paste or describe the spike lines from the panel. The "why" column
  is the answer — if it says `sys-window`, the theory was right; if it says
  `spawn`, it is the enemy build; if it says `—`, it is neither and I have been
  looking in the wrong place entirely.

>
- It's not a stutter. More like a frame-skip. It doesn't appear now when the first shadow beasts appear.
But the problem arises after defeating them, and before the ambush of the shadow beasts and the wisps.

## E. Wisps, back to round-1 difficulty

*You said round 2 made them too easy and the previous difficulty was fine. Shot
interval and damage are back to round-1 values (2.5 s, 11 damage). The longer
wind-up is the one thing I kept — 0.66 s against round 1's 0.55 — because the
round-1 deaths were falls caused by knockback with no warning, and the wind-up
is what addressed that specifically without making them weaker.*

- Back to the right threat level, or did the longer wind-up defang them anyway?

>
- I think go back to the first round threat level, makes it a little more challenging. 

## F. Free-form

*Especially: anything that got worse. And the beast hint — a System window now
tells you outright that bodies are harmless, the first time you meet one. Round
2 said you only worked that out from reading the question.*

- Did the hint land before you needed it, or after you'd already been hit?
- Anything else.

>
- The system window tells about it, but it's too much text, for a short period of time.
And the beasts appear right away, so reading the texts while fighting them is not very feasible.

The magic power (shooting) should be nerfed a bit. Now, it hits all the enemies on the way. 
It should only hurt one opponent on the way, not everyone on the path of the power. And it deals a lot of damage. 
Maybe reduce the power to ~70% of what it is now.

---

# Spot-check — build `bed0f8b`, 2026-08-03

Not a round. One clear of gate 1, played to answer one question that
`tools/sim.js` is structurally unable to answer.

`88ff685` narrowed five of gate 1's nine gaps from 4.0 to 3.8, by moving each
take-off lip 0.2 to the right, because at 4.0 they sat at 23% jump reserve
against the 25% the touch budget asks for. The suite proved the gate was still
clearable on all five recorded seeds and could say nothing at all about whether
the traversal still *read* the way four rounds of tuning had left it.

> Cleared the gate. Runs smoothly. No observed change.

That is the result the change needed. All five moved gaps were crossed and none
of them announced itself, so the correction was a budget fix rather than a
retune — which is the distinction that decides whether gate 1 is still usable as
the control the next nine gates are compared against.

**What this is not.** One clear by the developer, who knew what had changed and
where to look. It rules out a regression obvious enough to notice; it does not
establish that the gate feels identical, and nobody should quote it as though it
did.

---

# Spot-check — build `757a6aa`, 2026-08-05

Not a round; a data point for #13, "Play the crossing on a phone — the
checkpoint." One clear on keyboard confirmed, one attempt on a real handset
reported difficult specifically at the Ferryman.

> The boss is very difficult to beat on the phone as it is because of the
> controls. It works on the laptop.

**[balance]** The Ferryman's numbers and the crossing's layout are unchanged
since #10 and are verified clearable by `tools/sim.js` — but the suite drives
`Input` directly, at a fixed 250 ms reaction latency, never through
`src/ui/touch.js`. It cannot see what a thumb actually experiences punishing
the charge's recovery window, and this is the first report that the gap is
real rather than theoretical.

**Not yet diagnosed**, deliberately — this entry only records that the gap
exists. Candidates for the next pass, none confirmed: the punish window
during the Ferryman's `recover` state may be too tight to hit with a thumb
moving between the movement pad and an attack button, where a keyboard hand
already rests on both; or the double-charge's signature move may need more
margin on touch than the single-charge tell gate 1's suite measures against.

**What this is not.** Confirmation that the Ferryman itself is overtuned —
the same fight clears on keyboard. It is evidence that constraint 3 of the
touch budget ("never a direction plus two buttons at once") — the one
constraint `docs/SPEC-CAMPAIGN.md` says only a phone playtest can check — is
where this project's first real touch-vs-keyboard gap has shown up, right on
schedule, in the fight the checkpoint exists to protect against shipping
unplayed.

---

# Spot-check — build `61a773b`, 2026-08-07

A second phone attempt, after issue #17 turned the steer pad into a stick and
SORGI back into a `down`+`heavy` chord (`DECISIONS.md` § "The steer control
becomes a stick"), and after `/diagnosing-bugs` on the spot-check above found
no mechanical timing problem in the Ferryman's punish or evasion windows —
both tolerate far more switch/reaction delay than real touch input plausibly
costs, and a full scripted evade-evade-punish sequence at 250 ms
reaction / 200 ms switch cleared with zero damage taken. That diagnosis is
still standing: nothing below contradicts it.

> Played and the game runs well.

Clean, unprompted clear — no repeat of the previous round's "very difficult"
Ferryman report. Consistent with the diagnosis: the timing windows were never
the bottleneck, and the geometry that changed since (buttons 13–24% bigger,
SORGI's dedicated target gone) is the more likely thing that moved.

**Two concrete asks for the next round, neither yet built:**

1. **Buttons should be bigger still.** Enlarged once already in #17 into the
   space SORGI's retired button freed; this round says that wasn't enough.
2. **The steer should read as a joystick, not a rounded rectangle with
   `◀`/`▶` glyphs.** The mechanic became stick-like in #17 (a `down` press
   alongside left/right) but the shape stayed the one-axis slide pad's own —
   text arrows on a slab. The ask is for it to *look* like the thing it now
   behaves like: circular.

**What this is not.** A report that anything is broken — the crossing cleared
clean. It is sizing and shape polish on a control scheme that already works,
filed for the next implementation pass rather than acted on here.

---

# Spot-check — build `b49a808`, 2026-08-09

A third phone attempt, after the round-2 backlog's five tickets (arrow pad,
UP-enters-arch, SLASH/JUMP swap, DASH split onto its own control, System
windows cut to gate-clear only) all landed. **The campaign was completed —
first reported full clear on a phone.**

**Two concrete asks for the next round, neither yet built:**

1. **The arrow pad buttons are not symmetric.** The four-way pad
   (`TOUCH_LAYOUT.pad.targets` in `touch.js`) reads as uneven on a real
   handset; the ask is to make the four targets symmetric, and to enlarge
   them — specifically to the size of the AAGO button (`TOUCH_LAYOUT.buttons`,
   the `magic` entry, currently `w: 1.38, h: 1.44`), up from the pad's own
   `PAD_SIZE = 1.0`.
2. **The action-button cluster should be symmetric under DASH.** JUMP,
   SLASH, RISE and AAGO currently sit on the diagonal sweep `Where each
   control sits` describes (nearest-to-furthest by how often a hand reaches
   for the verb); the ask is for that cluster to read as a symmetric block
   centred below the DASH bar instead.

**What this is not.** A report that anything is broken — the campaign
cleared end to end on a phone for the first time. It is sizing and layout
polish on a control scheme that already works, filed for the next
implementation pass rather than acted on here. Filed as `DECISIONS.md` §
Backlog: playtest round 3 and issues #28, #29.

