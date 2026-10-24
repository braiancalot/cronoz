import { useVoiceCommandsSetting } from "@/hooks/useVoiceCommandsSetting.js";
import { getSpeechRecognition } from "@/lib/speechRecognition.js";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Switch } from "@/components/ui/switch.jsx";

const VOICE_MODEL_MESSAGES = {
  downloading: "Baixando o modelo de voz para funcionar sem internet...",
  local: "Modelo de voz baixado. Funciona sem internet.",
  online:
    "Não deu para baixar o modelo de voz. Vai usar o reconhecimento online, que precisa de internet.",
};

export function VoiceCommandsSetting() {
  const voiceCommands = useVoiceCommandsSetting();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="voice-commands">Comandos de voz</Label>
          <Badge variant="secondary">Experimental</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {getSpeechRecognition()
            ? 'Com um projeto aberto, diga "cronos iniciar" ou "cronos pausar". Vale só para este aparelho e precisa de internet.'
            : "Este navegador não tem reconhecimento de voz."}
        </p>
        {voiceCommands.modelStatus && (
          <p className="text-xs text-muted-foreground">
            {VOICE_MODEL_MESSAGES[voiceCommands.modelStatus]}
          </p>
        )}
      </div>
      <Switch
        id="voice-commands"
        checked={voiceCommands.enabled}
        disabled={!getSpeechRecognition()}
        onCheckedChange={voiceCommands.setEnabled}
      />
    </div>
  );
}
