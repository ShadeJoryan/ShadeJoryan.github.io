import type { ShadeProfileLibraryV1 } from './types';

const STORAGE_KEY = 'shade-lab.profile-library.v1';

export const loadLibrary = (): ShadeProfileLibraryV1 => {
  const empty: ShadeProfileLibraryV1 = {
    kind: 'shade-profile-library',
    schemaVersion: 1,
    profiles: [],
  };

  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return empty;
    const parsed = JSON.parse(value) as Partial<ShadeProfileLibraryV1>;
    if (
      parsed.kind !== 'shade-profile-library' ||
      parsed.schemaVersion !== 1 ||
      !Array.isArray(parsed.profiles)
    ) {
      return empty;
    }
    return { ...empty, profiles: parsed.profiles };
  } catch {
    return empty;
  }
};

export const saveLibrary = (library: ShadeProfileLibraryV1): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
};
