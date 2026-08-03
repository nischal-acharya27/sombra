# SOMBRA

A 2.5D hack & slash: a hunter walks into the machinery of the afterlife and
finds it stopped. Static three.js (v0.185.1, vendored). **No build step, no npm,
no node** — do not propose a bundler, a build step, or a dependency.

## Run and verify

```bash
python3 tools/serve.py          # NOT python3 -m http.server
```

`http.server` sends no `Cache-Control`, so the browser serves stale ES modules
without asking. That failure is invisible and has already cost this project two
wrong diagnoses and several disagreeing playtest verdicts.

| URL | What it is |
| --- | --- |
| <http://localhost:8000> | the game |
| `?sim` | the suite |
| `?sim&seed=N` | one seed |
| `?perf` | frame panel |

**Verify with `?sim` across seeds before claiming anything works.** One seed is
not evidence — that mistake is why the suite sweeps rather than samples. The
five recorded seeds are `20260728`, `1`, `99991`, `20260802`, `7777777`, and the
suite is 75 PASS / 0 FAIL in ~6.8 s on all five.

**Red on one arbitrary seed is not a regression.** The telegraph gate has a
measured false-negative rate — roughly two arbitrary seeds in nine fail on a
healthy build. The gate is frozen: not the test, not the alpha, not the sample
size, precisely so a failure cannot be answered by adjusting the instrument.

## Rules that bind

- **No asset files, ever.** Every model, sound, particle and texture — and all
  storyline text — is generated or written in code.
- **Allocate nothing during a run.** Three.js draws four `Math.random()` values
  per object for its UUID and the suite seeds `Math.random` globally, so an
  object built mid-run spends the gameplay stream and re-rolls every enemy's
  jitter after it. **Gate transitions obey this by pre-building**: `Game`
  constructs every gate up front and switches between them with a `visible`
  flag, and the suite's `GATE TRANSITION` row counts the draws to prove it.
- **New suite probes go last in `runAll`.** Scoped seeds isolate a probe's
  randomness, not what thousands of frames do to the shared `Game` object.
- **No passive contact damage on anything.** Nothing harms the hunter by
  touching them. This is the rule the whole combat design rests on.
- **`pressed()` must be the last term in an input condition** — it consumes from
  the buffer, so a short-circuit before it silently eats the input.
- **Every tunable goes in `src/game/config.js`.**
- **Scenery lives at negative Z.** The camera sits at +Z; a prop in front of the
  play plane hides the fight. Models are built facing +X, and the lateral axis
  is Z.
- **Use `CONTEXT.md` vocabulary in code and prose.** Gate not level, remnant not
  corpse, shadow not summon, Warden not mini-boss. The glossary lists the words
  to avoid per term, and code review enforces it.

## When a suite number moves unexpectedly

**Measure — do not theorise.** The cheap isolation check: `git stash push
tools/sim.js`, re-run the same seed, compare. It settles whether a new row
disturbed an old one in one step, after five wrong theories once cost most of a
day. For anything touching gate construction, a draw counter around
`Game.update` is the *first* measurement, not the sixth.

`window.__game` exposes `{game, world, loop, audio, input, hud}`. Note that the
in-app browser throttles rAF, so wall-clock timing measured there is meaningless.

## Docs

- `CONTEXT.md` — the glossary. Read before naming anything.
- `docs/SPEC-CAMPAIGN.md` — the ten-gate campaign; § Further Notes carries the
  build order and the checkpoint that makes it honest.
- `docs/SPEC-SORGI.md` — the shadow mechanic.
- `docs/DECISIONS.md` — every decision and the reasoning, including the ones
  that were reversed and why.
- `docs/PLAYTEST.md` — what four rounds of real play found.

## Agent skills

### Issue tracker

Issues live as GitHub issues on `nischal-acharya27/sombra`, driven with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
