export interface BlogPostSeo {
  seoTitle: string; // 50-60 characters
  metaDescription: string; // 140-160 characters
  slug: string; // 3-8 words, lowercase hyphenated
  canonicalUrl: string; // e.g. https://grootxmedia.com/blog-post?post=slug
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  altText: string;
  imageTitle: string;
  keywords: string[];
}

export interface BlogPost {
  id: string; // Unique slug identifier
  title: string;
  description: string; // Excerpt/summary
  content: string; // Full HTML content with optimized image paths
  category: string; // Primary category/label
  date: string; // Reader-friendly date (e.g., "JUL 05, 2026")
  image: string; // High-res optimized cover image
  author: string; // Author's name
  readTime: string; // Reading time estimate (e.g., "5 min read")
  originalUrl?: string; // Reference to original blogger URL
  published?: string; // Original published date ISO string
  updated?: string; // Original updated date ISO string
  labels?: string[]; // All labels/tags
  seo?: BlogPostSeo; // Auto-generated SEO Metadata
}
