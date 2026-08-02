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

- **The encounter frame-skip.** Reported in round 2 as new. It is not: it is
  present in the round-1 build, and in the first playable build, and went
  unnoticed for three rounds of play. Deferred on evidence, not on hope, so that
  nobody investigates it from scratch a fifth time.

  Ruled out, each with a measurement rather than an argument:

  | Theory | Killed by |
  |---|---|
  | Compositor allocating the blur texture | Warm-up shipped; symptom unchanged |
  | `backdrop-filter` re-blurring per frame | Filter removed; symptom unchanged |
  | First wisp's shader | The chasm is the only encounter that never skips, and it *is* the first wisp |
  | Enemy build cost | 0.3–1.4 ms of JS on frames lasting 30–80 ms |
  | Shader compilation | +1 program on the first beast, then flat. Nothing compiles at the bridge or the boss |
  | Accumulation or a leak | Programs and geometries both flat between encounters |

  What is left, unresolved: it correlates exactly with encounters that open a
  System window, and not at all with what spawns. The Guardian's +78 geometries
  are the only real allocation in the game and it is not where the worst spike
  is. If it is ever picked up again, start from the DOM and the compositor, not
  from the simulation — and measure before mitigating, which is the mistake this
  bug has now caused twice.
