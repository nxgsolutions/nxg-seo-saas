import { notFound } from "next/navigation"
import { CompetitiveWorkspace } from "@/components/competitive/competitive-workspace"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  if (process.env.NODE_ENV !== "development") notFound()
  const { view } = await searchParams
  return (
    <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-8">
      <CompetitiveWorkspace
        key={view === "strategy" ? "strategy" : "diagnosis"}
        mode={view === "strategy" ? "strategy" : "diagnosis"}
        preview
      />
    </main>
  )
}
