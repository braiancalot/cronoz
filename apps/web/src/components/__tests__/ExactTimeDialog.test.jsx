import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "sonner";
import { formatHms } from "@/lib/stopwatch.js";
import { ExactTimeDialog } from "@/components/ExactTimeDialog.jsx";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(window.Navigator.prototype, "clipboard", {
  value: { writeText },
  configurable: true,
});

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// trunc(1999)*2 = 2000 rounded ; 3998 exact ; 1998 difference
const stopwatch = {
  isRunning: false,
  startTimestamp: null,
  currentLapTime: 0,
  laps: [{ lapTime: 1999 }, { lapTime: 1999 }],
};

function renderOpen() {
  render(
    <ExactTimeDialog
      open
      onOpenChange={() => {}}
      stopwatch={stopwatch}
      hourlyPrice={100}
    />,
  );
}

describe("ExactTimeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the rounded, exact and difference rows when open", () => {
    renderOpen();

    expect(screen.getByText("Arredondado")).toBeInTheDocument();
    expect(screen.getByText(/Exato/)).toBeInTheDocument();
    expect(screen.getByText("Diferença")).toBeInTheDocument();
  });

  it("shows times in h/m/s with a fraction on the exact and difference rows", () => {
    renderOpen();

    expect(screen.getByText("2s")).toBeInTheDocument(); // rounded, no fraction
    expect(screen.getByText("3s 99ms")).toBeInTheDocument(); // exact, with ms
    expect(screen.getByText("+1s 99ms")).toBeInTheDocument(); // difference, prefixed
  });

  it("prefixes the difference price with a plus sign", () => {
    renderOpen();

    const diffPrice = (1998 / 3600000) * 100;
    const priceEl = screen.getByText(
      (content) =>
        content.replace(/\s/g, " ") ===
        `+${brl.format(diffPrice)}`.replace(/\s/g, " "),
    );
    expect(priceEl).toBeInTheDocument();
  });

  it("copies the rounded line as time and value", () => {
    renderOpen();

    fireEvent.click(screen.getByTitle("Copiar Arredondado"));

    const price = brl.format((2000 / 3600000) * 100);
    expect(writeText).toHaveBeenCalledWith(`${formatHms(2000)} (${price})`);
    expect(toast).toHaveBeenCalledOnce();
  });

  it("copies the exact line with its fraction", () => {
    renderOpen();

    fireEvent.click(screen.getByTitle("Copiar Exato"));

    const price = brl.format((3998 / 3600000) * 100);
    expect(writeText).toHaveBeenCalledWith(
      `${formatHms(3998, { fraction: true })} (${price})`,
    );
  });

  it("has no copy button on the difference row", () => {
    renderOpen();

    expect(screen.queryByTitle("Copiar Diferença")).not.toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    render(
      <ExactTimeDialog
        open={false}
        onOpenChange={() => {}}
        stopwatch={stopwatch}
        hourlyPrice={100}
      />,
    );

    expect(screen.queryByText("Arredondado")).not.toBeInTheDocument();
  });
});
