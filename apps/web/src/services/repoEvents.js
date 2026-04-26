const bus = new EventTarget();
const MUTATION_EVENT = "mutation";

export function emitMutation(source) {
  bus.dispatchEvent(new CustomEvent(MUTATION_EVENT, { detail: { source } }));
}

export function onMutation(handler) {
  const listener = (e) => handler(e.detail);
  bus.addEventListener(MUTATION_EVENT, listener);
  return () => bus.removeEventListener(MUTATION_EVENT, listener);
}
