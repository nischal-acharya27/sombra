# Campaign redesign — Act 1: Mahabharata

Resolved via `/grilling` for wayfinder ticket #44 (child of map #38). This is
the Mahabharata act's section of the campaign redesign spec that will
eventually replace `docs/SPEC-CAMPAIGN.md` in place, once Acts 2-4 (#45-#47)
are drafted alongside it — per the map's own sequencing, this file is a
drafted asset, not yet folded into the live spec document.

Villain content (silhouette, tier, kit shape, palette, phase-transition flag,
respectful-treatment note) is already fixed in each villain's
`docs/research/villain-roster.md` entry and is not restated here except where
a design decision below depends on it. This document covers only what that
research left open: level shape, regular-enemy roster, dialogue-beat
structure, and difficulty/pacing.

## Act shape

Gates 01-03. Order — Shakuni, Bakasura, Duryodhana (boss, closes the act) —
is locked by issue #40 and not reopened here.

The Mahabharata act is the campaign's one *human* register: no boon, no
monstrous form, no reveal/transform among its three villains — Duryodhana's
own handoff calls him "the most human-scale mortal rival... contrasting
directly against the boon-monsters around him," and that reads as true of
Shakuni and Bakasura as well (a courtier's cunning, a rakshasa's brute
hunger, a king's pride — nothing supernatural in the cast). Every decision
below follows from treating that as the act's identity, not a gap to fill:
this is the campaign's political/mortal register, and Act 2 onward is where
boons and monstrous forms enter.

**Act 1 is the campaign's first act but not its onboarding.** The training
hall already teaches the seven verbs and PUKAR before any gate is reached;
re-easing gate 1 would re-teach what is already taught. Genre convention
(Mario, Zelda, Mega Man, character-action games generally) still eases a
game's first *real* content after an input tutorial, but the lever it pulls
is encounter density and combination, not the technical floor. So:

- **Technical floors are unchanged from the rest of the campaign** — the same
  gap-width reserve and telegraph-window minimums `docs/SPEC-CAMPAIGN.md`'s
  Testing Decisions already froze, campaign-wide, not eased per act.
- **Every encounter in all three gates is single-archetype.** No two enemy
  types ever share a lock. Combination encounters (the old campaign's
  `the-queue`-style multi-spawn fights) start in Act 2. This is Act 1's
  pacing lever, and it is also a direct consequence of the "reskins only, no
  new archetype" call below — teaching a *combination* of archetypes that are
  all reskins the player has already met is a worse lesson than teaching one
  reskin cleanly.
- **No brand-new regular-enemy archetype.** All regular enemies in this act
  are reskins of the four existing classes (`Raakchyas` grunt, `Charger`,
  `Kawach` armoured, `BhootBatti`/`Tantrik` ranged-summon). This saves the
  roster's ~8-new-behavior budget for acts where a genuinely new silhouette
  (rakshasa, serpent, multi-headed) earns its cost more clearly than a
  soldier or village thug would, and it reinforces the "human, not
  monstrous" identity above in the enemy roster, not just the three named
  villains.

## The three gates

| # | Villain | Role | Setting | Level shape | Regular enemy (reskin) | Encounters |
|---|---|---|---|---|---|---|
| 01 | Shakuni | Warden | Royal dice hall, Sabha Parva | Mostly flat — a courtly approach; verticality would obscure the die's telegraph | `Kawach` → court guards | 2 |
| 02 | Bakasura | Warden | Road/forest to Ekachakra, Adi Parva | Moderate — a few stacked-ledge rises during the walk, flat at the fight itself | `Raakchyas` → lesser village-rakshasa | 2 |
| 03 | Duryodhana | Boss | Kurukshetra battlefield + the lake, Shalya Parva | Most eventful of the three — a descent toward the lake he hides in, per the source text, before being goaded out onto a flat duel arena | `Charger` → charging cavalry, then `Kawach` → infantry line | 3 |

**01 — Shakuni.** The gate is a courtier's approach to a dice hall, not a
dungeon: wide, legible, low-relief terrain, because Shakuni's kit
(summoned-die windup → telegraphed zone) needs clear sightlines to read
honestly, and the one thing this whole act's research flagged as hardest to
build ("the hardest entry on the list to build a boss fight for honestly")
is exactly what stacked geometry would undermine. One regular encounter —
`Kawach` reskinned as court guards, met alone, teaching the armoured
plant-and-commit tell in a setting where armed guards are diegetically
expected — then Shakuni himself. The guard reskin is also the act's one
deliberate contrast move: Shakuni's own kit is ranged and patient, so the
regular enemy ahead of him is close-range and committal, and the fight
grammar doesn't repeat itself twice in one gate.

**02 — Bakasura.** The walk to Ekachakra gets Act 1's only real traversal
texture — a couple of stacked-ledge rises (the `#41` prototype's
`thickness`-field mechanic, not a new primitive), reading as a forest road
rather than a courtyard. The arena flattens out before the fight, because
Bakasura's grab-slam/lunge kit needs open room the way his research entry
already specifies. One regular encounter — `Raakchyas` reskinned as a
lesser village-rakshasa, met alone — fitting a folk-tale demon story where
the village itself is under low-grade, ongoing threat before its named
terror arrives.

**03 — Duryodhana.** The act's boss gate, and its most eventful: a
descent toward a lake — the source text has him hiding there before being
goaded out — giving the level shape a concrete narrative beat rather than
verticality for its own sake, before the ground flattens into the duel
arena, matching the flat-arena convention every existing boss fight already
follows (`boss.js`: "the boss's body is harmless, every source of damage is
an action it commits to"). Two regular encounters, sequential and
single-archetype per the act's own rule — `Charger` reskinned as charging
cavalry first (an open battlefield is exactly the lane a charge needs, and
Charger's existing "punishes standing still" identity reads directly as
cavalry), then `Kawach` reskinned as the infantry line — before Duryodhana
himself. The two-encounter build gives this gate the same extra beat the old
campaign's boss gates had, without breaking the no-combination rule: tension
escalates through two different single-archetype fights, not through
crowding.

## Dialogue-beat structure

Reuses two mechanisms that already exist rather than adding new ones, plus
the one new hook #42 already decided on:

- **Pre-fight** — every Warden/boss encounter's existing `intro` window
  (today: a System title card naming the enemy, e.g. `GATE2_KEVAT_NOTE`)
  gains a new `quote` field carrying the villain's own line, delivered
  alongside the existing mechanical tell `note` — tier-2 Wardens still need
  the tell taught in the same window, so `quote` adds a line rather than
  replacing one. Fires on encounter trigger; no new engine surface.
- **Post-fight** — the existing gate `cleared` beat, unchanged mechanism and
  unchanged voice (the System, as in every gate today, e.g.
  `GATE2_BEAT_CLEARED_BODY`).
- **Mid-fight phase-transition** — new, per #42's decision: `phases`
  generalizes a boss's single `enrageAt` into an ordered list checked in
  `Boss.takeHit`, which is tier-3-only machinery. Shakuni and Bakasura (tier
  2, plain `Enemy` subclasses) keep the existing generic, non-authored
  enrage warning (`ENRAGE_BIG`/`ENRAGE_BODY`-style System text) — no villain
  line, no new hook exercised. **Duryodhana gets exactly one authored
  phase-transition line at his enrage threshold** — dialogue only, no rig or
  pose swap, since his "no phase-transition" flag in the villain-roster
  entry is about the visual reveal, not about speech. This resolves the
  ticket's open question: his boss fight does not stay silently
  enrage-only; his own handoff already named the enrage crossing "the
  natural hook for a line about the dice game or his own grievance," and
  that is exactly what lands here.

Illustrative lines (draft tone/length, not final `strings.js` copy — each
under the "readable at a glance" ceiling user story 5 sets):

| Gate | Beat | Line |
|---|---|---|
| 01 Shakuni | pre-fight quote | "Sit down. Let's play." |
| 02 Bakasura | pre-fight quote | "One cart was never enough." |
| 03 Duryodhana | pre-fight quote | "I hid because the war was already lost. I do not hide from you." |
| 03 Duryodhana | phase-transition | "I was the eldest son. No dice were needed to take what should have been given." |

The last line is the one place this act spends its "nuance" budget from
Duryodhana's respectful-treatment note: it states his grievance (primogeniture,
the Pandavas' favor) in his own voice at the moment he's cornered, rather than
collapsing him into a generic "evil prince" the way a bare enrage-stat bump
would.

## What this act rules in for Act 2 onward

Two constraints above are deliberately scoped to Act 1, not the campaign:
single-archetype-only encounters and the reskins-only enemy budget. Act 2
(Ramayana) is free to introduce combination encounters and the first
genuinely new enemy behaviors — the roster's boon-monsters and multi-headed
silhouettes start there, and this act's flat "human, not monstrous" register
is what that contrast is measured against.
