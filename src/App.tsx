import { useMemo, useRef, useState } from 'react';
import { NumberField } from './components/NumberField';
import { ProfilePanel } from './components/ProfilePanel';
import { SectionCard } from './components/SectionCard';
import { ToggleField } from './components/ToggleField';
import { createDefaultCharacter } from './defaults';
import {
  createLibraryExport,
  createProfile,
  exportProfile,
  normalizeCharacter,
  parseImport,
  validateCharacter,
} from './model';
import { loadLibrary, saveLibrary } from './storage';
import type {
  BooleanFieldPath,
  CharacterDataV1,
  FieldPath,
  SavedShadeProfile,
} from './types';

type NumberDescriptor = {
  path: FieldPath;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  help?: string;
};

type Toast = { tone: 'success' | 'warning' | 'info'; message: string } | null;

const baseFields: NumberDescriptor[] = [
  { path: 'base.str', label: 'STR', min: 0, max: 99_999_999, help: 'Shade primary stat' },
  { path: 'base.dex', label: 'DEX', min: 0, max: 99_999_999, help: 'Shade secondary stat' },
  { path: 'base.int', label: 'INT', min: 0, max: 99_999_999 },
  { path: 'base.luk', label: 'LUK', min: 0, max: 99_999_999 },
  { path: 'base.maxHp', label: 'Max HP', min: 0, max: 999_999_999 },
  { path: 'base.maxMp', label: 'Max MP', min: 0, max: 999_999_999 },
  { path: 'base.weaponAttack', label: 'Weapon attack', min: 0, max: 9_999_999, help: 'Total attack shown in the stat window' },
  { path: 'base.magicAttack', label: 'Magic attack', min: 0, max: 9_999_999 },
];

const percentFields: NumberDescriptor[] = [
  { path: 'percent.strPct', label: 'STR', min: 0, max: 9_999, unit: '%' },
  { path: 'percent.allStatPct', label: 'All Stat', min: 0, max: 9_999, unit: '%' },
  { path: 'percent.attackPct', label: 'Attack', min: 0, max: 9_999, unit: '%' },
];

const offenseFields: NumberDescriptor[] = [
  { path: 'offense.damagePct', label: 'Damage', min: 0, max: 9_999, unit: '%' },
  { path: 'offense.bossDamagePct', label: 'Boss Damage', min: 0, max: 9_999, unit: '%' },
  { path: 'offense.finalDamagePct', label: 'Final Damage', min: 0, max: 9_999, unit: '%' },
  { path: 'offense.ignoreDefensePct', label: 'Ignore Defense', min: 0, max: 100, step: 0.01, unit: '%' },
  { path: 'offense.critRatePct', label: 'Critical Rate', min: 0, max: 100, step: 0.01, unit: '%' },
  { path: 'offense.critDamagePct', label: 'Critical Damage', min: 0, max: 9_999, step: 0.01, unit: '%' },
  { path: 'offense.weaponMasteryPct', label: 'Weapon Mastery', min: 0, max: 100, step: 0.01, unit: '%' },
  { path: 'offense.attackSpeedStage', label: 'Attack speed stage', min: 0, max: 8, help: '0 is fastest' },
];

const targetFields: NumberDescriptor[] = [
  { path: 'target.enemyLevel', label: 'Enemy level', min: 1, max: 300 },
  { path: 'target.defensePct', label: 'Enemy Defense', min: 0, max: 9_999, unit: '%' },
  { path: 'target.elementalResistancePct', label: 'Elemental resistance', min: 0, max: 100, unit: '%' },
  { path: 'target.arcaneForce', label: 'Arcane Force', min: 0, max: 99_999 },
  { path: 'target.authenticForce', label: 'Authentic Force', min: 0, max: 99_999 },
];

const enhancementFields: NumberDescriptor[] = [
  { path: 'enhancement.hexaStatLevel', label: 'Hexa stat level', min: 0, max: 20 },
  { path: 'enhancement.skillCoreLevel', label: 'Skill core level', min: 0, max: 30 },
  { path: 'enhancement.masteryCoreLevel', label: 'Mastery core level', min: 0, max: 30 },
  { path: 'enhancement.unionArtifactLevel', label: 'Union Artifact level', min: 0, max: 60 },
];

const scenarioFields: Array<{
  path: BooleanFieldPath;
  label: string;
  description: string;
}> = [
  { path: 'scenario.spiritBondMax', label: 'Spirit Bond Max', description: 'Treat the Shade link state as active.' },
  { path: 'scenario.spiritIncarnation', label: 'Spirit Incarnation', description: 'Include the active skill window later.' },
  { path: 'scenario.loadedDice', label: 'Loaded Dice', description: 'Account for the selected buff in a future formula.' },
  { path: 'scenario.decentSharpEyes', label: 'Decent Sharp Eyes', description: 'Include the common critical buff.' },
  { path: 'scenario.includeFamiliars', label: 'Familiars', description: 'Reserve familiar effects for simulation.' },
];

const getValue = (data: CharacterDataV1, path: FieldPath): string | number => {
  const [section, key] = path.split('.') as [keyof CharacterDataV1, string];
  return (data[section] as unknown as Record<string, string | number>)[key];
};

const downloadJson = (name: string, value: unknown) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const safeFileName = (value: string) => value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'shade-profile';

function App() {
  const initialLibrary = useMemo(() => loadLibrary(), []);
  const [profiles, setProfiles] = useState<SavedShadeProfile[]>(initialLibrary.profiles);
  const [character, setCharacter] = useState<CharacterDataV1>(() => createDefaultCharacter());
  const [selectedId, setSelectedId] = useState<string | null>(initialLibrary.profiles[0]?.id ?? null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadedSnapshot, setLoadedSnapshot] = useState(() => JSON.stringify(createDefaultCharacter()));
  const [toast, setToast] = useState<Toast>(null);
  const importInput = useRef<HTMLInputElement | null>(null);

  const errors = useMemo(() => validateCharacter(character), [character]);
  const errorCount = Object.keys(errors).length;
  const isDirty = JSON.stringify(character) !== loadedSnapshot;

  const persist = (nextProfiles: SavedShadeProfile[]) => {
    setProfiles(nextProfiles);
    try {
      saveLibrary({ kind: 'shade-profile-library', schemaVersion: 1, profiles: nextProfiles });
    } catch {
      setToast({ tone: 'warning', message: 'The profile changed in this session, but browser storage could not be updated.' });
    }
  };

  const updateField = (path: FieldPath, value: string | number) => {
    const [section, key] = path.split('.') as [keyof CharacterDataV1, string];
    setCharacter((current) => {
      const next = structuredClone(current);
      (next[section] as unknown as Record<string, string | number>)[key] = value;
      return next;
    });
  };

  const updateToggle = (path: BooleanFieldPath, value: boolean) => {
    const key = path.split('.')[1] as keyof CharacterDataV1['scenario'];
    setCharacter((current) => ({
      ...current,
      scenario: { ...current.scenario, [key]: value },
    }));
  };

  const saveCurrent = (asNew: boolean) => {
    if (errorCount) {
      setToast({ tone: 'warning', message: `Fix ${errorCount} validation ${errorCount === 1 ? 'issue' : 'issues'} before saving.` });
      return;
    }
    const now = new Date().toISOString();
    let saved: SavedShadeProfile;
    let nextProfiles: SavedShadeProfile[];

    if (!asNew && activeId && profiles.some((profile) => profile.id === activeId)) {
      const existing = profiles.find((profile) => profile.id === activeId)!;
      saved = {
        ...existing,
        name: character.identity.profileName.trim(),
        updatedAt: now,
        character: normalizeCharacter(character),
      };
      nextProfiles = profiles.map((profile) => (profile.id === saved.id ? saved : profile));
    } else {
      saved = createProfile(character);
      nextProfiles = [saved, ...profiles];
    }

    persist(nextProfiles);
    setSelectedId(saved.id);
    setActiveId(saved.id);
    setLoadedSnapshot(JSON.stringify(character));
    setToast({ tone: 'success', message: asNew ? 'Saved as a new local profile.' : 'Profile saved locally.' });
  };

  const loadSelected = () => {
    const profile = profiles.find((item) => item.id === selectedId);
    if (!profile) return;
    if (isDirty && !window.confirm('Discard the unsaved changes currently in the editor?')) return;
    const normalized = normalizeCharacter(profile.character);
    setCharacter(normalized);
    setActiveId(profile.id);
    setLoadedSnapshot(JSON.stringify(normalized));
    setToast({ tone: 'info', message: `Loaded ${profile.name}.` });
  };

  const deleteSelected = () => {
    const profile = profiles.find((item) => item.id === selectedId);
    if (!profile || !window.confirm(`Delete the saved profile “${profile.name}”?`)) return;
    const nextProfiles = profiles.filter((item) => item.id !== profile.id);
    persist(nextProfiles);
    setSelectedId(nextProfiles[0]?.id ?? null);
    if (activeId === profile.id) setActiveId(null);
    setToast({ tone: 'info', message: 'Saved profile deleted. The editor contents were left unchanged.' });
  };

  const resetEditor = () => {
    if (isDirty && !window.confirm('Reset the editor to defaults and discard unsaved changes?')) return;
    const fresh = createDefaultCharacter();
    setCharacter(fresh);
    setActiveId(null);
    setLoadedSnapshot(JSON.stringify(fresh));
    setToast({ tone: 'info', message: 'Editor reset. Saved profiles were not changed.' });
  };

  const exportCurrent = () => {
    const existing = profiles.find((profile) => profile.id === activeId);
    const profile = existing
      ? { ...existing, name: character.identity.profileName, updatedAt: new Date().toISOString(), character }
      : createProfile(character);
    downloadJson(`${safeFileName(character.identity.profileName)}.json`, exportProfile(profile));
    setToast({ tone: 'success', message: 'Current profile exported.' });
  };

  const exportLibrary = () => {
    downloadJson('shade-profile-library.json', createLibraryExport(profiles));
    setToast({ tone: 'success', message: `Exported ${profiles.length} saved ${profiles.length === 1 ? 'profile' : 'profiles'}.` });
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      if (imported.length === 0) throw new Error('The imported library does not contain any profiles.');
      const merged = new Map(profiles.map((profile) => [profile.id, profile]));
      imported.forEach((profile) => merged.set(profile.id, profile));
      const nextProfiles = Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      persist(nextProfiles);
      const first = imported[0];
      setCharacter(first.character);
      setSelectedId(first.id);
      setActiveId(first.id);
      setLoadedSnapshot(JSON.stringify(first.character));
      setToast({ tone: 'success', message: `Imported ${imported.length} ${imported.length === 1 ? 'profile' : 'profiles'} and loaded the first one.` });
    } catch (error) {
      setToast({ tone: 'warning', message: error instanceof Error ? error.message : 'The JSON file could not be imported.' });
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  const runSimulation = () => {
    if (errorCount) {
      setToast({ tone: 'warning', message: `Simulation is blocked by ${errorCount} validation ${errorCount === 1 ? 'issue' : 'issues'}.` });
      return;
    }
    setToast({ tone: 'info', message: 'Simulation engine placeholder reached. Damage formulas can be connected here next.' });
  };

  const renderNumberFields = (fields: NumberDescriptor[]) =>
    fields.map((field) => (
      <NumberField
        key={field.path}
        id={field.path.replace('.', '-')}
        label={field.label}
        value={Number(getValue(character, field.path))}
        onChange={(value) => updateField(field.path, value)}
        error={errors[field.path]}
        help={field.help}
        min={field.min}
        max={field.max}
        step={field.step}
        unit={field.unit}
      />
    ));

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Shade Lab home">
          <span className="brand-mark">S</span>
          <span>
            <strong>Shade Lab</strong>
            <small>Character input · schema v1</small>
          </span>
        </a>
        <div className="topbar__status">
          <span className={`status-pill ${isDirty ? 'status-pill--dirty' : ''}`}>
            <span /> {isDirty ? 'Unsaved changes' : 'Up to date'}
          </span>
          <button className="button button--ghost button--compact" type="button" onClick={resetEditor}>
            Reset
          </button>
        </div>
      </header>

      <main id="top" className="workspace">
        <ProfilePanel
          profiles={profiles}
          selectedId={selectedId}
          activeId={activeId}
          onSelect={setSelectedId}
          onLoad={loadSelected}
          onDelete={deleteSelected}
          onSave={() => saveCurrent(false)}
          onSaveAs={() => saveCurrent(true)}
          onImport={() => importInput.current?.click()}
          onExportProfile={exportCurrent}
          onExportLibrary={exportLibrary}
        />

        <input
          ref={importInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => void importJson(event.target.files?.[0])}
        />

        <div className="editor">
          <section className="hero-card">
            <div>
              <span className="eyebrow">MapleStory · Pirate · Knuckle</span>
              <h1>Shade character input</h1>
              <p>
                Capture a reproducible stat snapshot now, then connect the versioned model to a damage engine later.
              </p>
            </div>
            <div className="class-chip" aria-label="Class summary">
              <span>Primary</span>
              <strong>STR</strong>
              <small>Secondary · DEX</small>
            </div>
          </section>

          {toast && (
            <div className={`notice notice--${toast.tone}`} role="status">
              <span>{toast.tone === 'success' ? '✓' : toast.tone === 'warning' ? '!' : 'i'}</span>
              <p>{toast.message}</p>
              <button type="button" aria-label="Dismiss message" onClick={() => setToast(null)}>×</button>
            </div>
          )}

          {errorCount > 0 && (
            <div className="validation-summary" role="alert">
              <strong>{errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} attention</strong>
              <span>Correct the highlighted values before saving or running a simulation.</span>
            </div>
          )}

          <SectionCard eyebrow="01 · Identity" title="Character profile" description="Name this reusable snapshot and record the character level.">
            <div className={`field ${errors['identity.profileName'] ? 'field--error' : ''}`}>
              <label htmlFor="profile-name">Profile name</label>
              <div className="input-shell">
                <input
                  id="profile-name"
                  type="text"
                  value={character.identity.profileName}
                  maxLength={80}
                  aria-invalid={Boolean(errors['identity.profileName'])}
                  onChange={(event) => updateField('identity.profileName', event.target.value)}
                />
              </div>
              {errors['identity.profileName'] && <span className="field-message field-message--error">{errors['identity.profileName']}</span>}
            </div>
            <div className={`field ${errors['identity.characterName'] ? 'field--error' : ''}`}>
              <label htmlFor="character-name">Character name</label>
              <div className="input-shell">
                <input
                  id="character-name"
                  type="text"
                  value={character.identity.characterName}
                  maxLength={40}
                  aria-invalid={Boolean(errors['identity.characterName'])}
                  onChange={(event) => updateField('identity.characterName', event.target.value)}
                />
              </div>
              {errors['identity.characterName'] && <span className="field-message field-message--error">{errors['identity.characterName']}</span>}
            </div>
            <NumberField
              id="identity-level"
              label="Level"
              value={character.identity.level}
              onChange={(value) => updateField('identity.level', value)}
              error={errors['identity.level']}
              min={1}
              max={300}
            />
            <div className="field field--wide">
              <label htmlFor="profile-notes">Notes</label>
              <div className="input-shell input-shell--textarea">
                <textarea
                  id="profile-notes"
                  value={character.identity.notes}
                  maxLength={500}
                  placeholder="Boss setup, event buffs, equipment preset…"
                  onChange={(event) => updateField('identity.notes', event.target.value)}
                />
              </div>
              <span className="field-message">{character.identity.notes.length}/500 characters</span>
            </div>
          </SectionCard>

          <SectionCard eyebrow="02 · Core" title="Base stats" description="Enter the unrounded totals shown in the in-game stat window.">
            {renderNumberFields(baseFields)}
          </SectionCard>

          <SectionCard eyebrow="03 · Multipliers" title="Percent stats" description="Keep additive percent sources separate from flat totals.">
            {renderNumberFields(percentFields)}
          </SectionCard>

          <SectionCard eyebrow="04 · Combat" title="Offensive stats" description="Bossing modifiers and combat caps used by future formulas.">
            {renderNumberFields(offenseFields)}
          </SectionCard>

          <SectionCard eyebrow="05 · Encounter" title="Target and force" description="Describe the enemy and force thresholds for this scenario.">
            {renderNumberFields(targetFields)}
          </SectionCard>

          <SectionCard eyebrow="06 · Progression" title="Sixth job and account" description="Levels are stored explicitly so future formulas can be version-aware.">
            {renderNumberFields(enhancementFields)}
          </SectionCard>

          <SectionCard eyebrow="07 · Scenario" title="Buff and skill assumptions" description="Toggle situational inputs without rewriting the core profile.">
            <div className="toggle-grid">
              {scenarioFields.map((field) => {
                const key = field.path.split('.')[1] as keyof CharacterDataV1['scenario'];
                return (
                  <ToggleField
                    key={field.path}
                    id={field.path.replace('.', '-')}
                    label={field.label}
                    description={field.description}
                    checked={character.scenario[key]}
                    onChange={(checked) => updateToggle(field.path, checked)}
                  />
                );
              })}
            </div>
          </SectionCard>

          <section className="simulation-card">
            <div>
              <span className="eyebrow">Ready for phase two</span>
              <h2>Run damage simulation</h2>
              <p>The action validates the complete profile. Its calculation hook is intentionally left as a placeholder.</p>
            </div>
            <button className="button button--simulate" type="button" onClick={runSimulation}>
              Run Simulation <span>→</span>
            </button>
          </section>

          <footer className="footer">
            <span>Shade Lab v1.0.0</span>
            <span>Local-first · No account required</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
