import { Outlet } from "react-router";
import { InstallBanner } from "@/components/InstallBanner.jsx";

export default function App() {
  return (
    <div className="antialiased">
      <Outlet />
      <InstallBanner />
    </div>
  );
}
