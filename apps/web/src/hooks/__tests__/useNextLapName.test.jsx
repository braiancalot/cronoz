import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import db from "@/services/db.js";
import settingsRepository from "@/services/settingsRepository.js";
import { SettingsProvider } from "@/providers/SettingsProvider.jsx";
import { useNextLapName } from "@/hooks/useNextLapName.js";

async function renderNextLapName() {
  const { result } = renderHook(() => useNextLapName(), {
    wrapper: SettingsProvider,
  });
  await waitFor(() => expect(result.current).toBeTypeOf("function"));
  return result.current;
}

describe("useNextLapName", () => {
  beforeEach(async () => {
    await db.settings.clear();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 4, 1, 9, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the numbered name by default", async () => {
    const nextLapName = await renderNextLapName();
    expect(nextLapName(2)).toBe("2º ");
  });

  it("renders the stored template with the current date", async () => {
    await settingsRepository.set("lapNameTemplate", "{dia}/{mes}");
    const nextLapName = await renderNextLapName();
    expect(nextLapName(2)).toBe("01/05");
  });
});
