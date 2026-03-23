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
    HAS_SUBMENU_TRIGGER: '.has-submenu > .submenu-toggle',
    SUBMENU_PANEL: '.submenu-panel',
    SUBMENU_LIST: '.submenu',
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
  submenuTriggers: Array.from(document.querySelectorAll(C.SEL.HAS_SUBMENU_TRIGGER)),
  submenuPanels: Array.from(document.querySelectorAll(C.SEL.SUBMENU_PANEL)),
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
const submenuByPanel = new Map();

for (let i = 0; i < el.submenuTriggers.length; i++) {
  const trigger = el.submenuTriggers[i];
  const panel = trigger.parentElement?.querySelector(':scope > .submenu-panel');

  if (!panel) continue;

  const submenu = panel.querySelector(':scope > .submenu');
  const backButton = panel.querySelector(':scope > .drilldown-back');

  const relation = {
    trigger,
    panel,
    submenu,
    backButton,
  };

  submenuMap.set(trigger, relation);
  submenuByPanel.set(panel, relation);

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
  submenuMap.forEach(({ trigger, panel }) => {
    panel.classList.remove(C.CLS.ACTIVE);
    trigger.setAttribute('aria-expanded', 'false');
  });

  state.activeSubmenu = null;
}

function notifyNavMenuState(open) {
  window.dispatchEvent(new CustomEvent(C.EVENTS.NAV_MENU_STATE_CHANGE, {
    detail: { open },
  }));
}

function closeOtherSubmenus(activePanel) {
  submenuMap.forEach(({ trigger, panel }) => {
    if (panel === activePanel) return;

    panel.classList.remove(C.CLS.ACTIVE);
    trigger.setAttribute('aria-expanded', 'false');

    if (state.activeSubmenu === panel) {
      state.activeSubmenu = null;
    }
  });
}

function openSubmenu(trigger, panel) {
  if (!state.isMobile || !trigger || !panel) return;

  if (panel.classList.contains(C.CLS.ACTIVE)) {
    state.activeSubmenu = panel;
    return;
  }

  closeOtherSubmenus(panel);
  panel.classList.add(C.CLS.ACTIVE);
  trigger.setAttribute('aria-expanded', 'true');
  state.activeSubmenu = panel;
}

function closeSubmenu(panel, { restoreFocus = true } = {}) {
  if (!panel) return;

  const relationToClose = submenuByPanel.get(panel);
  if (!relationToClose) return;

  relationToClose.panel.classList.remove(C.CLS.ACTIVE);
  relationToClose.trigger.setAttribute('aria-expanded', 'false');

  if (state.activeSubmenu === relationToClose.panel) {
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

submenuMap.forEach(({ trigger, panel }) => {
  function handleOpenSubmenu(event) {
    if (!state.isMobile) return;

    event.preventDefault();
    event.stopPropagation();
    openSubmenu(trigger, panel);
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
      closeSubmenu(relation.panel, { restoreFocus: true });
    }
    return;
  }

  const link = event.target.closest('a');
  if (!link || link.closest('.has-submenu')) return;

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