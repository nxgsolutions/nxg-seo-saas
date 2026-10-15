"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Download,
  FlaskConical,
  Globe,
  Lightbulb,
  ScanSearch,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  colors,
  compact,
  domains,
  keywords,
  months,
  rankings,
  traffic,
} from "@/lib/competitive/demo"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"

const tooltip = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
}
const tick = { fill: "var(--muted-foreground)", fontSize: 11 }

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="h-11 w-full min-w-0 rounded-lg border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Donut({
  data,
  value,
  label,
}: {
  data: { name: string; value: number; color: string }[]
  value: string
  label: string
}) {
  return (
    <>
      <div
        className="relative h-60"
        role="img"
        aria-label={`${label}: ${value}. ${data.map((d) => `${d.name}: ${compact(d.value)}`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltip}
              formatter={(v) => compact(Number(v))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-3xl tracking-tight">{value}</strong>
          <span className="mt-1 text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="flex-1">{d.name}</span>
            <strong>{compact(d.value)}</strong>
          </div>
        ))}
      </div>
    </>
  )
}

export function CompetitiveWorkspace({
  mode,
  preview = false,
}: {
  mode: "diagnosis" | "strategy"
  preview?: boolean
}) {
  const diagnosis = mode === "diagnosis"
  const [competitor, setCompetitor] = useState("1")
  const [period, setPeriod] = useState("5")
  const [metric, setMetric] = useState("traffic")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [order, setOrder] = useState("volume")
  const [pageView, setPageView] = useState("keywords")
  const ci = Number(competitor)
  const month = Number(period)
  const current = traffic[0][month]
  const previous = traffic[0][month - 1]
  const change = current - previous
  const rankImpact = Math.round(change * 0.81)
  const demandImpact = change - rankImpact
  const totalTraffic = traffic.reduce((sum, series) => sum + series[month], 0)
  const share = (current / totalTraffic) * 100
  const isGap = (row: (typeof keywords)[number]) =>
    row.ranks[0] === 0 || row.ranks[0] > row.ranks[ci]
  const rows = keywords
    .filter(
      (row) =>
        (row.keyword + row.page).toLowerCase().includes(query.toLowerCase()) &&
        (filter === "all" ||
          (filter === "missing"
            ? row.ranks[0] === 0
            : filter === "gap"
              ? isGap(row)
              : row.impact < 0)),
    )
    .sort((a, b) =>
      order === "volume"
        ? b.volume - a.volume
        : diagnosis
          ? a.impact - b.impact
          : (b.ranks[0] || 100) -
            b.ranks[ci] -
            ((a.ranks[0] || 100) - a.ranks[ci]),
    )
  const series = metric === "traffic" ? traffic : rankings
  const trend = months
    .slice(0, month + 1)
    .map((name, i) => ({
      name: name.slice(0, 3),
      you: series[0][i],
      competitor: series[ci][i],
    }))
  const contributions = [
    {
      name: "Ranking changes · 81%",
      value: Math.abs(rankImpact),
      color: colors[0],
    },
    {
      name: "Search demand · 19%",
      value: Math.abs(demandImpact),
      color: colors[2],
    },
  ]
  const shareData = domains.map((name, i) => ({
    name,
    value: traffic[i][month],
    color: colors[i],
  }))
  const topics = [...new Set(keywords.map((k) => k.topic))].map((name) => ({
    name,
    you: keywords.filter(
      (k) => k.topic === name && k.ranks[0] > 0 && k.ranks[0] <= 10,
    ).length,
    competitor: keywords.filter((k) => k.topic === name && k.ranks[ci] <= 10)
      .length,
  }))
  const href = (view: string) =>
    preview
      ? `/preview/competitive?view=${view}`
      : `/dashboard/competitive-${view}`
  const stats = diagnosis
    ? [
        [
          "Estimated traffic",
          compact(current),
          `${months[month]} · monthly visits`,
        ],
        [
          "Traffic change",
          `${change > 0 ? "+" : ""}${compact(change)}`,
          `${((change / previous) * 100).toFixed(1)}% vs ${months[month - 1]}`,
        ],
        [
          "Impact from rankings",
          compact(rankImpact),
          "81% of the estimated change",
        ],
        [
          "Impact from demand",
          compact(demandImpact),
          "19% of the estimated change",
        ],
      ]
    : [
        [
          "Your traffic share",
          `${share.toFixed(1)}%`,
          "Across the three demo domains",
        ],
        ["Competitor traffic", compact(traffic[ci][month]), domains[ci]],
        [
          "Ranking keywords",
          compact(rankings[ci][month]),
          `vs ${compact(rankings[0][month])} for your domain`,
        ],
        [
          "Keyword gaps",
          String(keywords.filter(isGap).length),
          "Within the 8-keyword sample",
        ],
      ]

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <ScanSearch className="size-4" /> Research / Competitive
            intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Competitive {diagnosis ? "Diagnosis" : "Strategy"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {diagnosis
              ? "Understand what changed, why it happened, and where to focus next."
              : "See where competitors win organic search — and find your next opportunity."}
          </p>
        </div>
        <Badge variant="default">
          <FlaskConical data-icon="inline-start" /> Static preview
        </Badge>
      </header>
      <nav
        aria-label="Competitive research"
        className="flex flex-wrap gap-2 border-b pb-4"
      >
        {(["diagnosis", "strategy"] as const).map((view) => (
          <Link
            key={view}
            href={href(view)}
            aria-current={mode === view ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              mode === view
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {view === "diagnosis" ? (
              <ScanSearch className="size-4" />
            ) : (
              <TrendingUp className="size-4" />
            )}
            Competitive {view === "diagnosis" ? "Diagnosis" : "Strategy"}
          </Link>
        ))}
      </nav>
      <Alert>
        <FlaskConical />
        <AlertTitle>Explore with sample data</AlertTitle>
        <AlertDescription>
          Illustrative India · English · desktop data. Filters and exports work
          locally; these are not live SEO measurements.
        </AlertDescription>
      </Alert>
      <section
        aria-label="Comparison settings"
        className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
          Your domain
          <div className="flex h-11 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-foreground">
            <Globe className="size-4 text-muted-foreground" />
            {domains[0]}
            <Badge variant="outline" className="ml-auto">
              You
            </Badge>
          </div>
        </div>
        <Picker
          label="Compare against"
          value={competitor}
          onChange={setCompetitor}
          options={domains
            .slice(1)
            .map((label, i) => ({ label, value: String(i + 1) }))}
        />
        <Picker
          label={
            diagnosis ? "Month-over-month comparison" : "Reporting through"
          }
          value={period}
          onChange={setPeriod}
          options={[5, 4, 3].map((i) => ({
            value: String(i),
            label: diagnosis ? `${months[i]} vs ${months[i - 1]}` : months[i],
          }))}
        />
        <div className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
          Market
          <div className="flex h-11 items-center rounded-lg border px-3 text-sm text-foreground">
            India · English · Desktop
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, detail]) => (
          <Card key={label} className="gap-3">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>
                <span className="text-3xl tabular-nums tracking-tight">
                  {value}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {diagnosis ? (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <Panel
              title="Month-over-month performance"
              description={`Estimated organic visits · ${months[month - 1]} → ${months[month]}`}
            >
              <div
                className="h-72"
                role="img"
                aria-label={`Your traffic changed from ${previous} to ${current}. Competitor traffic changed from ${traffic[ci][month - 1]} to ${traffic[ci][month]}.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: months[month - 1],
                        you: previous,
                        competitor: traffic[ci][month - 1],
                      },
                      {
                        name: months[month],
                        you: current,
                        competitor: traffic[ci][month],
                      },
                    ]}
                    barGap={8}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      tick={tick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={compact}
                      tick={tick}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      formatter={(v) => compact(Number(v))}
                    />
                    <Bar
                      dataKey="you"
                      name={domains[0]}
                      fill={colors[0]}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="competitor"
                      name={domains[ci]}
                      fill={colors[ci]}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={64}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Legend competitor={ci} />
              <p className="mt-5 text-sm text-muted-foreground">
                Your traffic {change < 0 ? "fell" : "grew"} by{" "}
                <strong className="text-foreground">
                  {compact(Math.abs(change))}
                </strong>
                , while {domains[ci]} grew by{" "}
                <strong className="text-foreground">
                  {compact(traffic[ci][month] - traffic[ci][month - 1])}
                </strong>
                .
              </p>
            </Panel>
            <Panel
              title="What drove the change?"
              description="Estimated contribution to your traffic movement"
            >
              <Donut
                data={contributions}
                value={compact(change)}
                label="net traffic change"
              />
            </Panel>
          </div>
          <Alert>
            <Lightbulb />
            <AlertTitle>Ranking changes are the main driver</AlertTitle>
            <AlertDescription>
              <p>
                {compact(Math.abs(rankImpact))} of the{" "}
                {compact(Math.abs(change))} visit decline is attributed to
                rankings in this demo. Start with syllabus and current affairs
                content; compare the pages ranking above you.
              </p>
              <Link
                className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                href={href("strategy")}
              >
                Explore competitor strategy <ArrowRight className="size-4" />
              </Link>
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
            <Panel
              title="Organic search performance"
              description={`April – ${months[month]} · compare your search footprint`}
            >
              <div className="mb-5 max-w-60">
                <Picker
                  label="Chart metric"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "traffic", label: "Estimated traffic" },
                    { value: "keywords", label: "Ranking keywords" },
                  ]}
                />
              </div>
              <div
                className="h-64"
                role="img"
                aria-label={`${metric === "traffic" ? "Traffic" : "Ranking keyword"} trend for ${domains[0]} and ${domains[ci]}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trend}
                    margin={{ top: 10, right: 12, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      tick={tick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={tick}
                      tickFormatter={compact}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={tooltip}
                      formatter={(v) => compact(Number(v))}
                    />
                    <Line
                      type="monotone"
                      dataKey="you"
                      name={domains[0]}
                      stroke={colors[0]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="competitor"
                      name={domains[ci]}
                      stroke={colors[ci]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Legend competitor={ci} />
            </Panel>
            <Panel
              title="Organic traffic share"
              description={`${months[month]} · all three sample domains`}
            >
              <Donut
                data={shareData}
                value={`${share.toFixed(1)}%`}
                label="your share of traffic"
              />
            </Panel>
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Panel
              title="Where competitors are investing"
              description="Top-10 keyword coverage by topic · 8-keyword sample"
            >
              <div
                className="h-64"
                role="img"
                aria-label="Top ten keyword counts by topic for your domain and the selected competitor"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topics}
                    margin={{ left: 0, right: 12 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="var(--chart-grid)"
                    />
                    <XAxis type="number" allowDecimals={false} tick={tick} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={tick}
                      width={115}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltip} />
                    <Bar
                      dataKey="you"
                      name={domains[0]}
                      fill={colors[0]}
                      radius={[0, 3, 3, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="competitor"
                      name={domains[ci]}
                      fill={colors[ci]}
                      radius={[0, 3, 3, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Legend competitor={ci} />
            </Panel>
            <Panel
              title="Your next moves"
              description={`Opportunities against ${domains[ci]}`}
            >
              <ol className="flex flex-col gap-6">
                {[
                  [
                    "Close the content gaps",
                    "Build dedicated guides for optional subjects and answer writing — you do not rank in the sample.",
                  ],
                  [
                    "Refresh high-demand essentials",
                    `Study ${domains[ci]}'s syllabus coverage and improve the depth and freshness of your guide.`,
                  ],
                  [
                    "Defend your existing strengths",
                    "Keep preparation timetables fresh. You already lead both competitors on this keyword.",
                  ],
                ].map(([title, body], i) => (
                  <li className="flex gap-3" key={title}>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </>
      )}
      <Panel
        title={
          diagnosis
            ? "Keywords & pages behind the change"
            : "Discover your competitor’s winning keywords"
        }
        description={`September 2026 detail sample · ${domains[0]} vs ${domains[ci]} · independent of the overview period`}
      >
        <div className="mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
            Search keywords or pages
            <Input
              className="h-11"
              placeholder="e.g. syllabus"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <Picker
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All keywords" },
              { value: "gap", label: "Competitor ahead" },
              { value: "missing", label: "Missing keywords" },
              ...(diagnosis
                ? [{ value: "declining", label: "Traffic declines" }]
                : []),
            ]}
          />
          <Picker
            label="View"
            value={pageView}
            onChange={setPageView}
            options={[
              { value: "keywords", label: "Keywords" },
              { value: "pages", label: "Landing pages" },
            ]}
          />
          <Picker
            label="Sort by"
            value={order}
            onChange={setOrder}
            options={[
              { value: "volume", label: "Highest volume" },
              {
                value: "impact",
                label: diagnosis
                  ? "Biggest traffic loss"
                  : "Largest ranking gap",
              },
            ]}
          />
          <Button
            variant="outline"
            size="xl"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `competitive-${mode}-sample`,
                [
                  "Keyword",
                  "Your page",
                  "Volume",
                  "Your rank",
                  "Competitor",
                  "Competitor rank",
                  "Traffic change",
                  "Cause",
                ],
                rows.map((r) => [
                  r.keyword,
                  r.page,
                  r.volume,
                  r.ranks[0] || "Not ranking",
                  domains[ci],
                  r.ranks[ci],
                  r.impact,
                  r.cause,
                ]),
              )
            }
          >
            <Download data-icon="inline-start" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[780px] text-left text-sm">
            <caption className="sr-only">
              September sample keyword comparison, {rows.length} results
            </caption>
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                {[
                  pageView === "keywords"
                    ? "Keyword / landing page"
                    : "Landing page / keyword",
                  "Search volume",
                  "Your rank",
                  "Competitor rank",
                  diagnosis ? "Traffic change" : "Opportunity",
                  diagnosis ? "Primary driver" : "Topic",
                ].map((h) => (
                  <th scope="col" key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.keyword} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {pageView === "keywords" ? row.keyword : row.page}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pageView === "keywords" ? row.page : row.keyword}
                    </p>
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    {row.volume.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 tabular-nums">
                    {row.ranks[0] || "Not ranking"}
                    {diagnosis && row.ranks[0] > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        was {row.previous[0]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 tabular-nums">{row.ranks[ci]}</td>
                  <td className="px-4 py-4">
                    {diagnosis ? (
                      <span
                        className={cn(
                          "tabular-nums",
                          row.impact < 0 && "text-destructive",
                        )}
                      >
                        {row.impact ? compact(row.impact) : "—"}
                      </span>
                    ) : (
                      <Badge variant={isGap(row) ? "default" : "outline"}>
                        {row.ranks[0] === 0
                          ? "Create content"
                          : isGap(row)
                            ? "Improve page"
                            : "Defend position"}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {diagnosis ? row.cause : row.topic}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No matching keywords. Try another search or choose All
                    keywords.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {rows.length} of {keywords.length} sample keywords
          </span>
          <span>Not ranking = outside the sample’s tracked positions</span>
        </div>
      </Panel>
      <p className="pb-4 text-xs leading-5 text-muted-foreground">
        Static concept for design review. Traffic, attribution, rankings, and
        recommendations are illustrative. No competitor data is fetched or
        saved.
      </p>
    </div>
  )
}

function Legend({ competitor }: { competitor: number }) {
  return (
    <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
      {[0, competitor].map((i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ background: colors[i] }}
          />
          {domains[i]}
          {i === 0 ? " (you)" : ""}
        </span>
      ))}
    </div>
  )
}
