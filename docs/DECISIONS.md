# Decisions

Settled in a design interview on 2026-07-29. Recorded because the reasoning is
worth more than the conclusions — if one of these turns out wrong, the note
says what it was trading against.

## Project

**This is the long-lived project.** The two earlier games (`arise/` and
`notmario/`, both pygame, in the `arise` repo) are superseded. That repo gets
tagged `v1-python`, a "superseded by" line in its README, and is archived —
not deleted, not force-pushed. There is no code to migrate: zero shared lines
between a pygame software renderer and a GPU three.js build.

**The next milestone is depth, not breadth.** Level 1 is proven *completable*
by `tools/sim.js` and has never been proven *enjoyable*. Adding levels now
would multiply unvalidated content. Both previous projects stopped at exactly
this point — playable, never played — and that is the failure mode this
ordering exists to avoid.

**Playtesting comes before building.** ARISE is a substantial system resting on
a core loop no human has played. If the slash feels weak or the beast's tell
doesn't read, a bigger system on top won't rescue it. See `PLAYTEST.md`.

**And it stops after round 3.** Settled 2026-08-02, because the two principles
above had quietly started pulling against each other: "depth, not breadth" says
build, "playtesting comes before building" says play, and for three rounds the
second one won. Every round produced real findings, which is exactly why this
needed a rule rather than a judgement — a process that always justifies another
iteration of itself never ends on its own.

The rule: **no further tuning-only round on level 1 until SORGI exists.** Round
3's findings are answered, and the next time level 1 is played it is played with
the shadow in it. The failure this guards against is not the old one. Both
previous projects ended *playable, never played*; this one was in danger of
ending *played, endlessly retuned, never extended*, which is a different route
to the same place.

Two things that are explicitly **not** covered by the rule, so it cannot be used
to wave them away: a bug is not tuning, and a regression found by `tools/sim.js`
is not tuning.

## Naming and positioning

Renamed from SHADOW MONARCH to **SOMBRA**, and the four distinctive borrowed
terms replaced. Reasoning is in the commit for `809c2ec`; briefly: copyright
covers expression rather than mechanics, this repo borrows no assets at all, so
the whole exposure was four names — and there is an actively licensed
commercial game in the same genre using one of them. Renaming pre-publication
is free; renaming after people know the project is not.

Genre vocabulary stays. "hunter", "gate", "D-rank" and "the System" appear
across hundreds of unrelated LitRPG works.

Names are drawn from across the Romance languages, which is the better choice
independent of the legal question — an invented magic system reads as authored
when its vocabulary isn't English.

## ARISE / shadow extraction — specified, not yet built

The signature mechanic of the genre, currently absent. Specified as:

- **One summon at a time.** Not an army. Every readability rule in the combat
  design — no passive contact damage, every threat telegraphed — exists so the
  player always knows what happened to them. Four or five allies in a corridor
  arena destroy that, and they kill things before the player reaches them. One
  ally bounds the damage. Beast raises as melee, wisp as ranged, so *which*
  corpse you take is a real choice.
- **Cost is time and exposure, not mana.** Corpses stay extractable ~4 s;
  extraction is a ~0.8 s channel, immobile, interrupted by a hit. A mana cost
  would be bookkeeping — you would compute which of the bolt or the shadow is
  mathematically better and always pick it. Standing still mid-fight is a
  decision, and it gambles against the telegraph system already in place.
- **Persists until it dies or is replaced**, across encounters and into the
  boss arena. The arena contains no other enemies, therefore no corpses, so
  whatever you walk in with is all you get. That turns the bridge ambush into a
  genuine choice: spend the shadow to survive it, or protect it for the
  Guardian. The tension falls out of the existing level layout for free.
- Command word: **SORGI**.

**Known cost of this design:** it invalidates a verified number. The Guardian is
measured as *mash and dodge both win with about 100 HP left*, taken without an
ally. Carrying a shadow in changes that, so the boss needs re-tuning and
`sim.js` needs a shadow-carrying bot variant.

**Still green-lit after round 2.** The blocking question was whether the
telegraph design reads to a human, and it does: the player learned the beast's
tell, confirmed 0.42 s is enough to react to, and described the tell without
prompting. That is the evidence ARISE was waiting on.

**The automated evidence, retracted and then rebuilt.** The suite used to report
that a bot *ignoring* telegraphs died at the ambush, and that was cited as proof
the tells are load-bearing. The first retraction blamed a navigation deadlock in
the bot, which was true and was not the whole problem. The deeper fault: a bot
with no reaction delay has no use for a wind-up at all. It can answer the active
frames, or kill the beast during its tell — which is what it was observed doing.
A telegraph exists to buy *human* reaction time, so a suite that spends none can
never measure one, and the old pass was measuring nothing.

Both playthrough bots now run at 250 ms of reaction latency, applied to combat
presses and identically to both, and the claim under test is a damage gap rather
than who finishes:

    reads tells    clears 6/8    damage taken  87
    ignores tells  clears 6/8    damage taken 159    reader pays 54%

Jumps are exempt from the latency, and that is measured rather than assumed —
with jumps delayed too, both bots died on all eight seeds having taken 14 damage,
which is a bot walking off a ledge and says nothing about telegraphs. The
standing warning is unchanged: if the pair ever stops separating, the fix is not
to handicap the naive bot.

**The `ranged` baseline.** Kiting was winning most seeds against an explicit
design intent that it should lose. The round-3 bolt nerf (33 → 23 damage, pierce
3 → 1) flipped it to a loss with the Guardian left at 187 HP, without the boss
being touched. That number is recorded, not tuned toward: the Guardian needs
re-tuning once a carried shadow exists, and tuning it twice would make neither
result attributable. At that re-tune, `ranged` becomes a hard gate — kiting must
not win a majority of seeds.

**Known risk:** this is the first thing in the game that can kill without the
player. It is the mechanic most likely to make the combat worse.

### Settled 2026-08-02, before building

**Input: `S` + `K` near a corpse.** No new binding — `down` was already in
`BINDINGS` and read by nothing, so this spends input the game already had.

Plain `K` was the first proposal, and it fails on the game's own rule. Bodies
are harmless, so standing next to one is the *correct* thing to do, and corpses
stay extractable for ~4 s, which means they exist mid-fight. Overloading `K`
would turn the launcher — the move you reach for when a crowd closes — into a
0.8 s root, decided by whether a body happened to be in range. Gating it to
"only when nothing is near" would fix that and gut the design: the cost of
extraction is *supposed* to be that standing still mid-fight is a gamble.

**The corpse announces itself, and the window is the tell.** A violet shard on
the body, shrinking across the ~4 s, so the timer is read without a number and
without HUD. Plus one System line the first time a corpse ever appears. A purely
diegetic tell is what the launcher already had, and it went undiscovered for two
rounds; the style meter went unnoticed for three. Three failures to teach is
enough to stop assuming.

**The shadow's kills give EXP but no style.** You cleared the encounter, so you
level normally and the ally never reads as a punishment. But style is a score
for what *you* did, and style now drives `mpRegenByRank` — so leaning on the
shadow quietly costs rank, and rank is mana. That puts the brake on "it kills
things before the player reaches them" inside the mechanic, as a cost rather
than a nerf, and it needs no new tunable to defend.

**Build order.** Thin vertical slice first — extract, one melee ally that
follows and attacks — and play it. Then the shadow-carrying bot in `sim.js`.
Only then does a single Guardian number move. The bot is small once the mechanic
exists and unwritable before it, but the boss must not be re-tuned by feel: with
one playtester who is also the developer, the suite is the only independent
check there is.

Wisp-as-ranged comes after the melee shadow feels right.

### Built 2026-08-02 — the vertical slice

Spec in `SPEC-SORGI.md`. What building it settled, beyond what that document
already says:

**The ally is the beast's own state machine pointed at a different target.**
`Beast.update` already took its target as a parameter instead of reaching for
the player, so an ally is that same chase-and-pounce loop handed the nearest
enemy — and the hunter to follow when there is none, with the pounce gated off
so it does not leap at the person it is following. That one fact is why the
slice is small. Every number the beast reads now comes from `this.cfg`, which is
what makes the reuse a subclass rather than a copy.

**One slot for the shadow, a separate list for corpses.** Holding a single
reference makes "one summon at a time" a property of the shape rather than a
rule every caller has to remember, and keeping corpses out of `enemies` means no
loop that iterates enemies — player melee, projectiles, the encounter-clear
check, the AI's target search — can see a body without being changed to. The
"does not count toward defeat all enemies" requirement cost zero lines.

**The shadow re-forms beside the hunter when left behind or dropped.** One rule
standing in for a pathfinder. It would otherwise be lost to every pit, every
barrier that closes behind you, and every ledge its ledge-check refuses to walk
off — and a slice meant to answer *does an ally make this combat better* would
have spent its evidence on navigation instead. A shadow arriving out of nowhere
costs the fiction nothing.

**Only beasts leave corpses.** Wisp-as-ranged is not in this slice, and a shard
on a wisp would teach a promise the slice cannot keep. The tell that teaches the
mechanic is the one thing that must not lie.

**The teaching line fires once per page load.** "The first time ever" cannot mean
more than that while nothing survives a reload. Recorded because it looks like a
persistence decision and is not one.

### The suite's seeded stream reaches further than it looks

Building this cost most of a session to a bug that was not in the mechanic, and
the shape of it is worth more than the fix.

The first working build sent the tell-reading bot from 87 damage to 141 and
failed the telegraph gap assertion — while the playthrough bots never touched
extraction, never held `down`, and never saw a corpse. Five theories were wrong
before the measurement was right. What settled it was counting `Math.random()`
draws per frame and diffing the two builds: at the exact frame a beast's body
became a corpse, one build drew 1 and the other drew **33**.

**Three.js takes four `Math.random()` values per object for its UUID**, and
`tools/sim.js` verifies the game against a *seeded* `Math.random`. Building a
shard per corpse — two geometries, two materials, three Object3Ds — spent 32
draws at the instant of every beast's death, which re-rolled every enemy's jitter
after it and sent eight fixed seeds down entirely different playthroughs. The
divergence surfaced as a 3×10⁻⁴ difference in the hunter's `x` and grew from
there. Nothing was wrong with the mechanic.

The fix is the rule the codebase already followed everywhere else and this code
had quietly broken: **allocate nothing during a run.** Shard geometry and
material are module-level, like `boltGeo`; the rigs come from a pool built in
the `Game` constructor, like the particle pool.

**A second, quieter leak, and scoped seeds do not stop it either.** With the
allocation fixed the reading bot's row was exact, and the *naive* row was still
four points off. Cause: the probe ran before the sweeps, and eight thousand
frames of simulation leave state on the game object that `reset()` does not
clear. A scoped seed makes a probe's randomness independent; it does nothing
about what the probe does to the object. The fix is ordering — the probe runs
last, after every row that existed before it. With both fixes every pre-SORGI
row is bit-identical: same damage, same seeds cleared, same draw count, which is
the correct result for a mechanic the bots do not use.

Both leaks were found by the same instrument and it is worth naming: a counter
around `Math.random`, and a per-frame trace of `Game.update` diffed between two
builds to find the first frame that disagrees.

The general form, and the reason this is in the design log rather than a commit
message: **anything the game allocates mid-run is silently part of the suite's
random stream.** Spawning an enemy already does this, harmlessly, because it
happens at the same instant in every build being compared. Anything new does not
get that guarantee. The cheap instrument is a draw counter around `Game.update`,
and it should be the first measurement rather than the sixth — the same lesson
the frame-skip cost, in a different costume.

### The telegraph gap is a coin-flip across top-level seeds

Measured while chasing the above, on the **unmodified** pre-SORGI build:

    seed 20260728   gap  54%   PASS        seed 20260802   gap  89%   FAIL
    seed        1   gap  85%   FAIL        seed  7777777   gap  69%   PASS
    seed    99991   gap 102%   FAIL

The SORGI build produces the same five numbers, being bit-identical on this row.
So the suite is at zero failures on its default seed and fails three of five
elsewhere, and has been for as long as the assertion has existed. Widening the
sweep moves the estimate a long way on a fixed build too — the same build reads
54% at eight seeds and 65% at twenty-four.

This is recorded and **not** acted on. It is a real weakness in the only
independent check the project has, the obvious fixes are all forms of turning a
dial on the instrument, and the standing warning at the top of that assertion —
do not close the gap by making the naive bot worse — applies just as much to
closing it by choosing a kinder sample. It wants a decision of its own, taken
deliberately, not one taken in passing while landing a feature.

## Art direction

The palette **darkens progressively left to right** — pastel at the entrance,
grim at the boss arena. The level is linear, so this is a lerp on `player.x`
over the fog, sky and grass colours. It keeps the stylised-open-world look the
project was briefed on while arriving somewhere that suits the ending, and
gives level 1 a dramatic arc it currently lacks.

## Deferred, deliberately

- **Persistence / meta-progression.** Replay value only matters once the loop is
  good. Nothing currently survives a reload.
- **More enemy types.** Two plus a boss is enough to give the shadow a
  melee/ranged choice and prove the mechanic.
- **Gamepad.** Movement is digital left/right, so a stick offers no fidelity a
  key doesn't — this is comfort, not accuracy. Revisit only if the playtest says
  the hand position is the problem.

- ~~**The encounter frame-skip.**~~ **Resolved 2026-08-02** — see below. Left in
  this section, struck through, because the shape of the search is worth more
  than the answer was.

  | Theory | Killed by |
  |---|---|
  | Compositor allocating the blur texture | Warm-up shipped; symptom unchanged |
  | `backdrop-filter` re-blurring per frame | Filter removed; symptom unchanged |
  | First wisp's shader | The chasm is the only encounter that never skips, and it *is* the first wisp |
  | Enemy build cost | 0.3–1.4 ms of JS on frames lasting 30–80 ms |
  | Shader compilation | +1 program on the first beast, then flat. Nothing compiles at the bridge or the boss |
  | Accumulation or a leak | Programs and geometries both flat between encounters |

  What survived that table was a correlation: every encounter that opens a
  System window skipped, the chasm — the one that opens none — never did, and
  nothing correlated with what spawned. The Guardian's +78 geometries are the
  only real allocation in the game and are not where the worst spike is.

  **The cause was the compositor layer, not the blur.** `.sys-window` carried
  `will-change: opacity, transform` and `transform: translateZ(0)`, which
  promote the element onto its own layer. Over a full-screen WebGL canvas the
  browser then keeps a separate texture and re-composites it every frame the
  window is alive — which is precisely a burst of 32–84 ms frames lasting as
  long as the window does, each carrying 0.8 ms of JavaScript. Those properties
  had been added to accelerate the `backdrop-filter`, so removing the filter and
  leaving them behind removed the cheaper half and kept the expensive one.

  Three builds isolate it, and the middle one is the control:

  | Build | `backdrop-filter` | Own layer | Skip |
  |---|---|---|---|
  | round 1 → round 3 | yes | yes | yes |
  | filter removed | **no** | yes | yes |
  | layer removed too | no | **no** | **none** |

  **The lesson is not "avoid `will-change`".** It is that four theories in a row
  were about work done *once* — allocating a texture, compiling a shader,
  building a model — while the evidence said the cost lasted as long as the
  window was on screen and allocated nothing. The counters that finally settled
  it (`renderer.info.programs`, `.memory.geometries`) are cheap and need no
  frame timing at all; they should have been the first measurement rather than
  the fifth. And the one thing that did get fixed blind — the warm-up — cost two
  rounds by making a wrong theory look addressed.
