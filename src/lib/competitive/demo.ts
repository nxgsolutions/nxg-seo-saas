/** Illustrative fixtures only. No live estimates or API requests. */
export const domains = ["iaspirants.com", "byjus.com", "drishtiias.com"]
export const colors = [
  "var(--chart-accent)",
  "var(--chart-pass)",
  "var(--brand)",
]
export const months = [
  "Apr 2026",
  "May 2026",
  "Jun 2026",
  "Jul 2026",
  "Aug 2026",
  "Sep 2026",
]
export const traffic = [
  [580000, 604000, 625000, 610000, 600000, 548000],
  [420000, 435000, 454000, 479000, 503000, 532000],
  [290000, 302000, 318000, 327000, 341000, 365000],
]
export const rankings = [
  [8400, 8600, 8900, 8800, 8700, 8500],
  [7200, 7350, 7600, 7800, 8200, 8600],
  [4900, 5100, 5250, 5500, 5720, 6000],
]
export const keywords = [
  {
    keyword: "upsc syllabus",
    page: "/upsc-syllabus",
    topic: "Exam essentials",
    volume: 90500,
    ranks: [9, 2, 4],
    previous: [5, 3, 5],
    impact: -18120,
    cause: "Rank decline",
  },
  {
    keyword: "upsc current affairs",
    page: "/current-affairs",
    topic: "Current affairs",
    volume: 74000,
    ranks: [12, 3, 2],
    previous: [8, 5, 4],
    impact: -15600,
    cause: "Rank decline",
  },
  {
    keyword: "upsc exam date",
    page: "/exam-date",
    topic: "Exam essentials",
    volume: 49500,
    ranks: [6, 4, 5],
    previous: [6, 4, 5],
    impact: -9880,
    cause: "Lower demand",
  },
  {
    keyword: "upsc previous year papers",
    page: "/previous-year-papers",
    topic: "Practice & revision",
    volume: 33100,
    ranks: [11, 2, 6],
    previous: [7, 4, 7],
    impact: -8400,
    cause: "Rank decline",
  },
  {
    keyword: "upsc optional subjects",
    page: "/optional-subjects",
    topic: "Exam essentials",
    volume: 14800,
    ranks: [0, 3, 5],
    previous: [0, 5, 6],
    impact: 0,
    cause: "Not ranking",
  },
  {
    keyword: "upsc answer writing",
    page: "/answer-writing",
    topic: "Practice & revision",
    volume: 12100,
    ranks: [0, 5, 2],
    previous: [0, 7, 4],
    impact: 0,
    cause: "Not ranking",
  },
  {
    keyword: "upsc preparation timetable",
    page: "/preparation-timetable",
    topic: "Preparation guides",
    volume: 8100,
    ranks: [3, 6, 8],
    previous: [5, 7, 9],
    impact: 0,
    cause: "Rank improvement",
  },
  {
    keyword: "best books for upsc",
    page: "/best-books",
    topic: "Preparation guides",
    volume: 27400,
    ranks: [4, 2, 7],
    previous: [4, 3, 8],
    impact: 0,
    cause: "Stable",
  },
]
export const compact = (n: number) =>
  Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
