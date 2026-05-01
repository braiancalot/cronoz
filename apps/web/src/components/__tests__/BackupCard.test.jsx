import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/services/backupService.js", async () => {
  const actual = await vi.importActual("@/services/backupService.js");
  return {
    ...actual,
    default: {
      exportData: vi.fn(),
      parseBackup: vi.fn(),
      applyBackup: vi.fn(),
    },
  };
});
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import backupService, { BackupError } from "@/services/backupService.js";
import { toast } from "sonner";
import { BackupCard } from "@/components/BackupCard.jsx";

function makeFile(content, name = "backup.json", type = "application/json") {
  return new File([content], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Stub URL APIs used by the download flow.
  global.URL.createObjectURL = vi.fn(() => "blob:mock");
  global.URL.revokeObjectURL = vi.fn();
});

describe("BackupCard", () => {
  it("renders Export and Import buttons", () => {
    render(<BackupCard />);
    expect(screen.getByRole("button", { name: /Exportar/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Importar/i })).toBeTruthy();
  });

  it("calls exportData and toasts success on Exportar click", async () => {
    backupService.exportData.mockResolvedValue({
      schemaVersion: 1,
      exportedAt: 1,
      projects: [],
      settings: [],
    });
    const user = userEvent.setup();
    render(<BackupCard />);

    await user.click(screen.getByRole("button", { name: /Exportar/i }));

    await waitFor(() =>
      expect(backupService.exportData).toHaveBeenCalledOnce(),
    );
    expect(toast.success).toHaveBeenCalledWith("Backup exportado");
  });

  it("opens confirm dialog when a valid file is selected", async () => {
    backupService.parseBackup.mockReturnValue({
      schemaVersion: 1,
      exportedAt: 1,
      projects: [{ id: "p1" }, { id: "p2" }],
      settings: [{ key: "hourlyPrice" }],
    });

    const { container } = render(<BackupCard />);
    const input = container.querySelector('input[type="file"]');
    const file = makeFile('{"schemaVersion":1}');

    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText(/Importar backup\?/)).toBeTruthy(),
    );
    expect(screen.getByText(/2 projetos/)).toBeTruthy();
    expect(screen.getByText(/1 configuração/)).toBeTruthy();
  });

  it("toasts error and does not open dialog when file is invalid", async () => {
    backupService.parseBackup.mockImplementation(() => {
      throw new BackupError("Arquivo inválido: não é um JSON.", {
        code: "invalid_json",
      });
    });

    const { container } = render(<BackupCard />);
    const input = container.querySelector('input[type="file"]');
    const file = makeFile("not json");

    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Arquivo inválido: não é um JSON.",
      ),
    );
    expect(screen.queryByText(/Importar backup\?/)).toBeNull();
  });

  it("calls applyBackup and toasts success when import is confirmed", async () => {
    const parsedData = {
      schemaVersion: 1,
      exportedAt: 1,
      projects: [{ id: "p1" }],
      settings: [],
    };
    backupService.parseBackup.mockReturnValue(parsedData);
    backupService.applyBackup.mockResolvedValue();

    const user = userEvent.setup();
    const { container } = render(<BackupCard />);
    const input = container.querySelector('input[type="file"]');
    await user.upload(input, makeFile('{"schemaVersion":1}'));

    await waitFor(() =>
      expect(screen.getByText(/Importar backup\?/)).toBeTruthy(),
    );

    await user.click(screen.getByRole("button", { name: /^Importar$/i }));

    await waitFor(() =>
      expect(backupService.applyBackup).toHaveBeenCalledWith(parsedData),
    );
    expect(toast.success).toHaveBeenCalledWith("Backup importado");
  });
});
