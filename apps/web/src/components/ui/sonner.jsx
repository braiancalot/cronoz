import { Toaster as Sonner } from "sonner";
import {
  CheckCircle,
  Info,
  Warning,
  XCircle,
  CircleNotch,
} from "@phosphor-icons/react";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" />,
        info: <Info className="size-4" />,
        warning: <Warning className="size-4" />,
        error: <XCircle className="size-4" />,
        loading: <CircleNotch className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "transparent",
        "--border-radius": "var(--radius)",
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          actionButton:
            "!bg-secondary !text-secondary-foreground hover:!bg-secondary/80 !border !border-transparent !rounded-4xl !h-6 !px-2.5 !text-xs !font-medium !whitespace-nowrap !transition-all active:!translate-y-px",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
