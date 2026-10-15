import KeywordResearchPage from "./_components/keyword-analysis-screen"

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return <KeywordResearchPage query={q?.trim() || null} />
}
