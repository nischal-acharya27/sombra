// One place for every colour in the game.
//
// The look is borrowed from stylised open-world Pokémon: desaturated, slightly
// chalky mid-tones, a strong sky gradient and heavy aerial perspective, so
// distant geometry washes toward the horizon instead of going black. The Solo
// Leveling half arrives as accent only — violet for shadow magic, cyan for the
// System, amber for damage.

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

  // Shadow realm accents
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

  beastBody: 0x2a1f3d,
  beastBodyDark: 0x17102a,
  beastEye: 0xff3b52,
  wispCore: 0x7fe6ff,

  // The raised shadow. Same rig and same silhouette as the beast it came from,
  // so colour is doing the entire friend-or-foe read — and the eyes carry most
  // of it, because the beast's eyes are already where the player is looking.
  // Its tell is a crimson flare; the ally's is the System's cyan.
  shadowBody: 0x4a3ba0,
  shadowBodyDark: 0x2e2470,
  shadowSpine: 0x7f5cff,
  shadowEye: 0x5fd8ff,

  bossPlate: 0x3b3550,
  bossPlateDark: 0x221e33,
  bossCore: 0xb072ff,
  bossHorn: 0xcfc6b0,

  outline: 0x0a0813,
};
