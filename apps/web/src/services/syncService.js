const API_URL = import.meta.env.VITE_API_URL;

export class SyncError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "SyncError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "POST", body, token } = {}) {
  if (!API_URL) {
    throw new SyncError("VITE_API_URL is not configured");
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

async function pairInitiate({ deviceId }) {
  return request("/api/pair/initiate", { body: { deviceId } });
}

async function pairJoin({ deviceId, code }) {
  return request("/api/pair/join", { body: { deviceId, code } });
}

async function refreshToken({ deviceId }) {
  return request("/api/pair/token", { body: { deviceId } });
}

async function push({ token, projects, settings }) {
  return request("/api/sync/push", { token, body: { projects, settings } });
}

async function pull({ token, cursor }) {
  return request("/api/sync/pull", { token, body: { cursor } });
}

async function getDeviceCount({ token }) {
  return request("/api/sync/devices", { method: "GET", token });
}

async function leaveGroup({ token }) {
  return request("/api/sync/device", { method: "DELETE", token });
}

const syncService = {
  pairInitiate,
  pairJoin,
  refreshToken,
  push,
  pull,
  getDeviceCount,
  leaveGroup,
};
export default syncService;
