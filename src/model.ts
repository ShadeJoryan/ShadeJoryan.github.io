import { createDefaultCharacter } from './defaults';
import type {
  CharacterDataV1,
  FieldPath,
  SavedShadeProfile,
  ShadeProfileExportV1,
  ShadeProfileLibraryV1,
  ValidationErrors,
} from './types';

const cloneDefaults = () => structuredClone(createDefaultCharacter());

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeKnown = <T extends Record<string, unknown>>(defaults: T, source: unknown): T => {
  if (!isRecord(source)) return defaults;
  const result: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const defaultValue = defaults[key];
    const sourceValue = source[key];
    if (isRecord(defaultValue)) {
      result[key] = mergeKnown(defaultValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }
  return result as T;
};

const sanitizeNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const normalizeCharacter = (input: unknown): CharacterDataV1 => {
  const defaults = cloneDefaults();
  const merged = mergeKnown(
    defaults as unknown as Record<string, unknown>,
    input,
  ) as unknown as CharacterDataV1;

  const numericSections = ['identity', 'base', 'percent', 'offense', 'target', 'enhancement'] as const;
  for (const sectionName of numericSections) {
    const section = merged[sectionName] as Record<string, unknown>;
    const defaultSection = defaults[sectionName] as Record<string, unknown>;
    for (const key of Object.keys(section)) {
      if (typeof defaultSection[key] === 'number') {
        section[key] = sanitizeNumber(section[key], defaultSection[key] as number);
      }
    }
  }

  merged.schemaVersion = 1;
  merged.identity.profileName = String(merged.identity.profileName || defaults.identity.profileName);
  merged.identity.characterName = String(merged.identity.characterName || '');
  merged.identity.notes = String(merged.identity.notes || '');
  for (const key of Object.keys(defaults.scenario) as Array<keyof CharacterDataV1['scenario']>) {
    merged.scenario[key] = Boolean(merged.scenario[key]);
  }
  return merged;
};

export const validateCharacter = (data: CharacterDataV1): ValidationErrors => {
  const errors: ValidationErrors = {};
  const required = (path: string, value: string, label: string) => {
    if (!value.trim()) errors[path] = `${label} is required.`;
  };
  const range = (path: FieldPath, value: number, min: number, max: number, label: string) => {
    if (!Number.isFinite(value)) errors[path] = `${label} must be a number.`;
    else if (value < min || value > max) errors[path] = `${label} must be between ${min} and ${max}.`;
  };

  required('identity.profileName', data.identity.profileName, 'Profile name');
  required('identity.characterName', data.identity.characterName, 'Character name');
  range('identity.level', data.identity.level, 1, 300, 'Level');

  const nonNegative: Array<[FieldPath, number, string, number]> = [
    ['base.str', data.base.str, 'STR', 99_999_999],
    ['base.dex', data.base.dex, 'DEX', 99_999_999],
    ['base.int', data.base.int, 'INT', 99_999_999],
    ['base.luk', data.base.luk, 'LUK', 99_999_999],
    ['base.maxHp', data.base.maxHp, 'Max HP', 999_999_999],
    ['base.maxMp', data.base.maxMp, 'Max MP', 999_999_999],
    ['base.weaponAttack', data.base.weaponAttack, 'Weapon attack', 9_999_999],
    ['base.magicAttack', data.base.magicAttack, 'Magic attack', 9_999_999],
    ['target.arcaneForce', data.target.arcaneForce, 'Arcane Force', 99_999],
    ['target.authenticForce', data.target.authenticForce, 'Authentic Force', 99_999],
  ];
  nonNegative.forEach(([path, value, label, max]) => range(path, value, 0, max, label));

  const percentages: Array<[FieldPath, number, string, number]> = [
    ['percent.strPct', data.percent.strPct, 'STR %', 9_999],
    ['percent.allStatPct', data.percent.allStatPct, 'All Stat %', 9_999],
    ['percent.attackPct', data.percent.attackPct, 'Attack %', 9_999],
    ['offense.damagePct', data.offense.damagePct, 'Damage %', 9_999],
    ['offense.bossDamagePct', data.offense.bossDamagePct, 'Boss Damage %', 9_999],
    ['offense.finalDamagePct', data.offense.finalDamagePct, 'Final Damage %', 9_999],
    ['offense.ignoreDefensePct', data.offense.ignoreDefensePct, 'Ignore Defense', 100],
    ['offense.critRatePct', data.offense.critRatePct, 'Critical Rate', 100],
    ['offense.critDamagePct', data.offense.critDamagePct, 'Critical Damage', 9_999],
    ['offense.weaponMasteryPct', data.offense.weaponMasteryPct, 'Weapon Mastery', 100],
    ['target.defensePct', data.target.defensePct, 'Enemy Defense', 9_999],
    ['target.elementalResistancePct', data.target.elementalResistancePct, 'Elemental Resistance', 100],
  ];
  percentages.forEach(([path, value, label, max]) => range(path, value, 0, max, label));

  range('offense.attackSpeedStage', data.offense.attackSpeedStage, 0, 8, 'Attack speed stage');
  range('target.enemyLevel', data.target.enemyLevel, 1, 300, 'Enemy level');
  range('enhancement.hexaStatLevel', data.enhancement.hexaStatLevel, 0, 20, 'Hexa stat level');
  range('enhancement.skillCoreLevel', data.enhancement.skillCoreLevel, 0, 30, 'Skill core level');
  range('enhancement.masteryCoreLevel', data.enhancement.masteryCoreLevel, 0, 30, 'Mastery core level');
  range('enhancement.unionArtifactLevel', data.enhancement.unionArtifactLevel, 0, 60, 'Union Artifact level');

  return errors;
};

export const createProfile = (character: CharacterDataV1): SavedShadeProfile => {
  const now = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? `shade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    id,
    name: character.identity.profileName.trim(),
    createdAt: now,
    updatedAt: now,
    character: normalizeCharacter(character),
  };
};

export const exportProfile = (profile: SavedShadeProfile): ShadeProfileExportV1 => ({
  kind: 'shade-profile',
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  profile,
});

export const parseImport = (text: string): SavedShadeProfile[] => {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value)) throw new Error('The JSON root must be an object.');

  if (value.kind === 'shade-profile-library' && Array.isArray(value.profiles)) {
    return value.profiles.map((item) => normalizeSavedProfile(item));
  }
  if (value.kind === 'shade-profile' && value.profile) {
    return [normalizeSavedProfile(value.profile)];
  }
  if ('identity' in value || 'base' in value) {
    return [createProfile(normalizeCharacter(value))];
  }
  throw new Error('This file is not a recognized Shade profile or library export.');
};

const normalizeSavedProfile = (input: unknown): SavedShadeProfile => {
  if (!isRecord(input)) throw new Error('A profile entry is invalid.');
  const character = normalizeCharacter(input.character ?? input);
  const fallback = createProfile(character);
  return {
    id: typeof input.id === 'string' && input.id ? input.id : fallback.id,
    name: typeof input.name === 'string' && input.name ? input.name : character.identity.profileName,
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : fallback.createdAt,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : fallback.updatedAt,
    character,
  };
};

export const createLibraryExport = (profiles: SavedShadeProfile[]): ShadeProfileLibraryV1 => ({
  kind: 'shade-profile-library',
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  profiles,
});
