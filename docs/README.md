# docs

Read this index before a non-trivial task. One line per file; keep it current.

- [IDEA.md](IDEA.md): the founding brief. Problem, use cases, stack, scope. Belongs to the user.
- [runbook-database-migrations.md](runbook-database-migrations.md): making a schema change,
  migrating Neon before a deploy, marking the baseline.
- [runbook-secret-scan.md](runbook-secret-scan.md): the gitleaks job, scanning history locally,
  allowlisting a fixture.
- [postmortem-live-query-flash.md](postmortem-live-query-flash.md): writes showed a beat late
  because `useLiveQuery` re-emits after the await; the optimistic hold pattern.
- [postmortem-toast-tap-leak.md](postmortem-toast-tap-leak.md): a swiped toast let the tap through
  to the button under it; the toast band.
- [postmortem-menu-opens-on-scroll.md](postmortem-menu-opens-on-scroll.md): Radix menus opened by a
  scroll gesture; `useTapOnlyDropdown`.
- [postmortem-card-active-flash.md](postmortem-card-active-flash.md): the whole card flashed on a
  menu tap; the stretched link.
- [postmortem-adjuster-layout-shift.md](postmortem-adjuster-layout-shift.md): the adjuster pushed
  the laps down; reserving the tallest state.
