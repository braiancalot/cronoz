import { describe, it, expect } from "vitest";
import {
  hasSimulateFlag,
  hrefWithoutSimulateFlag,
} from "@/lib/updateSimulation.js";

describe("hasSimulateFlag", () => {
  it("detects the bare flag", () => {
    expect(hasSimulateFlag("?swupdate")).toBe(true);
  });

  it("detects the flag alongside other params", () => {
    expect(hasSimulateFlag("?foo=1&swupdate=1")).toBe(true);
  });

  it("is off for an empty query", () => {
    expect(hasSimulateFlag("")).toBe(false);
  });

  it("does not match a param that merely contains the name", () => {
    expect(hasSimulateFlag("?noswupdate=1")).toBe(false);
  });
});

describe("hrefWithoutSimulateFlag", () => {
  it("drops the flag but keeps the path", () => {
    expect(hrefWithoutSimulateFlag("https://a.dev/project/7?swupdate")).toBe(
      "https://a.dev/project/7",
    );
  });

  it("keeps the other params", () => {
    expect(hrefWithoutSimulateFlag("https://a.dev/?swupdate&keep=1")).toBe(
      "https://a.dev/?keep=1",
    );
  });

  it("leaves an href without the flag alone", () => {
    expect(hrefWithoutSimulateFlag("https://a.dev/?keep=1")).toBe(
      "https://a.dev/?keep=1",
    );
  });
});
