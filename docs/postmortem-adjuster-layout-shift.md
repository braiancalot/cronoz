# Post-mortem: opening the adjuster pushed the laps down

## What happened

The timer stage swaps the plain timer for the adjuster in place. The adjuster is taller (its
steppers outgrow the digits), so the section grew on open and the laps below shifted down and lost
height.

## Why hand-sizing fails

The `row` layout's height rides the display's viewport clamp and the `flank` one rides the stepper
metrics. No fixed number matches both, the same reason `TimerSlot` gives.

## What we do now

Reserve by rendering the real thing invisibly. `AdjusterFrame` owns the arrangement,
`TimerAdjuster` fills it with the steppers, and `TimerAdjustSlot` renders the same frame with the
chrome veiled (`visibility: hidden` keeps the box and drops it from the tab order and the a11y
tree) around the plain timer. The real timer sits in the frame's own display slot, so the digits
land on the same pixel in both states; an `absolute`-centred overlay would have re-centred them.

`AdjustActions` mirrors `TimerControls`' sizes, gaps and orientation so the side column never
resizes either. `MinimalStage` opts out: nothing sits below its timer, and a split-screen stage
can't spare the height.
