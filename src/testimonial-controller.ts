export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  avatarColor: string;
  photoUrl: string;
  videoUrl?: string;
  avatarUrl?: string;
  type: "photo" | "video";
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "grootx-client-deal",
    name: "Luxewalls",
    role: "Premium Wallpaper Showroom in Coimbatore",
    avatar: "LW",
    avatarColor: "a1",
    avatarUrl: "/luxewalls.webp",
    photoUrl: "/Testimonials/Images/test_luxewall_img.png",
    type: "photo"
  }
];

// Global state
let loadedTestimonials: Testimonial[] = [];
let activeFilter: "all" | "photo" | "video" = "photo";

/**
 * Fetch testimonials from our server proxy
 */
async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch("/api/testimonials");
    if (!res.ok) throw new Error("Server API returned error");
    loadedTestimonials = await res.json();
    return loadedTestimonials;
  } catch (err) {
    console.warn("[Testimonials Controller] Failed to fetch testimonials from API, using default list:", err);
    loadedTestimonials = [...DEFAULT_TESTIMONIALS];
    return loadedTestimonials;
  }
}

/**
 * Renders standard card HTML according to original design specifications
 */
function createTestimonialCardHTML(t: Testimonial): string {
  const isVideo = t.type === "video";
  const videoUrl = t.videoUrl || "";
  const photo = t.photoUrl || "";

  // Play overlay button for videos
  const playButtonHtml = isVideo ? `
    <div class="play-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 54px; height: 54px; border-radius: 50%; background: var(--orange); color: #fff; display: grid; place-items: center; border: 2px solid #fff; box-shadow: 0 8px 24px oklch(0.66 0.2 45 / 0.4); transition: all 0.3s var(--ease); z-index: 3; cursor: pointer;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="lucide lucide-play">
        <polygon points="6 3 20 12 6 21 6 3"/>
      </svg>
    </div>
  ` : "";

  // Media wrapper: photo wrapper or video wrapper
  const mediaWrapperHtml = isVideo ? `
    <div class="t-video-wrapper" data-video-url="${videoUrl}" style="position: relative; width: 100%; aspect-ratio: 3/2; border-radius: 14px; overflow: hidden; margin-bottom: 20px; cursor: pointer;">
      <img src="${photo || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}" alt="${t.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      <div style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.25); z-index: 2;"></div>
      ${playButtonHtml}
    </div>
  ` : `
    <div class="t-photo-wrapper" style="position: relative; width: 100%; aspect-ratio: 3/2; border-radius: 14px; overflow: hidden; margin-bottom: 20px;">
      <img src="${photo || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}" alt="${t.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
    </div>
  `;

  return `
    <div class="tcard" data-id="${t.id}" style="display: flex; flex-direction: column;">
      ${mediaWrapperHtml}
      
      <div class="tperson" style="display: flex; align-items: center; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); padding-left: 12px; padding-right: 12px;">
        <div class="tavatar ${t.avatarColor || 'a1'}" style="width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; overflow: hidden; background: #fff; border: 1px solid var(--line);">
          ${t.avatarUrl ? `<img src="${t.avatarUrl}" alt="${t.name} Logo" style="width: 100%; height: 100%; object-fit: contain; display: block; padding: 4px;" />` : (t.avatar || 'C')}
        </div>
        <div class="who">
          <div class="nm" style="font-weight: 600; font-size: 0.95rem; color: var(--navy);">${t.name}</div>
          <div class="rl" style="font-size: 0.8rem; color: var(--muted-2); margin-top: 2px;">${t.role}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render homepage slider track
 */
function renderHomepageSlider(testimonials: Testimonial[]) {
  const track = document.querySelector(".tst-slider-track");
  if (!track) return;

  track.innerHTML = testimonials.slice(0, 5).map((t) => createTestimonialCardHTML(t)).join("");

  const prevBtn = document.querySelector(".prev-btn") as HTMLButtonElement;
  const nextBtn = document.querySelector(".next-btn") as HTMLButtonElement;
  const controls = document.querySelector(".slider-controls") as HTMLElement;

  if (testimonials.length <= 1) {
    if (controls) controls.style.display = "none";
    track.setAttribute("style", "display: flex; justify-content: center; width: 100%; transform: none;");
  } else {
    if (controls) controls.style.display = "flex";
    track.removeAttribute("style");
    initializeHomepageSliderLogic(testimonials.length);
  }

  bindVideoPlayerHandlers();
}

/**
 * Homepage slider navigation calculation logic
 */
function initializeHomepageSliderLogic(cardCount: number) {
  const track = document.querySelector(".tst-slider-track") as HTMLElement;
  const prevBtn = document.querySelector(".prev-btn") as HTMLButtonElement;
  const nextBtn = document.querySelector(".next-btn") as HTMLButtonElement;
  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  const getVisibleCardsCount = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const updateSlider = () => {
    const visibleCards = getVisibleCardsCount();
    const maxIndex = Math.max(0, cardCount - visibleCards);
    
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    if (currentIndex < 0) currentIndex = 0;

    const cards = track.querySelectorAll(".tcard");
    if (cards.length > 0) {
      const cardWidth = (cards[0] as HTMLElement).getBoundingClientRect().width;
      const gap = 24;
      const offset = currentIndex * (cardWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
    } else {
      const cardWidthPercentage = 100 / visibleCards;
      const offset = -(currentIndex * cardWidthPercentage);
      track.style.transform = `translateX(${offset}%)`;
    }

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    prevBtn.style.opacity = currentIndex === 0 ? "0.4" : "1";
    nextBtn.style.opacity = currentIndex >= maxIndex ? "0.4" : "1";
  };

  prevBtn.onclick = () => {
    const visibleCards = getVisibleCardsCount();
    currentIndex = Math.max(0, currentIndex - visibleCards);
    updateSlider();
  };

  nextBtn.onclick = () => {
    const visibleCards = getVisibleCardsCount();
    const maxIndex = Math.max(0, cardCount - visibleCards);
    currentIndex = Math.min(maxIndex, currentIndex + visibleCards);
    updateSlider();
  };

  window.addEventListener("resize", updateSlider);
  updateSlider();
}

/**
 * Renders dedicated testimonials page grid with filter
 */
function renderTestimonialsGrid(testimonials: Testimonial[]) {
  const grid = document.querySelector(".tgrid");
  if (!grid) return;

  // Filter based on active filter
  let filtered = testimonials;
  if (activeFilter === "video") {
    filtered = testimonials.filter((t) => t.type === "video");
  } else if (activeFilter === "photo") {
    filtered = testimonials.filter((t) => t.type === "photo");
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 64px 24px; color: var(--muted);">
        <p>No client stories match the selected criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((t) => createTestimonialCardHTML(t)).join("");
  bindVideoPlayerHandlers();
}

/**
 * Set up dynamic tab triggers on dedicated testimonials page
 */
function setupTestimonialTabs(testimonials: Testimonial[]) {
  const showPhotosBtn = document.getElementById("showPhotos");
  const showVideosBtn = document.getElementById("showVideos");
  if (!showPhotosBtn || !showVideosBtn) return;

  // Clone to replace any previous event listeners cleanly
  const newShowPhotosBtn = showPhotosBtn.cloneNode(true) as HTMLButtonElement;
  const newShowVideosBtn = showVideosBtn.cloneNode(true) as HTMLButtonElement;
  
  showPhotosBtn.parentNode?.replaceChild(newShowPhotosBtn, showPhotosBtn);
  showVideosBtn.parentNode?.replaceChild(newShowVideosBtn, showVideosBtn);

  newShowPhotosBtn.addEventListener("click", () => {
    newShowPhotosBtn.classList.add("active");
    newShowVideosBtn.classList.remove("active");
    activeFilter = "photo";
    renderTestimonialsGrid(testimonials);
  });

  newShowVideosBtn.addEventListener("click", () => {
    newShowVideosBtn.classList.add("active");
    newShowPhotosBtn.classList.remove("active");
    activeFilter = "video";
    renderTestimonialsGrid(testimonials);
  });
}

/**
 * Lightbox video modal behavior binder
 */
function bindVideoPlayerHandlers() {
  const modal = document.getElementById("videoModal");
  const modalVideo = document.getElementById("modalVideo") as HTMLVideoElement;
  const closeBtn = document.getElementById("closeModal");
  if (!modal || !modalVideo || !closeBtn) return;

  const videoCards = document.querySelectorAll(".t-video-wrapper");
  videoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const url = card.getAttribute("data-video-url");
      if (url) {
        modalVideo.src = url;
        modal.style.display = "flex";
        setTimeout(() => {
          modal.style.opacity = "1";
        }, 10);
        modalVideo.play().catch((e) => console.log("Lightbox autoplay blocked:", e));
      }
    });
  });

  const hideModal = () => {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modalVideo.pause();
      modalVideo.src = "";
    }, 300);
  };

  closeBtn.addEventListener("click", hideModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });
}

/**
 * Show visual skeleton loading state during active fetches
 */
function showSkeletons() {
  const isHomepage = !!document.querySelector(".tst-slider-track");
  const isTestimonialsPage = !!document.querySelector(".tgrid");

  const skeletonHtml = (count: number) => Array(count).fill(`
    <div class="tcard" style="border-color: var(--line); background: var(--card); opacity: 0.85;">
      <div class="skeleton-block" style="width: 100%; aspect-ratio: 3/2; border-radius: 14px; margin-bottom: 20px;"></div>
      <div class="tperson" style="display: flex; align-items: center; gap: 12px; margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); padding-left: 12px; padding-right: 12px;">
        <div class="skeleton-block" style="width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;"></div>
        <div class="who" style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          <div class="skeleton-block" style="width: 60%; height: 16px;"></div>
          <div class="skeleton-block" style="width: 40%; height: 12px;"></div>
        </div>
      </div>
    </div>
  `).join("");

  if (isHomepage) {
    const track = document.querySelector(".tst-slider-track");
    if (track) {
      track.innerHTML = skeletonHtml(3);
    }
  } else if (isTestimonialsPage) {
    const grid = document.querySelector(".tgrid");
    if (grid) {
      grid.innerHTML = skeletonHtml(6);
    }
  }
}

// Initial bootstrapper
async function init() {
  showSkeletons();
  const testimonials = await fetchTestimonials();
  
  const isHomepage = !!document.querySelector(".tst-slider-track");
  const isTestimonialsPage = !!document.querySelector(".tgrid");

  if (isHomepage) {
    renderHomepageSlider(testimonials);
  }

  if (isTestimonialsPage) {
    setupTestimonialTabs(testimonials);
    renderTestimonialsGrid(testimonials);
  }
}

// Ensure startup
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
