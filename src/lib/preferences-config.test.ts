import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from "@/lib/preferences-config";

describe("sanitizePreferences", () => {
  it("yalnızca gönderilen anahtarları döner", () => {
    assert.deepEqual(sanitizePreferences({ homeView: "cycles" }), { homeView: "cycles" });
    assert.deepEqual(sanitizePreferences({}), {});
  });

  it("geçersiz değeri varsayılana düşürür", () => {
    const input = { homeView: "hacked", dateFormat: "verbose" } as unknown as Partial<Preferences>;
    assert.deepEqual(sanitizePreferences(input), {
      homeView: DEFAULT_PREFERENCES.homeView,
      dateFormat: DEFAULT_PREFERENCES.dateFormat,
    });
  });

  it("bilinmeyen anahtarı yok sayar", () => {
    const input = { nope: "1", autoAssignToMe: true } as unknown as Partial<Preferences>;
    assert.deepEqual(sanitizePreferences(input), { autoAssignToMe: "true" });
  });
});
