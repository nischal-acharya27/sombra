# Spec — SORGI, the shadow extraction vertical slice

Status: ready to build, on the `sorgi` branch.
Design settled in `DECISIONS.md` § "ARISE / shadow extraction". This document
does not reopen any of it; it turns it into work.

## Problem Statement

The gate is playable and has been played three times. What the hunter can do in
it has not changed since the first round: swing, launch, juggle, dash, cast. The
signature mechanic of the genre this game sits in — killing something and then
raising it to fight beside you — is entirely absent, and its absence is now the
largest single gap between what the game is and what it is for.

That gap has a second, sharper cost. Level 1 has been tuned three times and is
running out of things worth tuning. Each round produced real findings, so each
round justified the next, and the project drifted toward *played, endlessly
retuned, never extended*. The Guardian's verified numbers are frozen waiting on
this mechanic, because re-tuning the boss before a shadow can be carried into
its arena would produce a number nobody could attribute afterwards. The
`ranged` kiting baseline is likewise parked. Until the shadow exists, several
open questions cannot be closed and the honest answer to "what is next" is
"more of the same".

From the player's side the problem is simpler: they kill a shadow beast, its
body lies there for a moment, and then it is gone and nothing happened. The
game is named for shadows and does nothing with them.

## Solution

**SORGI.** Kill a shadow beast and its corpse stays on the ground for about
four seconds, marked by a violet shard that visibly shrinks as the window
closes. Stand near it, hold down and press heavy, and the hunter roots in place
for a short channel. Take a hit during it and the channel breaks and the corpse
window keeps running out. Finish it and the beast rises again in your colours,
follows you, and pounces on whatever you are fighting.

You get exactly one. Extracting a second replaces the first. It has its own
health, it can be killed by the things it fights, and when it dies it is gone —
your only route to another is another corpse. It follows you out of the
encounter, down the level and through the arena door, and the arena contains no
other enemies and therefore no corpses, so whatever you walk in with is all you
get for the Guardian.

The cost is time and exposure, never mana. Standing still for the channel in
the middle of a fight is a gamble against the same telegraph system the rest of
the combat is built on. Its kills give you EXP, so clearing an encounter with
its help still levels you normally and the ally never reads as a punishment.
Its kills give you no style, so leaning on it quietly costs rank — and rank is
mana regeneration. The brake on "it kills things before you get there" lives
inside the mechanic as a cost, and needs no new number to defend.

Separately and unrelated: the full-screen overlays (title, pause, death, clear)
lose their backdrop blur, which is a permanent per-frame composite sitting over
a drifting camera on the first thing a visitor sees.

## User Stories

**Killing and the corpse**

1. As a hunter, I want a shadow beast's body to remain after I kill it, so that
   its death is an opportunity rather than a full stop.
2. As a hunter, I want a violet shard to appear on the corpse, so that I can
   tell an extractable body from scenery without being told.
3. As a hunter, I want that shard to shrink steadily as the window closes, so
   that I can read how long I have left without a number, a bar, or a HUD
   element.
4. As a hunter, I want the corpse to vanish when its window expires, so that the
   ground does not fill with bodies I can no longer use.
5. As a hunter, I want the System to tell me once — the first time a corpse ever
   appears — that the body can be claimed, so that the mechanic is taught rather
   than left to be discovered, because the launcher went undiscovered for two
   rounds and the style meter for three.
6. As a hunter, I want that System line to appear exactly once, so that a
   teaching aid does not become a per-kill interruption.
7. As a hunter, I want corpses to be harmless to stand on, walk through and
   fight over, so that the game's rule that bodies are safe holds without
   exception.

**Extracting**

8. As a hunter, I want to extract with a movement key I already hold plus an
   attack key I already use, so that the mechanic costs me no new finger
   position and no new binding to memorise.
9. As a hunter, I want plain heavy on its own to still launch, so that the move
   I reach for when a crowd closes never becomes a root because a body happened
   to be lying near me.
10. As a hunter, I want the channel to root me for a short, fixed time, so that
    the cost of the mechanic is exposure I can feel rather than a resource I
    have to budget.
11. As a hunter, I want the channel to break when I am hit, so that extracting
    in the middle of a live fight is a real gamble against the enemy telegraphs
    I have already learned to read.
12. As a hunter, I want a broken channel to cost me only the time I spent, so
    that failing it is a setback and not a punishment — the corpse window keeps
    running, and I may still have time for a second attempt.
13. As a hunter, I want the hunter to visibly commit during the channel, so that
    the root reads as a deliberate action rather than as the controls having
    stopped responding.
14. As a hunter, I want extraction to cost no mana, so that I never sit down and
    compute whether the bolt or the shadow is the mathematically better spend of
    the same pool.
15. As a hunter, I want extraction to be impossible when no corpse is in range,
    so that the key combination does nothing surprising in open ground.
16. As a hunter, I want a clear moment of arrival when the channel completes, so
    that the payoff reads as an event.

**The shadow**

17. As a hunter, I want the raised beast to wear a darker, violet-shifted
    version of the beast's own look, so that I can tell my shadow from the
    enemies at a glance in a crowded fight.
18. As a hunter, I want the shadow to follow me across the level, so that I do
    not have to babysit it or issue it orders.
19. As a hunter, I want the shadow to attack the nearest enemy on its own, so
    that it is an ally and not a second thing to pilot.
20. As a hunter, I want the shadow to use the pounce I already know how to read,
    so that its behaviour needs no new vocabulary from me.
21. As a hunter, I want the shadow to deal no damage merely by touching an
    enemy, so that the game's load-bearing rule — nothing hurts by existing,
    only by committing — survives the arrival of an ally.
22. As a hunter, I want the shadow to have its own health, so that it is
    something I can lose and therefore something I care about keeping.
23. As a hunter, I want the shadow to be killable only by things that commit to
    an attack, so that it dies to the same rules everything else in the game
    dies to.
24. As a hunter, I want a dead shadow to be gone for good, so that the only
    route to another is another corpse and another gamble.
25. As a hunter, I want to be able to have exactly one shadow, so that a
    corridor arena never fills with allies that clear the room before I reach
    it.
26. As a hunter, I want extracting a second corpse to replace my current shadow,
    so that upgrading is a decision I can make deliberately rather than an
    accident I have to avoid.
27. As a hunter, I want the shadow to survive the end of an encounter, so that
    what I spent to get it buys me more than the fight I got it in.
28. As a hunter, I want the shadow to follow me into the boss arena, so that the
    bridge ambush becomes a genuine choice: spend the shadow to survive it, or
    protect it for the Guardian.
29. As a hunter, I want the shadow never to block an encounter from clearing, so
    that "defeat all enemies" always means the enemies.
30. As a hunter, I want my own attacks to pass harmlessly through my shadow, so
    that having an ally never makes my own swings worse.
31. As a hunter, I want the shadow to be gone when I restart the run, so that a
    fresh run is genuinely fresh.

**Credit and cost**

32. As a hunter, I want the shadow's kills to give me EXP, so that clearing an
    encounter with its help still levels me on the pace the game is tuned for
    and the ally never feels like a tax.
33. As a hunter, I want the shadow's kills to give me no style, so that the
    score for what *I* did stays a score for what I did.
34. As a hunter, I want leaning on the shadow to quietly cost me rank, and
    therefore mana regeneration, so that the brake on letting it do the work is
    a cost I can feel rather than a rule that stops me.
35. As a hunter, I want the game not to freeze the frame when my shadow lands a
    hit, so that hitstop stays a reward for my own timing rather than a hitch
    caused by something I did not do.
36. As a hunter, I want the camera not to shake for my shadow's hits, so that an
    ally fighting off-screen does not shake the fight I am actually in.
37. As a hunter, I want to still see damage numbers from my shadow's hits, so
    that I can tell whether it is contributing.

**The overlays**

38. As a visitor to the live page, I want the title screen to composite cheaply,
    so that the first thing I see runs smoothly behind its drifting camera.
39. As a hunter, I want the title, pause, death and clear screens to still read
    clearly against the world behind them, so that removing the blur costs me no
    legibility.

**Verification and the developer**

40. As the developer, I want to play the slice myself before anything else is
    built on it, so that the first judgement of whether an ally makes the combat
    better or worse is made by a human and not by a bot.
41. As the developer, I want the suite to drive extraction through the real
    input path, so that what it verifies is the same code a human plays.
42. As the developer, I want the suite to assert that a corpse appears, is
    extractable, and expires, so that the window cannot be silently broken by a
    later change.
43. As the developer, I want the suite to assert that a hit during the channel
    cancels it, so that the mechanic's only cost cannot quietly stop being a
    cost.
44. As the developer, I want the suite to assert that only one shadow can exist,
    so that the design's central bound is enforced by the harness and not by
    memory.
45. As the developer, I want the suite to assert that shadow kills grant EXP and
    no style, so that the credit split — which carries the entire brake on the
    mechanic — is checked rather than assumed.
46. As the developer, I want a shadow-carrying playthrough bot, so that the
    level can be measured as it will actually be played once the mechanic
    exists.
47. As the developer, I want that bot to run across the same eight-seed sweep as
    the existing bots, so that a single lucky seed is never mistaken for
    evidence.
48. As the developer, I want the existing telegraph damage gap re-checked with a
    shadow in play, so that I find out immediately if an ally that absorbs
    pounces has made reading tells worth less.
49. As the developer, I want the suite to stay at zero failures across all eight
    seeds throughout, so that the slice lands without costing the project the
    one independent check it has.
50. As the developer, I want the Guardian's numbers left untouched by this work,
    so that when the boss is finally re-tuned there is exactly one change to
    attribute the result to.

## Implementation Decisions

**A single slot for the shadow, and a separate list for corpses.** The game
orchestrator gains two named fields: one holding the live shadow or nothing, and
one holding the extractable corpses. The single slot is not a convenience — it
is how "one summon at a time" stops being a rule someone has to remember to
enforce. Keeping corpses out of the enemy list is the same move: every loop in
the orchestrator that iterates enemies (player melee, projectile collision,
encounter-clear checks, the AI's target search) then cannot see a corpse without
being changed to, so none of them need a new guard. Both fields sit alongside
the fields the verification suite already reads for the boss, the enemies and
the active encounter, so this introduces no new kind of surface.

**Only shadow beasts leave corpses in this slice.** The design has beast raising
as melee and wisp as ranged, and wisp-as-ranged is deliberately not in this
slice. A shard on a wisp corpse would teach a promise the slice cannot keep, and
the tell that teaches the mechanic is the one thing that must not lie. Wisps
continue to die exactly as they do now.

**The ally is the beast's state machine pointed at a different target.** The
beast already receives its target as a parameter to its update rather than
reaching for the player, so an ally is the same chase-and-pounce behaviour given
the nearest enemy instead. This is what makes the slice small, and it is why the
measured allocation cost is essentially nothing: a second beast rig costs zero
additional shader programs and at most two geometries, so the ally reuses the
existing model and recolours it.

**The shadow's colours are a violet-shifted derivation of the beast's, added to
the palette.** Same rig, same silhouette, different palette entries. Reading
friend from foe in a crowd is the entire requirement, and silhouette is already
spoken for.

**Input is the down key held plus the heavy key pressed, checked before the
launcher.** The down action already exists in the bindings and is read by
nothing, so this spends input the game already has and adds no binding. The
ordering is load-bearing in two directions: the extraction branch must be
evaluated before the launcher branch or the launcher consumes the press first;
and within the branch the buffered press must be the last term in the condition,
per the rule the player module keeps — establish that extraction is possible,
then consume. Plain heavy on its own is untouched and still launches.

**The channel is a distinct player state that roots, not a reuse of the existing
slam-landing root.** The existing root ignores all input by design; extraction
additionally has to be cancellable by damage and has to report completion.
Completion is reported through the callback bundle the player already receives
from the orchestrator — the same mechanism that spawns bolts, raises shockwaves
and announces telegraphs. Corpse proximity is answered the same way: the player
asks the orchestrator for a corpse in range, because which corpses exist is the
orchestrator's knowledge and not the player's.

**Damage cancels the channel inside the player's own hurt path.** Every route
that damages the hunter already funnels through it — melee, projectiles, boss
shockwaves — so cancelling there covers all of them without any caller needing
to know that extraction exists.

**The shard is a built model with a lifetime, not a particle effect.** The
particle system is for one-shot bursts and sparks that own their own decay; the
shard is a persistent object whose scale is a readout of a timer the game is
tracking anyway. It belongs with the model builders, generated in code like
everything else — no asset files, as ever.

**The teaching line fires once per page load.** "The first time ever" cannot mean
more than that while persistence is deferred and nothing survives a reload. This
is recorded rather than left implicit precisely because it looks like a
persistence decision and is not one.

**Kill credit splits at the point where damage is applied.** The orchestrator's
damage-to-enemy path already grants EXP separately from style, so the split the
design needs is structurally present and costs no new tunable — exactly as the
design predicted. The shadow's damage takes the same path with credit attributed
to the shadow, which grants EXP, skips style, and additionally skips hitstop and
camera shake. Hitstop is feedback for the player's own timing; freezing the frame
for a hit the player did not make reads as a hitch, and shaking the camera for an
ally fighting off-screen shakes a fight the player is in. Damage numbers stay,
because the player needs to be able to see whether the ally is contributing.

**The shadow takes damage only from enemy attack boxes, and enemies do not
retarget onto it.** This keeps the no-passive-contact-damage rule symmetric — the
ally cannot be chipped to death by standing somewhere — and it keeps the AI
change out of the slice entirely. The shadow dives into melee by its own
behaviour, so it walks into pounces, sweeps and slams without anything needing to
aim at it. Whether enemies should eventually fight back deliberately is a
question for after the slice is played, not a gap in it.

**The shadow's combat numbers are its own, in the tunables module.** A new block
carries its health, its damage, its channel duration, its corpse window and its
extraction range. It borrows the beast's shape and speed but not its damage: a
shared number means tuning the enemy silently tunes the player's ally, which is
the kind of coupling that makes a later result unattributable.

**Restarting a run clears both the shadow and the corpses.** The orchestrator's
reset already tears down enemies, projectiles, pending spawns and deferred
effects; these join that list. A shadow surviving into a fresh run is the same
class of bug as the deferred camera shake that already had to be fixed there.

**Encounter clearing is untouched.** Because the shadow never enters the enemy
list, the "defeat all enemies" check cannot see it and needs no change. This is
the payoff for the first decision above.

**The overlay blur is deleted and compensated with a more opaque background.**
Same treatment already applied to the System window. This is a one-line removal
plus a background adjustment, unrelated to everything above, and it is not a
reopening of the frame-skip investigation — that is closed, the cause was the
compositor layer, and this is the cheaper half that was left behind.

## Testing Decisions

**One seam, and it already exists.** The verification suite steps the real game
orchestrator at the fixed timestep and drives the real input object, so its bots
play through the same buffering, the same cancel windows and the same collision
a human does. Everything below is asserted through it. No new seam is introduced
anywhere in the codebase, and no production code is restructured to be testable —
the two named fields on the orchestrator are the design's own shape, and the
suite reads them the way it already reads the boss and the active encounter.

**What makes a good test here.** Assert on what the player would observe: a
corpse exists and then does not; a shadow exists after a channel and does not
after a broken one; EXP moved and style did not; the level cleared. Do not
assert on internal timers, on which branch ran, or on the shape of a state
string. Every existing probe in the suite is written this way — the move list
probe places a target and reads its health, the juggle probe measures where the
enemy actually got to, the gap probe measures whether a jump actually lands.

**A focused extraction probe, in the shape of the existing focused probes.** It
places a corpse by hand at a known distance the way the move-list probe places a
target, and runs at zero latency because it is measuring mechanics rather than
reaction. It covers: a beast's death leaves a corpse; the corpse expires on
schedule; the channel produces a shadow; damage mid-channel produces none; a
second extraction replaces rather than adds; a shadow's kill moves EXP and leaves
style where it was.

**A shadow-carrying variant of the playthrough bot, across the full eight-seed
sweep.** The bot extracts when a corpse is available and it is safe to stand
still, and otherwise plays exactly as the existing tell-reading bot does. It runs
the same sweep, because a single seed has already been mistaken for evidence once
in this project and the fix was the sweep.

**The telegraph damage gap is re-checked, not re-baselined.** The suite currently
asserts that reading tells costs meaningfully less damage than ignoring them. An
ally that absorbs pounces could close that gap without the telegraphs having
changed at all. If it closes, the finding is real and belongs in the decisions
document; the standing warning in the suite applies unchanged — the fix is never
to handicap the naive bot.

**The suite stays at zero failures across all eight seeds.** That is the state
the branch starts from and the state it must be in at every point it is
committed.

**The boss numbers are not touched and the boss rows are not tuned toward.** The
existing three-strategy boss probe keeps running as a regression check. Its
numbers are expected to move once a shadow can be carried in, and that movement
is information for a later, separate change.

**Sequencing is part of the spec, not a nicety.** Build extraction, the corpse
and its tell, the melee shadow, and the EXP-without-style credit. Then stop, and
let the developer play it. Only after that does the shadow-carrying bot get
written, because the bot is small once the mechanic exists and unwritable before
it. The Guardian re-tune comes after both and is not in this spec.

## Out of Scope

- **The Guardian re-tune.** No boss number moves in this work. Its numbers are
  frozen until a shadow can be carried into the arena and the bot can measure
  what that does, and moving them now would leave two changes competing to
  explain one result.
- **The `ranged` hard gate.** Kiting must eventually stop winning a majority of
  seeds. That becomes a gate at the Guardian re-tune, not here. The current
  baseline — a loss with the boss left at 187 HP, from the bolt nerf alone — is
  already recorded and stays recorded.
- **Wisp-as-ranged.** The second shadow type comes only after the melee shadow
  feels right in the hand. Until then wisps leave no corpse.
- **More than one shadow.** Not a stretch goal, not a config option. The bound is
  the design.
- **Commanding the shadow.** No stay, no attack-target, no recall. It follows and
  it fights.
- **A shadow health bar or any new HUD element.** The corpse window is taught by
  the shard; the shadow's condition is taught by it being alive or not.
- **Persistence.** Nothing survives a reload, including this.
- **Enemies deliberately targeting the shadow.** They hit it when it walks into
  what they were already doing. Whether they should hunt it is a question for
  after the slice is played.
- **A fourth tuning round on level 1.** Barred outright until SORGI exists. A bug
  is not tuning and a suite regression is not tuning; neither is covered by the
  bar, so it cannot be used to wave either away.
- **New levels, new enemy types, gamepad support, any asset file, any build
  step.** All unchanged and all still excluded.

## Further Notes

**This is the riskiest thing built into the game so far.** It is the first
mechanic that can kill without the player, and it is therefore the mechanic most
likely to make the combat worse rather than better. Every bound in the design —
one at a time, no style credit, time-and-exposure cost, a corpse window that runs
out — exists to keep that failure recoverable. If the slice makes the game worse
in the hand, the finding is worth more than the code and belongs in the decisions
document with its reasoning intact.

**Evidence remains n=1 by explicit choice.** The game is publicly playable and
has not been sent to anyone. The developer's taste is the specification and the
suite is the only independent check that exists. That is precisely why the bot
must precede any boss tuning, and why the play gate in the sequencing above is a
real gate rather than a formality.

**The mechanic pays for itself in level design that already exists.** The boss
arena contains no other enemies and therefore no corpses, so whatever walks in is
all there is. That turns the bridge ambush into a genuine choice — spend the
shadow to survive it, or protect it for the Guardian — and it falls out of the
current level layout for free, with no new geometry and no new encounter.

**Measured, so the slice can be sized honestly.** A second beast costs zero
additional shader programs and at most two geometries. An ally that reuses the
beast rig allocates essentially nothing, which means performance is not a reason
to hesitate here and any frame-time change observed during this work is a bug
rather than a cost.

**The lesson this project has now paid for twice: measure before mitigating.** A
plausible-looking blind fix costs more than doing nothing, because it makes a
wrong theory look addressed — the overlay warm-up cost two rounds that way. The
cheap instruments are the renderer's program and geometry counters, which need no
frame timing at all and can be read straight after a manual step. Reach for them
first, not fifth.

**Running it.** The game is served with the project's own server script rather
than a plain static file server; the suite is the `?sim` flag and the frame panel
the `?perf` flag. Read the multi-seed rows, not a single run. There is no node,
no npm and no build step, and no proposal that introduces one is in scope.
