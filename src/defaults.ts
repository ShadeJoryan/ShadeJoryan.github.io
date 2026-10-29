import type { CharacterDataV1 } from './types';

export const createDefaultCharacter = (): CharacterDataV1 => ({
  schemaVersion: 1,
  identity: {
    profileName: 'New Shade',
    characterName: '',
    level: 260,
    notes: '',
  },
  base: {
    str: 0,
    dex: 0,
    int: 0,
    luk: 0,
    maxHp: 0,
    maxMp: 0,
    weaponAttack: 0,
    magicAttack: 0,
  },
  percent: {
    strPct: 0,
    allStatPct: 0,
    attackPct: 0,
  },
  offense: {
    damagePct: 0,
    bossDamagePct: 0,
    finalDamagePct: 0,
    ignoreDefensePct: 0,
    critRatePct: 0,
    critDamagePct: 0,
    weaponMasteryPct: 90,
    attackSpeedStage: 2,
  },
  target: {
    enemyLevel: 260,
    defensePct: 300,
    elementalResistancePct: 50,
    arcaneForce: 0,
    authenticForce: 0,
  },
  enhancement: {
    hexaStatLevel: 0,
    skillCoreLevel: 0,
    masteryCoreLevel: 0,
    unionArtifactLevel: 0,
  },
  scenario: {
    spiritBondMax: true,
    spiritIncarnation: false,
    loadedDice: false,
    decentSharpEyes: true,
    includeFamiliars: false,
  },
});
