export const STORAGE_KEY = "migratelens-profile-v1";
// The product's earlier working name. Kept only so old saves can be moved or cleared.
export const LEGACY_STORAGE_KEY = "landfall-profile-v1";

type ProfileStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Moves a profile saved under the old key, never overwriting a newer save. */
export function migrateLegacyProfile(storage: ProfileStorage): void {
  try {
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    if (storage.getItem(STORAGE_KEY) === null)
      storage.setItem(STORAGE_KEY, legacy);
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* A blocked store never prevents the free check. */
  }
}

/** Removes the saved profile under both the current and the old key. */
export function clearSavedProfile(storage: ProfileStorage): void {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      storage.removeItem(key);
    } catch {
      /* Optional local saving may be unavailable. */
    }
  }
}
