// One place for every colour in the game.
//
// The look is borrowed from stylised open-world Pokémon: desaturated, slightly
// chalky mid-tones, a strong sky gradient and heavy aerial perspective, so
// distant geometry washes toward the horizon instead of going black. The Solo
// Leveling half arrives as accent only — violet for the chaya and pukar's
// extraction, cyan for the System, amber for damage.

// Sky, fog and terrain are not here: they belong to a realm, and each gate
// descriptor under `src/game/gates/` carries its own. What is left is what
// every gate shares — the light it is lit by, the System's accents, and what
// the characters are made of.
export const P = {
  sunLight: 0xffd9c2,
  sunDim: 0x6f5aa8,
  // Also every toon material's default rim colour, which is why it is shared
  // rather than a realm's.
  skyFill: 0x9fb6ff,
  groundBounce: 0x4a2f52,

  // Afterlife accents
  violet: 0x9d5cff,
  violetDeep: 0x4a1f8f,
  violetGlow: 0xc9a3ff,
  cyan: 0x5fd8ff,
  cyanDeep: 0x1b6f9c,
  amber: 0xffb347,
  crimson: 0xff4d5e,
  bone: 0xe8e2d0,

  // Characters
  hunterCoat: 0x2b2f45,
  hunterCoatDark: 0x1a1d2e,
  hunterTrim: 0x6f7bb5,
  hunterSkin: 0xe8c4a0,
  hunterHair: 0x1c1c26,
  bladeSteel: 0xd7dcea,

  raakchyasBody: 0x2a1f3d,
  raakchyasBodyDark: 0x17102a,
  raakchyasEye: 0xff3b52,
  bhootBattiCore: 0x7fe6ff,

  // The raised chaya. Same rig and same silhouette as the raakchyas it came
  // from, so colour is doing the entire friend-or-foe read — and the eyes
  // carry most of it, because the raakchyas's eyes are already where the player is looking.
  // Its tell is a crimson flare; the ally's is the System's cyan.
  chayaBody: 0x4a3ba0,
  chayaBodyDark: 0x2e2470,
  chayaSpine: 0x7f5cff,
  chayaEye: 0x5fd8ff,

  // Aago — the hunter's fire magic. Orange-red core, warm amber glow; the
  // bolt in render/vfx.js and the hit it lands both read off these.
  aagoCore: 0xff5a1f,
  aagoGlow: 0xffb347,

  // The charger. Slate and bone rather than the raakchyas's violet-black: the
  // hunter has to tell at a glance which tell they are about to be asked to
  // read, and the two are met a gate apart with nothing else to compare
  // against. The eyes are the tell, so they are the one warm thing on it.
  chargerHide: 0x3a4657,
  chargerHideDark: 0x212a38,
  chargerEye: 0xff7a3b,

  bossPlate: 0x3b3550,
  bossPlateDark: 0x221e33,
  bossCore: 0xb072ff,
  bossHorn: 0xcfc6b0,

  // Naraka — iron and red-black, gate 3's own register. Kept apart from the
  // Dwar-Rakshak's violet plate and core so the second boss doesn't read as
  // the first one recoloured.
  kawachPlate: 0x4a3230,
  kawachPlateDark: 0x241512,
  kawachEye: 0xffb347,

  narakaIron: 0x5a2e2e,
  narakaIronDark: 0x291414,
  narakaCore: 0xff5a3a,
  narakaHorn: 0x2c2422,

  // Preta-lok — the hungry ghosts. Pale and washed out on purpose, against
  // Naraka's iron: `docs/SPEC-CAMPAIGN.md` draws gate 4 sympathetically rather
  // than as villainy, and the palette is the first thing that says so.
  tantrikRobe: 0xaba296,
  tantrikRobeDark: 0x6e6558,
  tantrikEye: 0xcdeaff,
  tantrikSigil: 0xe4d9ff,

  // Manav-lok — the human realm. Warm brass rather than the two iron/pale
  // bosses before it: `docs/SPEC-CAMPAIGN.md` calls this realm "warm,
  // familiar, wrong", and the wrongness has to survive on top of a palette
  // that reads as home. `hakimSick` is the one note that doesn't belong — a
  // sickly green worked into the judge's regalia, the only colour in the rig
  // that isn't brass, bone or ember.
  manavPlate: 0x5c4526,
  manavPlateDark: 0x2b2013,
  manavCore: 0xf2b23c,
  manavAccent: 0x8a6a2e,
  hakimSick: 0x5a6a3a,

  // Deva-lok — the devas, and per `docs/SPEC-CAMPAIGN.md` the palette's own
  // payoff: light, cloud and pastel, echoing gate 1's violet rather than any
  // of the three iron/pale/brass bosses between them. `devaGold` is
  // Chiranjivi's crown and its core doubles as the realm's own crystal
  // accent, the same trick every prior boss's core plays against its gate.
  devaPlate: 0xd8cdf0,
  devaPlateDark: 0xa89fcf,
  devaCore: 0xfff0c2,
  devaGold: 0xf2cf7a,
  devaWing: 0xeee3ff,

  // The Wheel — Bhavachakra, and per `docs/SPEC-CAMPAIGN.md` "every palette
  // bleeding": not a tenth register but the nine before it un-sorted, so
  // `wheelPlate`/`wheelPlateDark` sample Naraka's iron and Manav-lok's brass
  // in the same material rather than choosing between them. `wheelCore` is
  // Maun-Ankur's own core and the realm's crystal accent, the same trick
  // every prior boss's core plays against its gate — grown from the
  // Kneeling Stone's dead violet eye rather than matching any single realm.
  wheelPlate: 0x6a4a5c,
  wheelPlateDark: 0x2e1f38,
  wheelCore: 0xc25cff,
  wheelBloom: 0xff9a5c,

  // Act 1 (Mahabharata) — Shakuni. Per docs/research/villain-roster.md: aged
  // cloth, bone, dull gold, none of the roster's violet/iron/crimson
  // supernatural registers. `crimson` (above) carries the die's one danger
  // accent, reused rather than a new saturated hue for the same reason.
  shakuniRobe: 0x8a7a5a,
  shakuniRobeDark: 0x564a36,
  shakuniGold: 0x9c8a4a,
  // The beard: the one detail that reads "aged courtier" rather than "a
  // smaller grunt" at a glance, per the handoff's "slight through
  // proportion, not stature". Ash-grey rather than another warm court tone,
  // so it separates from `bone`'s skin and `shakuniRobe` in silhouette.
  shakuniBeard: 0x9a9488,

  // Act 1 — Bakasura. Per docs/research/villain-roster.md: sickly, bruised,
  // gluttonous — sallow, bilious skin, distinct from Raakchyas's clean
  // violet-black and Kawach's iron-brown so he doesn't read as a bigger
  // version of either. Bone jewelry (necklace, forearm rings, helm crest)
  // reuses `bone` above, deliberately neutral so it never competes with
  // `bakasuraHand`, the kit's one saturated accent.
  bakasuraSkin: 0x8f9450,
  bakasuraSkinDark: 0x565a2e,
  // Bruise-purple worked into the belly's own sagging folds.
  bakasuraBruise: 0x5c3a5e,
  // The oversized hands' inflamed, reddened tone — the actual grabbing
  // instrument and the combat-readable tell, doing the same "this is the
  // part that hurts you" job Kawach's amber eye does for its own bash.
  bakasuraHand: 0xdb5a3c,
  bakasuraHair: 0x2e2318,

  // Act 2 — Taraka. Per docs/research/villain-roster.md: a clean two-state
  // curse, warm and human before it, forest-demon-coded moss-green-to-black
  // after — kept apart from every existing violet/iron/slate demon on the
  // roster. `tarakaEye` reuses the roster's shared damage-signal `amber`
  // (Bakasura's hands, Shurpanakha's and Kumbhakarna's eyes) rather than
  // inventing a fourth telegraph hue.
  tarakaSkin: 0xc9926a,
  tarakaHair: 0x3a2416,
  tarakaMoss: 0x445934,
  tarakaMossDark: 0x1e2416,
  tarakaBark: 0x4a3420,
  // Raw hide/pelt — the reference's other half, carried into both forms as
  // identity rather than corruption.
  tarakaPelt: 0x8a6a42,
  tarakaEye: 0xffb347,
  // Gate 4's `BhootBatti` reskin — forest wisps, per docs/SPEC-CAMPAIGN.md's
  // gate-04 table. A sickly pale green rather than the crossing's cyan, so
  // they read as belonging to the curse-touched canopy rather than as the
  // same light relocated.
  forestWispCore: 0xc9f08a,
  forestWispHalo: 0x6a9a3e,

  // Act 2 — Kaikeyi. Per docs/research/villain-roster.md, kept close to a
  // specific reference portrait rather than shifted to a new hue family: a
  // grieving human queen, not a monster, in wine-red bridal/coronation
  // attire and jewelry-toned gold. `kaikeyiRobe` sits darker and more muted
  // than Ravana's vermillion `lankaRobe` or Shurpanakha's red drape — dried
  // wine, not fresh crimson, distinguishing her by hue where her silhouette
  // (nose ring, coin necklace, paisley crown) already carries most of the
  // load against Shurpanakha's own gold-and-red disguise palette.
  // `kaikeyiGold` is a brighter, ornament-toned gold, distinct from
  // Duryodhana's armor-toned `kuruPlate` and Hiranyakashipu's muted
  // `hiranyaGold`. No `kaikeyiCore` — nothing in her kit does damage, so
  // there is no "incoming hit" for a telegraph flare to signal.
  kaikeyiRobe: 0x5c2430,
  kaikeyiRobeDark: 0x3a1620,
  kaikeyiGold: 0xd9ad48,
  kaikeyiSkin: 0xa87454,
  kaikeyiHair: 0x241610,

  outline: 0x0a0813,
};
