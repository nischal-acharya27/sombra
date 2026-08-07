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

  outline: 0x0a0813,
};
