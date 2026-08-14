# Campaign redesign — Act 2: Ramayana

Resolved via `/grilling` for wayfinder ticket #45 (child of map #38). This is
the Ramayana act's section of the campaign redesign spec that will eventually
replace `docs/SPEC-CAMPAIGN.md` in place, once Acts 3-4 (#46-#47) are drafted
alongside it — per the map's own sequencing, this file is a drafted asset,
not yet folded into the live spec document.

Villain content (silhouette, tier, kit shape, palette, phase-transition flag,
respectful-treatment note) is already fixed in each villain's
`docs/research/villain-roster.md` entry and is not restated here except where
a design decision below depends on it. This document covers only what that
research left open: level shape, regular-enemy roster, dialogue-beat
structure, and difficulty/pacing — following the same four-heading shape
Act 1's document (`campaign-redesign-act1-mahabharata.md`) used.

## Act shape

Gates 04-08. Order — Taraka, Kaikeyi, Shurpanakha, Kumbhakarna, Ravana (boss,
closes the act) — is locked by issue #40 and not reopened here.

Where Act 1 was the campaign's one purely human register, Act 2 is where the
roster's boon-monsters and multi-headed silhouette enter: Taraka (a curse,
not a birth, per her own entry), Shurpanakha (a rakshasi shapeshifter),
Kumbhakarna (a boon gone wrong, deliberately built past every locked boss's
scale), and Ravana (a boon, compressed ten heads, the campaign's first
tier-3 fight since Duryodhana) all carry a supernatural register Act 1's
three villains never did. Kaikeyi is the one exception inside the act, and
deliberately so — she stays fully human and fully non-combat (tier 0, the
first use of that category), which is exactly why her gate sits second
rather than being grouped with the act's other four: a human, no-combat
beat between two forest fights keeps the "boon-monster" identity from
reading as this act's only mode.

Three decisions, resolved this session, shape everything below:

- **One genuinely new regular-enemy archetype, not a reskin.** Act 1 spent
  none of the roster's ~8-new-behavior budget (reskins only, campaign-wide
  technical floors held constant). Act 2 spends one: a Lanka war-footing
  rakshasa-soldier — spear/polearm, formation-fighting — giving Lanka's
  disciplined-army register a silhouette none of the four existing reskins
  (`Raakchyas`, `Charger`, `Kawach`, `BhootBatti`/`Tantrik`) can honestly
  supply. Built the same way the villain tiers already distinguish "new rig,
  existing behavior" from a pure reskin: new geometry in `models.js`, but
  the behavior class extends `Kawach`'s plant → telegraph → commit skeleton
  directly rather than inventing a new state machine, reskinned into a reach
  thrust instead of a shield bash. This is the first time a *regular* enemy
  (not a Warden) uses that tier pattern — worth naming as a small precedent,
  not just an implementation detail, since #46/#47 may want the same move
  for their own new archetypes rather than always building fully bespoke
  behavior. Taraka's and Shurpanakha's forest gates stay reskin-only; the
  new archetype is Lanka-specific, appearing only at Kumbhakarna's and
  Ravana's gates (below).
- **Combination encounters ease in mid-act, not at gate 1.** Act 1 held
  every encounter single-archetype, campaign-wide. Act 2 is where that
  constraint lifts, but not from its first gate: Taraka (tier 2, a Warden
  whose own kit is already fast and committal) and Kaikeyi (tier 0, no
  combat at all) both stay single-archetype/no-combat, and the first
  combination encounter of the campaign lands at Shurpanakha's gate — the
  act's third — building through Kumbhakarna to Ravana. This also satisfies
  `docs/SPEC-CAMPAIGN.md`'s existing `solo debut` rule (Testing Decisions,
  tier 1) for the new Lanka archetype above without extra design work: it
  meets the hunter alone at Kumbhakarna's gate before it's ever combined
  with anything, which naturally falls after the combination threshold has
  already opened at Shurpanakha's gate.
- **Traversal density holds level with Act 1, not escalates on top of
  combination.** The act's difficulty step comes from encounter combination
  alone — the newly-opened lever — rather than stacking denser
  stacked-ledge/gap geometry underneath it too. Individual gates still
  escalate within the act the way Act 1's three gates did (flat → moderate
  → most-eventful), but the act's ceiling stays at Act 1's own peak
  (Duryodhana's lake-descent), not past it. `#41`'s validated traversal
  shape (stacked ledges via the `thickness` field, a top-tier gap, a long
  multi-tier drop) is reused rather than extended with a new primitive.

## The five gates

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 04 | Taraka | Warden | Tataka-vana, the curse-forest, *Bala Kanda* | Moderate — canopy-level stacked rises through haunted forest, flat at the fight | `BhootBatti` → forest wisps | 1 |
| 05 | Kaikeyi | Tier 0, no-combat | An antechamber toward the queen's own room, Ayodhya, *Ayodhya Kanda* | Flat, staged four-beat fork sequence — not a traversal challenge | none | 0 (no-fail beat sequence) |
| 06 | Shurpanakha | Warden | Panchavati, *Aranya Kanda* | Moderate, matching gate 04's register — same forest, different clearing | `Raakchyas` → forest rakshasa **+** `Tantrik` → jungle summoner-priest (first combination encounter) | 1 (combined) |
| 07 | Kumbhakarna | Warden | Lanka's outer ramparts into his own sleeping-hall | Escalating — barracks/ramparts approach, flattens into his chamber for the fight | new: Lanka soldier (solo debut) | 2 (soldier alone, then Kumbhakarna) |
| 08 | Ravana | Boss | Lanka's war-torn battlements into the throne room | Most eventful of the act — capped at, not past, Duryodhana's own peak | new: Lanka soldier **+** `Kawach` → royal guard (combined), then Ravana | 3 |

**04 — Taraka.** The forest that bears her name gets Act 2's one real
traversal texture, mirroring Bakasura's gate in Act 1 (`#41`'s stacked-ledge
rises, not a new primitive) but re-skinned as canopy rather than a road —
climbing through curse-touched growth rather than walking toward a village.
One regular encounter, met alone: `BhootBatti` reskinned as forest wisps,
haunting the canopy she terrorizes. This is a deliberate contrast the same
way Act 1's Shakuni gate used one — Taraka's own kit is fast, committal,
ground-based melee (`Charger`-extended lunge), so the enemy ahead of her is
slow, floating, and ranged, and the fight grammar doesn't repeat itself
before she arrives.

**05 — Kaikeyi.** Nothing to design here beyond staging — her handoff
(`docs/research/villain-roster.md`) already specifies the gate in full:
tier 0, no `Enemy`/`Boss` ancestry, a linear four-beat sequence each staged
as a two-path fork (a low/jump split or a left/right split), resolved by
whichever trigger volume the hunter crosses first, no-fail, no wrong
answer. She stands at one fixed point past the far end of the arena for the
whole gate. The one open implementation flag her own entry raised —
`_fireBeats` needs a new `at: 'choice-made'` trigger type, since it
currently only knows `enter`/`cleared`/`phase-transition` — carries forward
into this act's build unresolved, the same way `#41` left the `edge()`
headroom gap for `#40`'s gates to inherit rather than fixing it inline.

**06 — Shurpanakha.** Same forest register as Taraka's gate (Panchavati
rather than Tataka-vana, but visually continuous — the act doesn't reset
its palette between two back-to-back forest gates), at the same moderate
traversal density. The campaign's first combination encounter lands here:
`Raakchyas` reskinned as a Panchavati forest-rakshasa alongside `Tantrik`
reskinned as a jungle summoner-priest. The pairing is not arbitrary —
`Tantrik`'s own design (`src/game/enemies.js`) already does no damage
itself and exists specifically to be deprioritized at the player's peril
("ignoring it and fighting what it raises instead is the losing play by
construction"); pairing it with a melee grunt for the first-ever
combination fight teaches target-prioritization with the one archetype in
the existing roster built to punish getting it wrong, rather than inventing
a new mechanic to teach the same lesson. Shurpanakha's own kit (illusion
decoy pre-reveal, claw swipe post-reveal) follows as a second, separate
encounter.

**07 — Kumbhakarna.** The approach through Lanka's outer ramparts and
barracks is where the new Lanka-soldier archetype gets its solo debut,
alone, per the `solo debut` rule — before it is ever combined with
anything at gate 08. Geometrically this is the act's first Lanka-register
setting: fewer stacked-ledge rises than the two forest gates, more open
barracks floor, foreshadowing the flat court/battlements of gate 08. The
ramparts give way to Kumbhakarna's own sleeping-hall, which flattens
entirely for the fight — his club-swing/tackle kit needs the open room his
own entry specifies, the same "flatten before the named fight" move every
gate in both acts so far has made.

**08 — Ravana.** The act's boss gate, and its most eventful — battlements
under active siege, into the throne room — but capped at Duryodhana's own
peak rather than exceeding it, per the traversal-holds-level call above.
Two regular encounters before Ravana himself, mirroring the two-encounter
build Act 1 gave Duryodhana: first, the new Lanka-soldier archetype now
combined with `Kawach` reskinned as Lanka royal guard (a formation of
spear-and-shield, reading as a disciplined defensive line rather than the
ramparts' looser soldier patrol); second, the throne room itself, flat per
the campaign's unbroken boss-arena convention, where Ravana's four-weapon
rotation needs open ground the same way every locked boss's arena already
provides.

## Dialogue-beat structure

Reuses the same two existing mechanisms Act 1 established, plus the
phase-transition hook — all four of this act's combat villains already have
their phase-transition beat *fully specified* in `villain-roster.md`; this
section transcribes rather than designs it, the same way Act 1's did for
Duryodhana.

- **Pre-fight** — every Warden/boss encounter's existing `intro` window
  gains the `quote` field Act 1 introduced, carrying the villain's own line
  alongside the mechanical tell `note`. Kaikeyi does not use this window at
  all — she has no `Enemy`/`Boss` ancestry to trigger an encounter `intro`
  from, and her first beat (the boon owed) opens her four-beat sequence
  instead.
- **Post-fight** — the existing gate `cleared` beat, unchanged, for Taraka,
  Shurpanakha, Kumbhakarna and Ravana. Kaikeyi has no combat clear to fire
  one from; her gate's exit trigger fires once beat four (her regret) has
  played, narrated as the hunter walking on rather than a beat that
  announces a fight is over, because none was fought.
- **Mid-fight phase-transition** — all four combat villains in this act
  carry the flag, already authored in their own handoff entries:
  - **Taraka** — the roster's first consumer of the mechanism. A held,
    player-advanced story-window beat: a writhe/contort animation and a
    pained, anguished sound cue (not a generic monster growl) as the
    beautiful-form rig swaps to the monstrous one on an HP threshold. Kit,
    hitbox and telegraphs are identical before and after; only rig, palette
    and speed-tell tighten.
  - **Shurpanakha** — the second consumer. The illusion-decoy attack swaps
    to the bare-claw swipe at the same HP-threshold beat, staged as a
    scripted, held reveal rather than an instant model swap — and per her
    respectful-treatment note, narrated in SORGI's escort framing (an
    unjudged soul the stopped Wheel is holding, not a monster unmasked)
    rather than as a victory the hunter is delivering.
  - **Kumbhakarna** — the third consumer. Groggy, heavy-lidded, duller-skin
    open state snaps to fully awake — eyes wide, faster wind-ups, a speed
    pickup — at the threshold, staging the source's own beat: he counsels
    peace, is refused, and fights anyway out of loyalty to Ravana. This is
    where his respectful-treatment note (loyal, decent, trapped by kinship
    into a war he argued against) gets its mechanical home, the same way
    Duryodhana's did in Act 1.
  - **Ravana** — despite carrying **no rig-swap** (no curse/disguise premise
    to dramatize, the same "none" call Duryodhana landed on in Act 1), he
    still fires a paged, player-advanced dialogue beat at his enrage
    threshold — the first time a locked *Boss* rather than a Warden
    consumes the mechanism, confirming it was never actually tier-locked.
    The payload is two-fold: the compressed head-arc intensifies (baseline
    3 visible heads becoming 5), and the beat is where his
    respectful-treatment note's harder half lands — a line where he
    registers, dying to someone he wrote off as beneath his notice, left
    unresolved rather than mechanically explained away.

**Kaikeyi's four beats** are not a phase-transition (no HP threshold exists
for a fight that isn't one) but a chronological sequence tied to her own
*Ayodhya Kanda* arc, already named in her handoff: (1) the boon owed, framed
as a legitimate transaction rather than a scheme; (2) Manthara's
manipulation, naming that the malice was supplied to her, not by her; (3)
the invocation and its cost — Bharata crowned, Rama exiled, Dasharatha dead
of grief; (4) her regret, arrived at on her own timeline rather than
produced by anything the hunter does. Which fork the hunter takes at each
beat shapes tone (more anger, more grief, which memory she dwells on) but
never whether beat four is reached — the "witnessing, not winning" design
her own entry is built around. Exact per-fork line variants are copy work
for whoever authors her `strings.js` entries, not this document; the four
beat topics above are fixed.

Illustrative lines (draft tone/length, not final `strings.js` copy, matching
Act 1's own "readable at a glance" ceiling):

| Gate | Beat | Line |
|---|---|---|
| 04 Taraka | pre-fight quote | "You wear a face I used to have." |
| 04 Taraka | phase-transition | (no line — the writhe/contort beat and pained sound cue carry it, per her entry's "not a generic monster growl" instruction) |
| 06 Shurpanakha | pre-fight quote | "I only asked to be looked at." |
| 06 Shurpanakha | phase-transition | "This is what your prince's brother left me. Look at it properly, this time." |
| 07 Kumbhakarna | pre-fight quote | "Let me sleep. I already told him how this ends." |
| 07 Kumbhakarna | phase-transition | "I said make peace. He is my brother. I fight anyway." |
| 08 Ravana | pre-fight quote | "Ten heads bowed to no one. Explain to me what you are." |
| 08 Ravana | phase-transition | "A man. He sent a man." |

## What this act rules in for Act 3 onward

Two constraints above are deliberately scoped to Act 2, not the campaign.
Combination encounters, once opened at Shurpanakha's gate, stay open for the
rest of the campaign — Act 3 does not need to re-earn them the way Act 2
earned them past Act 1. The tier-0 no-combat category Kaikeyi's gate
introduces is now a standing option in `docs/agents/villain-handoff.md`,
available to any later villain whose source has no combat-victory beat to
adapt, though none of Act 3's or Act 4's roster currently calls for it. The
"new rig, existing behavior" tier pattern, used here for a regular enemy for
the first time (the Lanka soldier, built on `Kawach`'s skeleton rather than
a full bespoke state machine), is available the same way for any future
archetype in the remaining ~7-of-8 new-behavior budget still unspent after
this act.
