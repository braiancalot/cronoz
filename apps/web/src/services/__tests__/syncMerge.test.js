import { describe, it, expect } from "vitest";
import {
  isIncomingNewer,
  pickLatestProject,
  pickLatestSetting,
} from "../syncMerge.js";

describe("isIncomingNewer", () => {
  it("returns true when no existing record", () => {
    expect(isIncomingNewer({ updatedAt: 100 }, null)).toBe(true);
    expect(isIncomingNewer({ updatedAt: 100 }, undefined)).toBe(true);
  });

  it("returns true when incoming.updatedAt is greater", () => {
    expect(isIncomingNewer({ updatedAt: 200 }, { updatedAt: 100 })).toBe(true);
  });

  it("returns false when incoming.updatedAt is smaller", () => {
    expect(isIncomingNewer({ updatedAt: 100 }, { updatedAt: 200 })).toBe(false);
  });

  it("returns false when timestamps are equal (existing wins ties)", () => {
    expect(isIncomingNewer({ updatedAt: 100 }, { updatedAt: 100 })).toBe(false);
  });

  it("treats missing updatedAt as 0", () => {
    expect(isIncomingNewer({}, { updatedAt: 100 })).toBe(false);
    expect(isIncomingNewer({ updatedAt: 100 }, {})).toBe(true);
    expect(isIncomingNewer({}, {})).toBe(false);
  });
});

describe("pickLatestProject", () => {
  it("returns incoming when newer", () => {
    const incoming = { id: "a", updatedAt: 200 };
    const existing = { id: "a", updatedAt: 100 };
    expect(pickLatestProject(incoming, existing)).toBe(incoming);
  });

  it("returns existing when incoming is older", () => {
    const incoming = { id: "a", updatedAt: 100 };
    const existing = { id: "a", updatedAt: 200 };
    expect(pickLatestProject(incoming, existing)).toBe(existing);
  });
});

describe("pickLatestSetting", () => {
  it("returns incoming when newer", () => {
    const incoming = { key: "x", updatedAt: 200 };
    const existing = { key: "x", updatedAt: 100 };
    expect(pickLatestSetting(incoming, existing)).toBe(incoming);
  });

  it("returns existing when incoming is older", () => {
    const incoming = { key: "x", updatedAt: 100 };
    const existing = { key: "x", updatedAt: 200 };
    expect(pickLatestSetting(incoming, existing)).toBe(existing);
  });
});
