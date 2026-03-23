// Reveal on scroll
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("show");
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll(".reveal").forEach((el) => {
  const delay = Number(el.dataset.revealDelay || el.dataset.aosDelay || 0);
  if (delay > 0) {
    // Keep scroll animation snappy while still allowing a staggered sequence.
    el.style.transitionDelay = `${Math.min(delay, 450)}ms`;
  }
  obs.observe(el);
});

// Dynamic year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Submit contact form without redirecting to Formspree page.
(function initContactForm() {
  const form = document.querySelector('form[action*="formspree.io"]');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('form-status');
  const defaultBtnText = submitBtn ? submitBtn.textContent : '';

  const setStatus = (message, type = '') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('success', 'error');
    if (type) statusEl.classList.add(type);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    setStatus('Sending your message...');

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        form.reset();
        setStatus('Message sent successfully. Thank you! I will get back to you soon.', 'success');
      } else {
        let errorMessage = 'Something went wrong. Please try again.';
        try {
          const data = await response.json();
          if (data?.errors?.length) {
            errorMessage = data.errors.map((err) => err.message).join(' ');
          }
        } catch (_err) {
          // Keep default message when response body is not JSON.
        }
        setStatus(errorMessage, 'error');
      }
    } catch (_err) {
      setStatus('Network error. Please check your connection and try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultBtnText;
      }
    }
  });
})();

// Mobile nav ARIA
const navToggle = document.getElementById("nav-toggle");
const navToggleLabel = document.querySelector(".nav-toggle-label");
if (navToggle && navToggleLabel) {
  navToggleLabel.setAttribute("aria-expanded", "false");
  navToggle.addEventListener("change", () => {
    navToggleLabel.setAttribute("aria-expanded", navToggle.checked ? "true" : "false");
  });

  document.querySelectorAll(".navlinks a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768 && navToggle.checked) {
        navToggle.checked = false;
        navToggleLabel.setAttribute("aria-expanded", "false");
      }
    });
  });
}

// THEME: init + sync with slide switch
(function () {
  const body = document.body;
  const toggle = document.getElementById("theme-toggle");
  const mq = window.matchMedia("(prefers-color-scheme: light)");

  const applyTheme = (theme, persist = true) => {
    const isLight = theme === "light";
    body.classList.toggle("light-theme", isLight);
    if (toggle) {
      toggle.checked = isLight;
      toggle.setAttribute("aria-checked", String(isLight));
    }
    if (persist) localStorage.setItem("theme", theme);
  };

  const initTheme = () => {
    const stored = localStorage.getItem("theme");
    const theme = stored || (mq.matches ? "light" : "dark");
    applyTheme(theme, false);
  };

  initTheme();

  if (toggle) {
    toggle.addEventListener("change", (e) => {
      applyTheme(e.currentTarget.checked ? "light" : "dark");
    });
  }

  // Follow system changes when user hasn't chosen manually
  const onPrefChange = (e) => {
    if (localStorage.getItem("theme")) return;
    applyTheme(e.matches ? "light" : "dark", false);
  };
  if (mq.addEventListener) mq.addEventListener("change", onPrefChange);
  else mq.addListener(onPrefChange); // older Safari
})();

// Social links
// Guard social link assignments (optional safety)
const gh = document.getElementById("github-link");
if (gh) gh.href = "https://github.com/AntonisRsmn";
const li = document.getElementById("linkedin-link");
if (li) li.href = "https://www.linkedin.com/in/antonis-rusman-a46424319/";
const ig = document.getElementById("insta-link");
if (ig) ig.href = "https://instagram.com/_.rusman._";
const cv = document.getElementById("resume-link");
if (cv) {
  cv.addEventListener("click", (e) => {
    e.preventDefault(); // prevent default link behavior
    window.open("Pdfs/Rusman-CV.pdf", "_blank"); // opens the PDF in a new tab
  });
}

// Make mail social-link visually prominent by default
// Previously we auto-added an `.email` accent class; keep the UI neutral by default.
// To highlight the email icon programmatically, add the `active` class to the element:
// document.querySelector('.social-link[href^="mailto:"]').classList.add('active')


/* Halloween particle manager (used by the hero-title easter egg). */
(function () {
  let current = null;
  let overlay = null;
  let spawner = null;

  function createOverlay() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'season-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function clearOverlay() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
  }


  /* floating orange particles */
  function makeHParticle() {
    const c = createOverlay();
    const p = document.createElement('div');
    p.className = 'h-particle';
    const size = Math.round(Math.random() * 18 + 6);
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (4 + Math.random() * 6) + 's';
    p.style.top = (80 + Math.random() * 20) + '%';
    c.appendChild(p);
    setTimeout(() => p.remove(), 11000);
  }

  function startParticles() {
    stopEffect();
    const isLight = document.body.classList.contains('light-theme');
    const initial = isLight ? 20 : 12;
    const interval = isLight ? 300 : 350;
    const twoChance = isLight ? 0.35 : 0.25;
    for (let i = 0; i < initial; i++) setTimeout(makeHParticle, Math.random() * 1200);
    spawner = setInterval(() => {
      const count = Math.random() < twoChance ? 2 : 1;
      for (let i = 0; i < count; i++) makeHParticle();
    }, interval);
  }

  function stopEffect() {
    if (spawner) { clearInterval(spawner); spawner = null; }
    if (overlay) {
      overlay.querySelectorAll('.h-particle').forEach(el => el.remove());
    }
    clearOverlay();
  }

  // Particle controls (simple API)
  function enableParticles() { if (current) return; startParticles(); current = 'particles'; }
  function disableParticles() { if (!current) return; stopEffect(); current = null; }
  function toggleParticles() { if (current) disableParticles(); else enableParticles(); }

  // Expose particle API
  window.enableParticles = enableParticles;
  window.disableParticles = disableParticles;
  window.toggleParticles = toggleParticles;

})();

// Easter egg: toggle particles every 5 clicks on hero title
(function () {
  const target = document.getElementById("hero-title");
  if (!target) return;

  let clickCount = 0;
  let resetTimer = null;
  let particlesEnabled = false; // track current state

  target.addEventListener("click", () => {
    clickCount++;

    // Reset counter if user waits too long
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      clickCount = 0;
    }, 2000); // 2s window

    if (clickCount === 5) {
      clickCount = 0;
      particlesEnabled = !particlesEnabled; // toggle state

      if (typeof enableParticles === "function" && typeof disableParticles === "function") {
        if (particlesEnabled) {
          enableParticles();
          console.log("Particles enabled!");
        } else {
          disableParticles();
          console.log("Particles disabled!");
        }
      }
    }
  });
})();

// Carousel functionality
(function initCarousel() {
  function getVisibleCount() {
    return window.innerWidth <= 890 ? 1 : 3;
  }

  const allProjects = [
    {
      icon: "Imgs/ryvex-logo.webp",
      title: "Ryvex",
      desc: "Ryvex is a discord bot built to help you manage your discord server and also the members.",
      result: "Clearer onboarding and easier server management workflows.",
      link: "https://ryvex.gr",
    },
    {
      icon: "Imgs/betl-logo.webp",
      title: "Betl",
      desc: "Betl provides innovative battery solutions focused on mobile and on-the-go charging.",
      result: "Stronger product presentation and smoother mobile browsing.",
      link: "https://antonisrsmn.github.io/Betl-Greece/",
    },
    {
      icon: "Imgs/Unlike-Logo-White.webp",
      title: "Unlike",
      desc: "A real-time global chat platform for open, secure, and anonymous communication online.",
      result: "Improved readability and clearer core product messaging.",
      link: "https://unlike.gr",
    },
    {
      icon: "Imgs/eshop-img.webp",
      title: "E-Shop Template",
      desc: "Modern e-shop template with responsive design and clean code structure.",
      result: "Better conversion-oriented layout for product discovery.",
      link: "https://antonisrsmn.github.io/Eshop-Template/",
    },
    {
      icon: "Imgs/stefania.webp",
      title: "Στεφανια Δρακου",
      desc: "A clean and modern website designed for a psychology professional, highlighting services.",
      result: "More trust through clean structure and service clarity.",
      link: "https://stefaniadrakou.gr/",
    },
    {
      icon: "Imgs/weather-app.webp",
      title: "Weather App",
      desc: "Live weather updates with a clean design and accurate real-time data integration.",
      result: "Faster data scanning with a simple, low-friction UI.",
      link: "https://antonisrsmn.github.io/Weather-App/",
    },
    {
      icon: "Imgs/Calculator.webp",
      title: "Calculator",
      desc: "Clean, minimalist calculator app built for precision, simplicity, and consistent performance.",
      result: "Reliable interaction flow with straightforward controls.",
      link: "https://antonisrsmn.github.io/Calculator-App/",
    },
    {
      icon: "Imgs/favicon.svg",
      title: "Barber Salon",
      desc: "A modern website showcasing services, pricing, and online booking with an admin page for managing appointments.",
      result: "Clearer booking journey from service view to appointment request.",
      link: "https://appointments-app-ruuu.onrender.com/",
    },
    {
      icon: "Imgs/favicon-blog.svg",
      title: "Blog",
      desc: "A modern blog sharing insights, ideas, and practical knowledge on technology, lifestyle, and everyday inspiration.",
      result: "Cleaner reading experience and improved content navigation.",
      link: "https://blog-post-t28l.onrender.com/",
    },
  ];

  const carousel = document.getElementById("carouselProjects");
  const carouselSection = document.getElementById("projects-carousel");
  const AUTOPLAY_MS = 3000;
  const TRANSITION_MS = 520;
  let autoplayTimer = null;
  let isAnimating = false;
  let currentIndex = allProjects.length; // Start in the middle clone block for seamless looping.

  function projectCardMarkup(project) {
    return `
      <div class="project" aria-hidden="true">
        <div class="project-icon">
          <img src="${project.icon}" alt="${project.title} Logo" loading="lazy" decoding="async" width="220" height="220">
        </div>
        <h3>${project.title}</h3>
        <p class="project-summary">${project.desc}</p>
        <p class="project-result"><strong>Outcome:</strong> ${project.result}</p>
        <a class="btn primary" href="${project.link}" target="_blank" rel="noopener">Website</a>
      </div>
    `;
  }

  function setVisibleCount() {
    if (!carousel) return;
    carousel.style.setProperty("--visible-count", String(getVisibleCount()));
  }

  function getStepSize() {
    if (!carousel) return 0;
    const firstCard = carousel.querySelector(".project");
    if (!firstCard) return 0;
    const styles = window.getComputedStyle(carousel);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return firstCard.getBoundingClientRect().width + gap;
  }

  function applyOffset(animated = true) {
    if (!carousel) return;
    const step = getStepSize();
    if (!step) return;
    carousel.classList.toggle("no-transition", !animated);
    carousel.style.transform = `translateX(${-currentIndex * step}px)`;
    if (!animated) {
      // Force the browser to apply the no-transition state before restoring transitions.
      carousel.getBoundingClientRect();
      carousel.classList.remove("no-transition");
    }
  }

  function buildCarouselTrack() {
    if (!carousel) return;
    const loopedProjects = [...allProjects, ...allProjects, ...allProjects];
    carousel.innerHTML = loopedProjects.map(projectCardMarkup).join("");
    setVisibleCount();
    applyOffset(false);
  }

  function move(direction) {
    if (!carousel || isAnimating) return;
    isAnimating = true;
    currentIndex += direction;
    applyOffset(true);
  }

  function goNext() {
    move(1);
  }

  function goPrev() {
    move(-1);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(goNext, AUTOPLAY_MS);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const nextBtn = document.getElementById("nextProject");
    const prevBtn = document.getElementById("prevProject");

    if (carousel) {
      carousel.addEventListener("transitionend", (event) => {
        if (event.propertyName !== "transform") return;

        const blockSize = allProjects.length;
        if (currentIndex >= blockSize * 2) {
          currentIndex -= blockSize;
          applyOffset(false);
        } else if (currentIndex < blockSize) {
          currentIndex += blockSize;
          applyOffset(false);
        }
        isAnimating = false;
      });
    }

    if (nextBtn) {
      nextBtn.onclick = function () {
        goNext();
        startAutoplay();
      };
    }

    if (prevBtn) {
      prevBtn.onclick = function () {
        goPrev();
        startAutoplay();
      };
    }

    if (carouselSection) {
      carouselSection.addEventListener("mouseenter", stopAutoplay);
      carouselSection.addEventListener("mouseleave", startAutoplay);
    }

    window.addEventListener("resize", () => {
      setVisibleCount();
      applyOffset(false);
    });

    buildCarouselTrack();
    startAutoplay();
  });

  // Preload project images
  (function preloadProjectImages() {
    const projectImages = [
      "Imgs/ryvex-logo.webp",
      "Imgs/betl-logo.webp",
      "Imgs/Unlike-Logo-White.webp",
      "Imgs/eshop-img.webp",
      "Imgs/stefania.webp",
      "Imgs/weather-app.webp",
      "Imgs/Calculator.webp",
      "Imgs/favicon.svg",
      "Imgs/favicon-blog.svg",
    ];
    projectImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  })();
})();