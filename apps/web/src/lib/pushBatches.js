// Settings are a handful of keys, so they ride with the first batch.
export function splitPushBatches({ projects, settings, batchSize }) {
  const batches = [];
  for (let start = 0; start < projects.length; start += batchSize) {
    batches.push({
      projects: projects.slice(start, start + batchSize),
      settings: [],
    });
  }
  if (batches.length === 0) batches.push({ projects: [], settings: [] });
  batches[0].settings = settings;
  return batches;
}
