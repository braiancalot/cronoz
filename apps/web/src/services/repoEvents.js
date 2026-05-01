const bus = new EventTarget();
const MUTATION_EVENT = "mutation";

export function emitMutation() {
  bus.dispatchEvent(new Event(MUTATION_EVENT));
}

export function onMutation(handler) {
  bus.addEventListener(MUTATION_EVENT, handler);
  return () => bus.removeEventListener(MUTATION_EVENT, handler);
}
