import { describe, it, expect } from "vitest";
import { formatPairingCode, normalizePairingCode } from "../pairingCode.js";

describe("normalizePairingCode", () => {
  it("uppercases typed letters", () => {
    expect(normalizePairingCode("abcd2345")).toBe("ABCD2345");
  });

  it("drops the hyphen and spaces of a pasted code", () => {
    expect(normalizePairingCode(" ABCD-2345 ")).toBe("ABCD2345");
  });

  it("drops characters outside the alphabet", () => {
    expect(normalizePairingCode("A0O1IB")).toBe("AB");
  });

  it("stops at the code length", () => {
    expect(normalizePairingCode("ABCD2345XYZ")).toBe("ABCD2345");
  });
});

describe("formatPairingCode", () => {
  it("splits the code in two halves for reading", () => {
    expect(formatPairingCode("ABCD2345")).toBe("ABCD-2345");
  });
});
