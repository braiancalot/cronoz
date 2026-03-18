import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";

export default function App() {
  return (
    <div className="font-[IBM_Plex_Sans] antialiased bg-black text-white">
      <Outlet />
      <InstallBanner />
    </div>
  );
}
