export const INITIAL_PAIRING_FLOW = {
  screen: "idle",
  code: null,
  expiresAt: null,
  hostState: null,
  busy: false,
  error: null,
};

function hostingFlow({ code, expiresAt }) {
  return {
    ...INITIAL_PAIRING_FLOW,
    screen: "hosting",
    code,
    expiresAt,
    hostState: "waiting",
  };
}

export function initPairingFlow(pendingPairing) {
  return pendingPairing ? hostingFlow(pendingPairing) : INITIAL_PAIRING_FLOW;
}

// A poll answered after the user cancelled or generated another code MUST NOT
// touch the screen that replaced it.
function applyHostStatus(flow, { code, status }) {
  const isStale = flow.screen !== "hosting" || flow.code !== code;
  if (isStale || flow.hostState === status) return flow;
  return { ...flow, hostState: status };
}

const TRANSITIONS = {
  generate_started: (flow) => ({ ...flow, busy: true, error: null }),
  generate_failed: (flow, { error }) => ({ ...flow, busy: false, error }),
  code_issued: (_flow, issued) => hostingFlow(issued),
  host_status: applyHostStatus,
  join_opened: () => ({ ...INITIAL_PAIRING_FLOW, screen: "joining" }),
  join_started: (flow) => ({ ...flow, busy: true, error: null }),
  join_failed: (flow, { error }) => ({ ...flow, busy: false, error }),
  error_cleared: (flow) => (flow.error ? { ...flow, error: null } : flow),
  reset: () => INITIAL_PAIRING_FLOW,
};

export function pairingFlowReducer(flow, action) {
  const transition = TRANSITIONS[action.type];
  if (!transition) {
    const known = Object.keys(TRANSITIONS).join(", ");
    throw new Error(
      `Unknown pairing flow action "${action.type}", expected one of: ${known}`,
    );
  }
  return transition(flow, action);
}
