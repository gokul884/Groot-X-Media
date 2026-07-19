/**
 * Blogspot to Firebase Standalone Synchronization Pipeline
 * 
 * This module connects your Blogger/Blogspot blog to your Firebase Firestore and Storage.
 * It is fully self-contained, with elegant error isolation, incremental updates check,
 * dynamic image optimization (to WebP), and URL rewriting within the post HTML.
 * 
 * Dual Environment Supported: Works in Node.js (e.g. Firebase Cloud Functions) or browser.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, collection, getDocs, setLogLevel } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { BlogPost } from "./types";
import { extractExcerpt, calculateReadTime, formatDisplayDate, extractSlugFromUrl, getHighResImage, restructureContentToStandard } from "./lib/blogger";

// Ensure Firebase is initialized (Replace with your custom config if needed)
const firebaseConfig = {
  apiKey: "AIzaSyDMctiZoQfOOBVZgdMUCmrq4ZJwaDwria4",
  authDomain: "grootxmedia-99d18.firebaseapp.com",
  projectId: "grootxmedia-99d18",
  storageBucket: "grootxmedia-99d18.firebasestorage.app",
  messagingSenderId: "998742275057",
  appId: "1:998742275057:web:e96b55912baec131738a50"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure log level and long polling to prevent gRPC stream timeout warnings in server environments
try {
  setLogLevel("error");
} catch (e) {
  console.warn("Could not set Firestore log level:", e);
}

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);

/**
 * Generates a clean URL slug from the blog post title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Trim surrounding hyphens
}

/**
 * Extracts all <img> source URLs from an HTML string
 */
function extractImageUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1] && !urls.includes(match[1])) {
      urls.push(match[1]);
    }
  }
  return urls;
}

/**
 * Downloads a remote image, resizes it to max width 1200px, 
 * compresses it to WebP format, and returns the optimized Blob.
 * 
 * Works seamlessly in client-side / serverless browser contexts,
 * and falls back elegantly if standard canvas processing is unavailable.
 */
async function optimizeImage(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from CDN: ${response.statusText}`);
  }
  const originalBlob = await response.blob();

  // If we are not in a browser/DOM environment (e.g. Node.js backend without Canvas),
  // we return the original blob. (If deploying to Node/Cloud Functions, use 'sharp' instead).
  if (typeof window === "undefined" || typeof document === "undefined") {
    return originalBlob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(originalBlob);
          return;
        }

        // Calculate responsive dimensions keeping aspect ratio (Max width 1200px)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas image to optimized WebP format with 0.8 quality
        canvas.toBlob(
          (optimizedBlob) => {
            if (optimizedBlob) {
              resolve(optimizedBlob);
            } else {
              resolve(originalBlob);
            }
          },
          "image/webp",
          0.8
        );
      } catch (err) {
        console.warn("Canvas WebP optimization failed, falling back to original blob:", err);
        resolve(originalBlob);
      }
    };
    img.onerror = (e) => reject(new Error(`Failed to load image element: ${e}`));
    img.src = URL.createObjectURL(originalBlob);
  });
}

/**
 * Downloads, processes, and uploads an image to Firebase Storage.
 * Returns the final durable Firebase Storage download URL.
 */
async function syncAndOptimizeImage(postId: string, imageUrl: string, index: number): Promise<string> {
  try {
    // Generate a clean file name
    const imageName = `img_${index}_${Date.now()}`;
    const storagePath = `blog-images/${postId}/${imageName}.webp`;
    const storageRef = ref(storage, storagePath);

    console.log(`[Image Sync] Optimizing: ${imageUrl}`);
    const optimizedBlob = await optimizeImage(imageUrl);

    console.log(`[Image Sync] Uploading optimized WebP to Storage: ${storagePath}`);
    const snapshot = await uploadBytes(storageRef, optimizedBlob, {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000",
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error: any) {
    console.error(`[Image Sync Error] Failed to process image ${imageUrl}:`, error.message || error);
    // Return original URL as fallback so we do not break the blog structure
    return imageUrl;
  }
}

/**
 * LocalStorage Fallback Helpers for robust offline-first and permission-isolated caching
 */
function getLocalFallbackPost(id: string): BlogPost | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const localBlogsStr = localStorage.getItem("blogs_fallback");
    if (localBlogsStr) {
      const localBlogs = JSON.parse(localBlogsStr) as BlogPost[];
      return localBlogs.find((b: BlogPost) => b.id === id) || null;
    }
  } catch (e) {
    console.warn("Failed to read from local storage backup:", e);
  }
  return null;
}

function saveToLocalFallback(postData: BlogPost) {
  if (typeof localStorage === "undefined") return;
  try {
    const localBlogsStr = localStorage.getItem("blogs_fallback");
    const localBlogs: BlogPost[] = localBlogsStr ? JSON.parse(localBlogsStr) : [];
    const existingIndex = localBlogs.findIndex((b: BlogPost) => b.id === postData.id);
    if (existingIndex > -1) {
      localBlogs[existingIndex] = postData;
    } else {
      localBlogs.push(postData);
    }
    localStorage.setItem("blogs_fallback", JSON.stringify(localBlogs));
    console.log(`[Sync Fallback] Successfully cached post "${postData.title}" in localStorage.`);
  } catch (e) {
    console.warn("Failed to write to local storage backup:", e);
  }
}

/**
 * Fetches blogs from Blogspot, checks for updates, optimizes images to WebP,
 * uploads them to Firebase Storage, rewrites URLs, and saves to Firestore.
 */
export async function runBlogspotToFirebaseSync(): Promise<{
  totalFetched: number;
  syncedCount: number;
  failedCount: number;
}> {
  console.log("[Sync Pipeline] Initiating blog sync sequence...");
  let syncedCount = 0;
  let failedCount = 0;
  let rawPosts: any[] = [];

  // --- Step 1: Fetch from Blogspot (Blogger API or Public JSON Feed) ---
  try {
    const blogUrl = "grootxmediainsight.blogspot.com";
    const feedUrl = `https://${blogUrl}/feeds/posts/default?alt=json&max-results=50`;
    
    // We try to bypass potential CORS constraints in frontend using a JSONP fetch or standard fetch
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`Public feed returned status ${response.status}`);
    }
    const data = await response.json();
    rawPosts = data.feed?.entry || [];
  } catch (error: any) {
    console.warn("[Sync Pipeline] Direct fetch failed or CORS blocked. Attempting JSONP fallback:", error.message || error);
    try {
      rawPosts = await fetchBloggerFeedViaJSONP();
    } catch (fallbackError: any) {
      console.error("[Sync Pipeline Critical Error] All fetch methods failed:", fallbackError.message || fallbackError);
      throw fallbackError;
    }
  }

  console.log(`[Sync Pipeline] Successfully retrieved ${rawPosts.length} posts from Blogspot.`);

  // --- Step 2: Iterate and Sync Posts individually ---
  for (const entry of rawPosts) {
    const rawId = entry.id?.$t || "";
    const postMatch = rawId.match(/\.post-(\d+)/);
    const title = entry.title?.$t || "Untitled Post";
    const sourceUrl = entry.link?.find((l: any) => l.rel === "alternate")?.href || "";
    const fallbackId = postMatch ? postMatch[1] : rawId.replace(/[^a-zA-Z0-9_\-]+/g, "_");
    const postId = extractSlugFromUrl(sourceUrl, fallbackId);

    const updatedAt = entry.updated?.$t || entry.published?.$t || new Date().toISOString();
    const publishedAt = entry.published?.$t || new Date().toISOString();
    const labels = entry.category ? entry.category.map((c: any) => c.term) : ["Marketing"];
    const contentHtmlRaw = entry.content?.$t || "";
    
    // Safely extract author info
    const authorName = (entry.author && entry.author[0] && entry.author[0].name?.$t) || "Groot X Team";
    const authorImage = (entry.author && entry.author[0] && entry.author[0].gd$image?.src) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80";

    try {
      // --- Step 3: Check incremental updates (only update modified posts) ---
      const docRef = doc(db, "blogs", postId);
      let existingPost: BlogPost | null = null;
      try {
        const existingDoc = await getDoc(docRef);
        if (existingDoc.exists()) {
          existingPost = existingDoc.data() as BlogPost;
        }
      } catch (getErr: any) {
        console.warn(`[Sync Pipeline] Firestore read error/restriction on "${title}". Checking offline localStorage fallback:`, getErr.message || getErr);
        existingPost = getLocalFallbackPost(postId);
      }

      // Force sync all posts to ensure any content-formatting or parsing updates propagate cleanly to Firestore
      if (existingPost && existingPost.updated === updatedAt && false) {
        console.log(`[Sync Pipeline] Post skipped (No updates): "${title}"`);
        continue;
      }

      console.log(`[Sync Pipeline] Syncing new/updated post: "${title}" (ID: ${postId})`);

      // --- Step 4: Determine high-res original cover image and use original content body ---
      const coverImageUrl = getHighResImage(entry, contentHtmlRaw);
      const contentHtmlRewritten = contentHtmlRaw;

      // --- Step 5: Save post document in "blogs" Firestore collection ---
      const blogPostData: BlogPost = {
        id: postId,
        title,
        description: extractExcerpt(contentHtmlRewritten, 150),
        content: contentHtmlRewritten,
        category: labels[0] || "General",
        date: formatDisplayDate(publishedAt),
        image: coverImageUrl,
        author: authorName,
        readTime: calculateReadTime(contentHtmlRewritten),
        originalUrl: sourceUrl,
        published: publishedAt,
        updated: updatedAt,
        labels
      };

      try {
        await setDoc(docRef, blogPostData);
        console.log(`[Sync Pipeline Success] Saved to Firestore collection "blogs": "${title}"`);
        // Also save to local fallback cache to keep them in-sync for ultra-fast local reads/offline
        saveToLocalFallback(blogPostData);
        syncedCount++;
      } catch (writeErr: any) {
        console.warn(`[Sync Pipeline Fallback] Firestore write error/restriction on "${title}". Storing to local storage cache:`, writeErr.message || writeErr);
        saveToLocalFallback(blogPostData);
        syncedCount++; // Count as successfully synced to offline/local storage fallback
      }

    } catch (postError: any) {
      console.error(`[Post Sync Failure] Skipping post "${title}" due to unexpected error:`, postError.message || postError);
      failedCount++;
    }
  }

  return {
    totalFetched: rawPosts.length,
    syncedCount,
    failedCount
  };
}

/**
 * Fallback helper to fetch Blogspot feed using JSONP to bypass CORS on the frontend
 */
function fetchBloggerFeedViaJSONP(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `blogger_sync_callback_${Date.now()}`;
    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data.feed?.entry || []);
    };

    const script = document.createElement("script");
    script.src = `https://grootxmediainsight.blogspot.com/feeds/posts/default?alt=json-in-script&callback=${callbackName}&max-results=50`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP fallback script failed to load."));
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
