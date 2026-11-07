import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";
import { renderLapName } from "@/lib/lapNameTemplate.js";

const SAMPLE_LAP_NUMBER = 3;

const TOKENS = [
  { token: "{n}", meaning: "Número da volta" },
  { token: "{dia}", meaning: "Dia, com dois dígitos" },
  { token: "{mes}", meaning: "Mês, com dois dígitos" },
  { token: "{ano}", meaning: "Ano" },
];

const EXAMPLES = ["{n}º ", "{dia}/{mes}", "Volta {n}"];

function sample(template) {
  return renderLapName({
    template,
    lapNumber: SAMPLE_LAP_NUMBER,
    date: new Date(),
  });
}

function TokenList() {
  return (
    <dl className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 text-sm">
      {TOKENS.map(({ token, meaning }) => (
        <div key={token} className="contents">
          <dt className="font-medium">{token}</dt>
          <dd className="text-muted-foreground">{meaning}</dd>
          <dd className="text-right tabular-nums">{sample(token)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ExampleList({ onUse }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {EXAMPLES.map((example) => (
        <li key={example} className="flex items-center gap-4">
          <span className="flex-1 font-medium">{example}</span>
          <span className="text-muted-foreground">{sample(example)}</span>
          <DialogClose asChild>
            <Button
              variant="secondary"
              size="xs"
              aria-label={`Usar ${example}`}
              onClick={() => onUse(example)}
            >
              Usar
            </Button>
          </DialogClose>
        </li>
      ))}
    </ul>
  );
}

export function LapNameTemplateHelp({ onUse }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="xs" className="h-auto self-start p-0">
          Como usar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nome da nova volta</DialogTitle>
          <DialogDescription>
            O texto que já vem escrito ao criar uma volta. Os códigos entre
            chaves viram valores; o resto fica como está. A data é a do dia em
            que a volta é criada.
          </DialogDescription>
        </DialogHeader>
        <TokenList />
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Exemplos</h3>
          <ExampleList onUse={onUse} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
