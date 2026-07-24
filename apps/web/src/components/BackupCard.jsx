import { useRef, useState } from "react";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import backupService, { BackupError } from "@/services/backupService.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.jsx";
import { downloadJson, fileTimestamp } from "@/lib/download.js";

export function BackupCard() {
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);

  async function handleExport() {
    try {
      const data = await backupService.exportData();
      const filename = `cronoz-backup-${fileTimestamp(new Date())}.json`;
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
        <CardDescription>
          Exporte um arquivo JSON com seus dados ou importe um backup anterior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={handleExport}>
            <DownloadSimpleIcon /> Exportar
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <UploadSimpleIcon /> Importar
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
