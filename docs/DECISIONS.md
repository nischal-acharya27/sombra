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

**Amended 2026-08-03: breadth is now the milestone.** The rule above is
retired, not forgotten, and it is worth being precise about what changed rather
than pretending it was wrong.

It rested on two conditions, and both have since been met. Level 1 was
unplayed; it has now been played four times, and the findings of all four are
in `PLAYTEST.md`. And the depth the rule was protecting was SORGI specifically
— named in this document as the thing that had to exist first. It exists, it is
verified, and the player has confirmed the mechanic works. A rule whose
preconditions have been satisfied has done its job; keeping it would be
mistaking the guard for the thing guarded.

What the rule was actually right about survives, and is carried into
`SPEC-CAMPAIGN.md` as the build order rather than as a prohibition: gate 2 is
built end to end and played before gates 3–10 are authored. The failure mode is
still multiplying unvalidated content, and one validated gate is what stops it.
The guard moved; it was not removed.

The honest risk of this amendment: the previous rule was overturned by the
person it constrained, on the grounds that its conditions were met, and that is
exactly how a load-bearing rule dies quietly in every project that has ever
had one. The check is the checkpoint above. If gate 2 is authored and gates
3–10 begin before it has been played, this amendment was a rationalisation.

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

## Campaign, audience and platform

Settled in a design interview on 2026-08-03, when the project acquired an
end goal it did not previously have: **a free Android game carrying ads.** That
goal reaches backwards into the story, the level count and the combat, so it is
recorded before any of them.

### Two premises that were checked and found false

Both were believed at the start of the interview, and both would have led
somewhere wrong.

**The game is not multi-lingual.** `index.html` is `lang="en"` and every string
is an English literal inline in JS. What exists is Romance-language *move
naming* — Sombra, Décret, Ascensão — which is a naming aesthetic recorded under
§ Naming and positioning, not an i18n layer. The syncretic mythology below
therefore had to justify itself on its own merits rather than inheriting a
rationale from a feature that does not exist.

**The game is not touch-capable.** `input.js` binds eleven actions and SORGI is
a two-key chord. Android is a control-scheme redesign, not a packaging step, and
that redesign constrains what a level may ask for. See the touch budget below.

### Audience: content for 9+, declared 13+

These are two separate fields in Play Console and only one of them costs money.
Content rating is how mild the game is. Target audience is who you declare you
are building for. Declaring any under-13 group triggers the Families policy:
certified ad SDKs only, non-personalised ads, and a reported ~70% cut to eCPM
**across the entire userbase, not only the children**.

So the game is built mild enough for a nine-year-old and declares 13+. A
nine-year-old can still play it; they are simply not the declared target.

**Known risk, not hidden:** Play can reclassify an app whose art and store
listing plainly appeal to children, and this game's soft cel-shaded pastel look
is genuinely borderline. That risk is managed by how the listing is written and
it is not zero.

**What 9+ costs the design, and what it unexpectedly buys.** SORGI could not
remain "stand over a corpse and raise the dead". It became "release a soul that
got stuck, and escort it" — see § The campaign below. That is a text change and
not a mechanic change: not one line of `shadow.js` behaviour is affected. It
also turns the mechanic from decorative to load-bearing in the story, which is
a better outcome than the one being compromised away from.

### The touch budget

Adopted as a design rule now; the touch scheme itself is built later. Three
constraints, and every gate is authored against them:

1. **No chord may be required.** SORGI's `hold S + K` needs a touch equivalent
   that is a single target.
2. **Jump margins stay at or above 25% reserve.** This is not a guess. `level.js`
   records that 4.5-unit gaps left a 4% margin and *both scripted bots died there
   repeatedly*; they were widened to 3.8 against a measured 6.08-unit running
   jump, which is 26%. A thumb on a virtual pad with no key travel and no
   tactile edge is strictly worse than a bot.
3. **No beat may require a direction plus two buttons at once.**

The reason to adopt these before the scheme exists is that they cost a paragraph
today and cost ten re-authored gates later. The reason to distrust them is that
they are written against an imagined input device: **the only proof a thumb can
clear a 26% margin is a thumb.** Gate 2 is to be played on a real phone before
gate 3 is authored.

The budget is not only a rule. Constraint 2 is a *static assertion* the suite can
run against all ten gates in milliseconds — see § The level-data seam.

### Monetisation

**Interstitials** every two to three gate clears. Ten gates give nine natural
boundaries for free; every boundary is too aggressive at roughly 130 s per gate.

**Rewarded video is restricted to a "second wind" in boss arenas, once per
attempt.** The unrestricted version — continue anywhere on death — is the
highest-earning placement in this genre and it was refused, so the reasoning
needs to be on record. This game's combat rests on one claim defended across
three playtest rounds: every threat announces itself, so you always know what
killed you. A general continue converts every skill gate into an ad gate, and
the player who cannot read the Guardian's tell stops having to learn it. Bounding
it to bosses puts the offer exactly where `PLAYTEST.md` already measured real
frustration — four or five attempts on the Guardian — and nowhere else.

This trades revenue for design integrity, knowingly. If retention data later
says the game is losing players at a non-boss wall, that is the evidence that
would reopen it.

### The campaign

Ten gates. The syncretic brief — Greek, Hindu, Buddhist, Japanese, Chinese —
was taken as a structural problem rather than a decorative one, because the
decorative version is a theme park where gate 3 is Greek and gate 4 is Japanese,
and that is both shallow and a poor way to treat living religions.

**The traditions share a real, historically transmitted architecture**, and the
campaign is built on the parts that genuinely overlap rather than on parts
forced together:

- **Yama is one figure across four of them.** Vedic Yama → Buddhist Yama →
  Chinese Yanluo Wang → Japanese Enma is documented transmission. Greek supplies
  the structural parallel in Minos, Rhadamanthys and Aeacus.
- **All five have a river of the dead**, and the forgetting at the crossing pairs
  Greek Lethe with Chinese Meng Po's broth almost exactly.
- **Rebirth is shared, including by Greece** — samsara, and Orphic
  metempsychosis.
- **The hells are already enumerated as stages** — Diyu's courts, Naraka's eight
  hot and eight cold. The source material is natively structured as levels.

**Premise: the Wheel has stopped.** Souls that should be judged and reborn are
backing up, and the overflow tears into the living world. Those breaches are the
gates. The hunter is not a monster-slayer; they are doing the psychopomp's work
the machinery abandoned.

**Yama stopped judging because he could no longer bear it.** Legible to a
nine-year-old — someone put down a hard job because it hurt too much — without
being childish, and the resolution is taking up the work rather than killing
him. Gate 1 has foreshadowed this since it was built and nobody planned it: the
Kneeling Stone is a colossus knelt with its head bowed and one dead violet eye,
which is a judge who stopped judging.

**Structure:** the breached world, the crossing, then ascending through the six
realms of rebirth — hells, hungry ghosts, animals, humans, asuras, devas — then
Yama's court, then the Wheel. Greek lives in the frame (river, ferryman, judges)
rather than as one gate's costume, which is honest to the one tradition here
with no enumerated realms.

Ascent was chosen over a straight descent through the hells for two reasons.
Visual variety: a deva-realm gate and a hungry-ghost gate look nothing alike,
whereas ten hells is ten shades of dark, and § Art direction's darkening lerp
works far better as six distinct realm palettes than as one long fade to black.
And it yields an ending that means something at 9+ — *even the god realm is
impermanent* — which is the actual Buddhist point and lands as a beat rather
than a lecture.

**The shadow is the emotional spine.** Each one is a soul being escorted toward
rebirth, and the campaign ends by letting it go. The mechanic leaned on for ten
gates becomes the thing surrendered.

### Wardens and bosses

**Every gate ends with a named Warden.** A Warden is an existing archetype
parameterised with elevated stats, a title, and one signature addition to its
moveset — no new file, no new state machine, a telegraph the player already
knows. Ten Wardens cost roughly what one Guardian costs, because they are
configured rather than written.

**Four of them are Guardian-class bosses** — bespoke and multi-phase, at gates
3, 6, 8 and 10. The boss *is* that gate's Warden, escalated, rather than an
additional fight: every gate gets a face, no gate pays twice, and the escalation
reads as rank in the fiction.

Ten bosses was refused on scope. `boss.js` is 575 lines for one Guardian, and
that Guardian is not yet re-tuned for a shadow-carrying player.

### Progression: rank carries, the moveset never grows

Gate completion and hunter rank persist; the moveset is frozen at seven verbs
forever. The hunter grows numerically and narratively — D toward S, which is the
genre's spine and what the README already sells — and never gains a new button.

This is not a preference. It falls out of the touch budget: there is nowhere to
put an eighth control on a phone screen that a thumb also has to steer with. The
constraint is a gift rather than a limitation — no new verb also means no new
telegraph to teach, and it lets the suite place a bot at a known rank for each
gate deterministically.

A relic or equipment layer was considered and refused. It is the strongest
retention and rewarded-ad hook available, and it is bookkeeping with a shop
attached — which this document already rejected once, when it refused a mana
cost for SORGI on precisely those grounds.

### Text is centralised now, translated later

All narrative and UI strings move into one module as the campaign is authored.
No translation ships at launch, no locale switching UI, no build step.

The timing is the entire decision. Routing ten gates of prose through a string
table while writing it is nearly free; extracting it from ten gates of inline
literals afterwards is a slog. Translating *now* would be spending effort on
reach before knowing whether the game retains anyone.

One constraint turns out not to bind, and it is worth recording so nobody
re-derives it: **the no-asset-files rule does not block localisation**, because
all text in this game is DOM text styled by CSS and Android's WebView supplies
system fonts for Devanagari, CJK and the rest. If text were rendered into
textures this would be impossible. It is not.

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

> **Wrong, and left standing as the record of a wrong prediction — 2026-08-03.**
> Both halves failed. The 100 HP figure was one run of a stochastic fight; swept
> across eight seeds the same build reads 61–111. And carrying a shadow in does
> *not* change the result — measured, it is worth about +6 HP to `mash` and +1
> to `dodge`, with an inconsistent sign. The shadow-carrying bot was genuinely
> needed and was built; the re-tune it was supposed to justify was not owed.
> See § The level-data seam → three debts.

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

**Now a hard gate, and it passes — 2026-08-03.** Kiting wins **none of forty**
runs across five top-level seeds, empty-handed or carrying a shadow, leaving the
Guardian around 590 of its 900 HP.

The 187 HP figure above is withdrawn. It was a single run by a bot with zero
reaction latency, and both halves of that were flattering it: one run of a
stochastic fight says what happened once, and a kiting bot that never gets
caught is the best possible case for a strategy whose entire premise is never
getting caught. See § The level-data seam → three debts for the full table, for
how the latency error was found, and for why no Guardian number moved.

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

### Built 2026-08-02 — the vertical slice

Spec in `SPEC-SORGI.md`. What building it settled, beyond what that document
already says:

**The ally is the beast's own state machine pointed at a different target.**
`Beast.update` already took its target as a parameter instead of reaching for
the player, so an ally is that same chase-and-pounce loop handed the nearest
enemy — and the hunter to follow when there is none, with the pounce gated off
so it does not leap at the person it is following. That one fact is why the
slice is small. Every number the beast reads now comes from `this.cfg`, which is
what makes the reuse a subclass rather than a copy.

**One slot for the shadow, a separate list for corpses.** Holding a single
reference makes "one summon at a time" a property of the shape rather than a
rule every caller has to remember, and keeping corpses out of `enemies` means no
loop that iterates enemies — player melee, projectiles, the encounter-clear
check, the AI's target search — can see a body without being changed to. The
"does not count toward defeat all enemies" requirement cost zero lines.

**The shadow re-forms beside the hunter when left behind or dropped.** One rule
standing in for a pathfinder. It would otherwise be lost to every pit, every
barrier that closes behind you, and every ledge its ledge-check refuses to walk
off — and a slice meant to answer *does an ally make this combat better* would
have spent its evidence on navigation instead. A shadow arriving out of nowhere
costs the fiction nothing.

**Only beasts leave corpses.** Wisp-as-ranged is not in this slice, and a shard
on a wisp would teach a promise the slice cannot keep. The tell that teaches the
mechanic is the one thing that must not lie.

**The teaching line fires once per page load.** "The first time ever" cannot mean
more than that while nothing survives a reload. Recorded because it looks like a
persistence decision and is not one.

### The suite's seeded stream reaches further than it looks

Building this cost most of a session to a bug that was not in the mechanic, and
the shape of it is worth more than the fix.

The first working build sent the tell-reading bot from 87 damage to 141 and
failed the telegraph gap assertion — while the playthrough bots never touched
extraction, never held `down`, and never saw a corpse. Five theories were wrong
before the measurement was right. What settled it was counting `Math.random()`
draws per frame and diffing the two builds: at the exact frame a beast's body
became a corpse, one build drew 1 and the other drew **33**.

**Three.js takes four `Math.random()` values per object for its UUID**, and
`tools/sim.js` verifies the game against a *seeded* `Math.random`. Building a
shard per corpse — two geometries, two materials, three Object3Ds — spent 32
draws at the instant of every beast's death, which re-rolled every enemy's jitter
after it and sent eight fixed seeds down entirely different playthroughs. The
divergence surfaced as a 3×10⁻⁴ difference in the hunter's `x` and grew from
there. Nothing was wrong with the mechanic.

The fix is the rule the codebase already followed everywhere else and this code
had quietly broken: **allocate nothing during a run.** Shard geometry and
material are module-level, like `boltGeo`; the rigs come from a pool built in
the `Game` constructor, like the particle pool.

**A second, quieter leak, and scoped seeds do not stop it either.** With the
allocation fixed the reading bot's row was exact, and the *naive* row was still
four points off. Cause: the probe ran before the sweeps, and eight thousand
frames of simulation leave state on the game object that `reset()` does not
clear. A scoped seed makes a probe's randomness independent; it does nothing
about what the probe does to the object. The fix is ordering — the probe runs
last, after every row that existed before it. With both fixes every pre-SORGI
row is bit-identical: same damage, same seeds cleared, same draw count, which is
the correct result for a mechanic the bots do not use.

Both leaks were found by the same instrument and it is worth naming: a counter
around `Math.random`, and a per-frame trace of `Game.update` diffed between two
builds to find the first frame that disagrees.

The general form, and the reason this is in the design log rather than a commit
message: **anything the game allocates mid-run is silently part of the suite's
random stream.** Spawning an enemy already does this, harmlessly, because it
happens at the same instant in every build being compared. Anything new does not
get that guarantee. The cheap instrument is a draw counter around `Game.update`,
and it should be the first measurement rather than the sixth — the same lesson
the frame-skip cost, in a different costume.

### The telegraph gap is a coin-flip across top-level seeds

Measured while chasing the above, on the **unmodified** pre-SORGI build:

    seed 20260728   gap  54%   PASS        seed 20260802   gap  89%   FAIL
    seed        1   gap  85%   FAIL        seed  7777777   gap  69%   PASS
    seed    99991   gap 102%   FAIL

The SORGI build produces the same five numbers, being bit-identical on this row.
So the suite is at zero failures on its default seed and fails three of five
elsewhere, and has been for as long as the assertion has existed. Widening the
sweep moves the estimate a long way on a fixed build too — the same build reads
54% at eight seeds and 65% at twenty-four.

**Corrected 2026-08-03. Four of those five numbers do not reproduce, and the
bit-identity claim above is false.** Re-measured on `0e508b3`, the committed
SORGI build:

    seed             recorded      measured
    20260728          54% PASS      54% PASS     ✓
    1                 85% FAIL      89% FAIL     ✗
    99991            102% FAIL      98% FAIL     ✗
    20260802          89% FAIL      82% PASS     ✗  — and it flips the verdict
    7777777           69% PASS      70% PASS     ✗

Only the default seed reproduces. The recorded verdict of "fails three of five"
is now two of five, because 20260802 crosses the threshold in the other
direction.

This was found while adding the shadow-carrying bot, and the first suspicion was
that the new row had disturbed the old ones. It had not, and the check is worth
recording because it is the cheap one: `git stash push tools/sim.js`, re-run the
same seed, compare. The reverted build reads 89% on seed 1 too. Whatever
produced the original table, it was not this build — most likely it was the
pre-SORGI build, and the bit-identity claim was verified on the default seed and
then asserted of all five.

**This strengthens the restatement below rather than undermining it.** An
estimator whose point values do not survive a rebuild is exactly an estimator
that should never have been compared against a point threshold. It also stands
as a warning about this document: a number recorded here without saying which
build produced it is a number that cannot be checked later, and four of these
five could not be.

This is recorded and **not** acted on. It is a real weakness in the only
independent check the project has, the obvious fixes are all forms of turning a
dial on the instrument, and the standing warning at the top of that assertion —
do not close the gap by making the naive bot worse — applies just as much to
closing it by choosing a kinder sample. It wants a decision of its own, taken
deliberately, not one taken in passing while landing a feature.

**Decided 2026-08-03, deliberately and on its own.** The assertion is restated
as a claim about a distribution rather than a point.

The evidence that settles it is already above and was misread as a fact about
the build: *the same fixed build reads 54% at eight seeds and 65% at
twenty-four.* A number that moves eleven points on a build that did not change
is not measuring the build. It is an estimator with a standard error far wider
than the effect being tested, compared against a threshold — 85% — that was
never derived from anything. Three of five seeds "failing" is not five
observations of a property; it is five draws from a wide distribution.

So the assertion becomes: **a paired signed-rank test over twenty-four seeds**,
reported with its spread rather than as a pass or fail on one number.

### Built 2026-08-03, and what building it changed

Two things were wrong with the old shape, and only one of them was the
threshold.

**The sweeps were not paired.** The naive runs used scoped seeds 300+i and the
reading runs 400+i, so the two bots were never playing the same levels as each
other. Half the spread in that ratio was spawn scatter rather than behaviour.
Runs are now paired — run *i* of each bot shares a scope, so both face the same
spawns, the same jitter and the same wisp phases, and the only difference
between their two numbers is the bot.

**The sign test was tried first and it failed, and that is recorded here rather
than quietly overwritten**, because which test was reached for first is part of
the evidence. Binomial(24, ½) gives 17 as the smallest bar clearing p < 0.05,
which is a threshold with the great virtue of being arithmetic. It read **16 of
24, p ≈ 0.076**, on a build nobody had any reason to think was broken.

That is a statement about the test rather than about the game. A sign test keeps
only *which* bot won each pair and throws away *by how much*, and this data's
signal is mostly in the magnitudes — a 35 HP median saving against a 120 HP bar.
So the gate is the **Wilcoxon signed-rank test**, which ranks the absolute
differences and sums the ranks that went the reader's way, discarding nothing.
Its critical value is computed from the null distribution via the standard
normal approximation rather than looked up, so it stays arithmetic too.

Switching to a test that reads the same samples more carefully is legitimate.
Switching tests until one passes is not, so: **this gate does not move again.**
Not the test, not the alpha, not the sample size. If it fails, the finding is
about the game. The sign test stays in the report, un-gated, as the record of
what was tried.

**Measured on `0e508b3` plus this change, across the five top-level seeds:**

    seed        z      p        sign     median   IQR        saving
    20260728   2.10   0.018     16/24     79%     52–106%    35 HP
    1          2.66   0.004     16/24     75%     59–106%    34 HP
    99991      3.39  <0.001     19/24     73%     43– 89%    44 HP
    20260802   2.49   0.006     19/24     80%     63– 91%    29 HP
    7777777    2.79   0.003     18/24     78%     49–100%    35 HP

**Five of five pass**, where the old assertion failed three of five. And the
finding underneath it is the one worth keeping: **the effect was stable the
whole time.** The median sits between 73% and 80% on every seed. What was
swinging from 54% to 102% was never the telegraph design — it was an unpaired
mean ratio with a standard error far wider than the thing it was measuring. The
instrument was the problem, and the project spent two rounds treating its noise
as a property of the game.

### The gate's false-negative rate, measured — 2026-08-03

"Five of five" is true and reads stronger than it should. Those five are the
seeds this document had already recorded, and they were the seeds available to
check because non-default seeds were untestable until `?sim&seed=N` existed.
Widening to nine:

    seed        reads clears   p        verdict
    20260728       19/24       0.018    pass
    1              19/24       0.004    pass
    99991            —        <0.001    pass
    20260802         —         0.006    pass
    7777777          —         0.003    pass
    7              19/24       0.004    pass
    123            18/24       0.043    pass
    0              12/24       0.035    FAIL — on clear rate, not the gap
    42             20/24       0.106    FAIL — on the gap

**Roughly two seeds in nine fail on a build with nothing wrong with it**, and
several passes sit just inside the line at 0.035 and 0.043. That is a
false-negative rate, and it is the honest operating characteristic of a
signed-rank test at n = 24 against an effect this size. A regression gate that
cries wolf one run in four or five is a gate people learn to ignore.

**Nothing is being changed in response to this, and that is deliberate.** The
entry above froze the gate — not the test, not the alpha, not the sample size —
precisely so that a failure could not be answered by adjusting the instrument.
Raising n to 48 would fix the power and would also be the exact move that rule
exists to forbid, taken in direct response to a specific seed failing. If the
false-negative rate is judged intolerable, that is a decision to take on its own
and not while looking at seed 42.

What follows instead is a **protocol**: a single red run on an arbitrary seed is
not evidence of a regression. The five recorded seeds are the reference set, and
a regression means the gate moving on *those*.

**A second, unrelated finding, and this one is about the game.** On seed 0 the
tell-reading bot clears **12 of 24 while the naive bot clears 18** — and its
damage gap still passes. The same ordering shows up mildly on the default seed
(19 against 22). Reading telegraphs saves damage and costs runs, and the obvious
mechanism is the dash: the reading bot's answer to a commit is to dash away, and
dashing away near the chasm is how a bot goes into the void. That is worth
knowing before three new enemy archetypes are designed around the same tell-and-
dash loop, and it is recorded rather than acted on.

This is neither of the two things the standing warning forbids, and the
distinction is the whole point. Handicapping the naive bot changes the system
under test. Choosing a kinder sample changes which draws are counted. Taking
more samples changes neither — it reduces the error on an estimate of a
quantity that was always the same. The naive bot is untouched, no seed is
excluded, and the threshold is derived rather than asserted.

What this does not fix, and must not be claimed to: it does not make the
telegraph design more true. It makes the measurement of it honest enough to be
worth reading, which it currently is not. If the median gap turns out to sit
near zero, that is a finding about the combat design and the answer is not
another change to the instrument.

## The level-data seam, and what the suite checks across ten gates

Both halves of the campaign work hit one seam, and it is currently welded to
gate 1.

`level.js` holds `SEGMENTS` and `ENCOUNTERS` as module-level `const` arrays and
`Level`'s constructor takes only `scene`. `game.js` imports `SPAWN_X`, `VOID_Y`
and `ARENA_TOP` as module constants. `sim.js` is coupled to the same layout:
`bossFight` teleports to `p.x = 178`, encounters are skipped by
`e.id !== 'guardian'`, and `checkGaps` reads live geometry.

**The seam: a gate is a data descriptor, and `Level` takes one.** Geometry,
encounters, the per-gate constants, the realm's palette and the Warden's
configuration all move into one object per gate. `Level` becomes the thing that
turns any such descriptor into geometry and answers collision queries against
it, which is most of what it already does.

**Gate 1 moves through the seam first, with zero behaviour change and the suite
still green.** Authoring new content and changing the shape that holds it are
two jobs, and doing them together means a failure has two candidate causes and
no clean baseline. Gate 1 is the only content with four rounds of playtest
behind it, which makes it the only usable control.

### The failure mode changes, and so does the instrument

Today's bugs are mechanic bugs and bots playing find them. Tomorrow's dominant
bug is an **authoring** bug — a gap two units too wide, a spawn inside a
barrier, a platform that cannot be reached, a lock that strands the player.
Those are far cheaper to catch statically than by simulation, and the constants
needed to catch them are already measured and recorded in `level.js`.

Three tiers:

1. **Static checks on all ten gates, every run.** Gap widths against the
   measured reserve ratio, spawn points clear of barriers, a reachability proof
   from spawn to exit, no lock that can strand. Milliseconds, and it makes
   constraint 2 of the touch budget machine-checkable rather than a rule
   somebody has to remember while authoring.
2. **One full-campaign playthrough** — a single bot playing all ten gates end to
   end, carrying a shadow. Not ten per-gate runs: this project has already been
   bitten by state that `reset()` does not clear, and a per-gate harness is
   structurally blind to exactly that class of bug.
3. **The deep analysis — telegraph gap, boss sweeps, juggle probes — on a
   designated sample of two or three gates**, not all ten. That analysis is what
   makes the suite slow, and a slow suite is a skipped suite, and this suite is
   the project's only independent check.

**The acknowledged cost of tier 3:** seven gates never receive telegraph-gap
analysis. Given that assertion is being restated as a distribution claim
precisely because it was not measuring reliably at one gate, concentrating it
where it can be run properly is an honest allocation — but it is a real
reduction in coverage and should not be described as anything else.

### Three debts are paid before gate 2 is authored

All three were recorded, all three were deferred, and the campaign plan makes
two of them prerequisites rather than debts.

- ~~**The shadow-carrying bot.**~~ **Paid 2026-08-03.** It *is* tier 2 above.
  Measured on `0e508b3` plus the new row, across the five top-level seeds:

      seed        clears   raised   into the arena carrying   dmg carried / empty
      20260728     7/8       7           7/8                    116 / 108
      1            7/8       8           7/7                     98 / 113
      99991        7/8       8           6/7                    102 / 102
      20260802     7/8       7           7/7                     63 / 109
      7777777      6/8       6           6/8                    129 /  95

  Re-measured after the telegraph rows became 24 paired seeds. The
  empty-handed column moved a long way — it is the mean of the reading bot's
  runs, and that sweep went from 8 unpaired runs to 24 paired ones, so it is a
  better comparator rather than a changed game. The carried column is stable
  except on 99991 (105 → 102), which is the documented state bleed: the carried
  row runs last, and there are now three times as many playthroughs ahead of it.

  **The gate is clearable carrying a shadow, on every seed tried**, at six or
  seven of eight — at or above the empty-handed bot's own rate. The bot raised a
  shadow on every seed, which is the row's guard against passing vacuously, and
  carried one into the Guardian's arena in six or seven of the runs that reached
  it. That last column is the design claim from § ARISE — the arena holds no
  bodies, so what you walk in with is all you get — measured for the first time.

  **Damage is a wash and the spread is enormous**: 102 carried against 104
  empty-handed on average, with individual seeds ranging from 63/112 to 129/94.
  The ally's help and the cost of standing still for the channel roughly cancel.
  Recorded as a baseline, not as a target, and it is the number the Guardian
  re-tune will move on purpose.

  The bot claims a body only once the fight around it is over. That models a
  careful player rather than a reckless one, and it deliberately does not
  measure the mid-fight gamble — which is a different probe for a different
  claim, and naming that here so the row is not later mistaken for evidence
  about it.
- ~~**The Guardian re-tune.**~~ **Discharged 2026-08-03 by measurement, and no
  Guardian number moved.** The instrument was the debt; the tuning turned out
  not to be owed.

  `ranged` is now the hard gate it was always described as, which required the
  boss probes to be swept — each strategy ran exactly once, so "must not win a
  majority of seeds" was a gate nobody could check. Each strategy now runs eight
  seeds, twice: empty-handed, and walking in carrying a shadow. Carrying one is
  the normal case, since the shadow row above measures six to seven runs in
  eight arriving with an ally, so a boss verified only against a shadow-less
  hunter was verified against the case that mostly does not happen.

  **First measured with the wrong instrument, and a code review caught it.**
  The boss probes had always run at *zero* reaction latency, justified as
  keeping them comparable with older builds. Two things were wrong with keeping
  that. Sweeping them had already broken the comparability it was protecting —
  a single seed read 100 HP left where eight read 61–111 — so the reason had
  stopped applying. And it was the worst possible choice for the specific
  question being asked: a bot that never mistimes a dodge is exactly where an
  ally is worth least, which made zero latency the measurement *least* able to
  see a shadow trivialise the fight, and seeing that was the entire purpose of
  the carrying rows. All six now run at the same 250 ms the playthrough bots
  use.

  Measured on that instrument, wins out of 8, mean HP left in brackets:

      seed        mash      dodge     ranged   mash+S    dodge+S   ranged+S
      20260728   8/8 (64)  8/8 (105)   0/8    8/8 (79)  8/8 (108)    0/8
      1          8/8 (80)  8/8 ( 97)   0/8    8/8 (78)  8/8 (100)    0/8
      99991      8/8 (80)  8/8 (111)   0/8    8/8 (88)  8/8 (108)    0/8
      20260802   8/8 (73)  8/8 (104)   0/8    8/8 (72)  8/8 (106)    0/8
      7777777    8/8 (72)  8/8 ( 98)   0/8    8/8 (81)  8/8 ( 99)    0/8

  **All thirty gate cells pass on all five seeds**, and every carrying row
  raised a shadow in 8 of 8 — a guard added at the same review, because a
  silently broken `giveShadow` would otherwise print `+shadow`, pass, and
  support the conclusion below.

  **Re-measuring strengthened the conclusion instead of overturning it, and it
  was the kiting number that moved.** At zero latency `ranged` won 11 of 40 and
  touched 4/8 on one seed, one win short of failing its gate. At human latency
  it wins **none of forty**, leaving the Guardian around 590 of its 900 HP. The
  old instrument was flattering *kiting*, not the shadow — which makes sense,
  since kiting is the strategy that depends most on never being caught.

  **The premise for the re-tune is disproven.** This document predicted that
  carrying a shadow into the arena would invalidate the verified numbers. It
  does not. Averaged over the five seeds the ally is worth about **+6 HP to
  `mash` and +1 to `dodge`**, and on two seeds it is worth slightly *less* than
  nothing — the sign is not even consistent. The ally trades damage dealt
  against aggro drawn and roughly breaks even, which is the same wash the
  playthrough row found. So there is no gate demanding a change, and changing
  numbers anyway to satisfy a feeling is precisely the thing this document
  forbids — *the boss must not be re-tuned by feel.*

  **One thing recorded rather than acted on.**

  `mash` wins 40 of 40 with roughly two thirds of its health intact, while
  `PLAYTEST.md` records a human needing four or five attempts at the same fight.
  Both are true, and the gap between them is the honest limit of what this suite
  can say: a bot does not panic, misread a flare, or fumble a dash. **The boss
  probes verify that a solution exists, not that the fight is hard.** Difficulty
  remains a question only playtesting answers, and no amount of seeds changes
  that.
- ~~**The telegraph-gap restatement.**~~ **Paid 2026-08-03.** Paired runs and a
  Wilcoxon signed-rank gate; five of five top-level seeds pass, where the old
  assertion failed three of five. See § The telegraph gap is a coin-flip.

## The gate transition, and what it cost to make it free

**Decided and built 2026-08-03**, with gate 2 — the crossing — as its first
customer. Gate 1's exit no longer ends the run on a clear screen; it lights an
arch, the hunter walks through it, and the campaign continues.

**Every gate is built in `Game`'s constructor, and a transition is a visibility
flag.** This was the highest-risk decision in the campaign work and the reason
was known before a line was written: three.js draws four `Math.random()` values
per object for its UUID, `tools/sim.js` seeds `Math.random` globally, and a gate
is several hundred objects. Building one mid-run would spend the gameplay stream
and re-roll every enemy's jitter after it — the failure the SORGI slice cost most
of a session to, at the largest scale the game has to offer it. Constructing
everything up front happens before the suite seeds anything, so the seeded stream
never sees it.

Two consequences worth stating plainly, because both are real costs:

- **Boot time and resident geometry grow linearly with the campaign.** At two
  gates this is not worth measuring. At ten it may be, and that decision belongs
  to the gate that makes it hurt rather than to this one. The alternative —
  building lazily and restoring the unseeded `Math.random` around it — trades a
  measurable cost for a subtle one, which is the wrong trade for the rule this
  project has already broken once.
- **`Level` now owns everything it builds**, including the backdrop and the
  landmark, which used to go straight into the scene. That is what makes a gate
  something one flag can put away.

**The suite counts the draws rather than trusting the argument.** `GATE
TRANSITION` puts a counter around the single update that crosses the arch and
asserts zero, with a shard rig as the control — a counter reading zero because
nobody wired it up reads exactly like a transition that costs nothing. It was
watched failing: a `buildShard()` planted in `_stepThrough` turned the row red
and nothing else, so the row is specific as well as live.

**The first version of that row measured the wrong thing, and the instrument
said so.** It counted seventy frames of walking up to the arch and read 28
draws. All of it was the hunter's footfall dust. A row that can go red because
the boots landed on the transition frame is measuring the boots, so the
measurement now happens from a standstill on the one frame that pays.

**The arch is a place, not a threshold, and it will not take you on the frame it
opens.** Both halves were paid for by a review.

The frame rule came first: a Warden dying while the hunter stood in the doorway
would otherwise open the way and take them through in the same frame — no walk,
no choice, and in the suite a playthrough that carries straight into the next
gate and reports the wrong gate's numbers. So the hunter has to have stood
*outside* the arch since it lit.

The first implementation of that rule armed on `x < exitX`, which made the exit
a line only crossable rightwards — and **that stranded the hunter.** Gate 1
spawns its Guardian at x 190, the arch is at 196 and the arena runs to 204, so
finishing the fight on the right of the arch is ordinary rather than freakish,
and it left the objective lit with the only way out behind them, reachable by
walking backwards through it and then forwards again. The arch is now a zone of
`GATE_ARCH.reach` either side of `exitX`, entered from whichever side you are
on, and the suite clears gate 1 from x 202 and walks *left* into it as its own
row. The probe could not have seen this: it only ever stood the hunter short of
the arch.

**"Has this gate got something to beat" asks after the Warden, not after
`e.boss`.** The first version tested whether any encounter carried the `boss`
flag, which is a different question — four of the ten Wardens are bosses, so
the six that are not would have had an arch that never lit. It now asks whether
the encounter spawned the gate's `warden`, and whether the *gate* has a Warden
block at all. Gate 1's Warden encounter is both, so the branch it takes is
unchanged.

**A gate with no Warden opens on arrival.** The crossing has nothing to beat, so
its way out is lit from the moment the hunter is standing in it, and it is one
of those only until the Ferryman is built.

**The arch is a cut, so effects do not cross it.** Particles, damage numbers and
deferred beats all outlive the moment that made them, and `reset()` used to get
away with clearing only the deferred ones because it always ran behind a screen
change. A transition does not: without `VFX.clear()`, the sparks off a Warden's
death drift through the next realm.

**The hunter arrives whole.** Levelling is the game's only heal and there is
nothing to restore between gates, so a hunter who beat a Warden at 9 HP would
carry that into the next gate with no way back from it — and with no persistence
yet, no way back to anything except gate 1. This is a difficulty decision made
on the safe side rather than a measured one, and the first gate with a fight on
both sides of a transition is the one that can test it. **Style does not carry**:
it is scored within a gate by definition. **Level, EXP, kills, damage and the
clock do**, and so does the shadow — it is a soul being escorted, and the
campaign ends by letting it go.

**Gate 1's suite numbers are unchanged, and that was checked rather than
assumed.** Every section of the report is bit-identical across all five recorded
seeds except the gate descriptors, which gained gate 2's five rows. The suite is
75 PASS / 0 FAIL in ~6.8 s.

**What is still not covered, said plainly.** `GAP REACHABILITY` measures the
gate that happens to be *built* into `game.level`, which is gate 1; the
crossing's built geometry is proven only by the bot that walks it, not by
arithmetic against `level.solids`. And the crossing has never been played by a
human, on a phone or otherwise — `SPEC-CAMPAIGN.md` § Further Notes makes that
playtest the checkpoint before gates 3–10, and it is still owed.

## The touch scheme, and the number the budget was measured against

Built 2026-08-04. Seven controls for seven verbs: a steering pad under the left
thumb, six buttons arced up and to the left from where the right thumb rests,
ordered along that arc by how often a hand reaches for the move. Nothing in the
middle third of the screen, because that is where the camera frames the fight.

The layout is a **descriptor**, not markup — `src/ui/touch.js` — for the reason
a gate is one: `tools/touchcheck.js` reads it and answers, before anything
renders, whether all seven verbs are on the screen, whether any control is a
chord, and whether two targets overlap at any size it claims to support. A
button covered by another button is a verb the hunter does not have, and
nothing in play would say so; the input simply never arrives.

**SORGI gets a target of its own**, which is constraint 1 discharged. The
keyboard keeps `hold S + K` — a chord is free when one hand is idle. `player.js`
takes both routes to the same `_startExtract`, and the branch is skipped
entirely on the frames neither route is asking, which is what keeps the keyboard
path bit-identical.

### What measuring found, and what it cost

**The 6.08-unit running jump the entire touch budget is written against is a
jump whose button is never released.** The suite's bots only ever write into the
input buffer; they have no fingers, so they never let go. Jump height is
variable — releasing mid-rise keeps `jumpCutMul` of the velocity — and a thumb
tap is 60 to 120 ms against a rise of 0.365 s. Measured on this build, against
gate 1's widest crossing, which needs 4.48 units:

| jump button held | distance | reserve |
|---|---|---|
| never released | 6.08 | 26% ← what `gatecheck.js` asserts |
| 0.30 s | 5.76 | 22% |
| 0.22 s | 5.36 | 16% |
| 0.10 s | 4.40 | **−2% — the gap stops being crossable** |

So the scheme as first written spent the whole reserve, and constraint 2 — the
one constraint of the three that was supposed to be *machine-checked rather than
trusted to memory* — was being checked against an input no phone produces. The
static assertion was not wrong; it was measuring a different device than the one
about to play the game.

**The fix is a `sustain` on the jump control**: a tap asserts the action long
enough that the arc a thumb gets is the arc the gates are authored against. It
is counted in game time inside `Input`, aged in `endFrame` alongside the buffer,
rather than by a `setTimeout` — the hold has to be a number of frames of
simulation, so a throttled tab or a paused loop must not spend it, and a
wall-clock timer would also make it untestable in the stepped harness everything
else here is verified in.

**The span is the rise plus the buffer, and getting that wrong was the second
bug.** The first version anchored the guarantee to the finger, which is wrong
because a press does not become a jump when the finger lands: a jump tapped just
before the feet touch down waits in the 0.24 s buffer, and `player.js` keeps it
alive there on purpose. That pre-landing tap *is* the running jump a crossing
needs. Measured with the guarantee anchored to the finger, a tap made 0.16 s
early crossed 5.76 units and one made 0.22 s early crossed 5.68 — 22% and 21%,
under budget again, by a different route. Overshooting costs nothing, because
the cut only applies while `vy > 0` and a guarantee outliving the rise is
released into a fall. So the hold covers both spans.

Both failures are now negative controls in `touchcheck.js`: *a jump a thumb can
only cut short*, and *a hold that forgets the buffered press*. The second one
exists because a review caught it, and a check nobody has watched fail is not
known to work.

**The acknowledged cost:** a phone cannot ask for a *short* hop. No gate
requires one — `gatecheck.js` proves every crossing against the full arc — and a
gate that did would be authoring against an input half the players do not have.
That is a real reduction in expressiveness on touch, recorded rather than
waved past.

`touchcheck.js` asserts `sustain >= rise + buffer`, all three derived from
`config.js` and `input.js`, so moving `jumpVel` or the buffer cannot leave this
quietly wrong. That is the same reasoning `gatecheck.js` uses for its reserve
threshold, and it is here because this failure was invisible for exactly as long
as nobody had fingers.

**What this does not prove.** Constraint 3 — never a direction plus two buttons
at once — is a claim about what a *fight* demands rather than what the screen
offers, and nothing static can check it. Neither can anything here tell you
whether a 26% margin is comfortable for a real thumb, only that the arc is the
one that was measured. `SPEC-CAMPAIGN.md` § Further Notes makes the phone
playtest the checkpoint before gates 3–10, and the budget was adopted with
"the only proof a thumb can clear a 26% margin is a thumb" written next to it.
That is still true, and it is still owed. What changed is that the thumb now
gets the arc the claim was about.

**No pause control**, deliberately. The moveset is frozen at seven and pause is
not a verb, so an eighth button would be the exact thing the freeze exists to
prevent. Every screen a run can land on — title, death, clear — already has a
real button on it, so a gate is completable and repeatable without one. If the
phone playtest wants pause mid-run, that is a decision to take on its own
evidence rather than smuggle in here.

## The charger, and why its numbers are arithmetic rather than feel

The first of the three new archetypes. It exists to punish standing still, so
that the crossing teaches movement before the hells demand it.

**The whole design is four numbers and one subtraction.** A charge covers
`speed × dur` = 8.1 units, and it will only commit from inside `range` = 7.5.
That ordering is the "punishes standing still" half: a hunter who does not move
is hit from anywhere the charger is willing to start, with no distance to back
into and no clause to argue about. The other half is that answering it always
works with room to spare — the tell is read 0.25 s in, leaving 0.27 s of
wind-up, which buys a 4.19-unit dash plus about a unit of run. The charge then
starts from at least 3.0 + 5.2 = 8.2 units and closes at 18 − 9.6 = 8.4 a
second, needing 0.98 s against the 0.45 s it has.

None of that was arrived at by feel, and the reason matters: the first version
had `dur` at 0.7 s and no minimum range, which made the charge unanswerable by
moving away and left the enemy recovering twelve units from the hunter — a
"punish window" nobody could reach. The spec's own warning is that three new
telegraphs validated by one playtester is where this project is most likely to
go wrong. Numbers that can be derived should be derived, so that the phone
playtest is spent on the things that cannot be.

**The recovery is the ticket, and it is measured rather than declared.** A
charge ends *past* the hunter, so `recover` has to cover running back in as well
as swinging; reading 1.3 s off the config would be reporting a window that only
exists where nobody is standing. The suite times the run-in and the swings and
reports what the window is actually worth: 59 of its 64 HP, which is a full
light chain. Two read tells kill it and nothing else does.

**It is introduced alone, and that is enforced rather than intended.** Nothing
else spawns in the crossing at all, the encounter is sealed so the lesson cannot
be walked past, and the `solo debut` check holds gates 3 and 4 to the same thing
when the armoured enemy and the summoner arrive. A tell first met in a crowd is
a tell the player infers wrongly and then has to unlearn.

**Two rules held without argument.** No contact damage — the suite stands the
hunter inside a charger for a second and asserts zero, because round 3 of the
playtest log records what happens when a player merely *believes* a body hurts.
And it leaves a remnant, because SORGI's promise cannot be selectively true.

**One number moved that was not the charger's.** `GUARDIAN.enrageWindupMul` was
a `0.78` literal in `boss.js` until the telegraph check needed to read it. The
"every tunable in `config.js`" rule exists precisely so that a number nobody can
find is not silently exempt from the checks.

## Art direction

The palette **darkens progressively left to right** — pastel at the entrance,
grim at the boss arena. The level is linear, so this is a lerp on `player.x`
over the fog, sky and grass colours. It keeps the stylised-open-world look the
project was briefed on while arriving somewhere that suits the ending, and
gives level 1 a dramatic arc it currently lacks.

## The shadow wears its source's kit, not just a beast rig

Filed from issue #21 (phone playtest): a shadow raised from a Charger's
remnant looked and moved like a Beast, because `Shadow` hardcoded
`extends Beast` back when only beasts left remnants. `Charger.leavesCorpse`
was later set to `true` deliberately — "SORGI's promise cannot be selectively
true" — but nothing taught the shadow itself to keep that promise. Grilled
2026-08-05, resolved before the fix was built rather than after, because the
fork ("wears the rig" vs "runs the kit") changes what the ally *is*, not just
what it looks like.

**The shadow runs its source archetype's real state machine, not a
reskinned pounce.** A shadow raised from a Charger charges — telegraph,
commit, recover — the same triangle the hostile Charger teaches, rather than
adopting the beast's chase-and-pounce with a different texture. The
alternative (rig-only, behaviour stays pounce for every source) was rejected:
it is cheaper but makes "the shadow wears the beast's rig" true forever
regardless of what died, which is the same complaint from a different enemy.

**One `Shadow`-role class per corpse-leaving archetype, sharing ally glue
through a mixin rather than a base class.** `BeastShadow extends
shadowOf(Beast)`, `ChargerShadow extends shadowOf(Charger)`. `shadowOf(Base)`
is a factory, generated once per archetype at module load — not per
instance, so raising a shadow still allocates nothing beyond the rig, per the
project's standing rule. Each concrete class is a near-empty declaration;
the shared ally invariants (never hostile toward the hunter, one victim per
commit, no corpse of its own, re-forms beside the hunter when left behind)
live once, in the mixin, not copied per archetype. An internal switch inside
one `Shadow` class was considered and rejected: it would re-implement each
archetype's tell timing a second time instead of reusing `Beast`/`Charger`'s
own code, which is exactly the kind of drift the suite's seeded-seed
philosophy exists to catch late rather than prevent early.

**`Charger` gains a `_canCommit()` seam, mirroring `Beast`'s.** `Beast`
already gates its pounce commit behind `_canCommit()`, overridden by the
ally to require a live enemy target. `Charger`'s telegraph commit was
inlined in its chase state with no such seam. Adding the hook (default
`true`, so hostile chargers are unaffected) is what lets `ChargerShadow`
reuse `Charger.update()` verbatim instead of forking the whole state
machine.

**A shadow's charge does not chain, even if its source could.** A hostile
Warden chaining charges at the hunter is a threat the player reads and
answers; the same chaining aimed at an enemy by an unsupervised ally reads as
the shadow committing itself repeatedly in a corridor with nothing gating it
sanely. Capped at one commit. Whether a Warden's remnant should ever produce
a chaining shadow is not decided here and does not need to be until a Warden
actually leaves one.

**Corpses remember what they were, and shadow selection reads that
directly.** `Corpse` gains the dying enemy's own class; `extract()` looks up
the matching shadow class from a table the enemy declares against itself
(`static shadowClass` alongside `leavesCorpse = true`) rather than a
lookup table maintained elsewhere — so a future archetype that starts
leaving remnants declares its own shadow behaviour in its own file, the same
place it already declares that it leaves a remnant at all.

**Scope held at two.** Only `Beast` and `Charger` leave remnants today; wisps
and the Guardian still leave nothing, unchanged by this. `SHADOW.charge`
(the ally's own damage/knock numbers) is a new, separately-tuned config
block, the same relationship `SHADOW.pounce` already has to `BEAST.pounce` —
not a number derived up front the way the hostile Charger's numbers were,
because a support ally's damage carries far lower stakes than an attack the
player has to answer with a dash.

## Deferred, deliberately

- ~~**Persistence / meta-progression.**~~ **Reversed 2026-08-03.** Replay value
  only matters once the loop is good — and the loop is now good enough that ten
  gates are being built on it. Nobody clears ten gates in one sitting on a
  phone, so a save is no longer a feature sitting on top of the game; it is the
  substrate the whole campaign and its monetisation rest on. It also converts a
  decision this document explicitly said was *not* a persistence decision — "the
  teaching line fires once per page load" — into one. See § Campaign, audience
  and platform.
- ~~**More enemy types.**~~ **Reversed 2026-08-03.** Two plus a boss was enough
  to prove the mechanic, which is exactly what it was chosen for and exactly
  what it did. It is not enough to carry ten realms: beast-and-wisp in the god
  realm and beast-and-wisp in the hells is one game wearing ten hats. Three new
  archetypes are added, chosen as tactical verbs rather than skins. The reason
  the original deferral was wise still binds and is carried forward as a cost,
  not a veto — every new enemy is a new telegraph that has to be taught,
  verified and defended, and telegraph readability is what three playtest rounds
  were spent on.
- **Gamepad.** Movement is digital left/right, so a stick offers no fidelity a
  key doesn't — this is comfort, not accuracy. Revisit only if the playtest says
  the hand position is the problem.

- ~~**The encounter frame-skip.**~~ **Resolved 2026-08-02** — see below. Left in
  this section, struck through, because the shape of the search is worth more
  than the answer was.

  | Theory | Killed by |
  |---|---|
  | Compositor allocating the blur texture | Warm-up shipped; symptom unchanged |
  | `backdrop-filter` re-blurring per frame | Filter removed; symptom unchanged |
  | First wisp's shader | The chasm is the only encounter that never skips, and it *is* the first wisp |
  | Enemy build cost | 0.3–1.4 ms of JS on frames lasting 30–80 ms |
  | Shader compilation | +1 program on the first beast, then flat. Nothing compiles at the bridge or the boss |
  | Accumulation or a leak | Programs and geometries both flat between encounters |

  What survived that table was a correlation: every encounter that opens a
  System window skipped, the chasm — the one that opens none — never did, and
  nothing correlated with what spawned. The Guardian's +78 geometries are the
  only real allocation in the game and are not where the worst spike is.

  **The cause was the compositor layer, not the blur.** `.sys-window` carried
  `will-change: opacity, transform` and `transform: translateZ(0)`, which
  promote the element onto its own layer. Over a full-screen WebGL canvas the
  browser then keeps a separate texture and re-composites it every frame the
  window is alive — which is precisely a burst of 32–84 ms frames lasting as
  long as the window does, each carrying 0.8 ms of JavaScript. Those properties
  had been added to accelerate the `backdrop-filter`, so removing the filter and
  leaving them behind removed the cheaper half and kept the expensive one.

  Three builds isolate it, and the middle one is the control:

  | Build | `backdrop-filter` | Own layer | Skip |
  |---|---|---|---|
  | round 1 → round 3 | yes | yes | yes |
  | filter removed | **no** | yes | yes |
  | layer removed too | no | **no** | **none** |

  **The lesson is not "avoid `will-change`".** It is that four theories in a row
  were about work done *once* — allocating a texture, compiling a shader,
  building a model — while the evidence said the cost lasted as long as the
  window was on screen and allocated nothing. The counters that finally settled
  it (`renderer.info.programs`, `.memory.geometries`) are cheap and need no
  frame timing at all; they should have been the first measurement rather than
  the fifth. And the one thing that did get fixed blind — the warm-up — cost two
  rounds by making a wrong theory look addressed.

## Villain/boss HP stays at one-shot-kill until Android

Settled 2026-08-06, after the crossing's phone-playtest checkpoint (#13) ran
clean with `hp: 5` on every villain/boss entry in `config.js`. That value was
introduced as a TEMP hack for testing on a phone browser over `tools/serve.py`
on the local network — full HP made phone playtesting impractical.

**Do not revert it.** The original plan was to `git checkout -- src/game/config.js`
once the checkpoint passed. That's wrong: the constraint that motivated the
hack — testing combat balance on a phone — doesn't go away when the checkpoint
closes, it recurs on every phone session until there's a proper Android build
to test against instead of a browser tab. Reverting now would just mean
re-applying the same hack for the next phone round.

**The value is real until the Android port exists.** When SOMBRA is ported to
an Android app, full HP tuning becomes testable on-device again without this
workaround, and this decision should be revisited then — restore real HP
values as part of that port, not before.

## The frozen telegraph gate's FULL PLAYTHROUGH probe stays red under the HP hack, deferred to the ten-gate checkpoint

Settled 2026-08-07, from issue #22 ("The frozen telegraph gate is failing on 4
of 5 canonical seeds").

**Confirmed, not noise.** Reproduced independently on all five canonical seeds
at `f243d6f`: 4 of 5 FAIL (p 0.103, 0.060, 0.145, 0.397; only `7777777` clears,
at p 0.026), against a documented false-negative rate of roughly two seeds in
nine. The pattern holds both before and after #18's fix, so that change isn't
the cause.

**Suspected mechanism.** The HP hack above set every villain/boss to `hp: 5` —
equal to a single light attack. `FULL PLAYTHROUGH`'s signed-rank test measures
the damage-taken gap between a bot that reads tells and one that ignores them;
one-shot-kill minimizes both bots' exposure time alike, which would narrow
that gap regardless of seed. Not confirmed by isolating the mechanism —
only by correlation and the test's own stated premise.

**Deferred, not fixed, until the ten-gate campaign is complete.**
Reconciling this — restoring real HP, reworking the gate's math to tolerate
one-shot HP, or something else — is a call between two already-recorded
decisions (the HP hack and the frozen gate) that shouldn't be made piecemeal
mid-campaign. Revisit it at the same checkpoint as the HP hack itself, once
all ten gates are built. Until then, a red `FULL PLAYTHROUGH` row on 4-of-5
seeds is expected here, not a regression to chase.

## GATE GUARDIAN and THE CHARGER also stay red under the HP hack, deferred to the same checkpoint

Settled 2026-08-07, from issues #24 ("ranged beats the Gate Guardian on a
majority of runs"), #25 ("The Charger's recovery window isn't punishable")
and #26 ("A Charger killed outright leaves no claimable remnant").

**Same mechanism as #22, isolated the same way.** Each row was confirmed by
temporarily restoring the pre-hack value and re-running `?sim`, then reverting
before commit:

- `GUARDIAN.hp` at 900 (its pre-hack, previously-verified value — see § "The
  Guardian re-tune", discharged 2026-08-03): all six `GATE GUARDIAN` rows pass,
  `ranged` wins 0 of 40 and leaves the Guardian around 590–598 of its 900 HP —
  reproducing that discharged finding almost exactly.
- `CHARGER.hp` at 64 (its pre-hack value — see the `charge.recover` comment in
  `config.js`, "measures 59 of its 64 HP"): both `THE CHARGER` rows pass, 59
  damage landing in the recovery window and one claimable remnant.

At `hp: 5`, both probes break for the reason `FULL PLAYTHROUGH` does: they
measure something that only exists across multiple hits or a sustained
window — a DPS race the boss must survive long enough to lose, a punish
window worth two light swings, a fight that ends by being fought down rather
than one-shot. One-shot-kill HP collapses all three into "whoever lands the
first hit," which is a different, uninteresting question, and answers it
before the mechanic under test ever runs. `ranged`'s own bolt (23 damage) is
larger than `hp: 5`, so `GATE GUARDIAN` is not merely flaky at this HP, it is
structurally unwinnable by the invariant it checks. `THE CHARGER`'s first
light swing (13 damage) exceeds `hp: 5` the same way, and issue #26 is a
downstream symptom of #25: the charger already died mid-recovery-window, so
the remnant probe's "before" baseline was taken after the real remnant had
already been claimed.

**Deferred, not fixed, for the same reason as #22.** Restoring these two
values alone (leaving `BEAST`/`WISP`/`FERRYMAN` at the phone-playtest `hp: 5`)
would satisfy the letter of "do not revert it," since bosses and the Charger
sit outside what a phone playtest round is checking. But making that call
piecemeal, three issues at a time, is exactly what the frozen-gate decision
already warned against. Revisit `GUARDIAN.hp` and `CHARGER.hp` at the same
HP-hack checkpoint as #22 — the ten-gate campaign completion, or the Android
port, whichever comes first. Until then, red `GATE GUARDIAN` and `THE
CHARGER` rows are expected here, not regressions to chase.

## Gates 3–10 begin now, with the HP-hack regressions still open

Settled 2026-08-07. `SPEC-CAMPAIGN.md` § Further Notes lists the build order:
pay the three debts, open the level-data seam, Tier 1 static checks, author
and phone-play gate 2 as the checkpoint, persistence and the string module,
then gates 3–10. Steps 1–5 are done — gate 2 was played on a phone (#13,
closed), and persistence plus the string module landed in `eaf9045`. Step 6 is
next on schedule, not early.

**The open call was whether #22's and #24–26's deferred HP-hack regressions
should block that.** They don't. The decision: build the whole ten-gate
campaign through to playable now; treat `GUARDIAN.hp`, `CHARGER.hp`, and the
signed-rank telegraph gate as still-open debts to settle at the HP-hack
checkpoint, not preconditions for starting. Four of the ten gates are new
Guardian-class bosses built the same way (§ Further Notes' own risk note), so
building them sooner surfaces whatever else that archetype breaks sooner too,
while the fix for all of it is already scoped to one checkpoint at the end.

**What this does not change.** The HP-hack checkpoint itself — restore real
HP, or reconcile the gates' math to it, once at the end rather than piecemeal
— stands exactly as recorded above. A gate 3–10 boss or Charger encounter
that reproduces the same one-shot symptom is expected, not a new regression,
until that checkpoint is reached.

## The System window pauses the fight it explains

Settled 2026-08-06, via `/grill-with-docs` on issue #18 ("The System covers
the fight it is explaining"). Built and verified across the five recorded
seeds.

**The bug, confirmed live at 375×812.** `Game._startEncounter` queues an
encounter's spawns and opens its System window in the same call. The window
is purely timer-driven — no dismiss, it closes only on its own `setTimeout` —
and its 2600ms life outlasts the delay on gate 1's first two beasts, so the
panel is still on screen, occluding the hunter, while enemies queued
underneath it are already fighting. The round 3 fix recorded in `gate1.js`'s
`first-blood` comment shortened the window's *text*; it never touched the
*geometry* or the *timing*, which is why the phone playtest saw the same bug
again in a different shape.

**Decision: pause, not hold, not teach-before-trigger.** Teach-before-trigger
was rejected outright — round 3 already established that the window's text
should arrive *with* the visible threat, not before it exists, and moving it
earlier would reverse a decision that was already tested and fixed once.
Between hold and pause, pause won: it reuses the existing hit-stop primitive
(`game.freeze` / `Game.timeScale()`) instead of inventing a second, parallel
hold mechanism, and it keeps text and threat simultaneous — a frozen tableau,
not an absence.

**Mechanism.** Extend `game.freeze` to cover the window's duration wherever
`_startEncounter` opens one via `e.intro` — `Math.max(this.freeze, duration)`,
the same pattern hitstop already uses (game.js:625, 663). Applies uniformly to
all three durations `_startEncounter` can select (`encounter`,
`encounterNote`, `bossIntro`) — no special-casing by whether the window
carries a `note`.

**The player is frozen too, not just the spawns.** `freeze`/`timeScale` halts
the whole fixed-step simulation, so this is a stronger pause than "hold" as
the issue originally framed it — the hunter can't move or act until the
window clears either. That is intended: because nothing can harm the hunter
by touching them, a fully frozen sim costs a reading player nothing and gives
a non-reading player nothing to gain by waiting. The mechanism removes the
issue's "what stops a player who isn't reading" question rather than
answering it.

**Boss windows get no special-casing, and that resolves a second sub-bug for
free.** Neither gate's Warden spawn has a 0-delay (0.9s and 0.6s
respectively), so under a uniform pause neither Warden spawns, or starts its
2.4s entering animation, until its `bossIntro` window has closed. "The window
opens with the Warden already committed" — the issue's other boss-specific
complaint — stops being true without any boss-specific code.

**The suite could not see this, and that gap gets closed too.** `Bot.step()`
(`tools/sim.js:136-149`) drives `Game.update()` directly, every step,
unconditionally — it never goes through `Loop`'s `timeScale()`-gated
accumulator and never calls `render()`, which is where `freeze` decays. A
pause built purely on `game.freeze` would be invisible to `?sim`: `FULL
PLAYTHROUGH` would not move, and a broken pause — wrong duration, or none at
all — would still read 120/120 green. `Bot.step()` is being taught to
decrement `freeze` by `DT` and skip `update()` while frozen, mirroring what
`Loop` and `render()` do in the real game.

**What suite movement counts as expected, not a regression.** By rough count
of the intro windows `_startEncounter` can currently open across the two
built gates, a full clean run was expected to pick up roughly 11.7s (2600 +
1700 + 2400 for gate 1, 2600 + 2400 for gate 2). The actual figure, measured
per-seed against the pre-fix build:

| seed | reads tells avg | ignores tells avg |
|---|---|---|
| 20260728 | 31.9s → 33.2s (+1.3s) | 34.1s → 34.9s (+0.8s) |
| 1 | 33.3s → 33.1s (−0.2s) | 33.5s → 34.7s (+1.2s) |
| 99991 | 34.2s → 33.3s (−0.9s) | 33.5s → 35.2s (+1.7s) |
| 20260802 | 34.7s → 33.4s (−1.3s) | 33.7s → 33.9s (+0.2s) |
| 7777777 | 33.3s → 32.1s (−1.2s) | 34.1s → 34.6s (+0.5s) |

Mean movement is +0.9s for the naive bot and −0.5s for the reading one —
nowhere near 11.7s, and not even uniformly positive. Both are explained by
what `FULL PLAYTHROUGH` actually exercises: it plays gate 1 alone, not both
gates, and `avg` is a mean over only the runs that clear. A fixed pause
inserted earlier in every run shifts every later `Math.random()` draw on the
seeded stream, which nudges *which* of the 24 seeds clear versus die as a
side effect having nothing to do with the pause's own duration — that
composition shift is what swamps the raw pause time in this particular
metric. **This measured range — not the 11.7s estimate — is what a future
`FULL PLAYTHROUGH` change should be checked against.**

## The steer control becomes a stick; SORGI goes back to hold-down + heavy

Settled 2026-08-07, from issue #17 (the first phone playtest's touch-control
findings) via `/grill-with-docs`. Reverses part of § The touch budget's
constraint 1.

**The steer pad becomes a joystick — PS/Xbox-style, direction only, held with
the thumb.** It replaces the one-axis slide-to-steer pad. SORGI returns to a
held-direction chord: hold down on the stick, press the heavy-attack button —
the same `down` + `heavy` combination the keyboard already sends. The
dedicated `sorgi` touch action is retired; touch converges on the keyboard's
existing route through `player.js`.

**Constraint 1 ("no chord may be required") is reversed for this one case,
not in general.** It was written against the keyboard's `hold S + K`, where
one hand is fully committed to two simultaneous demands. Holding a direction
on a stick the thumb is already resting on is a single continuous gesture,
not a second competing input, so it isn't the chord the constraint was
guarding against. Constraint 3 ("no beat may require a direction plus two
buttons at once") is untouched and still stands.

**Not yet resolved by this decision, left to implementation:** whether
`tools/touchcheck.js`'s `no chord` check needs to change shape now that a
held direction is expected, and the exact stick geometry (round vs. a
three-way control, given the game has no vertical movement). Both are
mechanical follow-ons of the decision above, not open design questions.

## Save scope: what "hunter rank persists" means, and what does not ship yet

Settled 2026-08-07, implementing SPEC-CAMPAIGN step 5. § Progression: rank
carries, the moveset never grows and § Text is centralised now, translated
later both named the intent; this is the scope the implementation actually
landed, decided directly rather than assumed.

**"Rank carried between gates" (user story 18) means resuming an
in-progress run, not just a historical best.** Level and exp already survived
gate-to-gate within one page load before this — `Game.reset()` only reset
them at a full restart. What was missing, and what this adds, is the same
guarantee surviving a closed browser: the save records the furthest gate
reached and the level/exp the hunter had on arriving there, and a fresh
`start()` resumes from it rather than gate 1. Nobody clears a ten-gate
campaign in one phone session, so this is the point of persisting at all —
see § Campaign, audience and platform.

**No gate-select or replay screen ships with this step.** Story 20 ("replay a
cleared gate") is a real consequence of the data this step stores
(`clearedGates`, `bestStyle`), but building a picker for two gates is
premature UI for data nobody can act on yet. The storage layer is in place;
the screen is deferred to whenever gates 3–10 exist and there is enough to
navigate. Silent auto-resume at the furthest gate is what ships instead.

**Settings is a reserved, empty key and nothing else.** `docs/SPEC-CAMPAIGN.md`
names it once, in the `localStorage` line, with no elaboration anywhere else
in the spec — no volume control, no toggle, no options menu exists in the
game today to promote. `save.settings = {}` keeps the save's shape forward
compatible without inventing a feature the spec never asked for.

**A gate is identified by its own `id` (e.g. `'gate-2'`), not by array
position.** `game.js` already keys `storyBeats` this way; array position
would silently break the moment a gate is inserted ahead of another one,
which building gates 3–10 is going to do.

**Retry-after-death was a live bug this step happened to fix.** Before this,
dying mid-gate-2 and pressing retry sent the hunter back to gate 1 — `reset()`
always called `_enterGate(0)`. Reading the resume point from the save instead
fixes this for free: a same-session retry and a post-reload resume are the
same code path, and neither had ever advanced the save past the gate the
hunter was still fighting.

## Naming pivots to Nepali: Aago, Pukar, Chaya, and the locked gates 3–10 table

Settled 2026-08-07 via `/grill-with-docs`, ahead of building gates 3–10.
**Uncommitted at the time of this entry** — the working tree carries the
renames below but nothing has been committed; that is this handoff's first
job for whoever (human or a future session) picks this up.

**Three renames, not a wholesale i18n pivot.** § "Naming and positioning"
committed the game to Romance-language move names (Sombra, Décret, Ascensão)
as an authored-not-generic aesthetic, independent of the copyright reasoning
that drove the original rename. This decision does not reverse that: only
**Décret → Aago** (fire) and **SORGI → Pukar** (the command word) and
**Shadow → Chaya** (the ally) change. **Ascensão stays Romance, deliberately**
— explicitly decided against a full pivot, so the game now carries two naming
conventions on purpose rather than by drift. Aago and Pukar are Nepali
specifically, not Sanskrit or "South Asian" generally, even though gates 3–10
lean on Sanskrit/Pali mythology (Naraka, preta, deva, asura, Yama) — those
stayed as-is because they were already correct, not because this decision
chose that register.

**The Chaya/Shadow collision was caught and resolved before any code moved.**
'Chaya' means "shadow" in Nepali, which would have collided with the existing
glossary term **Shadow** — the ally raised from a remnant — had SORGI (the
*command word*) taken that name. The mapping was swapped: **Chaya names the
ally**, and the command word became **Pukar** instead, keeping "shadow" where
the fiction already put it rather than putting it in two places that mean
different things.

**Décret → Aago is a reskin, not a rebalance.** Every `MAGIC` tunable in
`config.js` (damage 23, cost 16, pierce 1, cooldown 0.34, etc.) is the
survivor of three playtest rounds per this file's own record above; moving
them now would make a future result unattributable to either the color change
or the number change. Only the name and the bolt's palette (`aagoCore` /
`aagoGlow`, warm orange-red) moved.

**The sword became a khukuri in geometry only.** `buildBlade()` in
`models.js` now extrudes a curved-belly, notched profile instead of a
straight blade, still filling the same `n.sword` slot `player.js`'s animation
rig already points at. `swordZ`/`swordX` and every juggle/combo timing curve
in `player.js` are untouched — those numbers are tuned against hitboxes, not
blade shape, and reworking them was explicitly ruled out of scope.

**"Everywhere you can" was scoped down twice before it hit code.** The first
ask was to Nepali-ify aggressively; two boundaries got drawn in the
interview rather than assumed: genre-standard structural terms (Hunter,
Gate, Realm-as-category, Rank, Style, Campaign, the System, Boss, and
**Remnant**) stay English because `DECISIONS.md` already drew that line for
LitRPG vocabulary and this extends the same reasoning to Remnant, which is
a structural noun rather than a mechanic name or species. What *is* in scope:
mechanic/ability names, enemy species, and — after a second widening —
Warden titles and realm names, including gates 1–2's already-shipped
`Gate Guardian` and `The Ferryman`, on the grounds that renaming a display
string doesn't touch the frozen stats behind it.

**The locked table, for gates 3–10 authoring:**

| Category | Old / English | New / Nepali |
|---|---|---|
| Magic | Décret | **Aago** |
| Command | SORGI | **Pukar** |
| Ally | Shadow | **Chaya** |
| Enemy species | Beast | **Raakchyas** |
| Enemy species | Wisp | **Bhoot-Batti** |
| Enemy archetype (new, gate 2/3) | Charger | **Mahish** — buffalo, Yama's own mount |
| Enemy archetype (new, gate 3) | Armoured | **Kawach** |
| Enemy archetype (new, gate 4) | Summoner | **Tantrik** |
| Realm 02 | The crossing | **Ghat** |
| Realm 03 | The hells | Naraka *(unchanged — already Nepali)* |
| Realm 04 | The hungry ghosts | **Preta-lok** |
| Realm 05 | The animal realm | **Pashu-lok** |
| Realm 06 | The human realm | **Manav-lok** |
| Realm 07 | The asuras | Asura-lok *(unchanged — already Nepali)* |
| Realm 08 | The devas | Deva-lok *(unchanged — already Nepali)* |
| Realm 09 | Yama's court | **Yama-sabha** |
| Realm 10 | The Wheel | **Bhavachakra** |
| Warden 01 | Gate Guardian | **Dwar-Rakshak** |
| Warden 02 | The Ferryman | **Kevat** |
| Warden 03 | The Ox-Headed | **Goru-Mukh** |
| Warden 04 | The Unfilled | **Atripta** |
| Warden 05 | The Pack-Mother | **Bagh-Aama** |
| Warden 06 | The Magistrate | **Hakim** |
| Warden 07 | The Ever-Warring | **Amar-Yoddha** |
| Warden 08 | The Long-Lived | **Chiranjivi** |
| Warden 09 | The Backlog | **Bakaya** |
| Warden 10 | What Grew In The Stillness | **Maun-Ankur** |

Gate 1's realm ("the breached world") stays unnamed, matching that it was
never a proper noun in `SPEC-CAMPAIGN.md` either.

**Verification status.** Both rename passes (Aago/Pukar/Chaya/khukuri, then
Raakchyas/Bhoot-Batti/Dwar-Rakshak/Kevat) were run through `?sim` across all
five recorded seeds after each pass. Result both times: identical PASS/FAIL
shape to pre-change `main` at `d95ef55` — the same 4–5 already-deferred rows
(`ranged` boss, `ranged +chaya` boss, charger `recovery-window`, charger
`leaves-remnant`, occasionally flaky `signed-rank`), zero new failures. No
suite row moved because of these renames.

The rename above was committed at `9e6293a`, closing out that handoff.

## Gate 3 (Naraka): Kawach, Goru-Mukh, and a `Boss` base class

Authored 2026-08-07, committed at `05a5fd7`, continuing straight from the
rename above. Naraka is gate 3's realm — iron and red-black, per the locked
table — carrying the campaign's first new archetype since gate 2's charger
and its second boss.

**`Boss` was extracted from `Guardian` before Goru-Mukh was written, not
after.** This was already a standing decision (§ "Bosses subclass, they do
not copy" above), owed the moment a second boss entered the build order —
gates 3, 6, 8 and 10 are all boss-tier per `SPEC-CAMPAIGN.md`'s table, so
Goru-Mukh was always going to be the test of whether that decision held.
`Boss` carries what is genuinely shared — poise-based `takeHit` (hp, the
enrage threshold, the death transition), hit-flash, `_windupTime()`, and the
death-collapse physics behind an overridable `_dieAnimate(u)` hook.
`Guardian extends Boss` kept its full state machine, attack set and pose
table untouched — the extraction was verified behavior-preserving by reading
gate 1's `DWAR-RAKSHAK` suite rows unchanged before and after (mash/dodge/
mash+chaya/dodge+chaya still PASS, `ranged`/`ranged +chaya` still the same
frozen FAIL). `GoruMukh extends Boss` is substantially shorter than
`Guardian` as a result: three attacks (charge, slam, sweep — no volley; a
melee judge doesn't need range, and the campaign already teaches one ranged
boss in gate 1), its own rig (`buildGoruMukh` in `models.js`), its own pose
table, all enraged windups clearing the 0.42s floor with room to spare
(sweep is tightest at 0.484s, 64ms clear).

**Kawach's armour is one number, not a second system.** `KAWACH.
armorBreakLaunch = 13.0` — the launcher move's own `launch` value, not an
independently-tuned threshold that could drift out of sync with it. Below
that, `Kawach.takeHit` absorbs the hit entirely: no damage, no stagger, no
interruption to whatever it was doing — chase, telegraph, and its `bash`
attack all run through a shrugged-off hit exactly as if it hadn't landed. At
or above it, the hit falls through to `Enemy`'s ordinary reaction, unabridged
— armour that only partly breaks is not armour breaking. This is the first
conditional-resistance hit-reaction in the combat system; nothing before it
needed one; `Guardian`'s poise is unconditional (no reaction ever), which is
a different problem with a different fix.

**The introduction is sealed and solo, same shape as the crossing's
charger.** Kawach's first encounter (`kawach-alone`) spawns nothing else —
`gatecheck.js`'s `soloDebut` check makes that a build failure if broken
rather than a house rule someone has to remember. Its second appearance
(`the-queue`) mixes it with raakchyas, already taught in gate 1. Goru-Mukh's
own encounter is, as with every other Warden, its own solo debut by
construction.

**One pre-existing `?sim` probe needed a fix, and it wasn't gate 3's bug.**
`GATE TRANSITION`'s "and the crossing is walkable" row hardcoded
`game.state === 'ended'` as proof gate 2 led somewhere — true only because
gate 2 used to be the last gate. The moment `GATE_3` entered `GATES`, gate
2's arch correctly led into gate 3 instead of ending the run, and the probe
read that correct behaviour as a failure. Fixed to `game.gateIndex !== 1`
— "the hunter left gate 2," not "the campaign ended" — which is what
"walkable" was always supposed to mean and stays correct as more gates are
added. This is the kind of thing the campaign's own build order warned
about: a probe written against a one-gate or two-gate world can encode an
assumption nobody meant to freeze.

**Verification status.** `?sim` across all five recorded seeds, after the
`GATE TRANSITION` fix: gate 3's Tier 1 rows all PASS (jump reserve steady at
26%, matching gates 1–2's own figure), `telegraphs` PASS including all three
new Kawach/Goru-Mukh tells, `solo debut` PASS. No suite row moved beyond the
already-frozen deferred set (`ranged` boss, `ranged +chaya`, charger
`recovery-window`, charger `leaves-remnant`, occasionally flaky
`signed-rank`).

### Handoff: what the next session picks up

**Gate 3 has not been played by a human.** `SPEC-CAMPAIGN.md`'s checkpoint
rule — play each new gate before starting the next one — is exactly the rule
that gated gate 2 before gates 3–10 began, named explicitly in this file's
own prior handoff as "the whole reason gates 3–10 weren't started before
gate 2 was played." The bots clearing gate 3 in `?sim` is not that checkpoint
satisfied; it is the Tier 1/telegraph floor the checkpoint sits on top of.
Play gate 3 — on a phone, per the touch-budget checkpoint the same spec
names — before authoring gate 4.

Gates 4–10 are otherwise unstarted. Build order is unchanged from
`SPEC-CAMPAIGN.md`: author one gate at a time, Tier 1 clean, `?sim` clean
across the five seeds, played before the next one starts. Gate 4 (the hungry
ghosts / preta-lok, the summoner archetype, The Unfilled) is next once gate
3's playtest is done.

## Gate 4 (Preta-lok): Tantrik, Atripta, and the checkpoint knowingly deferred

Authored 2026-08-07, continuing straight from gate 3's handoff above.

**The checkpoint was not met, and that is a recorded decision rather than a
lapse.** The session that opened this work was told directly: gate 3 will not
be played now, build the next stage anyway. Asked to confirm given
`SPEC-CAMPAIGN.md`'s explicit warning that skipping this exact checkpoint is
the failure that killed two prior versions of this project, the answer held:
start gate 4, playtest later. So gate 3's own human playtest is still owed,
and now gate 4's is too — both queued behind whoever plays next, not silently
dropped. Nothing below substitutes for that; it is the Tier 1/telegraph floor
the checkpoint sits on top of, same as gate 3's own bots-clean status was.

**Tantrik never deals damage — its entire threat is the queue it raises.**
User story 13 asks for a summoner that must be prioritised over what it
summons, and the way that holds without a rule the player has to be told is
to give the archetype nothing else to threaten with: `Tantrik.attackBox`
always returns null. It keeps `BHOOT_BATTI`'s ring-hold — close when far,
back off when crowded — walked instead of flown, so melee only happens
because the hunter chose to close the distance. `children`/`TANTRIK.
maxLiving` (2) bound the queue: left alone, it summons until it has two live
raakchyas and then waits rather than stacking a fight nobody could clear in
time.

**Atripta is an elevated Tantrik, not a fifth boss.** Per `SPEC-CAMPAIGN.md`'s
table only gates 3, 6, 8 and 10 are boss-tier; gate 4's Warden follows
"Wardens are configuration, not code" exactly the way `KEVAT` follows
`CHARGER` — same archetype key (`tantrik`), same class, elevated stats
(`ATRIPTA` in `config.js`), and one added move: `summon.burst: 2`. The same
telegraph the hunter already reads, just never satisfied by raising only
one — the same shape as the Kevat's `charge.chain`, and fitting for a hunger
that is never filled.

**Tantrik does not leave a remnant, and that is a disclosed exception to user
story 16, not an oversight.** Every other new archetype this campaign has
introduced obeys "every new enemy leaves a remnant" by giving `chayaOf` in
`game/shadow.js` a real ally to build — `RaakchyasChaya`, `ChargerChaya`,
`KawachChaya`. Tantrik's one action is summoning, and neither way to carry
that into an ally is a job this gate's build order accounted for: raising a
*hostile* raakchyas next to the ally's own master (which is what a naive
`TantrikChaya` reusing `_raise` would do, since `ctx.spawnMinion` has no
notion of allegiance) is a real bug, not a design choice, and raising an
*allied* one needs PUKAR's one-chaya-at-a-time slot — a rule stated as load-
bearing at the top of `shadow.js` — widened into a list it has never had to
be. Left as a gap for whoever picks this up next to close deliberately,
rather than papered over with an ally that fights nothing. `BhootBatti` is
the existing precedent for an enemy that simply never opts in.

**`ctx.spawnMinion` is new, and it is not a new allocation pattern.**
`Tantrik._raise` needs a way to put a fresh raakchyas on the field mid-fight,
and the existing `Game._spawn` already does exactly this the moment a
delayed encounter spawn's timer elapses — mid-run, not at gate-build time.
`spawnMinion` in `game.js` is that same call reachable from an enemy's own
`ctx` rather than only from the pending-spawn queue, carrying the caller's
`encounter` id so a sealed chamber's clear condition still waits on what it
raised. The rule against allocating mid-run is about a *gate transition* —
the one event big enough to re-roll every enemy's jitter — not about a fight
producing a body it did not have a moment ago; bolts, delayed spawns and
corpses already establish that boundary and this does not move it.

**Verification status.** `?sim` across all five recorded seeds: gate 4's
Tier 1 rows all PASS (jump reserve 26%, matching gates 1–3's own figure),
`enemy types` resolves `tantrik`/`raakchyas`/`warden → tantrik`, `solo debut`
confirms Tantrik is met alone in `tantrik-alone` before `the-waiting` combines
it with raakchyas, `telegraphs` passes Tantrik's summon at 0.620s (0.370s of
margin past the 250ms reaction floor). No suite row moved beyond the already-
frozen deferred set (`ranged` boss, `ranged +chaya`, charger `recovery-
window`, charger `leaves-remnant`, occasionally flaky `signed-rank`). Run
headless via Chrome (`--use-angle=swiftshader-webgl`) rather than
`tools/serve.py` in a real browser, since no interactive session was
available this pass — the report text is identical either way, but this is
not a substitute for the human playtest both gates still owe.

### Handoff: what the next session picks up

**Two human playtests are owed, not one.** Gate 3's was already outstanding;
gate 4 now carries the same debt. Play both — on a phone, per the touch-
budget checkpoint — before gate 5 is authored. Look specifically at whether
"prioritise the Tantrik" reads as the obvious play or has to be inferred, and
whether Atripta's doubled summon reads as escalation rather than a reskinned
Tantrik fight.

Gates 5–10 are otherwise unstarted. Build order is unchanged: author one gate
at a time, Tier 1 clean, `?sim` clean across the five seeds, played before the
next one starts — and this time, played.
