import { describe, expect, it } from "vitest";

import { TAG_PALETTE, tagColor, tagPaletteIndex } from "@/lib/tagColors.js";

describe("tag colors", () => {
  it("uses the approved fourteen-color palette", () => {
    expect(TAG_PALETTE).toHaveLength(14);
  });

  it("keeps spelling variants on the same deterministic color", () => {
    expect(tagColor("Crochê")).toBe(tagColor("  croche  "));
    expect(tagPaletteIndex("ENCOMENDA")).toBe(tagPaletteIndex("encomenda"));
  });

  it("distributes the approved examples across distinct slots", () => {
    const examples = [
      "Crochê",
      "Amigurumi",
      "Encomenda",
      "Presente",
      "Manta de bebê",
      "Tapete",
      "Bolsa",
      "Ponto alto",
    ];

    expect(new Set(examples.map(tagPaletteIndex)).size).toBe(examples.length);
  });
});
