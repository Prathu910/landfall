import { expect, it } from "vitest";
import { persistCheckProfile, STORAGE_KEY } from "../profile-storage";
it("never replaces an existing real save with sample answers, even if saving was enabled", () => {
  const values = new Map([[STORAGE_KEY, JSON.stringify({ name: "real" })]]);
  const storage = {
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  persistCheckProfile(storage, { name: "sample" }, true, true);
  expect(values.get(STORAGE_KEY)).toBe(JSON.stringify({ name: "real" }));
  values.clear();
  persistCheckProfile(storage, { name: "sample" }, true, true);
  expect(values.has(STORAGE_KEY)).toBe(false);
  persistCheckProfile(storage, { name: "personal" }, true, false);
  expect(values.get(STORAGE_KEY)).toBe(JSON.stringify({ name: "personal" }));
});
