import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { RunningOverlay } from "@/components/RunningOverlay.jsx";

describe("RunningOverlay", () => {
  it("pauses when the covered surface is tapped", () => {
    const onClick = vi.fn();
    const { container } = render(<RunningOverlay onClick={onClick} />);

    container.firstChild.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("covers the parent below the elevated controls", () => {
    const { container } = render(<RunningOverlay onClick={vi.fn()} />);

    // inset-0 covers the whole relative parent; z-20 keeps it under the z-30
    // controls, back link and PiP button so those stay tappable in one tap.
    expect(container.firstChild).toHaveClass("absolute", "inset-0", "z-20");
  });
});
