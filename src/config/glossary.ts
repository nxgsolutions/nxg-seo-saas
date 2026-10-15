/**
 * SEO glossary content. Real, plain-English definitions — genuinely useful,
 * not thin filler. Powers /glossary and /glossary/[slug].
 */
export interface GlossaryTerm {
  slug: string
  term: string
  short: string
  definition: string
}

export const glossaryTerms: GlossaryTerm[] = [
  { slug: "seo", term: "SEO", short: "Search engine optimization.", definition: "Search Engine Optimization is the practice of improving a website so it ranks higher in organic (unpaid) search results, bringing more relevant visitors from search engines like Google." },
  { slug: "serp", term: "SERP", short: "The search results page.", definition: "A Search Engine Results Page is the page shown after a query. Beyond the classic ten blue links it often includes features like featured snippets, People Also Ask, images, videos and ads." },
  { slug: "keyword", term: "Keyword", short: "A term people search for.", definition: "A keyword is a word or phrase people type into search. In SEO, keywords are the targets you research, group and optimize content around." },
  { slug: "search-intent", term: "Search Intent", short: "The goal behind a query.", definition: "Search intent is what a searcher is actually trying to do — learn something (informational), find a site (navigational), compare options (commercial) or buy (transactional). Matching intent is essential to ranking." },
  { slug: "keyword-difficulty", term: "Keyword Difficulty", short: "How hard a keyword is to rank for.", definition: "Keyword difficulty estimates how competitive a keyword is, based on who currently ranks and how strong their pages are. Lower difficulty usually means a more realistic target." },
  { slug: "search-volume", term: "Search Volume", short: "How often a keyword is searched.", definition: "Search volume is the average number of searches a keyword gets, usually per month. Truly precise volume isn't available for free; Search Console impressions and Google Trends provide first-party and relative signals instead." },
  { slug: "impressions", term: "Impressions", short: "How often you appeared in search.", definition: "An impression is counted each time your page appears in search results for a query. In Search Console, impressions are a reliable, first-party measure of demand for pages you already rank for." },
  { slug: "ctr", term: "CTR", short: "Click-through rate.", definition: "Click-Through Rate is the share of impressions that result in a click (clicks ÷ impressions). A low CTR at a good position often means your title and description need work." },
  { slug: "backlink", term: "Backlink", short: "A link from another site.", definition: "A backlink is a link from one website to another. Search engines treat quality backlinks as votes of confidence, and they remain a significant ranking factor." },
  { slug: "featured-snippet", term: "Featured Snippet", short: "An answer box at the top of results.", definition: "A featured snippet is a highlighted answer Google pulls from a page and shows above the normal results. Winning one can capture significant clicks for informational queries." },
  { slug: "canonical-url", term: "Canonical URL", short: "The preferred version of a page.", definition: "A canonical URL tells search engines which version of similar or duplicate pages is the primary one to index, consolidating ranking signals onto a single URL." },
  { slug: "crawlability", term: "Crawlability", short: "How easily bots reach your pages.", definition: "Crawlability is how well search engine bots can discover and access your pages. Robots rules, internal linking and site structure all affect it." },
  { slug: "indexability", term: "Indexability", short: "Whether a page can be indexed.", definition: "Indexability is whether a crawled page is eligible to appear in search results. Noindex tags, canonicals and duplicate content can all keep a page out of the index." },
  { slug: "rank-tracking", term: "Rank Tracking", short: "Monitoring positions over time.", definition: "Rank tracking records where your pages rank for chosen keywords over time, so you can spot gains and losses and connect them to traffic changes." },
  { slug: "keyword-clustering", term: "Keyword Clustering", short: "Grouping related keywords.", definition: "Keyword clustering groups related keywords into topics so you can target a set of terms with one comprehensive page instead of many thin ones." },
  { slug: "long-tail-keyword", term: "Long-tail Keyword", short: "A longer, more specific query.", definition: "A long-tail keyword is a longer, more specific phrase with lower volume but usually clearer intent and less competition — often easier to rank for and quicker to convert." },
]

export const glossaryBySlug = new Map(glossaryTerms.map((t) => [t.slug, t]))
