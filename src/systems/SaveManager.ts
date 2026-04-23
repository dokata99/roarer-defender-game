import { defaultSave, type SaveData } from '../types/save';

const STORAGE_KEY = 'roarerDefense.save.v1';

/**
 * Loads the save blob from localStorage, filling in any missing fields with defaults.
 * On malformed data or unavailable storage, returns a fresh default save.
 */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return mergeWithDefaults(parsed);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (private mode, quota). Silently no-op —
    // the run still completes, it just doesn't persist.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

function mergeWithDefaults(parsed: unknown): SaveData {
  const base = defaultSave();
  if (!parsed || typeof parsed !== 'object') return base;
  const p = parsed as Partial<SaveData>;

  return {
    roarerPoints: typeof p.roarerPoints === 'number' ? p.roarerPoints : base.roarerPoints,
    endlessModeUnlocked:
      typeof p.endlessModeUnlocked === 'boolean' ? p.endlessModeUnlocked : base.endlessModeUnlocked,
    shopUpgrades: { ...base.shopUpgrades, ...(p.shopUpgrades ?? {}) },
    stats: { ...base.stats, ...(p.stats ?? {}) },
  };
}
