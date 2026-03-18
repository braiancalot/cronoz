import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormattedTime } from "@/components/FormattedTime.jsx";

describe("FormattedTime", () => {
  it("renders minutes and seconds for MM:SS format", () => {
    const { container } = render(<FormattedTime time={65000} />);

    // 65000ms = 01:05
    expect(container.textContent).toContain("01");
    expect(container.textContent).toContain("05");
  });

  it("shows hours when time is 1 hour or more", () => {
    const { container } = render(<FormattedTime time={3661000} />);

    // 01:01:01 — 3 colon separators (HH:MM:SS)
    const colons = container.querySelectorAll("span.opacity-50");
    expect(colons).toHaveLength(2);
  });

  it("does not show hours when under 1 hour", () => {
    const { container } = render(<FormattedTime time={5000} />);

    // Only 1 colon separator (MM:SS)
    const colons = container.querySelectorAll("span.opacity-50");
    expect(colons).toHaveLength(1);
  });

  it("hides milliseconds by default", () => {
    const { container } = render(<FormattedTime time={5050} />);

    const dotSeparator = container.querySelector("span.opacity-30");
    expect(dotSeparator).not.toBeInTheDocument();
  });

  it("shows milliseconds when showMilliseconds is true", () => {
    const { container } = render(
      <FormattedTime time={5050} showMilliseconds />,
    );

    const dotSeparator = container.querySelector("span.opacity-30");
    expect(dotSeparator).toBeInTheDocument();
  });
});
