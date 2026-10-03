import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  LAST_SYNCED_AT_KEY,
  PENDING_PAIRING_KEY,
  SYNC_REVOKED_KEY,
  SYNC_PAIRED_KEY,
} from "@cronoz/shared";

import db from "@/services/db.js";
import internalRepository from "@/services/internalRepository.js";
import {
  SyncStatusProvider,
  useSyncData,
} from "@/providers/SyncStatusProvider.jsx";

function Probe() {
  const { isPaired, lastSyncedAt, wasRevoked, pendingPairing } = useSyncData();
  return (
    <div>
      <span data-testid="revoked">{String(wasRevoked)}</span>
      <span data-testid="pending">{pendingPairing?.code ?? "none"}</span>
      <span data-testid="paired">{String(isPaired)}</span>
      <span data-testid="last-sync">{String(lastSyncedAt)}</span>
    </div>
  );
}

describe("SyncStatusProvider", () => {
  beforeEach(async () => {
    await db.internal.clear();
  });

  it("resolves not-paired once the paired query settles", async () => {
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
    await internalRepository.set(SYNC_PAIRED_KEY, true);
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

  it("provides the revoked notice and the pending pairing", async () => {
    await internalRepository.set(SYNC_REVOKED_KEY, true);
    await internalRepository.set(PENDING_PAIRING_KEY, {
      code: "ABCD2345",
      expiresAt: 1_000,
    });

    render(
      <SyncStatusProvider>
        <Probe />
      </SyncStatusProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("revoked")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("pending")).toHaveTextContent("ABCD2345");
  });

  it("consumers without a provider fall back to defaults", () => {
    render(<Probe />);

    expect(screen.getByTestId("paired")).toHaveTextContent("false");
    expect(screen.getByTestId("last-sync")).toHaveTextContent("null");
    expect(screen.getByTestId("revoked")).toHaveTextContent("false");
    expect(screen.getByTestId("pending")).toHaveTextContent("none");
  });
});
