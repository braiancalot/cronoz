# Post-mortem: writes showed up a beat late

## What happened

Adding a lap closed the form on a list that didn't have the lap yet: the layout jumped, then the
lap appeared. Play and pause lagged the same way, and the hourly price field snapped back to the
old value while typing.

## Why

Awaiting a Dexie write does not mean the screen has it. `useLiveQuery` re-emits on a later tick.
A probe right after `addLap` resolved read 0 laps from the hook, and 1 lap 50ms later. Renames and
the home page already held an optimistic value; the lap, play/pause and settings paths didn't.

## What we do now

Every write the user watches holds an optimistic value until the live query catches up. The
override is `{ base, next }`: it applies only while the live record is still `base`, so any newer
live value (another tab, sync) wins over it.

| Write                      | Mechanism                                                  |
| -------------------------- | ---------------------------------------------------------- |
| Project and lap names      | `useInlineRename`                                          |
| Cards and tags on the list | the overrides in `pages/Home.jsx`                          |
| Timer, play/pause, laps    | `holdStopwatch` / `showStopwatch` in `hooks/useProject.js` |
| Settings                   | `useSetSetting` from `providers/SettingsProvider.jsx`      |

`addLap`, `removeLap` and `undeleteLap` return the `{ previous, next }` change from
`updateStopwatch` so the hook can hold `next`. The hourly price field keeps a draft
(`hooks/useHourlyPriceDraft.js`) so it can be cleared while typing; it saves only a valid number
of 0 or more and drops the draft on blur.
