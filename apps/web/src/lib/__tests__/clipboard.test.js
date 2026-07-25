import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { copyWithToast, copyFromEvent } from "../clipboard.js";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const writeText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

function eventFor(view = window) {
  return {
    stopPropagation: vi.fn(),
    currentTarget: { ownerDocument: { defaultView: view } },
  };
}

describe("copyWithToast", () => {
  it("copies the text and announces it in the singular", async () => {
    await copyWithToast("00:10", "Tempo da volta");

    expect(writeText).toHaveBeenCalledWith("00:10");
    expect(toast).toHaveBeenCalledWith(
      "Tempo da volta copiado",
      expect.anything(),
    );
  });

  it("agrees in the plural when the label is plural", async () => {
    await copyWithToast("00:10 (00:04)", "Tempos", { plural: true });

    expect(toast).toHaveBeenCalledWith("Tempos copiados", expect.anything());
  });
});

describe("copyFromEvent", () => {
  it("announces it in the singular", async () => {
    await copyFromEvent(eventFor(), "R$ 10,00", "Valor");

    expect(writeText).toHaveBeenCalledWith("R$ 10,00");
    expect(toast).toHaveBeenCalledWith("Valor copiado", expect.anything());
  });

  it("agrees in the plural for a compound label", async () => {
    await copyFromEvent(eventFor(), "00:10 (R$ 10,00)", "Tempo e valor", {
      plural: true,
    });

    expect(toast).toHaveBeenCalledWith(
      "Tempo e valor copiados",
      expect.anything(),
    );
  });

  it("stays silent when the click came from the PiP window", async () => {
    const pipView = { navigator: { clipboard: { writeText: vi.fn() } } };

    await copyFromEvent(eventFor(pipView), "00:10", "Tempo");

    expect(pipView.navigator.clipboard.writeText).toHaveBeenCalledWith("00:10");
    expect(toast).not.toHaveBeenCalled();
  });
});
