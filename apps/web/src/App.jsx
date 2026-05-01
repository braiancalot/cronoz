import { useEffect } from "react";
import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";
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
    <div className="antialiased">
      <Outlet />
      <InstallBanner />
      <Toaster />
    </div>
  );
}
