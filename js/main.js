import { scheduleTask, createFocusTrap } from './ui-utils.js';

const C = {
  SEL: {
    HAMBURGER: '.hamburger-menu',
    NAV_LIST: '.nav-list',
    MAIN_HEADER: '.main-header',
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
  },
};

const el = {
  hamburger: document.querySelector(C.SEL.HAMBURGER),
  nav: document.querySelector(C.SEL.NAV_LIST),
  header: document.querySelector(C.SEL.MAIN_HEADER),
  themeToggle: document.getElementById('theme-toggle'),
  submenuLinks: document.querySelectorAll(C.SEL.HAS_SUBMENU_LINK),
  submenus: document.querySelectorAll(C.SEL.SUBMENU),
  discordModal: document.querySelector(C.SEL.DISCORD_MODAL),
  discordOverlay: document.querySelector(C.SEL.DISCORD_OVERLAY),
  discordTriggers: document.querySelectorAll(C.SEL.DISCORD_TRIGGERS),
  discordClose: document.querySelector(C.SEL.DISCORD_CLOSE),
};

const state = {
  isMobile: window.matchMedia(`(max-width:${C.BP.MOBILE}px)`).matches,
};

const focusTrap = createFocusTrap();

let scrollLocks = 0;
let scrollBarWidth = '0px';

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
  el.submenus.forEach(menu => menu.classList.remove(C.CLS.ACTIVE));
  el.submenuLinks.forEach(link => link.setAttribute('aria-expanded', 'false'));
}

function notifyNavMenuState(open) {
  window.dispatchEvent(new CustomEvent(C.EVENTS.NAV_MENU_STATE_CHANGE, {
    detail: { open },
  }));
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

el.submenuLinks.forEach(link => {
  const submenu = link.parentElement?.querySelector(C.SEL.SUBMENU);
  if (!submenu) return;

  function openSubmenu(event) {
    if (!state.isMobile) return;
    event.preventDefault();
    event.stopPropagation();

    if (submenu.classList.contains(C.CLS.ACTIVE)) return;

    el.submenus.forEach(menu => {
      if (menu !== submenu) {
        menu.classList.remove(C.CLS.ACTIVE);
        const parentLink = menu.parentElement?.querySelector(':scope > a');
        parentLink?.setAttribute('aria-expanded', 'false');
      }
    });

    submenu.classList.add(C.CLS.ACTIVE);
    link.setAttribute('aria-expanded', 'true');
  }

  link.addEventListener('click', openSubmenu);
  link.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
      openSubmenu(event);
    }
  });
});

el.nav?.addEventListener('click', event => {
  const back = event.target.closest(`.${C.CLS.BACK}`);
  if (back) {
    const submenu = back.closest(C.SEL.SUBMENU);
    submenu?.classList.remove(C.CLS.ACTIVE);

    const parentLink = submenu?.parentElement?.querySelector(':scope > a');
    parentLink?.setAttribute('aria-expanded', 'false');
    parentLink?.focus({ preventScroll: true });
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
    const openSub = el.nav.querySelector(`${C.SEL.SUBMENU}.${C.CLS.ACTIVE}`);
    if (openSub) {
      openSub.classList.remove(C.CLS.ACTIVE);

      const parentLink = openSub.parentElement?.querySelector(':scope > a');
      parentLink?.setAttribute('aria-expanded', 'false');
      parentLink?.focus({ preventScroll: true });
      return;
    }

    closeMenu();
  }
});

const mq = window.matchMedia(`(max-width:${C.BP.MOBILE}px)`);
const handleMqChange = event => {
  state.isMobile = event.matches;
  if (!state.isMobile) closeMenu();
};

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
  el.themeToggle.setAttribute('aria-pressed', saved === 'dark');

  el.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    el.themeToggle.setAttribute('aria-pressed', next === 'dark');
    localStorage.setItem(C.THEME_KEY, next);
  });
}

scheduleTask(() => {
  const copyYear = document.getElementById('copyright-year');
  if (copyYear) copyYear.textContent = new Date().getFullYear();

  document.querySelector('nav.main-nav')?.setAttribute('role', 'navigation');

  const path = location.pathname;

  document.querySelectorAll('.nav-list a, .footer-nav a').forEach(link => {
    try {
      if (new URL(link.href, location.origin).pathname === path) {
        link.setAttribute('aria-current', 'page');
      }
    } catch {}
  });

  document.querySelectorAll('a[href^="http"]').forEach(link => {
    try {
      if (
        new URL(link.href).hostname !== location.hostname &&
        !link.classList.contains('download-link')
      ) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {}
  });

  document.querySelectorAll('.lite-youtube').forEach(wrapper => {
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

        this.innerHTML = '';
        this.appendChild(iframe);
      },
      { once: true }
    );
  });
});

window.addEventListener('pageshow', event => {
  if (event.persisted) closeMenu();
});