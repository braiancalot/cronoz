import { MicrophoneIcon, MicrophoneSlashIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

function toStatusText({ status, message }) {
  if (status === "blocked") return "Microfone bloqueado";
  if (!message) return null;
  if (message.isUnknown) return `Comando não reconhecido: "${message.text}"`;
  return message.text;
}

export function VoiceStatus({ status, message }) {
  const isBlocked = status === "blocked";
  const isWarning = isBlocked || message?.isUnknown;
  const Icon = isBlocked ? MicrophoneSlashIcon : MicrophoneIcon;
  const text = toStatusText({ status, message });

  return (
    <div className="pointer-events-none relative flex size-10 items-center justify-center">
      <Icon
        aria-label="Comandos de voz"
        className={cn(
          "size-5",
          isBlocked ? "text-destructive" : "text-muted-foreground",
          status !== "listening" && !isBlocked && "opacity-40",
        )}
      />
      {text && (
        <p
          className={cn(
            "absolute top-full right-0 z-50 mt-1 max-w-[calc(100vw-2rem)] truncate rounded-2xl bg-popover px-3 py-2 text-sm shadow-2xl",
            isWarning ? "text-destructive" : "text-popover-foreground",
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
