import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallBanner() {
  const { isInstallable, promptInstall, dismiss } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-neutral-900 rounded-lg p-4 flex items-center justify-between gap-3 shadow-lg ">
      <span className="text-sm text-white">Instalar Cronoz</span>
      <div className="flex items-center gap-2">
        <button
          onClick={promptInstall}
          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 active:scale-95 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          x
        </button>
      </div>
    </div>
  );
}
