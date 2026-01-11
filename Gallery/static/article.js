/**
 * CROWN POINT CONSULTING
 * Article Page JavaScript
 */

// ============================
// ALPINE.JS ARTICLE COMPONENT
// ============================

/**
 * Main article data component
 * Must be defined before Alpine loads
 */
window.articleData = function () {
  return {
    article: null,
    renderedContent: "",
    loading: true,

    async init() {
      await this.loadArticle();
    },

    /**
     * Load article from GitHub based on slug parameter
     */
    async loadArticle() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("slug");

      if (!slug) {
        console.warn("No slug parameter found");
        this.loading = false;
        return;
      }

      try {
        // Fetch all news articles from GitHub
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

        // Find the matching article file
        const articleFile = files.find(
          (file) =>
            file.name.endsWith(".md") && file.name.replace(".md", "") === slug
        );

        if (!articleFile) {
          console.warn(`Article with slug "${slug}" not found`);
          this.loading = false;
          return;
        }

        // Fetch article content
        const contentResponse = await fetch(articleFile.download_url);
        const content = await contentResponse.text();

        // Parse the Markdown file
        this.article = this.parseMarkdownPost(content, articleFile.name);

        if (this.article) {
          // Render Markdown to HTML
          if (typeof marked !== "undefined") {
            this.renderedContent = marked.parse(this.article.body);
          } else {
            console.error("Marked.js not loaded");
            this.renderedContent = `<p>${this.article.body}</p>`;
          }

          // Update page title and meta
          document.title = `${this.article.title} - Crown Point Consulting`;

          // Update meta description if available
          if (this.article.summary) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement("meta");
              metaDesc.name = "description";
              document.head.appendChild(metaDesc);
            }
            metaDesc.content = this.article.summary;
          }
        }
      } catch (error) {
        console.error("Error loading article:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Parse markdown file with YAML frontmatter
     * @param {string} content - Full markdown content
     * @param {string} filename - Original filename
     * @returns {Object|null} Parsed article object
     */
    parseMarkdownPost(content, filename) {
      try {
        // Extract YAML frontmatter between --- markers
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
            let value = line.substring(colonIndex + 1).trim();
            // Remove surrounding quotes
            value = value.replace(/^["']|["']$/g, "");
            data[key] = value;
          }
        });

        // Format the date
        const date = new Date(data.date);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        // Return structured article object
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
    },

    /**
     * Share article on social media
     * @param {string} platform - Social media platform (twitter, facebook, linkedin)
     */
    shareArticle(platform) {
      if (!this.article) {
        console.warn("No article to share");
        return;
      }

      const url = window.location.href;
      const title = this.article.title;
      let shareUrl = "";

      switch (platform) {
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(title)}`;
          break;
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`;
          break;
        default:
          console.warn(`Unknown platform: ${platform}`);
          return;
      }

      if (shareUrl) {
        window.open(
          shareUrl,
          "_blank",
          "width=600,height=400,scrollbars=yes,resizable=yes"
        );
      }
    },

    /**
     * Copy article link to clipboard
     */
    async copyLink() {
      const url = window.location.href;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          this.showCopyNotification();
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = url;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();

          try {
            document.execCommand("copy");
            this.showCopyNotification();
          } catch (err) {
            console.error("Fallback copy failed:", err);
            alert("Failed to copy link. Please copy manually: " + url);
          }

          document.body.removeChild(textArea);
        }
      } catch (err) {
        console.error("Failed to copy link:", err);
        alert("Failed to copy link. Please copy manually: " + url);
      }
    },

    /**
     * Show temporary notification that link was copied
     */
    showCopyNotification() {
      // Create notification element
      const notification = document.createElement("div");
      notification.className =
        "fixed z-50 px-6 py-3 text-white bg-green-500 rounded-lg shadow-lg bottom-8 right-8 transform transition-all duration-300";
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="font-semibold">Link copied to clipboard!</span>
        </div>
      `;

      document.body.appendChild(notification);

      // Animate in
      setTimeout(() => {
        notification.style.transform = "translateY(0)";
      }, 10);

      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.transform = "translateY(150%)";
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },
  };
};

// ============================
// SMOOTH SCROLL
// ============================

document.addEventListener("DOMContentLoaded", function () {
  // Smooth scroll for anchor links
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (href === "#") return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        const navHeight = document.querySelector("nav").offsetHeight;
        const targetPosition = target.offsetTop - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
});

// ============================
// READING PROGRESS BAR
// ============================

document.addEventListener("DOMContentLoaded", function () {
  // Create progress bar
  const progressBar = document.createElement("div");
  progressBar.className =
    "fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-150";
  progressBar.style.width = "0%";
  document.body.appendChild(progressBar);

  // Update progress on scroll
  window.addEventListener("scroll", () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
  });
});

// ============================
// ERROR HANDLING
// ============================

window.addEventListener("error", (event) => {
  console.error("Article page error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});
