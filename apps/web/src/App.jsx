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
          <div className="antialiased h-full flex flex-col">
            {/* Above the outlet so it pushes the page down instead of covering
                a tap target sitting at the top of it. */}
            <ReloadPrompt />
            <div className="flex-1 min-h-0">
              <Outlet />
            </div>
            <InstallBanner />
            {/* Flush under the h-16 header. This offset and the toast's padding
                in globals.css size TOAST_BAND — change one, resize the band. */}
            <Toaster
              position="top-center"
              offset={{ top: "4rem" }}
              mobileOffset={{ top: "4rem" }}
            />
          </div>
        </IconContext.Provider>
      </SyncStatusProvider>
    </SettingsProvider>
  );
}
