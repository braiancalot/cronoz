import { describe, it, expect } from "vitest";
import { countLabel } from "@/lib/countLabel.js";

const SETTING = { one: "configuração", many: "configurações" };

describe("countLabel", () => {
  it("uses the singular word for exactly one", () => {
    expect(countLabel(1, SETTING)).toBe("1 configuração");
  });

  it("uses the plural word for zero and for more than one", () => {
    expect(countLabel(0, SETTING)).toBe("0 configurações");
    expect(countLabel(3, SETTING)).toBe("3 configurações");
  });
});
