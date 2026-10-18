# Post-mortem: a toast leaked taps to the button under it

## What happened

The update prompt was a Sonner toast with `duration: Infinity`, sitting on top of `+ Novo projeto`
on the home page. Swiping it away created projects.

## Why

Sonner dismisses a swiped toast on `pointerup`, before the browser fires the synthetic `click`.
The bar is `velocity > 0.11` px/ms, about 5px of finger drift in 40ms, and `touch-action: none` on
the toast keeps that drift from turning into a scroll, so the click is never suppressed. The toast
vanishes mid-gesture and the click lands on whatever is underneath.

## What we do now

- Never place a toast over a tap target.
- Persistent notices live in the document flow. `UpdateBanner` renders above the `<Outlet />` and
  pushes the page down.
- The timer page reserves `TOAST_BAND` (`components/timer/stageLayout.js`) under the header so a
  toast never covers the timer. The `Toaster` offset in `App.jsx`, `.cn-toast` in `globals.css`
  (the extra attribute selectors beat Sonner's injected rule) and the band move together.
- The toast is 44px: 10px padding around a 24px action button, with `min-height` holding that for
  toasts without a button. The title is clamped to one line (`nowrap`, ellipsis, `min-width: 0` on
  `[data-content]`), since a second line would outgrow the band. The band follows the toast.
- The project list scrolls, so covering a row costs nothing: its undos pass `UNDO_ON_LIST`
  (`lib/undoToast.js`) and land at the bottom. Deleting a project from its page fires the toast
  after `navigate("/")`, so it counts as a list undo.
