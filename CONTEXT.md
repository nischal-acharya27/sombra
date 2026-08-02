# SOMBRA

A 2.5D hack & slash in which a hunter walks into the machinery of the afterlife
and finds it stopped. This file is the project's glossary — what each word
means, and which near-synonyms not to reach for. It is not a spec and carries
no implementation detail; those live in `docs/SPEC-*.md` and
`docs/DECISIONS.md`.

## Structure of play

**Gate**:
One playable level, start to exit, ending in a Warden. The unit the player
clears, the save file records, and the HUD names.
_Avoid_: Level, stage, dungeon, chapter

**Realm**:
The cosmological identity of a gate — which region of the afterlife it is.
Every gate is exactly one realm; the two words are not interchangeable, because
a gate is a thing you play and a realm is a place that exists whether or not
you are in it.
_Avoid_: World, zone, area, biome

**Campaign**:
The ordered run of ten gates from the breached world to the Wheel.
_Avoid_: Story mode, adventure, main quest

**Encounter**:
A triggered fight inside a gate, sometimes sealed by barriers until every
enemy it spawned is dead.
_Avoid_: Wave, room, arena, battle

**The Wheel**:
The cycle by which the dead are judged and reborn. It has stopped, and that
stoppage is the campaign's premise.
_Avoid_: The cycle, samsara, the system (which means something else here)

## Who is in it

**Hunter**:
The player character. Licensed to enter gates, ranked D through S.
_Avoid_: Player character, protagonist, hero, avatar

**The System**:
The disembodied voice that narrates status to the hunter — the game's only
text surface. A genre convention, not a character.
_Avoid_: HUD, UI, narrator, interface

**Warden**:
The named antagonist that ends a gate, built by parameterising a common
archetype with elevated stats, a title, and one signature addition to its
moveset. Every gate has exactly one.
_Avoid_: Mini-boss, elite, sub-boss, lieutenant

**Boss**:
A Warden of the highest order — bespoke, multi-phase, with its own arena
behaviour rather than parameterised numbers. Four of the ten Wardens are
bosses. Every boss is a Warden; most Wardens are not bosses.
_Avoid_: Guardian (that is one specific boss's name), raid boss, final boss

**Yama**:
The judge of the dead, and one figure rather than several — the same office
called Yama in Vedic and Buddhist tradition, Yanluo Wang in Chinese, Enma in
Japanese. He stopped judging.
_Avoid_: Death, the reaper, Hades, Enma-Ō (as separate characters)

## The shadow

**SORGI**:
The command that binds a lingering soul. The word itself, spoken by the
hunter; not the resulting ally and not the act.
_Avoid_: Arise, extraction, summoning, necromancy

**Remnant**:
What a slain enemy leaves behind — a soul that did not move on, marked by a
violet shard and claimable for a few seconds before it fades.
_Avoid_: Corpse, body, soul, drop, pickup

**Shadow**:
The ally raised from a remnant. One at a time; binding another releases the
first. Not a summon and not a pet — it is a soul being escorted toward
rebirth, and the campaign ends by letting it go.
_Avoid_: Summon, minion, pet, servant, undead

## Rank and progress

**Rank**:
The hunter's standing, D through S, carried between gates. Drives mana
regeneration.
_Avoid_: Tier, grade, level (which means something else here)

**Style**:
The score for what the hunter did personally, within a single gate. A shadow's
kills earn no style, which is what stops leaning on it being free.
_Avoid_: Combo score, points, rating
