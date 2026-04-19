import { DEVICE_ID_KEY } from "@cronoz/shared";
import settingsRepository from "./settingsRepository.js";

async function getOrCreateDeviceId() {
  const existing = await settingsRepository.get(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  await settingsRepository.set(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export default {
  getOrCreateDeviceId,
};
