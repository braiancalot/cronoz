# Timer Controls Redesign + Icon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the word-based timer controls with round icon buttons (phone-stopwatch style), make the controls sit beside the timer on short/split screens and in PiP, and migrate the whole app from `lucide-react` to `@phosphor-icons/react` with a consistent weight/size standard.

**Architecture:** A global `IconContext.Provider` in `App.jsx` sets `weight: "bold"` once for every Phosphor icon (context crosses the PiP portal). Play/Pause override to `weight="fill"`. A new `useShortViewport()` hook (`matchMedia("(max-height: 600px)")`) drives a beside-vs-below layout switch in `ProjectPage`; PiP always uses the beside layout. `TimerControls` becomes round icon buttons with an `orientation` prop.

**Tech Stack:** React 19, Vite, Tailwind v4, `@phosphor-icons/react` (already installed, `^2.1.10`), Vitest + Testing Library.

## Global Constraints

- Icon family: `@phosphor-icons/react`. `lucide-react` must be **completely removed** (dependency + every import) by the end.
- Default icon weight `bold` (global via IconContext); Play/Pause `fill`; spinner = `CircleNotch` + `animate-spin`.
- Icon sizes: inside `Button` inherit from the button size variant (do not set by hand); standalone icons use explicit `size-*` (`size-4` default, `size-5` for header/nav). Round timer buttons use the sizes defined in Task 3. Never use arbitrary icon sizes outside this scale.
- No `ring-*`/`focus-visible:ring` and no decorative `border-*`; visual separation comes from luminance only.
- Comments only when indispensable. Conventional Commits. No `Co-Authored-By` line.
- Lap→Phosphor map: `Plus` (Volta). Full lucide→Phosphor map in Task 5.

---

### Task 1: Global IconContext (weight default)

**Files:**

- Modify: `apps/web/src/App.jsx`

**Interfaces:**

- Produces: every Phosphor icon rendered under `<App>` defaults to `weight="bold"` unless overridden per-icon.

- [ ] **Step 1: Wrap the app tree in `IconContext.Provider`**

In `apps/web/src/App.jsx`, add the import and wrap the existing `<div className="antialiased h-full">` subtree:

```jsx
import { IconContext } from "@phosphor-icons/react";
```

Wrap the root div (inside the existing providers):

```jsx
return (
  <SettingsProvider>
    <SyncStatusProvider>
      <IconContext.Provider value={{ weight: "bold" }}>
        <div className="antialiased h-full">
          <Outlet />
          <InstallBanner />
          <ReloadPrompt />
          <Toaster />
        </div>
      </IconContext.Provider>
    </SyncStatusProvider>
  </SettingsProvider>
);
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run lint --workspace=apps/web && npm run build --workspace=apps/web`
Expected: both succeed. (DesignPage already uses Phosphor, so its icons now render bold.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/App.jsx
git commit -m "feat(web): set global Phosphor icon weight via IconContext"
```

---

### Task 2: `useShortViewport` hook

**Files:**

- Create: `apps/web/src/hooks/useShortViewport.js`
- Test: `apps/web/src/hooks/__tests__/useShortViewport.test.js`

**Interfaces:**

- Produces: `useShortViewport(): boolean` — `true` when `matchMedia("(max-height: 600px)")` matches; updates on media change.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/hooks/__tests__/useShortViewport.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShortViewport } from "@/hooks/useShortViewport.js";

function mockMatchMedia(initial) {
  let handler;
  const mql = {
    matches: initial,
    addEventListener: (_event, h) => {
      handler = h;
    },
    removeEventListener: () => {
      handler = undefined;
    },
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return {
    setMatches(value) {
      mql.matches = value;
      act(() => handler?.({ matches: value }));
    },
  };
}

describe("useShortViewport", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when the viewport is tall", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(false);
  });

  it("returns true when the viewport is short", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useShortViewport());
    expect(result.current).toBe(false);
    mm.setMatches(true);
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web -- useShortViewport`
Expected: FAIL — cannot resolve `@/hooks/useShortViewport.js`.

- [ ] **Step 3: Write the hook**

Create `apps/web/src/hooks/useShortViewport.js`:

```js
import { useState, useEffect } from "react";

const QUERY = "(max-height: 600px)";

export function useShortViewport() {
  const [isShort, setIsShort] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (event) => setIsShort(event.matches);
    setIsShort(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isShort;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web -- useShortViewport`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useShortViewport.js apps/web/src/hooks/__tests__/useShortViewport.test.js
git commit -m "feat(web): add useShortViewport hook"
```

---

### Task 3: TimerControls — round icon buttons + orientation

**Files:**

- Modify: `apps/web/src/components/TimerControls.jsx` (full rewrite)
- Test: `apps/web/src/components/__tests__/TimerControls.test.jsx`

**Interfaces:**

- Consumes: `Button` from `@/components/ui/button.jsx`; `Play`, `Pause`, `Plus` from `@phosphor-icons/react`.
- Produces: `<TimerControls isRunning hasLapTime onStart onPause onAddLap showLap=true size="default"|"compact" orientation="horizontal"|"vertical" className />`. Main button `aria-label` is `"Iniciar"` (stopped) / `"Pausar"` (running); Volta button `aria-label="Volta"`, disabled when `!hasLapTime`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/__tests__/TimerControls.test.jsx`:

```jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimerControls } from "@/components/TimerControls.jsx";

const noop = () => {};

describe("TimerControls", () => {
  it("shows Iniciar when stopped and Pausar when running", () => {
    const { rerender } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();

    rerender(
      <TimerControls
        isRunning={true}
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("calls onStart when stopped and onPause when running", async () => {
    const onStart = vi.fn();
    const onPause = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        onStart={onStart}
        onPause={onPause}
        onAddLap={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(onStart).toHaveBeenCalledOnce();

    rerender(
      <TimerControls
        isRunning={true}
        hasLapTime={false}
        onStart={onStart}
        onPause={onPause}
        onAddLap={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("disables Volta without lap time and triggers onAddLap with it", async () => {
    const onAddLap = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <TimerControls
        isRunning
        hasLapTime={false}
        onStart={noop}
        onPause={noop}
        onAddLap={onAddLap}
      />,
    );
    expect(screen.getByRole("button", { name: "Volta" })).toBeDisabled();

    rerender(
      <TimerControls
        isRunning
        hasLapTime
        onStart={noop}
        onPause={noop}
        onAddLap={onAddLap}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Volta" }));
    expect(onAddLap).toHaveBeenCalledOnce();
  });

  it("hides Volta when showLap is false", () => {
    render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        showLap={false}
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Volta" }),
    ).not.toBeInTheDocument();
  });

  it("applies vertical orientation", () => {
    const { container } = render(
      <TimerControls
        isRunning={false}
        hasLapTime={false}
        orientation="vertical"
        onStart={noop}
        onPause={noop}
        onAddLap={noop}
      />,
    );
    expect(container.firstChild).toHaveClass("flex-col");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=apps/web -- TimerControls`
Expected: FAIL — old component renders text buttons ("Start"/"Volta"), no button named "Iniciar"/"Pausar".

- [ ] **Step 3: Rewrite the component**

Replace the entire contents of `apps/web/src/components/TimerControls.jsx`:

```jsx
import { Play, Pause, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

const SIZES = {
  default: {
    volta: "size-14 [&_svg]:size-7",
    main: "size-16 [&_svg]:size-9",
  },
  compact: {
    volta: "size-10 [&_svg]:size-6",
    main: "size-12 [&_svg]:size-7",
  },
};

export function TimerControls({
  isRunning,
  hasLapTime,
  onStart,
  onPause,
  onAddLap,
  showLap = true,
  size = "default",
  orientation = "horizontal",
  className,
}) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className,
      )}
    >
      {showLap && (
        <Button
          variant="ghost"
          className={cn("rounded-full bg-muted", s.volta)}
          onClick={hasLapTime ? onAddLap : undefined}
          disabled={!hasLapTime}
          aria-label="Volta"
          title="Volta"
        >
          <Plus />
        </Button>
      )}

      <Button
        className={cn("rounded-full", s.main)}
        onClick={isRunning ? onPause : onStart}
        aria-label={isRunning ? "Pausar" : "Iniciar"}
        title={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? <Pause weight="fill" /> : <Play weight="fill" />}
      </Button>
    </div>
  );
}
```

(`Plus` inherits `weight="bold"` from the global IconContext; Play/Pause override to `fill`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=apps/web -- TimerControls`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/TimerControls.jsx apps/web/src/components/__tests__/TimerControls.test.jsx
git commit -m "feat(web): redesign timer controls as round icon buttons"
```

---

### Task 4: ProjectPage + PiP beside/below layout

**Files:**

- Modify: `apps/web/src/pages/ProjectPage.jsx:140-194`
- Modify: `apps/web/src/components/PiPTimer.jsx`

**Interfaces:**

- Consumes: `useShortViewport()` (Task 2); `TimerControls` `orientation` prop (Task 3).
- Produces: no new exports; ProjectPage renders controls below on tall viewports and beside (vertical) on short viewports; PiP renders timer + controls in a row.

- [ ] **Step 1: Import the hook in ProjectPage**

In `apps/web/src/pages/ProjectPage.jsx`, add to the hook imports near the top:

```jsx
import { useShortViewport } from "@/hooks/useShortViewport.js";
```

- [ ] **Step 2: Compute layout flag and shared elements**

Right after `const { isSupported: isPiPSupported, pipWindow, openPiP } = usePiPWindow();` add:

```jsx
const isShort = useShortViewport();
```

- [ ] **Step 3: Replace the main timer/controls block**

Replace the existing block (the `<div onClick={...}>` … `</div>` that contains the timer `<section>`, `<Laps>`, and `<TimerControls>`, currently lines ~140-173) with:

```jsx
{
  isShort ? (
    <div
      onClick={project.stopwatch.isRunning ? pause : undefined}
      className="flex flex-1 w-full min-h-0 items-stretch gap-4"
    >
      <div className="flex flex-1 flex-col items-center min-h-0">
        <section className="flex flex-1 items-center justify-center w-full">
          <TimerDisplay
            time={hasLaps ? splitDisplayTime : displayTime}
            totalTime={hasLaps ? displayTime : null}
            isRunning={project.stopwatch.isRunning}
            hourlyPrice={hourlyPrice}
          />
        </section>

        {(hasLaps || isAddingLap) && (
          <Laps
            laps={project.stopwatch.laps}
            onRenameLap={renameLap}
            onDeleteLap={deleteLap}
            isAddingLap={isAddingLap}
            addLapName={lapName}
            onAddLapNameChange={setLapName}
            onConfirmAddLap={handleConfirmAddLap}
            onCancelAddLap={handleCancelAddLap}
          />
        )}
      </div>

      <div className="flex items-center pr-2">
        <TimerControls
          isRunning={project.stopwatch.isRunning}
          hasLapTime={splitDisplayTime > 0}
          onStart={start}
          onPause={pause}
          onAddLap={handleStartAddLap}
          orientation="vertical"
        />
      </div>
    </div>
  ) : (
    <div
      onClick={project.stopwatch.isRunning ? pause : undefined}
      className="flex flex-1 flex-col w-full items-center min-h-0"
    >
      <section className="flex flex-1 items-center justify-center w-full mt-8">
        <TimerDisplay
          time={hasLaps ? splitDisplayTime : displayTime}
          totalTime={hasLaps ? displayTime : null}
          isRunning={project.stopwatch.isRunning}
          hourlyPrice={hourlyPrice}
        />
      </section>

      {(hasLaps || isAddingLap) && (
        <Laps
          laps={project.stopwatch.laps}
          onRenameLap={renameLap}
          onDeleteLap={deleteLap}
          isAddingLap={isAddingLap}
          addLapName={lapName}
          onAddLapNameChange={setLapName}
          onConfirmAddLap={handleConfirmAddLap}
          onCancelAddLap={handleCancelAddLap}
        />
      )}

      <TimerControls
        isRunning={project.stopwatch.isRunning}
        hasLapTime={splitDisplayTime > 0}
        onStart={start}
        onPause={pause}
        onAddLap={handleStartAddLap}
        orientation="horizontal"
        className="pb-8"
      />
    </div>
  );
}
```

- [ ] **Step 4: Update the PiP TimerControls to vertical**

In the same file, in the `<PiPTimer>` block, change the PiP `<TimerControls>` props: remove `className="pb-0"`, keep `size="compact"` and `showLap={false}`, and add `orientation="vertical"`:

```jsx
<TimerControls
  isRunning={project.stopwatch.isRunning}
  hasLapTime={splitDisplayTime > 0}
  onStart={start}
  onPause={pause}
  showLap={false}
  size="compact"
  orientation="vertical"
/>
```

- [ ] **Step 5: Make the PiP container lay out side-by-side**

Replace the inner container in `apps/web/src/components/PiPTimer.jsx`:

```jsx
import { createPortal } from "react-dom";

export function PiPTimer({ pipWindow, children }) {
  if (!pipWindow) return null;

  return createPortal(
    <div className="flex h-full w-full flex-row items-center justify-center gap-4 bg-background p-4 text-foreground">
      {children}
    </div>,
    pipWindow.document.body,
  );
}
```

- [ ] **Step 6: Verify lint, tests, build**

Run: `npm run lint --workspace=apps/web && npm run test --workspace=apps/web && npm run build --workspace=apps/web`
Expected: all pass.

- [ ] **Step 7: Manual verification**

Run `npm run dev`, open a project:

- Tall window: round controls below the timer; Play↔Pause toggles; Volta records a lap.
- Shrink window height (< 600px) or split-screen: controls move to the right of the timer, stacked vertically (Volta on top).
- Open PiP: timer on the left, controls (compact, vertical) on the right.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/ProjectPage.jsx apps/web/src/components/PiPTimer.jsx
git commit -m "feat(web): place timer controls beside the timer on short screens and PiP"
```

---

### Task 5: Migrate remaining icons (lucide → Phosphor)

**Files (modify):**

- `apps/web/src/components/AppHeader.jsx`
- `apps/web/src/components/BackupCard.jsx`
- `apps/web/src/components/InstallBanner.jsx`
- `apps/web/src/components/Laps.jsx`
- `apps/web/src/components/ProjectCard.jsx`
- `apps/web/src/components/ProjectHeader.jsx`
- `apps/web/src/components/SyncCard.jsx`
- `apps/web/src/components/SyncIndicator.jsx`
- `apps/web/src/components/TimerDisplay.jsx`
- `apps/web/src/pages/ProjectPage.jsx`
- `apps/web/src/pages/SettingsPage.jsx`
- `apps/web/src/components/ui/dialog.jsx`
- `apps/web/src/components/ui/dropdown-menu.jsx`
- `apps/web/src/components/ui/sheet.jsx`
- `apps/web/src/components/ui/sonner.jsx`

**Interfaces:**

- Consumes: global IconContext (Task 1) so all swapped icons inherit `weight="bold"`.
- Produces: zero `lucide-react` imports remain after this task except the dependency line (removed in Task 6).

All icons below sit inside `Button`/dropdown primitives and inherit size from the variant — **do not add size classes** except where noted.

- [ ] **Step 1: AppHeader** — `apps/web/src/components/AppHeader.jsx`

Replace import line 1:

```jsx
import { Gear } from "@phosphor-icons/react";
```

Replace `<SettingsIcon />` with `<Gear />`.

- [ ] **Step 2: BackupCard** — `apps/web/src/components/BackupCard.jsx`

Replace the lucide import:

```jsx
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
```

Replace `<DownloadIcon />` → `<DownloadSimple />`, `<UploadIcon />` → `<UploadSimple />`.

- [ ] **Step 3: InstallBanner** — `apps/web/src/components/InstallBanner.jsx`

Replace import line 1:

```jsx
import { X } from "@phosphor-icons/react";
```

Replace `<XIcon />` → `<X />`.

- [ ] **Step 4: Laps** — `apps/web/src/components/Laps.jsx`

Replace the lucide import line:

```jsx
import { DotsThreeVertical } from "@phosphor-icons/react";
```

Replace `<MoreVerticalIcon />` → `<DotsThreeVertical />`.

- [ ] **Step 5: ProjectCard** — `apps/web/src/components/ProjectCard.jsx`

Replace the lucide import line:

```jsx
import { DotsThreeVertical } from "@phosphor-icons/react";
```

Replace `<MoreVerticalIcon />` → `<DotsThreeVertical />`.

- [ ] **Step 6: ProjectHeader** — `apps/web/src/components/ProjectHeader.jsx`

Replace the multi-line lucide import (lines 1-5):

```jsx
import {
  ArrowLeft,
  DotsThreeVertical,
  PictureInPicture,
} from "@phosphor-icons/react";
```

Replace usages: `<ArrowLeftIcon />` → `<ArrowLeft className="size-5" />` (it sits in a `<Link>`, not a Button, so pin the size), `<PictureInPicture2Icon />` → `<PictureInPicture />`, `<MoreVerticalIcon />` → `<DotsThreeVertical />`.

- [ ] **Step 7: SyncCard** — `apps/web/src/components/SyncCard.jsx`

Replace the multi-line lucide import:

```jsx
import {
  Check,
  Plus,
  ArrowsClockwise,
  LinkBreak,
  X,
} from "@phosphor-icons/react";
```

Replace usages: `<CheckIcon />` → `<Check />`, `<XIcon />` → `<X />`, `<RefreshCwIcon />` → `<ArrowsClockwise />`, `<PlusIcon />` → `<Plus />`, `<UnlinkIcon />` → `<LinkBreak />`.

- [ ] **Step 8: SyncIndicator** — `apps/web/src/components/SyncIndicator.jsx`

Replace import line 2:

```jsx
import { CloudCheck, CloudSlash, ArrowsClockwise } from "@phosphor-icons/react";
```

Replace assignments: `CloudCheckIcon` → `CloudCheck`, `CloudOffIcon` → `CloudSlash` (both occurrences), `RefreshCwIcon` → `ArrowsClockwise`. The `animate-spin` className on the syncing state is unchanged (stays on `<Icon className={className} />`).

- [ ] **Step 9: TimerDisplay** — `apps/web/src/components/TimerDisplay.jsx`

Replace import line 1:

```jsx
import { Copy } from "@phosphor-icons/react";
```

Replace `<CopyIcon />` → `<Copy />`.

- [ ] **Step 10: ProjectPage back-arrow** — `apps/web/src/pages/ProjectPage.jsx`

Replace `import { ArrowLeftIcon } from "lucide-react";` with:

```jsx
import { ArrowLeft } from "@phosphor-icons/react";
```

Replace `<ArrowLeftIcon />` → `<ArrowLeft />` (inside a `Button variant="ghost"`, inherits size).

- [ ] **Step 11: SettingsPage** — `apps/web/src/pages/SettingsPage.jsx`

Replace import line 1:

```jsx
import { ArrowLeft } from "@phosphor-icons/react";
```

Replace `<ArrowLeftIcon />` → `<ArrowLeft />` (inside `Button size="icon-sm"`, inherits size-5).

- [ ] **Step 12: dialog primitive** — `apps/web/src/components/ui/dialog.jsx`

Replace `import { XIcon } from "lucide-react";` with:

```jsx
import { X } from "@phosphor-icons/react";
```

Replace `<XIcon />` → `<X />`.

- [ ] **Step 13: dropdown-menu primitive** — `apps/web/src/components/ui/dropdown-menu.jsx`

Replace `import { CheckIcon, ChevronRightIcon } from "lucide-react";` with:

```jsx
import { Check, CaretRight } from "@phosphor-icons/react";
```

Replace both `<CheckIcon />` → `<Check />` and `<ChevronRightIcon className="ml-auto" />` → `<CaretRight className="ml-auto" />`.

- [ ] **Step 14: sheet primitive** — `apps/web/src/components/ui/sheet.jsx`

Replace `import { XIcon } from "lucide-react";` with:

```jsx
import { X } from "@phosphor-icons/react";
```

Replace `<XIcon />` → `<X />`.

- [ ] **Step 15: sonner toasts** — `apps/web/src/components/ui/sonner.jsx`

Replace the multi-line lucide import with:

```jsx
import {
  CheckCircle,
  Info,
  Warning,
  XCircle,
  CircleNotch,
} from "@phosphor-icons/react";
```

Replace usages (keep the existing `className="size-4"` and `className="size-4 animate-spin"`):

- `<CircleCheckIcon className="size-4" />` → `<CheckCircle className="size-4" />`
- `<InfoIcon className="size-4" />` → `<Info className="size-4" />`
- `<TriangleAlertIcon className="size-4" />` → `<Warning className="size-4" />`
- `<OctagonXIcon className="size-4" />` → `<XCircle className="size-4" />`
- `<Loader2Icon className="size-4 animate-spin" />` → `<CircleNotch className="size-4 animate-spin" />`

- [ ] **Step 16: Verify no lucide imports remain and everything passes**

Run: `grep -rn "lucide-react" apps/web/src`
Expected: **no output**.

Run: `npm run lint --workspace=apps/web && npm run test --workspace=apps/web && npm run build --workspace=apps/web`
Expected: all pass.

- [ ] **Step 17: Commit**

```bash
git add apps/web/src
git commit -m "refactor(web): migrate all icons from lucide to phosphor"
```

---

### Task 6: Remove lucide dependency + clean up DesignPage

**Files:**

- Modify: `apps/web/package.json`
- Modify: `apps/web/src/pages/DesignPage.jsx`

**Interfaces:**

- Produces: `lucide-react` absent from the dependency tree; DesignPage shows the real `TimerControls` instead of temporary mockups.

- [ ] **Step 1: Uninstall lucide-react**

Run: `npm uninstall lucide-react --workspace=apps/web`
Expected: `lucide-react` removed from `apps/web/package.json` dependencies.

- [ ] **Step 2: Replace the temporary mockup sections in DesignPage**

In `apps/web/src/pages/DesignPage.jsx`:

1. Trim the Phosphor import to what stays used:

```jsx
import { ArrowLeft } from "@phosphor-icons/react";
```

2. Add the real component import (near the other component imports):

```jsx
import { TimerControls } from "@/components/TimerControls.jsx";
```

3. Delete the helper components `DemoCluster` and `DemoTime`.
4. Delete the four temporary sections: `"Timer Controls — combinação escolhida (A + B)"`, `"Timer Controls — layout (ao lado vs embaixo)"`, `"Ícone de Volta — candidatos (Phosphor)"`, and `"Play/Pause — peso do ícone (Phosphor)"`.
5. In their place add a single section:

```jsx
<Section title="Timer Controls">
  <p className="text-sm text-muted-foreground">
    Botões redondos. Horizontal (tela normal) e vertical (tela curta/PiP), nos
    estados parado e rodando.
  </p>
  <div className="flex flex-wrap items-start gap-12">
    <TimerControls
      isRunning={false}
      hasLapTime
      onStart={() => {}}
      onPause={() => {}}
      onAddLap={() => {}}
    />
    <TimerControls
      isRunning
      hasLapTime
      onStart={() => {}}
      onPause={() => {}}
      onAddLap={() => {}}
    />
    <TimerControls
      isRunning
      hasLapTime
      orientation="vertical"
      onStart={() => {}}
      onPause={() => {}}
      onAddLap={() => {}}
    />
  </div>
</Section>
```

- [ ] **Step 3: Verify lint, tests, build, and clean dependency**

Run: `grep -rn "lucide" apps/web` (expect: no output)
Run: `npm run lint --workspace=apps/web && npm run test --workspace=apps/web && npm run build --workspace=apps/web`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json package-lock.json apps/web/src/pages/DesignPage.jsx
git commit -m "chore(web): remove lucide-react and clean up design page mockups"
```

---

## Self-Review notes

- **Spec coverage:** family swap (Tasks 1,5,6) ✓; weight default bold + fill (Task 1, Task 3) ✓; size standard (Tasks 3,5 + Global Constraints) ✓; lucide→phosphor map (Task 5) ✓; round controls (Task 3) ✓; Volta=Plus (Task 3) ✓; responsive beside/below + useShortViewport (Tasks 2,4) ✓; PiP beside (Task 4) ✓; TimerDisplay Copy swap (Task 5 step 9) ✓; DesignPage cleanup + dep removal (Task 6) ✓; tests for hook + controls (Tasks 2,3) ✓.
- **Volta disabled decision:** kept functional `disabled={!hasLapTime}` (correct UX); revisit only if the faded look bothers the user in manual testing.
- **Type consistency:** `useShortViewport()` returns `boolean` used directly in Task 4; `TimerControls` prop names (`orientation`, `size`, `showLap`) consistent across Tasks 3, 4, 6.
