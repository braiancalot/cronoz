import { DEVICE_ID_KEY } from "@cronoz/shared";
import internalRepository from "./internalRepository.js";

async function getOrCreateDeviceId() {
  const existing = await internalRepository.get(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  await internalRepository.set(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export default {
  getOrCreateDeviceId,
};
