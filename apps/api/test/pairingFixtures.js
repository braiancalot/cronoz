import { formatDeviceCredential } from "@cronoz/shared";
import app from "../src/app.js";

export const DEVICE_A = "11111111-1111-1111-1111-111111111111";
export const DEVICE_B = "22222222-2222-2222-2222-222222222222";
export const DEVICE_C = "33333333-3333-3333-3333-333333333333";
export const DEVICE_D = "44444444-4444-4444-4444-444444444444";

export const SECRET_A = "a".repeat(64);
export const SECRET_B = "b".repeat(64);
export const SECRET_C = "c".repeat(64);

export const CREDENTIAL_A = credentialOf(DEVICE_A, SECRET_A);
export const CREDENTIAL_B = credentialOf(DEVICE_B, SECRET_B);
export const CREDENTIAL_C = credentialOf(DEVICE_C, SECRET_C);

export function credentialOf(deviceId, secret) {
  return formatDeviceCredential({ deviceId, secret });
}

export function post(path, body, token) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function initiate(deviceId) {
  const res = await post("/api/pair/initiate", { deviceId });
  const body = await res.json();
  return body.code;
}

export async function pair(deviceA, deviceB) {
  const code = await initiate(deviceA);
  const res = await post("/api/pair/join", { deviceId: deviceB, code });
  const body = await res.json();
  return { token: body.token, syncGroupId: body.syncGroupId };
}

export async function tokenFor(deviceId) {
  const res = await post("/api/pair/token", { deviceId });
  const body = await res.json();
  return body.token;
}

export async function initiateWith(credential) {
  const res = await post("/api/pair/initiate", {}, credential);
  const body = await res.json();
  return body.code;
}

export async function pairWith(hostCredential, joinerCredential) {
  const code = await initiateWith(hostCredential);
  const res = await post("/api/pair/join", { code }, joinerCredential);
  const body = await res.json();
  return body.syncGroupId;
}
