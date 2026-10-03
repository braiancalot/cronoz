export const DEVICE_ID_KEY = "deviceId";
export const SYNC_TOKEN_KEY = "syncToken";
export const SYNC_CURSOR_KEY = "syncCursor";
export const LAST_PUSHED_AT_KEY = "lastPushedAt";
export const LAST_SYNCED_AT_KEY = "lastSyncedAt";

export const PAIRING_CODE_LENGTH = 8;
// No 0/O, 1/I/L or U: codes are read aloud and typed by hand.
export const PAIRING_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const PAIRING_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Sync payload limits. The API rejects anything above them, so the client
// MUST enforce the same numbers or a record gets stuck failing every push.
export const MAX_PROJECT_NAME_LENGTH = 100;
export const MAX_LAP_NAME_LENGTH = 100;
export const MAX_LAPS_PER_PROJECT = 5000;
export const MAX_TAG_LENGTH = 24;
export const MAX_TAGS_PER_PROJECT = 20;
export const MAX_SETTING_KEY_LENGTH = 64;
export const MAX_PUSH_PROJECTS = 500;
export const MAX_PUSH_SETTINGS = 50;
