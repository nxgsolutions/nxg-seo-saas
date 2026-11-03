import { SiteScoreOverview } from "./_components/site-score-screen"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Globe } from "lucide-react"

/** The full SEO Score breakdown. Reached by clicking the score on the
 * Page Audit page. */
export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Globe className="size-5 text-primary" /> SEO score
          </>
        }
        description="Your overall site score, category averages, the pages scored and site-wide technical checks."
        backHref="/dashboard/page-audit"
        backLabel="Page Audit"
      />
      <Card>
        <CardContent className="pt-6">
          <SiteScoreOverview />
        </CardContent>
      </Card>
    </div>
  )
}
