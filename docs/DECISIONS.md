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

## Gate 5 (Tiryak-lok): both owed playtests cleared, Vyaghri authored

The session that opened this work reported both debts from gate 4's handoff
paid: gate 3 and gate 4 played on a phone, on the touch controls that were
built alongside them, and both ran well. That closes the checkpoint
`SPEC-CAMPAIGN.md` names before the next gate is authored, for the first time
since gate 2 — gates 3 and 4 were both authored back to back against a
knowingly deferred playtest, recorded as such in this file's own prior
entries. Gate 5 is the first gate since 2 to start clean.

**No new archetype, so the Warden is a second elevation of an existing one,
not a fifth.** `docs/SPEC-CAMPAIGN.md`'s table is explicit that gate 5
introduces nothing new — "No judgment, no speech, no negotiation. The densest
beast encounters in the game" — so the gate's whole job is making raakchyas
and charger, both already taught, read as a pack rather than a queue of solo
fights. Its Warden, the Pack-Mother, follows from that directly: `VYAGHRI` in
`src/game/config.js` extends `CHARGER` exactly the way `KEVAT` already does,
one gate earlier. Two Wardens sharing an archetype key is not a shortcut
around authoring a new one — `docs/SPEC-CAMPAIGN.md`'s "Wardens are
configuration, not code" and `CONTEXT.md`'s own definition of Warden ("built
by parameterising a common archetype... one signature addition") name no rule
against reusing the same archetype twice, and a beast realm reaching for the
one archetype that already reads as an animal charging a lane is the fit,
not a compromise. Its signature addition is one further than the Kevat's own:
`charge.chain: 3` against `KEVAT`'s 2 — the Pack-Mother does not stop at two.

**Density is authored as three grunt encounters that thicken in sequence, not
as one large one.** The Den (Raakchyas ×3) → the Herd (Raakchyas ×2, Charger
×1) → the Stampede (Raakchyas ×3, Charger ×2) — the densest pre-Warden
encounter the campaign has built — each sealed by `gatecheck.js`'s encounter-
lock check the same as every prior gate's. Five chambers rather than four,
the first gate longer than its predecessor since gate 1, because a build-up
across three fights needed room the flatter four-chamber gates didn't ask
for.

**`solo debut` reads `nothing new here`, correctly, rather than failing
open.** The check exists to catch a new archetype met in a crowd; gate 5
introduces none, so it has nothing to assert and says so rather than passing
silently on an empty set — worth naming because a check that goes quiet when
it has nothing to check is indistinguishable from a check nobody wired up
until someone reads what it printed.

**Verification status.** `?sim` across all five recorded seeds: gate 5's
Tier 1 rows all PASS (jump reserve 26%, matching every prior gate's own
figure; 12 spawns clear; 5/5 platforms reachable; 4 encounter locks sealed;
`enemy types` resolves raakchyas/charger/warden → charger). No suite row
moved beyond the already-frozen deferred set (`ranged` boss, `ranged
+chaya`, charger `recovery-window`, charger `leaves-remnant`, occasionally
flaky `signed-rank`). Run headless via Chrome
(`--use-angle=swiftshader-webgl`) rather than `tools/serve.py` in a real
browser, since no interactive session was available this pass.

### Handoff: what the next session picks up

**Gate 5 has not been played by a human.** Same checkpoint as every gate
before it: play it, on a phone, before gate 6 is authored. Look specifically
at whether the three grunt encounters actually read as escalating density
rather than as three copies of the same fight, and whether the Pack-Mother's
triple chain reads as "the pack doesn't stop at two" or as an unfair third
hit nobody was taught to expect out of the Kevat's own two.

Gates 6–10 are otherwise unstarted. Gate 6 (the human realm, no new
archetype per the table, boss-tier — **The Magistrate**, the hinge of the
campaign and "the first real conversation in the game") is next once gate
5's playtest is done. Build order is unchanged: author one gate at a time,
Tier 1 clean, `?sim` clean across the five seeds, played before the next one
starts.

## Amended 2026-08-08: the per-gate playtest checkpoint is dropped

`SPEC-CAMPAIGN.md` § Further Notes and every handoff since gate 2 have named
a human playtest, on a phone, as the checkpoint before the next gate is
authored. That checkpoint is retired for gates 6–10.

**Why.** Each gate session up to now has spent part of its budget re-deriving
whether the last gate's playtest debt was paid before it could start the
next one, and gates 3 and 4 were authored back to back with that debt
knowingly deferred anyway — recorded as a decision each time rather than a
lapse, which is itself a sign the checkpoint was being paid around rather
than paid. The thing the checkpoint protects — a phone can actually clear
what `gatecheck.js` only proves arithmetically — was answered directly this
session: gates 3 and 4 were both played on a phone, on the built touch
controls, and both ran well. That is the proof the checkpoint existed to
get, and getting it once establishes that the touch scheme itself holds,
not only that one gate's geometry does.

**What replaces it.** Every other gate of Tier 1 and `?sim` still applies,
unchanged, to every gate: jump reserve, spawn points, reachability,
encounter locks, enemy types, solo debut, telegraphs, all clean across the
five recorded seeds before a gate is considered built. What changes is only
*when* a human plays: gates 6–10 are authored back to back, session by
session, and the campaign is played end to end — on a phone — only once all
ten gates exist. One full-campaign playtest, not nine per-gate ones.

**The honest risk, named rather than hidden.** This is the same shape of
amendment the project has made once before — see § The next milestone is
depth, not breadth, amended 2026-08-03 — and that entry's own warning
applies here too: a rule overturned by the person it constrains, on the
grounds that its conditions were met, is exactly how a load-bearing rule
dies quietly. The check is the same one that entry proposed: if all ten
gates are authored and the campaign is unplayed at the end of it, this
amendment was a rationalisation. Tier 1 and `?sim` catch authoring and
mechanic bugs; neither one can say whether ten gates in a row plays well,
and nothing stands in for that until gate 10 is built.

### Handoff: what the next session picks up

No playtest gate blocks gate 6. Build it now: the human realm, no new
archetype per `SPEC-CAMPAIGN.md`'s table, boss-tier — **The Magistrate**,
the campaign's hinge, "the first real conversation in the game," where the
hunter learns Yama stopped. Tier 1 clean, `?sim` clean across the five
recorded seeds, same as every gate before it. Then hand off to gate 7,
same shape, no playtest between.

## Gate 6 (Manav-lok): Hakim built, the campaign's third boss

Authored 2026-08-08, continuing straight from the amendment above — no
playtest checkpoint owed before this one, per that amendment.

**Hakim is bespoke, not an elevated grunt.** Vyaghri, gate 5's own
no-new-archetype Warden, reused `Charger`'s class with elevated numbers —
the pattern `SPEC-CAMPAIGN.md` calls "Wardens are configuration, not code."
Gate 6 also introduces no new grunt, but the same spec's table marks it
boss-tier — one of the four Guardian-class fights, at gates 3, 6, 8 and 10 —
so its Warden follows the Goru-Mukh's precedent instead of Vyaghri's:
`Hakim extends Boss` in `src/game/boss.js`,
its own rig (`buildHakim` in `models.js`), its own config block (`HAKIM`),
same three-part kit as the Goru-Mukh (charge, slam, sweep — a court's
verdict is delivered close, and the campaign's one ranged boss attack stays
the Guardian's alone). What makes it read as its own fight rather than the
Goru-Mukh recoloured: Manav-lok's brass-and-bone palette
(`manavPlate`/`manavCore`/`hakimSick` in `palette.js`), a judge's headdress
and floating seal-tablets in place of horns and pauldrons, and the seal of
judgment (`sealL`/`sealR`) flaring in place of the Goru-Mukh's eyes. Its
sweep enraged clears the 0.42s reaction floor by 60ms (0.60 × 0.80 =
0.480s), the same margin order as the campaign's other two melee bosses.

**The gate combines what earlier gates taught separately, rather than
teaching anything new.** The market (raakchyas + bhoot-batti, both from
gate 1, met together for the first time) and the antechamber (kawach and
tantrik, each taught alone in gates 3 and 4, sharing a fight for the first
time, plus a raakchyas) are both `soloDebut`-clean by construction: Hakim's
own archetype is the only fresh one, and it is met alone in its own
encounter, same shape as every prior Warden fight.

**The hinge's reveal breaks the "THE SYSTEM" framing on purpose.** Every
prior gate's boundary beats are voiced by the System; gate 6's `cleared`
beat is titled `HAKIM` instead — `docs/SPEC-CAMPAIGN.md` names this as "the
first real conversation in the game," and the System has had no voice for
that yet. Mechanically it is still an ordinary `_fireBeats('cleared')` call
through the same descriptor shape every other gate uses; only the string
carries the difference.

**Verification status.** `?sim` across all five recorded seeds (headless
Chrome, `--use-angle=swiftshader-webgl`, no interactive session available
this pass — not a substitute for the still-owed full-campaign human
playtest `docs/SPEC-CAMPAIGN.md` names once all ten gates exist): gate 6's
Tier 1 rows all PASS (jump reserve 26%, matching every prior gate's own
figure; 7 spawns clear; 4/4 platforms reachable; 3 encounter locks sealed;
`enemy types` resolves raakchyas/bhootBatti/kawach/tantrik/warden → hakim;
`solo debut` reports `hakim in hakim`), and all three Hakim telegraph rows
clear the reaction floor with 0.230–0.358s to spare. No suite row moved
beyond the already-frozen deferred set (`ranged` boss, `ranged +chaya`,
charger `recovery-window`, charger `leaves-remnant`, occasionally flaky
`signed-rank` — all the documented HP-hack regressions, untouched by this
gate).

### Handoff: what the next session picks up

Gates 7–10 are otherwise unstarted. Gate 7 (the asuras — Asura-lok, no new
archetype per the table, "the most fight-dense gate," Warden **The
Ever-Warring**) is next. Build order per the dropped-checkpoint amendment:
author one gate at a time, Tier 1 clean, `?sim` clean across the five
recorded seeds, no playtest between — the campaign is played end to end,
on a phone, only once all ten gates exist.

## Gate 7 (Asura-lok): Amar-Yoddha authored, a third elevation of Charger

Authored 2026-08-08, continuing straight from the handoff above — no
playtest checkpoint owed before this one, same standing amendment.

**No new archetype, so the Warden is a third elevation of the same one, not
a fourth.** `docs/SPEC-CAMPAIGN.md`'s table names nothing new for gate 7 and
calls it "the most fight-dense gate" — war without end, and the asuras "do
not know the Wheel stopped and would not care." `AMAR_YODDHA` in
`src/game/config.js` extends `CHARGER` exactly as `KEVAT` and `VYAGHRI`
already do; a third reuse follows directly from `VYAGHRI`'s own entry in
this file, which already argued the point against a second. The signature
addition continues the escalation those two started: `charge.chain: 4`
against the Pack-Mother's 3 — an asura does not stop charging because it has
already charged three times. `charge.windup` is untouched, same as every
prior elevation: no new telegraph, because there is nothing left to teach.
`cooldown` is the tightest of the three, for the same reason `VYAGHRI`'s is
tighter than `KEVAT`'s — the density the gate spends three encounters
building is the setup the Warden is meant to read as the culmination of.

**Density is authored as three grunt encounters that each combine more
archetypes than the last, ending in the campaign's densest pre-Warden
fight.** The Vanguard (raakchyas ×2, charger ×1 — the pairing gate 5 already
taught, met on this gate's own ground) → the Line (kawach ×2, raakchyas ×1 —
an armoured front rather than a lone shield) → the Melee (raakchyas ×2,
charger ×1, kawach ×1, tantrik ×1, bhoot-batti ×1 — every archetype the
campaign has taught, together, six bodies against the five of gate 5's own
Stampede), each sealed by `gatecheck.js`'s encounter-lock check the same as
every prior gate's.

**The word-budget check caught a real miss on the first pass.** The `enter`
beat's body was authored at 15 words on its own, but `storyBeats()` in
`tools/gatecheck.js` counts `big` and `body` together against the 16-word
glance ceiling — `NO CEASEFIRE ON RECORD` (4 words) plus the original body
put the beat at 19, over budget. Trimmed to `They fought this long before
the Wheel stopped, and never noticed.`, which reads the same idea shorter
rather than dropping it. Worth naming because gates 2–6 never exercised this
edge — their `big` strings are short enough that authoring the body alone
against the 16-word figure happened to be safe, and gate 7 is the first
descriptor where that coincidence ran out.

**Verification status.** `?sim` across all five recorded seeds (headless
Chrome, `--use-angle=swiftshader-webgl`): gate 7's Tier 1 rows all PASS
(jump reserve 26%, matching every prior gate's own figure; 13 spawns clear;
5/5 platforms reachable; 4 encounter locks sealed; `enemy types` resolves
raakchyas/charger/kawach/tantrik/bhootBatti/warden → charger; `solo debut`
correctly reports `nothing new here`; `story beats` clean on all five seeds
after the trim above). No suite row moved beyond the already-frozen deferred
set (`ranged` boss, `ranged +chaya`, charger `recovery-window`, charger
`leaves-remnant`, occasionally flaky `signed-rank` — all the documented
HP-hack regressions, untouched by this gate). No `boss.js`, `models.js` or
`palette.js` change was needed: the Warden reuses the Charger's existing
class and rig, exactly as `KEVAT` and `VYAGHRI` did.

### Handoff: what the next session picks up

Gates 8–10 are otherwise unstarted. Gate 8 (the devas — Deva-lok, palette
returning to gate 1's pastel per the spec's own "art direction's payoff,"
Warden **The Long-Lived** — boss-tier, one of the four Guardian-class
fights) is next, and per `docs/SPEC-CAMPAIGN.md`'s locked table it needs a
bespoke `Boss` subclass and rig, the same relationship `Hakim` has to
`Goru-Mukh`, not a fourth elevation of an existing grunt. Build order per
the dropped-checkpoint amendment: author one gate at a time, Tier 1 clean,
`?sim` clean across the five recorded seeds, no playtest between — the
campaign is played end to end, on a phone, only once all ten gates exist.

## Gate 8 (Deva-lok): Chiranjivi authored, a bespoke fourth boss

Authored 2026-08-08, continuing straight from the handoff above — no
playtest checkpoint owed before this one, same standing amendment.

**A bespoke `Boss` subclass and rig, the same relationship `Hakim` has to the
`Goru-Mukh`, not a grunt elevation.** Gate 8 introduces no new archetype per
`docs/SPEC-CAMPAIGN.md`'s table and its Warden is boss-tier — the fourth of
the four Guardian-class fights the table names at gates 3, 6, 8 and 10.
`Chiranjivi extends Boss` in `src/game/boss.js`, reusing the Hakim's proven
plant/flare/`charge`-`slam`-`sweep` shape (a deva does not need to keep its
distance any more than a judge did, and the campaign's one ranged boss
attack stays the Guardian's alone) with its own numbers, its own rig
(`buildChiranjivi` in `models.js`, `auraL`/`auraR` in place of the Hakim's
`sealL`/`sealR`) and its own palette (`devaPlate`/`devaCore`/`devaGold`/
`devaWing` in `render/palette.js`) — light, cloud and pastel, per the spec's
own "art direction's payoff," echoing gate 1's violet register rather than
the iron, pale or brass ones between them. Its sweep enraged clears the
0.42 s reaction floor by the same 60 ms margin the Hakim's does
(0.60 × 0.80 = 0.480 s).

**No new archetype, so density is authored the same way gates 6 and 7's
was: recombining what earlier gates already taught.** The Terrace
(raakchyas × 2, bhoot-batti × 1 — gate 1's own pair, met on new ground) →
the Garden (kawach × 1, tantrik × 1, raakchyas × 1 — gates 3 and 4's tells
sharing a fight for the first time) → Chiranjivi's chamber, the same three-
encounter shape gate 6 used and the same segment geometry, on the grounds
that it was already proven correct by five seeds of gate 6's own Tier 1
rows and there is no reason to re-risk authoring error on numbers that do
no new work here.

**Verification status.** `?sim` across all five recorded seeds (headless
Chrome, `--use-angle=swiftshader-webgl`): gate 8's Tier 1 rows all PASS
(jump reserve 26%, matching every prior gate's own figure; 7 spawns clear;
4/4 platforms reachable; 3 encounter locks sealed; `enemy types` resolves
raakchyas/bhootBatti/kawach/tantrik/warden → chiranjivi; `solo debut`
correctly reports the one new archetype, met alone, in its own encounter;
`story beats` clean on all five seeds). Chiranjivi's three telegraphs
(charge 0.592s, slam 0.560s, sweep 0.480s enraged) all clear the 250 ms
reaction floor with 0.230–0.342s to spare. No suite row moved beyond the
already-frozen deferred set (`ranged` boss, `ranged +chaya`, charger
`recovery-window`, charger `leaves-remnant`, occasionally flaky
`signed-rank` — all the documented HP-hack regressions, untouched by this
gate).

### Handoff: what the next session picks up

Gates 9–10 are otherwise unstarted. Gate 9 (Yama's court — Yama-sabha,
monochrome + violet, no new archetype, Warden **The Backlog** — Bakaya,
fought as "what his absence made rather than against him," per
`docs/SPEC-CAMPAIGN.md`) is next. Build order per the dropped-checkpoint
amendment: author one gate at a time, Tier 1 clean, `?sim` clean across the
five recorded seeds, no playtest between — the campaign is played end to
end, on a phone, only once all ten gates exist.

## Gate 9 (Yama-sabha): Bakaya authored, a second elevation of the summoner line

Authored 2026-08-08, continuing straight from the handoff above — no
playtest checkpoint owed before this one, same standing amendment.

**An existing archetype, elevated a second time, exactly as `VYAGHRI` is to
`KEVAT`.** Gate 9 introduces no new archetype per
`docs/SPEC-CAMPAIGN.md`'s table, and its Warden is not boss-tier — gates 3,
6, 8 and 10 hold the four Guardian-class fights, and 9 is not one of them.
`ATRIPTA` began the summoner-elevation line at gate 4; `BAKAYA` in
`src/game/config.js` is its second entry, not a new line, the same relation
`VYAGHRI` has to `KEVAT` on the charger line. The fit is the spec's own
language for this Warden: "The Backlog — the accumulated unjudged given
shape — so the fight is against what his absence made rather than against
him." A summoner that raises more than it did last time *is* a backlog,
mechanically as well as narratively, so the signature addition lands on
`summon.burst` rather than `charge.chain`: `ATRIPTA`'s 2 becomes 3, one more
unjudged soul raised per cast than the hunter has answered before.
`summon.windup` moves by two hundredths of a second, the same shape
`ATRIPTA`'s own move off `TANTRIK` used — no new telegraph, because there is
nothing left to teach, only more of what gate 4 already did. `archetype:
'tantrik'` in the gate 9 descriptor names the same class Atripta's does;
`Tantrik`'s constructor already takes `cfg` as a parameter, so no code
changed in `enemies.js` or `game.js` to seat a second elevation, the same
"configuration, not code" point `KEVAT`'s and `VYAGHRI`'s own entries in
this file already made.

**Density is authored as two grunt encounters, not three — gate 7 already
holds the claim to the campaign's densest pre-Warden fight, and gate 9 does
not contest it.** The Antechamber (raakchyas ×2, bhoot-batti ×1 — gate 1's
own pair, met on new ground, the same opener gates 6 and 8 used) → the Nine
Thrones (charger ×1, kawach ×1, tantrik ×1, raakchyas ×1 — every remaining
archetype the campaign has taught, one per throne, four bodies rather than
the Melee's six) → Bakaya's chamber, sealed the same way every prior
encounter lock has been.

**Palette is monochrome and violet, per the table, and the violet is a
deliberate callback rather than a boss-core doubling.** Gates 3, 6 and 8 tie
`crystal` to their bespoke boss's own core color; Bakaya is a grunt
elevation with no core to match, so gate 9 spends the accent differently —
`crystal: 0x9d5cff` is gate 1's own violet, unchanged, tying Yama-sabha back
to the one dead violet eye the Kneeling Stone has carried since gate 1. Yama
himself is not an entity in the level — nothing in the hunter's moveset can
target him — so his presence is carried entirely by `GATE9_BEAT_ENTER_BODY`,
the same "a line, not a system" approach gate 6's wrongness and gate 4's
sympathy already used.

**The word-budget check caught a real miss on the first pass, the same class
of miss gate 7's entry in this file already recorded.** The `enter` beat's
body was authored as two clauses — "He watches the hunter cross the hall and
does not rise. He does not stop them either." — which read fine alone but
put the beat at 20 words against `storyBeats()`'s 16-word glance ceiling
once `big` (`NINE THRONES EMPTY`, 3 words) was added in. Trimmed to "He
watches the hunter cross the hall. He does not rise.", which keeps the one
idea the beat needs — present, not fighting — and drops the second clause
rather than shortening both.

**Verification status.** `?sim` across all five recorded seeds (headless
Chrome, `--use-angle=swiftshader-webgl`): gate 9's Tier 1 rows all PASS
(jump reserve 26%, matching every prior gate's own figure; 8 spawns clear;
4/4 platforms reachable; 3 encounter locks sealed; `enemy types` resolves
raakchyas/bhootBatti/charger/kawach/tantrik/warden → tantrik; `solo debut`
correctly reports `nothing new here`; `story beats` clean on all five seeds
after the trim above). No suite row moved beyond the already-frozen
deferred set (`ranged` boss, `ranged +chaya`, charger `recovery-window`,
charger `leaves-remnant`, occasionally flaky `signed-rank` — all the
documented HP-hack regressions, untouched by this gate). No `enemies.js`,
`boss.js`, `models.js` or `palette.js` change was needed: the Warden reuses
the Tantrik's existing class and rig, exactly as `KEVAT`, `VYAGHRI` and
`AMAR_YODDHA` reused the Charger's.

### Handoff: what the next session picks up

Gate 10 is the only unstarted gate left. Gate 10 (the Wheel — Bhavachakra,
every palette bleeding, Warden **What Grew In The Stillness** — Maun-Ankur,
boss-tier, the fourth and last of the Guardian-class fights) closes the
campaign: releasing the chaya per user story 6, Yama taking the office back
up, the gates closing. Build order per the dropped-checkpoint amendment:
author it, Tier 1 clean, `?sim` clean across the five recorded seeds — and
this is the gate the owed end-to-end playtest, on a phone, finally becomes
possible after, since all ten will exist.

## Gate 10 (The Wheel — Bhavachakra): Maun-Ankur authored, the campaign's fourth and final boss

Authored 2026-08-08, continuing straight from the handoff above — no
playtest checkpoint owed before this one, same standing amendment.

**A bespoke `Boss` subclass and rig, the same relationship `Chiranjivi` has
to the `Hakim`, not a grunt elevation.** Gate 10 introduces no new
archetype per `docs/SPEC-CAMPAIGN.md`'s table and its Warden is boss-tier —
the fourth and last of the four Guardian-class fights the table names at
gates 3, 6, 8 and 10. `MaunAnkur extends Boss` in `src/game/boss.js`,
reusing the proven plant/flare/`charge`-`slam`-`sweep` shape every prior
bespoke boss has used (the campaign's one ranged boss attack stays the
Guardian's alone) with its own numbers — stepped up from `CHIRANJIVI`'s the
same way those stepped up from `HAKIM`'s — its own rig (`buildMaunAnkur` in
`models.js`, a broken ring at the shoulders in place of the Chiranjivi's
wings, a crown of tangled growth in place of its crown of light) and its
own palette (`wheelPlate`/`wheelCore`/`wheelBloom` in `render/palette.js`).
Its sweep enraged clears the 0.42 s reaction floor by the same 60 ms margin
every other melee boss's does (0.60 × 0.80 = 0.480 s).

**The realm's palette is "every palette bleeding," read literally: the nine
registers before it un-sorted into one sky, not a tenth chosen to stand
apart from them.** `REALM.sky` mixes a violet zenith against an ember
horizon, `ridges` and `stone` sit between Naraka's iron and Yama-sabha's
near-black rather than owning either — the Wheel is where the other nine
realms lead, not one more place among them, and the palette is the first
thing that says so, the same way gate 8's echo of gate 1's violet was.

**No new archetype, so density is authored the same way gates 6, 7, 8 and
9's was: recombining what earlier gates already taught, in two grunt
encounters, not three — gate 7 still holds the claim to the campaign's
densest pre-Warden fight and gate 10 does not contest it.** The Rim
(raakchyas × 2, bhoot-batti × 1 — gate 1's own pair) → the Spokes (charger
× 1, kawach × 1, tantrik × 1, raakchyas × 1 — every remaining archetype the
campaign has taught, the same four-body shape gate 9's Nine Thrones used) →
Maun-Ankur's chamber, the same three-encounter shape and segment geometry
gates 6, 8 and 9 all reused rather than re-risking authoring error on
numbers already proven correct by five seeds of Tier 1 rows apiece.

**`tools/gatecheck.js`'s telegraph table did not know about the new
archetype, and the suite caught it immediately.** `every archetype has a
tell` failed on the first run — `nothing listed for maunAnkur` — because
`TELLS` in `gatecheck.js` is a hand-maintained list of every boss and grunt
kit, and adding a fourth bespoke boss to `boss.js`/`config.js`/`game.js`
does not update it by itself; the check exists precisely so a boss authored
without a corresponding tell entry cannot pass silently. Fixed by importing
`MAUN_ANKUR` into `gatecheck.js` and mapping its `attacks` the same way
`CHIRANJIVI`'s already are — one four-line addition, and the row went green
on every seed after.

**What this deliberately leaves open: the release-the-chaya ending is
carried by `GATE10_BEAT_CLEARED_BODY` alone, not by a new input.** User
story 6 in `docs/SPEC-CAMPAIGN.md` asks for "one deliberate input —
releasing the shadow — so that the campaign closes on an action rather than
a cutscene." This session did not build that input. Every prior gate's
narrative hinge — gate 4's sympathy, gate 6's wrongness, gate 9's Yama —
shipped as text against an unchanged system, and the handoff above scoped
this session to "author it, Tier 1 clean, `?sim` clean," not to a new
mechanic; inventing one now, un-reviewed, on the campaign's last gate risked
exactly the kind of authoring error this file's whole "measure, don't
theorise" habit exists to catch. The cleared beat narrates the release in
one line instead. Whether the ending gets an actual bound input — and what
it would be, given the moveset is frozen at seven per `docs/SPEC-CAMPAIGN.md`'s
own refusal list — is a decision for a session that can sit with it, not a
byproduct of authoring the gate around it.

**Verification status.** `?sim` across all five recorded seeds (headless
Chrome, `--use-angle=swiftshader-webgl`): gate 10's Tier 1 rows all PASS
(jump reserve 26%, matching every prior gate's own figure; 8 spawns clear;
4/4 platforms reachable; 3 encounter locks sealed; `enemy types` resolves
raakchyas/bhootBatti/charger/kawach/tantrik/warden → maunAnkur; `solo debut`
reports `maunAnkur in maun-ankur`; `story beats` clean on all five seeds).
Maun-Ankur's three telegraphs (charge 0.576s, slam 0.544s, sweep 0.480s
enraged) all clear the 250 ms reaction floor with 0.230–0.326s to spare,
the same margins `CHIRANJIVI`'s own carry. No suite row moved beyond the
already-frozen deferred set (`ranged` boss, `ranged +chaya`, charger
`recovery-window`, charger `leaves-remnant`, occasionally flaky
`signed-rank` — all the documented HP-hack regressions, untouched by this
gate).

### Handoff: what the next session picks up

All ten gates now exist. The owed end-to-end playtest — on a phone, per the
dropped-checkpoint amendment's own condition for finally doing it — is next,
and the release-the-chaya ending input scoped out above is the other open
item the playtest is likely to make concrete. Until then `?sim` is the only
verification the campaign has had, and it does not stand in for a human
finishing all ten gates in one sitting on the device the game ships to.

## Backlog: playtest round 2 (2026-08-09), seven tickets for seven fresh sessions

The end-to-end phone playtest the gate-10 handoff named as next has now
happened — all ten gates played through, on a phone, in one sitting, and the
verdict is that the campaign holds together end to end. `?sim` is no longer
the only verification the campaign has had.

The playtest raised seven distinct complaints, recorded below as seven
separate tickets rather than one entry, on request — each is scoped to be
picked up and finished by a fresh session on its own, without needing the
others done first, and without needing this preamble repeated. None of the
seven is implemented yet; every one below is a plan, not a diff.

### Ticket: touch steer becomes a four-way arrow pad, not a knob

**Implemented 2026-08-09.** `TOUCH_LAYOUT.steer` is gone; `TOUCH_LAYOUT.pad`
carries four discrete targets (`left`/`right`/`down`/`up`), each a plain
`.touch-btn` built the same way SLASH or JUMP is. `down` still fires PUKAR's
route exactly as before. The four targets read as a cross — LEFT and RIGHT
side by side, DOWN below and UP above centred in the gap between them —
rather than the more literal three-wide inverted-T a keyboard's cluster
draws: at the narrowest tested viewport (360×800 portrait) a three-wide row
does not leave 44px targets room to clear the action-button cluster on the
other side of the screen (worked out to a negative clearance), and the
two-column cross does, with 22px to spare. `tools/touchcheck.js`'s coverage,
chord and fit checks now read `pad.targets` instead of one circular box; the
`steer is round` check and its issue-#23 justification are gone with the
circle. UP fires the `up` action `engine/input.js` has bound since it
existed but nothing has ever consumed — it does nothing yet, on purpose, for
the next ticket to wire. Verified with `?sim` across all five recorded
seeds: the TOUCH LAYOUT block is 0 FAIL on each, including the narrowest
viewport's cluster-clearance row.

Settled 2026-08-09. Nothing failed constraint 2 (jump reserve) or came back
unreachable in the playtest — this complaint is about feel, not reachability.
The steer knob doesn't serve the game well.

**The fix: drop the knob for a four-way arrow pad**, read the way a
keyboard's arrow cluster is. `DECISIONS.md` § The steer control becomes a
stick chose a circular knob because an earlier phone playtest (issue #23)
asked for it to *read* as a joystick; this round is the correction — the
game's movement is digital left/right (see § Deferred, deliberately,
"Gamepad": "movement is digital left/right, so a stick offers no fidelity a
key doesn't"), and a continuous-read knob was never buying anything a
four-way pad doesn't also give a thumb, more legibly. `down` stays wired to
PUKAR exactly as it is now — see that entry — the pad just changes what a
thumb touches to send `left`/`right`/`down`, not what any of the three do.

**What this leaves for the implementing session.** `TOUCH_LAYOUT.steer` in
`touch.js` is currently one circular axis-pair target (`_buildSteer`,
`_placeKnob`); `tools/touchcheck.js` reads that shape directly, so its checks
need to move to a four-target read before "no two targets overlap" and "all
seven verbs reachable" mean anything against the new pad.

### Ticket: UP enters a cleared gate's arch

**Implemented 2026-08-09.** Resolved the open question below by reusing
`up`, not adding an eighth control: `Game.update`'s arch check
(`game.js`, near the end of `update`) now reads `inside &&
this.input.pressed('up')` instead of arming on exit and firing on
re-entry — `pressed()` last, per the input-condition rule, so a buffered UP
that also does something else on the same frame is never silently eaten.
`up` was already bound on the keyboard (`engine/input.js`) and already
fires from the arrow pad's `up` target since the previous ticket; nothing
in `input.js` or `touch.js` changed. `exitArmed` — the field and comment
explaining why a Warden dying in the doorway needed an "outside since it
lit" latch — is gone entirely: a press-gated crossing can't fire on the
frame the arch lights, so the latch had nothing left to guard against.
`tools/sim.js`'s `transition` probe now presses `up` (via `Bot.press`,
which lands in the input buffer the same way a tap or keypress does)
whenever the hunter is in `GATE_ARCH.reach` of the exit, on both the
walk-up and cost-measurement rows, and the `exitArmed` half of the
"every arch in the campaign is dark" replay check is gone with the
field. Verified with `?sim` across all five recorded seeds: GATE
TRANSITION is 0 FAIL on each; the only red rows are the pre-existing,
already-frozen ones (signed-rank on some seeds, `ranged` boss, charger
`recovery-window`/`remnant`), unchanged by this ticket.

Settled 2026-08-09, from the same playtest as the ticket above. Today the
arch is a location trigger — walked into, not pressed — with no bound action
of its own.

**The fix: UP takes on entering the arch once its gate is cleared.** Whether
routing that through UP counts as reusing `move` (a direction, same as
`left`/`right`/`down` already are) or is a new verb the frozen-at-seven
moveset (`docs/SPEC-CAMPAIGN.md` § Refused, `touch.js`'s own "no new verb and
no eighth control") would have to answer for, is exactly the kind of question
this file exists to settle *before* the implementing session reaches for the
keyboard side of the change. Flagged here rather than resolved — resolving it
is that session's first job, not this entry's. Depends on the arrow-pad
ticket above existing first, since UP is one of that pad's four targets.

### Ticket: SLASH and JUMP trade positions in the touch action cluster

**Implemented 2026-08-09.** The `light` and `jump` entries in
`TOUCH_LAYOUT.buttons` (`touch.js`) traded their `x`/`y`/`w`/`h` wholesale —
JUMP now sits in the corner SLASH used to hold (nearest the resting thumb,
biggest footprint) and SLASH sits where JUMP was, one slot nearer AAGO on
the sweep. Nothing else about either entry — `verb`, `action`, `label`,
`tone`, JUMP's `sustain` — changed, and neither did `tools/touchcheck.js`:
its overlap and reachability checks read positions generically, exactly as
this ticket predicted. Verified with `?sim` across all five recorded seeds:
TOUCH LAYOUT is 0 FAIL on each, and the only red rows anywhere are the
pre-existing, already-frozen ones (signed-rank on some seeds, `ranged`
boss, charger `recovery-window`/`remnant`), unchanged by this ticket.

Settled 2026-08-09, from the same playtest. SLASH is the more frequently
reached-for of the two — light attacks carry every combo, a jump does not —
so it should move to the slot nearer AAGO on the sweep `Where each control
sits` describes, and JUMP should take SLASH's old corner. The sweep's
ordering principle (nearest-to-furthest is most-to-least reached for) does
not change; only which verb sits where on it does.

**What this leaves for the implementing session.** Swap the `x`/`y` (and, if
the footprint differs, `w`/`h`) of the `light` and `jump` entries in
`TOUCH_LAYOUT.buttons` in `touch.js`. `tools/touchcheck.js`'s overlap and
reachability checks read positions generically and should not need to change
for this one alone — only for the pad and DASH-relocation tickets, which
touch the descriptor's shape rather than just two entries' coordinates.

### Ticket: STEP is renamed DASH and moves to its own control above the cluster

Settled 2026-08-09, from the same playtest. The rename is overdue rather than
new: the verb has been `dash` throughout the engine (`MOVESET`, `player.js`,
`engine/audio.js`'s `'dash'` case) since the control existed — only
`STRINGS.TOUCH_STEP`'s label ever said otherwise, a naming drift this closes
rather than a mechanic renamed.

**The fix: rename the label, and move the button off the four-button sweep
into its own horizontal control above it.** The reposition follows a
convention players bring in from twin-stick and joypad layouts — a
shoulder-style horizontal target above the face buttons, not one more
diagonal step of the sweep below it.

**What this leaves for the implementing session.** `STRINGS.TOUCH_STEP` →
a DASH label (rename the constant or just its value — either is a one-line
change, `touch.js`'s reference to it is the only call site). A new box for
`dash` in `TOUCH_LAYOUT.buttons`, sized and placed as a horizontal target
rather than the current square one. `tools/touchcheck.js` needs updating
alongside this — it currently reads DASH as one more square in the five-item
sweep, and a horizontal shoulder target changes what its overlap math is
checking.

### Ticket: regular-enemy encounter windows stop freezing the game and stop describing the enemy

**Implemented 2026-08-09.** `_startEncounter` (`game.js`) now branches on
`e.boss`: a boss keeps the exact modal-`hud.window` + freeze behaviour it
always had (untouched — that is the next ticket's to change, not this one's).
A grunt encounter gets `this.hud.toast(e.intro.body)` instead — no freeze, no
title, no note. `e.intro.body` already *was* just the archetype list every
gate authors (`'Raakchyas × 3'`, `'Kawach × 1  ·  Tantrik × 1  ·  Raakchyas ×
1'`, …), so the toast needed no new copy, just a different mechanism to carry
it. `SYS_WINDOW.encounter` and `SYS_WINDOW.encounterNote` are gone from
`config.js` with their last caller, and `HUD.window`'s `duration` parameter
lost its now-dead default — every remaining call site already named one
explicitly, matching what its own doc comment claimed. `.toast` in
`style.css` traded `white-space: nowrap` for a `max-width` and centred text:
gate 7's `MELEE` encounter names five archetypes in one line, too long to
read as a single unbroken toast the way `'PUKAR'` or `'AREA CLEARED'` do.

**The open question, answered.** `docs/PLAYTEST.md` round 3's own words —
"too much text, for a short period of time... reading the texts while
fighting them is not very feasible" — is the teaching note's own obituary:
the note is cut entirely rather than relocated, for every encounter including
gate 1's `first-blood`. "No passive contact damage on anything" is already a
whole-game rule a hunter learns by taking a hit from nothing that isn't a
telegraphed attack, not a line that has to out-race three raakchyas to be
read. Verified with `?sim` across all five recorded seeds: the only red rows
on any of them are the pre-existing, already-frozen categories — signed-rank
(now failing on four of the five rather than the four it failed on before
this ticket; the isolation check `git stash push src/game/game.js
src/game/config.js src/ui/hud.js src/ui/style.css` on seed 20260802 confirms
that seed was already red pre-change, just at a different z, because a
playthrough runs faster without ten gates of encounter freezes and a faster
playthrough draws its seeded `Math.random` stream on a different frame
schedule — this is the frozen gate's own documented false-negative rate
doing what it does, not a new fault), `ranged` boss, and charger
`recovery-window`/`remnant` — unchanged in kind by this ticket.

Settled 2026-08-09, from the same playtest, a separate complaint from the
touch scheme above: **the pause before every single enemy encounter breaks
the pace, and describing what an enemy does is teaching the player something
play already teaches.**

**The mechanism being cut.** `Game._startEncounter` opens a full-screen
`hud.window` for every encounter carrying an `intro` (`game.js` around
`_startEncounter`), sized `SYS_WINDOW.encounter` (1700ms) or
`SYS_WINDOW.encounterNote` (2600ms) when the intro carries a teaching `note`.
Per "The System window pauses the fight it explains" above, this also sets
`this.freeze` to the window's full duration — the whole simulation halts,
hunter included, for up to 2.6 seconds per encounter, every encounter, every
gate. Ten gates of grunt encounters is where "annoying" comes from.

**The fix, for non-boss encounters only:** no freeze, no descriptive body
text, no `note` — just the archetype's name (`Bhoot-batti`, `Raakchyas`,
`Kawach`, `Tantrik`, `Charger`, …), shown briefly at top-center, non-blocking,
the same non-blocking mechanism `hud.toast` already uses for
`TOAST_AREA_CLEARED`, `TOAST_CHARGE`, and the rest — not the modal
`hud.window`. The fight starts under it exactly as it currently starts under
the window, except now the player can act through it.

**Open question for the implementing session.** Some `intro.note` fields
currently carry a one-time mechanic-teaching line (gate 1's `first-blood`,
for instance) rather than pure flavor text — cutting the window cuts that
teaching moment too, which is a real design tradeoff, not just a text
trim. `docs/PLAYTEST.md` has three prior rounds of findings on exactly this
window fighting the fight it opens over; worth rereading before deciding
whether any teaching content survives in the toast or is dropped entirely
per "the players will learn through playing."

### Ticket: boss (Warden) intros keep only the name, lose the freeze and the flavor text

**Implemented 2026-08-09.** `_startEncounter`'s boss branch (`game.js`) opens
a `hud.window` still — the "shorter, non-freezing window" half of the open
question below, kept rather than folded into the grunt ticket's toast,
because a Warden's arrival is a once-per-gate beat and the modal card's
extra presence costs nothing a freeze isn't also costing. But it carries only
`e.intro.body` (`WARDEN.title`, the Warden's actual name — `DWAR-RAKSHAK`,
`KEVAT`, `MAUN-ANKUR`, …) as the window's own title, dropping `e.intro.title`
(the flavor label, "GATE BOSS"/"GATE WARDEN", identical on eight of the ten
gates and so naming nothing the player didn't already know from the boss bar
appearing) and dropping the freeze entirely — no `this.freeze` write in the
boss branch any more. `SYS_WINDOW.bossIntro` (2400ms, frozen) is replaced by
`SYS_WINDOW.bossName` (1600ms, `config.js`) — shorter because a single word
needs less time on screen than a title-plus-name pair did, and unfrozen
because nothing pauses to read one word. `e.intro.title` and the ten
`GATEx_..._TITLE` strings it reads are left in place, unused, matching how
the grunt ticket above already left `intro.title`/`intro.note` defined but
unread rather than stripping every gate file — the same call this session
made there, made again here for consistency rather than re-litigated.
Verified with `?sim` across all five recorded seeds: every row — including
the per-seed signed-rank statistic, which shifted between the grunt ticket
and this one not at all — matches the grunt ticket's own verification run
exactly; the only red rows anywhere are the same pre-existing, already-frozen
categories (signed-rank on four of the five seeds, `ranged` boss, charger
`recovery-window`/`remnant`).

Settled 2026-08-09, from the same playtest, split from the ticket above
because the playtest's own ask was narrower here: **"maybe just name the main
bosses when they appear."** Bosses stay an exception to "no dialogue" — only
grunts lose their announcement outright.

**The fix.** Boss encounters (`intro: { title: STRINGS.GATEx_..._TITLE, body:
WARDEN.title }`, `SYS_WINDOW.bossIntro`, 2400ms, same freeze mechanism as the
ticket above) drop `WARDEN.title`'s flavor body and the freeze, keeping only
the name. Whether that name still opens as a (shorter, non-freezing)
`hud.window`, or folds into the same lightweight top-center treatment the
grunt ticket above gives regular enemies, is the implementing session's call
— a boss's arrival plausibly still deserves more presence than a grunt's, and
this entry deliberately does not pre-decide how much more.

### Ticket: System windows drop to gate-clear only — cut the gate-enter realm-naming window and 'enter'-boundary story beats

**Implemented 2026-08-09.** `_enterGate` (`game.js`) no longer opens
`hud.window({ title: STRINGS.SYS_TITLE, big: this.gate.name, duration:
SYS_WINDOW.gateEnter })` on arrival and no longer calls `_fireBeats('enter')`
— both full-screen, both used to fire on every gate entry, both gone.
`SYS_WINDOW.gateEnter` (`config.js`) is deleted with its last caller.
`_fireBeats('cleared')` is untouched: it still fires from the same two call
sites it always did (the Kevat falling, gate 10's ending narration), and the
remnant-teach and enrage windows are untouched too, exactly as "what survives"
below said they should be. The open question below is answered by leaving it
answered: the title screen's tag already names the gate before a run starts,
and nothing was added to replace the entry announcement — a smaller
replacement is a fresh decision this ticket declines to make unasked.
Every gate's `enter` beat (`BEATS`, `at: 'enter'`) is still defined — gate
2's arrival glitch among them — for `_fireBeats`'s `'cleared'` half to share
the same function and word-budget check with; `tools/gatecheck.js`'s `story
beats` probe still accepts `'enter'` as a boundary `_fireBeats` recognises,
because it still is one, just one nothing calls any more. `tools/sim.js`'s
`storyBeats` probe changed with it: the row that used to assert "the entry
beat fires on a real arrival, unforced" now asserts the opposite — gate 2's
glitch beat is defined but does not fire on arrival — since asserting the
old behaviour would have been asserting the bug this ticket exists to fix.
Verified with `?sim` across all five recorded seeds: the only red rows on
any of them are the pre-existing, already-frozen ones (signed-rank on some
seeds, `ranged` boss, charger `recovery-window`/`remnant`), unchanged by
this ticket.

Settled 2026-08-09, from the same playtest. **"The system prompts take the
whole display... those are not necessary. Maybe only show them when the
stage/gate is clear, no more."**

**What's cut.** Two things, both full-screen and both currently fire on gate
*entry*: `Game.reset()` (`game.js` around line 326) opens `hud.window({
title: STRINGS.SYS_TITLE, big: this.gate.name, duration:
SYS_WINDOW.gateEnter })` naming the realm on arrival at every gate, and
`_fireBeats('enter')` opens any of that gate's `enter`-boundary story beats
(`BEATS`, `at: 'enter'`, per gate). Both go.

**What survives, explicitly.** `_fireBeats('cleared')` is untouched — that is
where gate 10's ending narration
(`GATE10_BEAT_CLEARED_BODY`, the "release-the-chaya" close) and every other
gate's closing beat live, and the playtest's own ask draws the line at
exactly this boundary. The remnant-teach window (`_leaveCorpse`,
`STRINGS.REMNANT_BIG`, one-time per save) and the enrage warning
(`onEnrage`, `STRINGS.ENRAGE_BIG`) are a different category — neither fires
on gate-enter — and are out of scope for this ticket; flagged here so the
implementing session doesn't fold them in by assuming "cut the System
windows" meant all of them.

**Open question for the implementing session.** `game.js`'s own comment on
the gate-enter window says its job is that "ten gates in, the hunter still
knows where in the afterlife they are standing." The title screen's tag
(`STRINGS.TITLE_TAG`, "GATE n — name") already names the gate before a run
starts — whether that is enough on its own, or something smaller needs to
replace the entry announcement, is worth deciding rather than assuming.
