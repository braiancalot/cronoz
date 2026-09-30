import { describe, it, expect } from "vitest";
import { MAX_TAG_LENGTH, MAX_TAGS_PER_PROJECT } from "@cronoz/shared";
import {
  normalizeTag,
  tagKey,
  addTagToList,
  removeTagFromList,
  hasTag,
  collectTags,
  suggestTags,
  filterProjects,
} from "@/lib/tags.js";

describe("normalizeTag", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeTag("  Crochê  ")).toBe("Crochê");
  });

  it("collapses inner whitespace", () => {
    expect(normalizeTag("manta  de   bebê")).toBe("manta de bebê");
  });

  it("preserves the typed casing and accents", () => {
    expect(normalizeTag("Crochê")).toBe("Crochê");
  });

  it("caps the name at MAX_TAG_LENGTH without leaving a trailing space", () => {
    const long = "a".repeat(MAX_TAG_LENGTH) + " bcd";
    expect(normalizeTag(long)).toBe("a".repeat(MAX_TAG_LENGTH));
    expect(normalizeTag("a".repeat(MAX_TAG_LENGTH - 1) + " bcd")).toBe(
      "a".repeat(MAX_TAG_LENGTH - 1),
    );
  });

  it("returns an empty string for blank or non-string input", () => {
    expect(normalizeTag("   ")).toBe("");
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag(null)).toBe("");
    expect(normalizeTag(undefined)).toBe("");
    expect(normalizeTag(42)).toBe("");
  });
});

describe("tagKey", () => {
  it("is case-insensitive", () => {
    expect(tagKey("Crochê")).toBe(tagKey("crochê"));
    expect(tagKey("CROCHÊ")).toBe(tagKey("crochê"));
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(tagKey("  manta  de bebê ")).toBe(tagKey("Manta de Bebê"));
  });

  it("folds accents, so a missed accent is the same tag", () => {
    expect(tagKey("crochê")).toBe(tagKey("croche"));
    expect(tagKey("Presentação")).toBe("presentacao");
  });
});

describe("addTagToList", () => {
  it("appends the normalized name", () => {
    expect(addTagToList([], "  Crochê ")).toEqual(["Crochê"]);
  });

  it("keeps insertion order", () => {
    const tags = addTagToList(addTagToList([], "crochê"), "amigurumi");
    expect(tags).toEqual(["crochê", "amigurumi"]);
  });

  it("ignores a duplicate that differs only in case, spacing or accent", () => {
    const tags = ["Crochê"];
    expect(addTagToList(tags, "crochê")).toBe(tags);
    expect(addTagToList(tags, " CROCHÊ ")).toBe(tags);
    expect(addTagToList(tags, "croche")).toBe(tags);
  });

  it("ignores a blank name", () => {
    const tags = ["Crochê"];
    expect(addTagToList(tags, "   ")).toBe(tags);
  });

  it("ignores a new tag once the list is at the sync limit", () => {
    const full = Array.from(
      { length: MAX_TAGS_PER_PROJECT },
      (_, i) => `t${i}`,
    );
    expect(addTagToList(full, "nova")).toBe(full);
  });

  it("treats a missing list as empty", () => {
    expect(addTagToList(undefined, "crochê")).toEqual(["crochê"]);
  });

  it("does not mutate the original list", () => {
    const tags = ["crochê"];
    addTagToList(tags, "amigurumi");
    expect(tags).toEqual(["crochê"]);
  });
});

describe("removeTagFromList", () => {
  it("removes by key, ignoring case", () => {
    expect(removeTagFromList(["Crochê", "amigurumi"], "crochê")).toEqual([
      "amigurumi",
    ]);
  });

  it("returns the same list when the tag is absent", () => {
    const tags = ["crochê"];
    expect(removeTagFromList(tags, "amigurumi")).toBe(tags);
  });

  it("treats a missing list as empty", () => {
    expect(removeTagFromList(undefined, "crochê")).toEqual([]);
  });
});

describe("hasTag", () => {
  it("matches regardless of case and spacing", () => {
    expect(hasTag(["Crochê"], " crochê ")).toBe(true);
    expect(hasTag(["Crochê"], "amigurumi")).toBe(false);
    expect(hasTag(undefined, "crochê")).toBe(false);
  });
});

describe("collectTags", () => {
  it("returns an empty list when no project has tags", () => {
    expect(collectTags([{ id: "1" }, { id: "2", tags: [] }])).toEqual([]);
  });

  it("dedupes by key and keeps the first spelling seen", () => {
    const tags = collectTags([
      { id: "1", tags: ["Crochê"] },
      { id: "2", tags: ["croche"] },
    ]);

    expect(tags).toEqual([{ name: "Crochê", key: "croche", count: 2 }]);
  });

  it("sorts by usage count, then alphabetically", () => {
    const tags = collectTags([
      { id: "1", tags: ["encomenda", "amigurumi"] },
      { id: "2", tags: ["encomenda", "crochê"] },
      { id: "3", tags: ["encomenda"] },
    ]);

    expect(tags.map((t) => t.name)).toEqual([
      "encomenda",
      "amigurumi",
      "crochê",
    ]);
    expect(tags[0].count).toBe(3);
  });

  it("ignores blank entries and non-array tags", () => {
    expect(collectTags([{ id: "1", tags: ["  ", "crochê"] }])).toEqual([
      { name: "crochê", key: "croche", count: 1 },
    ]);
    expect(collectTags([{ id: "1", tags: "crochê" }])).toEqual([]);
  });

  it("tolerates a missing project list", () => {
    expect(collectTags(undefined)).toEqual([]);
  });
});

describe("suggestTags", () => {
  const allTags = collectTags([
    { id: "1", tags: ["Crochê", "amigurumi"] },
    { id: "2", tags: ["Crochê", "encomenda"] },
  ]);

  it("returns every tag for a blank query", () => {
    expect(suggestTags(allTags, "  ").map((t) => t.name)).toEqual([
      "Crochê",
      "amigurumi",
      "encomenda",
    ]);
  });

  it("matches without accents and regardless of case", () => {
    expect(suggestTags(allTags, "CROCHE").map((t) => t.name)).toEqual([
      "Crochê",
    ]);
  });

  it("matches on a substring", () => {
    expect(suggestTags(allTags, "gurumi").map((t) => t.name)).toEqual([
      "amigurumi",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(suggestTags(allTags, "tricô")).toEqual([]);
  });
});

describe("filterProjects", () => {
  const crochet = { id: "1", tags: ["Crochê"], completedAt: null };
  const amigurumi = { id: "2", tags: ["amigurumi"], completedAt: null };
  const both = { id: "3", tags: ["crochê", "amigurumi"], completedAt: 1000 };
  const untagged = { id: "4", completedAt: 2000 };
  const projects = [crochet, amigurumi, both, untagged];

  it("returns everything when nothing is selected", () => {
    expect(filterProjects(projects, {})).toEqual(projects);
    expect(filterProjects(projects)).toEqual(projects);
  });

  it("unions the selected tags", () => {
    expect(
      filterProjects(projects, { tagKeys: ["crochê", "amigurumi"] }).map(
        (p) => p.id,
      ),
    ).toEqual(["1", "2", "3"]);
  });

  it("matches a selected tag regardless of the stored casing", () => {
    expect(
      filterProjects(projects, { tagKeys: ["crochê"] }).map((p) => p.id),
    ).toEqual(["1", "3"]);
  });

  it("intersects the tag union with the completed status", () => {
    expect(
      filterProjects(projects, {
        tagKeys: ["crochê", "amigurumi"],
        completed: true,
      }).map((p) => p.id),
    ).toEqual(["3"]);

    expect(
      filterProjects(projects, {
        tagKeys: ["crochê", "amigurumi"],
        completed: false,
      }).map((p) => p.id),
    ).toEqual(["1", "2"]);
  });

  it("filters by status alone when no tag is selected", () => {
    expect(
      filterProjects(projects, { completed: true }).map((p) => p.id),
    ).toEqual(["3", "4"]);
    expect(
      filterProjects(projects, { completed: false }).map((p) => p.id),
    ).toEqual(["1", "2"]);
  });

  it("never matches an untagged project on a tag selection", () => {
    expect(filterProjects(projects, { tagKeys: ["crochê"] })).not.toContain(
      untagged,
    );
  });

  it("tolerates a missing project list", () => {
    expect(filterProjects(undefined, { tagKeys: ["crochê"] })).toEqual([]);
  });
});
