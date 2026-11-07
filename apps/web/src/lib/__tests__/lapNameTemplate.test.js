import { describe, it, expect } from "vitest";
import { MAX_LAP_NAME_LENGTH } from "@cronoz/shared";
import { renderLapName } from "../lapNameTemplate.js";

const NOV_7 = new Date(2026, 10, 7, 14, 30);

describe("renderLapName", () => {
  it("replaces the lap number", () => {
    expect(
      renderLapName({ template: "{n}º ", lapNumber: 3, date: NOV_7 }),
    ).toBe("3º ");
  });

  it("replaces day and month with two digits", () => {
    expect(
      renderLapName({ template: "{dia}/{mes}", lapNumber: 1, date: NOV_7 }),
    ).toBe("07/11");
  });

  it("accepts the accented month token", () => {
    expect(
      renderLapName({ template: "{mês}", lapNumber: 1, date: NOV_7 }),
    ).toBe("11");
  });

  it("replaces the four digit year", () => {
    expect(
      renderLapName({ template: "{ano}", lapNumber: 1, date: NOV_7 }),
    ).toBe("2026");
  });

  it("replaces every occurrence of a token", () => {
    expect(
      renderLapName({ template: "{n}-{n}", lapNumber: 2, date: NOV_7 }),
    ).toBe("2-2");
  });

  it("keeps unknown tokens as literal text", () => {
    expect(
      renderLapName({ template: "{hora} {n}", lapNumber: 1, date: NOV_7 }),
    ).toBe("{hora} 1");
  });

  it("returns an empty name for an empty template", () => {
    expect(renderLapName({ template: "", lapNumber: 1, date: NOV_7 })).toBe("");
  });

  it("caps the name at the lap name limit", () => {
    const template = "{ano}".repeat(MAX_LAP_NAME_LENGTH);
    const name = renderLapName({ template, lapNumber: 1, date: NOV_7 });
    expect(name).toHaveLength(MAX_LAP_NAME_LENGTH);
  });
});
