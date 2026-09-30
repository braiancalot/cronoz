import { MAX_TAG_LENGTH, MAX_TAGS_PER_PROJECT } from "@cronoz/shared";

// normalizeTag is the spelling shown; tagKey is the identity. Case and
// accents fold into the key, so "croche" reuses the "Crochê" already typed
// elsewhere instead of becoming a near-duplicate.
export function normalizeTag(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH).trim();
}

export function tagKey(name) {
  return normalizeTag(name)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function hasTag(tags, name) {
  const key = tagKey(name);
  if (!key || !Array.isArray(tags)) return false;
  return tags.some((tag) => tagKey(tag) === key);
}

export function addTagToList(tags, raw) {
  const list = Array.isArray(tags) ? tags : [];
  const name = normalizeTag(raw);
  if (!name || hasTag(list, name)) return tags ?? list;
  if (list.length >= MAX_TAGS_PER_PROJECT) return tags ?? list;
  return [...list, name];
}

export function removeTagFromList(tags, name) {
  const list = Array.isArray(tags) ? tags : [];
  if (!hasTag(list, name)) return tags ?? list;
  const key = tagKey(name);
  return list.filter((tag) => tagKey(tag) !== key);
}

// There is no tag table: the vocabulary is derived from the projects, and
// the first spelling seen wins.
export function collectTags(projects) {
  const byKey = new Map();

  for (const project of projects ?? []) {
    if (!Array.isArray(project?.tags)) continue;
    for (const tag of project.tags) {
      const key = tagKey(tag);
      if (!key) continue;
      const entry = byKey.get(key);
      if (entry) entry.count += 1;
      else byKey.set(key, { name: normalizeTag(tag), key, count: 1 });
    }
  }

  return [...byKey.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"),
  );
}

export function suggestTags(allTags, query) {
  const q = tagKey(query);
  if (!q) return allTags;
  return allTags.filter((tag) => tag.key.includes(q));
}

// Tags union with each other; completed intersects with them. Absent (or
// null) completed leaves the status unconstrained.
export function filterProjects(projects, { tagKeys = [], completed } = {}) {
  const keys = new Set(tagKeys.map(tagKey).filter(Boolean));

  return (projects ?? []).filter((project) => {
    if (keys.size > 0 && !project.tags?.some((tag) => keys.has(tagKey(tag)))) {
      return false;
    }
    if (completed === true && project.completedAt == null) return false;
    if (completed === false && project.completedAt != null) return false;
    return true;
  });
}
