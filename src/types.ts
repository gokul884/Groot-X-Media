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
}
