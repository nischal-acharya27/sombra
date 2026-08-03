# Spec — the ten-gate campaign

Status: ready to build, on the `campaign` branch.
Design settled in `DECISIONS.md` § "Campaign, audience and platform" and § "The
level-data seam". This document does not reopen any of it; it turns it into
work. Vocabulary is defined in `/CONTEXT.md` and used here without gloss.

## Problem Statement

The game is one gate long. That gate has been played four times, tuned three
times, and now carries a verified signature mechanic, and there is nothing
further to learn from it — the project's own log named the risk of ending
*played, endlessly retuned, never extended*.

It also has no story. There is a hunter, a gate, and a boss at the end of it,
and no reason for any of them. The System announces threats and level-ups and
says nothing about why a gate exists or what walking into one is for. `level.js`
mentions in passing that "the gate was somebody's temple once", and that is the
entire fiction of the game.

And the project has just acquired an end goal it did not previously have: a
free Android game carrying ads. That reaches backwards into everything. Ad
revenue is impressions per user, which is retention, which needs a reason to
come back — and the game currently has 130 seconds of content and no save.

Three problems, one shape: **the game is a proven loop with nothing wrapped
around it.**

## Solution

**Ten gates, and a reason to walk into them.**

The Wheel — the cycle by which the dead are judged and reborn — has stopped.
Souls back up, and the overflow tears into the living world. Those tears are the
gates. The hunter is not clearing monster nests; they are doing the psychopomp's
work that the machinery of the afterlife abandoned.

Gate 1 is the last routine job of a D-rank hunter's career. Its exit does not
lead home. It leads down to the river, and from there up through the six realms
of rebirth — the hells, the hungry ghosts, the animals, the humans, the asuras,
the devas — to a court with ten thrones and nine of them empty, and finally to
the Wheel itself.

**Yama stopped judging because he could no longer bear it.** That is the answer
at the end, and the game has been showing it since before it was written: the
Kneeling Stone in gate 1 is a colossus knelt with its head bowed and one dead
violet eye, which is a judge who put the work down.

**SORGI carries the story.** A slain enemy leaves a remnant — a soul that did
not move on. Binding it does not raise a corpse; it releases something stuck,
and it walks with the hunter until it is ready to go. The campaign ends by
letting it go. The mechanic the player has leaned on for ten gates becomes the
thing they surrender, and that is the last input the game asks for.

Around that: gate completion and hunter rank persist, so the campaign survives
being closed. Every gate ends with a named Warden. Three new enemy archetypes
arrive one gate at a time. All text moves into one module so the game can be
translated later without being rewritten.

## The ten gates

Each gate is one realm. Palette, enemy mix and Warden are listed because they
are the axes that make ten gates feel like ten places rather than one place ten
times.

| # | Realm | Palette | New | Warden |
|---|---|---|---|---|
| 01 | The breached world | pastel → grim | — | **Gate Guardian** ✅ boss, built |
| 02 | The crossing | grey-blue, black water | charger | **The Ferryman** |
| 03 | The hells — Naraka / Diyu | iron, red-black | armoured | **The Ox-Headed** — boss |
| 04 | The hungry ghosts — preta | pale dust, washed out | summoner | **The Unfilled** |
| 05 | The animal realm | choked green | — | **The Pack-Mother** |
| 06 | The human realm | warm, familiar, wrong | — | **The Magistrate** — boss |
| 07 | The asuras | gold and blood-orange | — | **The Ever-Warring** |
| 08 | The devas | light, cloud, pastel | — | **The Long-Lived** — boss |
| 09 | Yama's court | monochrome + violet | — | **The Backlog** |
| 10 | The Wheel | every palette bleeding | — | **What Grew In The Stillness** — boss |

Four new Guardian-class bosses, at gates 3, 6, 8 and 10. Gate 1's Guardian
already exists and is not rebuilt.

**02 — The crossing.** Black water instead of void. Falling in does not kill:
it *forgets*, and the hunter loses their bound shadow. That is Lethe and Meng
Po's broth as a mechanic, and it teaches — cheaply, and before it matters — that
the shadow is losable. The System glitches here for the first time; it has no
records for this place.

**03 — The hells.** Souls being processed by machinery that is jammed. Nobody is
being released. The first hard evidence that the Wheel has stopped. Kept
readable rather than horrifying: this is a bureaucracy that broke, not a torture
chamber.

**04 — The hungry ghosts.** Pale and bright, deliberately, against gate 3's
dark. Pretas are drawn sympathetically — they are waiting for something that
stopped coming, and the hunter can release some of them. Nothing here is
malicious.

**05 — The animal realm.** No judgment, no speech, no negotiation. The densest
beast encounters in the game. The System reports that it cannot classify
anything it sees.

**06 — The human realm.** A city that looks like home, warm and familiar and
subtly wrong. Doctrinally this is the only realm from which liberation is
possible, so it is the hinge of the campaign. The Magistrate still judges,
alone, drowning in backlog — the first real conversation in the game, and where
the hunter learns Yama stopped.

**07 — The asuras.** War without end over something neither side remembers. The
most fight-dense gate. They do not know the Wheel stopped and would not care.

**08 — The devas.** The most beautiful gate in the game, and the palette returns
to gate 1's pastel — the art direction's payoff, arriving as an echo. The devas
are fading and refuse to notice. *Even heaven ends* is the campaign's thesis and
it lands here, as a place rather than a speech.

**09 — Yama's court.** Ten thrones, nine empty. Yama is present and does not
fight. The Warden is The Backlog — the accumulated unjudged given shape — so the
fight is against what his absence made rather than against him.

**10 — The Wheel.** Turn it. Release the shadow; the last one bound goes first.
Yama takes the office back up, because ten gates of escorted souls are the
argument that the work is bearable when it is not done alone. The gates close.
The hunter goes home.

## User Stories

**The campaign**

1. As a hunter, I want gate 1's exit to lead somewhere other than home, so that
   the campaign begins from the content that already exists rather than
   replacing it.
2. As a hunter, I want each gate to open with the System naming the realm I have
   entered, so that I always know where I am in a ten-gate journey.
3. As a hunter, I want each realm to look unmistakably unlike the last, so that
   progress is visible without a map or a progress bar.
4. As a hunter, I want the story delivered in short System windows at gate
   boundaries, so that narrative never competes with a live fight for my
   attention — the failure `PLAYTEST.md` recorded in round 3.
5. As a hunter, I want no story text longer than can be read at a glance, so
   that a rule or a beat I am shown is a rule or a beat I received.
6. As a hunter, I want the ending to ask me for one deliberate input — releasing
   the shadow — so that the campaign closes on an action rather than a cutscene.

**Wardens and bosses**

7. As a hunter, I want every gate to end with a named antagonist, so that ten
   gates feel authored rather than generated.
8. As a hunter, I want a Warden to use telegraphs I already know, plus one new
   signature move, so that a gate's climax is a test of what I have learned
   rather than a new vocabulary lesson.
9. As a hunter, I want the four bosses to be visibly of a higher order than the
   six Wardens, so that escalation reads without being explained.
10. As a hunter, I want a Warden's title shown when it appears, so that the
    named antagonist is legible as one.

**New enemies**

11. As a hunter, I want a charger that punishes standing still, so that the
    crossing teaches movement before the hells demand it.
12. As a hunter, I want an armoured enemy that shrugs off light attacks and
    breaks to the launcher, so that a move I was taught in gate 1 acquires a new
    reason to exist.
13. As a hunter, I want a summoner that must be prioritised over what it
    summons, so that target selection becomes a decision.
14. As a hunter, I want each new archetype introduced alone, in a safe
    encounter, one gate before it is combined with others, so that I learn each
    tell in isolation.
15. As a hunter, I want every new enemy to obey the rule that nothing harms me
    by touching me, so that the game's load-bearing combat rule holds without
    exception across all ten gates.
16. As a hunter, I want every new enemy to leave a remnant, so that SORGI's
    promise is not selectively true.

**Progression and persistence**

17. As a hunter, I want my cleared gates remembered when I close the game, so
    that a ten-gate campaign is playable in the sessions a phone actually
    affords.
18. As a hunter, I want my rank carried between gates, so that ascending the
    realms feels like growing rather than like the enemies inflating.
19. As a hunter, I want never to be given a new button, so that the controls I
    learned in gate 1 are the controls I finish with.
20. As a hunter, I want to replay a cleared gate, so that a gate I rushed is not
    lost to me.
21. As a hunter, I want my best style rank per gate remembered, so that there is
    a reason to return to a gate I have already cleared.
22. As a hunter, I want a teaching line I have already seen never shown again,
    so that persistence makes the tutorial quieter rather than louder.

**Monetisation**

23. As a player, I want ads at gate boundaries rather than during a gate, so
    that an interruption never costs me a fight.
24. As a player, I want no more than one interstitial per two to three gate
    clears, so that a two-minute gate is not bracketed by advertising.
25. As a player, I want the option to watch a video for a second wind when a
    boss kills me, so that a wall I am close to clearing is not where I stop
    playing.
26. As a player, I want that offer only in boss arenas and only once per
    attempt, so that the rest of the game remains a test of what I can do.

**Text**

27. As a developer, I want every player-visible string in one module, so that
    translating the game later is a mechanical job rather than an archaeology
    project.

## Implementation Decisions

**A gate is a descriptor; `Level` takes one.** Geometry, encounters, per-gate
constants (`SPAWN_X`, `VOID_Y`, `ARENA_TOP`, `LEVEL_END`), realm palette and
Warden configuration all live in one object per gate under `src/game/gates/`.
`Level` becomes the thing that turns any descriptor into geometry and answers
collision queries against it — which is most of what it already does. `game.js`
stops importing level constants as module constants and reads them from the
active gate.

**Gate 1 moves through the seam before gate 2 is written, with zero behaviour
change and the suite still green on every existing row.** Changing the shape
that holds content and authoring new content are two jobs; done together, a
failure has two candidate causes and there is no clean baseline. Gate 1 is the
only content with four playtest rounds behind it, which makes it the only usable
control.

**Wardens are configuration, not code.** A Warden is `{archetype, title, stats,
signature}` — an existing enemy class with elevated numbers, a name, and one
added move. No new file, no new state machine. This is what makes ten named
antagonists cost roughly what one Guardian cost.

**Bosses subclass, they do not copy.** The four new bosses follow what the SORGI
slice already proved: `Beast.update` took its target as a parameter, which is
why an ally was a subclass rather than a duplicate. `Boss` is refactored the
same way before the second boss is written, not after the fourth.

**Allocate nothing during a run — this now applies to gate transitions.** The
rule that cost most of a session to rediscover is the single highest-risk rule
for this work, because a gate transition is the largest allocation event the
game will ever have. Three.js draws four `Math.random()` values per object for
its UUID and `sim.js` seeds `Math.random` globally, so building gate 5's geometry
mid-campaign would re-roll every subsequent enemy's jitter and send fixed seeds
down different playthroughs. **Gate teardown and construction must happen
outside the seeded stream**, and a draw counter around `Game.update` is the
*first* measurement taken when any campaign number moves unexpectedly, not the
sixth.

**Persistence is `localStorage`, holding as little as possible.** Cleared gates,
hunter rank, best style per gate, seen-teaching-lines, settings. No mid-gate save
— a gate is 130 seconds and restarting one is not a hardship. No build step, no
dependency, and it survives a WebView wrap unchanged.

**Strings live in `src/ui/strings.js` as a flat keyed object.** English only.
No locale switching UI, no fallback chain, no pluralisation machinery — those
are the parts of i18n that cost something, and none of them are needed to keep
the option open.

**Palette becomes per-gate.** `DECISIONS.md` § Art direction specifies a lerp
over fog, sky and grass driven by `player.x`. That mechanism is kept exactly and
its endpoints move into the gate descriptor, so each realm darkens or brightens
across its own length. Gate 8 brightening back toward gate 1's pastel is the
payoff and it costs nothing structurally.

**Touch is not built in this spec, but every gate is authored against the
budget:** no required chord, jump margins at or above 25% reserve, never a
direction plus two buttons at once. Constraint 2 is enforced by the suite rather
than by memory — see below.

## Testing Decisions

**Tier 1 — static checks, all ten gates, every run.** Gap widths against the
measured reserve ratio (3.8 against a 6.08-unit running jump, so 26%); spawn
points clear of barriers and of each other; a reachability proof from spawn to
exit; no encounter lock that can strand the player; every enemy type referenced
by a gate actually exists. Milliseconds. This is the tier that catches the
dominant new bug class, which is authoring error rather than mechanic error.

**Tier 2 — one full-campaign playthrough, carrying a shadow.** A single bot
plays all ten gates end to end. Not ten isolated runs: this project has already
been bitten by state that `reset()` does not clear, and a per-gate harness is
structurally blind to precisely that. This bot is the shadow-carrying bot that
has been owed since SORGI was specified.

**Tier 3 — deep analysis on a designated sample.** Telegraph gap, boss sweeps
and juggle probes on two or three gates, not ten. That analysis is what makes
the suite slow; a slow suite is a skipped suite; this suite is the only
independent check the project has. **Acknowledged cost:** seven gates never get
telegraph-gap analysis, and that is a real reduction in coverage, not a neutral
reallocation.

**The telegraph gap is restated as a distribution claim** — paired runs across
twenty-four seeds, gated on a Wilcoxon signed-rank test at p < 0.05, with the
median ratio reported as effect size and deliberately not gated on. Built and
measured; reasoning and results in `DECISIONS.md`. The standing warning is
unchanged and now has a third clause: do not close the gap by handicapping the
naive bot, do not close it by choosing a kinder sample, and do not close it by
reporting a point estimate from a wide distribution.

**New suite probes go last in `runAll`.** Scoped seeds isolate a probe's
randomness, not what thousands of frames do to the shared `Game` object. The
boss sweeps sit last of all, because the `+shadow` half allocates a rig per run.

**The Guardian keeps the numbers it has, and that was a finding rather than a
skipped job.** The re-tune was owed on the premise that carrying a shadow into
the arena would invalidate the verified numbers. Measured across five seeds it
does not: the ally is worth about +6 HP to `mash` and +1 to `dodge`, and the
sign is not even consistent. With every gate passing, moving numbers anyway
would be tuning by feel. `ranged` is now the hard gate it was always described
as — kiting must not win a majority — and it wins none of forty runs.

The 187 HP baseline this spec used to quote is withdrawn: it was a single run by
a zero-latency bot. Swept at the same 250 ms latency the playthrough bots use,
kiting leaves the Guardian around 590 of 900.

## Out of Scope

- **Touch controls themselves.** Specified as a budget here, built separately.
  Gate 2 is to be played on a real phone before gate 3 is authored, and that
  playtest is the only thing that can validate the budget.
- **The Android build.** Capacitor or TWA wrapping, Play Console setup, ad SDK
  integration. None of it changes the game's code and all of it is downstream of
  the game existing.
- **Translation.** Strings are centralised; nothing is translated.
- **Any new player verb.** The moveset is frozen at seven. Permanently, not for
  this spec.
- **A relic, equipment or shop layer.** Refused on record.
- **Mid-gate saving, cloud saves, accounts, leaderboards.**
- **Music.** Audio is generated in code and scaling that across ten realms is
  its own job.

## Further Notes

**The build order, and the checkpoint that makes it honest.**

1. Pay the three debts — shadow-carrying bot, Guardian re-tune, telegraph-gap
   restatement.
2. Open the level-data seam. Move gate 1 through it with zero behaviour change;
   every existing suite row stays bit-identical.
3. Tier 1 static checks across the seam.
4. **Author gate 2 end to end — geometry, charger, Ferryman, story beats — and
   play it, on a phone.**
5. Persistence and the string module.
6. Gates 3–10.

**Step 4 is the checkpoint, and it is the whole reason this ordering exists.**
`DECISIONS.md` retired the "depth, not breadth" rule on the grounds that its
preconditions were met, and noted that this is exactly how a load-bearing rule
dies quietly in every project that has ever had one. The guard against that is
step 4. If gates 3–10 begin before gate 2 has been played, the amendment was a
rationalisation and the project is repeating the failure that killed both of its
predecessors.

**What the campaign is most likely to get wrong.** Not the story and not the
seam. Three new telegraphs and four boss tunings, validated by one playtester
who is also the developer. Every previous round of this project found real
problems in exactly that gap, and there is no reason to think this round is
different — the difference is that a problem found in gate 6 now costs whatever
share of ten gates it touches.

**A note on the source traditions.** The campaign is built on the parts of five
mythologies that genuinely overlap — the shared judge, the shared river, the
shared doctrine of rebirth, the natively enumerated hells — rather than on
parts forced together for variety. Where a tradition has no equivalent for
something, it is not given one: Greek has a river and judges but no enumerated
realms, so Greek lives in the frame rather than in a gate. These are living
religions for a great many people, and the difference between building on a real
shared architecture and building a theme park out of borrowed iconography is a
difference worth maintaining deliberately.
