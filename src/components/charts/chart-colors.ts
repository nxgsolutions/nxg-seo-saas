/**
 * Shared categorical line colors for the competitor rank chart. Kept in its own
 * module (no recharts import) so the trend panel's competitor toggle chips can
 * colour-match the chart lines without pulling the lazy chart chunk into the
 * panel's bundle. Index by the competitor's position in the full series list so
 * a given competitor keeps its colour whether or not others are hidden.
 */
export const RANK_LINE_COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6",
  "#e34948", "#008380",
]
