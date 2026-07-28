# SHADOW MONARCH

A Solo Leveling inspired 2.5D hack & slash. One hunter, one D-rank gate, and a
boss at the end of it. Devil May Cry's combat vocabulary — combo chains, cancel
windows, launchers, air juggles, a style meter — on Prince of Persia's
side-on traversal, rendered in the soft cel-shaded palette of a stylised
open-world Pokémon game.

It runs in a browser with **no build step and no dependencies to install**.
three.js is vendored into the repo; everything else — every model, animation,
sound and particle — is generated in code at startup. There is not a single
asset file.

![Combat](docs/combat.png)

## Run it

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static file server works; it must be
served over HTTP rather than opened as a `file://` URL, because the game is a
set of ES modules resolved through an import map.

## Controls

| Action | Keys |
| --- | --- |
| Move | `A` / `D` or arrows |
| Jump — press again in mid-air to **double jump** | `Space` |
| **Shadow Step** — dash, with invincibility frames | `Shift` |
| **Shadow Slash** — three-hit chain | `J` or `Z` |
| **Monarch's Rise** — launcher on the ground, **Shadow Descent** dive in the air | `K` or `X` |
| **Ruler's Authority** — piercing bolt, 16 MP | `L` or `C` |
| Pause | `Esc` |

## The fight

The light chain is three swings — two fast, then a heavy finisher — and each
one **lunges you forward**, because an attack that leaves you rooted reads as
slow no matter how quickly the animation plays. Press again during recovery to
cancel into the next hit; the cancel window always sits inside recovery and
never inside the active frames, so a chain feels responsive without one input
producing two hitboxes.

The launcher pops an enemy into the air and can be **jump-cancelled**, which is
the whole reason it exists: launch, chase it up, and finish the juggle with the
two-hit aerial. Air attacks suppress gravity for a few frames so a juggle stays
airborne — capped at two per airtime, or mashing attack would just be a
slow-fall button and every pit in the level would become optional.

The style meter rewards **variety**, not volume: repeating a move scores a
fraction of its value, and taking a hit costs you more than half the meter.

### One rule for every enemy

**Nothing has passive contact damage.** Touching a shadow beast, a wisp or the
Gate Guardian is completely safe. Every point of damage in the game comes from
a committed action with a visible tell — the beast crouches and its eyes flare,
the Guardian plants its feet and the core in its chest ignites.

This is not politeness, it is the only way the fight works. Your own attacks
lunge you into the enemy, so contact damage makes the correct play "never
attack" — and against a boss three times your width it makes melee a losing
proposition outright. It also makes losing legible: you lost because you missed
the tell, not because you brushed against something.

![Gate Guardian](docs/boss.png)

## The gate

One level, **Hollow of the Kneeling Stone**, named for the colossus knelt
behind the arena at the end of it.

1. **The approach** — no enemies. Room to find out what the buttons do.
2. **First blood** — three shadow beasts in a sealed bowl.
3. **The climb** — three committed jumps up a broken stair.
4. **The chasm** — islands over the void, patrolled by wisps that hold their
   distance and shoot.
5. **The bridge** — six enemies, arriving over seven seconds rather than all at
   once. The count is the spectacle; the spacing is the difficulty.
6. **The Gate Guardian** — 900 HP, four telegraphed attacks, and a second phase
   below half health.

Levelling up restores you to full and is the **only** heal in the game, which
makes the EXP curve a difficulty control rather than a reward schedule — it is
tuned so a level-up lands partway into the ambush, the one fight long enough to
run a health bar dry.

## Verification

Open <http://localhost:8000/?sim> to run the scripted suite. It steps the
simulation directly and drives the real input layer, so the bots play through
exactly the code path a human does — same buffering, same cancel windows, same
collision. `Math.random` is replaced with a seeded generator for the duration,
because two runs of the same build were otherwise disagreeing about whether the
level was completable.

This is not optional tooling. Browsers throttle `requestAnimationFrame` in an
unfocused tab, so any automated playtest that waits on wall-clock time advances
the simulation by a fraction of a second and silently measures nothing.

Current results:

| | |
| --- | --- |
| Jump envelope | **3.36** units high, **6.08** across at a run — 5.8 and 9.76 with the double jump |
| Gaps | widest is 3.8 (needs 4.5 of the 6.08); every one clearable on a single jump |
| Move list | all six attacks connect for their advertised damage |
| Playthrough | a bot that **reads telegraphs** clears the gate in 64.6 s at level 3; one that **ignores** them dies at the ambush |
| Gate Guardian | mash wins at 72 HP, dodge at 83, pure kiting loses |

That last pair of rows is the design stated as a test. The telegraph-reading
bot must clear and the naive one must not, which is what keeps the tells
load-bearing instead of decorative. For the boss, melee has to be a winning
answer and mana must not be — the `ranged` bot is a balance probe, and if it
ever starts winning comfortably the bolt is overtuned.

Six real bugs came out of writing it, including enemies being teleported onto
the tops of arena barriers (the collision solver ignored penetration when
velocity was zero), wisps following the player down into the void, and attack
lunges walking you off ledges while the swing rooted your steering. The commit
history has the details.

## How it looks

- **Cel shading** from a four-band gradient map on `MeshToonMaterial`.
  `NearestFilter` is load-bearing — any filtering reintroduces the gradient the
  banding exists to destroy.
- **Rim light** injected into the toon shader through `onBeforeCompile`. Cel
  shading alone flattens a silhouette against a dark background.
- **Ink outlines** from an inverted hull expanded along each vertex's *radial*
  direction rather than its normal. Box geometry has hard face normals, so a
  normal-expanded hull tears open at every corner.
- **Faceted rock** from non-indexed geometry with recomputed normals, since
  `MeshToonMaterial` has no `flatShading` flag — and baking facets into the
  geometry is cheaper anyway.
- **~17,000 grass blades** in one `InstancedMesh`, bent by a wind function in
  the vertex shader and scattered in clumps rather than uniformly, because
  uniform scatter reads as a texture swatch.
- **A three-stop sky gradient** with fog matched to the horizon, so distance
  dissolves into the sky instead of clipping to black.

All scenery sits at negative Z. The camera is at +Z, so a prop in front of the
play plane is a prop that hides the fight.

## Layout

```
index.html            import map, DOM overlay, the System's windows
src/
  main.js             boot and screen flow
  engine/
    loop.js           fixed 120 Hz simulation, decoupled rendering
    input.js          key state with a 160 ms press buffer
    audio.js          every sound, synthesised in the Web Audio graph
    mathx.js          clamp, damp, easing, value noise
  render/
    world.js          renderer, sky, lighting, bloom
    toon.js           gradient maps, rim light, inverted-hull outlines
    models.js         every character, built from boxes
    env.js            grass, rocks, spirit trees, mist, parallax ridges
    vfx.js            sparks, slash arcs, shockwaves, damage numbers
    palette.js        every colour
  game/
    game.js           combat resolution, encounters, progression
    player.js         movement, the move list, rig animation
    enemies.js        shadow beasts, wisps, projectiles
    boss.js           the Gate Guardian
    level.js          the gate: geometry, collision, encounter data
    camera.js         2.5D chase camera with trauma-based shake
    actor.js          shared AABB physics
    config.js         every tunable number
  ui/
    hud.js, style.css the System's interface
tools/
  sim.js              the scripted verification suite
vendor/three/         three.js v0.185.1, pinned
```

Physics runs at a fixed 120 Hz because combat is built on frame-counted windows
— active frames, cancel windows, i-frames — and those stop being tunable the
moment the step length varies. Every number that affects gameplay lives in
`src/game/config.js`; nothing gameplay-affecting is hard-coded anywhere else.

## Licence

MIT for the game code. three.js is vendored under `vendor/` and carries its own
MIT licence.
