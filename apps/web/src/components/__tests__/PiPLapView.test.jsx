import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PiPLapView } from "@/components/PiPLapView.jsx";

describe("PiPLapView", () => {
  it("renders the controlled value", () => {
    render(
      <PiPLapView
        value="1º "
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("textbox").value).toBe("1º ");
  });

  it("calls onChange while typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PiPLapView
        value=""
        onChange={onChange}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("submits when value is present", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <PiPLapView
        value="1º "
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not submit when value is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <PiPLapView
        value=""
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel on Cancelar", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <PiPLapView
        value="1º "
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
