import { useEffect } from "react";
import { Outlet } from "react-router";
import { IconContext } from "@phosphor-icons/react";
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
        <IconContext.Provider value={{ weight: "bold" }}>
          <div className="antialiased h-full">
            <Outlet />
            <InstallBanner />
            <ReloadPrompt />
            {/* top offset clears the ProjectHeader (h-16) so toasts don't cover it */}
            <Toaster
              position="top-center"
              offset={{ top: "4.5rem" }}
              mobileOffset={{ top: "4.5rem" }}
            />
          </div>
        </IconContext.Provider>
      </SyncStatusProvider>
    </SettingsProvider>
  );
}
