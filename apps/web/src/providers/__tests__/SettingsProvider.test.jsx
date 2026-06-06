import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import db from "@/services/db.js";
import settingsRepository from "@/services/settingsRepository.js";
import {
  SettingsProvider,
  useSettings,
  useHourlyPrice,
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
});
