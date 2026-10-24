const LOCAL_MODEL = { langs: ["pt-BR"], processLocally: true };

export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

async function getLocalAvailability(Recognition) {
  if (!Recognition.available) return "unavailable";
  try {
    return await Recognition.available(LOCAL_MODEL);
  } catch {
    return "unavailable";
  }
}

export async function hasLocalModel(Recognition) {
  return (await getLocalAvailability(Recognition)) === "available";
}

export async function installLocalModel(Recognition) {
  const availability = await getLocalAvailability(Recognition);
  if (availability === "available") return true;
  if (availability === "unavailable" || !Recognition.install) return false;
  try {
    return await Recognition.install(LOCAL_MODEL);
  } catch {
    return false;
  }
}
