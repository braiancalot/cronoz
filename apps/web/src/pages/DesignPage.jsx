import { useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Timer,
  ListPlus,
} from "@phosphor-icons/react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs.jsx";
import { PageContainer } from "@/components/PageContainer.jsx";
import { cn } from "@/lib/utils.js";

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      <Separator />
    </div>
  );
}

function DemoCluster({ orientation = "horizontal", size = "md" }) {
  const dims =
    size === "sm"
      ? { volta: "size-10 [&_svg]:size-6", main: "size-12 [&_svg]:size-7" }
      : { volta: "size-12 [&_svg]:size-7", main: "size-14 [&_svg]:size-8" };
  return (
    <div
      className={cn(
        "flex items-center gap-4",
        orientation === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <Button
        variant="ghost"
        className={cn("rounded-full bg-muted", dims.volta)}
        aria-label="Volta"
        title="Volta"
      >
        <Plus weight="bold" />
      </Button>
      <Button
        className={cn("rounded-full", dims.main)}
        aria-label="Pausar"
        title="Pausar"
      >
        <Pause weight="fill" />
      </Button>
    </div>
  );
}

function DemoTime({ size = "lg" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={cn(
          "font-medium tabular-nums",
          size === "sm" ? "text-3xl" : "text-5xl",
        )}
      >
        12:34
      </span>
      <span
        className={cn(
          "text-primary font-medium",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        R$ 37,39
      </span>
    </div>
  );
}

export default function DesignPage() {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");

  return (
    <PageContainer className="max-w-300 mx-auto pb-12 overflow-auto">
      <header className="flex items-center gap-4 py-4">
        <Link to="/" className="text-lg">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Design System</h1>
      </header>

      <div className="flex flex-col gap-8">
        <Section title="Button">
          <div className="flex flex-wrap gap-3 items-center">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button disabled>Disabled</Button>
            <Button variant="outline" className="border-primary">
              Outline Primary
            </Button>
          </div>
        </Section>

        <Section title="Timer Controls — combinação escolhida (A + B)">
          <p className="text-sm text-muted-foreground">
            Start/Pause sólido (primary) + Volta tinted. Estados: rodando e
            parado.
          </p>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                className="size-14 rounded-full bg-muted [&_svg]:size-7"
                aria-label="Volta"
                title="Volta"
              >
                <Plus weight="bold" />
              </Button>
              <Button
                className="size-16 rounded-full [&_svg]:size-9"
                aria-label="Pausar"
                title="Pausar"
              >
                <Pause weight="fill" />
              </Button>
              <span className="text-xs text-muted-foreground">Rodando</span>
            </div>

            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                className="size-14 rounded-full bg-muted [&_svg]:size-7"
                aria-label="Volta"
                title="Volta"
              >
                <Plus weight="bold" />
              </Button>
              <Button
                className="size-16 rounded-full [&_svg]:size-9"
                aria-label="Iniciar"
                title="Iniciar"
              >
                <Play weight="fill" />
              </Button>
              <span className="text-xs text-muted-foreground">Parado</span>
            </div>
          </div>
        </Section>

        <Section title="Timer Controls — layout (ao lado vs embaixo)">
          <p className="text-sm text-muted-foreground">
            Tela normal: botões embaixo. Tela curta/split (pouca altura) e PiP:
            cluster ao lado direito, aproveitando a largura.
          </p>

          <div className="flex flex-wrap gap-8 items-start">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Tela normal — embaixo
              </span>
              <div className="w-56 h-80 rounded-2xl bg-card flex flex-col items-center p-4">
                <div className="flex-1 flex items-center justify-center">
                  <DemoTime />
                </div>
                <div className="pb-2">
                  <DemoCluster />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Tela curta / split — ao lado
              </span>
              <div className="w-[26rem] h-44 rounded-2xl bg-card flex items-center justify-center gap-6 p-4">
                <div className="flex-1 flex items-center justify-center">
                  <DemoTime />
                </div>
                <DemoCluster orientation="vertical" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                PiP — ao lado (compacto)
              </span>
              <div className="w-72 h-40 rounded-2xl bg-card flex items-center justify-center gap-4 p-3">
                <div className="flex-1 flex items-center justify-center">
                  <DemoTime size="sm" />
                </div>
                <DemoCluster orientation="vertical" size="sm" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Ícone de Volta — candidatos (Phosphor)">
          <p className="text-sm text-muted-foreground">
            No círculo tinted escolhido. Qual representa melhor &quot;registrar
            volta&quot;?
          </p>

          <div className="flex flex-wrap gap-10">
            {[
              { Icon: Plus, label: "Plus · adicionar volta" },
              { Icon: Timer, label: "Timer · cronômetro/lap" },
              { Icon: ListPlus, label: "ListPlus · lista de voltas" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <Button
                  variant="ghost"
                  className="size-14 rounded-full bg-muted [&_svg]:size-7"
                  aria-label="Volta"
                  title="Volta"
                >
                  <Icon weight="bold" />
                </Button>
                <span className="text-xs text-muted-foreground text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Play/Pause — peso do ícone (Phosphor)">
          <p className="text-sm text-muted-foreground">
            Antes era lucide preenchido (ficou pesado). O Phosphor tem pesos:
            qual fica melhor no botão sólido?
          </p>

          <div className="flex flex-wrap gap-10">
            {[
              { weight: "regular", label: "Regular (outline)" },
              { weight: "bold", label: "Bold" },
              { weight: "fill", label: "Fill" },
              { weight: "duotone", label: "Duotone" },
            ].map(({ weight, label }) => (
              <div key={weight} className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <Button
                    className="size-16 rounded-full [&_svg]:size-9"
                    aria-label="Iniciar"
                    title="Iniciar"
                  >
                    <Play weight={weight} />
                  </Button>
                  <Button
                    className="size-16 rounded-full [&_svg]:size-9"
                    aria-label="Pausar"
                    title="Pausar"
                  >
                    <Pause weight={weight} />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Input">
          <div className="flex flex-col gap-3 max-w-sm">
            <div className="flex flex-col gap-2">
              <Label htmlFor="demo-input">Nome do projeto</Label>
              <Input
                id="demo-input"
                placeholder="Ex: Bolsa de crochê"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <Input disabled placeholder="Desabilitado" />
          </div>
        </Section>

        <Section title="Textarea">
          <div className="flex flex-col gap-2 max-w-sm">
            <Label htmlFor="demo-textarea">Notas</Label>
            <Textarea
              id="demo-textarea"
              placeholder="Tipo de linha, agulha, link de tutorial..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
            />
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section title="Card">
          <div className="flex flex-col gap-3 max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle>Bolsa de crochê</CardTitle>
                <CardDescription>Projeto iniciado em 15/03</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Tempo total: 2h 35m</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Card pequeno</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </Section>

        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova volta</DialogTitle>
                <DialogDescription>
                  Dê um nome para esta volta do projeto.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="Ex: Base" />
              <DialogFooter>
                <Button variant="ghost" size="sm">
                  Cancelar
                </Button>
                <Button size="sm">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="voltas" className="max-w-sm">
            <TabsList>
              <TabsTrigger value="voltas">Voltas</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>
            <TabsContent value="voltas">
              <p className="text-sm text-muted-foreground pt-2">
                Lista de voltas do projeto apareceria aqui.
              </p>
            </TabsContent>
            <TabsContent value="notas">
              <p className="text-sm text-muted-foreground pt-2">
                Notas do projeto apareceriam aqui.
              </p>
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Separator">
          <div className="flex flex-col gap-2 max-w-sm">
            <span className="text-sm">Acima do separator</span>
            <Separator />
            <span className="text-sm">Abaixo do separator</span>
          </div>
        </Section>

        <Section title="Cores">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-primary" />
              <span className="text-xs text-muted-foreground">Primary</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-secondary" />
              <span className="text-xs text-muted-foreground">Secondary</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-muted" />
              <span className="text-xs text-muted-foreground">Muted</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-accent" />
              <span className="text-xs text-muted-foreground">Accent</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-card" />
              <span className="text-xs text-muted-foreground">Card</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-destructive" />
              <span className="text-xs text-muted-foreground">Destructive</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg border bg-background" />
              <span className="text-xs text-muted-foreground">Background</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg bg-foreground" />
              <span className="text-xs text-muted-foreground">Foreground</span>
            </div>
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}
