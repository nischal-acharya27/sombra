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

  // Act 1 — Duryodhana, gate 3's boss. Per docs/research/villain-roster.md: a
  // human warrior-king, not a monster — warm gold-bronze armour, deep
  // maroon/oxblood rather than near-black (regal, not grim), a rich crimson
  // gada-head flare in the game's existing danger hue-family, and a
  // saturated green waist-wrap both reference images independently put him
  // in. Deliberately distinct from Kamsa's dark bronze/black "prison-iron"
  // coding so the two court tyrants don't read as reskins of each other, and
  // from Ravana's own `lankaPlate`/`lankaCore` a few gates later.
  kuruPlate: 0xc9973f,
  kuruPlateLight: 0xe0b463,
  kuruPlateDark: 0x5a2430,
  kuruCore: 0xd6222f,
  kuruWrap: 0x2f7d4a,
  kuruCrown: 0xe8c34a,
  kuruCrownDark: 0xb8901f,
  kuruSkin: 0xc98a5b,
  kuruEye: 0xff2a1a,

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

  // Act 2 — Shurpanakha. Per docs/research/villain-roster.md: two rigs, one
  // person. The human disguise lifts straight off the TV-serial reference —
  // gold jewelry, a cowrie-shell-banded headdress, a red drape, heavy kohl —
  // and needs no invention. `shurpaDrape` is the fresh crimson Kaikeyi's own
  // `kaikeyiRobe` was deliberately pulled away from (dried wine, not this),
  // and `shurpaGold` sits between Kaikeyi's ornament-bright gold and
  // Duryodhana's armor-toned plate.
  shurpaSkin: 0xb07a54,
  shurpaDrape: 0xa8202c,
  shurpaDrapeDark: 0x5e1018,
  shurpaGold: 0xc9a03e,
  shurpaShell: 0xe4dcc8,
  // Black in BOTH forms, not the second reference's red — the transformation
  // has to read as violence done to a person rather than a costume change,
  // the same logic Taraka's pelts carry across her own two phases.
  shurpaHair: 0x160f0c,
  // True form: pale ash-grey with dull, dried-blood vein-cracks. The maroon is
  // deliberately duller than the game's danger-red (`raakchyasEye`'s 0xff3b52)
  // so a marking on her skin never competes with an actual attack telegraph.
  shurpaAsh: 0x9a9690,
  shurpaAshDark: 0x5c5a56,
  shurpaVein: 0x6e2028,
  // The shared damage-signal amber again (Bakasura's hands, Taraka's eye) —
  // the roster spends no new telegraph hue on her, by her own entry's call.
  shurpaEye: 0xffb347,

  // Gate 6's two reskins, per docs/SPEC-CAMPAIGN.md's gate-06 table. The
  // forest rakshasa pulls the grunt's court-violet toward Panchavati bark and
  // leaf-rot; the jungle summoner-priest pulls the Tantrik's ash-linen robe
  // toward river-clay and bone. Only colour moves in either — the pounce and
  // the plant-and-cast underneath are the archetypes' own, unchanged, the
  // same reskin discipline gate 2's village rakshasa and gate 4's wisps keep.
  forestRakshasaBody: 0x2e3620,
  forestRakshasaDark: 0x161c10,
  forestRakshasaSpine: 0x4a3420,
  junglePriestRobe: 0x8a7a5c,
  junglePriestRobeDark: 0x54492f,
  junglePriestSigil: 0xd8f0a8,

  // Act 2 — gate 07's Lanka war-footing rakshasa-soldier, the campaign's first
  // new *regular* archetype since Act 1 (docs/SPEC-CAMPAIGN.md § Act 2). It is
  // Lanka's rank and file, so it opens the Lanka register one gate ahead of
  // Ravana rather than borrowing gate 6's forest tones — but deliberately not
  // with his own five names (`lankaSkin`/`lankaPlate`/`lankaPlateDark`/
  // `lankaRobe`/`lankaCore`, reserved by his roster entry for the "richly
  // adorned" court gold): a soldier's kit is war-worn and duller than the
  // king's by a whole octave, and a shared name at two brightnesses would
  // read as one of them being wrong. `lankaSoldierEye` reuses the shared
  // damage-signal amber outright — the same value `kawachEye` carries, on
  // purpose, because this archetype extends `Kawach`'s plant-and-commit
  // skeleton and the tell the hunter reads is the same tell.
  lankaSoldierPlate: 0x6a5a2c,
  lankaSoldierPlateDark: 0x30290f,
  lankaSoldierSkin: 0x6e5a52,
  lankaSoldierEye: 0xffb347,
  // The spear: dark haft, dull bronze head. Not `bladeSteel` — that is the
  // hunter's own blade, and the one weapon in the game that should read as
  // cleaner than what it is pointed at.
  lankaSpearHaft: 0x4a3826,
  lankaSpearHead: 0x9a8a5c,

  // Act 2 — Kumbhakarna. Per docs/research/villain-roster.md: coarse,
  // weathered-granite grey-brown, picked to sit clear of every other
  // giant/demon tone already spent (Shurpanakha's pale ash-grey, Taraka's
  // moss-green-to-black, Bakasura's sallow-bilious-purple). `kumbhaSkinDull`
  // is the same stone with the light taken out of it — the groggy phase's
  // "duller skin sheen", re-tinted to `kumbhaSkin` at the threshold rather
  // than being a second rig, since his phase-transition is explicitly a
  // one-rig pose/speed/palette change and not Taraka's or Shurpanakha's
  // two-rig swap.
  //
  // No jewelry colour anywhere in this block, and that is the point: his
  // entry asks for the inverse of Bakasura's bone-heavy read, reinforcing
  // the "sleep-boon simpleton" framing through absence. `kumbhaWrap` is
  // undyed cloth, the only garment on him.
  kumbhaSkin: 0x8b8479,
  kumbhaSkinDull: 0x6a6459,
  kumbhaSkinDark: 0x4e4941,
  kumbhaWrap: 0x6e5a3e,
  kumbhaHair: 0x2a2622,
  // The uprooted tree/club — the weapon that keeps the two giants distinct at
  // the kit level, since Bakasura already owns unarmed.
  kumbhaClub: 0x4a3a24,
  kumbhaClubDark: 0x2a2015,
  // The shared damage-signal amber one more time (Bakasura's hands, Taraka's
  // and Shurpanakha's eyes). His entry names this value outright: the groggy,
  // heavy-lidded eyes flare it as the telegraph rather than inventing a hue.
  kumbhaEye: 0xffb347,

  // Act 2 — gate 08's Ravana, and Lanka's court rather than its rank and file.
  // The five names his roster entry reserved a gate ago, now spent: `lankaSkin`
  // is a warm bronze/copper *human* tone, deliberately not the miniature
  // painting's classical blue — the blue-violet family is already carrying
  // `raakchyasBody`, `chayaBody`, `bossPlate`/`bossCore`, `wheelPlate` and
  // `chargerHide`, and every other rakshasa on the roster already signals
  // "monster" through an exotic skin (Shurpanakha's ash, Taraka's moss,
  // Bakasura's sallow purple, Kumbhakarna's granite). His entry names that
  // flattening as the exact thing to avoid for him specifically, so the skin
  // argues "person" and the head-arc carries the "not merely human" read on
  // its own.
  //
  // `lankaPlate`/`lankaPlateDark` are a full octave brighter and more ornate
  // than gate 07's war-worn `lankaSoldierPlate` — "richly adorned" is explicit
  // in his entry where it was not in Duryodhana's — and that gap between the
  // king's gold and his soldiers' is the whole reason the two were given
  // separate names instead of one value at two brightnesses.
  lankaSkin: 0xa96f45,
  lankaSkinDark: 0x6e4529,
  lankaPlate: 0xe8c05a,
  lankaPlateDark: 0x9c7a22,
  // Both anchor references' red-and-saffron drapes.
  lankaRobe: 0x8e1f24,
  // The per-head telegraph flare. In the game's shared warm amber/gold danger
  // family, but its own value inside it — the same relationship `kuruCore`,
  // `devaCore` and `wheelCore` each have to that family rather than a reused
  // hex. This is the one the hunter reads a wind-up off, five times over.
  lankaCore: 0xffd166,
  // The four weapons need two values between them, not four: the trishul and
  // the chakra take the court's own gold above, since both are the king's
  // regalia as much as his armament, and Chandrahas ("moon laughter") gets
  // the one cold value in the block, per the Uttara Kanda tradition's
  // moon-gift origin.
  lankaSword: 0xcfd8e8,
  // The torch's fire. Vermillion-crimson rather than anything in the orange
  // band, because `aagoCore`/`aagoGlow` are the hunter's own fire and the two
  // must never read as the same attack arriving from opposite sides. It ties
  // to `lankaRobe` instead, which is where the red on this rig already lives.
  lankaFlame: 0xd42032,

  // Gate 08's Lanka royal guard: `Kawach` pulled from its own plate to court
  // gold, one octave up from the soldier's war-worn kit and standing beside
  // it. The soldier itself is *not* reskinned here — the hunter learned that
  // spear's reach off that silhouette one gate ago, and repainting the thing
  // whose tell was just taught is how a taught tell gets untaught.
  lankaGuardPlate: 0x8a7434,
  lankaGuardPlateDark: 0x453914,

  // Act 3 — gate 09's Kamsa. Per docs/research/villain-roster.md: an
  // overbuilt human tyrant-king, not a monster, whose armour is built from
  // the iconography of the cell he kept Devaki in — literal bar-shapes, not
  // a smooth ruff. `mathuraPlate`/`mathuraPlateDark` are dark bronze/
  // near-black, deliberately apart from Duryodhana's warm gold-bronze
  // (`kuruPlate`) and Ravana's heavy court gold (`lankaPlate`) so the three
  // human/human-coded kings don't read as one palette repeated.
  // `mathuraIron` is the coldest, least "regal" material on the roster —
  // the bars, shackles, chain and crown all read as bolted onto the armour
  // rather than matching it, the jailer-iron identity his entry asks for.
  // `mathuraSkin` is a human tone distinct from both the hunter's own and
  // Ravana's `lankaSkin`, so the two human-coded villains don't visually
  // merge.
  mathuraPlate: 0x332618,
  mathuraPlateDark: 0x1a130b,
  mathuraIron: 0x6e7176,
  mathuraSkin: 0xc9946a,

  // Act 3 — gate 09's regular archetype, the Mathura akhada wrestler. Per
  // `docs/SPEC-CAMPAIGN.md` § Act 3, a wrestler/grappler set against Kamsa
  // before the boy ever reaches the throne — bare-chested, oiled, in a
  // plain akhada loincloth, deliberately unarmoured and unornamented so
  // nothing on it competes with Kamsa's own jailer-iron regalia one
  // encounter later. `mathuraWrestlerEye` reuses the shared damage-signal
  // amber (`P.amber`), the same telegraph vocabulary every archetype on the
  // roster reads a wind-up off, rather than inventing a fifth accent.
  mathuraWrestlerSkin: 0xa8703e,
  mathuraWrestlerSkinDark: 0x6a4726,
  mathuraWrestlerCloth: 0xc4b088,
  mathuraWrestlerEye: 0xffb347,

  // Act 3 — gate 10's Putana. Per docs/research/villain-roster.md: a
  // disguise-form beautiful woman over a bloated, poison-swollen true form.
  // `putanaRobe`/`putanaRobeGold` are the folk painting's bold
  // crimson-and-mustard stripe, deliberately not the generic gold-on-maroon
  // court look already spent by Duryodhana and Ravana; her jewelry reuses
  // `bladeSteel` rather than inventing a redundant silver. `putanaSkin` is
  // distinct from `hunterSkin`, `mathuraSkin` and `lankaSkin`. True form:
  // `putanaTrueSkin`/`putanaTrueSkinDark` is a sickly bile-khaki, kept off
  // Taraka's moss-green-to-black and Shurpanakha's ash-grey so the roster's
  // demon skins stay distinguishable at a glance. `putanaToxin` lights the
  // breath cloud and the true form's mouth/eye glow; the attack telegraph
  // itself stays on the shared damage-signal `amber` per her entry's own
  // instruction not to break that convention.
  putanaRobe: 0xb8283f,
  putanaRobeGold: 0xd9a63c,
  putanaSkin: 0xd1976a,
  putanaTrueSkin: 0x8f8a5c,
  putanaTrueSkinDark: 0x453f2c,
  putanaToxin: 0xacd94a,

  outline: 0x0a0813,
};
