// accordion.js
document.addEventListener('DOMContentLoaded', () => {
  const CONSTANTS = {
    SELECTORS: {
      ACCORDION_ITEM: 'details.accordion-item',
      SUMMARY: 'summary.accordion-header',
      CONTENT: '.accordion-content',
      CLOSE_TRIGGER: '.accordion-close-trigger',
      MAIN_HEADER: '.main-header',
    },
    ATTRIBUTES: {
      ARIA_CONTROLS: 'aria-controls',
      ARIA_EXPANDED: 'aria-expanded',
    },
    IDS: {
      CONTENT_PREFIX: 'accordion-content-',
    },
    EVENTS: {
      CLICK: 'click',
      CHANGE: 'change',
      CAROUSEL_SCROLLED: 'carousel:scrolled',
      TOGGLE: 'toggle',
    },
    QUERIES: {
      REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
    },
    ANIMATION: {
      DURATION: 250,
      EASING: 'ease-out',
    },
    SCROLL_OFFSET: 20, // Offset in pixels to account for fixed headers
  };

  // Store all Accordion instances for global event handling
  const accordions = new Map();

  class Accordion {
    #animation = null;
    #state = 'idle'; // 'idle' | 'opening' | 'closing'

    constructor(el) {
      this.el = el;
      this.summary = el.querySelector(CONSTANTS.SELECTORS.SUMMARY);
      this.content = el.querySelector(CONSTANTS.SELECTORS.CONTENT);
      this.closeTrigger = el.querySelector(CONSTANTS.SELECTORS.CLOSE_TRIGGER);

      if (!this.summary || !this.content) {
        throw new Error('Accordion markup is missing required elements.');
      }

      // Ensure unique content ID and ARIA attributes
      const contentId = this.content.id || `${CONSTANTS.IDS.CONTENT_PREFIX}${crypto.randomUUID()}`;
      this.content.id = contentId;
      this.summary.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_CONTROLS, contentId);
      this.summary.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, String(this.el.open));

      // Reduced motion support
      this.motionQuery = window.matchMedia(CONSTANTS.QUERIES.REDUCED_MOTION);
      this.hasReducedMotion = this.motionQuery.matches;

      // Store handler references for cleanup
      this.onClick = (e) => {
        // Only prevent default for mouse events, not keyboard
        if (e.pointerType === 'mouse' || (e.type === 'click' && e.detail !== 0)) {
          e.preventDefault();
        }
        if (!this.isApiSupported() || this.hasReducedMotion) return;
        if (this.#state !== 'idle') return;
        this.el.style.overflow = 'hidden';
        if (!this.el.open) {
          this.open();
        } else {
          this.shrink();
        }
      };

      this.onMotionChange = () => {
        this.hasReducedMotion = this.motionQuery.matches;
      };

      this.onCloseClick = () => {
        if (this.el.open && this.#state === 'idle') {
          const header = document.querySelector(CONSTANTS.SELECTORS.MAIN_HEADER);
          const headerHeight = header?.offsetHeight || 0;
          const elementPosition = this.summary.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerHeight - CONSTANTS.SCROLL_OFFSET;
          this.el.open = false;
          this.updateAriaExpanded();
          window.scrollTo({
            top: offsetPosition,
            behavior: this.hasReducedMotion ? 'auto' : 'smooth',
          });
        }
      };

      this.onToggle = () => this.updateAriaExpanded();

      // Attach event listeners
      this.summary.addEventListener(CONSTANTS.EVENTS.CLICK, this.onClick);
      this.motionQuery.addEventListener(CONSTANTS.EVENTS.CHANGE, this.onMotionChange);

      if (this.closeTrigger) {
        this.closeTrigger.addEventListener(CONSTANTS.EVENTS.CLICK, this.onCloseClick);
      }

      this.el.addEventListener(CONSTANTS.EVENTS.TOGGLE, this.onToggle);
    }

    isApiSupported() {
      return 'animate' in this.el;
    }

    updateAriaExpanded() {
      this.summary.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, String(this.el.open));
    }

    shrink() {
      this.#state = 'closing';
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight}px`;
      if (this.#animation) this.#animation.cancel();
      this.#animation = this.el.animate({ height: [startHeight, endHeight] }, {
        duration: CONSTANTS.ANIMATION.DURATION,
        easing: CONSTANTS.ANIMATION.EASING,
      });
      this.#animation.onfinish = () => this.onAnimationFinish(false);
      this.#animation.oncancel = () => {
        this.#state = 'idle';
        this.el.style.overflow = '';
        this.el.style.height = '';
      };
    }

    open() {
      this.el.style.height = `${this.el.offsetHeight}px`;
      this.el.open = true;
      this.updateAriaExpanded();
      window.requestAnimationFrame(() => this.expand());
    }

    expand() {
      this.#state = 'opening';
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
      if (this.#animation) this.#animation.cancel();
      this.#animation = this.el.animate({ height: [startHeight, endHeight] }, {
        duration: CONSTANTS.ANIMATION.DURATION,
        easing: CONSTANTS.ANIMATION.EASING,
      });
      this.#animation.onfinish = () => this.onAnimationFinish(true);
      this.#animation.oncancel = () => {
        this.#state = 'idle';
        this.el.style.overflow = '';
        this.el.style.height = '';
      };
    }

    onAnimationFinish(open) {
      this.el.open = open;
      this.updateAriaExpanded();
      this.#animation = null;
      this.#state = 'idle';
      this.el.style.height = '';
      this.el.style.overflow = '';
      if (open) {
        this.el.dispatchEvent(new CustomEvent('accordion:opened', { bubbles: true }));
      } else {
        this.el.dispatchEvent(new CustomEvent('accordion:closed', { bubbles: true }));
      }
    }

    // For SPA/dynamic usage: cleanup all listeners
    destroy() {
      this.summary.removeEventListener(CONSTANTS.EVENTS.CLICK, this.onClick);
      this.motionQuery.removeEventListener(CONSTANTS.EVENTS.CHANGE, this.onMotionChange);
      if (this.closeTrigger) {
        this.closeTrigger.removeEventListener(CONSTANTS.EVENTS.CLICK, this.onCloseClick);
      }
      this.el.removeEventListener(CONSTANTS.EVENTS.TOGGLE, this.onToggle);
    }

    // Encapsulate external open logic for global handler
    handleExternalOpen() {
      if (this.el.open || this.#state !== 'idle') return;

      if (this.hasReducedMotion || !this.isApiSupported()) {
        this.el.open = true;
        this.updateAriaExpanded();
        this.summary.focus({ preventScroll: true });
      } else {
        this.open();
        this.#animation?.finished.finally(() => {
          this.summary.focus({ preventScroll: true });
        });
      }
    }
  }

  // Global carousel:scrolled event handler - delegates to Accordion instance
  function onCarouselScrolled(e) {
    const { targetId } = e.detail || {};
    if (!targetId) return;

    const accordion = accordions.get(targetId);
    if (accordion) {
      accordion.handleExternalOpen();
    }
  }
  document.addEventListener(CONSTANTS.EVENTS.CAROUSEL_SCROLLED, onCarouselScrolled);

  // Initialize all static accordions on the page, with error handling
  document.querySelectorAll(CONSTANTS.SELECTORS.ACCORDION_ITEM).forEach((el) => {
    try {
      const instance = new Accordion(el);
      accordions.set(el.id, instance);
    } catch (e) {
      console.error(`Failed to initialize accordion: ${e.message}`, el);
    }
  });

  // Optional: expose destroyAll for SPA/dynamic use
  window.destroyAllAccordions = () => {
    accordions.forEach((instance) => instance.destroy());
    accordions.clear();
    document.removeEventListener(CONSTANTS.EVENTS.CAROUSEL_SCROLLED, onCarouselScrolled);
  };
});
