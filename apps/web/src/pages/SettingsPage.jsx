import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";

import settingsRepository from "@/services/settingsRepository.js";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { SyncCard } from "@/components/SyncCard.jsx";
import { BackupCard } from "@/components/BackupCard.jsx";
import { FEATURES } from "@/lib/featureFlags.js";

export default function SettingsPage() {
  const hourlyPrice = useLiveQuery(
    () => settingsRepository.get("hourlyPrice"),
    [],
    10,
  );

  async function handlePriceChange(e) {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      await settingsRepository.set("hourlyPrice", value);
    }
  }

  return (
    <PageContainer className="max-w-300 mx-auto">
      <header className="flex items-center gap-4 py-4">
        <Link to="/" className="text-lg">
          <ArrowLeftIcon />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Configurações</h1>
      </header>

      <div className="flex flex-col gap-6">
        {FEATURES.sync && <SyncCard />}
        <BackupCard />
        <Card>
          <CardHeader>
            <CardTitle>Valor por hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 max-w-xs">
              <Label htmlFor="hourly-price">Preço/hora (R$)</Label>
              <Input
                id="hourly-price"
                type="number"
                min="0"
                step="0.5"
                value={hourlyPrice}
                onChange={handlePriceChange}
              />
              <p className="text-xs text-muted-foreground">
                Usado para calcular o valor de cada projeto com base no tempo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
