import type { Metadata } from "next"

import { site } from "@/config/site"
import { createMetadata } from "@/config/seo"
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page"

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description: `How ${site.name} handles your data.`,
  path: "/privacy",
})

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        {site.name} respects your privacy. This policy explains what we collect, how we use it, and the choices you
        have.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>We collect only what we need to run the service:</p>
        <ul>
          <li>Account details you provide, such as your name and email address.</li>
          <li>Data you choose to connect, such as Google Search Console, to power the product.</li>
          <li>Basic usage information that helps us keep the platform reliable and secure.</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    body: <p>To provide and improve the service, communicate with you, and keep the platform secure. We do not sell your data.</p>,
  },
  {
    id: "connected-data",
    title: "Connected data sources",
    body: (
      <p>
        Data from connected sources stays within your workspace and is used only to provide features to you. You can
        disconnect a source at any time from your workspace settings.
      </p>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices",
    body: <p>You can access, update or delete your account information, and ask us questions about your data, at any time.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about privacy? Email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`What ${site.name} collects, how it's used, and the choices you have.`}
      sections={sections}
    />
  )
}
