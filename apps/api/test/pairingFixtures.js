import { formatDeviceCredential } from "@cronoz/shared";
import app from "../src/app.js";

export const DEVICE_A = "11111111-1111-1111-1111-111111111111";
export const DEVICE_B = "22222222-2222-2222-2222-222222222222";
export const DEVICE_C = "33333333-3333-3333-3333-333333333333";
export const DEVICE_D = "44444444-4444-4444-4444-444444444444";

export const SECRET_A = "a".repeat(64);
export const SECRET_B = "b".repeat(64);
export const SECRET_C = "c".repeat(64);

const OWN_SECRETS = {
  [DEVICE_A]: SECRET_A,
  [DEVICE_B]: SECRET_B,
  [DEVICE_C]: SECRET_C,
  [DEVICE_D]: "d".repeat(64),
};

// Pass a secret to forge the credential of a device that registered another.
export function credentialOf(deviceId, secret = OWN_SECRETS[deviceId]) {
  return formatDeviceCredential({ deviceId, secret });
}

export const CREDENTIAL_A = credentialOf(DEVICE_A);
export const CREDENTIAL_B = credentialOf(DEVICE_B);
export const CREDENTIAL_C = credentialOf(DEVICE_C);

// Shaped like the bearer that clients sent before device secrets.
export const LEGACY_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJkZXZpY2VJZCI6IjExMTEifQ.c2lnbmF0dXJl";

export function post(path, body, credential) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function initiateWith(credential) {
  const res = await post("/api/pair/initiate", {}, credential);
  const body = await res.json();
  return body.code;
}

export function initiate(deviceId) {
  return initiateWith(credentialOf(deviceId));
}

export function join(deviceId, code) {
  return post("/api/pair/join", { code }, credentialOf(deviceId));
}

export async function pairWith(hostCredential, joinerCredential) {
  const code = await initiateWith(hostCredential);
  const res = await post("/api/pair/join", { code }, joinerCredential);
  const body = await res.json();
  return body.syncGroupId;
}

export async function pair(hostId, joinerId) {
  const credential = credentialOf(joinerId);
  const syncGroupId = await pairWith(credentialOf(hostId), credential);
  return { credential, syncGroupId };
}
