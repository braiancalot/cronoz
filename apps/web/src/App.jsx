import { useEffect } from "react";
import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";
import deviceService from "./services/deviceService.js";

export default function App() {
  useEffect(() => {
    deviceService.getOrCreateDeviceId().catch((err) => {
      console.error("Failed to initialize deviceId:", err);
    });
  }, []);

  return (
    <div className="antialiased">
      <Outlet />
      <InstallBanner />
      <Toaster />
    </div>
  );
}
