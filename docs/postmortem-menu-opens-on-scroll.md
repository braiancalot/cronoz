# Post-mortem: menus opened by a scroll gesture

## What happened

On mobile, a finger landing on a `⋮` inside a scrolling list and dragging opened the menu mid-drag.
The row scrolled away and the list froze with the menu stranded on it.

## Why

Radix menus open on `pointerdown`. `DropdownMenu` is modal by default, so opening mounts
`RemoveScroll` and sets `pointer-events: none` on the body, which freezes the scroll.

## First fix, replaced

`modal: false` plus `onPointerCancel` closed the menu after the fact. It worked, but a non-modal
menu lets a tap outside close it _and_ land on what is under it: tapping another `ProjectCard`
navigated.

## What we do now

`useTapOnlyDropdown` (`hooks/useTapOnlyDropdown.js`) moves the open to `click`.
`preventDefault()` on the trigger's `pointerdown` suppresses Radix's handler (its
`composeEventHandlers` skips the internal one once the event is prevented), and `onClick` toggles
instead. The browser never fires a `click` after a gesture becomes a scroll, so the accidental open
can't happen. `modal` stays at its default, which keeps the outside-tap guard.

Any dropdown inside a scroller needs this hook.
