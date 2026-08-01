import { BlogPost } from "./types";
import { fetchBlogPosts, stripFeaturedImageFromContent, sanitizeImageUrl } from "./lib/blogger";

// --- Global State ---
let allPosts: BlogPost[] = [];
let currentCategory = "All";
let searchQuery = "";

// --- Helper: Render SVG Icons via Lucide ---
function refreshIcons() {
  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

// --- Helper: Inject Lazy Loading Styles ---
function injectLazyLoadingStyles() {
  if (document.getElementById("lazy-loading-styles")) return;
  const style = document.createElement("style");
  style.id = "lazy-loading-styles";
  style.textContent = `
    .post-thumb .img.lazy-img, .feat-card .media .img.lazy-img {
      opacity: 0;
      filter: blur(4px);
      transition: opacity 0.6s var(--ease), filter 0.6s var(--ease), transform 0.6s var(--ease) !important;
    }
    .post-thumb .img.lazy-img.loaded, .feat-card .media .img.lazy-img.loaded {
      opacity: 1;
      filter: blur(0);
    }
  `;
  document.head.appendChild(style);
}

// --- Helper: Intersection Observer Lazy Loading for Images ---
function initLazyLoading() {
  injectLazyLoadingStyles();
  const lazyImages = document.querySelectorAll(".lazy-img");
  
  if (!("IntersectionObserver" in window)) {
    lazyImages.forEach((img) => {
      const src = img.getAttribute("data-src");
      if (src) {
        const el = img as HTMLElement;
        el.style.backgroundImage = `url('${src}')`;
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        img.classList.add("loaded");
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLElement;
        const src = img.getAttribute("data-src");
        if (src) {
          const preloader = new Image();
          preloader.src = src;
          preloader.onload = () => {
            img.style.backgroundImage = `url('${src}')`;
            img.style.backgroundRepeat = "no-repeat";
            img.style.backgroundSize = "cover";
            img.style.backgroundPosition = "center";
            img.classList.add("loaded");
          };
          preloader.onerror = () => {
            const fallbackSrc = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80";
            img.style.backgroundImage = `url('${fallbackSrc}')`;
            img.style.backgroundRepeat = "no-repeat";
            img.style.backgroundSize = "cover";
            img.style.backgroundPosition = "center";
            img.classList.add("loaded");
          };
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: "50px 0px",
    threshold: 0.01
  });

  lazyImages.forEach((img) => {
    if (!img.classList.contains("loaded")) {
      imageObserver.observe(img);
    }
  });
}

// --- UI Rendering Engine: Homepage ---
function renderHomepage(posts: BlogPost[]) {
  const blogGrid = document.querySelector("#blog .blog-grid") as HTMLElement;
  if (!blogGrid) return;

  if (posts.length === 0) {
    blogGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--muted); width: 100%;">
        <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 10px;">No articles loaded yet</p>
        <p style="font-size: 0.9rem;">Check back soon for latest growth strategies!</p>
      </div>
    `;
    return;
  }

  // Render first 3 posts
  const postsToRender = posts.slice(0, 3);
  let htmlContent = "";

  postsToRender.forEach((post, index) => {
    const postUrl = `/blog-post?post=${post.id}`;

    htmlContent += `
      <article class="post-card" style="--i:${index}">
        <a href="${postUrl}" class="post-thumb">
          <div class="img lazy-img" data-src="${post.image}" style="background-size: cover; background-position: center; width: 100%; height: 100%;"></div>
          <span class="post-tag">${post.category}</span>
        </a>
        <div class="post-body">
          <div class="post-meta">
            <span><i data-lucide="calendar" width="13" height="13"></i>${post.date}</span>
            <span><i data-lucide="clock" width="13" height="13"></i>${post.readTime}</span>
          </div>
          <h3><a href="${postUrl}">${post.title}</a></h3>
          <p>${post.description || ""}</p>
          <a href="${postUrl}" class="post-more" aria-label="Read More about ${post.title}">Read More <i data-lucide="arrow-right" width="15" height="15"></i></a>
        </div>
      </article>
    `;
  });

  blogGrid.innerHTML = htmlContent;
  initLazyLoading();
  refreshIcons();
}

// --- UI Rendering Engine: Blog Page ---
function renderBlogpage() {
  const featuredSection = document.getElementById("blog-featured-section") as HTMLElement;
  const blogGrid = document.querySelector("#blog-grid-section .blog-grid") as HTMLElement;
  const latestArticlesHeaderSpan = document.querySelector(".postsec .h span") as HTMLElement;
  const gridSection = document.getElementById("blog-grid-section") as HTMLElement;
  const skeleton = document.getElementById("blog-loading-skeleton") as HTMLElement;

  if (!blogGrid) return;

  const filtered = allPosts.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(searchQuery);
    const categoryMatch = post.category ? post.category.toLowerCase().includes(searchQuery) : false;
    const labelsMatch = post.labels ? post.labels.some(label => label.toLowerCase().includes(searchQuery)) : false;
    const contentMatch = post.content.toLowerCase().includes(searchQuery);
    const matchesSearch = titleMatch || categoryMatch || labelsMatch || contentMatch;

    if (currentCategory === "All") {
      return matchesSearch;
    } else {
      const hasLabel = post.labels && post.labels.some(label => label.toLowerCase() === currentCategory.toLowerCase());
      return matchesSearch && hasLabel;
    }
  });

  if (latestArticlesHeaderSpan) {
    latestArticlesHeaderSpan.textContent = `Showing ${filtered.length} of ${allPosts.length}`;
  }

  if (filtered.length === 0) {
    if (featuredSection) featuredSection.style.display = "none";
    if (skeleton) skeleton.style.display = "none";
    if (gridSection) gridSection.style.display = "block";
    blogGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted); width: 100%;">
        <p style="font-size: 1.2rem; font-weight: 500; margin-bottom: 10px;">No articles found</p>
        <p style="font-size: 0.95rem;">Try adjusting your search terms or selecting another category.</p>
      </div>
    `;
    return;
  }

  let featuredPost: BlogPost | null = null;
  let gridPosts: BlogPost[] = [];

  if (currentCategory === "All" && searchQuery === "") {
    featuredPost = filtered[0];
    gridPosts = filtered.slice(1);
    if (featuredSection) featuredSection.style.display = "block";
  } else {
    if (featuredSection) featuredSection.style.display = "none";
    gridPosts = filtered;
  }

  // Render Featured Card
  if (featuredPost && featuredSection) {
    const postUrl = `/blog-post?post=${featuredPost.id}`;
    const authorName = featuredPost.author || "Groot X Team";
    const authorAvatarHtml = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--orange); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;">${authorName.charAt(0).toUpperCase()}</div>`;

    featuredSection.innerHTML = `
      <div class="wrap">
        <article class="feat-card reveal in">
          <a href="${postUrl}" class="media">
            <div class="img lazy-img" data-src="${featuredPost.image}" style="background-size: cover; background-position: center; width: 100%; height: 100%;"></div>
            <span class="tag">Featured</span>
          </a>
          <div class="body">
            <span class="badge">${featuredPost.category}</span>
            <h2>${featuredPost.title}</h2>
            <p>${featuredPost.description || ""}</p>
            <div class="meta">
              <span class="author">
                <span class="avatar">${authorAvatarHtml}</span>
                ${authorName}
              </span>
              <span><i data-lucide="calendar" width="14" height="14"></i>${featuredPost.date}</span>
              <span><i data-lucide="clock" width="14" height="14"></i>${featuredPost.readTime}</span>
            </div>
            <a href="${postUrl}" class="btn btn-primary">Read More <i data-lucide="arrow-right" width="16" height="16"></i></a>
          </div>
        </article>
      </div>
    `;
  }

  // Render Grid Cards
  let gridHtml = "";
  gridPosts.forEach((post, index) => {
    const postUrl = `/blog-post?post=${post.id}`;

    gridHtml += `
      <article class="post-card" style="--i:${index}">
        <a href="${postUrl}" class="post-thumb">
          <div class="img lazy-img" data-src="${post.image}" style="background-size: cover; background-position: center; width: 100%; height: 100%;"></div>
          <span class="post-tag">${post.category}</span>
        </a>
        <div class="post-body">
          <div class="post-meta">
            <span><i data-lucide="calendar" width="13" height="13"></i>${post.date}</span>
            <span><i data-lucide="clock" width="13" height="13"></i>${post.readTime}</span>
          </div>
          <h3><a href="${postUrl}">${post.title}</a></h3>
          <p>${post.description || ""}</p>
          <a href="${postUrl}" class="post-more" aria-label="Read More about ${post.title}">Read More <i data-lucide="arrow-right" width="15" height="15"></i></a>
        </div>
      </article>
    `;
  });

  blogGrid.innerHTML = gridHtml;

  // Hide skeleton, show grid section
  if (skeleton) {
    skeleton.style.display = "none";
  }
  if (gridSection) {
    gridSection.style.display = "block";
  }

  initLazyLoading();
  refreshIcons();
}

// --- UI Rendering Engine: Blog Post Detail Page ---
function renderBlogPostDetail(posts: BlogPost[]) {
  // Extract slug/ID from query parameter ?post=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const postParam = (urlParams.get("post") || urlParams.get("id")) || "";
  
  // Find matching article (either by slug ID or originalUrl match as fallback)
  let post = posts.find(
    (p) => 
      p.id.toLowerCase() === postParam.toLowerCase() || 
      (p.originalUrl && p.originalUrl.includes(postParam))
  );

  // Fallback to the latest dynamic post from the database to ensure we never display the static template
  if (!post && posts.length > 0) {
    post = posts[0];
    console.log(`[Blog Detail] No valid 'post' parameter. Defaulting to latest dynamic post: "${post.title}"`);
  }

  if (!post) {
    console.warn(`[Blog Detail] No posts found to display.`);
    return;
  }

  console.log(`[Blog Detail] Successfully loaded post: "${post.title}"`);

  // 1. Update Document Title & SEO Meta Tags
  const seo = post.seo;
  const seoTitle = seo?.seoTitle || `${post.title} | Groot X Media`;
  const metaDesc = seo?.metaDescription || post.description;
  const canonicalUrl = seo?.canonicalUrl || `https://grootxmedia.com/blog-post?post=${post.id}`;
  const coverImageUrl = post.image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80";

  document.title = seoTitle;

  const setMeta = (attr: string, key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  };

  setMeta("name", "description", metaDesc);
  setMeta("name", "robots", "index, follow");
  setLink("canonical", canonicalUrl);

  // Open Graph
  setMeta("property", "og:type", "article");
  setMeta("property", "og:title", seoTitle);
  setMeta("property", "og:description", metaDesc);
  setMeta("property", "og:image", coverImageUrl);
  setMeta("property", "og:url", canonicalUrl);

  // Twitter
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", seoTitle);
  setMeta("name", "twitter:description", metaDesc);
  setMeta("name", "twitter:image", coverImageUrl);

  // Article JSON-LD Schema
  let articleSchemaScript = document.getElementById("jsonld-article-schema");
  if (!articleSchemaScript) {
    articleSchemaScript = document.createElement("script");
    articleSchemaScript.id = "jsonld-article-schema";
    articleSchemaScript.setAttribute("type", "application/ld+json");
    document.head.appendChild(articleSchemaScript);
  }
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": seoTitle,
    "description": metaDesc,
    "image": [coverImageUrl],
    "datePublished": post.published || new Date().toISOString(),
    "dateModified": post.updated || post.published || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author || "Groot X Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Groot X Media",
      "logo": {
        "@type": "ImageObject",
        "url": "https://grootxmedia.com/logo_head.png"
      }
    }
  };
  articleSchemaScript.textContent = JSON.stringify(articleSchema, null, 2);

  // Breadcrumb JSON-LD Schema
  let breadcrumbSchemaScript = document.getElementById("jsonld-breadcrumb-schema");
  if (!breadcrumbSchemaScript) {
    breadcrumbSchemaScript = document.createElement("script");
    breadcrumbSchemaScript.id = "jsonld-breadcrumb-schema";
    breadcrumbSchemaScript.setAttribute("type", "application/ld+json");
    document.head.appendChild(breadcrumbSchemaScript);
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://grootxmedia.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://grootxmedia.com/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": canonicalUrl }
    ]
  };
  breadcrumbSchemaScript.textContent = JSON.stringify(breadcrumbSchema, null, 2);

  // 2. Update Breadcrumbs & Category Badge
  const crumbsSpan = document.querySelector(".crumbs span");
  if (crumbsSpan) crumbsSpan.textContent = post.category;

  const catBadge = document.querySelector(".art-cat");
  if (catBadge) {
    catBadge.textContent = post.category;
    catBadge.innerHTML = post.category;
  }

  // 3. Update Title, Subtitle, and Metadata Info
  const mainTitle = document.querySelector(".art-head h1");
  if (mainTitle) mainTitle.textContent = post.title;

  const subtitle = document.querySelector(".art-head .sub");
  if (subtitle) {
    subtitle.textContent = post.description;
  }

  // Byline Meta
  const authorNode = document.querySelector(".art-byline .author");
  if (authorNode) {
    const avatarHtml = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--orange); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600;">${post.author.charAt(0).toUpperCase()}</div>`;
    authorNode.innerHTML = `<span class="avatar">${avatarHtml}</span>${post.author}`;
  }

  // Select Date and Read-Time nodes safely by traversing art-byline spans
  const bylineSpans = document.querySelectorAll(".art-byline span");
  bylineSpans.forEach(span => {
    if (span.querySelector("[data-lucide='calendar']")) {
      span.innerHTML = `<i data-lucide="calendar" width="15" height="15"></i>${post.date}`;
    } else if (span.querySelector("[data-lucide='clock']")) {
      span.innerHTML = `<i data-lucide="clock" width="15" height="15"></i>${post.readTime}`;
    }
  });

  // 3.5. Update Social Sharing Links
  const currentUrl = window.location.href;
  const postTitle = post.title;
  
  const twitterBtn = document.querySelector(".share a[aria-label='Twitter']");
  if (twitterBtn) {
    twitterBtn.setAttribute("href", `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(postTitle)}`);
    twitterBtn.setAttribute("target", "_blank");
    twitterBtn.setAttribute("rel", "noopener noreferrer");
  }

  const linkedinBtn = document.querySelector(".share a[aria-label='LinkedIn']");
  if (linkedinBtn) {
    linkedinBtn.setAttribute("href", `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`);
    linkedinBtn.setAttribute("target", "_blank");
    linkedinBtn.setAttribute("rel", "noopener noreferrer");
  }

  const facebookBtn = document.querySelector(".share a[aria-label='Facebook']");
  if (facebookBtn) {
    facebookBtn.setAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`);
    facebookBtn.setAttribute("target", "_blank");
    facebookBtn.setAttribute("rel", "noopener noreferrer");
  }

  const copyLinkBtn = document.querySelector(".share a[aria-label='Copy link']") as HTMLElement;
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(currentUrl).then(() => {
        const originalContent = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = `<span style="font-size: 0.65rem; font-weight: 700; color: white;">Copied!</span>`;
        copyLinkBtn.style.backgroundColor = "var(--orange)";
        copyLinkBtn.style.borderColor = "var(--orange)";
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalContent;
          copyLinkBtn.style.backgroundColor = "";
          copyLinkBtn.style.borderColor = "";
          refreshIcons();
        }, 2000);
      }).catch(err => {
        console.error("Failed to copy link:", err);
      });
    });
  }

  // 4. Update Cover Image (single img element, no background-image tiling)
  const coverImg = document.querySelector(".cover .img") as HTMLElement;
  if (coverImg) {
    coverImg.classList.remove("skeleton-card");
    coverImg.style.backgroundImage = "none";
    coverImg.style.backgroundRepeat = "no-repeat";
    coverImg.style.backgroundSize = "cover";
    coverImg.style.backgroundPosition = "center";
    const coverUrl = sanitizeImageUrl(post.image);
    const fallbackUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80";
    coverImg.innerHTML = `<img src="${coverUrl}" alt="${post.title}" onerror="this.onerror=null; this.src='${fallbackUrl}';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px; display: block;" />`;
  }

  // 5. Populate Main Article HTML Body
  const articleContainer = document.querySelector(".article");
  if (articleContainer) {
    // Strip featured image from post content using robust helper
    const cleanedHtml = stripFeaturedImageFromContent(post.content);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanedHtml.replace(/&nbsp;/gi, " ");
    
    // Specifically remove leading &nbsp; or literal empty nodes from content
    while (tempDiv.firstElementChild && tempDiv.firstElementChild.textContent?.trim() === "" && !tempDiv.firstElementChild.querySelector("img, iframe, video")) {
        tempDiv.firstElementChild.remove();
    }
    
    // Apply consistent line spacing to all paragraphs
    tempDiv.querySelectorAll('p').forEach(p => {
      p.style.lineHeight = '1.7';
      p.style.marginBottom = '20px';
    });

    // Secondary safety check: ensure no residual featured image is left at the top of the body
    const firstImg = tempDiv.querySelector("img");
    if (firstImg) {
      let isAtTop = true;
      let prev = firstImg.previousSibling;
      while (prev) {
        if (prev.textContent && prev.textContent.trim() !== "") {
          isAtTop = false;
          break;
        }
        prev = prev.previousSibling;
      }
      
      if (isAtTop) {
        let nodeToRemove: Element = firstImg;
        let current: Element | null = firstImg.parentElement;
        while (current && current !== tempDiv) {
          const textWithoutImg = current.textContent?.replace(/\s+/g, "") || "";
          if (textWithoutImg === "") {
            nodeToRemove = current;
            current = current.parentElement;
          } else {
            break;
          }
        }
        nodeToRemove.remove();
      }
    }

    articleContainer.innerHTML = tempDiv.innerHTML;
    articleContainer.classList.add("in");

    // Append labels/tags at the bottom
    if (post.labels && post.labels.length > 0) {
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "tags";
      post.labels.forEach((tag) => {
        const tagLink = document.createElement("a");
        tagLink.href = "/blog";
        tagLink.textContent = `#${tag}`;
        tagsContainer.appendChild(tagLink);
      });
      articleContainer.appendChild(tagsContainer);
    }
  }

  // 6. Populate Author Profile Block
  const authorBox = document.querySelector(".authorbox");
  if (authorBox) {
    authorBox.classList.add("in");
  }
  const authorBoxInner = document.querySelector(".authorbox .inner");
  if (authorBoxInner) {
    const avDiv = authorBoxInner.querySelector(".av");
    const nameNode = authorBoxInner.querySelector("h4");
    const roleNode = authorBoxInner.querySelector(".role");
    const bioNode = authorBoxInner.querySelector("p");

    if (post.author === "Groot X Media") {
      if (avDiv) {
        avDiv.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--navy); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;">G</div>`;
      }
      if (nameNode) nameNode.textContent = "Groot X Media";
      if (roleNode) roleNode.textContent = "Your Growth Partner";
      if (bioNode) bioNode.textContent = "Groot X Media is your full-suite digital growth partner, transforming modern platforms into reliable revenue pipelines.";
    } else if (post.author === "Priya Nair") {
      if (avDiv) {
        avDiv.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--orange); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;">P</div>`;
      }
      if (nameNode) nameNode.textContent = "Priya Nair";
      if (roleNode) roleNode.textContent = "Head of Strategy · Groot X Media";
      if (bioNode) bioNode.textContent = "Priya has spent a decade turning marketing guesswork into repeatable systems. She writes about the unglamorous mechanics behind brands that actually grow.";
    } else {
      if (avDiv) {
        avDiv.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--orange); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;">${post.author.charAt(0).toUpperCase()}</div>`;
      }
      if (nameNode) nameNode.textContent = post.author;
      if (roleNode) roleNode.textContent = "Author · Groot X Media";
      if (bioNode) bioNode.textContent = "Marketing professional and contributor to Groot X Media publication.";
    }
  }

  refreshIcons();

  // Hide skeleton and reveal actual content
  const skeleton = document.getElementById("post-loading-skeleton");
  if (skeleton) {
    skeleton.style.display = "none";
  }
  
  const mainContent = document.getElementById("blog-post-content") as HTMLElement;
  if (mainContent) {
    mainContent.style.display = "block";
    setTimeout(() => {
      mainContent.querySelectorAll(".reveal, .stagger").forEach((el) => {
        el.classList.add("in");
      });
    }, 50);
  }
}

/**
 * Show visual skeleton loading state during active fetches
 */
function showSkeletons() {
  const isHomepage = !!document.querySelector("#blog .blog-grid");
  const isBlogPage = !!document.querySelector(".postsec");
  const isPostPage = !!document.querySelector(".art-wrap");

  const skeletonHtml = (count: number) => Array(count).fill(`
    <div class="post-card" style="border-color: var(--line); background: var(--card); opacity: 0.85;">
      <div class="post-thumb skeleton-block" style="aspect-ratio: 16/10; border-radius: 0;"></div>
      <div class="post-body" style="padding: 22px; display: flex; flex-direction: column; gap: 12px; flex: 1;">
        <div class="skeleton-block" style="width: 35%; height: 12px;"></div>
        <div class="skeleton-block" style="width: 90%; height: 18px; margin-top: 6px;"></div>
        <div class="skeleton-block" style="width: 70%; height: 18px;"></div>
        <div class="skeleton-block" style="width: 100%; height: 14px; margin-top: 10px;"></div>
        <div class="skeleton-block" style="width: 50%; height: 14px;"></div>
        <div class="skeleton-block" style="width: 80px; height: 16px; margin-top: auto;"></div>
      </div>
    </div>
  `).join("");

  if (isHomepage) {
    const blogGrid = document.querySelector("#blog .blog-grid");
    if (blogGrid) {
      blogGrid.innerHTML = skeletonHtml(3);
    }
  } else if (isBlogPage) {
    const skeleton = document.getElementById("blog-loading-skeleton");
    if (skeleton) {
      skeleton.style.display = "block";
    }
    const featured = document.getElementById("blog-featured-section");
    if (featured) {
      featured.style.display = "none";
    }
    const gridSection = document.getElementById("blog-grid-section");
    if (gridSection) {
      gridSection.style.display = "none";
    }
  } else if (isPostPage) {
    // Rely on high-fidelity HTML skeleton block pre-built in blog-post.html
  }
  refreshIcons();
}

/**
 * Handle fetch errors gracefully with an elegant, interactive retry UI
 */
function renderFailureState(errorMsg: string, retryFn: () => void) {
  const isHomepage = !!document.querySelector("#blog .blog-grid");
  const isBlogPage = !!document.querySelector(".postsec");
  const isPostPage = !!document.querySelector(".art-wrap");

  const errorHtml = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 50px 24px; background: var(--card); border: 1px dashed color-mix(in srgb, var(--orange) 30%, transparent); border-radius: 20px; max-width: 600px; margin: 30px auto; width: calc(100% - 40px); box-shadow: var(--shadow-sm);">
      <div style="background: oklch(0.95 0.03 55 / 0.15); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; color: var(--orange);">
        <i data-lucide="alert-circle" width="30" height="30"></i>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: var(--navy);">Unable to load articles</h3>
      <p style="font-size: 0.92rem; color: var(--muted); margin-bottom: 24px; line-height: 1.5; max-width: 44ch; margin-left: auto; margin-right: auto;">
        ${errorMsg || "We encountered a network issue retrieving our latest blog posts. Please check your connection and try again."}
      </p>
      <button class="btn btn-primary" id="error-retry-btn" style="padding: 11px 26px; border-radius: 999px; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s;">
        <i data-lucide="refresh-cw" width="15" height="15"></i> Retry Loading
      </button>
    </div>
  `;

  if (isHomepage) {
    const blogGrid = document.querySelector("#blog .blog-grid");
    if (blogGrid) {
      blogGrid.innerHTML = errorHtml;
    }
  } else if (isBlogPage) {
    const blogGrid = document.querySelector("#blog-grid-section .blog-grid");
    if (blogGrid) {
      blogGrid.innerHTML = errorHtml;
    }
    const featured = document.querySelector(".featured") as HTMLElement;
    if (featured) {
      featured.style.display = "none";
    }
  } else if (isPostPage) {
    const skeleton = document.getElementById("post-loading-skeleton");
    if (skeleton) {
      skeleton.style.display = "none";
    }
    const mainContent = document.getElementById("blog-post-content") as HTMLElement;
    if (mainContent) {
      mainContent.style.display = "block";
    }
    const articleContainer = document.querySelector(".article");
    if (articleContainer) {
      articleContainer.innerHTML = errorHtml;
    }
    const mainTitle = document.querySelector(".art-head h1");
    if (mainTitle) {
      mainTitle.textContent = "Unable to load article";
    }
    const subtitle = document.querySelector(".art-head .sub");
    if (subtitle) {
      subtitle.textContent = "Please try again by clicking the button below.";
    }
  }

  refreshIcons();

  const retryBtn = document.getElementById("error-retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const icon = retryBtn.querySelector("[data-lucide='refresh-cw']") as HTMLElement;
      if (icon) {
        icon.style.transition = "transform 0.6s linear";
        icon.style.transform = "rotate(360deg)";
      }
      setTimeout(retryFn, 300);
    });
  }
}

// --- Controller Boot Sequence ---
async function initializeBlogController() {
  const isHomepage = !!document.querySelector("#blog .blog-grid");
  const isBlogPage = !!document.querySelector(".postsec");
  const isPostPage = !!document.querySelector(".art-wrap");

  console.log("[Blog Controller] Initializing... Page Type:", { isHomepage, isBlogPage, isPostPage });

  // Show visual loading skeleton state immediately
  showSkeletons();

  try {
    // Load posts dynamically using our resilient client fetcher
    allPosts = await fetchBlogPosts();
    console.log(`[Blog Controller] Loaded ${allPosts.length} posts.`);

    if (allPosts.length === 0) {
      throw new Error("No articles found in the database.");
    }

    if (isHomepage) {
      renderHomepage(allPosts);
    } else if (isBlogPage) {
      // Generate Category Filter Chips list from labels present with dynamic count badges in a polished, ordered list
      const chipsContainer = document.querySelector(".chips");
      if (chipsContainer) {
        const counts: Record<string, number> = { "All": allPosts.length };
        allPosts.forEach(post => {
          if (post.labels) {
            post.labels.forEach(label => {
              counts[label] = (counts[label] || 0) + 1;
            });
          }
        });

        const orderedCategories = ["New Trends", "Marketing", "Finance", "Logistics", "Current Affairs"];
        const allLabels = new Set([...orderedCategories]);
        allPosts.forEach(post => {
          if (post.labels) {
            post.labels.forEach(label => {
              allLabels.add(label);
            });
          }
        });

        let chipsHtml = `<button class="chip active" data-category="All">All <span class="count">${counts["All"]}</span></button>`;
        allLabels.forEach(label => {
          const count = counts[label] || 0;
          if (count > 0 || orderedCategories.includes(label)) {
            chipsHtml += `<button class="chip" data-category="${label}">${label} <span class="count">${count}</span></button>`;
          }
        });
        
        chipsContainer.innerHTML = chipsHtml;

        // Wire category filter listeners
        chipsContainer.querySelectorAll(".chip").forEach(chip => {
          chip.addEventListener("click", () => {
            chipsContainer.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentCategory = chip.getAttribute("data-category") || "All";
            renderBlogpage();
          });
        });
      }

      // Search wiring
      const searchInput = document.querySelector(".searchbar input") as HTMLInputElement;
      const searchForm = document.querySelector(".searchbar") as HTMLFormElement;

      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
          renderBlogpage();
        });
      }
      if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
          e.preventDefault();
          renderBlogpage();
        });
      }

      renderBlogpage();
    } else if (isPostPage) {
      renderBlogPostDetail(allPosts);
    }
  } catch (error: any) {
    console.error("[Blog Controller] Fatal boot error:", error);
    renderFailureState(error.message || String(error), () => {
      initializeBlogController();
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeBlogController);
} else {
  initializeBlogController();
}
