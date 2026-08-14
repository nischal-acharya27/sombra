# Research — Hindu epic/Puranic villain candidates for the anthology campaign

Feeds issue #39 (child of the campaign-redesign map, #38). Covers the 7
already-named candidates plus 8 additional candidates verified against
primary epic/Puranic sources, sized to round the roster to ~15 gates. Written
for the roster/order grilling ticket to consume directly, and for whoever
builds procedural geometry off point 3 in each entry.

Every entry below was checked against the actual epic/Purana content (not
paraphrase blogs alone) using at least one reputable secondary source that
itself cites the primary text and, where possible, a translation/summary
source close to the Sanskrit (wisdomlib.org's Purana/Ramayana translations,
valmikiramayan.net, Britannica). Where sources disagree on a detail (Trishira
is the clearest case — see below), that disagreement is stated rather than
silently resolved.

## Recommended cuts, if the roster needs to shrink from ~15

In priority order — cut the first one listed before the second, etc.:

1. **Kaikeyi, first.** She is the one figure on this list who is not a
   monster, was not traditionally "defeated" by anyone (she lives, and in
   most tellings repents), and whose two boons are a legitimate transaction
   she was owed rather than a scheme she engineered from nothing — Manthara
   supplies the malice, Kaikeyi supplies the leverage. She is also the
   weakest structural fit for "every gate ends in a boss fight": there is no
   physical form to build a rig for, and inventing one (a monstrous
   war-queen with a weapon Valmiki never gave her) is exactly the kind of
   free invention `SPEC-CAMPAIGN.md`'s closing note warns against. If the
   roster holds at 15, her gate almost certainly needs to be structured
   differently from the others (see her entry below) rather than smoothed
   into a standard Warden fight.
2. **Trishiras (Vishvarupa), second.** Not because the source is weak — the
   Rigveda account is the best-attested item on this whole list — but
   because it is the one candidate drawn from the Vedic hymns rather than
   the epics/Puranas the other fourteen come from, which makes it the
   hardest to fold into a "Hindu epics" pitch line, and because his
   three-headed iconography visually overlaps Ravana's ten-headed one (see
   his entry's iconography note). Cut here first if the roster needs to
   read as more unmistakably epic-flavored rather than Vedic-flavored.
3. **Narakasura, third.** The strongest thematic candidate to lose *only if*
   more tyrant-king slots need freeing: Kamsa, Hiranyakashipu and Narakasura
   are all "boon/prophecy-protected king oppresses subjects or kin, put down
   by a Krishna-Vishnu-adjacent figure" in shape, and Narakasura is the
   newest addition to that shape rather than one of the 7 already locked in.
   Weigh this against his entry's own case for keeping him: he is the only
   candidate whose defeat is a mass liberation of captives, which resonates
   directly with the campaign's release-the-remnant ending in a way none of
   the other tyrant-kings do.

No other pair on the list duplicates a "shape" this closely; the fifteen
below were chosen to spread across schemer, tyrant-king, elemental/cosmic,
giant, shapeshifter, disguised assassin, cursed monster, and mortal-rival
silhouettes so that a cut past these three should come from wherever the
final story beats need room, not from redundancy.

---

## Ravana

**Source.** Valmiki's *Ramayana*, principally the *Uttara Kanda* (the penance
and the boon) and *Yuddha Kanda* (the war and his death). The definitive
recension for the war narrative is Valmiki's; Tulsidas's *Ramcharitmanas*
(16th c.) is the devotional retelling most Hindi-speaking audiences know
today and frames him somewhat differently (more purely as adharma
incarnate, less of the ambivalent scholar-king Valmiki gives him).

**Conflict, hubris/boon, defeat.** Ravana performed penance to Brahma for
ten thousand years, offering his own heads in fire one at a time; on the
tenth, Brahma stopped him and granted the boon that he could not be killed
by gods, gandharvas, yakshas, or rakshasas — Ravana, contemptuous of humans,
did not think to ask for protection from them. He abducted Sita, precipitating
Rama's war on Lanka. **Traditionally defeated by Rama** — a specific avatar
of Vishnu, and the loophole in the boon exists specifically because Ravana
considered a mortal man beneath asking protection from. A hunter defeating
Ravana sits about as awkwardly against the source as any fight on this list
can: the entire mechanism of his death is "beneath his notice," and the
source's whole point is that the killer had to be an incarnation of Vishnu
for the boon's terms to bite at all. This is worth naming directly rather
than resolving — SOMBRA's hunter is explicitly not Rama, and the fight will
read differently for anyone who knows why "a human" was the one loophole in
the boon.

**Iconography (procedural).** Ten heads (arranged as a crown/fan behind the
main head is the common iconographic solution — see temple art and Ravana
Purnima effigies) and twenty arms are the signature; a ten-head rig is
expensive for this engine's per-boss node budget, so a defensible
compression is 3–5 visible heads arranged in an arc with the others implied
by silhouette/backglow, the way the Guardian's core stands in for a health
bar rather than modeling every wound — resolved via `/grilling` during his
villain design handoff (`docs/agents/villain-handoff.md`), against three
reference images. Two of the three (a South Indian miniature painting and a
devotional digital illustration, both agreeing independently on ten crowned
heads in an arc, twenty fanned arms, rich gold ornamentation) anchor the
build; the third (a Smite game-skin illustration — red skin, a single face
under a horned crown, no ten-heads motif at all) was rejected as the
anchor, since it reads as a generic Western fantasy demon-lord and drops
the one signature the source and both other references agree on, working
against the respectful-treatment note below rather than for it. Silhouette
and scale: `hw ≈ 1.7, hh ≈ 2.0` — the top of the existing four-locked-boss
cluster (matching Goru-Mukh's `hw 1.7` and Chiranjivi's `hh 2.0`), reading
as the largest of the four per "notably larger than a human" while staying
clearly under Kumbhakarna's deliberately-outlier `hw 1.8, hh 2.2` per the
original note's own instruction not to reach his scale; the arm-fan and
head-arc will read wider than the collision box alone, which is fine —
`contactDamage` is 0 roster-wide (Kumbhakarna's precedent), so an oversized
silhouette is a visual/movement-space fact, not a threat multiplier. Skin:
a warm bronze/copper human tone (the devotional illustration's read),
deliberately not the miniature painting's classical blue — blue would sit
too close to the palette's already-heavily-spent blue-violet family
(`raakchyasBody`, `chayaBody`, `bossPlate`/`bossCore`, `wheelPlate`, and
`chargerHide`'s own blue-grey), and every existing rakshasa/asura on the
roster already signals "monster" through an exotic skin tone
(Shurpanakha's ash-grey, Taraka's moss-green-to-black, Bakasura's
sallow-purple, Kumbhakarna's granite-grey) — exactly the flattening the
respectful-treatment note warns against applying to Ravana specifically.
A human skin tone makes the same move Kumbhakarna's actual-face read did
for his own note: it argues "person," and leaves the ten-heads/twenty-arms
attribute to carry the "not merely human" read on its own. New Lanka-court
palette entries: `lankaSkin` (bronze), `lankaPlate`/`lankaPlateDark`
(heavy gold, more ornate than Duryodhana's Kuru-court gold-bronze, per
"richly adorned" being explicit here where it wasn't for him), `lankaRobe`
(a dark crimson/vermillion accent, both references' red-and-saffron
drapes), and `lankaCore` (the per-head telegraph flare — see Kit shape —
in the game's existing warm amber/gold danger family, distinct from
Duryodhana's crimson `kuruCore` the way each locked boss's core is its own
hue within that shared family, not a reused value).

Signature weapon: not one prop but four, each independently corroborated
by a reference image and each swung by a dedicated arm-pair rather than
held as static flavor — the twenty-arms motif made mechanical rather than
decorative. The **Chandrahas** ("moon laughter") curved sword remains the
core signature (present in both anchor references); **trishul** (trident,
both anchor references) and **chakra** (discus, the miniature painting)
join it; a fourth hooked mace visible in the miniature painting was
dropped deliberately — Duryodhana's entire signature *is* a gada, and a
second locked boss swinging one, even as one of four, dilutes his one
identity — in favor of a **torch/flame implement** (the devotional
illustration), whose fire needs its own hue distinct from the hunter's own
`aagoCore`/`aagoGlow` so the two don't read as the same attack from
opposite sides. Remaining arms beyond these four stay static ornament,
compressed the same way the heads are. Chandrahas's boon-gift-from-Shiva
origin (Ravana shakes Mount Kailash, is pinned under it, sings penance,
is forgiven and gifted the sword) is usually placed in the *Uttara Kanda*
— the same book this entry's Source field already leans on for the
penance/boon material generally — but the episode's provenance within
Valmiki's own hand specifically (as opposed to a later Puranic elaboration
within that book) isn't cleanly verifiable; worth citing as "per the
Uttara Kanda tradition" rather than asserting it flatly.

**Kit shape.** Melee-and-ranged weapon-rotation, tier 3 so there is no
existing behavior class to fit into (unlike a tier-2 call) — a new state
machine regardless. The four weapons map onto the telegraph vocabulary
already shared by Guardian/Goru-Mukh/Hakim/Chiranjivi (`boss.js`'s
`sweeping`/`leaping`/`volley`/`slam` states, reused shapes reskinned per
weapon rather than new mechanics per attack): Chandrahas → sweep
(close-range slash), trishul → lunge (reach thrust, closes distance),
chakra → volley (ranged spinning throw), torch → slam (AOE ground-fire
smash). Each weapon's telegraph is tied to a specific head in the
compressed 3–5-head arc rather than one shared chest-core flare like the
other three locked bosses use — the head nearest the active arm bares its
teeth and flares `lankaCore` before that attack commits. This is the one
place the "compress ten heads to 3–5, implied by silhouette" call gets to
do more than save geometry: it makes the extra heads functional, something
the player learns to read individually, rather than a decoration that
stops registering once the initial "ten heads" beat has landed.

**Phase-transition flag.** No rig-swap transformation — unlike the
Wardens, there is no curse/disguise premise in the source to dramatize a
reveal, and Duryodhana (the one other tier-3 precedent) landed on the same
"none" call for the same reason. But the shared `Boss._enrage()` hook every
locked boss already has (core-color swap, speed/windup multipliers,
cooldown reduction) carries two Ravana-specific payloads at its threshold
rather than only a palette change: the implied/backglow heads intensify,
baseline 3 visible heads becoming 5 at the threshold, spending the
node-budget compression as an actual escalation beat instead of a fixed
decoration; and the threshold fires a paged `_fireBeats`/`storyWindow`
dialogue beat (`docs/DECISIONS.md`) — the first use of that machinery by a
locked Boss rather than a Warden (Taraka, Shurpanakha and Kumbhakarna are
its three prior consumers, all Wardens), confirming the mechanism was never
actually tier-locked. This is the concrete mechanical spot the
respectful-treatment note's "let him articulate his own case" lands on,
the same way Kumbhakarna's counsel-refused beat gave his own note a home
instead of leaving it as a suggestion.

**Tier call.** 3 — bespoke `Boss` subclass, per issue #40's locked
four-boss list (Duryodhana, Ravana, Hiranyakashipu, Mahishasura). Not
actually a live decision for this entry, the way Duryodhana's and
Bakasura's/Shakuni's entries note tier 3 or tier 2 was never in play for
them either.

**Respectful-treatment note.** Ravana is not read as a simple villain
across the tradition — he is a Brahmin, a scholar of the Vedas, a devotee
of Shiva (the Shiva Tandava Stotra is traditionally attributed to him), and
in parts of South India and Sri Lanka he is venerated rather than reviled
(Ravana Purnima). A flat "evil demon king" treatment flattens a genuinely
ambivalent figure the tradition itself argues about, and the design above
answers it with two concrete homes rather than leaving it as an unused
flag: the bronze-skin, no-monster-coding palette call keeps the *design*
from reading as generic demon before he has said a word, and the
enrage-threshold dialogue beat is where he actually gets to speak in his
own voice. The harder half of the note — the fight sits awkwardly against
the source because the boon's loophole exists specifically because Ravana
considered a mortal beneath asking protection from, and SOMBRA's hunter is
explicitly not Rama — isn't something a win condition can resolve, and
shouldn't be resolved mechanically (no invented "the hunter is secretly
non-human" escape hatch; nothing else in this game's fiction earns that).
It belongs in the same dialogue beat instead: a line where Ravana registers,
mid-fight, that he is dying to someone he wrote off — named directly, left
unresolved, the way the note itself asks.

---

## Kamsa

**Source.** *Bhagavata Purana*, Book 10 (the most detailed and widely used
telling of Krishna's early life); also *Harivamsa* and *Vishnu Purana*.

**Conflict, hubris/boon, defeat.** A tyrannical king of Mathura and maternal
uncle to Krishna. A celestial voice prophesied that the eighth child of his
sister Devaki would kill him; Kamsa imprisoned Devaki and her husband
Vasudeva and killed each of their children at birth. The seventh (Balarama)
and eighth (Krishna) were smuggled to safety. **Traditionally defeated by
Krishna** himself, as a youth, at a wrestling tournament Kamsa staged in
Mathura — pulled from the throne and killed. This is one of the cleaner
avatar-specific defeats on the list: the entire premise depends on the
victim being the very child the prophecy named, so a generic hunter closing
the loop is a real substitution, not a minor one. It reads more workable
than most, though, because Kamsa's court and cruelty exist independent of
the prophecy — a hunter can plausibly end a tyrant's reign even if they
can't complete the specific prophecy.

**Iconography (procedural).** A human tyrant-king, not a monster —
overbuilt, armored, physically imposing rather than supernatural in form,
resolved via `/grilling` during his villain design handoff
(`docs/agents/villain-handoff.md`), text-only — no usable reference image
was found, following Taraka's and Kumbhakarna's precedent for an entry
worked from description alone. Silhouette and scale: `hw 0.58, hh 1.05` —
roughly 1.7× the hunter's `hh 0.85` and 1.6× their `hw 0.34`, the bulkiest
human-scale silhouette on the roster, deliberately well short of
Kumbhakarna's giant `hw 1.8, hh 2.2` and even short of the tier-3 bosses'
`1.5–1.7`/`1.9–2.05`, keeping the "bigger than the hunter, not monstrous"
call the original research note made. Rather than reading as generic
overbuilt regalia, the armor is built from the iconography of the cell he
kept Devaki in: a barred gorget collar around the neck (literal bar-shapes,
not a smooth ruff), heavy shackle-cuffs at both wrists worn unused as
regalia — he is the jailer, not the prisoner, and the irony is the point —
a loose chain drape looped from both pauldrons across the chest, and an
iron circlet-crown with bar-like spikes rather than the gold/jewels
Duryodhana and Ravana each already claim, so the "king" read comes from
the same jailer-iron identity rather than competing with either on
opulence. New Mathura-court palette entries: `mathuraPlate` (`0x332618`,
dark bronze/near-black armor base) and `mathuraPlateDark` (`0x1a130b`),
`mathuraIron` (`0x6e7176`, cold grey for the bars/shackles/chain/crown —
deliberately the coldest, least "regal" material on the roster, so the
prison-iron reads as bolted onto the armor rather than matching it), and
`mathuraSkin` (`0xc9946a`, a human tone distinct from both the hunter's own
and Ravana's `lankaSkin` so the two human-coded villains don't visually
merge). The attack telegraph reuses the roster's shared damage-signal amber
(`0xffb347`, already carried by Bakasura's hands, Taraka's eye,
Shurpanakha's eye and Kumbhakarna's eyes), flaring at his eyes and at the
mace-head before either move commits, rather than inventing a new accent.
Signature weapon: a mace whose striking head is a fused mass of
shackle-iron — cuffs and chain-links hammered into the head — settling the
original note's open "mace or heavy sword" question in favor of the mace,
both because blunt/crushing suits "monstrously strong" better than a blade
and because it lets the weapon carry the prison-iron identity the way the
armor does, rather than sitting apart from it as an unrelated prop.

**Kit shape.** Extends `Enemy` directly, the same chase → telegraph →
attack → recover skeleton Kawach, Bakasura and Kumbhakarna reskin, not
`Charger` — a heavy armored king is the opposite of `Charger`'s speed
identity. Two moves picked by range: a close-range overhead mace smash
(the shackle-iron head coming straight down, the "commit" move), and a
mid-range chain lash — the shoulder-chains snapping out as a reach attack,
telegraphed by an audible/visual rattle before the strike. The chain drape
does double duty as armor motif and second weapon rather than sitting on
the rig as pure decoration.

**Phase-transition flag.** None — no boon, no reveal or transform, the
same call Duryodhana's entry landed on for the same reason: no
curse/disguise premise in the source to dramatize, and Kamsa is
traditionally defeated at a wrestling match, not unmasked as something
else. He still carries the ordinary
`enrageAt`/`enrageSpeedMul`/`enrageWindupMul` every Warden already has —
tighter mace wind-ups and a faster chain-lash as he's cornered, reading as
a paranoid king who feels the prophecy closing in rather than a rig or
palette swap. Unlike every other phase-transition entry on the roster so
far (Taraka, Shurpanakha, Kumbhakarna, Ravana, and even Duryodhana's
plain-enrage case), this session deliberately declines to commit the
enrage threshold as a dialogue-beat hook — see the respectful-treatment
note below for why.

**Tier call.** 2 — new rig in `models.js`; the enemy class extends `Enemy`
directly, reusing Kawach/Bakasura/Kumbhakarna's chase → telegraph → attack
→ recover skeleton, with the shackle-iron mace smash and range-picked
chain lash as the kit departures. Tier 3 was never in play: reserved for
the four locked bosses per issue #40 (Duryodhana, Ravana, Hiranyakashipu,
Mahishasura), and Kamsa isn't on that list.

**Respectful-treatment note.** Low risk — a fairly uncomplicated tyrant
across the tradition, without the reception controversies Ravana or
Mahishasura carry. Worth avoiding turning the infanticide backstory into
spectacle in dialogue or environment art; it can be referenced without being
staged. This session's design takes that caution further than the original
note asked: every other phase-transition or enrage-threshold entry on the
roster (Duryodhana included) commits its escalation moment as a
dialogue-beat hook that gives the respectful-treatment note "a mechanical
home." Kamsa's deliberately does not — manufacturing a beat here risks
doing exactly the staging the note warns against, since there is no
version of "a line about the infanticide" that isn't spectacle. The armor
and weapon carry the backstory instead, worn as unused regalia rather than
performed as narration; if a future session wants a line, it should be
about the prophecy and his fear of it, not the children.

---

## Mahishasura

**Source.** *Devi Mahatmya*, embedded in the *Markandeya Purana* — the
central Shakta text for this figure and the scriptural basis for Durga Puja
and Navaratri.

**Conflict, hubris/boon, defeat.** A shapeshifting buffalo-demon who received
a boon from Brahma that he could not be slain by any man or god. He
conquered heaven; the assembled gods, unable to counter a boon that
excluded every male deity, combined their energies to create Durga — a
being outside the boon's terms. The battle lasted nine nights (the
scriptural basis of Navaratri); Durga killed him on the tenth with her
trishula while he was mid-transformation between buffalo and human form.
**Traditionally defeated by Durga specifically because she is female and
the boon only excludes men** — this is the single most awkward defeat on
the list to hand to a hunter of unspecified gender, because the mechanism
of the victory is literally "a being the boon's wording didn't anticipate."
Any framing should either sidestep restating the boon's exact wording or
lean into the hunter being an entirely different category of combatant
(neither man nor god) rather than imply they closed an identical loophole.

**Iconography (procedural).** A buffalo-human hybrid mid-transformation is
the signature image in classical art (Mahishasuramardini imagery shows him
half-emerged from a buffalo body, sword in hand). Procedurally: a
heavy-shouldered humanoid torso on a rig with bovine head geometry (curved
horn cylinders, a broadened box-skull), and a secondary "true form" —
a quadruped buffalo silhouette — as an alternate pose or phase-transition
state, mirroring how the existing bosses use enrage as a form-shift moment.
Large scale, animal-dark palette (charcoal/umber) with something
supernatural bleeding through (a Devi-associated color, gold or crimson, at
the phase break) to visually cue the transformation the myth is built on.

**Respectful-treatment note.** This is the highest-flag entry on the list.
Adivasi and Dalit communities in parts of India observe *Mahishasur
Jayanti* / *Mahishasur Shahadat Diwas* ("Mahishasura Martyrdom Day"),
honoring him as a wronged ancestral king rather than a demon, and reading
Durga's victory as myth built to justify a conquest — this became a live
national controversy (raised in Parliament in 2016). This is not a fringe
reading; it is a real, present-day reception split over a figure central to
one of Hinduism's biggest festivals. If Mahishasura goes in the roster, he
should not be written as unambiguous evil-to-be-purged — at minimum the
same narrative nuance given to Kumbhakarna (a being the story itself does
not treat as simply monstrous) is warranted, and it may be worth naming
this contested reception directly to a sensitivity/consult pass before the
gate is written, rather than deciding it alone.

---

## Hiranyakashipu

**Source.** *Bhagavata Purana* (the widest-known telling), with variant boon
wording across the *Vishnu Purana*, *Shiva Purana* and *Vayu Purana*.

**Conflict, hubris/boon, defeat.** An asura king who won a boon from Brahma
through austerity: he could not be killed by man or animal, indoors or
outdoors, by day or night, on earth or in the sky, nor by any weapon. He
grew tyrannical and demanded worship as a god; his own son Prahlada
remained devoted to Vishnu instead. **Traditionally defeated by Narasimha**
— Vishnu's man-lion avatar, who kills him at twilight (neither day nor
night), on a threshold (neither indoors nor out), on his lap (neither earth
nor sky), with claws (not a weapon). This is the most mechanically precise
boon-loophole defeat on the list — the *entire* fight is built out of the
boon's exact wording, so it is also the one where a hunter answering the
same terms is the hardest to justify without either a) restating the
loophole almost verbatim with the hunter standing in for Narasimha, which
reads as diminishing the avatar story, or b) writing an entirely different
victory condition, which then isn't really "how Hiranyakashipu was
defeated" anymore. Worth flagging to the roster/order ticket as needing an
explicit design decision rather than a default.

**Iconography (procedural).** A powerful humanoid asura-king form — regal,
armored, physically dominant — is the base state; the interesting design
opportunity is the boon itself as a mechanic (a boss immune to normal
"where/when" framing, always requiring the fight to happen at a liminal
moment or place, which is a strong signature-move hook independent of the
Narasimha question). Palette: gold and dark red, tyrant-court coded, similar
register to Kamsa but should differentiate — Hiranyakashipu reads more
overtly supernatural/asura than Kamsa's human-tyrant.

**Respectful-treatment note.** Narasimha is a living, worshipped form of
Vishnu (Narasimha Jayanti is observed), not a folkloric detail — replacing
him with the hunter is not neutral the way replacing a generic hero would
be. If used, this may be the strongest candidate on the whole list for
letting the myth's ending *stand* (narrated, shown as backstory/epilogue)
rather than re-enacted by the hunter, precisely because the boon's mechanism
is so specifically Narasimha-shaped that anything else reads as a rewrite
of scripture rather than a reinterpretation of a folk villain.

---

## Shakuni

**Source.** *Mahabharata*, primarily the *Sabha Parva* (the dice game) —
Shakuni's own backstory (imprisonment, the bones) is not in Vyasa's text
itself but is a widely told traditional elaboration found across
retellings and regional performance traditions (Amar Chitra Katha's version
is the most widely circulated modern telling); it should be flagged in any
gate text as popular tradition rather than the base epic.

**Conflict, hubris/boon, backstory, defeat.** No boon — Shakuni's power is
entirely human: grief, patience and a genius for manipulation. In the
popular backstory, Bhishma imprisoned the royal family of Gandhara and
starved them; the dying king had his sons pool their food into Shakuni, the
youngest, so one of them would survive to avenge the family, and (per the
same tradition) Shakuni had loaded dice carved from his father's bones. He
spent decades engineering the dice game that stripped the Pandavas of
their kingdom and the insult to Draupadi that made the Kurukshetra war
inevitable. **Traditionally killed at Kurukshetra by Sahadeva**, the
youngest Pandava — a mortal, not an avatar, which makes this one of the
cleanest defeats on the list to hand to a hunter with no theological
substitution problem at all.

**Iconography (procedural).** Shakuni is a courtier, not a warrior, and his
entire signature is the dice, not combat prowess — the hardest entry on the
list to build a "boss fight" for honestly, resolved via `/grilling` during
his villain design handoff (`docs/agents/villain-handoff.md`). Silhouette
and scale: roughly human/player scale (`hh ≈ 0.85`, matching `PLAYER.hh`),
slight through proportion — narrow build, unarmored — rather than through
stature, so he reads as an aged courtier rather than a lesser creature.
Signature weapon: a single large, ornate die, the one tradition says was
carved from his father's bones — not a set, so the "read it before it
commits" telegraph stays sharp rather than diffuse. Palette: subdued,
courtly, not supernatural on the body (aged cloth, bone, dull gold — none
of the roster's violet/iron/crimson supernatural registers), the odd one
out among mostly-monstrous bosses and worth treating as the point rather
than a gap to fill; the die's shown-face and resolving zone carry the
kit's one saturated danger accent instead, reusing an existing danger hue
rather than inventing a new one so the "this is about to hurt you" read
stays consistent with every other Warden.

**Kit shape.** Ranged/summoned-hazard, not a thrown bolt: Shakuni casts the
die, it lands and shows a face during a windup, then resolves into a
telegraphed zone keyed to that face — a literal mechanical reading of
"loaded dice" and "a genius for manipulation" rather than a die-shaped
reskin of an existing projectile.

**Phase-transition flag.** None. No boon, no reveal/transform — his menace
stays entirely human throughout; escalation comes from the die's
telegraphs tightening (more faces, shorter windows), not a rig or palette
swap.

**Tier call.** 2 — new rig in `models.js`; the enemy class extends `Enemy`
directly, following `BhootBatti`'s keep-distance/windup skeleton, with the
bolt-spawn replaced by the die-cast-and-resolve sequence. Tier 3 was never
actually in play — reserved for the four locked bosses per issue #40 — so
this call follows from the doc's own constraints as much as from the kit
above.

**Respectful-treatment note.** Low risk in isolation, but see the intro:
Shakuni and Kaikeyi are the same *shape* (human political schemer, no
monstrous form, motivated by a grievance the text itself takes seriously)
and having both in the final 15 risks two gates that play identically
despite different casts. If only one survives a trim, Shakuni is the
stronger keep — his story ends in an actual death in battle, giving the
gate a real combat resolution Kaikeyi's story does not have. The "hardest
to build honestly" risk above is resolved by the die-read-and-resolve kit,
not a gap left for a future session to reopen.

---

## Shurpanakha

**Source.** Valmiki's *Ramayana*, *Aranya Kanda*, chapter 18 ("The
Mutilation of Shurpanakha").

**Conflict, hubris/boon, defeat.** Ravana's rakshasi sister. Encountering
Rama in the forest at Panchavati, she took human form, was struck by him,
and proposed marriage; Rama, already married, redirected her to Lakshmana,
who mocked the idea and redirected her back. Frustrated, she reverted to
her rakshasi form and attacked Sita; Lakshmana cut off her nose (and in
some recensions her ears) with his sword — a disfiguring, non-fatal wound.
She fled to her brother Khara, whose subsequent attack (and death) is what
draws Ravana's attention to Sita in the first place — she is the spark, not
the mastermind, of the entire war. **Not traditionally "defeated" by
anyone in the sense the other entries use the word** — she survives,
mutilated, and the text moves on. There is no combat-victory beat to adapt
at all here, which is a structural problem distinct from every other entry:
building a boss fight *and a defeat* for her means inventing a resolution
the source doesn't provide.

**Iconography (procedural).** A rakshasi shapeshifter, resolved via
`/grilling` during her villain design handoff
(`docs/agents/villain-handoff.md`). Reference material: a TV-serial still
for the human disguise — the moment just after the mutilation itself (the
red mark is the wound, not a tilaka), useful regardless for palette — and
two independent pieces of demon-form fan art that disagree with each
other: one gives her ridged horns, ash-grey skin and amber eyes; the other
gives her no horns, blue-grey skin, wild red hair, and stages her at giant
scale, towering over Rama. Resolved by trusting what's textually grounded
over either artist's individual drama, the same tiebreaker Duryodhana's
write-up used for references that disagree. Silhouette and scale:
human-disguise `hw 0.38`, `hh 0.88`, close to `PLAYER`'s own `0.34`/`0.85`;
true form `hw 0.46`, `hh 0.95` — broader and slightly taller than her own
disguise, but deliberately kept **human-scaled**, not giant, overriding
the giant-scale reference specifically to preserve the original note's
differentiation from Taraka (three giant-scaled Wardens back to back would
flatten the roster). Signature weapon: claws, natural rather than wielded,
matching both demon-form references and the source's own language. Horns
are dropped despite one reference having them — the roster already spends
that motif on Charger's windup tell and Bakasura's skull-crest, and the
second demon-form reference draws her without any — in favor of hair as
her one unique silhouette tell: bound and ornate under the headdress in
human form, loose and wild at the reveal, and kept **black in both
forms** rather than the second reference's red, so the transformation
reads as violence done to a person rather than a costume change — the
same logic Taraka's pelts use across her two phases. Palette: human form
lifts directly from the TV-still reference — gold jewelry, a
black-and-white cowrie-shell-banded headdress, a red drape, heavy kohl —
no invention needed. True form: a new pale ash-grey skin (`palette.js` has
no existing collision) marked with dull, dried-blood-maroon vein-cracks
across the face, deliberately duller than the game's danger-red so the
marking never competes with her actual attack telegraph, and an
eye/telegraph accent that reuses the existing `amber` (`0xffb347`),
already the shared damage-signal hue, rather than inventing a new one —
distinct from Raakchyas's crimson eye and Charger's orange despite the
shared vocabulary.

**Kit shape.** One attack, reskinned rather than replaced across the
reveal — not a human kit and a separate monster kit. Pre-reveal, the move
reads as an illusion: a conjured decoy or flash of misdirection lands the
hit. Post-reveal, the identical hitbox and timing plays as a bare-claw
swipe. This resolves a real tension the handoff surfaced: Taraka's
precedent (the roster's only other phase-transition) is explicitly
cosmetic-only specifically to stay tier 2 without a new state machine, and
tier 3 isn't available to Shurpanakha at all — reserved for the four
locked bosses, issue #40 — so a kit that genuinely changed at the reveal
was never a design option, only a presentation one.

**Phase-transition flag.** Yes — the roster's second, after Taraka. Two
rigs (human-disguise, true form), both pre-built at spawn and swapped on a
`visible` flag, never built mid-run. Triggered by an HP threshold,
mirroring `Boss._enrage()` conceptually but implemented Warden-locally in
her own `Raakchyas` subclass, matching Taraka's precedent exactly. Given
the weight the respectful-treatment note below puts on this exact moment,
the swap fires inside the same paused, player-advanced dialogue beat
Taraka's handoff built the machinery for (`_fireBeats`'s per-boss
mid-fight boundary, `docs/DECISIONS.md`) — she is that machinery's second
consumer, not a second bespoke wiring job.

**Tier call.** 2 — new rig in `models.js` for both phases; the enemy class
extends `Raakchyas` directly, reusing its chase → windup → pounce shape
(reskinned as the illusion-feint / claw-swipe pair above) rather than
building fresh timing under `Enemy`. The reuse is thematically exact —
rakshasi is the feminine of the same demon-word the grunt is named for —
with the acknowledged risk that a player who has fought fifty Raakchyas by
this point may clock the shared rhythm.

**Respectful-treatment note.** The second-highest flag on this list. The
disfigurement of a woman for expressing desire, staged as a punishment
that both the hero and his brother are complicit in, is exactly the kind
of beat that reads very differently to a modern audience than it did to
Valmiki's — and it is a live discussion point in contemporary
Ramayana scholarship and feminist readings, not a settled matter. Two
things to avoid if she's used: (1) re-staging the mutilation itself as a
victory the hunter delivers or witnesses approvingly — SORGI's own
framing (a remnant is a soul that did not move on, escorted rather than
punished) is actually a more respectful lens than the source scene itself,
and leaning into "this is a wronged, humiliated soul the Wheel's
stoppage trapped" rather than "monster defeated" would sit better with
both the mechanic and the modern reading; (2) treating her only as
Ravana's-sister-the-catalyst without any interiority, which repeats the
text's own flattening of her into a plot device. The design above answers
(1) directly: the gate's mechanical clear is identical to every other
Warden's (health to zero, standard remnant-clear), but the surrounding
narration — HUD text, the reveal's dialogue beat — uses SORGI's escort
framing rather than victory framing, and the true-form reveal is staged as
a scripted, held beat rather than an instant model swap the player might
cheer through. (2) is not resolved by this session — interiority is a
beat-writing concern, not an iconography one — and is left for whoever
authors her `_fireBeats` dialogue to pick up.

---

## Kaikeyi

**Source.** Valmiki's *Ramayana*, *Ayodhya Kanda*.

**Conflict, hubris/boon, backstory, defeat.** King Dasharatha's favorite
queen, mother of Bharata. Years earlier, she saved his life in a celestial
battle and was granted two boons, unclaimed. When Dasharatha announces
Rama (his son by another wife, Kaushalya) as heir, Kaikeyi's hunchbacked
maid Manthara — jealous and manipulative on Kaikeyi's behalf — convinces
her the boons are her only chance to secure Bharata's throne and Kaikeyi's
own future standing. She invokes them: Bharata crowned, Rama exiled
fourteen years. Dasharatha, bound by his word, is destroyed by the demand
and dies of grief. **She is never "defeated" by anyone** — she lives, and
in most tellings comes to deeply regret the choice once she sees its cost.
There is no combat, no boon-loophole, no monster form, and no antagonist
death anywhere in her story. Of everything on this list, casting her as a
boss to be fought is the largest invention relative to the source.

**Iconography (procedural).** None available from the text — she has no
monstrous form, no weapon, no supernatural trait. Any physical boss rig
built for her is authored whole-cloth rather than drawn from iconography,
which is itself the tell that she may not belong in a moveset-and-arena
format at all (see cut recommendation #1 above). If kept, the honest design
move is probably *not* a combat gate in the usual sense — something closer
to a dialogue/consequence encounter reusing the touch/verb budget
differently, which is a bigger structural ask than "reskin a Warden."

**Respectful-treatment note.** High flag, differently from Shurpanakha's:
Kaikeyi is a grieving, manipulated human mother whose real fault (per
Valmiki's own text) is being talked into cashing in a legitimate debt at
the worst possible moment, not malice. Modern retellings increasingly
treat her sympathetically or even center her (this is a known
contemporary literary trend — retellings that give Kaikeyi her own
justified voice are common). Building her as a "villain" to defeat risks
being read as flattening a figure many current tellings are actively
working to *un-flatten*, which is close to exactly the reductive treatment
`SPEC-CAMPAIGN.md`'s closing note commits to avoiding.

---

## Duryodhana

**Source.** *Mahabharata*, spanning from *Sabha Parva* (the dice game) to
his death in the *Shalya Parva* (the mace duel, "Gada Yuddha").

**Conflict, hubris/boon, defeat.** No boon — the eldest Kaurava prince,
whose resentment of the Pandavas (particularly Bhima and Arjuna's favor)
drives the dice-game humiliation of Draupadi and the war that follows. On
the eighteenth day of Kurukshetra, stripped of army and allies, he hides
in a lake before being goaded out to face Bhima in a one-on-one mace duel.
Bhima, honoring an oath sworn after the dice game to break the man's
thighs, strikes Duryodhana below the waist on Krishna's signal (a
technically illegal blow in mace combat) and kills him; Duryodhana dies
protesting the unfairness of his own death even as the text is clear he
authored the war. **Traditionally defeated by Bhima** — a mortal Pandava,
not an avatar or deity — which makes this the cleanest "hunter could
plausibly be the one who does this" defeat on the entire list. Krishna's
signal to break the rule is present, though, and worth keeping in any
retelling rather than smoothing away, since it is the story's own note
that this victory is not entirely clean.

**Iconography (procedural).** A human warrior-king in full war regalia, not
a monster — the most "human-scale mortal rival" boss on the roster,
physically imposing but not supernatural, contrasting directly against the
boon-monsters around him, resolved via `/grilling` during his villain
design handoff (`docs/agents/villain-handoff.md`), cross-referenced against
a Raja Ravi Varma court portrait and a modern devotional illustration for
grounding. Silhouette and scale: `hw ≈ 0.68, hh ≈ 1.35` — roughly 2× the
hunter's own `hw: 0.34` and 1.6× their `hh: 0.85`, deliberately well short
of the other three locked bosses' `1.5`–`1.7`/`1.9`–`2.0` (Guardian,
Goru-Mukh, Hakim, Chiranjivi), since none of them read as human and he
has to. Signature weapon: a gada, matching the source duel directly and
giving the fight a built-in signature move — a shaft topped with an
ornate knobbed/spiked spherical head, a pointed finial, and hanging
tassels at the neck (both reference images agree on this over a plain
hammer-head), held two-handed and head-down at idle so the boss's body
stays legibly harmless per `boss.js`'s own rule, raised overhead as the
slam's telegraph. A tall, tiered, jeweled crown — not a plain band —
reuses Hakim's "headdress in place of horns" trick but carries the "king"
read in silhouette even before the mace registers. Palette: new Kuru-court
entries in `palette.js` — `kuruPlate` (warm gold-bronze armor),
`kuruPlateDark` (deep maroon/oxblood, not near-black, keeping "regal"
rather than grim), `kuruCore` (a rich crimson gada-head flare — the
telegraph vocabulary every boss carries, kept in the game's existing
danger hue-family so it reads instantly rather than inventing a new signal
color), and `kuruWrap` (a saturated green lower-garment accent — both
reference images independently put him in green at the waist/legs against
gold-bronze armor, worth trusting as his color rather than treating it as
incidental) — deliberately distinct from Kamsa's dark bronze/black
"prison-iron" coding so the two court tyrants don't read as reskins of
each other.

**Kit shape.** Melee weapon-swing — a wielded gada, the first tier-3 boss
to actually swing a held prop rather than attack with its own body
(Guardian, Goru-Mukh, Hakim and Chiranjivi are all body/fist/horn
contact). The against-the-rules low blow that ends the duel in the source
text — Krishna's signal, Bhima's illegal strike to the thighs — stays
narrative-only: it's about Bhima's victory specifically, not a mechanic
the hunter needs to replicate, so it belongs in dialogue/flavor rather
than an unconventional "cheat" attack in the kit.

**Phase-transition flag.** None — no boon, no reveal or transform, matching
his "no monstrous features" iconography above. Escalation comes from the
existing enrage pattern (`enrageAt`/`enrageSpeedMul`/`enrageWindupMul`):
faster, stronger, tighter-telegraphed mace swings as he's cornered, which
reads as a proud king refusing to yield rather than a rig or palette swap.
The enrage transition is also the natural hook for a line about the dice
game or his own grievance, giving a future gate-content session something
concrete to land on rather than a bare "keep him nuanced" instruction.

**Tier call.** 3 — bespoke `Boss` subclass, per issue #40's locked
four-boss list (Duryodhana, Ravana, Hiranyakashipu, Mahishasura). Not
actually a live decision for this entry; noted for the record the way
Bakasura's and Shakuni's entries note tier 2 was never in play for them.

**Respectful-treatment note.** Low risk as source material — Duryodhana is
a mortal antagonist whose flaws (envy, pride, a genuine sense of being
wronged by primogeniture politics) the epic treats with real nuance rather
than pure malice; worth preserving some of that nuance in dialogue so he
doesn't collapse into a generic "evil prince," with the enrage-phase
escalation above as a concrete place to land a line of it rather than a
vague instruction. His death by an against-the-rules blow is itself a
well-known moral complication in the text (it's part of why the Pandavas'
victory is not depicted as unambiguously righteous) and is worth keeping
rather than cleaning up.

---

## Kumbhakarna

**Source.** Valmiki's *Ramayana*, principally the *Yuddha Kanda* (his role
in the war) with the boon backstory in the *Uttara Kanda*.

**Conflict, hubris/boon, defeat.** Ravana's giant brother. Performing tapas
for ten thousand years, he intended to ask Brahma for *nirdevatva*
("absence of the gods" — i.e., supremacy), but a slip of the tongue and
the gods' own alarmed intervention left him asking instead for
*nidravatvam* — endless sleep, waking only once a year to eat. He slept
through most of the Lanka war; woken by Ravana in desperation, he tried to
counsel his brother to make peace with Rama and return Sita, was refused,
and fought anyway out of loyalty to his king and kin, killing many before
being cut down piece by piece. **Traditionally defeated by Rama** himself
in the epic's climactic battle sequence. The awkwardness here is milder
than most avatar-specific defeats: Kumbhakarna's death is less about a
boon-loophole only Rama could exploit and more a straightforward battle of
overwhelming force, so a hunter defeating him through skill/attrition sits
more naturally against the source than, say, Hiranyakashipu's does.

**Iconography (procedural).** The clearest "giant" silhouette on the
roster: vastly oversized relative to a human, described as mountain-like,
resolved via `/grilling` during his villain design handoff
(`docs/agents/villain-handoff.md`), text-only — no reference image was
used, following Taraka's precedent for an entry with no usable art.
Silhouette and scale: `hw 1.8`, `hh 2.2` — by instruction, made
*exceptionally* giant rather than merely the roster's biggest Warden,
which pushes him past every one of the four locked bosses (`GoruMukh`'s
`hw 1.7` was the prior largest; the bosses top out `hh 2.0`), so he reads
as the single largest silhouette in the game. This intentionally breaks
the assumption Bakasura's own entry left standing — that Wardens stay
under boss scale to preserve the campaign's escalation curve — resolved by
decoupling size from difficulty: `contactDamage: 0` and the no-passive-
contact rule mean his oversized collision box is a movement-space and
visual fact, not a threat multiplier, so a Warden can be physically bigger
than a boss without out-escalating it mechanically. The scale-up
deliberately echoes only Guardian/Boss-rig *proportions*, not its
plate-armor/blank-slit-faceplate identity — Kumbhakarna is built
bare-chested with an actual face, not armored, because the
respectful-treatment note below needs a face to land pathos on, and an
inhuman war-machine read would work against it. Coarse, weathered-granite
grey-brown stone-toned skin, chosen to sit clear of every other giant/demon
tone already on the roster (Shurpanakha's pale ash-grey, Taraka's
moss-green-to-black, Bakasura's sallow-bilious-purple). Minimal warrior
garb — a wrap, at most simple bracers — and deliberately no jewelry,
the inverse of Bakasura's bone-jewelry-heavy read, reinforcing the
"sleep-boon simpleton" framing through absence rather than another motif.
Disheveled hair and beard. Default character read is heavy-lidded, groggy
eyes — just woken from a years-long sleep — which flare the roster's
shared damage-signal amber (`0xffb347`, already carried by Bakasura's
hands, Taraka's eye and Shurpanakha's eye) as the attack telegraph, rather
than inventing a new accent. Signature weapon: settles the original note's
open "bare hands or an uprooted tree/club" question in favor of the
club/uprooted tree — bare hands would leave him sharing both Bakasura's
`Enemy`-extension shape *and* Bakasura's unarmed identity, so the wielded
weapon is what keeps the two giants distinct at the kit level and not just
in geometry.

**Kit shape.** Extends `Enemy` directly — the same chase → telegraph →
attack → recover skeleton Kawach and Bakasura already reskin, not
`Charger`: a "straightforward committed heavy swing" is the opposite of
`Charger`'s speed identity, already spent on Taraka. Two moves picked by
range, the same shape as Bakasura's grab-slam/tackle pair: a close-range
heavy downward smash with the club, and a longer-range horizontal
sweep/lumbering tackle for reach, so the fight doesn't collapse into a
single fixed engagement distance.

**Phase-transition flag.** Yes — the roster's third, after Taraka and
Shurpanakha, but a different mechanism than their two-rig, visible-flag
swap: one rig throughout, an HP-threshold enrage that changes only pose,
speed and palette, mirroring `Boss._enrage()` conceptually (Guardian's own
`enrageAt`/`enrageSpeedMul`) but implemented Warden-locally, the same way
Taraka's and Shurpanakha's transitions are. Opens groggy — slower
telegraphs, heavier-lidded eyes, a duller skin sheen — and at the
threshold snaps to fully awake: eyes wide, faster wind-ups, a speed
pickup. The trigger fires a paged, player-advanced dialogue beat
(`HUD.storyWindow`/`Game._fireBeats`, `docs/DECISIONS.md`) — the third
consumer of that machinery, after Taraka's transformation and
Shurpanakha's reveal — staging the text's own beat: he counsels peace, is
refused, and fights anyway out of loyalty.

**Tier call.** 2 — new rig in `models.js`; the enemy class extends
`Enemy` directly, reusing Kawach/Bakasura's chase → telegraph → attack →
recover skeleton, with the offset heavy-swing attack box and range-picked
second move as the only kit departures, plus the HP-threshold enrage state
layered on top Warden-locally rather than routed through the bespoke Boss
state machine — matching Taraka's and Shurpanakha's precedent for keeping
a phase-transition inside tier 2. Tier 3 was never in play regardless of
how boss-like the source material reads: reserved for the four locked
bosses per issue #40, and Kumbhakarna isn't on that list.

**Respectful-treatment note.** Low risk, and arguably the best-positioned
entry on the list for sympathetic writing without any tension against the
source: the epic itself frames him as a loyal, decent figure trapped by
family duty into a war he argued against, forced to choose kin over
conscience. This session gives that candidacy a mechanical home rather
than leaving it as a suggestion for a future one: the enrage-trigger
dialogue beat above *is* the counsel-peace → refused → fight-anyway
moment, staged as the held, player-advanced beat the pathos needs rather
than a name card or a toast the fight talks over.

---

## Taraka (Tataka)

**Source.** Valmiki's *Ramayana*, *Bala Kanda*, chapters 25–26 — notably
this is Rama's *first* demon kill in the epic.

**Conflict, hubris/boon, backstory, defeat.** Daughter of the yaksha
Suketu, granted by Brahma the strength of a thousand elephants. Married to
Sunda; after sage Agastya killed her husband, she and her son Mareecha
attacked the sage in retaliation, and Agastya cursed her from a beautiful
yakshi into a monstrous, cannibalistic form. She subsequently terrorized
the forest that bears her name (Tataka-vana). Sage Vishwamitra, escorting
young Rama through that forest, orders him to kill her — and the text
notes Rama's explicit hesitation to kill a woman before Vishwamitra insists
it is dharma, since she has become something else. **Traditionally killed
by Rama**, as essentially a coming-of-age combat trial rather than a
climactic confrontation — this is one of the lowest-stakes defeats on the
list in the source itself, which may make it easier to hand to a hunter
without displacing a major theological beat, but the framing device (a
teacher ordering a reluctant boy-hero to kill a woman as a dharma test) is
specific to Rama's arc and doesn't map onto the hunter's situation at all.

**Iconography (procedural).** The curse gives a clean two-state design: was
beautiful, is now "distorted, contorted, monstrous" per the source's own
language, resolved via `/grilling` during her villain design handoff
(`docs/agents/villain-handoff.md`). Reference material for the monstrous
form (no usable image found; text description only): "a giant,
hideous-looking cannibal with an imposing, muscular frame capable of moving
at lightning speed," a grotesque distorted face with prominent teeth and an
enraged expression, styled raw and primal — minimal clothing, animal pelts
or a stanpatta, primitive bone/skull jewelry. Silhouette and scale
(monstrous form): `hh ≈ 1.3`, `hw ≈ 0.78` — comparable giant-tier height to
Bakasura's `hh 1.25`, but a narrower, taller ratio (~0.6 vs. his ~0.8) for
an athletic-muscular read rather than his round-bellied one, so the two
giants on the roster don't silhouette the same. "Lightning speed" is built
as a real stat, not flavor: a move speed above the rest of the Warden pack,
distinct from Bakasura's grapple-burst and the actual differentiator
between the two giants at the behavior level, not just the geometry.
Skull/bone-necklace jewelry is dropped for her specifically — Bakasura
already owns that exact motif (spine/vertebra-bead necklace, skull
pendant) — in favor of the reference's other half, raw hide/pelts, which
carries into both her forms as identity rather than corruption. Beautiful
form: no surviving reference either way, so it's built purely from
contrast — human-scale (`hh ≈ 0.9`, `hw ≈ 0.4`, close to `PLAYER`'s own
0.34/0.85), warm and naturalistic rather than desaturated or afterlife-coded,
same pelts, so the swap reads as violence done *to* a person rather than a
costume change. Palette: forest-demon coding on the monstrous form per the
original note — moss-green-to-black skin, bark-brown undertones, an
amber-red enraged-eye accent (distinct from Raakchyas's crimson and
Charger's orange) — kept apart from every existing violet/iron/slate demon
on the roster. Differentiate from Shurpanakha explicitly once she is built:
Taraka reads as physically immense and brutish where Shurpanakha's true
form is closer to clawed-and-fanged but human-scaled, per the original
note.

**Kit shape.** Melee charge/pounce, not grapple-and-hold — claws close the
distance fast rather than wrestling for a throw, so she doesn't repeat
Bakasura's kit on top of already being the roster's other giant. Extends
`Charger` directly (`src/game/enemies.js:387`): its chase → telegraphed
windup → committed lane-charge is already the shape "lightning speed,
closes distance" needs, reskinned as a claw-swipe hitbox instead of a body
check. Identical kit in both curse phases (below) — only the model, palette
and move-speed tells change at the swap, not the attack list.

**Phase-transition flag.** Yes — the roster's first. Two rigs, both built
at spawn and swapped with a `visible` flag (the same pre-built/toggle
pattern `Game` already uses for gate transitions, never built mid-run), not
a single rig with a palette/pose morph. Triggered by an HP threshold,
mirroring `Boss._enrage()` (`src/game/boss.js:105`) conceptually but
implemented locally in Taraka's own `Enemy`/`Charger` subclass — she's a
Warden, not one of the four locked bosses, so this does not touch the
shared `Enemy`/`Charger` base classes. Cosmetic-only: the attack list,
telegraphs and hitbox extents (fixed at the monstrous-form `hw`/`hh` for
the entire fight, not resized at the swap) are identical before and after;
only the rig, palette and speed-tell tightening change. The swap itself is
a scripted beat, not a silent cut: it fires inside a new paused dialogue
beat (see "Boss/Warden dialogue returns..." in `docs/DECISIONS.md`) —
`_fireBeats` gains a per-boss mid-fight boundary, Taraka is its first
concrete use, and the transformation plays out as a held, player-advanced
story-window moment (a brief writhe/contort animation, a distinct
pained/anguished sound cue, not a generic monster growl) rather than an
instant model swap the player might miss. Because the beat pauses the
simulation, there's no fairness concern about the hitbox mismatch during
it — nothing is being fought over while it plays.

**Tier call.** 2 — new rig in `models.js` (both curse-phase meshes, built
up front); the enemy class extends `Charger` directly, per the kit-shape
call above, rather than bespoke chase/commit logic under `Enemy`.

**Respectful-treatment note.** Moderate, carried over and strengthened by
the design above rather than left as an unused flag. The text's own
discomfort — Rama hesitating specifically because she is a woman — doesn't
map onto the hunter's situation (no equivalent hesitation for a hunter who
isn't Rama to inherit) and isn't reproduced in the gate. What does carry
over is her backstory: a curse imposed for defending her husband's memory,
room to write her as a tragic figure rather than a simple monster, similar
in spirit to Kumbhakarna. The HP-threshold reveal makes that legible in
play rather than only in this document — the player directly witnesses the
curse happen to her, in a held dialogue beat she can actually read, rather
than being told about it in backstory text or watching an instant costume
swap.

---

## Bakasura

**Source.** *Mahabharata*, *Adi Parva* (the Pandavas' exile period, at
Ekachakra).

**Conflict, hubris/boon, defeat.** No boon — a rakshasa terrorizing the town
of Ekachakra, extorting a standing tribute of a cart of food plus one
person (to be eaten alongside it) in exchange for not destroying the town
outright. When it's a host Brahmin family's turn to supply the tribute,
Bhima volunteers in the son's place, eats the entire cart of food himself
en route, and when Bakasura arrives enraged, **wrestles and kills him
bare-handed** rather than using a weapon. **Traditionally defeated by
Bhima** — a mortal Pandava — making this, like Duryodhana, one of the
cleanest defeats to hand to a non-divine hunter with essentially no
theological substitution problem.

**Iconography (procedural).** A glutton-demon, not a warrior: heavy-bellied,
oversized, built for a wrestling/grapple kit rather than a weapon kit — the
source is explicit that Bhima beats him unarmed, which is a genuinely
distinct combat shape from every weapon-wielding entry on this list and
worth preserving as a design constraint, resolved via `/grilling` during
his villain design handoff (`docs/agents/villain-handoff.md`). Silhouette
and scale: `hh ≈ 1.25` — visibly larger than any current Warden (Kawach
tops out at `0.76`) but well short of the four locked bosses' `1.9`–`2.0`,
leaving headroom below Kumbhakarna once his own entry is filled in — and
`hw ≈ 1.0`, unusually wide relative to his own height so "heavy-bellied" is
a proportion claim and not just a size one; no current enemy's `hw`/`hh`
ratio comes that close to parity. Differentiate from Kumbhakarna explicitly
in the geometry (rounder, sagging proportions vs. Kumbhakarna's
straightforward oversized-humanoid bulk) and in the moveset (grapple vs.
heavy weapon swing) so the two giant-shaped entries don't read as the same
fight twice. Cross-referenced against a VedicFutura 3D-print sculpt
(*Bakasura – Hungry Man-Eater from Ekacakra*, Printables) once concrete
reference art existed for him: it adds a horned skull-crest helm, kept
despite Charger already owning horns as its windup tell, because
Bakasura's horns sit static on his head as a silhouette/warlord-adjacent
read rather than a telegraph — the two don't compete for the same
combat-readable signal, since Bakasura's own tell stays on the hands (see
below). It also confirms long, loose hair spilling out from under the
helm, a wide fanged grin with heavy jowls for the "predatory glutton" face
read, and — the detail worth keeping — a spine/vertebra-bead necklace
with a skull pendant at the sternum. Signature feature: oversized forearms
and hands, banded in the same stacked bone rings the reference sculpt uses
as bracers, out of proportion even to his own already-large frame — the
actual grabbing instrument for the kit below, and the combat-readable
tell during the windup, the same job Charger's lowered horns or Kawach's
raised shield do for their own commits. Palette: sickly, bruised,
gluttonous — sallow, bilious skin with mottled bruise-purple worked into
the sagging folds, distinct from Raakchyas's clean violet-black and
Kawach's iron-brown so he doesn't read as either a bigger raakchyas or a
rustier Kawach; the oversized hands carry the kit's one saturated accent,
an inflamed, reddened tone, doing the same "this is the part that hurts
you" job Kawach's amber eye does; the bone jewelry — necklace, forearm
rings, helm crest — stays a neutral bleached-ivory so it doesn't compete
with that accent.

**Kit shape.** Grapple, not a hold: no move strips player input or catches
them into a new state — every hit resolves as `Enemy`'s ordinary
telegraphed contact (`takeHit`'s existing knock/launch), just reskinned
through animation and reach so it reads as a throw rather than a swing.
Two committed moves, picked by range the way `Charger` already varies by
distance without becoming a new tier: a close-range grab-slam, the
signature move, with an asymmetric `attackBox` reaching roughly `2×hw`
forward in his facing direction — a genuine threat, not Kawach's bleak
`hw + 0.3` margin that only lands on a player standing still and close —
with negligible reach behind him, since a grab lunges forward, not
sideways; and a shorter-range lunge/tackle for a player sitting just
outside grab distance, so the fight doesn't collapse into "either he's in
grab range or he's not." Both stay inside the tier-2 telegraph → attack
box → recover contract.

**Phase-transition flag.** None. No boon, no disguise or reveal — the
source never shows him as anything but a rakshasa, unlike Mahishasura's
buffalo↔human. Escalation, if wanted, comes from the two moves tightening
(the tackle appearing more often, windups shortening) rather than a rig or
palette swap.

**Tier call.** 2 — new rig in `models.js`; the enemy class extends `Enemy`
directly, following Kawach's chase → telegraph → attack → recover
skeleton, with the offset attack box and second telegraph variant above as
the only departures. No true hold/input-strip state, so no new engine
surface beyond that — squarely inside what tier 2 already covers, and tier
3 was never actually in play regardless: reserved for the four locked
bosses per issue #40, and Bakasura is a Warden.

**Respectful-treatment note.** Low risk — a straightforward folk-tale-shaped
demon story without the reception complications Mahishasura, Shurpanakha
or Kaikeyi carry.

---

## Putana

**Source.** *Bhagavata Purana*, Book 10, chapters 6.

**Conflict, hubris/boon, defeat.** A child-killing demoness sent by Kamsa
to murder the infant Krishna, who had been hidden in Gokul. She disguised
herself as a beautiful woman, entered the household under the guise of
offering to nurse the baby, and had smeared her breast with poison. The
infant Krishna, recognizing her, nursed anyway and drew out her life force
along with the poison, killing her — her monstrous true form reverting and
sprawling across the countryside. Notably, the *Bhagavata Purana* treats
her death as a liberation rather than a pure destruction: because she
approached Krishna in however corrupted a semblance of a mother's role, she
is said to attain a form of salvation ordinarily reserved for the
devoted. **Traditionally "defeated" by an infant Krishna** — this is the
single most avatar-specific, non-transferable defeat on the list. There is
no "hunter" analogue available at all: the entire point of the story is
that ultimate divinity requires no strength, age, or weapon to end a
threat, delivered by a baby. Any hunter-vs-Putana fight is not an
adaptation of this beat so much as a wholly different story wearing her
name and iconography.

**Iconography (procedural).** The clean design hook is the disguise itself:
a beautiful-woman form concealing a true rakshasi form, with the poison
motif as a signature (poisoned "milk"/breath/contact attacks rather than a
conventional weapon) and a nursing/maternal visual register that needs
careful handling (see below), resolved via `/grilling` during her villain
design handoff (`docs/agents/villain-handoff.md`). Reference material: a
V&A-collection Kalighat-style folk painting and a devotional digital
illustration (a third, a Shutterstock stock-art piece, didn't resolve —
bot-walled preview page, no direct image available). Both usable
references stage the nursing tableau directly — the folk painting has her
open-mouthed baring teeth while Krishna feeds at her breast, the digital
piece has him sucking her finger — so neither is usable for pose or
composition, only for the disguise form's garb, jewelry, hair and
expression, the same partial-use precedent Shurpanakha's TV-still set.
Neither depicts a monstrous true form; that half is text-derived only, the
same as Taraka's was. Silhouette and scale: disguise form `hw 0.36, hh
0.86`, essentially `PLAYER`'s own `0.34`/`0.85` — nothing in the source or
either reference suggests she reads as unusual before the reveal, since the
entire premise depends on passing as an ordinary woman. True form: the
source's corpse-sprawling-across-a-great-distance language points toward
giant scale, but the roster already carries three giant-or-giant-adjacent
Wardens (Taraka `hh≈1.3`, Bakasura `hh 1.25`, Kumbhakarna `hh 2.2`), and
Shurpanakha's handoff already overrode a giant-scale reference for exactly
this reason ("three giant-scaled Wardens back to back would flatten the
roster"). Same call here: `hw 0.62, hh 1.15` — bigger and heavier than any
human-scale Warden (Kamsa's `hw 0.58, hh 1.05` was the prior largest) but
read as bloated/swollen rather than towering, so the size increase carries
the "poison filling her body" idea and gives the true form a distinct
silhouette *shape* rather than a fourth tall giant. Signature
weapon/feature: no wielded weapon, natural/motif-based, per the original
note — poison delivered by touch and breath rather than the source's
literal milk, so nothing in the geometry or animation set stages a feeding.
Disguise form's hands carry subtly clawed nails (visible in the digital
reference despite full human dress) as a tell hidden in plain sight, sized
up into full rakshasi claws at the reveal. Palette: disguise form pulls
from the folk painting over the digital piece — bold crimson-and-mustard
striped drape (`putanaRobe` `0xb8283f`, `putanaRobeGold` `0xd9a63c`) rather
than the digital piece's generic gold-on-maroon court look already spent
by Duryodhana and Ravana, with silver jewelry reusing the existing
`bladeSteel` (`0xd7dcea`) rather than inventing a redundant accent, and a
new `putanaSkin` (`0xd1976a`) distinct from `hunterSkin`, `mathuraSkin` and
Ravana's `lankaSkin`. True form: a sickly bile-khaki `putanaTrueSkin`
(`0x8f8a5c`) with a darker `putanaTrueSkinDark` (`0x453f2c`) undertone —
kept off Taraka's moss-green-to-black and Shurpanakha's ash-grey
specifically so the roster's demon skins stay distinguishable at a glance.
A new `putanaToxin` (`0xacd94a`, toxic yellow-green) lights the poison
breath/cloud prop and the true form's mouth/eye glow — distinct from
Taraka's forest palette, `tantrikSigil`'s violet and `aagoCore`'s orange —
while the attack telegraph itself reuses the roster's shared damage-signal
`amber` (`0xffb347`, already carried by Bakasura, Taraka, Shurpanakha,
Kumbhakarna and Kamsa) rather than breaking that convention.

**Kit shape.** Extends `Enemy` directly (`src/game/enemies.js:30`) — the
same chase → telegraph → attack → recover skeleton Kawach, Bakasura,
Kumbhakarna and Kamsa already reskin, not `Charger`: she isn't a
speed-identity chaser, she closes distance as false hospitality rather
than aggression. Two moves picked by range: a close-range poisoned
embrace — arms spreading in an inviting gesture before a committed,
telegraphed grab, satisfying the no-passive-contact rule the same way
every other Warden's melee move does (damage lands on the committed
attack, never on incidental touch) — and a mid-range toxic breath/spit
cloud, a telegraphed exhale that leaves a lingering hazard patch rather
than a direct-hit projectile, punishing a hunter who stands and trades.
Reskinned rather than replaced across the reveal, the same resolution
Shurpanakha's handoff reached for the same structural reason (tier 3 isn't
available and a kit that genuinely changes at the reveal was never an
option): the embrace becomes a claw-grab with identical hitbox and timing,
the breath cloud grows heavier and wider, but the two-move shape and its
range split don't change.

**Phase-transition flag.** Yes — the roster's fourth, after Taraka,
Shurpanakha and Kumbhakarna, and the second two-rig visible-flag swap
after Shurpanakha specifically (Kumbhakarna's was a single-rig
pose/palette enrage, which doesn't fit a disguise premise that needs an
actual different silhouette underneath). Two rigs — disguise, true form —
both pre-built at spawn and swapped on a `visible` flag, never built
mid-run, triggered by an HP threshold mirroring `Boss._enrage()`
conceptually but implemented Warden-locally in her own `Enemy` subclass,
matching Taraka's and Shurpanakha's precedent exactly. The swap fires
inside the same paused, player-advanced dialogue beat their transitions
use (`_fireBeats`'s per-boss mid-fight boundary, `docs/DECISIONS.md`) —
she is that machinery's fourth consumer. Unlike Kamsa's entry, which
deliberately declined to commit its enrage threshold as a dialogue-beat
hook because no version of a line about infanticide avoids spectacle,
Putana's reveal beat is worth committing to: the source hands this
character a genuine redemptive angle (see below), and the reveal is where
it has a mechanical home to land in rather than staying a suggestion left
for a future session.

**Tier call.** 2 — new rig in `models.js` for both forms; the enemy class
extends `Enemy` directly, reusing Kawach/Bakasura/Kumbhakarna/Kamsa's
chase → telegraph → attack → recover skeleton, with the poisoned-embrace
grab and range-picked breath-cloud as the kit departures, plus the
two-rig phase-transition layered on top Warden-locally rather than routed
through the bespoke `Boss` state machine — matching Taraka's and
Shurpanakha's precedent for keeping a phase-transition inside tier 2.
Tier 3 was never in play: reserved for the four locked bosses per issue
#40, and Putana isn't on that list.

**Respectful-treatment note.** High flag, and different in kind from the
others: the source material stages violence around an infant-nursing
tableau, and a boss fight extracted from that imagery risks landing as
grotesque regardless of intent, independent of any theological concern.
The design above answers this directly rather than leaving it as a
caution for later: the poison motif survives entirely through touch (the
embrace grab) and breath (the toxin cloud), and nothing in either rig, the
attack animations, or the reveal beat stages a feeding tableau at any
point — the source's "milk" is abstracted into breath from the first
geometry decision onward, not softened after the fact. Her
redemption/liberation in the source (evil intent notwithstanding, she is
freed by the very act) is worth preserving in spirit — it is an unusually
strong, ready-made fit for SORGI's own "a remnant is a soul released, not
a monster erased" framing, and leaning into that reading is probably the
single best redemptive angle available anywhere on this list. This
session gives that reading its mechanical home: the reveal's dialogue beat
(above) should be written toward release rather than a villainy recap or
a victory the hunter celebrates — the same escort-not-punishment framing
Shurpanakha's reveal beat uses — so the clear plays as the poison finally
leaving her rather than a monster put down. Beat-writing itself is left
for whoever authors her `_fireBeats` dialogue, same as Shurpanakha's
interiority note.

---

## Narakasura

**Source.** *Bhagavata Purana* and *Vishnu Purana*; the associated festival
observance (*Naraka Chaturdashi*, the day before Diwali) is itself a
significant living source of how this story is popularly known.

**Conflict, hubris/boon, defeat.** Son of the earth goddess Bhumi, king of
Pragjyotishapura. Grew tyrannical: defeated Indra, stole the earrings of
the mother-goddess Aditi, seized celestial territory, and — the detail
most retellings foreground — abducted and imprisoned 16,000 women.
Aditi appealed to Satyabhama, Krishna's wife (herself considered an avatar
of Bhumi); Krishna and Satyabhama flew to Pragjyotishapura on Garuda and
killed him, restoring the earrings and freeing the captives, and installed
Narakasura's own son Bhagadatta on the throne rather than annexing the
kingdom. **Traditionally defeated by Krishna** (with Satyabhama landing the
decisive blow in some tellings) — another avatar-specific defeat, though
softened slightly by Satyabhama's mortal-adjacent role in the fight itself.
Of the tyrant-king entries, this is the one whose resolution — a mass
liberation, restoring what was stolen rather than merely killing a threat
— maps most directly onto the campaign's own release-focused ending,
which is worth weighing against the "cut third" recommendation above
rather than treating that recommendation as settled.

**Iconography (procedural).** A tyrant-king form comparable in register to
Kamsa's or Hiranyakashipu's, differentiated by an earth/territorial motif
(his mother is the earth goddess), resolved via `/grilling` during his
villain design handoff (`docs/agents/villain-handoff.md`). Reference
material: five AI-generated fantasy/devotional images, none of them
attested iconography in the sense Putana's Kalighat painting or
Shurpanakha's TV still were — closer to stock-art guesses than a visual
tradition, so treated as motif inspiration only rather than authoritative
pose/composition/material reference. All five independently gave him
large horns despite sharing no other consistent detail, which is at least
weak evidence of a convergent shorthand worth adopting as his
distinguishing silhouette element, since nothing else in the references
agreed. Two of the five also gave him four arms dual-wielding weapons —
rejected rather than adopted: Ravana's entry already owns multi-armed
iconography on this roster (twenty arms compressed to visible arm-pairs,
each swinging a dedicated weapon, "the twenty-arms motif made
mechanical"), and a second multi-armed boss would collide with that
signature directly, on top of the "third identical throne-room boss" risk
the original note already flags. Silhouette and scale: `hw 0.54, hh
1.0` — roughly 1.6× the hunter's `hw 0.34` and 1.2× their `hh 0.85`,
sitting a notch below Kamsa's `hw 0.58, hh 1.05` deliberately so the two
tyrant-Wardens don't read as the same bulk next to each other; the
horn-crown sits outside the collision box as a visual topper the way
Kumbhakarna's tusks and Goru-Mukh's horns already do, so the height read
still lands taller than Kamsa's despite the smaller hitbox. Also worth
naming: Goru-Mukh (gate 3's boss) is already "the Ox-Headed," with a
bestial horned skull, so Narakasura's horns are built growing from an
otherwise humanoid demon face — all five references agree on this — not
a bovine snout, keeping the two from converging on "horned boss" as a
silhouette category. Signature weapon: no single canonical weapon is well
attested across sources; settles the original note's open "spear or
captured-celestial-trophy" question by combining both into one prop
rather than choosing between them — a spear with Aditi's stolen earrings
mounted near the head as a fused trophy, both still flagged as design
invention. This also rules out a third mace-wielding tyrant on the roster
(mace/gada is already spent by Kamsa and Duryodhana) and a second sword
(one of Ravana's four); reach/thrust reads as a mechanically distinct
silhouette from either. New `bhauma*` palette entries — "Bhaumasura," an
attested alternate name meaning "son of Bhumi," chosen specifically
because `naraka*` (`narakaIron`/`narakaCore`/etc.) is already claimed by
gate 3's own realm palette, an unrelated coincidental name match:
`bhaumaStone`/`bhaumaStoneDark` (basalt/root-brown armor plate, not
metal — the "carved from the earth he commands" read, distinct from
Kamsa's iron and Duryodhana's gold), `bhaumaSkin` (warm grey-brown stone
tone, deliberately browner than `mathuraIron`'s cold grey `0x6e7176` so
the two materials don't merge, kept off Taraka's and Putana's greens),
and `bhaumaEmber` (a rust-magma crack accent, ambient/passive only,
referencing the lava-fissure detail one reference carried). The stolen
earrings themselves reuse `devaGold` (`0xf2cf7a`, Deva-lok's own gold)
rather than inventing a fourth royal-gold entry — the one deliberately
wrong-feeling color on his body, since it's looted, not his, making the
theft legible at the palette level rather than only in backstory. The
attack telegraph reuses the roster's shared damage-signal `amber`
(`0xffb347`), flaring at the earrings/spearhead before a thrust, the same
convention every other Warden's weapon-flare already holds.

**Kit shape.** Extends `Enemy` directly, the same chase → telegraph →
attack → recover skeleton Kawach/Bakasura/Kumbhakarna/Kamsa/Putana
reskin, not `Charger` — a territorial king holds ground rather than
speed-chasing. Two moves picked by range: a close-range committed spear
thrust/lunge, telegraphed by the earrings flaring amber before the
step-in, the same "damage lands on the committed attack" shape as every
other Warden's melee move; and a mid/long-range ground-slam with the
spear butt that cracks a line of stone spikes/a fissure toward the
hunter — a telegraphed hazard patch, mechanically the same commit →
telegraph → lingering-danger shape as Putana's breath cloud, but dressed
in the earth motif rather than reused wholesale. This makes the
earth/territorial motif a mechanical decision, not only a palette one —
the same way Putana's poison-as-touch/breath answered her
respectful-treatment note at the geometry level rather than after the
fact.

**Phase-transition flag.** None — no disguise, curse, or transform
premise in the source, the same call Kamsa's and Duryodhana's entries
both landed on: he's a tyrant king defeated in battle, not unmasked as
something else. He still carries the ordinary
`enrageAt`/`enrageSpeedMul`/`enrageWindupMul` every Warden already has —
tighter spear thrusts and faster ground-slams as he's cornered. Unlike
Kamsa's entry, which declined to commit its enrage threshold as a
dialogue-beat hook (no version of a line about the infanticide avoids
spectacle), this session commits it, the same call Putana's entry
reached for the same reason: the research entry calls his
mass-liberation resolution "probably the single best fit anywhere on the
roster" for the campaign's own release-focused ending, which is a
stronger case for giving the theme a mechanical home now than for
leaving it as a suggestion. The beat should foreshadow the coming
liberation — the fortress-hold cracking, the 16,000 captives about to be
freed — rather than a villainy recap.

**Tier call.** 2 — new rig in `models.js`; the enemy class extends
`Enemy` directly, reusing Kawach/Bakasura/Kumbhakarna/Kamsa/Putana's
chase → telegraph → attack → recover skeleton, with the earrings-trophy
spear thrust and range-picked ground-slam hazard as the kit departures.
Tier 3 was never in play: reserved for the four locked bosses per issue
#40 (Duryodhana, Ravana, Hiranyakashipu, Mahishasura), and Narakasura
isn't on that list.

**Respectful-treatment note.** Moderate. Diwali is one of the largest living
festivals this material touches, so accuracy matters more than usual — the
core "tyrant imprisons the innocent, is overthrown, captives freed" arc is
safe and resonant. The epilogue in which the freed women are all married
to Krishna is a real part of the source but is frequently mishandled in
pop adaptations (played as a harem punchline); recommend omitting that
epilogue from any SOMBRA telling and ending the gate's story on the
liberation itself, which is both the stronger story beat for this format
and the one least likely to misrepresent the source. This session gives
that ending a mechanical home rather than leaving it as a closing note:
the enrage-threshold dialogue beat (above) foreshadows the liberation
directly, so the fight itself plays toward the captives' release rather
than only ending there. Beat-writing itself is left for whoever authors
his `_fireBeats` dialogue, same as Putana's and Shurpanakha's interiority
notes.

---

## Vritra

**Source.** *Rigveda* (the oldest source on this entire list, predating the
itihasas/Puranas by centuries) — the Indra-Vritra battle is one of the
Rigveda's most frequently referenced myths, particularly in Mandala 1 and
Mandala 4.

**Conflict, hubris/boon, defeat.** Not a king or a demon of the epic type —
Vritra is a primordial serpent/dragon, the personification of drought,
who coils around and withholds the world's waters. No boon in the sense
the other entries use the word; his threat is cosmic/elemental rather than
political. The gods, unable to defeat him with any ordinary weapon,
approached the sage Dadhichi, who willingly gave up his own bones (having
rendered them harder than any metal through prolonged austerity); from
these, the craftsman god Tvashtri fashioned the vajra, Indra's thunderbolt.
**Traditionally defeated by Indra**, wielding that weapon, in a battle the
Rigveda describes lasting many days — releasing the pent waters back into
the world. This is a deva defeating a primordial force rather than an
avatar-specific "only this one incarnation could do it" story, which makes
the substitution slightly less theologically loaded than the
Rama/Krishna/Durga cases, though Indra himself is still a specific,
worshipped deity rather than a generic hero.

**Iconography (procedural).** The one clearly non-humanoid entry on the
list — a genuine opportunity for a boss silhouette unlike anything else in
the roster: a long serpent/dragon body (a chain of cylinder segments is a
natural primitive-geometry fit), no limbs in the conventional sense,
coiled around or through the arena geometry itself rather than standing in
it. Elemental palette: drought-cracked earth tones, or storm-dark with the
vajra's lightning motif as the telegraph/core-flare equivalent (a bright
crack of light along the coils in place of a chest core). Scale: vastly
larger than a human, more landscape-feature than combatant.

**Respectful-treatment note.** Low risk — Vritra is not a figure with a
contemporary devotional community attached the way Ravana or Mahishasura
are; he reads more as myth-as-natural-metaphor (drought given a body) than
as a still-worshipped or still-contested figure. The Rigveda's stature as
scripture is worth respecting in tone even so — this shouldn't be treated
as "safer because obscure," only as lower-risk on the specific axis of
present-day contested reception.

---

## Trishiras (Vishvarupa)

**Source.** *Rigveda*, with elaboration in the *Brihaddevata* and later
Puranic retellings. **Naming note, important:** this is the three-headed
son of the craftsman-god Tvashtri, distinct from a different, later
figure also called Trishira — one of Ravana's sons in the *Ramayana*'s
*Yuddha Kanda*, killed either by Rama or by Hanuman depending on the
telling (sources disagree, and the *Ramayana* Trishira is a comparatively
minor combatant in the Lanka war rather than a major figure with his own
myth). This entry is the Vedic figure; if the roster/order ticket wants
the Ramayana namesake instead, that is a different, thinner source with
disputed details and should be re-verified separately rather than
conflated with what's written here.

**Conflict, hubris/boon, defeat.** Also called Vishvarupa ("having every
form"), three-headed and the son of Tvashtri, sent by the asuras to
become priest to the devas — outwardly serving Indra's side while secretly
favoring the asuras. Indra, wary of his divided loyalty (and, in some
tellings, his growing power, since each head performed a different
sacred function: one drank soma, one performed Vedic recitation, and one
observed all directions), killed him and had a carpenter behead each of
the three heads to prevent revival; birds are said to have flown from each
severed head, tied to each head's function in life. In retaliation,
Tvashtri created Vritra to avenge his son. **Traditionally defeated by
Indra** — again a specific deity rather than an avatar, and again the
mechanism (killing a divided, secretly-disloyal priest-figure) doesn't
obviously map onto a hunter's situation, though it is a more
combat-legible, less loophole-dependent defeat than Hiranyakashipu's or
Mahishasura's.

**Iconography (procedural).** Three heads, each performing a distinct
function rather than being identical repeats — the strongest design
opportunity here is differentiating the three heads by *behavior* rather
than just count (one could drive a ranged/soma-drinking attack, one a
melee/recitation-chant telegraph, one an all-seeing tracking/aggro
behavior), which both reads as more interesting than a generic
"three-headed monster" and deliberately avoids duplicating Ravana's
multi-head silhouette (see the cut-recommendation note above — differentiate
by *function*, not just head count, if both stay in the roster).
Priestly coding rather than monstrous: robed, ascetic-adjacent geometry
rather than armored or bestial, since he is explicitly a priest-figure in
the source, not a warrior-king or beast.

**Respectful-treatment note.** Moderate — lower profile than Ravana or
Mahishasura in terms of live devotional controversy, but the Rigveda is
the most sacred stratum of Hindu scripture, and Trishiras is explicitly a
priest performing sacred functions (Vedic recitation, soma ritual) even in
his myth's frame as an antagonist — those specific acts (chanting, the
soma rite) probably shouldn't be caricatured as "evil magic" moves without
care, since they're depictions of real ritual practice, not invented
villain flavor.

---

Sources consulted for verification (secondary sources cross-checking or
summarizing the primary texts named per-entry above): wisdomlib.org's
Bhagavata Purana and Valmiki Ramayana translations, valmikiramayan.net,
Encyclopaedia Britannica (*Hiranyakashipu*, *Devi Mahatmya*), Wikipedia
articles cross-checked against the above for names/relations/chapter
citations (*Tataka*, *Trisiras*, *Narakasura*, *Bakasura*, *Shakuni*,
*Shurpanakha*, *Satyabhama*), and reporting on the Mahishasur Jayanti
controversy (Round Table India, Feminism in India, coverage of the 2016
parliamentary exchange).
