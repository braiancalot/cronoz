// Lets the update banner be shown on demand, without deploying a new build.
export const SIMULATE_PARAM = "swupdate";

export function hasSimulateFlag(search) {
  return new URLSearchParams(search).has(SIMULATE_PARAM);
}

export function hrefWithoutSimulateFlag(href) {
  const url = new URL(href);
  url.searchParams.delete(SIMULATE_PARAM);
  return url.toString();
}
