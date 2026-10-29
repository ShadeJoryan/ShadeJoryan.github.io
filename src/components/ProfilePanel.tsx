import type { SavedShadeProfile } from '../types';

type ProfilePanelProps = {
  profiles: SavedShadeProfile[];
  selectedId: string | null;
  activeId: string | null;
  onSelect: (id: string) => void;
  onLoad: () => void;
  onDelete: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onImport: () => void;
  onExportProfile: () => void;
  onExportLibrary: () => void;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

export function ProfilePanel({
  profiles,
  selectedId,
  activeId,
  onSelect,
  onLoad,
  onDelete,
  onSave,
  onSaveAs,
  onImport,
  onExportProfile,
  onExportLibrary,
}: ProfilePanelProps) {
  const selected = profiles.find((profile) => profile.id === selectedId);

  return (
    <aside className="profile-panel">
      <div className="profile-panel__heading">
        <span className="eyebrow">Local library</span>
        <h2>Shade profiles</h2>
        <p>Saved only in this browser unless you export a JSON backup.</p>
      </div>

      <div className="profile-list" role="list" aria-label="Saved Shade profiles">
        {profiles.length === 0 ? (
          <div className="empty-state">
            <span>◇</span>
            <strong>No saved profiles</strong>
            <p>Complete the form and save your first setup.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <button
              className={`profile-item ${selectedId === profile.id ? 'profile-item--selected' : ''}`}
              type="button"
              role="listitem"
              key={profile.id}
              onClick={() => onSelect(profile.id)}
            >
              <span>
                <strong>{profile.name}</strong>
                <small>
                  {profile.character.identity.characterName || 'Unnamed character'} · Lv. {profile.character.identity.level}
                </small>
              </span>
              {activeId === profile.id && <span className="active-dot" title="Currently loaded" />}
            </button>
          ))
        )}
      </div>

      {selected && <p className="profile-updated">Updated {formatDate(selected.updatedAt)}</p>}

      <div className="button-row button-row--two">
        <button className="button button--secondary" type="button" onClick={onLoad} disabled={!selected}>
          Load
        </button>
        <button className="button button--danger" type="button" onClick={onDelete} disabled={!selected}>
          Delete
        </button>
      </div>
      <div className="button-stack">
        <button className="button button--primary" type="button" onClick={onSave}>
          Save profile
        </button>
        <button className="button button--secondary" type="button" onClick={onSaveAs}>
          Save as new
        </button>
      </div>

      <div className="panel-divider" />

      <div className="button-stack">
        <button className="button button--ghost" type="button" onClick={onImport}>
          Import JSON
        </button>
        <button className="button button--ghost" type="button" onClick={onExportProfile}>
          Export current profile
        </button>
        <button className="button button--ghost" type="button" onClick={onExportLibrary} disabled={profiles.length === 0}>
          Export profile library
        </button>
      </div>
    </aside>
  );
}
