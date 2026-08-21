# Gate build

How a villain's filled-in handoff write-up becomes a playable gate. The
companion to `docs/agents/villain-handoff.md`: that doc ends at a written
design, this one starts there and ends at a commit.

Written after gate 07 (Kumbhakarna), the fourth gate built this way, because
the first four each rediscovered the same file set, the same five traps and
the same verification protocol from scratch. Everything below is a thing a
build session had to derive rather than read.

## Before you build, read exactly these

Reading more than this is how a session spends its context before writing a
line. Reading less is how it invents a convention that already exists.

- **The villain's entry in `docs/research/villain-roster.md`** — all seven
  fields. The Iconography, Kit shape and Phase-transition fields are the
  build order; the respectful-treatment note is load-bearing and usually
  names the exact mechanical spot it wants (a dialogue beat, a palette call).
- **The gate's row and paragraph in `docs/SPEC-CAMPAIGN.md`** — the act
  table gives setting, level shape, regular enemy and encounter *count*; the
  per-act dialogue table carries any locked pre-fight and phase-transition
  lines, which are quotations, not suggestions.
- **`src/game/gates/gate6.js`** — the current template. Panchavati is the
  most recent gate carrying every feature at once: a reskin, a solo debut, a
  combination, a phase-transition and a 22-beat scene.
- **One enemy template**, whichever matches the tier call:
  - tier 2 extending `Enemy` directly → `Bakasura` in `src/game/enemies.js`
    (two committed moves picked by range)
  - tier 2 extending a grunt → `Shurpanakha` (extends `Raakchyas`) or
    `LankaSoldier` (extends `Kawach`)
  - tier 3 → `src/game/boss.js`, and only for the four locked bosses
- **One rig template** in `src/render/models.js` — `buildBakasura` for a
  single-rig build, `buildTarakaForm`/`buildShurpanakhaForm` for a two-rig
  phase-transition.

Skip `CONTEXT.md` only if you already know the glossary; code review enforces
it.

## The file set, in dependency order

Working in this order means nothing is ever half-wired:

1. `src/render/palette.js` — the realm's and the villain's colours
2. `src/render/models.js` — `buildX()` per new rig
3. `src/game/config.js` — the stats block(s)
4. `src/game/enemies.js` — the class(es)
5. `src/game/game.js` — add to the `ARCHETYPES` registry, and to the
   `enemies.js` import beside it
6. `src/ui/strings.js` — the gate's own `GATE{N}_*` block
7. `src/game/gates/gate{N}.js` — the descriptor
8. `tools/gatecheck.js` — a `TELLS` row per new archetype
9. `docs/DECISIONS.md` — what you decided and why, including reversals

A new gate almost never touches `src/game/level.js`, `src/game/actor.js` or
`src/engine/`. If it does, that is a signal worth stating out loud rather
than a step.

## The descriptor shape

```js
export const GATE_N = {
  id, name, realm, beats,
  spawnX,            // where the hunter starts
  voidY,             // below every drop in the gate
  arenaTop,          // the y a Warden is spawned at
  exitX, end,        // the arch, and the right edge of the world
  segments, encounters, warden,
};
```

`segments` entries take `x0`, `x1`, `top`, and optionally `thickness`,
`depth`, `barren`, plus scatter counts `trees`, `boulders`, `pillars`,
`crystals`. Nothing else is read — `src/game/level.js` is the authority.

**Scatter counts choose their own x and z.** A segment says how *many*
boulders it has, never where they stand. When a gate needs a specific thing
in a specific spot — a well beside the gatepost, a lamp at the foot of a
stair — that is a **landmark**, not scatter: `landmark` is the gate's one
hero silhouette (the title-card camera drifts across it), and `landmarks`
is an array of ordinary authored placements through the same builder. Both
take `kind`, `x`, `y`, `z`, and optionally `rotY` and `scale`; kinds live in
`src/render/landmarks.js`. Gate 10 is the worked example.

`encounters` entries take `id`, `trigger`, `lock: [x0, x1]`, `intro`, and
`spawns: [{ type, x, delay, skin? }]`.

**`intro` is mostly dead weight, and the gate files do not admit it.** Every
gate authors `intro.title` and it is never read — `_beginEncounter` drops it.
`intro.note` is read in exactly one branch: a non-boss Warden encounter that
also carries an `intro.quote`. A **grunt** encounter gets
`hud.toast(e.intro.body)` and nothing else — no freeze, no title, no note —
since `docs/DECISIONS.md` § "regular-enemy encounter windows stop freezing
the game and stop describing the enemy" cut them on 2026-08-09, with
`docs/PLAYTEST.md` round 3 as the reason. Five gate files (1, 2, 3, 4, 6)
still author a `note:` that nothing renders. Do not add a sixth, and do not
plan an encounter around text that will not appear — **stage the lesson
instead.** Gate 7 teaches the spear's reach by landing one soldier alone
before the other two.

`warden` takes `archetype` (a key in `ARCHETYPES`), `title`, `stats`, and
optionally `skin`. A spawn of `type: 'warden'` reads it.

## The five traps

Each of these has cost a build session real time.

**A grunt skeleton under a new silhouette takes `buildRig`, it does not swap
the rig after construction.** `Raakchyas`, `Charger` and `Kawach` all take
`buildRig` as their last constructor parameter, defaulted so existing call
sites are unchanged. Building the superclass's rig and replacing it is not
merely waste: three.js draws four `Math.random()` values per object for its
UUID and the suite seeds `Math.random` globally, so a discarded rig spends
the gameplay stream and re-rolls every enemy's jitter after it.

**Re-tinting a rig mid-fight has to move `_flash`'s cached base.**
`Enemy.finishSetup` clones every material and caches its starting colour as
the base `_flash` restores to after a hit. Setting `material.color` alone
holds until the hunter's next swing and then silently reverts. See
`Kumbhakarna._retint`.

**Every archetype in `ARCHETYPES` needs a `TELLS` row in
`tools/gatecheck.js`,** or the `every archetype has a tell` row goes red. The
number the row must carry is the one the hunter actually answers — the
*enraged* or *post-phase* wind-up, not the opening one. The floor is 0.42s
(`RAAKCHYAS.pounce.windup`) and it is derived, not chosen.

**`boss: true` on an encounter means "one of the four locked bosses", not
"this is the Warden encounter".** It zooms the camera and lifts the audio
intensity. Gate clear is detected from a spawn of `type: 'warden'`, never
from this flag, so a Warden gate that sets it is claiming a rank it does not
have. Gates 1, 2, 4, 5, 6 and 7 correctly omit it.

**`soloDebut` is campaign-ordered, so check an archetype's first appearance
across the whole campaign, not within your gate.** A gate table naming a
*reskin* of an existing archetype is not evidence that archetype is
introduced anywhere. Gate 6 found `Tantrik` had no debut in the fifteen-gate
campaign at all and had to spend one of its own; gate 7's rebuild moved
`Charger`'s missing debut from gate 7 to gate 9. Both are real findings about
the spec's archetype budget, not licence taken with it.

## Beats

`beats` entries take `at`, `title`, `big`, `body`. The only boundaries
`_fireBeats` recognises are in `BEAT_BOUNDARIES` (`tools/gatecheck.js`):
`enter`, `intro`, `cleared`, `phase`, `choice-made`.

A Warden scene is **13 `intro` + 8 `cleared`**, plus one `phase` beat if the
villain has a phase-transition. `big` and `body` together are capped at 30
words per beat — elaborate content lives in beat *count*, never in cramming
one card.

A phase-transition fires through `Game.firePhaseBeat`, called from the
enemy's `takeHit` at `cfg.phaseAt`. It is a held, player-advanced window, not
a toast. Three consumers exist and they differ deliberately: Taraka's is
wordless with a two-rig swap, Shurpanakha's carries text with a two-rig swap,
Kumbhakarna's carries text with **no** rig swap. Reuse it; do not build a
fourth mechanism.

## Verification

**Capture the baseline FAIL set before touching anything.** The bar is
"strict subset of the baseline", not zero — `CLAUDE.md`'s "120 PASS / 0 FAIL"
is stale, and several rows fail on a healthy build (the frozen `signed-rank`
gate's known false-negative rate, and four rows that trace to the
phone-playtest `hp: 5` in `config.js`). A session that reads the headline
number literally will chase phantom regressions or "fix" a value that is
deliberately set.

Then sweep the five recorded seeds — `20260728`, `1`, `99991`, `20260802`,
`7777777` — and diff the FAIL *sets*. If a row moved rather than appeared,
say so and say why.

**`?sim` cannot see a face.** It has no opinion about whether a rig's hair is
buried inside its skull, whether a palette reads as black under a gate's fog,
or whether a weapon clips the floor at every idle frame. Gate 7 shipped all
three and a screenshot caught all three. Look at the thing.

macOS, when the browser extension is unavailable:

```bash
python3 tools/serve.py
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox \
  --use-angle=swiftshader --enable-unsafe-swiftshader \
  --remote-debugging-port=9222 --user-data-dir=<scratch>/profile about:blank
```

Both swiftshader flags are required or three.js gets no WebGL context and
`main.js` throws before anything runs. Drive it over CDP from Node (24+ has a
global `WebSocket`, so no npm). Three things bite: `--dump-dom` fires before
the ES modules execute, so poll for the suite's `<pre>` instead; **rAF does
not tick**, so frame-step with `game.update(1/60)`; and on a fresh profile
the tutorial runs and owns the world, so click `SKIP` before *and* after
`ENTER THE GATE` or the screen renders the tutorial while `game` advances
underneath. `game._enterGate(i)` jumps gates, 0-indexed.
