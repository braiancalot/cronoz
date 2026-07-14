import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Link } from "react-router";

import settingsRepository from "@/services/settingsRepository.js";
import { useHourlyPrice } from "@/providers/SettingsProvider.jsx";
import { useIgnoreMilliseconds } from "@/hooks/useIgnoreMilliseconds.js";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { SyncCard } from "@/components/SyncCard.jsx";
import { BackupCard } from "@/components/BackupCard.jsx";
import { FEATURES } from "@/lib/featureFlags.js";

export default function SettingsPage() {
  const hourlyPrice = useHourlyPrice();
  const ignoreMilliseconds = useIgnoreMilliseconds();

  async function handlePriceChange(e) {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      await settingsRepository.set("hourlyPrice", value);
    }
  }

  async function handleIgnoreMillisecondsChange(checked) {
    await settingsRepository.set("ignoreMilliseconds", checked);
  }

  return (
    <PageContainer className="max-w-300 mx-auto">
      <header className="flex items-center gap-2 py-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/" aria-label="Voltar">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-lg font-bold tracking-tight">Configurações</h1>
      </header>

      <div className="flex flex-col gap-6 flex-1 pb-6">
        {FEATURES.sync && <SyncCard />}

        <Card>
          <CardHeader>
            <CardTitle>Preferências</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="hourly-price">Valor por hora</Label>
                <p className="text-xs text-muted-foreground">
                  Usado para calcular o valor de cada projeto com base no tempo.
                </p>
              </div>
              <Input
                id="hourly-price"
                type="number"
                min="0"
                step="0.5"
                value={hourlyPrice}
                onChange={handlePriceChange}
                className="max-w-xs"
              />
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="ignore-milliseconds">
                  Ignorar milissegundos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Remove os milissegundos da exibição e do cálculo de valor.
                </p>
              </div>
              <Switch
                id="ignore-milliseconds"
                checked={ignoreMilliseconds}
                onCheckedChange={handleIgnoreMillisecondsChange}
              />
            </div>
          </CardContent>
        </Card>

        <BackupCard />
      </div>
    </PageContainer>
  );
}
