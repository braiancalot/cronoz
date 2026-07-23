// An invisible layer that covers the page while the timer runs. A tap anywhere
// it covers pauses and is swallowed, so the first tap never also acts on what's
// underneath. The controls, the back link and the PiP button sit above it (they
// carry z-30), so those keep working with a single tap.
export function RunningOverlay({ onClick }) {
  return (
    <div aria-hidden onClick={onClick} className="absolute inset-0 z-20" />
  );
}
