import { describe, it, expect } from "vitest";
import {
  lapSchema,
  stopwatchSchema,
  projectSchema,
  settingSchema,
  pushRequestSchema,
  pullRequestSchema,
} from "../index.js";

describe("lapSchema", () => {
  it("accepts a valid lap", () => {
    const lap = {
      id: crypto.randomUUID(),
      name: "Base",
      lapTime: 5000,
      createdAt: Date.now(),
    };
    expect(lapSchema.parse(lap)).toEqual(lap);
  });

  it("accepts a lap with updatedAt and deletedAt", () => {
    const lap = {
      id: crypto.randomUUID(),
      name: "Base",
      lapTime: 5000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    expect(lapSchema.parse(lap)).toEqual(lap);
  });

  it("rejects a lap without id", () => {
    expect(() => lapSchema.parse({ name: "Base", lapTime: 5000 })).toThrow();
  });

  it("rejects lapTime as string", () => {
    expect(() =>
      lapSchema.parse({
        id: crypto.randomUUID(),
        name: "Base",
        lapTime: "5000",
        createdAt: Date.now(),
      }),
    ).toThrow();
  });

  it("rejects invalid uuid", () => {
    expect(() =>
      lapSchema.parse({
        id: "not-a-uuid",
        name: "Base",
        lapTime: 5000,
        createdAt: Date.now(),
      }),
    ).toThrow();
  });
});

describe("stopwatchSchema", () => {
  it("accepts a valid stopwatch", () => {
    const stopwatch = {
      startTimestamp: null,
      currentLapTime: 0,
      isRunning: false,
      lastActiveAt: null,
      laps: [],
    };
    expect(stopwatchSchema.parse(stopwatch)).toEqual(stopwatch);
  });

  it("accepts a running stopwatch with laps", () => {
    const stopwatch = {
      startTimestamp: Date.now(),
      currentLapTime: 5000,
      isRunning: true,
      lastActiveAt: Date.now(),
      laps: [
        {
          id: crypto.randomUUID(),
          name: "Base",
          lapTime: 3000,
          createdAt: Date.now(),
        },
      ],
    };
    expect(stopwatchSchema.parse(stopwatch)).toEqual(stopwatch);
  });

  it("rejects a stopwatch without isRunning", () => {
    expect(() =>
      stopwatchSchema.parse({
        startTimestamp: null,
        currentLapTime: 0,
        lastActiveAt: null,
        laps: [],
      }),
    ).toThrow();
  });
});

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    const project = {
      id: crypto.randomUUID(),
      name: "Projeto #1",
      completedAt: null,
      createdAt: Date.now(),
      stopwatch: {
        startTimestamp: null,
        currentLapTime: 0,
        isRunning: false,
        lastActiveAt: null,
        laps: [],
      },
    };
    expect(projectSchema.parse(project)).toEqual(project);
  });

  it("accepts a project with updatedAt and deletedAt", () => {
    const project = {
      id: crypto.randomUUID(),
      name: "Projeto #2",
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      stopwatch: {
        startTimestamp: null,
        currentLapTime: 0,
        isRunning: false,
        lastActiveAt: null,
        laps: [],
      },
    };
    expect(projectSchema.parse(project)).toEqual(project);
  });

  it("rejects a project without stopwatch", () => {
    expect(() =>
      projectSchema.parse({
        id: crypto.randomUUID(),
        name: "Test",
        completedAt: null,
        createdAt: Date.now(),
      }),
    ).toThrow();
  });

  it("rejects invalid stopwatch shape", () => {
    expect(() =>
      projectSchema.parse({
        id: crypto.randomUUID(),
        name: "Test",
        completedAt: null,
        createdAt: Date.now(),
        stopwatch: { isRunning: true },
      }),
    ).toThrow();
  });
});

describe("settingSchema", () => {
  it("accepts a valid setting", () => {
    const setting = { key: "hourlyPrice", value: 10 };
    expect(settingSchema.parse(setting)).toEqual(setting);
  });

  it("accepts a setting with updatedAt", () => {
    const setting = { key: "hourlyPrice", value: 10, updatedAt: Date.now() };
    expect(settingSchema.parse(setting)).toEqual(setting);
  });
});

describe("sync schemas", () => {
  it("accepts a valid push request", () => {
    const req = { projects: [], settings: [] };
    expect(pushRequestSchema.parse(req)).toEqual(req);
  });

  it("accepts a valid pull request", () => {
    const req = { cursor: 0 };
    expect(pullRequestSchema.parse(req)).toEqual(req);
  });

  it("rejects push request with missing fields", () => {
    expect(() => pushRequestSchema.parse({})).toThrow();
    expect(() => pushRequestSchema.parse({ projects: [] })).toThrow();
  });

  it("rejects pull request with string cursor", () => {
    expect(() => pullRequestSchema.parse({ cursor: "abc" })).toThrow();
  });

  it("accepts push request with full project data", () => {
    const req = {
      projects: [
        {
          id: crypto.randomUUID(),
          name: "Projeto #1",
          completedAt: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null,
          stopwatch: {
            startTimestamp: null,
            currentLapTime: 0,
            isRunning: false,
            lastActiveAt: null,
            laps: [],
          },
        },
      ],
      settings: [{ key: "hourlyPrice", value: 10, updatedAt: Date.now() }],
    };
    expect(pushRequestSchema.parse(req)).toEqual(req);
  });
});
