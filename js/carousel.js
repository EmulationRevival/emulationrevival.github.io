// carousel.js
document.addEventListener('DOMContentLoaded', () => {
  const CONSTANTS = {
    SELECTORS: {
      CONTAINER: '.carousel-container',
      TRACK: '.carousel-track',
      CAROUSEL_LINK: '.carousel-link',
      NEXT_BUTTON: '.carousel-button.next',
      PREV_BUTTON: '.carousel-button.prev',
      DOTS_CONTAINER: '.carousel-dots',
      IMAGE_IN_SLIDE: 'img',
      INTERACTION_STATE: ':hover, :focus-within',
      MAIN_HEADER: '.main-header',
    },
    CLASSES: {
      DOT: 'dot',
      ACTIVE: 'active',
      VISUALLY_HIDDEN: 'visually-hidden',
    },
    LAYOUT: {
      DESKTOP_BREAKPOINT: 768,
      ID_PREFIX_DESKTOP: 'desktop-',
      ID_PREFIX_MOBILE: 'mobile-',
    },
    ATTRIBUTES: {
      DATA_TARGET: 'data-target',
      ARIA_LIVE: 'aria-live',
      ID: 'id',
      ARIA_LABEL: 'aria-label',
      ROLE: 'role',
      ARIA_ROLEDESCRIPTION: 'aria-roledescription',
      ARIA_CONTROLS: 'aria-controls',
      ARIA_SELECTED: 'aria-selected',
      TABINDEX: 'tabindex',
      ARIA_HIDDEN: 'aria-hidden',
    },
    ROLES: {
      GROUP: 'group',
      TAB: 'tab',
      TABLIST: 'tablist',
      SLIDE: 'slide',
    },
    EVENTS: {
      CLICK: 'click',
      KEYDOWN: 'keydown',
      MOUSE_ENTER: 'mouseenter',
      MOUSE_LEAVE: 'mouseleave',
      FOCUS_IN: 'focusin',
      FOCUS_OUT: 'focusout',
      RESIZE: 'resize',
      CAROUSEL_SCROLLED: 'carousel:scrolled',
    },
    KEYS: {
      ARROW_RIGHT: 'ArrowRight',
      ARROW_LEFT: 'ArrowLeft',
    },
    ANIMATION: {
      DURATION: 600,
      EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
      FILL_MODE: 'forwards',
      PROPERTY: 'transform',
    },
    TIMING: {
      AUTOPLAY_INTERVAL: 5000,
    },
    CONFIG: {
      SCROLL_BUFFER: 20,
    },
    TEXT: {
      SLIDE_ID_PREFIX: 'carousel-slide-',
      SLIDE_LABEL: (index, total) => `Slide ${index + 1} of ${total}`,
      DOT_LABEL: (index) => `Go to slide ${index + 1}`,
      NOW_SHOWING: (slideLabel) => `Now showing: ${slideLabel}`,
      NEXT_SLIDE: 'Next slide',
      PREVIOUS_SLIDE: 'Previous slide',
      SLIDE_CONTROLS: 'Slide controls',
      FALLBACK_SLIDE_LABEL: (index) => `Slide ${index + 1}`,
    },
    ARIA_LIVE_MODE: 'polite',
  };

  const carouselContainer = document.querySelector(CONSTANTS.SELECTORS.CONTAINER);
  if (!carouselContainer) return;

  const mainHeader = document.querySelector(CONSTANTS.SELECTORS.MAIN_HEADER);
  const carouselTrack = carouselContainer.querySelector(CONSTANTS.SELECTORS.TRACK);
  const carouselSlides = Array.from(carouselTrack.children);
  const nextButton = carouselContainer.querySelector(CONSTANTS.SELECTORS.NEXT_BUTTON);
  const prevButton = carouselContainer.querySelector(CONSTANTS.SELECTORS.PREV_BUTTON);
  const dotsContainer = carouselContainer.querySelector(CONSTANTS.SELECTORS.DOTS_CONTAINER);

  // Accessibility: Visually hidden live region for slide announcements
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', CONSTANTS.ARIA_LIVE_MODE);
  liveRegion.className = CONSTANTS.CLASSES.VISUALLY_HIDDEN;
  carouselContainer.appendChild(liveRegion);

  let currentIndex = 0;
  let autoPlayInterval;
  let isAutoPlaying = false;
  let isAnimating = false;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isApiSupported = 'animate' in carouselTrack;

  carouselTrack.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LIVE, CONSTANTS.ARIA_LIVE_MODE);
  dotsContainer.setAttribute(CONSTANTS.ATTRIBUTES.ROLE, CONSTANTS.ROLES.TABLIST);
  dotsContainer.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.SLIDE_CONTROLS);

  carouselSlides.forEach((slide, index) => {
    slide.setAttribute(CONSTANTS.ATTRIBUTES.ID, `${CONSTANTS.TEXT.SLIDE_ID_PREFIX}${index}`);
    slide.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.SLIDE_LABEL(index, carouselSlides.length));
    slide.setAttribute(CONSTANTS.ATTRIBUTES.ROLE, CONSTANTS.ROLES.GROUP);
    slide.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_ROLEDESCRIPTION, CONSTANTS.ROLES.SLIDE);

    const dot = document.createElement('button');
    dot.classList.add(CONSTANTS.CLASSES.DOT);
    dot.setAttribute(CONSTANTS.ATTRIBUTES.ROLE, CONSTANTS.ROLES.TAB);
    dot.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.DOT_LABEL(index));
    dot.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_SELECTED, index === 0 ? "true" : "false");
    dot.setAttribute(CONSTANTS.ATTRIBUTES.TABINDEX, index === 0 ? '0' : '-1');
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  nextButton.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.NEXT_SLIDE);
  prevButton.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.PREVIOUS_SLIDE);

  function focusOnCurrentSlideLink() {
    const activeSlide = carouselSlides[currentIndex];
    if (activeSlide) {
      const linkToFocus = activeSlide.querySelector(CONSTANTS.SELECTORS.CAROUSEL_LINK);
      if (linkToFocus) {
        linkToFocus.focus();
      }
    }
  }

  function updateDots() {
    dots.forEach((dot, i) => {
      const isActive = i === currentIndex;
      dot.classList.toggle(CONSTANTS.CLASSES.ACTIVE, isActive);
      dot.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_SELECTED, isActive ? "true" : "false");
      dot.setAttribute(CONSTANTS.ATTRIBUTES.TABINDEX, isActive ? '0' : '-1');
    });
  }

  function updateSlideVisibility() {
    carouselSlides.forEach((slide, i) => {
      const isCurrent = i === currentIndex;
      slide.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_HIDDEN, (!isCurrent).toString());
      const link = slide.querySelector(CONSTANTS.SELECTORS.CAROUSEL_LINK);
      if (link) {
        link.setAttribute(CONSTANTS.ATTRIBUTES.TABINDEX, isCurrent ? '0' : '-1');
      }
    });
    const activeSlide = carouselSlides[currentIndex];
    const slideLabel = activeSlide.querySelector(CONSTANTS.SELECTORS.IMAGE_IN_SLIDE)?.alt || CONSTANTS.TEXT.FALLBACK_SLIDE_LABEL(currentIndex + 1);
    carouselTrack.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, CONSTANTS.TEXT.NOW_SHOWING(slideLabel));
    // Announce to screen readers
    liveRegion.textContent = CONSTANTS.TEXT.NOW_SHOWING(slideLabel);
  }

  function updateCarouselLinkHrefs() {
    const isDesktopView = window.innerWidth >= CONSTANTS.LAYOUT.DESKTOP_BREAKPOINT;
    const carouselLinks = carouselContainer.querySelectorAll(CONSTANTS.SELECTORS.CAROUSEL_LINK);
    carouselLinks.forEach(link => {
      const baseTargetName = link.dataset[CONSTANTS.ATTRIBUTES.DATA_TARGET.replace('data-', '')];
      if (!baseTargetName) return;
      const targetId = isDesktopView
        ? CONSTANTS.LAYOUT.ID_PREFIX_DESKTOP + baseTargetName
        : CONSTANTS.LAYOUT.ID_PREFIX_MOBILE + baseTargetName;
      link.href = `#${targetId}`;
    });
  }

  function setNavDisabled(disabled) {
    nextButton.disabled = !!disabled;
    prevButton.disabled = !!disabled;
    dots.forEach(dot => dot.disabled = !!disabled);
  }

  function moveToSlide(newIndex, isUserInitiated = false) {
    if (isAnimating) return;
    if (newIndex < 0) newIndex = carouselSlides.length - 1;
    else if (newIndex >= carouselSlides.length) newIndex = 0;
    if (newIndex === currentIndex) return;

    const oldIndex = currentIndex;
    currentIndex = newIndex;
    updateDots();
    updateSlideVisibility();

    const performFocus = () => {
      if (isUserInitiated) focusOnCurrentSlideLink();
    };

    const startTransform = `translateX(-${oldIndex * 100}%)`;
    const endTransform = `translateX(-${currentIndex * 100}%)`;

    if (motionQuery.matches || !isApiSupported) {
      carouselTrack.style.transform = endTransform;
      performFocus();
      return;
    }

    isAnimating = true;
    setNavDisabled(true);
    const animation = carouselTrack.animate(
      [{ [CONSTANTS.ANIMATION.PROPERTY]: startTransform }, { [CONSTANTS.ANIMATION.PROPERTY]: endTransform }],
      { duration: CONSTANTS.ANIMATION.DURATION, easing: CONSTANTS.ANIMATION.EASING, fill: CONSTANTS.ANIMATION.FILL_MODE }
    );
    animation.onfinish = () => {
      isAnimating = false;
      setNavDisabled(false);
      performFocus();
    };
    animation.oncancel = () => {
      isAnimating = false;
      setNavDisabled(false);
    };
  }

  function startAutoPlay() {
    if (isAutoPlaying) return;
    isAutoPlaying = true;
    autoPlayInterval = setInterval(() => { moveToSlide(currentIndex + 1); }, CONSTANTS.TIMING.AUTOPLAY_INTERVAL);
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    clearInterval(autoPlayInterval);
  }

  function resetAutoPlay() {
    stopAutoPlay();
    if (!carouselContainer.matches(CONSTANTS.SELECTORS.INTERACTION_STATE)) {
      startAutoPlay();
    }
  }

  function setupAccordionLinks() {
    const carouselLinks = carouselContainer.querySelectorAll(CONSTANTS.SELECTORS.CAROUSEL_LINK);
    carouselLinks.forEach(link => {
      link.addEventListener(CONSTANTS.EVENTS.CLICK, (event) => {
        event.preventDefault();
        stopAutoPlay();
        const baseTargetName = link.dataset[CONSTANTS.ATTRIBUTES.DATA_TARGET.replace('data-', '')];
        if (!baseTargetName) return;
        const isDesktopView = window.innerWidth >= CONSTANTS.LAYOUT.DESKTOP_BREAKPOINT;
        const preferredId = (isDesktopView ? CONSTANTS.LAYOUT.ID_PREFIX_DESKTOP : CONSTANTS.LAYOUT.ID_PREFIX_MOBILE) + baseTargetName;
        const fallbackId = (isDesktopView ? CONSTANTS.LAYOUT.ID_PREFIX_MOBILE : CONSTANTS.LAYOUT.ID_PREFIX_DESKTOP) + baseTargetName;
        let targetAccordion = document.getElementById(preferredId) || document.getElementById(fallbackId);
        if (!targetAccordion) {
          console.warn(`Carousel could not find a target accordion for: ${baseTargetName}`);
          return;
        }
        const summary = targetAccordion.querySelector('summary');
        if (!summary) return;
        const headerHeight = mainHeader ? mainHeader.offsetHeight : 0;
        const buffer = CONSTANTS.CONFIG.SCROLL_BUFFER;
        const targetPosition = targetAccordion.getBoundingClientRect().top + window.scrollY - headerHeight - buffer;
        window.scrollTo({
          top: targetPosition,
          behavior: motionQuery.matches ? 'auto' : 'smooth',
        });
        document.dispatchEvent(new CustomEvent(CONSTANTS.EVENTS.CAROUSEL_SCROLLED, {
          detail: { targetId: targetAccordion.id },
        }));
      });
    });
  }

  nextButton.addEventListener(CONSTANTS.EVENTS.CLICK, () => {
    moveToSlide(currentIndex + 1, true);
    resetAutoPlay();
  });

  prevButton.addEventListener(CONSTANTS.EVENTS.CLICK, () => {
    moveToSlide(currentIndex - 1, true);
    resetAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener(CONSTANTS.EVENTS.CLICK, () => {
      moveToSlide(index, true);
      resetAutoPlay();
    });
  });

  carouselContainer.addEventListener(CONSTANTS.EVENTS.KEYDOWN, (e) => {
    if (isAnimating) return;
    if (e.key === CONSTANTS.KEYS.ARROW_RIGHT) {
      e.preventDefault();
      moveToSlide(currentIndex + 1, true);
      resetAutoPlay();
    } else if (e.key === CONSTANTS.KEYS.ARROW_LEFT) {
      e.preventDefault();
      moveToSlide(currentIndex - 1, true);
      resetAutoPlay();
    }
  });

  carouselContainer.addEventListener(CONSTANTS.EVENTS.MOUSE_ENTER, stopAutoPlay);
  carouselContainer.addEventListener(CONSTANTS.EVENTS.MOUSE_LEAVE, resetAutoPlay);

  const handleFocusIn = (event) => {
    stopAutoPlay();
    if (!event.relatedTarget || !carouselContainer.contains(event.relatedTarget)) {
      carouselContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  carouselContainer.addEventListener(CONSTANTS.EVENTS.FOCUS_IN, handleFocusIn);
  carouselContainer.addEventListener(CONSTANTS.EVENTS.FOCUS_OUT, resetAutoPlay);
  window.addEventListener(CONSTANTS.EVENTS.RESIZE, () => {
    clearTimeout(window.carouselResizeTimeout);
    window.carouselResizeTimeout = setTimeout(updateCarouselLinkHrefs, 150);
  });

  updateCarouselLinkHrefs();
  updateDots();
  updateSlideVisibility();
  setupAccordionLinks();
  startAutoPlay();

  // --- Cleanup for SPA/future-proofing ---
  window.destroyCarousel = function() {
    stopAutoPlay();
    nextButton.removeEventListener(CONSTANTS.EVENTS.CLICK, moveToSlide);
    prevButton.removeEventListener(CONSTANTS.EVENTS.CLICK, moveToSlide);
    dots.forEach((dot, index) => {
      dot.removeEventListener(CONSTANTS.EVENTS.CLICK, moveToSlide);
    });
    carouselContainer.removeEventListener(CONSTANTS.EVENTS.KEYDOWN, moveToSlide);
    carouselContainer.removeEventListener(CONSTANTS.EVENTS.MOUSE_ENTER, stopAutoPlay);
    carouselContainer.removeEventListener(CONSTANTS.EVENTS.MOUSE_LEAVE, resetAutoPlay);
    carouselContainer.removeEventListener(CONSTANTS.EVENTS.FOCUS_IN, handleFocusIn);
    carouselContainer.removeEventListener(CONSTANTS.EVENTS.FOCUS_OUT, resetAutoPlay);
    window.removeEventListener(CONSTANTS.EVENTS.RESIZE, updateCarouselLinkHrefs);
    if (liveRegion && liveRegion.parentNode) {
      liveRegion.parentNode.removeChild(liveRegion);
    }
  };
});
