// Query-flag helpers for the dev-only banner simulation in
// useServiceWorkerUpdate, which is where the gate lives.
export const SIMULATE_PARAM = "swupdate";

export function hasSimulateFlag(search) {
  return new URLSearchParams(search).has(SIMULATE_PARAM);
}

export function hrefWithoutSimulateFlag(href) {
  const url = new URL(href);
  url.searchParams.delete(SIMULATE_PARAM);
  return url.toString();
}
