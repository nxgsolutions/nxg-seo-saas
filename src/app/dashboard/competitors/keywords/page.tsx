import CompetitiveStrategyPage from "./_components/competitive-strategy-screen"

// ?competitor=example.com opens that domain in "Where competitors actually rank"
// (linked from Keyword Analysis). searchParams is a Promise in this Next version.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const raw = (await searchParams).competitor
  const competitor = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  return <CompetitiveStrategyPage initialCompetitor={competitor || null} />
}
