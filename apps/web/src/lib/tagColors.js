import { tagKey } from "@/lib/tags.js";

// Neighboring slots alternate hue families. The primary teal range (170–200)
// stays empty so a tag never reads as the live-device indicator.
export const TAG_PALETTE = [
  { label: "Violeta", color: "oklch(0.78 0.14 280)" },
  { label: "Laranja", color: "oklch(0.80 0.14 45)" },
  { label: "Azul", color: "oklch(0.76 0.13 240)" },
  { label: "Verde", color: "oklch(0.76 0.13 145)" },
  { label: "Magenta", color: "oklch(0.78 0.14 325)" },
  { label: "Âmbar", color: "oklch(0.82 0.13 75)" },
  { label: "Céu", color: "oklch(0.82 0.11 220)" },
  { label: "Coral", color: "oklch(0.78 0.14 20)" },
  { label: "Lima", color: "oklch(0.81 0.13 120)" },
  { label: "Índigo", color: "oklch(0.72 0.14 260)" },
  { label: "Rosa", color: "oklch(0.81 0.12 345)" },
  { label: "Oliva", color: "oklch(0.76 0.11 95)" },
  { label: "Roxo", color: "oklch(0.76 0.15 305)" },
  { label: "Vermelho", color: "oklch(0.75 0.14 5)" },
];

function tagHash(name) {
  const key = tagKey(name);
  let hash = 1779033703 ^ key.length;

  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^ (hash >>> 16)) >>> 0;
}

export function tagPaletteIndex(name) {
  return tagHash(name) % TAG_PALETTE.length;
}

export function tagPaletteEntry(name) {
  return TAG_PALETTE[tagPaletteIndex(name)];
}

export function tagColor(name) {
  return tagPaletteEntry(name).color;
}
