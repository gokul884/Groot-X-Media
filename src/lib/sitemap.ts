import fs from "fs";
import path from "path";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../blogspot-firebase-sync";
import { formatBloggerPost } from "./blogger";
import { BlogPost } from "../types";

const DOMAIN = "https://grootxmedia.com";

interface SitemapPage {
  url: string;
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
}

/**
 * Escapes special XML characters in string values
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Dynamically generates the complete XML Sitemap for Groot X Media.
 * Fetches all active blog posts from Firestore with Blogger API fallback.
 */
export async function generateSitemapXml(options: { writeToFile?: boolean; domain?: string } = {}): Promise<{ xml: string; totalUrls: number }> {
  const baseUrl = options.domain || DOMAIN;
  const staticPages: SitemapPage[] = [
    { url: `${baseUrl}/`, changefreq: "daily", priority: "1.0", lastmod: new Date().toISOString() },
    { url: `${baseUrl}/blog`, changefreq: "daily", priority: "0.9", lastmod: new Date().toISOString() },
    { url: `${baseUrl}/pricing`, changefreq: "weekly", priority: "0.8" },
    { url: `${baseUrl}/testimonials`, changefreq: "weekly", priority: "0.8" },
    { url: `${baseUrl}/contact`, changefreq: "monthly", priority: "0.8" }
  ];

  let blogPosts: BlogPost[] = [];

  // 1. Fetch posts from Firestore
  try {
    const docRef = collection(db, "blogs");
    const snapshot = await getDocs(docRef);
    snapshot.forEach((doc) => {
      const data = doc.data() as BlogPost;
      blogPosts.push({ ...data, id: data.id || doc.id });
    });
  } catch (err) {
    console.warn("[Sitemap Engine] Firestore fetch error:", err);
  }

  // 2. Fallback: Fetch directly from Blogger API if Firestore is empty
  if (blogPosts.length === 0) {
    try {
      console.log("[Sitemap Engine] Fetching posts from Blogger fallback...");
      const response = await fetch("https://grootxmediainsight.blogspot.com/feeds/posts/default?alt=json&max-results=100");
      if (response.ok) {
        const data = await response.json();
        const entries = data.feed?.entry || [];
        blogPosts = entries.map(formatBloggerPost);
      }
    } catch (bloggerErr) {
      console.error("[Sitemap Engine] Blogger fallback fetch error:", bloggerErr);
    }
  }

  const blogPages: SitemapPage[] = blogPosts.map((post) => {
    const slug = post.seo?.slug || post.id;
    const postUrl = `${baseUrl}/blog-post?post=${encodeURIComponent(slug)}`;
    let lastmod = post.updated || post.published || new Date().toISOString();
    try {
      lastmod = new Date(lastmod).toISOString();
    } catch {
      lastmod = new Date().toISOString();
    }

    return {
      url: postUrl,
      lastmod,
      changefreq: "weekly",
      priority: "0.8"
    };
  });

  const allPages = [...staticPages, ...blogPages];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const page of allPages) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
    if (page.lastmod) {
      xml += `    <lastmod>${escapeXml(page.lastmod)}</lastmod>\n`;
    }
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  // Optional: write generated sitemap to static public/dist files
  if (options.writeToFile) {
    try {
      const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
      fs.writeFileSync(publicPath, xml, "utf-8");
      console.log(`[Sitemap Engine] Updated public/sitemap.xml with ${allPages.length} URLs.`);

      const distPath = path.join(process.cwd(), "dist", "sitemap.xml");
      if (fs.existsSync(path.join(process.cwd(), "dist"))) {
        fs.writeFileSync(distPath, xml, "utf-8");
        console.log(`[Sitemap Engine] Updated dist/sitemap.xml with ${allPages.length} URLs.`);
      }
    } catch (writeErr) {
      console.warn("[Sitemap Engine] Could not write sitemap file to disk:", writeErr);
    }
  }

  return { xml, totalUrls: allPages.length };
}
