import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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

describe("ProjectFilters", () => {
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
});
