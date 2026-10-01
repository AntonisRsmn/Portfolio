// Reveal on scroll (or instant render for reduced motion users)
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (prefersReducedMotion) {
  revealItems.forEach((el) => el.classList.add("show"));
} else {
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

  revealItems.forEach((el) => {
    const delay = Number(el.dataset.revealDelay || el.dataset.aosDelay || 0);
    if (delay > 0) {
      // Keep scroll animation snappy while still allowing a staggered sequence.
      el.style.transitionDelay = `${Math.min(delay, 450)}ms`;
    }
    obs.observe(el);
  });
}

// Dynamic year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Scroll-to-top button
(function initScrollToTop() {
  const scrollBtn = document.getElementById("scrollToTopBtn");
  if (!scrollBtn) return;

  const showAt = 140;
  const getScrollTop = () => {
    const doc = document.documentElement;
    const body = document.body;
    const se = document.scrollingElement;
    return Math.max(
      window.scrollY || 0,
      window.pageYOffset || 0,
      (doc && doc.scrollTop) || 0,
      (body && body.scrollTop) || 0,
      (se && se.scrollTop) || 0
    );
  };

  const toggleScrollBtn = () => {
    if (getScrollTop() > showAt) scrollBtn.classList.add("show");
    else scrollBtn.classList.remove("show");
  };

  window.addEventListener("scroll", toggleScrollBtn, { passive: true });
  document.addEventListener("scroll", toggleScrollBtn, { passive: true, capture: true });
  window.addEventListener("resize", toggleScrollBtn, { passive: true });
  toggleScrollBtn();

  let isScrollAnimating = false;
  const scrollTargets = [window, document.scrollingElement, document.documentElement, document.body].filter(Boolean);

  scrollBtn.addEventListener("click", () => {
    if (isScrollAnimating) return;

    const getTop = (target) => {
      if (target === window) return window.scrollY || window.pageYOffset || 0;
      return target && typeof target.scrollTop === "number" ? target.scrollTop : 0;
    };

    const setTop = (target, value) => {
      if (target === window) {
        window.scrollTo(0, value);
        return;
      }
      target.scrollTop = value;
    };

    const uniqueTargets = Array.from(new Set(scrollTargets));
    const starts = uniqueTargets.map((target) => ({ target, start: getTop(target) })).filter((item) => item.start > 0);
    if (starts.length === 0) return;

    isScrollAnimating = true;
    const duration = 550;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      starts.forEach(({ target, start }) => {
        const next = Math.round(start * (1 - eased));
        setTop(target, next);
      });

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        isScrollAnimating = false;
      }
    };

    requestAnimationFrame(tick);
  });
})();

// Keep in-page navigation aligned with the section currently in view.
(function initActiveNavigation() {
  const links = Array.from(document.querySelectorAll('.navlinks a[href^="#"]'));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const setActiveLink = (sectionId) => {
    links.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.toggleAttribute('aria-current', isActive);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (current) setActiveLink(current.target.id);
    },
    { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.4, 0.7] }
  );

  sections.forEach((section) => observer.observe(section));
})();

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

  const normalizeField = (field) => {
    if (!field || typeof field.value !== 'string') return;
    field.value = field.value.trim();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    normalizeField(form.querySelector('#name'));
    normalizeField(form.querySelector('#email'));
    normalizeField(form.querySelector('#message'));

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
const navOverlay = document.querySelector(".nav-overlay");
const mobileNavBreakpoint = 800;
if (navToggle && navToggleLabel) {
  const applyNavState = () => {
    const isOpen = navToggle.checked && window.innerWidth <= mobileNavBreakpoint;
    navToggleLabel.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("nav-open", isOpen);
  };

  const closeNav = () => {
    if (!navToggle.checked) return;
    navToggle.checked = false;
    applyNavState();
  };

  navToggleLabel.setAttribute("aria-expanded", "false");
  navToggle.addEventListener("change", applyNavState);

  if (navOverlay) {
    ["click", "touchstart", "pointerdown"].forEach((eventName) => {
      navOverlay.addEventListener(eventName, (event) => {
        event.preventDefault();
        closeNav();
      }, { passive: false });
    });
  }

  document.querySelectorAll(".navlinks a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= mobileNavBreakpoint && navToggle.checked) {
        closeNav();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > mobileNavBreakpoint && navToggle.checked) {
      closeNav();
    }
    applyNavState();
  });

  applyNavState();
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
if (li) li.href = "https://www.linkedin.com/in/antonisrusman/";
const ig = document.getElementById("insta-link");
if (ig) ig.href = "https://instagram.com/_.rusman._";
// Resume link is a normal anchor with target="_blank" in HTML; no JS override required.

// Make mail social-link visually prominent by default
// Previously we auto-added an `.email` accent class; keep the UI neutral by default.
// To highlight the email icon programmatically, add the `active` class to the element:
// document.querySelector('.social-link[href^="mailto:"]').classList.add('active')


/* Halloween particle manager (used by the hero-title easter egg). */
(function () {
  const PARTICLES_KEY = "particles-enabled";
  let current = null;
  let overlay = null;
  let spawner = null;

  const readStoredValue = (storage, fallback = null) => {
    if (!storage) return fallback;
    try {
      const value = storage.getItem(PARTICLES_KEY);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  };

  const writeStoredValue = (storage, value) => {
    if (!storage) return false;
    try {
      storage.setItem(PARTICLES_KEY, value);
      return true;
    } catch (error) {
      return false;
    }
  };

  const readCookieValue = () => {
    const cookieMatch = document.cookie.split('; ').find((entry) => entry.startsWith(`${PARTICLES_KEY}=`));
    if (!cookieMatch) return null;
    return decodeURIComponent(cookieMatch.split('=').slice(1).join('='));
  };

  const writeCookieValue = (value) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    document.cookie = `${PARTICLES_KEY}=${encodeURIComponent(value)}; path=/; expires=${date.toUTCString()}`;
  };

  const readSavedParticlesState = () => {
    const localValue = readStoredValue(window.localStorage, null);
    if (localValue !== null) return localValue === "true";

    const sessionValue = readStoredValue(window.sessionStorage, null);
    if (sessionValue !== null) return sessionValue === "true";

    const cookieValue = readCookieValue();
    if (cookieValue !== null) return cookieValue === "true";

    return false;
  };

  const saveParticlesState = (enabled) => {
    const value = String(enabled);
    if (writeStoredValue(window.localStorage, value)) return;
    if (writeStoredValue(window.sessionStorage, value)) return;
    writeCookieValue(value);
  };

  const setParticleState = (enabled) => {
    if (enabled) {
      if (!current) {
        startParticles();
        current = 'particles';
      }
      window.__particlesEnabled = true;
      saveParticlesState(true);
      return;
    }

    if (current) {
      stopEffect();
      current = null;
    }
    window.__particlesEnabled = false;
    saveParticlesState(false);
  };

  window.__particlesEnabled = false;

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
    const duration = (4 + Math.random() * 6).toFixed(2);
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = (80 + Math.random() * 20) + '%';
    p.style.setProperty('animation', `drift ${duration}s linear forwards`, 'important');
    c.appendChild(p);
    setTimeout(() => p.remove(), 11000);
  }

  function startParticles() {
    stopEffect();
    const isLight = document.body.classList.contains('light-theme');
    const initial = isLight ? 20 : 12;
    const interval = isLight ? 300 : 350;
    const twoChance = isLight ? 0.35 : 0.25;

    for (let i = 0; i < initial; i++) {
      makeHParticle();
    }

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

  function enableParticles() {
    setParticleState(true);
  }

  function disableParticles() {
    setParticleState(false);
  }

  function toggleParticles() {
    setParticleState(!window.__particlesEnabled);
  }

  window.enableParticles = enableParticles;
  window.disableParticles = disableParticles;
  window.toggleParticles = toggleParticles;

  const savedSetting = readSavedParticlesState();
  setParticleState(savedSetting);
})();

// Easter egg: toggle particles every 5 clicks on hero title
(function () {
  const target = document.getElementById("hero-title");
  if (!target) return;

  let clickCount = 0;
  let resetTimer = null;

  target.addEventListener("click", () => {
    clickCount++;

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      clickCount = 0;
    }, 2000);

    if (clickCount === 5) {
      clickCount = 0;

      if (typeof window.enableParticles === "function" && typeof window.disableParticles === "function") {
        const nextState = !window.__particlesEnabled;
        if (nextState) {
          window.enableParticles();
        } else {
          window.disableParticles();
        }
      }
    }
  });
})();

// Carousel functionality
(function initCarousel() {
  function getVisibleCount() {
    return window.innerWidth <= 1024 ? 1 : 3;
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
      icon: "Imgs/Unlike-Logo.png",
      title: "Unlike",
      desc: "A real-time global chat platform for open, secure, and anonymous communication online.",
      result: "Improved readability and clearer core product messaging.",
      link: "https://global-chat-on6n.onrender.com/",
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
      icon: "Imgs/weather-app.png",
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
    {
      icon: "Imgs/forma.svg",
      title: "Forma",
      desc: "A modern file-conversion platform built to securely convert images, audio, and video between multiple formats.",
      result: "Built a secure and scalable file-conversion platform.",
      link: "https://forma-gjx2.onrender.com/",
    },
  ];

  const carousel = document.getElementById("carouselProjects");
  const carouselSection = document.getElementById("projects-carousel");
  const AUTOPLAY_MS = 3800;
  const TRANSITION_MS = 520;
  let autoplayTimer = null;
  let animationFallbackTimer = null;
  let isAnimating = false;
  let currentIndex = allProjects.length; // Start in the middle clone block for seamless looping.

  function projectCardMarkup(project, index) {
    const isClone = index < allProjects.length || index >= allProjects.length * 2;

    return `
      <article class="project"${isClone ? ' aria-hidden="true" inert' : ""}>
        <div class="project-card">
          <div class="project-icon">
            <img src="${project.icon}" alt="${project.title} Logo" loading="lazy" decoding="async" width="220" height="220">
          </div>
          <h3>${project.title}</h3>
          <p class="project-summary">${project.desc}</p>
          <p class="project-result"><strong>Outcome:</strong> ${project.result}</p>
          <a class="btn primary" href="${project.link}" target="_blank" rel="noopener">Website</a>
        </div>
      </article>
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

  function updateVisibleProjectInteractivity() {
    if (!carousel) return;

    const visibleCount = getVisibleCount();
    carousel.querySelectorAll(".project").forEach((project, index) => {
      const isVisible = index >= currentIndex && index < currentIndex + visibleCount;
      project.toggleAttribute("inert", !isVisible);
      project.setAttribute("aria-hidden", String(!isVisible));
    });
  }

  function buildCarouselTrack() {
    if (!carousel) return;
    const loopedProjects = [...allProjects, ...allProjects, ...allProjects];
    carousel.innerHTML = loopedProjects.map(projectCardMarkup).join("");
    setVisibleCount();
    applyOffset(false);
    updateVisibleProjectInteractivity();
  }

  function settleCarousel() {
    if (animationFallbackTimer) {
      clearTimeout(animationFallbackTimer);
      animationFallbackTimer = null;
    }

    const blockSize = allProjects.length;
    if (currentIndex >= blockSize * 2) {
      currentIndex -= blockSize;
      applyOffset(false);
    } else if (currentIndex < blockSize) {
      currentIndex += blockSize;
      applyOffset(false);
    }
    updateVisibleProjectInteractivity();
    isAnimating = false;
  }

  function move(direction) {
    if (!carousel || isAnimating) return;
    isAnimating = true;
    currentIndex += direction;
    applyOffset(true);
    updateVisibleProjectInteractivity();
    animationFallbackTimer = setTimeout(settleCarousel, TRANSITION_MS + 100);
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
        if (event.target !== carousel || event.propertyName !== "transform") return;
        settleCarousel();
      });

      carousel.addEventListener("transitioncancel", (event) => {
        if (event.target === carousel && event.propertyName === "transform") {
          settleCarousel();
        }
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

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    let resizeRaf = null;
    window.addEventListener("resize", () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        if (animationFallbackTimer) {
          clearTimeout(animationFallbackTimer);
          animationFallbackTimer = null;
        }
        isAnimating = false;
        setVisibleCount();
        applyOffset(false);
        updateVisibleProjectInteractivity();
      });
    });

    buildCarouselTrack();
    if (!prefersReducedMotion) {
      // Start first move after 1.5 seconds, then continue with normal 3.8s intervals
      setTimeout(() => {
        goNext();
        startAutoplay();
      }, 1500);
    }
  });

  // Hint-fetch only the first viewport-worth of project logos.
  (function preloadCriticalProjectImages() {
    const firstSlides = [
      "Imgs/ryvex-logo.webp",
      "Imgs/betl-logo.webp",
      "Imgs/Unlike-Logo.png",
    ];
    firstSlides.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
    });
  })();
})();