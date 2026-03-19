import { useState } from "react";
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

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      <Separator />
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
          ←
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
                <DialogTitle>Nova etapa</DialogTitle>
                <DialogDescription>
                  Dê um nome para esta etapa do projeto.
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
          <Tabs defaultValue="etapas" className="max-w-sm">
            <TabsList>
              <TabsTrigger value="etapas">Etapas</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>
            <TabsContent value="etapas">
              <p className="text-sm text-muted-foreground pt-2">
                Lista de etapas do projeto apareceria aqui.
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
