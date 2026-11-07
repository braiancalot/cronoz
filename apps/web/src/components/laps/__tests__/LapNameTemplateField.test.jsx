import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LapNameTemplateField } from "@/components/laps/LapNameTemplateField.jsx";

function renderField(template) {
  const onChange = vi.fn();
  render(<LapNameTemplateField template={template} onChange={onChange} />);
  return onChange;
}

describe("LapNameTemplateField", () => {
  it("previews the first lap name", () => {
    renderField("Volta {n}");
    expect(
      screen.getByText("A volta já vem escrita, como Volta 1."),
    ).toBeTruthy();
  });

  it("says the lap starts blank when the template is empty", () => {
    renderField("");
    expect(screen.getByText("A volta começa em branco.")).toBeTruthy();
  });

  it("reports what the user types", () => {
    const onChange = renderField("");
    fireEvent.change(screen.getByLabelText("Nome da nova volta"), {
      target: { value: "{n}" },
    });
    expect(onChange).toHaveBeenCalledWith("{n}");
  });

  it("keeps the typed text while the stored value lags behind", () => {
    renderField("a");
    const input = screen.getByLabelText("Nome da nova volta");
    fireEvent.change(input, { target: { value: "ab" } });
    expect(input.value).toBe("ab");
  });

  it("applies an example from the help and closes it", async () => {
    const user = userEvent.setup();
    const onChange = renderField("{n}º ");
    await user.click(screen.getByRole("button", { name: "Como usar" }));
    await user.click(screen.getByRole("button", { name: "Usar {dia}/{mes}" }));
    expect(onChange).toHaveBeenCalledWith("{dia}/{mes}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
