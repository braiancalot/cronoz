import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectFilters } from "@/components/tag/ProjectFilters.jsx";

const TAGS = [
  { name: "Crochê", key: "croche", count: 2 },
  { name: "Encomenda", key: "encomenda", count: 1 },
];

function FilterHarness({ showCompletedFilter }) {
  const [selectedTagKeys, setSelectedTagKeys] = useState([]);
  const [completedOnly, setCompletedOnly] = useState(false);

  function toggleTag(key) {
    setSelectedTagKeys((current) =>
      current.includes(key)
        ? current.filter((selected) => selected !== key)
        : [...current, key],
    );
  }

  return (
    <ProjectFilters
      tags={TAGS}
      selectedTagKeys={selectedTagKeys}
      completedOnly={completedOnly}
      showCompletedFilter={showCompletedFilter}
      onToggleTag={toggleTag}
      onToggleCompleted={() => setCompletedOnly((current) => !current)}
      onClear={() => {
        setSelectedTagKeys([]);
        setCompletedOnly(false);
      }}
    />
  );
}

function setScrollGeometry(element, { scrollLeft, scrollWidth, clientWidth }) {
  Object.defineProperty(element, "scrollWidth", { value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { value: clientWidth });
  element.scrollLeft = scrollLeft;
}

describe("ProjectFilters", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("toggles tag and completed filters, then clears both", async () => {
    const user = userEvent.setup();
    render(<FilterHarness />);
    const tag = screen.getByRole("button", { name: "Crochê" });
    const completed = screen.getByRole("button", { name: "Concluídos" });

    expect(tag).toHaveAttribute("aria-pressed", "false");
    await user.click(tag);
    await user.click(completed);

    expect(tag).toHaveAttribute("aria-pressed", "true");
    expect(completed).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Limpar" }));

    expect(tag).toHaveAttribute("aria-pressed", "false");
    expect(completed).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByRole("button", { name: "Limpar" }),
    ).not.toBeInTheDocument();
  });

  it("uses native horizontal overflow and keeps chip text static", () => {
    const { container } = render(<FilterHarness />);
    const scroller = container.querySelector(".overflow-x-auto");
    const tag = screen.getByRole("button", { name: "Crochê" });

    expect(scroller).toBeInTheDocument();
    expect(tag.className).not.toContain("scale-95");
    expect(tag.className).not.toContain("brightness");
  });

  it("hides the completed chip when it would not exclude anything", () => {
    render(<FilterHarness showCompletedFilter={false} />);

    expect(
      screen.queryByRole("button", { name: "Concluídos" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crochê" })).toBeInTheDocument();
  });

  it("marks the edges that still hide chips as the list scrolls", () => {
    const { container } = render(<FilterHarness />);
    const scroller = container.querySelector(".overflow-x-auto");

    setScrollGeometry(scroller, {
      scrollLeft: 0,
      scrollWidth: 500,
      clientWidth: 200,
    });
    fireEvent.scroll(scroller);

    expect(scroller).not.toHaveAttribute("data-overflow-start");
    expect(scroller).toHaveAttribute("data-overflow-end");

    scroller.scrollLeft = 300;
    fireEvent.scroll(scroller);

    expect(scroller).toHaveAttribute("data-overflow-start");
    expect(scroller).not.toHaveAttribute("data-overflow-end");
  });

  it("scrolls the tapped chip into view once Limpar has appeared", async () => {
    const user = userEvent.setup();
    const reveals = [];
    const scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(function recordReveal() {
        reveals.push({
          chip: this,
          clearShown: Boolean(screen.queryByRole("button", { name: "Limpar" })),
        });
      });
    render(<FilterHarness />);
    const tag = screen.getByRole("button", { name: "Encomenda" });

    await user.click(tag);

    expect(reveals).toEqual([{ chip: tag, clearShown: true }]);
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ inline: "nearest", block: "nearest" }),
    );
  });
});
