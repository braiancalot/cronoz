# Post-mortem: the whole card flashed on a menu tap

## What happened

`ProjectCard` wrapped the whole row, menu button included, in a `<Link>` with
`hover:bg-accent active:bg-accent/80`. Tapping the menu lit up the entire card.

## Why

`:active` and `:hover` hit-test by pointer position, not by which JS handler ran, so
`stopPropagation` on the button changes nothing: any press inside the anchor's box puts it in
`:active`. Moving the menu open from `pointerdown` to `click` (see
`postmortem-menu-opens-on-scroll.md`) made it worse, since the anchor then stayed `:active` for the
whole press instead of one frame.

## What we do now

A stretched link. The `Link` is an `absolute inset-0` sibling of `CardContent`, not its wrapper, so
the menu button is never its descendant. `CardContent` has `pointer-events-none` so taps on empty
row space fall through to the link; the trigger opts back in with `pointer-events-auto`. The link
wraps no text, so it carries `aria-label={project.name}`.

`lib/floatingMenuLayout.js` holds the shared classes (`FLOATING_MENU_BUTTON`,
`FLOATING_MENU_MIN_HEIGHT`, `CLEARS_FLOATING_MENU`), consumed by `ProjectCard` and `LapCard`, so the
button's reach and the row's clearance stay in sync. Any card mixing a full-row link with an
interior control uses this shape.
