import {
  DEVICE_ID_KEY,
  DEVICE_SECRET_KEY,
  formatDeviceCredential,
  generateDeviceSecret,
} from "@cronoz/shared";
import internalRepository from "./internalRepository.js";

function getOrCreateDeviceId() {
  return internalRepository.getOrCreate(DEVICE_ID_KEY, () =>
    crypto.randomUUID(),
  );
}

// The server keeps the first secret it sees for this device and refuses any
// other, so the stored one MUST never be replaced.
function getOrCreateDeviceSecret() {
  return internalRepository.getOrCreate(DEVICE_SECRET_KEY, () =>
    generateDeviceSecret(),
  );
}

async function getDeviceCredential() {
  const deviceId = await getOrCreateDeviceId();
  const secret = await getOrCreateDeviceSecret();
  return formatDeviceCredential({ deviceId, secret });
}

export default {
  getOrCreateDeviceId,
  getDeviceCredential,
};
