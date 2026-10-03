import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncStatusLine } from "@/components/sync/syncStatusLine.js";

const NOW = new Date("2026-01-01T12:00:00Z").getTime();
const IDLE = {
  syncing: false,
  isOnline: true,
  error: null,
  lastSyncedAt: NOW - 120_000,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("syncStatusLine", () => {
  it("reports when the last sync happened", () => {
    expect(syncStatusLine(IDLE)).toEqual({
      text: "Sincronizado · há 2min",
      isError: false,
    });
  });

  it("reports a device that never synced", () => {
    const line = syncStatusLine({ ...IDLE, lastSyncedAt: null });

    expect(line.text).toBe("Ainda não sincronizado");
  });

  it("puts a running sync ahead of everything else", () => {
    const line = syncStatusLine({
      ...IDLE,
      syncing: true,
      isOnline: false,
      error: "http_500",
    });

    expect(line).toEqual({ text: "Sincronizando…", isError: false });
  });

  it("explains offline as a wait, not as a failure", () => {
    const line = syncStatusLine({
      ...IDLE,
      isOnline: false,
      error: "network_error",
    });

    expect(line).toEqual({
      text: "Sem conexão. Sincroniza quando a internet voltar.",
      isError: false,
    });
  });

  it("names the reason of a failed sync", () => {
    expect(syncStatusLine({ ...IDLE, error: "http_500" })).toEqual({
      text: "Falha ao sincronizar: servidor indisponível.",
      isError: true,
    });
  });

  it("falls back to a bare failure for an unmapped error", () => {
    const line = syncStatusLine({ ...IDLE, error: "http_418" });

    expect(line.text).toBe("Falha ao sincronizar.");
  });
});
