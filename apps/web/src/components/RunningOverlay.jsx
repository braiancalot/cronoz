// Invisible layer over the running page: a tap pauses and is swallowed, so it
// never also acts on what's underneath. Anything that must keep working on the
// first tap (controls, back link, PiP button) sits above it with z-30.
export function RunningOverlay({ onClick }) {
  return (
    <div aria-hidden onClick={onClick} className="absolute inset-0 z-20" />
  );
}
