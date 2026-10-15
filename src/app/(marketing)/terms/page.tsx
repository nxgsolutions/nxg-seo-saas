import type { Metadata } from "next"

import { site } from "@/config/site"
import { createMetadata } from "@/config/seo"
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"

export const metadata: Metadata = createMetadata({
  title: "Terms of Service",
  description: `The terms that govern your use of ${site.name}.`,
  path: "/terms",
})

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: <p>By using {site.name}, you agree to these terms. If you don&apos;t agree, don&apos;t use the service.</p>,
  },
  {
    id: "use-of-the-service",
    title: "Use of the service",
    body: <p>You&apos;re responsible for your account and for using the platform lawfully and as intended.</p>,
  },
  {
    id: "your-data",
    title: "Your data",
    body: <p>You keep ownership of the data you bring to {site.name}, including data from connected sources.</p>,
  },
  {
    id: "availability",
    title: "Availability",
    body: <p>We work to keep the service reliable but provide it on an &quot;as is&quot; basis without warranties.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return <LegalPage title="Terms of Service" intro={`The terms that govern your use of ${site.name}.`} sections={sections} />
}
