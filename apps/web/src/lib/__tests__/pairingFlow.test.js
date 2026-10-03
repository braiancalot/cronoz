import { describe, expect, it } from "vitest";
import {
  INITIAL_PAIRING_FLOW,
  initPairingFlow,
  pairingFlowReducer,
} from "@/lib/pairingFlow.js";

const ISSUED = { code: "ABCD2345", expiresAt: 1_000 };

function hosting() {
  return pairingFlowReducer(INITIAL_PAIRING_FLOW, {
    type: "code_issued",
    ...ISSUED,
  });
}

describe("initPairingFlow", () => {
  it("starts idle without a pending pairing", () => {
    expect(initPairingFlow(null)).toEqual(INITIAL_PAIRING_FLOW);
  });

  it("resumes the code screen from a pending pairing", () => {
    expect(initPairingFlow(ISSUED)).toMatchObject({
      screen: "hosting",
      hostState: "waiting",
      ...ISSUED,
    });
  });
});

describe("pairingFlowReducer: generating a code", () => {
  it("marks the flow busy and drops the previous error", () => {
    const failed = { ...INITIAL_PAIRING_FLOW, error: "network_error" };

    const flow = pairingFlowReducer(failed, { type: "generate_started" });

    expect(flow).toMatchObject({ busy: true, error: null });
  });

  it("shows the issued code and waits for the other device", () => {
    expect(hosting()).toMatchObject({
      screen: "hosting",
      hostState: "waiting",
      busy: false,
      ...ISSUED,
    });
  });

  it("keeps the screen and reports the error when it fails", () => {
    const expired = { ...hosting(), hostState: "expired", busy: true };

    const flow = pairingFlowReducer(expired, {
      type: "generate_failed",
      error: "too_many_new_groups",
    });

    expect(flow).toMatchObject({
      screen: "hosting",
      hostState: "expired",
      busy: false,
      error: "too_many_new_groups",
    });
  });
});

describe("pairingFlowReducer: host status", () => {
  it.each(["expired", "burned"])("moves a waiting code to %s", (status) => {
    const flow = pairingFlowReducer(hosting(), {
      type: "host_status",
      code: ISSUED.code,
      status,
    });

    expect(flow.hostState).toBe(status);
  });

  it("returns the same object when nothing changed", () => {
    const waiting = hosting();

    const flow = pairingFlowReducer(waiting, {
      type: "host_status",
      code: ISSUED.code,
      status: "waiting",
    });

    expect(flow).toBe(waiting);
  });

  it("ignores the answer for a code that was replaced", () => {
    const waiting = hosting();

    const flow = pairingFlowReducer(waiting, {
      type: "host_status",
      code: "ZZZZ9999",
      status: "expired",
    });

    expect(flow).toBe(waiting);
  });

  it("ignores an answer that arrives after cancelling", () => {
    const flow = pairingFlowReducer(INITIAL_PAIRING_FLOW, {
      type: "host_status",
      code: ISSUED.code,
      status: "expired",
    });

    expect(flow).toBe(INITIAL_PAIRING_FLOW);
  });
});

describe("pairingFlowReducer: joining", () => {
  const joining = pairingFlowReducer(INITIAL_PAIRING_FLOW, {
    type: "join_opened",
  });

  it("opens the join screen", () => {
    expect(joining).toMatchObject({ screen: "joining", error: null });
  });

  it("reports a failed join without leaving the screen", () => {
    const started = pairingFlowReducer(joining, { type: "join_started" });

    const flow = pairingFlowReducer(started, {
      type: "join_failed",
      error: "invalid_or_expired_code",
    });

    expect(flow).toMatchObject({
      screen: "joining",
      busy: false,
      error: "invalid_or_expired_code",
    });
  });

  it("clears the error", () => {
    const failed = { ...joining, error: "invalid_or_expired_code" };

    const flow = pairingFlowReducer(failed, { type: "error_cleared" });

    expect(flow.error).toBeNull();
  });
});

describe("pairingFlowReducer", () => {
  it("resets to the initial flow", () => {
    expect(pairingFlowReducer(hosting(), { type: "reset" })).toBe(
      INITIAL_PAIRING_FLOW,
    );
  });

  it("rejects an unknown action and names it", () => {
    expect(() => pairingFlowReducer(hosting(), { type: "confirm" })).toThrow(
      /Unknown pairing flow action "confirm"/,
    );
  });
});
