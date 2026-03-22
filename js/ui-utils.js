export const CARD_HASH_FOCUS_OPTIONS = Object.freeze({
  targetSelector: '.card-link',
});

export function scheduleTask(callback) {
  if (typeof callback !== 'function') return;

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      callback();
    });
    return;
  }

  window.setTimeout(() => {
    callback();
  }, 1);
}

export function createFocusTrap() {
  let activeContainer = null;
  let previousActiveElement = null;
  let boundKeydownHandler = null;

  function isElementActuallyVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.offsetParent !== null) return true;

    const style = window.getComputedStyle(element);
    return style.position === 'fixed' && style.display !== 'none' && style.visibility !== 'hidden';
  }

  function getFocusableElements(container) {
    if (!container) return [];

    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => isElementActuallyVisible(element));
  }

  function handleKeydown(event) {
    if (event.key !== 'Tab' || !activeContainer) return;

    const focusable = getFocusableElements(activeContainer);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !activeContainer.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !activeContainer.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate(container) {
    if (!container) return;

    deactivate({ restoreFocus: false });

    activeContainer = container;
    previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    boundKeydownHandler = handleKeydown;
    document.addEventListener('keydown', boundKeydownHandler);

    const focusable = getFocusableElements(activeContainer);
    if (focusable.length) {
      focusable[0].focus({ preventScroll: true });
      return;
    }

    if (!activeContainer.hasAttribute('tabindex')) {
      activeContainer.setAttribute('tabindex', '-1');
    }

    activeContainer.focus({ preventScroll: true });
  }

  function deactivate({ restoreFocus = true } = {}) {
    if (boundKeydownHandler) {
      document.removeEventListener('keydown', boundKeydownHandler);
      boundKeydownHandler = null;
    }

    const targetToRestore = previousActiveElement;
    activeContainer = null;
    previousActiveElement = null;

    if (restoreFocus && targetToRestore && document.contains(targetToRestore)) {
      targetToRestore.focus({ preventScroll: true });
    }
  }

  return {
    activate,
    deactivate,
  };
}

export function focusElementSafely(element, { focusSelector = '' } = {}) {
  if (!(element instanceof HTMLElement)) return null;

  const target =
    focusSelector && typeof focusSelector === 'string'
      ? element.querySelector(focusSelector) || element
      : element;

  if (!(target instanceof HTMLElement)) return null;

  const usedTemporaryTabIndex = target === element && !target.hasAttribute('tabindex');

  if (usedTemporaryTabIndex) {
    target.setAttribute('tabindex', '-1');
  }

  target.focus({ preventScroll: true });

  if (usedTemporaryTabIndex) {
    target.addEventListener(
      'blur',
      () => {
        if (target.getAttribute('tabindex') === '-1') {
          target.removeAttribute('tabindex');
        }
      },
      { once: true }
    );
  }

  return target;
}

export function resolveHashTarget(hash = window.location.hash) {
  if (typeof hash !== 'string' || hash.length <= 1) return null;

  const id = decodeURIComponent(hash.slice(1));
  if (!id) return null;

  return document.getElementById(id);
}

export function focusHashTarget({
  hash = window.location.hash,
  targetSelector = '',
  fallbackSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
} = {}) {
  const target = resolveHashTarget(hash);
  if (!(target instanceof HTMLElement)) return null;

  let focusTarget = null;

  if (targetSelector && typeof targetSelector === 'string') {
    focusTarget = target.querySelector(targetSelector);
  }

  if (!(focusTarget instanceof HTMLElement) && fallbackSelector && typeof fallbackSelector === 'string') {
    focusTarget = target.querySelector(fallbackSelector);
  }

  return focusElementSafely(focusTarget || target);
}

export function scheduleHashTargetFocus(options = {}) {
  if (!window.location.hash) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      focusHashTarget(options);
    });
  });
}

export function markCurrentPageLinks(links, currentPath = window.location.pathname) {
  if (!Array.isArray(links) || !currentPath) return;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    try {
      if (new URL(link.href, window.location.origin).pathname === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    } catch {}
  }
}

export function normalizeExternalLinks(links, { excludeClass = 'download-link' } = {}) {
  if (!Array.isArray(links)) return;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    try {
      if (
        new URL(link.href).hostname !== window.location.hostname &&
        !link.classList.contains(excludeClass)
      ) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {}
  }
}

export function initLiteYouTubeEmbeds(wrappers) {
  if (!Array.isArray(wrappers)) return;

  for (let i = 0; i < wrappers.length; i++) {
    const wrapper = wrappers[i];

    wrapper.addEventListener(
      'click',
      function () {
        const id = this.dataset.videoId;
        if (!id) return;

        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';

        this.replaceChildren(iframe);
      },
      { once: true }
    );
  }
}