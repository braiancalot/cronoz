import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";

export default function App() {
  return (
    <div className="antialiased">
      <Outlet />
      <InstallBanner />
      <Toaster />
    </div>
  );
}
