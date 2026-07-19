import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { collection, getDocs } from "firebase/firestore";
import { db, runBlogspotToFirebaseSync } from "./src/blogspot-firebase-sync";
import { formatBloggerPost } from "./src/lib/blogger";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request bodies
  app.use(express.json());

  let useFirestore = true;
  let lastFirestoreCheck = 0;
  const FIRESTORE_RETRY_INTERVAL = 5 * 60 * 1000; // Retry after 5 minutes

  /**
   * API Route: Get all blog posts
   * Fast, reliable proxy that reads directly from Firestore, falling back to direct Blogger API if needed.
   */
  app.get("/api/posts", async (req, res) => {
    const now = Date.now();
    const shouldTryFirestore = useFirestore || (now - lastFirestoreCheck > FIRESTORE_RETRY_INTERVAL);

    if (shouldTryFirestore) {
      try {
        console.log("[API Proxy] Fetching posts from Firestore...");
        const blogsCol = collection(db, "blogs");
        const snapshot = await getDocs(blogsCol);
        const posts: any[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          posts.push({
            ...data,
            id: data.id || doc.id // Ensure correct mapping of Firestore document ID to post content fields
          });
        });

        if (posts.length > 0) {
          // Sort posts by original published date descending
          posts.sort((a, b) => new Date(b.published || b.date).getTime() - new Date(a.published || a.date).getTime());
          console.log(`[API Proxy] Successfully returned ${posts.length} posts from Firestore.`);
          useFirestore = true;
          return res.json(posts);
        }
        
        console.log("[API Proxy] No posts found in Firestore. Fetching direct fallback from Blogger...");
        throw new Error("No posts in Firestore");
      } catch (error: any) {
        const errMsg = error.message || String(error);
        const isPermissionError = errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("insufficient");

        if (isPermissionError) {
          useFirestore = false;
          lastFirestoreCheck = now;
          console.info("[API Proxy] Firestore access is locked or unconfigured on custom project. Defaulting to resilient direct Blogger feed proxy.");
        } else {
          console.warn("[API Proxy] Firestore fetch failed, pulling directly from Blogger feed as fallback:", errMsg);
        }
      }
    }

    // Direct Blogger Fallback Proxy
    try {
      console.log("[API Proxy] Proxying Blogger feed directly...");
      const response = await fetch("https://grootxmediainsight.blogspot.com/feeds/posts/default?alt=json&max-results=50");
      if (!response.ok) {
        throw new Error(`Blogger returned status ${response.status}`);
      }
      const data: any = await response.json();
      const entries = data.feed?.entry || [];
      const posts = entries.map((entry: any) => formatBloggerPost(entry));
      return res.json(posts);
    } catch (fallbackError: any) {
      console.error("[API Proxy] All fallback channels failed:", fallbackError.message || fallbackError);
      return res.status(502).json({ error: "Failed to load posts from all channels." });
    }
  });

  /**
   * API Route: Trigger Automated Backend Sync
   * Secure endpoint that checks for ?secret=CRON_SECRET and syncs posts with Firestore.
   */
  app.get("/api/sync-blog", async (req, res) => {
    const providedSecret = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || "grootx_sync_token_88df92a";

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.warn(`[API Sync] Blocked unauthorized sync attempt from IP ${req.ip}`);
      return res.status(401).json({ error: "Unauthorized. Missing or invalid secret." });
    }

    console.log("[API Sync] CRON request authorized. Starting synchronization pipeline...");
    try {
      const result = await runBlogspotToFirebaseSync();
      console.log(`[API Sync] Synchronization complete. Fetched: ${result.totalFetched}, Synced: ${result.syncedCount}, Failed: ${result.failedCount}`);
      return res.json({
        success: true,
        message: "Synchronization completed successfully.",
        ...result,
      });
    } catch (syncError: any) {
      console.error("[API Sync] Fatal synchronization failure:", syncError.message || syncError);
      return res.status(500).json({
        success: false,
        error: syncError.message || "Unknown error during sync",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite middleware in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving production static assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical startup error:", err);
});
