import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import db from "@/services/db.js";
import settingsRepository from "@/services/settingsRepository.js";
import {
  SettingsProvider,
  useSettings,
  useHourlyPrice,
  useSetSetting,
} from "@/providers/SettingsProvider.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";

function Probe() {
  const { hourlyPrice } = useSettings();
  const price = useHourlyPrice();
  const ignoreMs = useIgnoreMilliseconds();
  return (
    <div>
      <span data-testid="price">{price}</span>
      <span data-testid="price-from-settings">{hourlyPrice}</span>
      <span data-testid="ignore-ms">{String(ignoreMs)}</span>
    </div>
  );
}

// Resolves once settings loaded, with the setter the provider hands out.
async function renderWithWriter() {
  let setSetting;
  function Writer() {
    setSetting = useSetSetting();
    return null;
  }
  render(
    <SettingsProvider>
      <Probe />
      <Writer />
    </SettingsProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("price")).toBeVisible());
  return (key, value) => setSetting(key, value);
}

describe("SettingsProvider", () => {
  beforeEach(async () => {
    await db.settings.clear();
  });

  it("gates children until settings load, then provides resolved values", async () => {
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    // Once loaded, defaults are exposed (nothing stored).
    await waitFor(() =>
      expect(screen.getByTestId("price")).toHaveTextContent("10"),
    );
    expect(screen.getByTestId("price-from-settings")).toHaveTextContent("10");
    expect(screen.getByTestId("ignore-ms")).toHaveTextContent("false");
  });

  it("provides stored values once persisted", async () => {
    await settingsRepository.set("hourlyPrice", 42);
    await settingsRepository.set("ignoreMilliseconds", true);

    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("price")).toHaveTextContent("42"),
    );
    expect(screen.getByTestId("ignore-ms")).toHaveTextContent("true");
  });

  it("consumers without a provider fall back to defaults", () => {
    render(<Probe />);

    expect(screen.getByTestId("price")).toHaveTextContent("10");
    expect(screen.getByTestId("ignore-ms")).toHaveTextContent("false");
  });

  it("shows a written setting before the live query re-emits", async () => {
    const setSetting = await renderWithWriter();

    // Synchronous act: Dexie cannot have re-emitted yet.
    act(() => {
      setSetting("ignoreMilliseconds", true);
    });
    expect(screen.getByTestId("ignore-ms")).toHaveTextContent("true");
  });

  it("lets a newer stored value win over the pending one", async () => {
    const setSetting = await renderWithWriter();

    await act(() => setSetting("hourlyPrice", 20));
    await act(() => settingsRepository.set("hourlyPrice", 30));

    await waitFor(() =>
      expect(screen.getByTestId("price")).toHaveTextContent("30"),
    );
  });
});
