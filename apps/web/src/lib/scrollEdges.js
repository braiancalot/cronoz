// Subpixel scroll positions can stop a hair short of the real edge.
const EDGE_TOLERANCE = 1;

export function hiddenScrollEdges({ scrollLeft, scrollWidth, clientWidth }) {
  return {
    start: scrollLeft > EDGE_TOLERANCE,
    end: scrollWidth - clientWidth - scrollLeft > EDGE_TOLERANCE,
  };
}
