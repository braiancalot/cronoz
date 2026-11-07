import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import projectRepository from "@/services/projectRepository.js";
import { calculateSplitTime } from "@/lib/stopwatch.js";
import { useIgnoreMilliseconds } from "./useIgnoreMilliseconds.js";

// Read-only on purpose: unlike useProject it never heartbeats, recovers or pauses the run.
export function useProjectReadout(projectId) {
  const ignoreMs = useIgnoreMilliseconds();
  const project = useLiveQuery(
    () => projectRepository.getById(projectId),
    [projectId],
  );
  const isRunning = project?.stopwatch?.isRunning ?? false;
  const [, setFrame] = useState(0);

  useEffect(() => {
    if (!isRunning) return undefined;
    let frameId;
    const tick = () => {
      setFrame((frame) => frame + 1);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning]);

  return {
    isLoading: project === undefined,
    project,
    splitTime: calculateSplitTime(project?.stopwatch, { ignoreMs }),
  };
}
