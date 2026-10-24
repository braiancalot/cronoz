import { MicrophoneIcon, MicrophoneSlashIcon } from "@phosphor-icons/react";

import { useFadingMessage } from "@/hooks/useFadingMessage.js";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils";

const BLOCKED_HINT_VISIBLE_MS = 5000;
const BLOCKED_HINT =
  "Microfone bloqueado. Libere o microfone nas configurações do site e abra o projeto de novo.";

function toStatusText({ message, blockedHint }) {
  if (blockedHint) return blockedHint;
  if (!message) return null;
  if (message.isUnknown) return `Comando não reconhecido: "${message.text}"`;
  return message.text;
}

function BlockedButton({ onClick }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title="Comandos de voz"
      onClick={onClick}
      // z-30 clears the RunningOverlay, like the PiP button.
      className="relative z-30"
    >
      <MicrophoneSlashIcon className="text-destructive" />
    </Button>
  );
}

export function VoiceStatus({ status, message }) {
  const [blockedHint, showBlockedHint] = useFadingMessage(
    BLOCKED_HINT_VISIBLE_MS,
  );
  const isBlocked = status === "blocked";
  const isWarning = isBlocked || message?.isUnknown;
  const text = toStatusText({ message, blockedHint: isBlocked && blockedHint });

  return (
    <div className="relative flex size-10 items-center justify-center">
      {isBlocked ? (
        <BlockedButton onClick={() => showBlockedHint(BLOCKED_HINT)} />
      ) : (
        <MicrophoneIcon
          aria-label="Comandos de voz"
          className={cn(
            "pointer-events-none size-5 text-muted-foreground",
            status !== "listening" && "opacity-40",
          )}
        />
      )}
      {text && (
        <p
          className={cn(
            "pointer-events-none absolute top-full right-0 z-50 mt-1 w-max max-w-[calc(100vw-2rem)] rounded-2xl bg-popover px-3 py-2 text-sm shadow-2xl",
            isWarning ? "text-destructive" : "text-popover-foreground",
            !blockedHint && "truncate",
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
