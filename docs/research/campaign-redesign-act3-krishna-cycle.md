# Campaign redesign — Act 3: Krishna-cycle

Resolved via `/grilling` for wayfinder ticket #46 (child of map #38). This is
the Krishna-cycle act's section of the campaign redesign spec that will
eventually replace `docs/SPEC-CAMPAIGN.md` in place, once Act 4 (#47) is
drafted alongside it — per the map's own sequencing, this file is a drafted
asset, not yet folded into the live spec document.

Villain content (silhouette, tier, kit shape, palette, phase-transition flag,
respectful-treatment note) is already fixed in each villain's
`docs/research/villain-roster.md` entry and is not restated here except
where a design decision below depends on it. This document covers only what
that research left open: level shape, regular-enemy roster, dialogue-beat
structure, and difficulty/pacing — following the same four-heading shape
Act 1's and Act 2's documents (`campaign-redesign-act1-mahabharata.md`,
`campaign-redesign-act2-ramayana.md`) used.

## Act shape

Gates 09-12. Order — Kamsa, Putana, Narakasura, Hiranyakashipu (boss, closes
the act) — is locked by issue #40 and not reopened here.

Where Act 1 was the campaign's purely human register and Act 2 introduced
boon-monsters and multi-headed silhouettes, Act 3 has its own throughline
that neither prior act shares: **every one of its four defeats belongs to a
specific avatar, not a generic hero.** Putana dies to an infant Krishna
recognizing her through the disguise; Kamsa dies to the same child grown to
a youth, at the exact wrestling match the prophecy against him was always
going to produce; Narakasura dies to Krishna and Satyabhama together,
restoring what he stole; Hiranyakashipu dies to Narasimha, the only defeat
on the entire roster built entirely out of a boon's literal wording. Ravana
and Mahishasura's own entries each name this same "the hunter is not the
one the source says did this" tension individually — Act 3 is where it
stops being an occasional footnote and becomes the act's own identity.
Nothing here tries to resolve that tension with an invented in-fiction
excuse (no "the hunter is secretly an avatar" reveal — nothing in SOMBRA's
fiction earns that, the same refusal Ravana's own entry names). It stays
named and unresolved at the villain level, exactly as each entry already
requires, and gets its sharpest, most literal expression in Hiranyakashipu's
gate closing the act.

Three decisions, resolved this session, shape everything below:

- **Act 3 spends one new regular-enemy archetype, not zero and not two.**
  Act 1 spent none of the roster's ~8-new-behavior budget (reskins only).
  Act 2 spent one (the Lanka war-footing soldier, extending `Kawach`'s
  skeleton). Act 3 spends a second: a Mathura akhada wrestler — grappler,
  not armoured — giving Kamsa's court its own silhouette rather than
  reusing Lanka's soldier or any existing reskin, and giving literal
  mechanical form to the detail the source foregrounds (Kamsa staged a
  public wrestling tournament and set his own champions, traditionally
  Chanura and Mushtika, against the boy before ever reaching the throne
  himself). Built the same "new rig, existing behavior" way the Lanka
  soldier was: new geometry in `models.js`, the behavior class extends
  `Charger`'s chase-and-commit skeleton directly rather than inventing a
  new state machine, reskinned so the charge resolves into a telegraphed
  grapple-rush-and-throw instead of continued momentum. That leaves
  roughly 6 of the ~8-budget archetypes for Act 4's three gates (#47), which
  is worth flagging forward rather than deciding here — Vritra's serpent
  coils and Trishiras's three functionally distinct heads are exactly the
  kind of genuinely new silhouette the budget was reserved for.
- **Combination encounters are used where they fit, not re-earned.** Act 2
  already opened combination fights at Shurpanakha's gate and they stay
  open for the rest of the campaign — Act 3 doesn't need its own "first
  combination" beat. This act uses that freedom unevenly on purpose:
  Kamsa's gate stays single-archetype because the wrestler needs its solo
  debut before it can ever be combined with anything (`docs/SPEC-CAMPAIGN.md`
  Testing Decisions' `solo debut` check); Putana's gate stays at zero
  regular encounters for a different reason (below); Narakasura's and
  Hiranyakashipu's gates both use combination encounters freely, since nothing
  about those two settings needs to protect a debut.
- **Hiranyakashipu's phase-transition dialogue is resolved in HP-fraction
  terms, and kept separate from his finishing beat.** His own handoff already
  settled the fight's mechanics — the `threshold` boon-vulnerability window
  cycles from the start of the fight rather than sitting behind an HP gate,
  so it can't double as a reliable dialogue trigger without colliding with
  the one `threshold` window that matters most: the one his death necessarily
  lands in. This session gives him exactly one mid-fight dialogue beat
  instead, firing at his ordinary `enrageAt: 0.5` threshold — the same
  50%-HP fraction every other boss and Warden in the codebase already uses
  (`src/game/config.js`), reusing the no-rig-swap tier-3 phase-transition
  precedent Duryodhana (Act 1) and Ravana (Act 2) both already set: a boss
  can fire `_fireBeats`'s `phase-transition` beat with nothing changing on
  the rig, dialogue only. This is a boastful line about the boon holding,
  not the finishing beat. The finishing beat — the hunter's rig swapping to
  the scripted Narasimha overlay — rides the existing `_die`/`_dieAnimate`
  collapse window instead, which every boss on the roster already plays on
  death; it needs no HP-fraction decision of its own because death is
  inherently "at zero," and the "neither day nor night, neither indoors nor
  out" liminal imagery from the boon's wording is carried by staging (the
  boon-summoned pillar/doorway prop, twilight lighting) rather than by any
  additional trigger logic layered on top. This is the concrete answer to
  the open flag both #42 and Hiranyakashipu's own handoff entry left for
  this ticket.

## The four gates

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 09 | Kamsa | Warden | Mathura's royal akhada, the wrestling tournament, *Bhagavata Purana* Bk. 10 | Moderate — tiered spectator stands descending into the pit, flat at the fight | new: Mathura wrestler (solo debut) | 2 |
| 10 | Putana | Warden | A sleeping household in Gokul, at night | Flat, minimal, deliberately intimate — no traversal challenge | none | 1 |
| 11 | Narakasura | Warden | Pragjyotishapura's fortress and captive-cells | Escalating — barred corridors and ramparts into his audience hall | `Kawach` → fortress guard **+** `Raakchyas` → rakshasa garrison (combined) | 2 |
| 12 | Hiranyakashipu | Boss | The Daitya palace's pillared galleries into the boon-hall | Most eventful of the act — rising multi-tier approach through pillar-lined galleries | `Kawach` → palace guard, then `Kawach` **+** `Raakchyas` → court zealots (combined) | 3 |

**09 — Kamsa.** The gate stages the tournament itself: a descent through
tiered spectator stands (the `#41` prototype's `thickness`-field stacked
ledges, reskinned as stone stands rather than a canopy or a lake) down into
the packed-earth pit, flattening completely once the fight starts, matching
the flat-arena convention every existing Warden/boss fight already follows.
One regular encounter — the new Mathura-wrestler archetype, met alone before
it is ever combined with anything, satisfying the `solo debut` check for
free at the gate its own setting exists to justify. The pick is also this
gate's deliberate contrast move, the same one every act so far has made:
Kamsa's own kit is heavy, armoured and committal (an overhead shackle-iron
mace smash, a mid-range chain lash), so the regular enemy ahead of him is
fast and grappling rather than iron-bound, and the fight grammar doesn't
repeat itself twice in one gate.

**10 — Putana.** Zero regular encounters, a deliberate first for the
campaign — every other gate before this one has staged at least one. The
source stays close to a single household at night; her own handoff already
sets her disguise-form silhouette at essentially hunter scale ("nothing in
the source or either reference suggests she reads as unusual before the
reveal") and her setting is domestic, not military or courtly the way every
other gate in this act is. Padding the approach with a reskinned mob would
read as generic threat-density for its own sake, working against the exact
intimacy her handoff's respectful-treatment note asks the design to protect
rather than for it. This also gives Act 3 a real pacing dip between two
crowded gates (Kamsa's tournament, Narakasura's garrisoned fortress) —
the same kind of contrast Kaikeyi's no-combat gate gave Act 2, but here
still a real fight, just the smallest-footprint one in the act.

**11 — Narakasura.** The approach escalates through barred corridors and
open ramparts — visually continuous with Kamsa's prison-iron motif from two
gates back, but staged at fortress scale rather than court-regalia scale,
since Narakasura's own handoff already differentiates his armor as "carved
from the earth he commands" rather than Kamsa's cold shackle-iron. One
combination encounter — `Kawach` reskinned as Pragjyotishapura fortress
guard alongside `Raakchyas` reskinned as rakshasa garrison muscle — reusing
two archetypes that already debuted solo in Acts 1 and 2, so nothing here
needs its own `solo debut` protection. This is also the first gate in the
act to use a combination encounter, landing here rather than at Kamsa's or
Putana's gate for the reasons named above. The approach gives way to his own
audience hall, flat per the campaign's unbroken boss/Warden-arena
convention, before Narakasura himself.

**12 — Hiranyakashipu.** The act's boss gate and its most eventful — a
rising, multi-tier approach through the Daitya palace's pillared galleries,
foreshadowing the boon-summoned pillar prop his own fight stages around
before the space opens into the boon-hall itself, flat per the same
arena convention every locked boss's fight already follows. Two regular
encounters before Hiranyakashipu, mirroring the two-encounter build Act 1
gave Duryodhana and Act 2 gave Ravana: first, `Kawach` reskinned as Daitya
palace guard, met alone; second, that same reskin combined with `Raakchyas`
reskinned as court zealots compelled to his worship — a formation reading
as an enforced cult rather than a disciplined army, distinct from
Narakasura's own guard-and-garrison pairing one gate back despite reusing
the same two base archetypes, differentiated by setting and grouping rather
than by inventing a third reskin this act doesn't need.

## Dialogue-beat structure

Reuses the same mechanisms Acts 1 and 2 established, plus the phase-transition
hook. Kamsa's, Putana's and Narakasura's phase-transition/enrage calls are
already fully specified in their own `villain-roster.md` entries; this
section transcribes rather than re-decides them, the same way Act 2's did
for its four combat villains. Hiranyakashipu's is not pre-specified —
resolving it is this section's own contribution, per the Act shape decision
above.

- **Pre-fight** — every Warden/boss encounter's existing `intro` window
  carries the `quote` field Act 1 introduced, alongside the mechanical tell
  `note`. All four of this act's villains use it.
- **Post-fight** — the existing gate `cleared` beat, unchanged mechanism,
  for all four. Narakasura's `cleared` text should land on the liberation
  itself — the captives freed, the earrings restored — and stop there,
  per his own respectful-treatment note's explicit recommendation to omit
  the epilogue (the freed captives married to Krishna) that pop adaptations
  frequently mishandle. Hiranyakashipu's `cleared` beat still fires after his
  scripted death-collapse plays out, unchanged mechanism, same as every
  other boss gate — the Narasimha content lives inside the pre-existing
  `_die`/`_dieAnimate` window, not in place of `cleared`.
- **Mid-fight phase-transition** —
  - **Kamsa** — carries no dialogue-beat hook at all, by his own handoff's
    explicit decision: he keeps the ordinary generic, non-authored enrage
    warning every tier-2 Warden without an authored line already uses
    (`ENRAGE_BIG`/`ENRAGE_BODY`-style System text), the same as Shakuni and
    Bakasura in Act 1. His entry is direct about why — no version of a line
    about the infanticide backstory avoids staging it as spectacle, and
    manufacturing one here would undo the restraint the armor and weapon
    already carry silently.
  - **Putana** — the fourth consumer of the `_fireBeats` phase-transition
    mechanism (after Taraka, Shurpanakha and Kumbhakarna in Act 2), and the
    second two-rig visible-flag swap after Shurpanakha's. Disguise form
    swaps to true form on an HP threshold, inside a held, player-advanced
    dialogue beat, narrated toward release per her own handoff's guidance —
    the poison finally leaving her, not a monster put down, the strongest
    ready-made fit for SORGI's escort framing anywhere on the roster.
  - **Narakasura** — carries the ordinary `enrageAt`/`enrageSpeedMul`/
    `enrageWindupMul` payload (tighter spear thrusts, faster ground-slams)
    plus an authored line his own entry commits to, unlike Kamsa's: his
    resolution is the roster's strongest fit for the campaign's own
    release-focused ending, and the beat foreshadows the coming liberation
    directly rather than staying a villainy recap.
  - **Hiranyakashipu** — fires a paged, player-advanced dialogue beat at his
    `enrageAt: 0.5` threshold, no rig swap, per the Act-shape decision above.
    This is the fourth locked Boss/Warden-with-no-rig-swap to use the
    mechanism this way (after Duryodhana, Ravana, and now himself),
    confirming again it was never tier-locked. Separately, the scripted
    Narasimha finishing beat rides the death-collapse window and is not part
    of `_fireBeats` at all.

Illustrative lines (draft tone/length, not final `strings.js` copy, matching
Act 1's and Act 2's "readable at a glance" ceiling):

| Gate | Beat | Line |
|---|---|---|
| 09 Kamsa | pre-fight quote | "A voice told me my death has a name. I have never stopped listening for it." |
| 09 Kamsa | phase-transition | (none — no version of this line avoids staging the infanticide as spectacle, per his own handoff) |
| 10 Putana | pre-fight quote | "You look like you could use a mother's welcome." |
| 10 Putana | phase-transition | "It burns worse leaving than it ever did going in." |
| 11 Narakasura | pre-fight quote | "Sixteen thousand voices, and every one of them mine to keep." |
| 11 Narakasura | phase-transition | "The walls are already cracking. You've just come to watch them fall." |
| 12 Hiranyakashipu | pre-fight quote | "Not man. Not beast. Not day. Not night. Say the words that could kill me — you don't have them." |
| 12 Hiranyakashipu | phase-transition | "Blood is not a weapon. Whatever you are, you have found no weapon yet." |
| 12 Hiranyakashipu | Narasimha finishing beat | (no line — reverent and scripted, left for a future gate-content session to write, per his own handoff's explicit deferral and Mahishasura's matching precedent) |

## Difficulty/pacing

Technical floors stay campaign-wide constant, unchanged from Acts 1 and 2 —
the same gap-width reserve and telegraph-window minimums
`docs/SPEC-CAMPAIGN.md`'s Testing Decisions already froze. Every new move in
this act (the wrestler's grapple-rush-and-throw, Putana's poisoned embrace
and breath cloud, Narakasura's spear thrust and ground-slam hazard, and
Hiranyakashipu's recurring `threshold` vulnerability window) is authored
against the existing touch budget: no required chord, jump margins at or
above the measured reserve, never a direction plus two buttons at once. None
of them need a new input to read or answer — the `threshold` window in
particular is a change in *when* Hiranyakashipu can be hit, not a new
button the hunter needs to press to exploit it.

Encounter count across the act runs 2, 1, 2, 3 — a deliberate dip at
Putana's gate between two more crowded ones rather than a flat escalation,
the same kind of contrast beat Kaikeyi's no-combat gate gave Act 2, restated
here as a real fight rather than a non-combat one. Traversal density rises
gate over gate within the act (moderate tiered stands → flat and minimal →
escalating fortress → the act's own peak at the palace galleries), matching
the shape both prior acts used, without the "hold level with the prior act"
constraint Act 2 imposed on itself — that constraint was scoped to Act 2 only
and does not carry forward, so Act 3's peak at Hiranyakashipu's gate is free
to sit above Ravana's without needing to justify doing so here; where Act 4
sets its own ceiling toward Mahishasura's campaign-closing gate is that
act's own call (#47).

Two items in this act are natural candidates for `docs/SPEC-CAMPAIGN.md`
Testing Decisions' tier-3 designated sample when the harness is extended to
15 gates — "three new archetypes and four boss tunings are what this spec
names as most likely to go wrong" already names exactly this act's own
highest-risk content: the Mathura wrestler (a genuinely new archetype) and
Hiranyakashipu (a new boss tuning, and the one boss whose damage window is
gated by state rather than by cooldown alone). Flagged here as a
recommendation for whoever selects the sample, not decided in this document.

## What this act rules in for Act 4 onward

The new-behavior budget sits at 2 of ~8 spent after this act (the Lanka
soldier, the Mathura wrestler), leaving roughly 6 for Act 4's three gates —
worth naming since Vritra's and Trishiras's silhouettes are exactly the kind
of genuinely new shape (serpent, three functionally distinct heads) the
budget exists for, though how much of it they actually spend is #47's own
call, not pre-decided here. Combination encounters, the tier-0 no-combat
category, and the "new rig, existing behavior" tier pattern all remain
standing options exactly as Act 2 already left them — this act didn't
change any of the three, only used the first and third again. The one
constraint this act itself does *not* pass forward is Act 2's "hold
traversal level with the prior act" rule — that was Act-2-scoped from the
start, and this act's own peak is free-standing, not a new ceiling Act 4 is
bound by either.
