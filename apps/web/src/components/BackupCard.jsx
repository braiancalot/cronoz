import { useRef, useState } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import backupService, { BackupError } from "@/services/backupService.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";

function formatDateForFilename(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BackupCard() {
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);

  async function handleExport() {
    try {
      const data = await backupService.exportData();
      const filename = `cronoz-backup-${formatDateForFilename(new Date())}.json`;
      downloadJson(data, filename);
      toast.success("Backup exportado");
    } catch {
      toast.error("Não foi possível exportar.");
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const data = backupService.parseBackup(text);
      setPendingImport({ data, filename: file.name });
    } catch (err) {
      if (err instanceof BackupError) {
        toast.error(err.message);
      } else {
        toast.error("Não foi possível ler o arquivo.");
      }
    }
  }

  async function handleConfirmImport() {
    if (!pendingImport) return;
    try {
      await backupService.applyBackup(pendingImport.data);
      toast.success("Backup importado");
    } catch {
      toast.error("Falha ao importar.");
    } finally {
      setPendingImport(null);
    }
  }

  function importDescription() {
    if (!pendingImport) return null;
    const { data, filename } = pendingImport;
    return `Arquivo: ${filename}. Contém ${data.projects.length} projeto${data.projects.length === 1 ? "" : "s"} e ${data.settings.length} configuração${data.settings.length === 1 ? "" : "ões"}. Isso vai substituir todos os projetos e configurações deste dispositivo. Não pode ser desfeito.`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Exporte um arquivo JSON com seus dados ou importe um backup anterior.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport}>
            <DownloadIcon /> Exportar
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <UploadIcon /> Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleFileSelected}
          />
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!pendingImport}
        title="Importar backup?"
        description={importDescription()}
        confirmLabel="Importar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />
    </Card>
  );
}
