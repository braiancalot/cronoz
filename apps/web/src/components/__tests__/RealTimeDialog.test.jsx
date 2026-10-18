import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { formatHms } from "@/lib/stopwatch.js";
import { RealTimeDialog } from "@/components/RealTimeDialog.jsx";
import { useHidePrice } from "@/hooks/useHidePrice.js";

vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/hooks/useHidePrice.js", () => ({
  useHidePrice: vi.fn(() => false),
}));

const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(window.Navigator.prototype, "clipboard", {
  value: { writeText },
  configurable: true,
});

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Ran 3998ms, then a minute was added by hand.
const adjusted = {
  isRunning: false,
  startTimestamp: null,
  lastActiveAt: null,
  currentLapTime: 60_000,
  laps: [lap(1999), lap(1999)],
  realTime: 3998,
  editedTime: 60_000,
};

// Ran 3998ms with nothing edited: only the ms rounding sets them apart.
const rounded = {
  ...adjusted,
  currentLapTime: 0,
  editedTime: 0,
};

function lap(lapTime) {
  return { id: crypto.randomUUID(), name: "Volta", lapTime, createdAt: 0 };
}

function renderOpen({
  stopwatch = adjusted,
  ignoreMs = false,
  open = true,
} = {}) {
  render(
    <RealTimeDialog
      open={open}
      onOpenChange={() => {}}
      stopwatch={stopwatch}
      hourlyPrice={100}
      ignoreMs={ignoreMs}
    />,
  );
}

function priceText(prefix, ms) {
  const text = `${prefix}${brl.format((ms / 3_600_000) * 100)}`;
  return (content) => content.replace(/\s/g, " ") === text.replace(/\s/g, " ");
}

describe("RealTimeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHidePrice).mockReturnValue(false);
  });

  it("renders the in use, real and difference rows", () => {
    renderOpen();

    expect(screen.getByText("Tempo real")).toBeInTheDocument();
    expect(screen.getByText("Em uso")).toBeInTheDocument();
    expect(screen.getByText("Real")).toBeInTheDocument();
    expect(screen.getByText("Diferença")).toBeInTheDocument();
  });

  it("shows what was added by hand as a positive difference", () => {
    renderOpen();

    expect(screen.getByText("1m 3s 99ms")).toBeInTheDocument(); // in use
    expect(screen.getByText("3s 99ms")).toBeInTheDocument(); // real
    expect(screen.getByText("+1m")).toBeInTheDocument(); // difference
    expect(screen.getByText(priceText("+", 60_000))).toBeInTheDocument();
  });

  it("shows the in use time without a fraction when milliseconds are ignored", () => {
    renderOpen({ stopwatch: rounded, ignoreMs: true });

    expect(screen.getByText("2s")).toBeInTheDocument();
    expect(screen.getByText("3s 99ms")).toBeInTheDocument();
  });

  it("signs a difference that removed time with a minus", () => {
    renderOpen({ stopwatch: rounded, ignoreMs: true });

    expect(screen.getByText("−1s 99ms")).toBeInTheDocument();
    expect(screen.getByText(priceText("−", 1998))).toBeInTheDocument();
  });

  it("leaves a zero difference unsigned", () => {
    renderOpen({ stopwatch: rounded, ignoreMs: false });

    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("copies the in use line as time and value", async () => {
    renderOpen({ stopwatch: rounded, ignoreMs: true });

    fireEvent.click(screen.getByTitle("Copiar tempo em uso"));

    const price = brl.format((2000 / 3_600_000) * 100);
    expect(writeText).toHaveBeenCalledWith(`${formatHms(2000)} (${price})`);
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Tempo em uso copiado",
        expect.anything(),
      ),
    );
  });

  it("copies the real line with its fraction", () => {
    renderOpen();

    fireEvent.click(screen.getByTitle("Copiar tempo real"));

    const price = brl.format((3998 / 3_600_000) * 100);
    expect(writeText).toHaveBeenCalledWith(
      `${formatHms(3998, { fraction: true })} (${price})`,
    );
  });

  it("shows and copies the time alone when hidePrice is set", () => {
    vi.mocked(useHidePrice).mockReturnValue(true);
    renderOpen();

    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Copiar tempo real"));

    expect(writeText).toHaveBeenCalledWith(formatHms(3998, { fraction: true }));
  });

  it("has no copy button on the difference row", () => {
    renderOpen();

    expect(screen.getAllByTitle(/^Copiar /)).toHaveLength(2);
  });

  it("shows no numbers for a stopwatch without a known real time", () => {
    const { realTime: _r, editedTime: _e, ...legacy } = adjusted;
    renderOpen({ stopwatch: legacy });

    expect(screen.queryByText("Real")).not.toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    renderOpen({ open: false });

    expect(screen.queryByText("Em uso")).not.toBeInTheDocument();
  });
});
