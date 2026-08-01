import { BlogPost } from "../types";

/**
 * Extracts a plain text excerpt from HTML content
 */
export function extractExcerpt(html: string, maxLen: number = 150): string {
  if (!html) return "";
  const plainText = html
    .replace(/<[^>]+>/g, " ") // Strip HTML tags safely
    .replace(/\s+/g, " ") // Collapse multiple whitespaces
    .trim();
  
  if (plainText.length <= maxLen) return plainText;
  return plainText.substring(0, maxLen).trim() + "...";
}

/**
 * Generates a clean URL slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Strip the featured (first) image tag and its entire parent wrapper hierarchy from post HTML content
 * to ensure that only a single hero cover image is rendered on the post page.
 */
export function stripFeaturedImageFromContent(html: string): string {
  if (!html) return "";

  // 1. DOMParser approach when DOM environment is available (browser runtime)
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const firstImg = doc.body.querySelector("img");
      if (firstImg) {
        let nodeToRemove: Element = firstImg;
        let current: Element | null = firstImg.parentElement;

        // Traverse up the parent chain as long as the parent contains no text content
        // and no other <img> tags besides this firstImg
        while (current && current !== doc.body) {
          const textWithoutImg = current.textContent?.replace(/[\s\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff\u00a0]+/g, "") || "";
          const otherImgs = current.querySelectorAll("img");
          if (textWithoutImg === "" && otherImgs.length === 1) {
            nodeToRemove = current;
            current = current.parentElement;
          } else {
            break;
          }
        }
        nodeToRemove.remove();
      }

      // Remove any leading empty tags or containers left at the top
      let firstChild = doc.body.firstElementChild;
      while (firstChild) {
        const textContent = firstChild.textContent?.replace(/[\s\u00a0]+/g, "") || "";
        const hasMedia = firstChild.querySelector("img, iframe, video, svg, canvas");
        if (textContent === "" && !hasMedia) {
          const next = firstChild.nextElementSibling;
          firstChild.remove();
          firstChild = next;
        } else {
          break;
        }
      }

      return doc.body.innerHTML.trim();
    } catch (e) {
      console.warn("DOMParser failed in stripFeaturedImageFromContent, using regex fallback", e);
    }
  }

  // 2. Regex fallback for Node/SSR environments
  let clean = html;

  // Match nested wrappers like <div...><a...><img...></a></div> or <p><a...><img...></a></p>
  clean = clean.replace(/^\s*(<(div|p|figure|section|header|a)[^>]*>\s*)*(<a[^>]*>\s*)?<img[^>]+>(\s*<\/a>)?(\s*<\/(div|p|figure|section|header|a)>)*/i, "");

  // If the regex above didn't strip an image, strip the first <img> directly
  if (clean === html) {
    clean = clean.replace(/<img[^>]+>/i, "");
  }

  // Strip leading empty tags/paragraphs
  clean = clean.replace(/^(\s*<(p|div|section)[^>]*>\s*(&nbsp;|<br\s*\/?>|\s*)*<\/(p|div|section)>)+/i, "").trim();

  return clean;
}

/**
 * Generate and validate SEO fields strictly adhering to length and structure rules:
 * - SEO Title: 50-60 characters, ends with '| Groot X Media' or branding
 * - Meta Description: 140-160 characters
 * - Slug: 3-8 words, lowercase, hyphenated
 * - Canonical & OG URLs
 */
export function generateAndValidateSeo(post: {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  image?: string;
  labels?: string[];
  published?: string;
  updated?: string;
  author?: string;
}): import("../types").BlogPostSeo {
  // 1. Clean URL Slug (3-8 words)
  let rawSlug = post.id || generateSlug(post.title);
  let words = rawSlug
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean);

  if (words.length < 3) {
    words.push("growth", "guide");
  }
  if (words.length > 8) {
    words = words.slice(0, 8);
  }
  const slug = words.join("-");

  // 2. SEO Title (Strictly 50 - 60 characters)
  const branding = " | Groot X Media";
  let cleanTitle = (post.title || "Digital Marketing Strategy")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let seoTitle = `${cleanTitle}${branding}`;
  if (seoTitle.length < 50) {
    const cat = post.category || "Growth";
    seoTitle = `${cleanTitle} - ${cat} Playbook${branding}`;
  }

  if (seoTitle.length > 60) {
    const maxTitleLen = 60 - branding.length; // Max length for headline part
    if (cleanTitle.length > maxTitleLen) {
      cleanTitle = cleanTitle.substring(0, maxTitleLen - 3).trim() + "...";
    }
    seoTitle = `${cleanTitle}${branding}`;
  }

  // Final length sanity enforcement (50-60 chars)
  if (seoTitle.length > 60) {
    seoTitle = seoTitle.substring(0, 57) + "...";
  } else if (seoTitle.length < 50) {
    seoTitle = (seoTitle + " Strategy").substring(0, 60);
  }

  // 3. Meta Description (Strictly 140 - 160 characters)
  let baseDesc = (post.description || post.content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (baseDesc.length < 140) {
    baseDesc = `${baseDesc} Discover actionable growth strategies, SEO insights, and marketing playbooks from Groot X Media.`;
  }

  if (baseDesc.length > 160) {
    let truncated = baseDesc.substring(0, 156);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 120) {
      truncated = truncated.substring(0, lastSpace);
    }
    baseDesc = truncated.trim() + "...";
  }

  // Ensure strict bounds between 140 and 160
  if (baseDesc.length < 140) {
    baseDesc = baseDesc.padEnd(140, ".");
  } else if (baseDesc.length > 160) {
    baseDesc = baseDesc.substring(0, 157) + "...";
  }

  const canonicalUrl = `https://grootxmedia.com/blog-post?post=${slug}`;
  const defaultImg = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80";
  const coverImage = post.image || defaultImg;

  return {
    seoTitle,
    metaDescription: baseDesc,
    slug,
    canonicalUrl,
    ogTitle: seoTitle,
    ogDescription: baseDesc,
    ogImage: coverImage,
    ogUrl: canonicalUrl,
    twitterTitle: seoTitle,
    twitterDescription: baseDesc,
    twitterImage: coverImage,
    altText: `${cleanTitle} - Groot X Media Blog`,
    imageTitle: cleanTitle,
    keywords: post.labels || [post.category || "Marketing"]
  };
}

/**
 * Calculates read time using a 200 WPM average word count
 */
export function calculateReadTime(content: string): string {
  if (!content) return "1 min read";
  const cleanText = content.replace(/<[^>]+>/g, " ");
  const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Parses date stamp into reader-friendly uppercase displays (e.g., "JUL 05, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch (e) {
    return "";
  }
}

/**
 * Extract clean URL slug from Blogger post address (e.g., /2026/07/my-new-post.html -> "my-new-post")
 */
export function extractSlugFromUrl(url: string, fallbackId: string): string {
  if (!url) return fallbackId;
  try {
    const match = url.match(/\/([^/]+)\.html$/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (e) {
    console.warn("Failed to extract slug from URL:", url, e);
  }
  return fallbackId;
}

/**
 * Sanitizes and converts Blogger / Google CDN image URLs to high-res, error-free images.
 * Fixes legacy malformed path parameters (e.g., -rw or dangling -h400) and provides fallback.
 */
export function sanitizeImageUrl(url: string): string {
  const fallback = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80";
  if (!url || typeof url !== "string") return fallback;

  let cleanUrl = url
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  if (!cleanUrl) return fallback;

  if (cleanUrl.includes("googleusercontent.com") || cleanUrl.includes("blogspot.com") || cleanUrl.includes("google.com")) {
    cleanUrl = cleanUrl
      .replace(/\/s1200-rw\/-h[0-9]+\//gi, "/s1600/")
      .replace(/-rw/gi, "")
      .replace(/\/(s|w)[0-9]+[^\/]*\//i, "/s1600/")
      .replace(/=(s|w)[0-9]+[^&]*/i, "=s1600");
  }

  return cleanUrl;
}

/**
 * Convert low-res thumbnail paths (e.g. /s72-c/ or /w100/) into high-res WebP optimized images (/s1200-rw/)
 */
export function getHighResImage(entry: any, content: string): string {
  let imgUrl = "";

  // Extract first img src from content HTML first
  if (content) {
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      imgUrl = match[1];
    }
  }

  // Fallback to entry.media$thumbnail if no image tag found in content
  if (!imgUrl && entry?.media$thumbnail?.url) {
    imgUrl = entry.media$thumbnail.url;
  }

  return sanitizeImageUrl(imgUrl);
}

export function normalizeCategory(rawLabels: string[]): { category: string; labels: string[] } {
  const normalizedLabels = (rawLabels || []).map(l => l.trim());
  let matchedCategory = "Marketing"; // Default fallback
  
  const hasKeyword = (keywords: string[]) => 
    normalizedLabels.some(l => keywords.some(k => l.toLowerCase().includes(k)));
    
  if (hasKeyword(["trends", "2026", "social media", "ai", "creator economy", "digital marketing agency"])) {
    if (hasKeyword(["social media", "trends"])) {
      matchedCategory = "New Trends";
    } else {
      matchedCategory = "Marketing";
    }
  } else if (hasKeyword(["marketing", "funnel", "conversion", "lead", "seo", "email", "analytics"])) {
    matchedCategory = "Marketing";
  } else if (hasKeyword(["finance", "cash flow", "cfo", "budget", "funding", "roi"])) {
    matchedCategory = "Finance";
  } else if (hasKeyword(["logistics", "supply chain", "delivery", "shipping", "warehouse", "fleet"])) {
    matchedCategory = "Logistics";
  } else if (hasKeyword(["current", "affairs", "compliance", "privacy", "regulation", "sovereignty", "global"])) {
    matchedCategory = "Current Affairs";
  }
  
  return {
    category: matchedCategory,
    labels: [matchedCategory]
  };
}

export const SUPPLEMENTARY_POSTS: BlogPost[] = [
  {
    id: "cfo-growth-playbook-cash-flow-2026",
    title: "CFO Growth Playbook: Navigating B2B Cash Flow & Capital in 2026",
    description: "Cash flow is the oxygen of scale. Discover modern B2B financial strategies, automated treasury tools, and capital allocation frameworks driving sustainable growth.",
    content: `
      <p>In the high-stakes world of B2B enterprise scaling, revenue is a vanity metric, while cash flow is absolute sanity. For growing organizations, managing working capital and capital allocation becomes the key differentiator between explosive market capture and sudden operational friction.</p>
      
      <h3>1. The Modern B2B Working Capital Dynamic</h3>
      <p>Traditional invoicing and 60-day payment cycles are no longer compatible with rapid scaling. Leading CFOs are shifting toward automated accounts receivable tracking and real-time ledger platforms to reduce Days Sales Outstanding (DSO) by up to 25%. By establishing dynamic discount structures for early payment, enterprises can unlock hidden liquidity directly from their existing client base.</p>
      
      <h3>2. Automated Treasury and Real-Time Forecasting</h3>
      <p>Relying on monthly spreadsheet reconciliation is a risk in today's fast-moving market. AI-driven forecasting engines now allow finance teams to simulate multiple economic scenarios, evaluating the cash flow impact of new hires, system upgrades, or inventory expansions before committing capital. Real-time dashboards provide immediate visibility into cash-burn rates, ensuring runway targets are always protected.</p>
      
      <h3>3. Capital Allocation for Scale</h3>
      <p>When selecting growth opportunities, successful CFOs employ a strict Return on Invested Capital (ROIC) framework. Every marketing campaign, regional expansion, or R&D project should compete for resources based on clear, standardized metrics. By combining organic revenue reinvestment with non-dilutive lines of credit, enterprises can fund growth confidently while maintaining full ownership control.</p>
      
      <p>Discover how Groot X Media partners with enterprise finance teams to map marketing performance directly to bottom-line financial indicators, transforming your marketing spend into a reliable profit driver.</p>
    `,
    category: "Finance",
    date: "JUL 15, 2026",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    author: "Groot X Finance Team",
    readTime: "6 min read",
    originalUrl: "",
    published: "2026-07-15T10:00:00Z",
    updated: "2026-07-15T10:00:00Z",
    labels: ["Finance"]
  },
  {
    id: "smart-logistics-ai-route-optimization",
    title: "AI-Driven Smart Logistics: Slashing B2B Fleet and Warehousing Costs by 30%",
    description: "How modern enterprises are leveraging predictive route optimization, real-time IoT tracking, and autonomous warehousing to turn logistics from a cost center into a competitive moat.",
    content: `
      <p>Supply chain complexity has grown exponentially. As customer expectations for speed and reliability hit historic highs, B2B enterprises are turning to smart logistics systems to optimize distribution networks, minimize warehousing overheads, and streamline operations.</p>
      
      <h3>1. Predictive Route Optimization and Fleet Dispatch</h3>
      <p>Dynamic routing algorithms are replacing legacy static dispatch plans. By analyzing real-time traffic, weather, port congestion, and delivery windows, AI-driven dispatch engines automatically determine the most efficient transport routes. This transition does not just speed up delivery times; it directly reduces fuel consumption and maintenance costs by up to 30%, making operations both highly profitable and sustainable.</p>
      
      <h3>2. IoT-Enabled Visibility and Quality Assurance</h3>
      <p>In B2B logistics, cargo loss and transit delays can compromise entire partnerships. Next-generation IoT sensors provide end-to-end telemetry, tracking not just GPS location, but temperature, humidity, and handling conditions. This high-resolution visibility allows logistics coordinators to proactively address transit issues before they impact the final customer, safeguarding brand trust.</p>
      
      <h3>3. Intelligent Warehousing and Demand Forecasting</h3>
      <p>Modern fulfillment requires predictive capacity planning. By integrating customer order history, market trends, and seasonal signals, intelligent forecasting platforms allow warehouses to pre-stage high-demand goods closer to key regional hubs. Automated storage and retrieval systems (ASRS) further optimize floor space and picking accuracy, drastically accelerating order-to-shipment times.</p>
      
      <p>At Groot X Media, we work with logistics and supply chain providers to translate complex operational capabilities into clear B2B value propositions, driving brand authority and contract acquisition.</p>
    `,
    category: "Logistics",
    date: "JUL 12, 2026",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    author: "Groot X Logistics Team",
    readTime: "5 min read",
    originalUrl: "",
    published: "2026-07-12T10:00:00Z",
    updated: "2026-07-12T10:00:00Z",
    labels: ["Logistics"]
  },
  {
    id: "digital-sovereignty-global-privacy-impact",
    title: "Navigating Digital Sovereignty: How New Global Privacy Regulations Impact Enterprising Brands",
    description: "With localized CDN compliance, data residency laws, and cookie-less targeting boundaries, marketing teams must build first-party relationships that respect regional boundaries.",
    content: `
      <p>The global internet landscape is rapidly shifting from a borderless open web to a framework governed by localized regulations, data residency rules, and strict digital sovereignty. For enterprise brands running campaigns across multiple jurisdictions, these compliance changes represent both a significant marketing challenge and a competitive opportunity.</p>
      
      <h3>1. The Cookieless Era and Zero-Party Data Capture</h3>
      <p>With third-party tracking cookies completely phased out and regional regulations like GDPR, CCPA, and global data privacy acts fully enforced, relying on rented advertising networks is a shrinking strategy. Enterprising brands are shifting focus toward building rich, owned first-party and zero-party data systems. Interactive tools, research reports, and custom client portals allow brands to collect highly relevant, compliant consumer preferences directly from the source.</p>
      
      <h3>2. Data Localization and Regional Compliance CDN Stacks</h3>
      <p>Digital sovereignty dictates that customer data must remain within national borders. For global websites, this requires utilizing geographically segmented CDN architectures and localized database structures. Not only does this ensure absolute legal compliance, but it also improves site speed and regional search indexing, giving brands a distinct local performance advantage over unoptimized international competitors.</p>
      
      <h3>3. Adapting to Local Algorithmic Standards</h3>
      <p>Search engines and advertising algorithms are increasingly customizing content discovery based on regional compliance standards. Marketing strategies must adapt from global campaigns to localized, context-driven content networks. This requires a profound understanding of local cultural contexts, search intent variations, and regional media channels, moving away from generic global messaging.</p>
      
      <p>The regulatory landscape may seem daunting, but at Groot X Media, we specialize in building highly resilient, privacy-first growth funnels and localized digital marketing systems that turn compliance into your strongest brand asset.</p>
    `,
    category: "Current Affairs",
    date: "JUL 10, 2026",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    author: "Groot X Policy Desk",
    readTime: "7 min read",
    originalUrl: "",
    published: "2026-07-10T10:00:00Z",
    updated: "2026-07-10T10:00:00Z",
    labels: ["Current Affairs"]
  }
];

/**
 * Restructure any arbitrary HTML content into a clean, standard 3-step layout structure
 * inspired by the "Navigating Digital Sovereignty" blog post format.
 */
export function restructureContentToStandard(title: string, rawHtml: string): string {
  // 1. Strip out script, style, meta, and custom style blocks completely
  let clean = (rawHtml || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // 2. Normalize block tags and clean attributes to extract pure text nodes safely
  clean = clean.replace(/<p\b[^>]*>/gi, "<p>")
               .replace(/<div\b[^>]*>/gi, "<div>")
               .replace(/<h([1-6])\b[^>]*>/gi, "<h$1>")
               .replace(/<span\b[^>]*>/gi, "")
               .replace(/<\/span>/gi, "")
               .replace(/&nbsp;/gi, " ");

  const headings: string[] = [];
  const paragraphs: string[] = [];

  // Match headings
  const headingRegex = /<h([1-6])>(.*?)<\/h\1>/gi;
  let headMatch;
  while ((headMatch = headingRegex.exec(clean)) !== null) {
    const txt = headMatch[2].replace(/<[^>]*>/g, "").trim();
    if (txt && txt.length > 3 && txt.length < 150) {
      headings.push(txt);
    }
  }

  // Match paragraphs
  const pRegex = /<p>(.*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(clean)) !== null) {
    const txt = pMatch[1].replace(/<[^>]*>/g, "").trim();
    if (txt && txt.length > 20) {
      paragraphs.push(txt);
    }
  }

  // Fallback if no clean p tags are found
  if (paragraphs.length < 3) {
    const textChunks = clean
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map(t => t.trim())
      .filter(t => t.length > 30);
    paragraphs.push(...textChunks);
  }

  const uniqueParas = Array.from(new Set(paragraphs));

  let h1 = headings[0] || "Establishing the Strategic Foundation";
  let h2 = headings[1] || "Building the Core Mechanics and Pipelines";
  let h3 = headings[2] || "Continuous Measurement and Scale Optimization";

  let intro = uniqueParas[0] || `In the rapidly evolving landscape of digital growth, ${title} has emerged as a cornerstone strategy for modern enterprises looking to build reliable, high-converting customer pipelines.`;
  if (uniqueParas[1] && uniqueParas[1].length < 150) {
    intro += " " + uniqueParas[1];
  }

  let p1 = uniqueParas[2] || "Establishing a solid strategy starts with understanding your user behavior and traffic channels. By building direct first-party relationships and removing frictional steps, enterprises can unlock hidden potential in their existing audiences.";
  let p2 = uniqueParas[3] || "Executing on the core mechanics requires absolute precision and clean workflows. Successful campaigns leverage automated trigger engines, localized CDNs, and robust data isolation to ensure compliance and seamless user experiences.";
  let p3 = uniqueParas[4] || "Finally, optimizing for long-term growth requires continuous evaluation of key performance metrics rather than vanity signals. Aligning your marketing investments directly to bottom-line revenue is the key to sustainable, compounding scale.";

  if (uniqueParas[5]) p1 += " " + uniqueParas[5];
  if (uniqueParas[6]) p2 += " " + uniqueParas[6];
  if (uniqueParas[7]) p3 += " " + uniqueParas[7];

  // Specific content mapping to maintain beautiful readability based on title keywords
  const titleLower = title.toLowerCase();
  if (titleLower.includes("funnel") || titleLower.includes("convert")) {
    h1 = "Mapping the Leakage Points and Intent Stages";
    h2 = "Deploying High-Intent Lead Qualification Workflows";
    h3 = "Establishing Automated Re-engagement Pipelines";
  } else if (titleLower.includes("social media") || titleLower.includes("trend")) {
    h1 = "Capitalizing on High-Value Vertical Media and Reels";
    h2 = "Nurturing Intent via Conversational Messaging Channels";
    h3 = "Leveraging First-Party Context in Cookie-Less Reach";
  } else if (titleLower.includes("digital marketing") || titleLower.includes("needs")) {
    h1 = "Capturing and Protecting First-Party Demand Direct-to-Consumer";
    h2 = "Scaling Search Visibility Through Topic Authority";
    h3 = "Aligning Customer Acquisition Directly to Financial ROI";
  }

  const conclusion = uniqueParas[uniqueParas.length - 1] || "Navigating these shifting strategic dynamics requires a reliable partner who understands the intersection of modern tech and creative distribution.";
  const cta = `At Groot X Media, we specialize in building highly resilient, privacy-first growth funnels and localized digital marketing systems that turn compliance into your strongest brand asset. Discover how Groot X Media partners with leading brands to implement robust, high-performance growth funnels, privacy-first marketing architectures, and custom digital marketing solutions that transform your presence into a compounding profit engine.`;

  const cleanHeading = (h: string, fallbackNum: number) => {
    let cleanH = h.replace(/^\d+[\.\s\-:]+\s*/, "").trim();
    return `${fallbackNum}. ${cleanH}`;
  };

  const formattedHtml = `
<p>${intro}</p>

<h3>${cleanHeading(h1, 1)}</h3>
<p>${p1}</p>

<h3>${cleanHeading(h2, 2)}</h3>
<p>${p2}</p>

<h3>${cleanHeading(h3, 3)}</h3>
<p>${p3}</p>

<p>${conclusion}</p>
<p>${cta}</p>
  `.trim();

  return formattedHtml;
}

/**
 * Format raw Blogger payload objects into BlogPost interface
 */
export function formatBloggerPost(entry: any): BlogPost {
  const rawId = entry.id?.$t || "";
  const postMatch = rawId.match(/\.post-(\d+)/);
  const numericId = postMatch ? postMatch[1] : rawId.replace(/[^a-zA-Z0-9_\-]+/g, "_");
  
  const title = entry.title?.$t || "Untitled Post";
  const url = entry.link?.find((l: any) => l.rel === "alternate")?.href || "";
  const slug = extractSlugFromUrl(url, numericId);
  
  const rawContent = entry.content?.$t || entry.summary?.$t || "";
  const image = getHighResImage(entry, rawContent);
  const cleanedContent = stripFeaturedImageFromContent(rawContent);
  const description = extractExcerpt(cleanedContent, 150);
  const rawLabels = entry.category ? entry.category.map((c: any) => c.term) : ["Marketing"];
  
  const { category, labels } = normalizeCategory(rawLabels);
  
  const publishedDate = entry.published?.$t || new Date().toISOString();
  const updatedDate = entry.updated?.$t || publishedDate;
  const date = formatDisplayDate(publishedDate);
  const author = (entry.author && entry.author[0] && entry.author[0].name?.$t) || "Groot X Team";
  const readTime = calculateReadTime(cleanedContent);

  const seo = generateAndValidateSeo({
    id: slug,
    title,
    description,
    content: cleanedContent,
    category,
    image,
    labels,
    published: publishedDate,
    updated: updatedDate,
    author
  });

  return {
    id: slug,
    title,
    description,
    content: cleanedContent,
    category,
    date,
    image,
    author,
    readTime,
    originalUrl: url,
    published: publishedDate,
    updated: updatedDate,
    labels,
    seo
  };
}

/**
 * First attempt to fetch the feed via local API proxy, then fallback to JSONP script-injection.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  let posts: BlogPost[] = [];
  try {
    const response = await fetch("/api/posts");
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log("[Blogger Fetcher] Successfully loaded posts from local API proxy.");
        posts = data;
      }
    }
  } catch (e) {
    console.warn("[Blogger Fetcher] Local API proxy failed. Attempting JSONP fallback.", e);
  }
  
  if (posts.length === 0) {
    try {
      posts = await fetchBloggerFeedViaJSONP();
    } catch (err) {
      console.warn("[Blogger Fetcher] JSONP fallback failed, using static fallback blogs.", err);
    }
  }

  // Map and clean category/labels of loaded Blogger posts, ensuring content is clean and SEO is generated
  const cleanedPosts: BlogPost[] = posts.map(post => {
    const { category, labels } = normalizeCategory(post.labels || [post.category]);
    const cleanedContent = stripFeaturedImageFromContent(post.content);
    const sanitizedImage = sanitizeImageUrl(post.image);
    const seo = post.seo || generateAndValidateSeo({
      id: post.id,
      title: post.title,
      description: post.description,
      content: cleanedContent,
      category,
      image: sanitizedImage,
      labels,
      published: post.published,
      updated: post.updated,
      author: post.author
    });

    return {
      ...post,
      content: cleanedContent,
      category,
      image: sanitizedImage,
      labels,
      seo
    };
  });

  // Supplement with our high-fidelity original posts for empty categories
  const finalPosts = [...cleanedPosts];
  SUPPLEMENTARY_POSTS.forEach(suppPost => {
    const exists = finalPosts.some(p => p.id === suppPost.id || p.title.toLowerCase().trim() === suppPost.title.toLowerCase().trim());
    if (!exists) {
      const suppSeo = suppPost.seo || generateAndValidateSeo({
        id: suppPost.id,
        title: suppPost.title,
        description: suppPost.description,
        content: suppPost.content,
        category: suppPost.category,
        image: suppPost.image,
        labels: suppPost.labels,
        published: suppPost.published,
        updated: suppPost.updated,
        author: suppPost.author
      });
      finalPosts.push({
        ...suppPost,
        seo: suppSeo
      });
    }
  });

  // Sort them by date descending
  finalPosts.sort((a, b) => {
    const timeA = a.published ? new Date(a.published).getTime() : new Date(a.date).getTime();
    const timeB = b.published ? new Date(b.published).getTime() : new Date(b.date).getTime();
    return timeB - timeA;
  });

  return finalPosts;
}

/**
 * Dynamic JSONP script-injection fallback completely bypassing client-side CORS
 * Features a safety timeout, robust parsing, and explicit error mapping.
 */
function fetchBloggerFeedViaJSONP(): Promise<BlogPost[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("DOM environments are required for JSONP fallback."));
      return;
    }

    const callbackName = `blogger_jsonp_callback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Safety Timeout (8 seconds) to reject the promise if the network blocks or Blogger fails to reply
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Blogger connection timed out. Please verify your internet connection."));
    }, 8000);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeoutId);
      cleanup();
      try {
        const entries = data.feed?.entry || [];
        if (entries.length === 0) {
          reject(new Error("No articles found in the feed."));
          return;
        }
        const posts = entries.map((entry: any) => formatBloggerPost(entry));
        resolve(posts);
      } catch (err: any) {
        reject(new Error(`Failed to parse blogger feed data: ${err.message || err}`));
      }
    };

    const script = document.createElement("script");
    script.src = `https://grootxmediainsight.blogspot.com/feeds/posts/default?alt=json-in-script&callback=${callbackName}&max-results=50`;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error("Network connection error. Failed to retrieve articles from the blog."));
    };

    function cleanup() {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    }

    document.body.appendChild(script);
  });
}
