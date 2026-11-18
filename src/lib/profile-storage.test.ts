import { describe, expect, it } from "vitest";
import {
  clearSavedProfile,
  LEGACY_STORAGE_KEY,
  migrateLegacyProfile,
  STORAGE_KEY,
} from "./profile-storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("profile storage", () => {
  it("uses the MigrateLens key and knows the legacy one", () => {
    expect(STORAGE_KEY).toBe("migratelens-profile-v1");
    expect(LEGACY_STORAGE_KEY).toBe("landfall-profile-v1");
  });

  it("moves the old value when the new key is absent", () => {
    const s = fakeStorage({ [LEGACY_STORAGE_KEY]: "old" });
    migrateLegacyProfile(s);
    expect(s.data.get(STORAGE_KEY)).toBe("old");
    expect(s.data.has(LEGACY_STORAGE_KEY)).toBe(false);
  });

  it("keeps the new value and still deletes the old one", () => {
    const s = fakeStorage({
      [LEGACY_STORAGE_KEY]: "old",
      [STORAGE_KEY]: "new",
    });
    migrateLegacyProfile(s);
    expect(s.data.get(STORAGE_KEY)).toBe("new");
    expect(s.data.has(LEGACY_STORAGE_KEY)).toBe(false);
  });

  it("clear removes both keys", () => {
    const s = fakeStorage({
      [LEGACY_STORAGE_KEY]: "old",
      [STORAGE_KEY]: "new",
    });
    clearSavedProfile(s);
    expect(s.data.size).toBe(0);
  });

  it("does not crash when storage throws", () => {
    expect(() => migrateLegacyProfile(throwing)).not.toThrow();
    expect(() => clearSavedProfile(throwing)).not.toThrow();
  });
});
