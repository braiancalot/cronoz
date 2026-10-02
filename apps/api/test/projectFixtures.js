export const PROJECT_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const PROJECT_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

export function makeProject(overrides = {}) {
  return {
    id: PROJECT_1,
    name: "Cliente X",
    completedAt: null,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: null,
    stopwatch: {
      startTimestamp: null,
      currentLapTime: 0,
      isRunning: false,
      lastActiveAt: null,
      laps: [],
    },
    ...overrides,
  };
}
