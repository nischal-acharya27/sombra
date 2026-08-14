# Spec — the fifteen-gate campaign

Status: content drafted, not yet built. Gates 1–10 exist (`src/game/gates/gate1.js`–`gate10.js`) but hold the old ten-gate content and are rewritten in place, not replaced; gates 11–15 do not exist yet. `boss.js` holds five old boss subclasses (`Guardian`, `GoruMukh`, `Hakim`, `Chiranjivi`, `MaunAnkur`) that are retired once the four bosses below exist. Design settled in `DECISIONS.md`, the campaign-redesign map (`wayfinder:map` issue #38) and its child tickets, and `docs/research/villain-roster.md` (per-villain source research). This document does not reopen any of it; it turns it into work. Vocabulary is defined in `/CONTEXT.md` and used here without gloss.

## Problem Statement

The game was one gate long. That gate had been played four times, tuned three times, and carried a verified signature mechanic, and there was nothing further to learn from it. It also had no story: a hunter, a gate, and a boss at the end of it, with no reason for any of them. And the project had acquired an end goal it did not previously have — a free Android game carrying ads, which reaches backwards into everything, since ad revenue is impressions per user, which is retention, which needs a reason to come back.

The fix was ten gates and a frame narrative: the Wheel that judges and reincarnates the dead has stopped, souls back up, the overflow tears into the living world, and the hunter does the psychopomp's abandoned work. Ten gates were built against an invented six-realms structure (Naraka, preta, animal, human, asura, deva) that borrowed doctrine and imagery from several traditions at once and populated each realm with invented Wardens under Nepali names (Kevat, Vyaghri, Amar-Yoddha, Bakaya, Maun-Ankur) rather than telling any specific tradition's actual stories.

That build surfaced a fourth problem, sized to change the campaign's content rather than its scaffolding: **these are living religions, not generic fantasy iconography**, and a composite of five traditions' shared architecture (the shared judge, the shared river, the shared doctrine of rebirth) is a defensible foundation, but an invented antagonist loosely inspired by a tradition is not the same thing as that tradition's own story. The campaign-redesign map (#38) reversed the cross-tradition frame on those grounds: the six realms are dropped, and the ten (now fifteen) gates become an anthology of named, real Hindu epic and Puranic villains — Ravana, Kamsa, Mahishasura, and twelve more — each gate telling that villain's own defeat rather than an archetype standing in for it. The Wheel/Yama frame narrative survives this change unchanged; only what fills the gates between its opening and its ending does not.

## Solution

**Fifteen gates, and a reason to walk into them.**

The Wheel — the cycle by which the dead are judged and reborn — has stopped. Souls back up, and the overflow tears into the living world. Those tears are the gates. The hunter is not clearing monster nests; they are doing the psychopomp's work that the machinery of the afterlife abandoned. **Yama stopped judging because he could no longer bear it** — that is the answer the frame has carried since before it was written, and it is unchanged by this redesign.

What has changed is what is inside the tear. Each gate is now a self-contained confrontation with a real, named villain from the Mahabharata, the Ramayana, the Krishna-cycle of the *Bhagavata Purana*, or the Vedic hymns and *Devi Mahatmya* — fifteen candidates researched against primary/secondary source material in `docs/research/villain-roster.md`, chosen to spread across schemer, tyrant-king, elemental/cosmic, giant, shapeshifter, disguised-assassin, cursed-monster and mortal-rival silhouettes rather than for redundant shape. These are unjudged souls, backed up by the stopped Wheel — the hunter delivers the reckoning Yama couldn't, not a monster hunt. Gate 1's exit still leads away from home rather than back to it; after gate 15, the hunter reaches the Wheel itself, turns it, and releases every shadow bound along the way, the last one bound going first, exactly as the frame always intended. Yama takes the office back up: ten (now fifteen) gates of escorted souls are the argument that the work is bearable when it is not done alone.

**SORGI still carries the story**, unchanged: a slain enemy leaves a remnant, binding it releases something stuck rather than raising a corpse, and it walks with the hunter until the ending asks the player to let it go.

**The fifteen gates group into four acts by source epic** — Mahabharata → Ramayana → Krishna-cycle → Vedic/Shakta — ordered and internally paced along one axis: cleanest mortal-on-mortal defeats first, most avatar-specific or boon-loophole-dependent defeats last. Mahabharata opens the campaign because none of its three villains raise a theological-substitution problem (the hunter's legitimacy is never in question); the Vedic/Shakta act closes it, ending on Mahishasura — the single most avatar-specific defeat on the roster — landing the campaign's hardest question as its climax rather than burying it mid-run. Length reaches 3–4 hours through three combined, non-replay-driven levers: more gates (ten to fifteen), denser individual gates (vertical/layered 2.5D traversal, Prince-of-Persia-style, using the existing seven-verb moveset and no new one), and deeper per-gate content (dialogue at pre-fight, post-fight, *and* mid-fight phase transitions — a genuine addition over the old spec's boundary-only beats).

**Four bosses, eleven Wardens, one tier-0 no-combat gate.** The boss rate drops from the old spec's 40% (4/10) to roughly 27% (4/15) — bosses are the expensive hand-subclassed tier, Wardens are configuration, and tripling the cheap tier while holding the expensive one flat is what keeps fifteen named antagonists costing close to what ten did. One boss closes each act, at that act's narrative climax: **Duryodhana** (Mahabharata), **Ravana** (Ramayana), **Hiranyakashipu** (Krishna-cycle), **Mahishasura** (Vedic/Shakta, and the campaign). Kaikeyi is the one exception to "every gate is a fight": she has no monster form and no traditional defeat, so her gate is a four-beat, no-fail dialogue/consequence sequence — witnessing, not winning — rather than an invented combat resolution the source doesn't support.

**Palette moves to a per-act register, intensifying toward each act's boss, with the single campaign-wide payoff moved from the old "gate 8 echoes gate 1" to gate 15 (Mahishasura) echoing gate 1.** The existing lerp-over-fog/sky/grass mechanism, driven by `player.x` (`DECISIONS.md` § Art direction), is unchanged; only its endpoints' organizing principle moves from one register per gate to one base register per act:

| Act | Register |
|---|---|
| Mahabharata | Court/mortal — bronze, iron, regal-but-grounded |
| Ramayana | Rakshasa/forest tones, moving toward regal gold approaching Ravana |
| Krishna-cycle | Divine-tyrant — gold and dark red, prophecy-coded |
| Vedic/Shakta | Cosmic/primordial — drought-cracked earth and storm-dark, the oldest- and strangest-reading act |

**Enemy variety comes from both reskins and new archetypes**, split by a three-tier villain-build pattern (below) that also governs the roster's ~8-archetype new-regular-enemy budget: Act 1 spends none of it (reskin-only, the campaign's one purely human/mortal register); Act 2 spends one (a Lanka war-footing rakshasa-soldier); Act 3 spends one more (a Mathura akhada wrestler); Act 4 spends none, since its own two Wardens (Vritra, Trishiras) already carry more built-from-scratch villain novelty per gate than any other act without a new regular archetype on top.

## The fifteen gates

| # | Villain | Act | Role | Source |
|---|---|---|---|---|
| 01 | Shakuni | Mahabharata | Warden | *Sabha Parva* |
| 02 | Bakasura | Mahabharata | Warden | *Adi Parva* |
| 03 | Duryodhana | Mahabharata | **Boss** | *Shalya Parva* |
| 04 | Taraka | Ramayana | Warden | *Bala Kanda* |
| 05 | Kaikeyi | Ramayana | Tier 0, no-combat | *Ayodhya Kanda* |
| 06 | Shurpanakha | Ramayana | Warden | *Aranya Kanda* |
| 07 | Kumbhakarna | Ramayana | Warden | *Ramayana* |
| 08 | Ravana | Ramayana | **Boss** | *Yuddha Kanda* |
| 09 | Kamsa | Krishna-cycle | Warden | *Bhagavata Purana* Bk. 10 |
| 10 | Putana | Krishna-cycle | Warden | *Bhagavata Purana* Bk. 10 |
| 11 | Narakasura | Krishna-cycle | Warden | *Bhagavata Purana* |
| 12 | Hiranyakashipu | Krishna-cycle | **Boss** | *Bhagavata Purana* |
| 13 | Vritra | Vedic/Shakta | Warden | Rigveda 1/4 |
| 14 | Trishiras | Vedic/Shakta | Warden | Rigveda / *Brihaddevata* |
| 15 | Mahishasura | Vedic/Shakta | **Boss** | *Devi Mahatmya* |

Villain content — silhouette, tier, kit shape, palette, phase-transition flag, respectful-treatment note — is fixed per villain in `docs/research/villain-roster.md` and is not restated below except where a decision depends on it.

Every Warden/boss encounter's `intro` window carries a `quote` field alongside the existing mechanical tell `note` (the pre-fight beat); the existing `cleared` beat is the post-fight one; a mid-fight phase-transition beat is new, described under Implementation Decisions § Dialogue. Illustrative lines below are draft tone/length, not final `strings.js` copy — each stays within the "readable at a glance" ceiling user story 5 sets.

### Act 1 — Mahabharata (gates 01–03)

The campaign's one purely human register: no boon, no monstrous form, no reveal or transform among its three villains — a courtier's cunning, a rakshasa's brute hunger, a king's pride, nothing supernatural in the cast. Every encounter across all three gates is single-archetype (no two enemy types ever share a lock — combination encounters start in Act 2), and every regular enemy is a reskin of an existing class, spending none of the roster's new-behavior budget. This is Act 1's pacing lever, not an eased technical floor: gap-width reserve and telegraph-window minimums hold constant campaign-wide from gate 1 on, since the training hall already teaches the seven verbs and PUKAR before any gate is reached.

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 01 | Shakuni | Warden | Royal dice hall, *Sabha Parva* | Mostly flat — verticality would obscure his die's telegraph | `Kawach` → court guards | 2 |
| 02 | Bakasura | Warden | Road/forest to Ekachakra, *Adi Parva* | Moderate — a few stacked-ledge rises, flat at the fight | `Raakchyas` → village rakshasa | 2 |
| 03 | Duryodhana | Boss | Kurukshetra + the lake, *Shalya Parva* | Most eventful — a descent to the lake he hides in, then a flat duel arena | `Charger` → cavalry, then `Kawach` → infantry | 3 |

**01 — Shakuni.** A courtier's approach, wide and low-relief: Shakuni's kit (summoned-die windup → telegraphed zone) needs clear sightlines, and stacked geometry would undermine the one entry the roster's own research called hardest to build an honest fight for. One encounter — `Kawach` reskinned as court guards, close-range and committal, contrasting Shakuni's own ranged, patient kit — then Shakuni.

**02 — Bakasura.** The walk to Ekachakra gets the act's only real traversal texture (stacked-ledge rises via the `thickness` field, per the vertical-traversal prototype), reading as a forest road. The arena flattens before the fight, since his grab-slam/lunge kit needs open room. One encounter — `Raakchyas` reskinned as a village rakshasa, met alone, ahead of the story's own named terror.

**03 — Duryodhana.** The act's boss gate and most eventful: a descent toward the lake he hides in per the source text, before the ground flattens into the duel arena, matching every boss fight's flat-arena convention. Two sequential single-archetype encounters — `Charger` reskinned as charging cavalry, then `Kawach` as an infantry line — before Duryodhana himself, giving this gate the extra beat every boss gate carries without breaking the act's no-combination rule.

**Dialogue.** Shakuni and Bakasura carry the ordinary generic enrage warning, no authored line. **Duryodhana gets one authored phase-transition line** — his "no phase-transition" flag is about the visual reveal, not speech, and his enrage crossing is the natural hook for a line about his own grievance.

| Gate | Beat | Line |
|---|---|---|
| 01 Shakuni | pre-fight | "Sit down. Let's play." |
| 02 Bakasura | pre-fight | "One cart was never enough." |
| 03 Duryodhana | pre-fight | "I hid because the war was already lost. I do not hide from you." |
| 03 Duryodhana | phase-transition | "I was the eldest son. No dice were needed to take what should have been given." |

### Act 2 — Ramayana (gates 04–08)

Where Act 1 was purely human, Act 2 is where the roster's boon-monsters and multi-headed silhouettes enter: Taraka (a curse, not a birth), Shurpanakha (a rakshasi shapeshifter), Kumbhakarna (a boon gone wrong), and Ravana (a boon, compressed ten heads, the campaign's first tier-3 fight since Duryodhana) all carry a supernatural register Act 1 never touched. Kaikeyi is the deliberate exception — fully human, fully non-combat — placed second in the act specifically so a human, no-combat beat sits between two forest fights and keeps "boon-monster" from reading as the act's only mode.

Three calls shape the act: it spends **one** new regular-enemy archetype (a Lanka war-footing rakshasa-soldier — spear/polearm, formation-fighting — built as a new rig extending `Kawach`'s plant→telegraph→commit skeleton rather than a reskin or a bespoke state machine); **combination encounters ease in mid-act**, not at gate 1 — Taraka and Kaikeyi both stay single-archetype/no-combat, and the campaign's first combination encounter lands at Shurpanakha's gate, which also gives the new Lanka archetype a free solo debut one gate later, at Kumbhakarna's; and **traversal density holds level with Act 1** rather than escalating on top of the newly-opened combination lever, capped at Duryodhana's own peak.

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 04 | Taraka | Warden | Tataka-vana, *Bala Kanda* | Moderate — canopy-level stacked rises, flat at the fight | `BhootBatti` → forest wisps | 1 |
| 05 | Kaikeyi | Tier 0, no-combat | Antechamber toward the queen's room, Ayodhya | Flat, staged four-beat fork sequence | none | 0 |
| 06 | Shurpanakha | Warden | Panchavati, *Aranya Kanda* | Moderate, same forest register as gate 04 | `Raakchyas` + `Tantrik` (first combination) | 1 |
| 07 | Kumbhakarna | Warden | Lanka's outer ramparts into his sleeping-hall | Escalating, flattens for the fight | new: Lanka soldier (solo debut) | 2 |
| 08 | Ravana | Boss | Lanka's battlements into the throne room | Most eventful of the act, capped at gate 03's peak | Lanka soldier + `Kawach` (combined) | 3 |

**04 — Taraka.** Climbing through curse-touched canopy rather than walking a road, mirroring Bakasura's traversal texture. One encounter — `BhootBatti` reskinned as forest wisps, slow and floating against her own fast, committal ground melee.

**05 — Kaikeyi.** Her handoff entry (`villain-roster.md`) specifies the gate in full: tier 0, no `Enemy`/`Boss` ancestry, a linear four-beat sequence, each staged as a two-path fork (low/jump or left/right), resolved by whichever trigger volume the hunter crosses first — no-fail, no wrong answer. She stands fixed past the far end of the arena for the whole gate. Her four beats: (1) the boon owed, framed as a legitimate transaction; (2) Manthara's manipulation — the malice was supplied to her, not by her; (3) the invocation and its cost — Bharata crowned, Rama exiled, Dasharatha dead of grief; (4) her regret, on her own timeline, not produced by anything the hunter does. Which fork the hunter takes shapes tone, never whether beat four is reached. `_fireBeats` needs a new `at: 'choice-made'` trigger type to fire these — an open implementation flag, not resolved here.

**06 — Shurpanakha.** Same forest register as gate 04, at the same traversal density. The campaign's first combination encounter: `Raakchyas` reskinned as forest rakshasa alongside `Tantrik` reskinned as a jungle summoner-priest — `Tantrik` does no damage itself and exists to be deprioritized at the player's peril, making it the existing archetype best built to teach target-prioritization at the moment combination fights begin. Shurpanakha's own kit (illusion decoy pre-reveal, claw swipe post-reveal) follows as a second encounter.

**07 — Kumbhakarna.** The new Lanka-soldier archetype's solo debut, alone, in the outer ramparts/barracks, before it is ever combined with anything at gate 08. The ramparts give way to his sleeping-hall, flat for the fight.

**08 — Ravana.** The act's boss gate — battlements under siege into the throne room, capped at gate 03's peak rather than exceeding it. Two encounters before Ravana: the Lanka soldier now combined with `Kawach` as Lanka royal guard, then the throne room itself, flat, for his four-weapon rotation.

**Dialogue.** All four combat villains carry an authored phase-transition beat, already specified per-villain in `villain-roster.md`. **Taraka** — a held, player-advanced beat: writhe/contort animation, a pained sound cue (not a generic monster growl) as her rig swaps from beautiful to monstrous form on an HP threshold; kit and hitbox stay identical, only rig/palette/speed-tell tighten. **Shurpanakha** — illusion-decoy swaps to bare-claw swipe at the same threshold, staged as a scripted reveal, narrated in SORGI's escort framing per her respectful-treatment note. **Kumbhakarna** — groggy/duller-skin snaps to fully awake, faster wind-ups, at the threshold, staging the source's own beat: he counsels peace, is refused, fights anyway out of loyalty to Ravana. **Ravana** — no rig-swap (no curse/disguise premise to dramatize, same call as Duryodhana), but still fires a paged beat at enrage: the compressed head-arc intensifies (3 visible heads to 5), and the line registers him dying to someone he wrote off as beneath his notice, left unresolved.

| Gate | Beat | Line |
|---|---|---|
| 04 Taraka | pre-fight | "You wear a face I used to have." |
| 04 Taraka | phase-transition | (no line — writhe/contort animation and pained sound cue carry it) |
| 06 Shurpanakha | pre-fight | "I only asked to be looked at." |
| 06 Shurpanakha | phase-transition | "This is what your prince's brother left me. Look at it properly, this time." |
| 07 Kumbhakarna | pre-fight | "Let me sleep. I already told him how this ends." |
| 07 Kumbhakarna | phase-transition | "I said make peace. He is my brother. I fight anyway." |
| 08 Ravana | pre-fight | "Ten heads bowed to no one. Explain to me what you are." |
| 08 Ravana | phase-transition | "A man. He sent a man." |

Combination encounters, once opened at gate 06, stay open for the rest of the campaign — later acts don't re-earn them. The tier-0 no-combat category Kaikeyi introduces is a standing option in `docs/agents/villain-handoff.md` for any villain whose source has no combat-victory beat to adapt.

### Act 3 — Krishna-cycle (gates 09–12)

This act's own throughline: **every one of its four defeats belongs to a specific avatar, not a generic hero.** Putana dies to an infant Krishna recognizing her through disguise; Kamsa dies to the same child grown to a youth, at the wrestling match the prophecy against him always produced; Narakasura dies to Krishna and Satyabhama together; Hiranyakashipu dies to Narasimha, the only defeat on the roster built entirely out of a boon's literal wording. Nothing here invents an in-fiction excuse for why the hunter stands in for the avatar — no "the hunter is secretly an avatar" reveal. It stays named and unresolved at the villain level, sharpest at Hiranyakashipu's gate closing the act.

The act spends a second new regular-enemy archetype — a Mathura akhada wrestler/grappler, extending `Charger`'s chase-and-commit skeleton, giving literal form to the source detail that Kamsa staged a public wrestling tournament and set his champions against the boy before ever reaching the throne himself. Combination encounters are used where they fit rather than re-earned: Kamsa's gate stays single-archetype to protect the wrestler's solo debut, Putana's gate stays at zero regular encounters (below), Narakasura's and Hiranyakashipu's both combine freely.

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 09 | Kamsa | Warden | Mathura's royal akhada, *Bhagavata Purana* Bk. 10 | Moderate — tiered stands descending into the pit, flat at the fight | new: Mathura wrestler (solo debut) | 2 |
| 10 | Putana | Warden | A sleeping household in Gokul, at night | Flat, minimal, deliberately intimate | none | 1 |
| 11 | Narakasura | Warden | Pragjyotishapura's fortress and cells | Escalating — barred corridors and ramparts | `Kawach` + `Raakchyas` (combined) | 2 |
| 12 | Hiranyakashipu | Boss | The Daitya palace's pillared galleries into the boon-hall | Most eventful — rising multi-tier approach | `Kawach`, then `Kawach` + `Raakchyas` (combined) | 3 |

**09 — Kamsa.** A descent through tiered stone spectator stands into the packed-earth pit, flattening completely for the fight. One encounter — the new Mathura-wrestler archetype, met alone, fast and grappling against Kamsa's own heavy, armoured, committal kit (overhead shackle-iron mace smash, mid-range chain lash).

**10 — Putana.** Zero regular encounters, a campaign first — every earlier gate staged at least one. Her disguise-form silhouette reads at essentially hunter scale, and her setting is domestic rather than military or courtly; padding the approach with a reskinned mob would work against the intimacy her respectful-treatment note asks the design to protect. A real pacing dip between two crowded gates.

**11 — Narakasura.** Barred corridors and ramparts, visually continuous with Kamsa's prison-iron motif but at fortress rather than court-regalia scale. One combination encounter — `Kawach` as fortress guard alongside `Raakchyas` as rakshasa garrison muscle, both archetypes already having debuted solo earlier in the campaign. Gives way to his flat audience hall.

**12 — Hiranyakashipu.** The act's boss gate: a rising, multi-tier approach through pillared galleries, foreshadowing the boon-summoned pillar prop his fight stages around, before the boon-hall opens flat. Two encounters — `Kawach` as palace guard alone, then combined with `Raakchyas` as court zealots — before Hiranyakashipu.

**Dialogue.** **Kamsa** carries no dialogue-beat hook at all, by his own handoff's explicit decision — no version of a line about the infanticide backstory avoids staging it as spectacle. **Putana** — a held, player-advanced beat: disguise form swaps to true form on an HP threshold, narrated toward release rather than a monster put down, the strongest ready-made fit for SORGI's escort framing on the whole roster. **Narakasura** — the ordinary enrage payload (tighter spear thrusts, faster ground-slams) plus an authored line foreshadowing the coming liberation directly. **Hiranyakashipu** — his `threshold` boon-vulnerability window cycles from the start of the fight rather than sitting behind an HP gate, so it can't double as a dialogue trigger without colliding with the window his death necessarily lands in; instead he fires exactly one mid-fight beat at his ordinary `enrageAt: 0.5`, a boastful line about the boon holding, kept fully separate from the finishing beat. The scripted Narasimha collapse rides the existing `_die`/`_dieAnimate` window instead — every boss already plays that window on death, so it needs no HP-fraction decision of its own, and the "neither day nor night, neither indoors nor out" liminal imagery is carried by staging (the boon-summoned pillar/doorway prop, twilight lighting) rather than by trigger logic.

| Gate | Beat | Line |
|---|---|---|
| 09 Kamsa | pre-fight | "A voice told me my death has a name. I have never stopped listening for it." |
| 09 Kamsa | phase-transition | (none, by design — see above) |
| 10 Putana | pre-fight | "You look like you could use a mother's welcome." |
| 10 Putana | phase-transition | "It burns worse leaving than it ever did going in." |
| 11 Narakasura | pre-fight | "Sixteen thousand voices, and every one of them mine to keep." |
| 11 Narakasura | phase-transition | "The walls are already cracking. You've just come to watch them fall." |
| 12 Hiranyakashipu | pre-fight | "Not man. Not beast. Not day. Not night. Say the words that could kill me — you don't have them." |
| 12 Hiranyakashipu | phase-transition | "Blood is not a weapon. Whatever you are, you have found no weapon yet." |
| 12 Hiranyakashipu | Narasimha finishing beat | (no line — reverent and scripted, left for the gate-content build session) |

Narakasura's `cleared` text should land on the liberation itself — captives freed, earrings restored — and stop there, per his respectful-treatment note's explicit recommendation to omit the epilogue (the freed captives married to Krishna) that pop adaptations frequently mishandle.

The new-behavior budget sits at 2 of ~8 spent after this act (Lanka soldier, Mathura wrestler), leaving roughly 6 unused entering Act 4 — not a quota Act 4 owes, just the ceiling it inherits.

### Act 4 — Vedic/Shakta (gates 13–15)

The campaign's oldest stratum: all three villains are drawn from the Rigveda or its Shakta elaboration, predating every other act's source by centuries — cosmic/elemental and priestly rather than political. Vritra and Trishiras are both killed by Indra, a deva rather than an avatar, which is a step back from Act 3's avatar-substitution tension, not an extension of it. The act closes on Mahishasura, the campaign's only Devi-centered defeat and the sole traditional victory by a female divine figure among fourteen male ones on the roster. Read this way, the act's order is elemental force (Vritra) → divided-loyalty priest (Trishiras) → the campaign's mythologically largest figure and its one Devi-defeat (Mahishasura), closing on the one deity register the campaign hasn't yet touched.

The act spends **zero** of the remaining new-regular-enemy budget — not because it has nothing to spend, but because Vritra and Trishiras (both tier 2, both wholly new rigs) and Mahishasura (tier 3, a bespoke `Boss` subclass) already spend more built-from-scratch villain novelty per gate than any other act (two new rigs and one new state machine across three gates), and a fourth new regular archetype on top would overload a different novelty budget than the one Acts 2 and 3 were tracking. Every regular enemy across all three gates is a reskin of one of the five existing `Enemy` subclasses, each already debuted solo earlier in the campaign — no `solo debut` protection is needed anywhere in this act.

| # | Villain | Role | Setting | Level shape | Regular enemy | Encounters |
|---|---|---|---|---|---|---|
| 13 | Vritra | Warden | A dry riverbed into a storm-dark cavern, Rigveda 1/4 | Vertical/layered — canyon terracing down to the coil-lair, flat at the fight | `BhootBatti` → drought wisps | 1 |
| 14 | Trishiras | Warden | A Vedic yajna ground, three ritual tiers | Moderate — soma-terrace, recitation hall, watch-height | `Tantrik` → yajna acolytes | 1 |
| 15 | Mahishasura | Boss | An ascent into a conquered heaven, *Devi Mahatmya* | The campaign's most eventful traversal | `Kawach` + `Raakchyas` (combined) | 2 |

**13 — Vritra.** A dry, cracked-drought riverbed descends via stacked-ledge/gap traversal into a storm-dark cavern holding the world's withheld waters — the approach carries the drought half of the act's palette register, his own arena carries the storm half, so neither fights the other for the same visual space. One encounter: `BhootBatti` reskinned as drought will-o-wisps, false-hope lights luring the hunter toward false footing during the descent. No combination encounter — the platforming itself is the gate's real threat.

**14 — Trishiras.** A three-tiered sacrificial ground — lower soma-pressing terrace, mid recitation hall, top watch-height platform, climbed in that order, echoing his three heads' three functions before the player ever sees him. Traversal stays moderate rather than eventful, since he is "explicitly a priest, not a warrior-king or beast." One encounter: `Tantrik` reskinned as yajna acolytes, previewing his own cast-then-release soma-bolt tell at grunt scale before the player answers it again at Warden scale — the one place this act plays a motif forward rather than avoiding repetition, because the repetition teaches.

**15 — Mahishasura.** The campaign's final gate and its outright traversal peak: rising through an occupied lower heaven (asura garrisons holding ground that used to be the devas') into the empty, waiting god-court, where the arena opens onto Mahishasura. The god-court's lighting pulls toward gate 1's own violet-to-mauve register as the ascent nears the top — the campaign's single art-direction payoff, moved here from the old spec's gate 8. One combination encounter before the boss: `Kawach` as asura garrison, met alone in the lower heaven, then combined with `Raakchyas` as conquered-heaven horde muscle approaching the god-court — the same two-encounter build every other act gave its own boss.

**Dialogue.** **Vritra** stays silent past his enrage threshold — palette escalation only (`vritraCore`'s lightning-crack accent intensifies and spreads), no dialogue-beat hook, the same restraint Kamsa's entry chose for a different reason. **Trishiras** fires an authored line at the enrage threshold — all three heads' eyes light with `trishirasEye` at once, where normally only the all-seeing head's do — reading as an actual invocation or plea rather than monster flavor text, surfacing his divided-loyalty premise. **Mahishasura** is the campaign's one deliberate exception to the "once, or twice with a phase beat" dialogue budget: four beats total — **Intro** (his own case: a boon, a throne, a wronged king rather than a monster), **Threshold** (his pose-level buffalo/human transformation and his rhetoric turning together, no rig-swap — the geometry itself articulates toward one form or the other), a **second late-fight beat** (the crux — the contested reception named directly, both readings given real weight, and the campaign's only hunter dialogue anywhere: every other beat on the roster is the villain speaking while the player only advances the queue), and **Death** (riding the death-collapse window, his last word, left unresolved). The hunter's one line sits inside the second beat specifically — early enough not to read as an epilogue verdict, and deliberately not the fight's last word, so it doesn't read as winning an argument the beat is trying not to settle.

| Gate | Beat | Line |
|---|---|---|
| 13 Vritra | pre-fight | (no speech — a low groan-through-stone; System/`note` text: "Something old is breathing under the riverbed.") |
| 13 Vritra | phase-transition | (none — silent escalation only) |
| 14 Trishiras | pre-fight | "Drink. Recite. Watch every direction at once. I was made for three duties and trusted by none of the people they served." |
| 14 Trishiras | phase-transition | "Indra never asked which side I favored. He only asked which side I'd be caught favoring." |
| 15 Mahishasura | Intro | "A boon closed every door a man or god could open. I built a throne in the gap. You call the reign that followed a monster's; the people under it called it a roof." |
| 15 Mahishasura | Threshold | "Feel that — neither shape will hold me now. Small comfort, I'd think, to whichever of us this turns out true for last." |
| 15 Mahishasura | second beat | Mahishasura: "Say it plainly, then. A wronged king, or a demon put down where he belonged — I've been told both, by people who never once asked which I'd choose." Hunter: "I'm not here to choose. I'm here because the door the two of you are still arguing through never got the chance to close." |
| 15 Mahishasura | Death | "Nine nights was generous of them. Tell the tenth—" (cut off, unresolved) |

Exact copy above is structure-and-stance-level drafting; a final pass is recommended before it ships, especially for Mahishasura's four beats.

## User Stories

**The campaign**

1. As a hunter, I want gate 1's exit to lead somewhere other than home, so that the campaign begins from the content that already exists rather than replacing it.
2. As a hunter, I want each gate to open with the System naming the villain I am about to face, so that I always know whose story a gate is telling.
3. As a hunter, I want each act's palette register to look unmistakably unlike the last, and each gate's setting and level shape to read as that villain's own story, so that progress is visible without a map or a progress bar.
4. As a hunter, I want the story delivered in short, paged windows — at gate boundaries and, for phase transitions, mid-fight with combat paused — so that narrative never competes with a live fight for my attention, the failure `PLAYTEST.md` recorded once and the redesign's dialogue mechanism exists to prevent from recurring.
5. As a hunter, I want no story text longer than can be read at a glance, so that a rule or a beat I am shown is a rule or a beat I received.
6. As a hunter, I want the ending to ask me for one deliberate input — releasing the shadow at the Wheel — so that the campaign closes on an action rather than a cutscene.
7. As a hunter, I want at least one gate to resolve through witnessing rather than winning, so that the campaign's own premise — reckoning, not conquest, is the point — is stated directly at least once, not only implied by the framing around every fight.

**Wardens and bosses**

8. As a hunter, I want every gate to end with a named antagonist, so that fifteen gates feel authored rather than generated.
9. As a hunter, I want a Warden to use telegraphs I already know, plus one new signature move, so that a gate's climax is a test of what I have learned rather than a new vocabulary lesson.
10. As a hunter, I want the four bosses to be visibly of a higher order than the eleven Wardens, so that escalation reads without being explained.
11. As a hunter, I want a Warden's title shown when it appears, so that the named antagonist is legible as one.
12. As a hunter, I want a villain's fight, setting and dialogue built from their own story rather than an invented archetype, so that fifteen real, named villains read as themselves and not as reskinned generic fantasy.
13. As a developer, I want each villain's build tier — reskin, new rig with existing behavior, or bespoke boss — named explicitly during handoff, so that eleven visually distinct Wardens don't balloon into eleven bespoke state machines.

**New enemies**

14. As a hunter, I want a charger that punishes standing still, so that early gates teach movement before later ones demand it.
15. As a hunter, I want an armoured enemy that shrugs off light attacks and breaks to the launcher, so that a move I was taught early acquires a new reason to exist later.
16. As a hunter, I want a summoner that must be prioritised over what it summons, so that target selection becomes a decision.
17. As a hunter, I want each new archetype introduced alone, in a safe encounter, before it is combined with others, so that I learn each tell in isolation.
18. As a hunter, I want a genuinely new enemy silhouette to still move like something I recognize, so that a new rig never costs me a new tell to learn on top of a new look.
19. As a hunter, I want every new enemy to obey the rule that nothing harms me by touching me, so that the game's load-bearing combat rule holds without exception across all fifteen gates.
20. As a hunter, I want every new enemy to leave a remnant, so that SORGI's promise is not selectively true.

**Traversal**

21. As a hunter, I want vertical, layered gates built entirely from jumping and double-jumping, so that climbing a gate never asks me for a control I don't already have.

**Progression and persistence**

22. As a hunter, I want my cleared gates remembered when I close the game, so that a fifteen-gate campaign is playable in the sessions a phone actually affords.
23. As a hunter, I want my rank carried between gates, so that ascending through the acts feels like growing rather than like the enemies inflating.
24. As a hunter, I want never to be given a new button, so that the controls I learned in gate 1 are the controls I finish with.
25. As a hunter, I want to replay a cleared gate, so that a gate I rushed is not lost to me.
26. As a hunter, I want my best style rank per gate remembered, so that there is a reason to return to a gate I have already cleared.
27. As a hunter, I want a teaching line I have already seen never shown again, so that persistence makes the tutorial quieter rather than louder.

**Monetisation**

28. As a player, I want ads at gate boundaries rather than during a gate, so that an interruption never costs me a fight.
29. As a player, I want no more than one interstitial per two to three gate clears, so that a short gate is not bracketed by advertising.
30. As a player, I want the option to watch a video for a second wind when a boss kills me, so that a wall I am close to clearing is not where I stop playing.
31. As a player, I want that offer only in boss arenas and only once per attempt, so that the rest of the game remains a test of what I can do.

**Text**

32. As a developer, I want every player-visible string in one module, so that translating the game later is a mechanical job rather than an archaeology project.

## Implementation Decisions

**A gate is a descriptor; `Level` takes one.** Geometry, encounters, per-gate constants, palette and Warden/boss configuration live in one object per gate under `src/game/gates/`. Unchanged from the ten-gate build; this is the seam gate 1 already moved through with zero behaviour change.

**Regular-enemy classes stay architecturally untouched.** The five existing `Enemy` subclasses — `Raakchyas`, `Charger`, `Kawach`, `BhootBatti`, `Tantrik` — are sufficient for the entire fifteen-gate roster. Every reskin across all four acts is a `skin`-object config change on an existing `buildX()`, zero new geometry. No new `Enemy`-tier base class is needed anywhere in the campaign.

**Villain builds use three tiers, not two.** The old "Wardens are configuration, not code" / "bosses subclass, they do not copy" split turned out to need a middle tier once eleven Wardens' research entries assumed distinct silhouettes (serpent, giant, grappler, three functionally distinct heads) that a `skin`-param reskin can't deliver:

1. **Reskin** — existing `buildX()`, new `skin` object, zero new geometry. Every regular enemy in the campaign, and most Wardens.
2. **New rig, existing behavior** — new `buildX()` in `models.js`, the enemy class still extends an existing `Enemy`/`Charger`/`Kawach`-style behavior, no new state machine. Used for eleven of the fifteen Wardens, and, for the first time on a *regular* enemy rather than a Warden, the Lanka soldier (extends `Kawach`) and the Mathura wrestler (extends `Charger`).
3. **Bespoke `Boss` subclass** — new rig plus a new state machine, attack list and pose table. Reserved for the four locked bosses only: Duryodhana, Ravana, Hiranyakashipu, Mahishasura.

Full workflow — written-description template, session-only reference images, tier call made explicit during handoff — is `docs/agents/villain-handoff.md`.

**The four bosses are new subclasses against `boss.js`'s existing shared infrastructure, not renames of the old five.** `boss.js` currently holds five `Boss` subclasses built for the old ten-gate spec (`Guardian`, `GoruMukh`, `Hakim`, `Chiranjivi`, `MaunAnkur`) — one more than the new roster's four bosses need, but not a 4-of-5 rename: each new boss's kit (Duryodhana's held prop, Ravana's four-weapon rotation, Hiranyakashipu's boon-window, Mahishasura's pose-level transform) is its own new fight built against the shared telegraph-state vocabulary (`sweeping`/`leaping`/`volley`/`slam`, the shared `_enrage()` hook), not an old boss's content relabeled. Author all four fresh, reusing that shared vocabulary, and delete the old five outright once all four exist and no gate references the old names. This retires **Guardian** — gate 1's original, most-tested boss — along with the rest: gate 1 becomes Shakuni's Warden gate under the new roster, and none of the four new bosses is a renamed Guardian.

**Verticality is existing collision plus richer geometry, with one authoring catch.** Prototyped on `?vtest` (branch `prototype/vertical-traversal`): `Actor.moveAndCollide`'s AABB resolver and `Level.groundAt` already support stacked ledges, a top-tier gap, and a long multi-tier drop, using only jump and double-jump — no new collision primitive. **The catch:** a stacked ledge needs an explicit thin `thickness` (the per-segment field already exists) or its default full-depth body becomes an unclimbable cliff wall, not a mezzanine — hit on the first geometry written, not hypothetical. **`tools/gatecheck.js`'s `edge()` reachability check does not catch this** — it certified both the broken and fixed versions of the same descriptor as fully reachable, since its x-overlap case never checks headroom. `edge()` needs a check added (upper segment's underside, `top - thickness`, must clear the lower segment's top by the player's height plus margin, over their shared x-range) before any of gates 02, 04, 07, 09, 13 lean on stacked geometry — **not yet fixed**, a prerequisite for authoring those gates safely. Fall-through and moving platforms remain unsupported and unneeded for any gate above.

**Dialogue is one unified, paged, hard-freezing mechanism.** `Game.update()` stops entirely — the same mechanism `resting`/RESUME already uses — the moment any dialogue box opens, for every dialogue window in the game: the old split between timed non-blocking `hud.window()` and RESUME-gated `storyWindow()` collapses into one. One box on screen ever; Enter or a screen tap advances one line at a time. Trigger is HP-threshold only: each boss/Warden's single `enrageAt` generalizes into an ordered `phases` list, reusing the existing HP-crossing check in `Boss.takeHit`. `at: 'phase-transition'` becomes a legal `gate.beats` value, fired via a new `ctx.onPhaseTransition(idx)` hook into the existing `_fireBeats` — the one `at` value exempted from the "never open during `activeEncounter`" refusal that still holds for `enter`/`cleared`. `Bot.step()` needs a line mirroring the existing `if (game.resting) game.restResume()` to auto-advance an open phase-transition window, or seeded runs hang on the first threshold crossing.

**Allocate nothing during a run — unchanged, now scoped to fifteen gates.** Gate teardown and construction happen outside the seeded stream; the suite's `GATE TRANSITION` draw-counter row proves it and needs updating for the new gate count the moment the eleventh gate is wired in, not deferred to the end.

**Persistence is `localStorage`, holding as little as possible.** Cleared gates, hunter rank, best style per gate, seen-teaching-lines, settings — unchanged mechanism, now covering fifteen gates' worth of state instead of ten.

**Strings live in `src/ui/strings.js` as a flat keyed object.** Unchanged.

**Palette becomes per-act.** The lerp mechanism (`DECISIONS.md` § Art direction) is unchanged; its endpoints move into a per-act base register (table above) rather than a per-gate one, intensifying toward each act's boss gate, with gate 15 echoing gate 1 as the campaign's single payoff.

**Every gate is authored against the touch budget** — no required chord, jump margins at or above 25% reserve, never a direction plus two buttons at once — unchanged, enforced by the suite.

**Gate descriptor files: ten rewritten in place, five genuinely new.** `gate1.js`–`gate10.js` exist today holding old ten-gate content and keep their file/code scaffolding, content rewritten inside them. `gate11.js`–`gate15.js` are new files following the identical descriptor pattern. `src/game/gates/index.js`'s gate list grows from ten entries to fifteen.

**Recommended build order: gate-by-gate in campaign order, 1 through 15**, rather than by code layer or by tier. This matches the campaign's own complexity ramp — Act 1's reskin-only gates validate the simplest tier before Act 2 introduces the first new rig and the first combination encounter, Act 3 introduces the first new regular archetype and phase-transition-without-rig-swap, and Act 4 closes with the only pose-level transformation and the only hunter dialogue — so each new mechanical pattern's first instance becomes a natural checkpoint the `?sim` suite can validate incrementally, rather than fifteen gates' worth of new code landing in one changeset with one combined failure surface.

## Testing Decisions

**Tier 1 — static checks, all fifteen gates, every run.** Gap widths against the measured reserve ratio; spawn points clear of barriers and each other; a reachability proof from spawn to exit; no encounter lock that can strand the player; every enemy type referenced by a gate actually exists. **`edge()`'s reachability search needs the headroom/thickness check named above before it can be trusted on any gate with stacked geometry** — currently a real gap, not a hypothetical one, and gates 02, 04, 07, 09 and 13 all lean on that geometry.

**`solo debut`, extended to two new-rig regular archetypes.** The Lanka soldier and the Mathura wrestler are visually new even though they extend `Kawach`'s and `Charger`'s existing behavior, so both still need the check: each must meet the hunter alone before ever appearing in a combination encounter (Lanka soldier at gate 07 before gate 08; Mathura wrestler at gate 09, which never combines it with anything).

**`telegraphs`, extended to fifteen gates and four new boss tunings.** Every enemy's wind-up measured against the same 250 ms reaction latency the playthrough bots run at. Trishiras's all-seeing-head standing-tracking override and Mahishasura's pose-level mid-fight transformation are both genuinely new mechanics distinct from any cooldown-gated attack the suite currently probes — flagged as needing suite extension when their gates are built, not solved here.

**Tier 2 — one full-campaign playthrough, carrying a shadow, now fifteen gates.** A single bot plays all fifteen gates end to end, unchanged rationale: a per-gate harness is structurally blind to state `reset()` doesn't clear.

**Tier 3 — deep analysis on a designated sample.** Recommended candidates, flagged by the acts that introduced them rather than decided here: the **Mathura wrestler** and **Hiranyakashipu** (Act 3 — a genuinely new archetype and a state-gated rather than cooldown-gated damage window), **Trishiras** and **Mahishasura** (Act 4 — a wholly new mechanic and the only boss whose rig itself changes pose mid-fight). Whoever selects the sample chooses among these, not necessarily all four.

**The telegraph gap stays a distribution claim** — paired runs across twenty-four seeds, Wilcoxon signed-rank at p < 0.05 — unaffected by the campaign's expansion; reasoning and results in `DECISIONS.md`.

**New suite probes go last in `runAll`.** Unchanged. Boss sweeps sit last of all, since the `+shadow` half allocates a rig per run.

**`storyBeats()` gains three assertions and `Bot.step()` gains one change**, per the dialogue mechanism above: `'phase-transition'` is the only beat kind ever allowed `liveEncounter: true`; each configured threshold fires exactly once (no dupes when one hit crosses two thresholds, no orphans, per issue #32's precedent); `'enter'`/`'cleared'` are still refused mid-encounter. `Bot.step()` needs the `resting`/`restResume`-style auto-advance or seeded runs hang on the first threshold crossing.

**The Guardian re-tune finding no longer applies — Guardian is retired.** The old spec's "Guardian keeps the numbers it has" measurement (kiting wins none of forty runs at 250 ms latency) was a finding about gate 1's original boss. Guardian is one of the five old `Boss` subclasses retired per Implementation Decisions above; gate 1 has no boss under the new roster. The measurement technique — paired seeds, real bot latency, not a zero-latency point estimate — is what should carry forward into tuning the four new bosses, not the number itself.

## Out of Scope

- ~~**Touch controls themselves.**~~ **Built 2026-08-04.** Seven controls for seven verbs, authored against the budget, layout as a descriptor the suite checks. See `DECISIONS.md` § The touch scheme.
- **The Android build.** Capacitor or TWA wrapping, Play Console setup, ad SDK integration. Sequenced to start only after this redesign lands, per `DECISIONS.md`.
- **Translation.** Strings are centralised; nothing is translated.
- **Any new player verb.** The moveset is frozen at seven, permanently — verticality comes from geometry and existing verbs only.
- **A relic, equipment or shop layer.** Refused on record.
- **Mid-gate saving, cloud saves, accounts, leaderboards.**
- **Per-gate music.** Already its own decided, in-progress thread (`DECISIONS.md` § "Per-gate music extends the Nepali naming precedent"), scoped today to the old ten gates and needing a gate-count update, not a redesign, when that thread resumes. Its Nepali-instrument-timbre choice is about sound, not villain naming, and is unaffected by the shift to real villain names.

## Further Notes

**The per-gate human playtest checkpoint is retired** (`DECISIONS.md` § "Amended 2026-08-08"), superseding the old spec's step-4 checkpoint. Tier 1 and `?sim` clean across the five recorded seeds is what gates authoring before a gate is considered built; a human plays the campaign end to end, on a phone, once, after all fifteen gates exist — not once per gate. The same honest risk that amendment named still applies here: if all fifteen gates are authored and the campaign is unplayed at the end of it, the amendment was a rationalisation, not a finding.

**What the campaign is most likely to get wrong.** Not the story and not the seam — those are settled by four acts' worth of grilled decisions and the villain research behind them. Two genuinely new regular archetypes, four new boss tunings, and the `edge()` headroom gap on stacked geometry, validated by one playtester who is also the developer. Every previous round of this project found real problems in exactly that kind of gap, and a problem found at gate 12 now costs whatever share of fifteen gates it touches.

**A note on the source traditions.** The campaign's earlier drafts built on the parts of five mythologies that genuinely overlap — the shared judge, the shared river, the shared doctrine of rebirth — as its frame narrative, and that reasoning still holds for the Wheel/Yama frame itself. What changed is everything *inside* the frame: rather than populating six invented cross-tradition realms with generic antagonists, each of the fifteen gates now tells one real villain's own story from their own source text, researched against primary and close-to-primary material in `docs/research/villain-roster.md`, with a respectful-treatment flag carried per villain where the source material calls for particular care. These are living religions for a great many people, and the difference between building on a real shared architecture and building a theme park out of borrowed iconography is a difference worth maintaining deliberately — this redesign exists because the ten-gate build had started to drift toward the latter.
