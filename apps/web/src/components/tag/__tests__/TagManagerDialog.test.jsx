import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagManagerDialog } from "@/components/tag/TagManagerDialog.jsx";
import { addTagToList, removeTagFromList } from "@/lib/tags.js";

const ALL_TAGS = [
  { name: "Crochê", key: "croche", count: 2 },
  { name: "Encomenda", key: "encomenda", count: 1 },
];

function DialogHarness({
  onAdd = () => {},
  onRemove = () => {},
  initialTags = ["Crochê"],
  allTags = ALL_TAGS,
}) {
  const [tags, setTags] = useState(initialTags);

  return (
    <TagManagerDialog
      open
      onOpenChange={() => {}}
      projectName="Bolsa"
      tags={tags}
      allTags={allTags}
      onAdd={(name) => {
        onAdd(name);
        setTags((current) => addTagToList(current, name));
      }}
      onRemove={(name) => {
        onRemove(name);
        setTags((current) => removeTagFromList(current, name));
      }}
    />
  );
}

describe("TagManagerDialog", () => {
  it("guides the first tag instead of claiming all tags are applied", () => {
    render(<DialogHarness initialTags={[]} allTags={[]} />);

    expect(
      screen.getByText("Digite um nome para criar a primeira tag."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Todas as tags disponíveis já estão aplicadas."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Aplicadas")).not.toBeInTheDocument();
    expect(screen.getByText("Organize “Bolsa” com tags.")).toBeInTheDocument();
  });

  it("uses mobile-first sizing with viewport-safe scrolling", () => {
    render(<DialogHarness />);

    expect(screen.getByRole("dialog")).toHaveClass(
      "max-h-[calc(100dvh-2rem)]",
      "overflow-y-auto",
      "p-4",
      "sm:p-6",
    );
    expect(screen.getByRole("textbox", { name: "Adicionar tag" })).toHaveClass(
      "h-11",
      "sm:h-9",
    );
    expect(screen.getByRole("button", { name: "Pronto" })).toHaveClass(
      "h-11",
      "w-full",
      "sm:h-9",
      "sm:w-auto",
    );
  });

  it("adds a suggested tag and removes an applied one", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    render(<DialogHarness onAdd={onAdd} onRemove={onRemove} />);

    await user.click(
      screen.getByRole("button", { name: "Adicionar tag Encomenda" }),
    );
    expect(onAdd).toHaveBeenCalledWith("Encomenda");
    expect(
      screen.getByRole("button", { name: "Remover tag Encomenda" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remover tag Crochê" }),
    );
    expect(onRemove).toHaveBeenCalledWith("Crochê");
  });

  it("creates a normalized tag from the search field", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<DialogHarness onAdd={onAdd} />);

    await user.type(
      screen.getByRole("textbox", { name: "Adicionar tag" }),
      "  Urgente  ",
    );
    await user.click(screen.getByRole("button", { name: "Criar “Urgente”" }));

    expect(onAdd).toHaveBeenCalledWith("Urgente");
    expect(
      screen.getByRole("button", { name: "Remover tag Urgente" }),
    ).toBeInTheDocument();
  });
});
