// One place for every colour in the game.
//
// The look is borrowed from stylised open-world Pokémon: desaturated, slightly
// chalky mid-tones, a strong sky gradient and heavy aerial perspective, so
// distant geometry washes toward the horizon instead of going black. The Solo
// Leveling half arrives as accent only — violet for shadow magic, cyan for the
// System, amber for damage.

export const P = {
  // Sky dome, top to bottom.
  skyZenith: 0x140b2e,
  skyMid: 0x3a2160,
  skyHorizon: 0x8a5a86,
  // Fog matches the horizon so distance dissolves rather than clipping.
  fog: 0x5c3f68,
  fogNear: 26,
  fogFar: 132,

  sunLight: 0xffd9c2,
  sunDim: 0x6f5aa8,
  skyFill: 0x9fb6ff,
  groundBounce: 0x4a2f52,

  // Terrain
  grassLight: 0x7fae7a,
  grassDark: 0x40704f,
  grassBlade: 0x8fc48c,
  grassBladeTip: 0xd8e9a8,
  dirt: 0x6b5847,
  rock: 0x6d6a7d,
  rockDark: 0x3f3d4d,
  rockMoss: 0x5d7a5e,
  stoneCarved: 0x8b869a,

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

  bossPlate: 0x3b3550,
  bossPlateDark: 0x221e33,
  bossCore: 0xb072ff,
  bossHorn: 0xcfc6b0,

  outline: 0x0a0813,
};
