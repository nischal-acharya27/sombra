# Campaign redesign — Act 4: Vedic/Shakta

Resolved via `/grilling` for wayfinder ticket #47 (child of map #38). This is
the Vedic/Shakta act's section of the campaign redesign spec that will
eventually replace `docs/SPEC-CAMPAIGN.md` in place — the fourth and last of
the four act-content documents (`campaign-redesign-act1-mahabharata.md`,
`campaign-redesign-act2-ramayana.md`, `campaign-redesign-act3-krishna-cycle.md`
preceded this one). Per the map's own sequencing, all four are drafted assets
now, not yet folded into the live spec document — see **Wrap-up** below for
what that assembly step still needs.

Villain content (silhouette, tier, kit shape, palette, phase-transition flag,
respectful-treatment note) is already fixed in each villain's
`docs/research/villain-roster.md` entry and is not restated here except where
a design decision below depends on it. This document covers what that
research left open: level shape, regular-enemy roster, dialogue-beat
structure, and difficulty/pacing — the same four-heading shape every prior
act's document used — plus a fifth section this act alone carries: the
map's last open **wrap-up** fog item, how the existing Warden/Boss/Enemy code
migrates now that all four acts' content shape is drafted.

## Act shape

Gates 13-15. Order — Vritra, Trishiras, Mahishasura (boss, closes the act and
the campaign) — is locked by issue #40 and not reopened here.

**This act's own throughline.** Every prior act named what made it distinct
from the others: Act 1 was the campaign's purely human register, reskin-only;
Act 2 eased in boon-monsters and multi-headed silhouettes; Act 3 made "the
hunter is not the one the source says did this" its own identity, since all
four of its defeats belong to a specific avatar. Act 4 doesn't extend that
avatar-substitution thread — Vritra and Trishiras are both killed by Indra, a
deva rather than an avatar-of-Vishnu incarnation, which Vritra's own entry
already calls "slightly less theologically loaded" than the Rama/Krishna/
Narasimha cases. What actually unifies this act is older and narrower: all
three villains are drawn from the Rigveda or its Shakta elaboration, the
oldest stratum this campaign touches, predating every other act's epic/
Puranic source by centuries — cosmic/elemental and priestly rather than
political, closing on Mahishasura, the campaign's only Devi-centered defeat
and the sole traditional victory by a female divine figure among fourteen
male ones (Rama, Krishna, Narasimha, Indra twice, Sahadeva, Lakshmana). Read
this way, the act's order isn't just "roughly ascending stakes" — it's
elemental force (Vritra) → divided-loyalty priest (Trishiras) → the
campaign's mythologically largest figure and its one Devi-defeat
(Mahishasura), the campaign's most primordial act closing on the one deity
register it hasn't yet touched.

**This act spends zero of the remaining new-enemy-behavior budget.** Act 3
left roughly 6 of the roster's ~8-archetype budget unspent for this act's
three gates, flagging Vritra's and Trishiras's own silhouettes as "exactly
the kind of genuinely new shape the budget was reserved for" — but that
framing conflates two different things. The ~8 budget tracks new *regular*-
enemy archetypes (the Lanka soldier, the Mathura wrestler); each villain's
own tier (reskin / new-rig / bespoke-boss) is a separate, already-locked call
made per entry in `villain-roster.md`, not budget-gated. Vritra (tier 2) and
Trishiras (tier 2) are each already a wholly new rig regardless of any
budget, and Mahishasura (tier 3) is a bespoke `Boss` subclass — meaning this
three-gate act already spends more built-from-scratch villain novelty per
gate than any other act (two new rigs and one new state machine across three
gates, against Act 1's zero new rigs across three, Act 2's one new rig across
five, Act 3's one new rig across four). Adding a fourth genuinely new
regular-enemy archetype on top of that would overload the act's novelty
budget in a different currency than the one Act 2/3 were tracking. This
session spends the act's *regular*-enemy budget at zero and closes that
bookkeeping thread as a ceiling that was never obligated to be fully spent,
not a quota this act owed the rest of the campaign.

**Combination encounters stay open, unconstrained by any new debut.** Act 2
already opened them and they've stayed open since; because this act adds no
new regular archetype, no gate here needs to protect a `solo debut` the way
Act 3's Kamsa gate did — every regular enemy across all three gates is a
reskin of one of the five existing `Enemy` subclasses (`Raakchyas`,
`Charger`, `Kawach`, `BhootBatti`, `Tantrik`), each of which has already
debuted solo somewhere earlier in the campaign.

## The three gates

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 13 | Vritra | Warden | A dry riverbed descending into a storm-dark cavern, the world's withheld waters, Rigveda Mandala 1/4 | Vertical/layered — cracked-earth canyon terracing down to the coil-lair, flat at the fight | `BhootBatti` → drought will-o-wisps (reskin) | 1 |
| 14 | Trishiras | Warden | A Vedic yajna ground rising through three ritual tiers, *Rigveda*/*Brihaddevata* | Moderate — soma-terrace, recitation hall, watch-height, flat at the fight | `Tantrik` → yajna acolytes (reskin) | 1 |
| 15 | Mahishasura | Boss | An ascent into a conquered heaven, *Devi Mahatmya* | The act's and the campaign's most eventful — rising through the asura occupation into the god-court, flat at the fight | `Kawach` → asura garrison **+** `Raakchyas` → conquered-heaven horde (combined) | 2 |

**13 — Vritra.** The approach literalizes the myth's own premise before the
fight ever starts: a dry riverbed, cracked drought-earth underfoot, descending
through the `#41` prototype's stacked-ledge/gap traversal shape (reskinned as
canyon terracing rather than spectator stands or a lake) into a storm-dark
cavern where the last of the world's water is coiled and held. This puts the
drought-cracked-earth half of the act's stated palette register in the
*environment* rather than Vritra's own body — his entry already committed his
skin to storm-dark-with-lightning specifically to avoid a redundant
light-crack-on-cracked-soil read, so the approach carries the drought half and
his arena carries the storm half, rather than either fighting the other for
the same visual real estate. One regular encounter: `BhootBatti` reskinned as
drought will-o-wisps — false-hope lights luring the hunter toward false
footing during the canyon descent, its existing ranged keep-distance/windup
skeleton suiting vertical harassment during platforming better than a melee
reskin would, and thematically apt for a gate about withheld water and false
promise. No combination encounter — the gate's one real threat during
traversal is the platforming itself, matching Act 1's flat-approach precedent
(Shakuni) for a gate whose villain isn't a combat spectacle either.

**14 — Trishiras.** The setting is a Vedic sacrificial ground, its own
three-tiered structure built to echo the three heads' three functions before
the player ever sees Trishiras himself: a lower soma-pressing terrace, a
recitation hall at mid-height, and a watch-height platform at the top,
climbed in that order — traversal moderate rather than eventful, since
Trishiras himself is "explicitly a priest, not a warrior-king or beast" per
his own entry, and a gate built around a priest shouldn't out-spectacle him.
One regular encounter: `Tantrik` reskinned as yajna acolytes tending the
ground — a deliberate echo rather than a contrast, unlike Act 3's
"grammar shouldn't repeat" move at Kamsa's gate. Trishiras's own kit reuses
Tantrik's cast-then-release telegraph shape for his soma bolt, so meeting
reskinned Tantrik first previews that exact tell at grunt scale before the
player answers it again at Warden scale — the one place this act plays a
motif forward rather than avoiding repetition, because the repetition
*teaches* rather than flattens. Flat arena at the fight, per the campaign's
unbroken convention.

**15 — Mahishasura.** The campaign's final gate and its most eventful
traversal, full stop — not just this act's peak. Mahishasura "conquered
heaven" per his own entry's source summary, so the approach stages that
conquest as a place: rising through an occupied lower heaven (asura
garrisons holding ground that used to be the devas') into the god-court
itself, empty and waiting, before the arena opens onto Mahishasura at its
center. This is also gate 15's stated job per issue #40's locked palette
decision — echoing gate 1's palette register as the campaign's single art-
direction payoff (moved from the old ten-gate spec's gate 8 to gate 15 when
the campaign restructured) — so the god-court's lighting should pull toward
gate 1's own violet-to-mauve sky/fog register as the ascent nears the top,
exact values deferred to the build session per every other new-palette entry
on the roster. One combination encounter before the boss: `Kawach` reskinned
as asura garrison, met first alone in the lower heaven, then combined with
`Raakchyas` reskinned as conquered-heaven horde muscle in the god-court's
approach — mirroring the two-encounter build every other act gave its own
boss (Duryodhana in Act 1, Ravana in Act 2, Hiranyakashipu in Act 3), closing
that pattern out rather than breaking it for the campaign's last boss.

## Dialogue-beat structure

Reuses the same mechanisms every prior act established. Vritra's and
Trishiras's phase-transition/enrage calls are already specified in their own
`villain-roster.md` entries; this section transcribes rather than re-decides
them, the same way Acts 2 and 3 did for their own combat villains.
Mahishasura's four-beat structure is also already fully specified in his own
entry — this section transcribes it and adds illustrative lines, the one
piece his entry explicitly deferred.

**Confirming the ticket's own open question, precisely rather than as
assumed.** The ticket that opened this ticket asked to "confirm Vritra's and
Trishiras's enrage-only reveals need no additional phase-transition beat" —
but read against their own entries, that isn't quite what either says.
Vritra's enrage-only reveal is genuinely silent: a palette escalation only,
no dialogue-beat hook, the same restraint Kamsa's entry chose for a different
reason (avoiding staging his backstory as spectacle). Trishiras's entry
commits to more: "the enrage-threshold beat above doubles as a
`_fireBeats`/`storyWindow` dialogue moment," explicitly giving him "a sliver
of interiority about why he is being killed." So the confirmed answer isn't
"neither needs one" — it's that each villain's own entry already answers the
question individually, and the answers differ: Vritra stays silent, Trishiras
speaks once, at his own reveal.

- **Pre-fight** — every Warden/boss encounter's existing `intro` window
  carries the `quote` field Act 1 introduced, alongside the mechanical tell
  `note`. All three of this act's villains use it, including Mahishasura,
  whose `intro` beat *is* the first of his four dialogue beats.
- **Post-fight** — the existing gate `cleared` beat, unchanged mechanism, for
  all three. Mahishasura's still fires after his scripted death-collapse
  plays out (his Death beat lives inside the pre-existing `_die`/
  `_dieAnimate` window, per Hiranyakashipu's precedent for using that window
  for content), the same ordering every other boss gate already uses.
- **Mid-fight phase-transition** —
  - **Vritra** — silent escalation only: past the enrage threshold,
    `vritraCore`'s lightning-crack accent intensifies and spreads across more
    of the coil, alongside the standard windup/cooldown tightening every
    enraged enemy gets. No dialogue-beat hook, per his own entry.
  - **Trishiras** — an authored line at the enrage threshold, riding the same
    `_fireBeats`/`storyWindow` mechanism Taraka, Shurpanakha and Kumbhakarna
    already established for Wardens (not Boss-exclusive). All three heads'
    eyes light with `trishirasEye` at once at this threshold, where normally
    only the all-seeing head's do — the line should read, per his own
    respectful-treatment note, as "an actual invocation or plea rather than
    monster flavor text," surfacing the divided-loyalty premise that is his
    actual hook.
  - **Mahishasura** — the campaign's one deliberate exception to the locked
    "once, or twice with a phase beat" dialogue budget (`docs/DECISIONS.md`),
    per his own entry: four beats total, **Intro** (his own case: the boon,
    the throne, a wronged king rather than a monster), **Threshold** (his
    pose-level buffalo/human transformation and his rhetoric turning
    together — no rig-swap, the geometry itself articulates toward one form
    or the other), a **second late-fight beat** (the crux — the contested
    reception named directly, both readings given real weight), and
    **Death** (riding the death-collapse window, his last word, left
    unresolved). The Intro/Threshold/second-beat trio is also the
    campaign's only hunter dialogue anywhere — every other `storyWindow`
    beat on the roster is the villain speaking while the player only
    advances the queue. This session places the hunter's one line inside the
    second beat specifically, not the Threshold and not the Death: early
    enough that it doesn't read as an epilogue verdict, and deliberately not
    the fight's last word, so it doesn't read as the hunter winning an
    argument the beat is trying not to settle.

Illustrative lines (draft tone/length, not final `strings.js` copy, matching
every prior act's "readable at a glance" ceiling; Mahishasura's own entry
explicitly deferred exact text to "a future gate-content session" — this
document is that session for structure-and-stance-level drafting, with a
final copy pass still recommended before these ship):

| Gate | Beat | Line |
|---|---|---|
| 13 Vritra | pre-fight quote | (no speech — a low groan-through-stone as the coils shift, rendered as System/`note` text: "Something old is breathing under the riverbed.") |
| 13 Vritra | phase-transition | (none — silent escalation only, per his own handoff) |
| 14 Trishiras | pre-fight quote | "Drink. Recite. Watch every direction at once. I was made for three duties and trusted by none of the people they served." |
| 14 Trishiras | phase-transition | "Indra never asked which side I favored. He only asked which side I'd be caught favoring." |
| 15 Mahishasura | Intro (pre-fight quote) | "A boon closed every door a man or god could open. I built a throne in the gap. You call the reign that followed a monster's; the people under it called it a roof." |
| 15 Mahishasura | Threshold | "Feel that — neither shape will hold me now. Small comfort, I'd think, to whichever of us this turns out true for last." |
| 15 Mahishasura | second beat (crux) | Mahishasura: "Say it plainly, then. A wronged king, or a demon put down where he belonged — I've been told both, by people who never once asked which I'd choose." Hunter: "I'm not here to choose. I'm here because the door the two of you are still arguing through never got the chance to close." |
| 15 Mahishasura | Death | "Nine nights was generous of them. Tell the tenth—" (cut off, unresolved, per his own entry's explicit instruction) |

## Difficulty/pacing

Technical floors stay campaign-wide constant, unchanged from every prior act
— the same gap-width reserve and telegraph-window minimums
`docs/SPEC-CAMPAIGN.md`'s Testing Decisions already froze. Every new move
this act (Vritra's bite/lunge and coil-slam, Trishiras's soma bolt and chant
strike, and Mahishasura's charge/gore, ground-stomp and Threshold-triggered
grapple) reuses an existing telegraph shape reskinned rather than a new
physics primitive, authored against the existing touch budget: no required
chord, jump margins at or above the measured reserve, no direction-plus-two-
buttons input. None of them need a new input to read or answer.

Encounter count across the act runs 1, 1, 2 — the lowest-density act in the
campaign by encounter count, deliberately, since both Wardens already carry
more built-from-scratch novelty (a wholly new rig each) than any regular
encounter could add on top without crowding the gate. Traversal density,
though, is **not** held level the way Act 2 held itself level with Act 1 —
that constraint was scoped to Act 2 only and Act 3 already declined to carry
it forward. This act's own internal shape is moderate (Vritra's canyon
descent) → moderate (Trishiras's ritual ascent) → the campaign's outright
peak (Mahishasura's rise into the conquered heaven), settling the question
Act 3's own document left open ("where Act 4 sets its own ceiling ... is that
act's own call"): Mahishasura's gate is the highest traversal peak in the
15-gate campaign, not just this act's, because it's the literal last thing
the player climbs before the campaign's ending plays out.

Two items in this act are natural candidates for `docs/SPEC-CAMPAIGN.md`
Testing Decisions' tier-3 designated sample when the harness is extended to
15 gates: **Trishiras** (a wholly new rig with a genuinely new mechanic — the
all-seeing head's standing tracking override, distinct from any cooldown-
gated attack the suite already knows how to probe) and **Mahishasura** (the
fourth and final new boss tuning, and the only boss whose rig itself changes
pose mid-fight rather than only its palette or its move list). Flagged here
as a recommendation for whoever selects the sample, consistent with how Act
3 flagged its own two highest-risk items rather than deciding the sample
itself.

## Wrap-up: code migration and campaign assembly

The map's last open fog item — how the existing Warden/Boss/Enemy code
migrates gate by gate now that all four acts' content shape is drafted — has
three separate answers, one per code layer, plus a fourth item this ticket
surfaces that the map doesn't yet have a ticket for.

**Regular-enemy classes (`src/game/enemies.js`) stay architecturally
untouched.** All five existing subclasses — `Raakchyas`, `Charger`, `Kawach`,
`BhootBatti`, `Tantrik` — turn out to be sufficient for the entire 15-gate
campaign's regular-enemy roster: every reskin across all four acts (this
one's drought will-o-wisps and yajna acolytes included) is a `skin`-object
config change on an existing `buildX()`, zero new geometry, and the
campaign's only two genuinely new regular archetypes (the Lanka soldier
extending `Kawach`, the Mathura wrestler extending `Charger`, from Acts 2 and
3) are themselves subclasses of these same five, not siblings to them. No new
`Enemy`-tier base class is needed anywhere in the campaign.

**Warden classes are new code, not migrated code.** Every tier-2 Warden
(eleven of the fifteen villains, minus the four bosses and Kaikeyi's tier-0
no-combat gate) gets its own new subclass extending `Enemy` directly, per
each entry's own Tier call — this is authored fresh per villain, not
adapted from an existing Warden, since each one's silhouette is exactly the
thing tier 2 exists to make new. There's no migration question here: it's
eleven small, independent builds.

**The four locked bosses are new subclasses against existing shared
infrastructure, not renames of the old five.** `boss.js` currently holds
five `Boss` subclasses built for the old ten-gate spec's five bosses
(`Guardian`, `GoruMukh`, `Hakim`, `Chiranjivi`, `MaunAnkur`) — one more than
the new campaign's four locked bosses need. It's tempting to read that as a
clean 4-of-5 rename, especially since Ravana's and Duryodhana's own entries
each cite `Guardian`/`Goru-Mukh`/`Hakim`/`Chiranjivi`'s shared telegraph-
state vocabulary (`sweeping`/`leaping`/`volley`/`slam`, plus the shared
`_enrage()` hook) as the precedent their own attacks reskin from — but
that's a citation of shared *infrastructure*, not a claim that any new boss
*is* an old one. Duryodhana is "the first tier-3 boss to actually swing a
held prop" (none of the old four attack bare-body the way Guardian/Goru-Mukh/
Hakim/Chiranjivi all do); Ravana's four-weapon rotation, Hiranyakashipu's
bare-handed boon-window, and Mahishasura's pose-level mid-fight
transformation are each their own new fight built against the shared
vocabulary, not an old boss's content relabeled. Recommendation: author all
four new boss subclasses fresh, reusing `boss.js`'s existing shared states
and `_enrage()` hook as every entry already assumes, and delete the old five
outright once each of the four new subclasses exists and no gate references
the old names — the "rewritten in place" convention the map's Notes commit
to is about gate *descriptor* files keeping their scaffolding, not about
`Boss` class identity, and the 5-old/4-new count is a coincidence of
history, not an architectural throughline worth preserving through a forced
1:1 rename.

**Gate descriptor files: ten rewritten in place, five genuinely new.**
`gate1.js`–`gate10.js` exist today and keep their file/code scaffolding per
the map's Notes, content rewritten inside them. Gates 11–15 have no existing
file to rewrite — `gate11.js`–`gate15.js` are new files following the
identical descriptor pattern the existing ten already establish, which isn't
"migration" so much as the pattern extending naturally to five more
instances. `src/game/gates/index.js`'s gate list grows from ten entries to
fifteen. Flag for whoever implements: the suite's `GATE TRANSITION`
draw-counter row (`CLAUDE.md`'s allocate-nothing rule) needs updating for the
new gate count the moment the eleventh gate is wired in, not deferred to the
end, the same way `tools/gatecheck.js`'s reachability search needs to run
against every new descriptor as it lands rather than only at the finish.

**Build order.** Recommend authoring gate-by-gate in campaign order, 1
through 15, rather than by code layer or by tier. This matches the
campaign's own internal complexity ramp — Act 1's reskin-only gates first
validate the simplest tier before Act 2 introduces the first new rig and the
first combination encounter, Act 3 introduces the first new regular
archetype and the phase-transition-without-rig-swap pattern, and Act 4 closes
with the campaign's only pose-level transformation and its only hunter
dialogue — so each new mechanical pattern's first instance becomes a natural
checkpoint the existing `?sim` suite can validate incrementally, rather than
all fifteen gates' worth of new code landing in one changeset with one
combined failure surface.

**What this ticket does not do, and what should follow it.** The map's
Destination is `docs/SPEC-CAMPAIGN.md` replaced in place — a single document
covering the whole fifteen-gate campaign. This document, like the three
before it, is a standalone research artifact; none of the four act documents
has yet been folded into `SPEC-CAMPAIGN.md` itself, and the old six-realms
ten-gate content (`## The ten gates`, `## User Stories`, the realm-by-realm
prose) is still live in that file, unreplaced. With this ticket closing the
last of the map's four content-drafting tickets, the map's own frontier
should open exactly one more ticket: assembling the four act documents (plus
the roster/order decision in #40, the dialogue mechanism in #42, and the
villain-handoff process in #43) into the actual `SPEC-CAMPAIGN.md`
replacement the Destination names. That's not decided here — it's the map's
next ticket, not this one's content to draft.
