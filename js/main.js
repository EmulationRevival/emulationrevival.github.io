import {
  scheduleTask,
  createFocusTrap,
  scheduleHashTargetFocus,
  markCurrentPageLinks,
  normalizeExternalLinks,
  initLiteYouTubeEmbeds,
  CARD_HASH_FOCUS_OPTIONS,
} from './ui-utils.js';

const C = {
  SEL: {
    HAMBURGER: '.hamburger-menu',
    NAV_LIST: '.nav-list',
    MAIN_HEADER: '.main-header',
    MAIN_NAV: 'nav.main-nav',
    NAV_PAGE_LINKS: '.nav-list a, .footer-nav a',
    EXTERNAL_LINKS: 'a[href^="http"]',
    LITE_YOUTUBE: '.lite-youtube',
    HAS_SUBMENU_LINK: '.has-submenu > a',
    SUBMENU: '.submenu',
    DISCORD_TRIGGERS: '[data-modal-target="discord-hub"]',
    DISCORD_MODAL: '#discordHubModal',
    DISCORD_OVERLAY: '#discordHubOverlay',
    DISCORD_CLOSE: '#discordHubClose',
  },
  CLS: {
    ACTIVE: 'active',
    BACK: 'drilldown-back',
  },
  BP: {
    MOBILE: 992,
  },
  THEME_KEY: 'theme',
  EVENTS: {
    REQUEST_MOBILE_SEARCH_PANEL: 'requestMobileSearchPanel',
    NAV_MENU_STATE_CHANGE: 'navMenuStateChange',
    REQUEST_CLOSE_MOBILE_MENU: 'requestCloseMobileMenu',
  },
};

const el = {
  hamburger: document.querySelector(C.SEL.HAMBURGER),
  nav: document.querySelector(C.SEL.NAV_LIST),
  header: document.querySelector(C.SEL.MAIN_HEADER),
  mainNav: document.querySelector(C.SEL.MAIN_NAV),
  themeToggle: document.getElementById('theme-toggle'),
  submenuLinks: Array.from(document.querySelectorAll(C.SEL.HAS_SUBMENU_LINK)),
  submenus: Array.from(document.querySelectorAll(C.SEL.SUBMENU)),
  discordModal: document.querySelector(C.SEL.DISCORD_MODAL),
  discordOverlay: document.querySelector(C.SEL.DISCORD_OVERLAY),
  discordTriggers: Array.from(document.querySelectorAll(C.SEL.DISCORD_TRIGGERS)),
  discordClose: document.querySelector(C.SEL.DISCORD_CLOSE),
  navPageLinks: Array.from(document.querySelectorAll(C.SEL.NAV_PAGE_LINKS)),
  externalLinks: Array.from(document.querySelectorAll(C.SEL.EXTERNAL_LINKS)),
  liteYoutube: Array.from(document.querySelectorAll(C.SEL.LITE_YOUTUBE)),
};

const state = {
  isMobile: window.matchMedia(`(max-width:${C.BP.MOBILE}px)`).matches,
  activeSubmenu: null,
};

const focusTrap = createFocusTrap();

let scrollLocks = 0;
let scrollBarWidth = '0px';

const submenuMap = new Map();
const submenuByBackButton = new Map();
const submenuByElement = new Map();

for (let i = 0; i < el.submenuLinks.length; i++) {
  const trigger = el.submenuLinks[i];
  const submenu = trigger.parentElement?.querySelector(':scope > .submenu');

  if (!submenu) continue;

  const backButton = submenu.querySelector(`:scope > .${C.CLS.BACK}`);

  const relation = {
    trigger,
    submenu,
    backButton,
  };

  submenuMap.set(trigger, relation);
  submenuByElement.set(submenu, relation);

  if (backButton) {
    submenuByBackButton.set(backButton, relation);
  }
}

function setScrollLock(lock) {
  const body = document.body;
  if (!body) return;

  if (lock) {
    if (scrollLocks === 0) {
      scrollBarWidth = `${window.innerWidth - document.documentElement.clientWidth}px`;
    }
    scrollLocks++;
  } else if (scrollLocks > 0) {
    scrollLocks--;
  }

  if (scrollLocks > 0) {
    body.style.overflow = 'hidden';
    body.style.paddingRight = scrollBarWidth;
    if (el.header) el.header.style.paddingRight = scrollBarWidth;
  } else {
    body.style.overflow = '';
    body.style.paddingRight = '';
    if (el.header) el.header.style.paddingRight = '';
  }
}

window.addEventListener('requestScrollLock', event => {
  if (event.detail && typeof event.detail.lock === 'boolean') {
    setScrollLock(event.detail.lock);
  }
});

function toggleModal(force) {
  const { discordModal, discordOverlay } = el;
  if (!discordModal || !discordOverlay) return;

  const open = force ?? !discordModal.classList.contains(C.CLS.ACTIVE);

  discordModal.classList.toggle(C.CLS.ACTIVE, open);
  discordOverlay.classList.toggle(C.CLS.ACTIVE, open);
  discordModal.setAttribute('aria-hidden', String(!open));

  setScrollLock(open);

  if (open) {
    requestAnimationFrame(() => focusTrap.activate(discordModal));
  } else {
    focusTrap.deactivate();
  }
}

el.discordTriggers.forEach(trigger => {
  trigger.addEventListener('click', event => {
    event.preventDefault();
    toggleModal(true);
  });
});

el.discordClose?.addEventListener('click', () => toggleModal(false));
el.discordOverlay?.addEventListener('click', () => toggleModal(false));

function resetSubmenus() {
  submenuMap.forEach(({ trigger, submenu }) => {
    submenu.classList.remove(C.CLS.ACTIVE);
    trigger.setAttribute('aria-expanded', 'false');
  });

  state.activeSubmenu = null;
}

function notifyNavMenuState(open) {
  window.dispatchEvent(new CustomEvent(C.EVENTS.NAV_MENU_STATE_CHANGE, {
    detail: { open },
  }));
}

function closeOtherSubmenus(activeSubmenu) {
  submenuMap.forEach(({ trigger, submenu }) => {
    if (submenu === activeSubmenu) return;

    submenu.classList.remove(C.CLS.ACTIVE);
    trigger.setAttribute('aria-expanded', 'false');

    if (state.activeSubmenu === submenu) {
      state.activeSubmenu = null;
    }
  });
}

function openSubmenu(trigger, submenu) {
  if (!state.isMobile || !trigger || !submenu) return;

  if (submenu.classList.contains(C.CLS.ACTIVE)) {
    state.activeSubmenu = submenu;
    return;
  }

  closeOtherSubmenus(submenu);
  submenu.classList.add(C.CLS.ACTIVE);
  trigger.setAttribute('aria-expanded', 'true');
  state.activeSubmenu = submenu;
}

function closeSubmenu(submenu, { restoreFocus = true } = {}) {
  if (!submenu) return;

  const relationToClose = submenuByElement.get(submenu);
  if (!relationToClose) return;

  relationToClose.submenu.classList.remove(C.CLS.ACTIVE);
  relationToClose.trigger.setAttribute('aria-expanded', 'false');

  if (state.activeSubmenu === relationToClose.submenu) {
    state.activeSubmenu = null;
  }

  if (restoreFocus) {
    relationToClose.trigger.focus({ preventScroll: true });
  }
}

function closeActiveSubmenu({ restoreFocus = true } = {}) {
  if (!state.activeSubmenu) return false;

  closeSubmenu(state.activeSubmenu, { restoreFocus });
  return true;
}

function openMenu({ focusTarget = null, activateTrap = true } = {}) {
  if (!el.nav) return;

  const wasOpen = el.nav.classList.contains(C.CLS.ACTIVE);

  el.nav.classList.add(C.CLS.ACTIVE);
  el.hamburger?.classList.add(C.CLS.ACTIVE);
  el.hamburger?.setAttribute('aria-expanded', 'true');

  if (!wasOpen) {
    setScrollLock(true);

    if (activateTrap) {
      focusTrap.activate(el.nav);
    }

    notifyNavMenuState(true);
  }

  if (focusTarget && document.contains(focusTarget)) {
    requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
    });
  }
}

function closeMenu() {
  if (!el.nav) return;
  if (!el.nav.classList.contains(C.CLS.ACTIVE)) return;

  el.nav.classList.remove(C.CLS.ACTIVE);
  el.hamburger?.classList.remove(C.CLS.ACTIVE);
  el.hamburger?.setAttribute('aria-expanded', 'false');

  resetSubmenus();
  focusTrap.deactivate();
  setScrollLock(false);
  notifyNavMenuState(false);
}

el.hamburger?.addEventListener('click', event => {
  event.stopPropagation();

  if (el.nav?.classList.contains(C.CLS.ACTIVE)) {
    closeMenu();
  } else {
    openMenu({ activateTrap: false });
  }
});

window.addEventListener(C.EVENTS.REQUEST_MOBILE_SEARCH_PANEL, event => {
  if (!state.isMobile) return;

  openMenu({
    focusTarget: event.detail?.focusTarget || null,
    activateTrap: false,
  });
});

window.addEventListener(C.EVENTS.REQUEST_CLOSE_MOBILE_MENU, () => {
  if (!state.isMobile) return;
  closeMenu();
});

submenuMap.forEach(({ trigger, submenu }) => {
  function handleOpenSubmenu(event) {
    if (!state.isMobile) return;

    event.preventDefault();
    event.stopPropagation();
    openSubmenu(trigger, submenu);
  }

  trigger.addEventListener('click', handleOpenSubmenu);
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleOpenSubmenu(event);
    }
  });
});

el.nav?.addEventListener('click', event => {
  const backButton = event.target.closest(`.${C.CLS.BACK}`);
  if (backButton) {
    const relation = submenuByBackButton.get(backButton);
    if (relation) {
      closeSubmenu(relation.submenu, { restoreFocus: true });
    }
    return;
  }

  const link = event.target.closest('a');
  if (!link || link.parentElement.classList.contains('has-submenu')) return;

  closeMenu();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (el.discordModal?.classList.contains(C.CLS.ACTIVE)) {
    toggleModal(false);
    return;
  }

  if (el.nav?.classList.contains(C.CLS.ACTIVE)) {
    if (closeActiveSubmenu({ restoreFocus: true })) {
      return;
    }

    closeMenu();
  }
});

const mq = window.matchMedia(`(max-width:${C.BP.MOBILE}px)`);

function handleMqChange(event) {
  state.isMobile = event.matches;

  if (!state.isMobile) {
    closeMenu();
  }
}

if (mq.addEventListener) {
  mq.addEventListener('change', handleMqChange);
} else {
  mq.addListener(handleMqChange);
}

if (el.themeToggle) {
  const saved =
    localStorage.getItem(C.THEME_KEY) ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.dataset.theme = saved;
  el.themeToggle.setAttribute('aria-pressed', String(saved === 'dark'));

  el.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    el.themeToggle.setAttribute('aria-pressed', String(next === 'dark'));
    localStorage.setItem(C.THEME_KEY, next);
  });
}

scheduleTask(() => {
  const copyYear = document.getElementById('copyright-year');
  if (copyYear) {
    copyYear.textContent = String(new Date().getFullYear());
  }

  el.mainNav?.setAttribute('role', 'navigation');

  markCurrentPageLinks(el.navPageLinks);
  normalizeExternalLinks(el.externalLinks, { excludeClass: 'download-link' });
  initLiteYouTubeEmbeds(el.liteYoutube);

  scheduleHashTargetFocus(CARD_HASH_FOCUS_OPTIONS);
});

window.addEventListener('hashchange', () => {
  scheduleHashTargetFocus(CARD_HASH_FOCUS_OPTIONS);
});

window.addEventListener('pageshow', event => {
  if (event.persisted) {
    closeMenu();
  }

  scheduleHashTargetFocus(CARD_HASH_FOCUS_OPTIONS);
});