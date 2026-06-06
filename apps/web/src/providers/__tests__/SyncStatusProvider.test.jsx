import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LAST_SYNCED_AT_KEY, SYNC_TOKEN_KEY } from "@cronoz/shared";

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import {
  SyncStatusProvider,
  useSyncData,
} from "@/providers/SyncStatusProvider.jsx";

function Probe() {
  const { isPaired, lastSyncedAt } = useSyncData();
  return (
    <div>
      <span data-testid="paired">{String(isPaired)}</span>
      <span data-testid="last-sync">{String(lastSyncedAt)}</span>
    </div>
  );
}

describe("SyncStatusProvider", () => {
  beforeEach(async () => {
    await db.internal.clear();
  });

  it("resolves not-paired once the token query settles", async () => {
    render(
      <SyncStatusProvider>
        <Probe />
      </SyncStatusProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("paired")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("last-sync")).toHaveTextContent("null");
  });

  it("provides paired status and lastSyncedAt from internal storage", async () => {
    await internalRepository.set(SYNC_TOKEN_KEY, "tok");
    await internalRepository.set(LAST_SYNCED_AT_KEY, 12345);

    render(
      <SyncStatusProvider>
        <Probe />
      </SyncStatusProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("paired")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("last-sync")).toHaveTextContent("12345");
  });

  it("consumers without a provider fall back to defaults", () => {
    render(<Probe />);

    expect(screen.getByTestId("paired")).toHaveTextContent("false");
    expect(screen.getByTestId("last-sync")).toHaveTextContent("null");
  });
});
