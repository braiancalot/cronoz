# Design Spec — Redesign dos controles do timer + migração de ícones

Data: 2026-06-21

## Problema

1. Os controles do timer usam botões com **palavras** ("Start"/"Pause"/"Volta"). A cliente
   quer o padrão de cronômetro de celular: **botões redondos com ícones**.
2. Em telas curtas/split e no PiP, os botões embaixo desperdiçam o espaço — deveriam ficar
   **ao lado** do cronômetro.
3. A família de ícones atual (lucide) não agradou. Trocar **toda a aplicação** para
   **Phosphor**, com um padrão de peso e tamanho consistente.

## Decisões (aprovadas)

### Família de ícones

- Adotar **`@phosphor-icons/react`** e **remover `lucide-react` por completo** (dependência +
  todos os imports).

### Padrão de peso (weight)

- **Default global = `bold`**, definido uma vez via `IconContext.Provider` no `App.jsx`.
  O context atravessa o portal do PiP, então cobre o PiP também.
- **Play/Pause = `fill`** (explícito nesses dois ícones).
- Spinner = `CircleNotch` + `animate-spin` (peso default).

### Padrão de tamanho

| Contexto                                                                    | Tamanho                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------- |
| Ícone inline/UI padrão (toasts, dentro de botão de texto, item de dropdown) | `size-4` (16px)                                 |
| Ação de header / nav solta (seta voltar, PiP, ⋮, engrenagem)                | `size-5` (20px)                                 |
| Botão redondo do timer — principal (Play/Pause)                             | ícone `size-9` em botão `size-16`               |
| Botão redondo do timer — Volta                                              | ícone `size-7` em botão `size-14`               |
| Timer compacto (PiP) — principal / Volta                                    | `size-7`/`size-6` em botões `size-12`/`size-10` |

Regras:

- Dentro de `Button`: o tamanho **herda da variante** (já em `button.jsx`) — não setar à mão.
- Ícone solto: **sempre** com `size-*` explícito da tabela (Phosphor é `1em` por padrão e
  escalaria com a fonte — não depender disso).
- Fora dessa escala, só o conjunto dos botões redondos do timer.

### Mapeamento lucide → Phosphor

| lucide                                                                                | Phosphor                                                       |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `SettingsIcon`                                                                        | `Gear`                                                         |
| `DownloadIcon` / `UploadIcon`                                                         | `DownloadSimple` / `UploadSimple`                              |
| `XIcon`                                                                               | `X`                                                            |
| `MoreVerticalIcon`                                                                    | `DotsThreeVertical`                                            |
| `ArrowLeftIcon`                                                                       | `ArrowLeft`                                                    |
| `PictureInPicture2Icon`                                                               | `PictureInPicture`                                             |
| `CloudCheckIcon` / `CloudOffIcon`                                                     | `CloudCheck` / `CloudSlash`                                    |
| `RefreshCwIcon`                                                                       | `ArrowsClockwise`                                              |
| `CopyIcon`                                                                            | `Copy`                                                         |
| `CheckIcon`                                                                           | `Check`                                                        |
| `ChevronRightIcon`                                                                    | `CaretRight`                                                   |
| `PlusIcon`                                                                            | `Plus`                                                         |
| `UnlinkIcon`                                                                          | `LinkBreak`                                                    |
| `CircleCheckIcon` / `InfoIcon` / `TriangleAlertIcon` / `OctagonXIcon` / `Loader2Icon` | `CheckCircle` / `Info` / `Warning` / `XCircle` / `CircleNotch` |
| (controles do timer)                                                                  | `Play` / `Pause` / `Plus` (Volta)                              |

### Controles do timer (redesign)

Botões redondos, padrão cronômetro de celular:

- **Volta**: círculo `bg-muted` (variant `ghost` + `rounded-full`), ícone **`Plus`** peso `bold`.
- **Play/Pause**: círculo sólido **primary** (`variant="default"` + `rounded-full`), ícone
  `Play`/`Pause` peso **`fill`**.
- Sem estado "apagado" na Volta (sem `disabled` visual quando não há tempo — manter clicável
  conforme regra atual `hasLapTime`; revisar: hoje fica disabled. Decisão: manter habilitado
  visualmente, ação condicionada a `hasLapTime`).

Tamanhos por `size` prop:

- `default`: Volta `size-14`/ícone `size-7`; principal `size-16`/ícone `size-9`.
- `compact` (PiP): Volta `size-10`/ícone `size-6`; principal `size-12`/ícone `size-7`.

### Layout responsivo (embaixo vs ao lado)

- **Tela normal (altura suficiente):** cluster **embaixo** do cronômetro (como hoje).
- **Tela curta/split + PiP:** cluster **à direita** do cronômetro, **empilhado na vertical**
  (Volta em cima, Play/Pause embaixo).
- **Gatilho:** novo hook **`useShortViewport()`** com `matchMedia("(max-height: 600px)")`
  (mesmo padrão de `matchMedia` já usado em `useInstallPrompt`). Reage a resize.
- **PiP:** sempre usa o modo "ao lado" (independe da media query — é pequeno e deitado).
- `TimerControls` ganha prop `orientation` ("horizontal" | "vertical") controlando o `flex`
  e a ordem visual.

### TimerDisplay

- Sem mudança de comportamento; só o `CopyIcon` (lucide) vira `Copy` (Phosphor), herdando o
  padrão de peso/tamanho.

## Fora de escopo / limpeza

- Remover as seções temporárias de mockup do `DesignPage.jsx` (combinação escolhida,
  candidatos de Volta, peso) deixando apenas um exemplo final dos controles no design system.
- Remover `lucide-react` do `package.json`.

## Testes (TDD)

- **`useShortViewport`**: teste unitário com `matchMedia` mockado (espelhar
  `useInstallPrompt.test.js`) — retorna `true`/`false` e atualiza em mudança de media.
- **`TimerControls`**: teste de render — botões presentes com `aria-label` corretos
  ("Iniciar"/"Pausar"/"Volta"), troca Play↔Pause conforme `isRunning`, `onAddLap` só dispara
  com `hasLapTime`, e classe de orientação conforme `orientation`.
- Build + lint limpos; `lucide-react` não aparece mais em nenhum import.

## Verificação manual

1. `npm run dev`, abrir um projeto.
2. Controles redondos com ícones; Play↔Pause alterna; Volta registra volta.
3. Reduzir a altura da janela (ou split-screen) → cluster vai pro lado direito, empilhado.
4. PiP: controles ao lado, compactos.
5. Conferir ícones trocados em: header, dropdowns, toasts, backup, sync, settings, install
   banner — todos no peso `bold` e nítidos.
