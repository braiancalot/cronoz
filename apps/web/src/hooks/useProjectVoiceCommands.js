import { useCallback, useState } from "react";

import { useVoiceCommands } from "@/hooks/useVoiceCommands.js";
import { useVoiceCommandsSetting } from "@/hooks/useVoiceCommandsSetting.js";
import { useFadingMessage } from "@/hooks/useFadingMessage.js";
import { isUnknownCommand, mentionsWakeWord } from "@/lib/voiceCommands.js";

const MESSAGE_VISIBLE_MS = 2500;

export function useProjectVoiceCommands({ onStart, onPause, isAdjusting }) {
  const { enabled } = useVoiceCommandsSetting();
  const [status, setStatus] = useState("starting");
  const [message, showMessage] = useFadingMessage(MESSAGE_VISIBLE_MS);

  const handleTranscript = useCallback(
    ({ transcript, isFinal }) => {
      if (!mentionsWakeWord(transcript)) return;
      const isUnknown = isFinal && isUnknownCommand(transcript);
      showMessage({ text: transcript, isUnknown });
    },
    [showMessage],
  );

  useVoiceCommands({
    onStart,
    onPause,
    onTranscript: handleTranscript,
    onStatusChange: setStatus,
    enabled: enabled && !isAdjusting,
  });

  return { enabled, status, message };
}
