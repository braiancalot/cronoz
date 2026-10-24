import { useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { VOICE_COMMANDS_KEY } from "@cronoz/shared";

import internalRepository from "@/services/internalRepository.js";
import {
  getSpeechRecognition,
  installLocalModel,
} from "@/lib/speechRecognition.js";

export function useVoiceCommandsSetting({
  Recognition = getSpeechRecognition(),
} = {}) {
  const stored = useLiveQuery(() =>
    internalRepository.get(VOICE_COMMANDS_KEY).then((value) => !!value),
  );
  const [pending, setPending] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);

  // Same hold as SettingsProvider: a newer live value wins over the pending one.
  const enabled = pending && pending.base === stored ? pending.value : !!stored;

  const prepareModel = useCallback(async () => {
    setModelStatus("downloading");
    const installed = await installLocalModel(Recognition);
    setModelStatus(installed ? "local" : "online");
  }, [Recognition]);

  const setEnabled = useCallback(
    (value) => {
      setPending({ base: stored, value });
      setModelStatus(null);
      // if (value) prepareModel();
      return internalRepository.set(VOICE_COMMANDS_KEY, value);
    },
    [stored],
  );

  return { enabled, setEnabled, modelStatus };
}
