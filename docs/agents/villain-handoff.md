# Villain design handoff

How a villain's visual intent (reference images + written description)
becomes procedural three.js geometry, honoring the no-asset-files rule —
nothing here is ever imported; every model is built in code.

## The three build tiers

Every villain gets exactly one of these, decided during the handoff session
below, not inferred later during implementation:

1. **Reskin.** An existing `buildX()` in `src/render/models.js` takes a new
   `skin` object (see `buildCharger`, `buildKawach` for the pattern) — new
   palette, zero new geometry. Use when the villain's iconography doesn't
   need a silhouette distinct from an existing grunt/Warden rig.
2. **New rig, existing behavior.** A new `buildX()` in `models.js` for a
   genuinely new silhouette, but the enemy class still extends an existing
   behavior class (`Enemy`, or a `Charger`-style chase-and-attack) — no new
   state machine. Use when the silhouette is new but the fight isn't.
3. **Bespoke `Boss` subclass.** A new rig *and* a new state machine, attack
   list and pose table in `src/game/boss.js` — see `Guardian`/`GoruMukh`/
   `Hakim`/`Chiranjivi` for the shape (`boss.js`'s own header: "the boss's
   body is harmless, every source of damage is an action it commits to,
   telegraphed in advance"). Reserved for the four locked bosses only —
   Duryodhana, Ravana, Hiranyakashipu, Mahishasura, per issue #40's
   boss/Warden split. ~500+ lines each; this is the tier the campaign
   refused to scale past four.

## The written description template

One per villain, checked against `docs/research/villain-roster.md`'s
existing "Iconography (procedural)" note before writing anything new — most
of this is already there.

- **Silhouette and scale**, relative to the hunter's own `hw`/`hh` in
  `src/game/config.js` — concrete, not "large."
- **Signature weapon or feature** — a wielded prop, or a natural weapon
  (claws, extra heads, a coiled body).
- **Kit shape** — melee weapon-swing / grapple-throw / ranged-prop /
  no-combat-form. Decides whether tier 2 can reuse an existing behavior
  class.
- **Material/color palette** — named colors go in `src/render/palette.js`,
  following the per-realm convention (`narakaCore`, `manavPlateDark`, etc.).
- **Phase-transition flag** — a reveal or transform moment (human-disguise →
  monster, buffalo ↔ human), reusing the existing boss-enrage palette/pose
  swap precedent, or none.
- **Tier call** — 1, 2, or 3, from the section above.
- **Respectful-treatment note** — carried over from the research doc; don't
  drop it during retrofit.

## Reference images

Pasted inline in the live handoff session, or read from an absolute path
outside the repo. Never committed — not even gitignored. Nothing about the
image is expected to survive past the session that produces the write-up;
the written description above is the only durable artifact. This means each
villain's write-up happens in its own live session, one at a time (or a
small batch) — there's nothing to front-load against.

## Where this feeds

The filled-in template is what a build session works from — no
back-and-forth per gate should be needed beyond it. `docs/DECISIONS.md` has
the reasoning behind this workflow. The eventual campaign redesign spec
(replacing `docs/SPEC-CAMPAIGN.md`) folds this doc in rather than
duplicating it.
