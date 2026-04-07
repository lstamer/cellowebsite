/**
 * export-blog-content-docs.mts
 *
 * Fetches every published Sanity post and writes one markdown file per post
 * to docs/site-content/blog/<slug>.md.
 *
 * Also updates the <!-- JOURNAL_SECTION_START --> ... <!-- JOURNAL_SECTION_END -->
 * block inside docs/site-content/SITEMAP.md with a fresh list of post links.
 *
 * Usage:
 *   npx tsx scripts/export-blog-content-docs.mts
 *
 * Requires a .env.local (or environment) with:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=...
 *   NEXT_PUBLIC_SANITY_DATASET=...   (defaults to "production")
 */

import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Bootstrap env from .env.local if it exists (no external dotenv dep needed)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env.local may not exist in CI — that is fine
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

// ---------------------------------------------------------------------------
// Sanity client
// ---------------------------------------------------------------------------
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01";

if (!projectId) {
  console.error("ERROR: NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false });
const builder = imageUrlBuilder({ projectId, dataset });

function sanityImageUrl(source: SanityImageSource): string | null {
  try {
    return builder.image(source).auto("format").width(1200).url();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Portable Text → Markdown (minimal walker, no external deps)
// ---------------------------------------------------------------------------

type PTMark = string;

interface PTSpan {
  _type: "span";
  text?: string | null;
  marks?: PTMark[];
}

interface PTBlock {
  _type: "block";
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: (PTSpan | Record<string, unknown>)[];
  markDefs?: { _key: string; _type: string; href?: string }[];
}

interface PTImage {
  _type: "image";
  asset?: { _ref?: string };
  alt?: string;
}

type PTNode = PTBlock | PTImage | Record<string, unknown>;

function renderMark(text: string, marks: PTMark[], markDefs: PTBlock["markDefs"] = []): string {
  let result = text;
  for (const mark of marks) {
    if (mark === "strong") result = `**${result}**`;
    else if (mark === "em") result = `*${result}*`;
    else if (mark === "code") result = `\`${result}\``;
    else if (mark === "underline") result = `<u>${result}</u>`;
    else if (mark === "strike-through") result = `~~${result}~~`;
    else {
      // Check if it's a link markDef key
      const def = markDefs.find((d) => d._key === mark);
      if (def?._type === "link" && def.href) {
        result = `[${result}](${def.href})`;
      }
    }
  }
  return result;
}

function blockToMarkdown(node: PTNode): string {
  if ((node as PTImage)._type === "image") {
    const img = node as PTImage;
    if (!img.asset?._ref) return "";
    const url = sanityImageUrl(img as SanityImageSource);
    if (!url) return "";
    return `\n![${img.alt ?? ""}](${url})\n`;
  }

  if ((node as PTBlock)._type !== "block") return "";

  const block = node as PTBlock;
  const markDefs = block.markDefs ?? [];

  const inlineText = (block.children ?? [])
    .map((child) => {
      const span = child as PTSpan;
      if (span._type !== "span") return "";
      const raw = span.text ?? "";
      return renderMark(raw, span.marks ?? [], markDefs);
    })
    .join("");

  const style = block.style ?? "normal";

  // List items
  if (block.listItem === "bullet") return `- ${inlineText}`;
  if (block.listItem === "number") return `1. ${inlineText}`;

  switch (style) {
    case "h1": return `# ${inlineText}`;
    case "h2": return `## ${inlineText}`;
    case "h3": return `### ${inlineText}`;
    case "h4": return `#### ${inlineText}`;
    case "blockquote": return `> ${inlineText}`;
    default: return inlineText;
  }
}

function portableTextToMarkdown(body: PTNode[]): string {
  const lines: string[] = [];
  let prevWasList = false;

  for (const node of body) {
    const block = node as PTBlock;
    const isList = !!(block.listItem);

    if (!isList && prevWasList) lines.push("");
    if (isList && !prevWasList && lines.length) lines.push("");

    const md = blockToMarkdown(node);
    if (md.trim()) {
      lines.push(md);
      if (!isList) lines.push("");
    }

    prevWasList = isList;
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------------------------
// Date formatting (same locale as the app)
// ---------------------------------------------------------------------------
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Date coming soon";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Date coming soon";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function estimateReadingTime(body: PTNode[]): number {
  const text = body
    .filter((b) => (b as PTBlock)._type === "block")
    .map((b) =>
      ((b as PTBlock).children ?? [])
        .map((c) => (c as PTSpan).text ?? "")
        .join(" ")
    )
    .join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

// ---------------------------------------------------------------------------
// Fetch + write
// ---------------------------------------------------------------------------
interface SanityPostFull {
  _id: string;
  title: string;
  slug: { current?: string };
  publishedAt?: string;
  excerpt?: string;
  category?: string;
  mainImage?: { asset?: { _ref?: string }; alt?: string } | null;
  body: PTNode[];
}

const posts: SanityPostFull[] = await client.fetch(
  `*[_type == "post"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, excerpt, category,
    mainImage { asset, alt },
    body
  }`
);

if (posts.length === 0) {
  console.log("No posts found in Sanity. Nothing to export.");
  process.exit(0);
}

const blogDir = resolve(root, "docs/site-content/blog");
mkdirSync(blogDir, { recursive: true });

const sitemapLinks: string[] = [];

for (const post of posts) {
  const slug = post.slug?.current?.trim();
  if (!slug) {
    console.warn(`Skipping post "${post.title}" — no slug`);
    continue;
  }

  const formattedDate = formatDate(post.publishedAt);
  const readingTime = estimateReadingTime(post.body ?? []);
  const imageUrl = post.mainImage?.asset?._ref
    ? sanityImageUrl(post.mainImage as SanityImageSource)
    : null;

  const bodyMd = portableTextToMarkdown(post.body ?? []);

  const lines: string[] = [
    `# ${post.title}`,
    "",
    `**Route:** \`/blog/${slug}\``,
    `**Source:** Sanity CMS — document type \`post\`, id \`${post._id}\``,
    "",
    "## Metadata",
    "",
    `- **Title:** ${post.title} — Stamer Cello`,
    `- **Description:** ${post.excerpt ?? `Read "${post.title}" on the Stamer Cello journal.`}`,
    "",
    "## Post Details",
    "",
    `| Field | Value |`,
    `|---|---|`,
    `| Category | ${post.category ?? "—"} |`,
    `| Author | Lukas Stamer |`,
    `| Published | ${formattedDate} |`,
    `| Reading time | ${readingTime} min read |`,
    `| Slug | \`${slug}\` |`,
  ];

  if (post.excerpt) {
    lines.push("", "## Excerpt", "", `> ${post.excerpt}`);
  }

  if (imageUrl) {
    lines.push("", "## Cover Image", "", `![${post.mainImage?.alt ?? post.title}](${imageUrl})`);
    if (post.mainImage?.alt) {
      lines.push("", `*Alt text: "${post.mainImage.alt}"*`);
    }
  }

  lines.push("", "---", "", "## Body", "");

  if (bodyMd) {
    lines.push(bodyMd);
  } else {
    lines.push("*No content available for this post.*");
  }

  const filePath = resolve(blogDir, `${slug}.md`);
  writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");
  console.log(`  ✓ docs/site-content/blog/${slug}.md`);

  sitemapLinks.push(`- [${post.title}](./blog/${slug}.md) — \`/blog/${slug}\``);
}

// ---------------------------------------------------------------------------
// Patch SITEMAP.md journal section
// ---------------------------------------------------------------------------
const sitemapPath = resolve(root, "docs/site-content/SITEMAP.md");
const sitemapContent = readFileSync(sitemapPath, "utf-8");

const sectionStart = "<!-- JOURNAL_SECTION_START -->";
const sectionEnd = "<!-- JOURNAL_SECTION_END -->";

const replacement = [
  sectionStart,
  "",
  sitemapLinks.join("\n"),
  "",
  sectionEnd,
].join("\n");

const startIdx = sitemapContent.indexOf(sectionStart);
const endIdx = sitemapContent.indexOf(sectionEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const patched =
    sitemapContent.slice(0, startIdx) +
    replacement +
    sitemapContent.slice(endIdx + sectionEnd.length);
  writeFileSync(sitemapPath, patched, "utf-8");
  console.log("  ✓ SITEMAP.md journal section updated");
}

console.log(`\nExported ${posts.length} post(s) to docs/site-content/blog/`);
