import { describe, expect, it } from "vitest";

import { hiddenScrollEdges } from "@/lib/scrollEdges.js";

function edgesAt(scrollLeft, { scrollWidth = 500, clientWidth = 200 } = {}) {
  return hiddenScrollEdges({ scrollLeft, scrollWidth, clientWidth });
}

describe("hiddenScrollEdges", () => {
  it("reports only the end hidden at the start", () => {
    expect(edgesAt(0)).toEqual({ start: false, end: true });
  });

  it("reports both edges hidden mid-scroll", () => {
    expect(edgesAt(150)).toEqual({ start: true, end: true });
  });

  it("reports only the start hidden at the end", () => {
    expect(edgesAt(300)).toEqual({ start: true, end: false });
  });

  it("reports nothing hidden when the content fits", () => {
    expect(edgesAt(0, { scrollWidth: 200 })).toEqual({
      start: false,
      end: false,
    });
  });

  it("treats a subpixel shortfall as the edge", () => {
    expect(edgesAt(299.5)).toEqual({ start: true, end: false });
    expect(edgesAt(0.5)).toEqual({ start: false, end: true });
  });
});
