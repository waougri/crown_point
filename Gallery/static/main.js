/**
 * CROWN POINT CONSULTING
 * Main JavaScript
 */

// ============================
// NEWS LOADER
// ============================

/**
 * Fetches news articles from GitHub repository
 * @returns {Promise<Array>} Array of news items
 */
async function loadNews() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/waougri/cpspd/contents/content/news"
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      throw new Error("Invalid response from GitHub API");
    }

    // Filter and fetch Markdown files
    const newsPromises = files
      .filter((file) => file.name.endsWith(".md"))
      .map(async (file) => {
        try {
          const contentResponse = await fetch(file.download_url);
          const content = await contentResponse.text();
          return parseMarkdownPost(content, file.name);
        } catch (error) {
          console.error(`Error fetching ${file.name}:`, error);
          return null;
        }
      });

    const newsItems = await Promise.all(newsPromises);

    // Filter out failed items and sort by date
    return newsItems
      .filter((item) => item !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error loading news:", error);
    return [];
  }
}

/**
 * Parses Markdown post with frontmatter
 * @param {string} content - Markdown content
 * @param {string} filename - File name
 * @returns {Object|null} Parsed post object
 */
function parseMarkdownPost(content, filename) {
  try {
    // Extract frontmatter (YAML between --- markers)
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      console.warn(`No frontmatter found in ${filename}`);
      return null;
    }

    const frontmatter = match[1];
    const lines = frontmatter.split("\n");
    const data = {};

    // Parse YAML-like frontmatter
    lines.forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        // Remove quotes
        data[key] = line
            .substring(colonIndex + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
      }
    });

    // Format date
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Return structured post object
    return {
      id: filename.replace(".md", ""),
      slug: filename.replace(".md", ""),
      title: data.title || "Untitled",
      date: data.date,
      formattedDate: formattedDate,
      summary: data.summary || "",
      image: data.image || null,
      body: content.replace(frontmatterRegex, "").trim(),
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

// ============================
// ALPINE.JS COMPONENTS
// ============================

/**
 * Alpine.js component for news section
 */
function newsData() {
  return {
    news: [],
    loading: true,

    async init() {
      try {
        this.news = await loadNews();
      } catch (err) {
        console.error("News loading error:", err);
        this.news = [];
      } finally {
        this.loading = false;
      }
    },
  };
}

// ============================
// SWIPER INITIALIZATION
// ============================

/**
 * Initialize Swiper carousel when DOM is ready
 */
document.addEventListener("DOMContentLoaded", function () {
  // Check if Swiper is loaded
  if (typeof Swiper === "undefined") {
    console.error("Swiper library not loaded");
    return;
  }

  // Initialize hero carousel
  try {
    const heroSwiper = new Swiper(".heroSwiper", {
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      effect: "fade",
      fadeEffect: {
        crossFade: true,
      },
      speed: 1000,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      a11y: {
        prevSlideMessage: "Previous slide",
        nextSlideMessage: "Next slide",
        firstSlideMessage: "This is the first slide",
        lastSlideMessage: "This is the last slide",
      },
    });

    console.log("Swiper initialized successfully");
  } catch (error) {
    console.error("Error initializing Swiper:", error);
  }
});

// ============================
// SMOOTH SCROLL
// ============================

/**
 * Enhanced smooth scroll for navigation links
 */
document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Skip if it's just "#"
      if (href === "#") return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        // Get the offset for fixed navbar
        const navHeight = document.querySelector("nav").offsetHeight;
        const targetPosition = target.offsetTop - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Update URL without jumping
        history.pushState(null, null, href);
      }
    });
  });
});

// ============================
// INTERSECTION OBSERVER
// ============================

/**
 * Animate elements on scroll
 */
document.addEventListener("DOMContentLoaded", function () {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe service cards and news items
  const observeElements = document.querySelectorAll(
    '.group[class*="bg-white"], .service-card, .news-item'
  );

  observeElements.forEach((el) => observer.observe(el));
});

// ============================
// NAVBAR SCROLL EFFECT
// ============================

/**
 * Add shadow to navbar on scroll
 */
let lastScroll = 0;
const navbar = document.querySelector("nav");

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    navbar.classList.add("shadow-2xl");
  } else {
    navbar.classList.remove("shadow-2xl");
  }

  lastScroll = currentScroll;
});

// ============================
// PERFORMANCE MONITORING
// ============================

/**
 * Log page load performance
 */
window.addEventListener("load", () => {
  if (window.performance && window.performance.timing) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Page loaded in ${pageLoadTime}ms`);
  }
});

// ============================
// ERROR HANDLING
// ============================

/**
 * Global error handler
 */
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// ============================
// EXPORT FOR MODULE USE
// ============================

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadNews,
    parseMarkdownPost,
    newsData,
  };
}
