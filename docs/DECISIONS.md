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
currently measured as *mash wins with 72 HP left*, taken without an ally.
Carrying a shadow in changes that, so the boss needs re-tuning and `sim.js`
needs a shadow-carrying bot variant.

**Known risk:** this is the first thing in the game that can kill without the
player. It is the mechanic most likely to make the combat worse.

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
