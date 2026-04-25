export function isIncomingNewer(incoming, existing) {
  if (!existing) return true;
  const incomingAt = incoming?.updatedAt ?? 0;
  const existingAt = existing?.updatedAt ?? 0;
  return incomingAt > existingAt;
}

export function pickLatestProject(incoming, existing) {
  return isIncomingNewer(incoming, existing) ? incoming : existing;
}

export function pickLatestSetting(incoming, existing) {
  return isIncomingNewer(incoming, existing) ? incoming : existing;
}
