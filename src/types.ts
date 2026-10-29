export const CHARACTER_SCHEMA_VERSION = 1 as const;
export const LIBRARY_SCHEMA_VERSION = 1 as const;

export type CharacterDataV1 = {
  schemaVersion: typeof CHARACTER_SCHEMA_VERSION;
  identity: {
    profileName: string;
    characterName: string;
    level: number;
    notes: string;
  };
  base: {
    str: number;
    dex: number;
    int: number;
    luk: number;
    maxHp: number;
    maxMp: number;
    weaponAttack: number;
    magicAttack: number;
  };
  percent: {
    strPct: number;
    allStatPct: number;
    attackPct: number;
  };
  offense: {
    damagePct: number;
    bossDamagePct: number;
    finalDamagePct: number;
    ignoreDefensePct: number;
    critRatePct: number;
    critDamagePct: number;
    weaponMasteryPct: number;
    attackSpeedStage: number;
  };
  target: {
    enemyLevel: number;
    defensePct: number;
    elementalResistancePct: number;
    arcaneForce: number;
    authenticForce: number;
  };
  enhancement: {
    hexaStatLevel: number;
    skillCoreLevel: number;
    masteryCoreLevel: number;
    unionArtifactLevel: number;
  };
  scenario: {
    spiritBondMax: boolean;
    spiritIncarnation: boolean;
    loadedDice: boolean;
    decentSharpEyes: boolean;
    includeFamiliars: boolean;
  };
};

export type SavedShadeProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  character: CharacterDataV1;
};

export type ShadeProfileLibraryV1 = {
  kind: 'shade-profile-library';
  schemaVersion: typeof LIBRARY_SCHEMA_VERSION;
  exportedAt?: string;
  profiles: SavedShadeProfile[];
};

export type ShadeProfileExportV1 = {
  kind: 'shade-profile';
  schemaVersion: typeof LIBRARY_SCHEMA_VERSION;
  exportedAt: string;
  profile: SavedShadeProfile;
};

export type FieldPath =
  | `identity.${keyof CharacterDataV1['identity']}`
  | `base.${keyof CharacterDataV1['base']}`
  | `percent.${keyof CharacterDataV1['percent']}`
  | `offense.${keyof CharacterDataV1['offense']}`
  | `target.${keyof CharacterDataV1['target']}`
  | `enhancement.${keyof CharacterDataV1['enhancement']}`;

export type BooleanFieldPath = `scenario.${keyof CharacterDataV1['scenario']}`;
export type ValidationErrors = Record<string, string>;
