import { useEffect } from "react";
import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";
import { ReloadPrompt } from "@/components/ReloadPrompt.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";
import { SettingsProvider } from "@/providers/SettingsProvider.jsx";
import { SyncStatusProvider } from "@/providers/SyncStatusProvider.jsx";
import { useSyncManager } from "@/hooks/useSyncManager.js";
import deviceService from "./services/deviceService.js";

export default function App() {
  useEffect(() => {
    deviceService.getOrCreateDeviceId().catch((err) => {
      console.error("Failed to initialize deviceId:", err);
    });
  }, []);

  useSyncManager();

  return (
    <SettingsProvider>
      <SyncStatusProvider>
        <div className="antialiased h-full">
          <Outlet />
          <InstallBanner />
          <ReloadPrompt />
          <Toaster />
        </div>
      </SyncStatusProvider>
    </SettingsProvider>
  );
}
