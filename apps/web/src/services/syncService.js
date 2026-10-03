const API_URL = import.meta.env.VITE_API_URL;

export class SyncError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "SyncError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "POST", body, credential } = {}) {
  if (!API_URL) {
    throw new SyncError("VITE_API_URL is not configured");
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new SyncError("network_error", { body: err.message });
  }

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    throw new SyncError(`http_${response.status}`, {
      status: response.status,
      body: parsed,
    });
  }

  return parsed;
}

async function pairInitiate({ credential }) {
  return request("/api/pair/initiate", { credential, body: {} });
}

async function pairJoin({ credential, code }) {
  return request("/api/pair/join", { credential, body: { code } });
}

async function pairStatus({ credential, code }) {
  return request("/api/pair/status", { credential, body: { code } });
}

async function push({ credential, projects, settings }) {
  return request("/api/sync/push", {
    credential,
    body: { projects, settings },
  });
}

async function pull({ credential, cursor }) {
  return request("/api/sync/pull", { credential, body: { cursor } });
}

async function getDeviceCount({ credential }) {
  return request("/api/sync/devices", { method: "GET", credential });
}

async function leaveGroup({ credential }) {
  return request("/api/sync/device", { method: "DELETE", credential });
}

const syncService = {
  pairInitiate,
  pairJoin,
  pairStatus,
  push,
  pull,
  getDeviceCount,
  leaveGroup,
};
export default syncService;
