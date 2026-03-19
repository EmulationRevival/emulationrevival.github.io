import { scheduleTask, createFocusTrap } from './ui-utils.js';

// =========================
// CONFIG
// =========================
const C = {
  URL: {
    VERSION: '/json/version.json',
    APP_LINKS: '/json/app-links.json',
  },

  SEL: {
    CARD: '.card',
    CARD_GRID: '.card-grid',
    CARD_LINK: '.card-link',
    CARD_TITLE: '.card-title',
    CARD_IMAGE: '.card-image',
    CARD_MODAL_CONTENT: '.card-modal-content',
    INFO_LIST: '.info-list',
    RELEASE_DATE: '.release-date',

    VERSION: '.app-version',
    DATE: '.app-release-date',
    VAL: '.val',
    IMG_CONTAINER: '.card-image-container',

    BTN: '.download-link',
    DROPDOWN: '.action-dropdown',
    POPOVER_TRIGGER: '.popover-trigger',
    POPOVER_MENU: '.popover-menu',

    MODAL_HEADER: '.modal-header',
    MODAL_HEADER_THUMB: '.modal-header-thumb',
    MAIN_HEADER: '.main-header',
    MAIN_CONTENT: 'main',
    MAIN_FOOTER: '.main-footer',
  },

  IDS: {
    SORT_BY: 'sortBy',
    GAME_DETAIL_MODAL: 'gameDetailModal',
    GAME_DETAIL_MODAL_OVERLAY: 'gameDetailModalOverlay',
    GAME_DETAIL_MODAL_CLOSE: 'gameDetailModalClose',
    GAME_DETAIL_MODAL_TITLE: 'gameDetailModalTitle',
    GAME_DETAIL_MODAL_BODY: 'gameDetailModalBody',
  },

  ATTR: {
    APP: 'data-app-id',
    ASSET: 'data-asset-id',
    ARIA: 'aria-label',
  },

  DATASET: {
    MODAL_TRIGGER: 'modalTrigger',
    MODAL_ID: 'modalId',
  },

  CLASSES: {
    ACTIVE: 'active',
    MODAL_HEADER_THUMB: 'modal-header-thumb',
  },

  SORT_TYPES: {
    ALPHABETICAL: 'alphabetical',
    REVERSE_ALPHABETICAL: 'reverse-alphabetical',
    XBOX_ONE: 'xbox-one',
    XBOX_SERIES: 'xbox-series',
    NEWEST: 'newest',
    OLDEST: 'oldest',
    DEFAULT: 'default',
  },

  TXT: {
    UNKNOWN: 'Unknown',
    DL_PREFIX: 'Download',
  },

  ARIA: {
    EXPANDED: 'aria-expanded',
    TRUE: 'true',
    FALSE: 'false',
  },

  FILE_EXT: /\.(zip|msixbundle|msix|appx|exe|apk|7z|rar|tar|gz|dmg|pdf|mp3|mp4|avi|mov|jpg|jpeg|png|gif|webp|svg|docx?|xlsx?|pptx?|iso|bin|img|msi|deb|rpm|sh|bat|ps1|ini|cfg|ctl|json|txt|xml|csv)$/i,

  BADGE_SRC: '/images/new-update.svg',
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
};

function normalizeText(str = '') {
  return str.toLowerCase().trim();
}

function sortNeedsHydratedDates(sortType) {
  return sortType === C.SORT_TYPES.NEWEST || sortType === C.SORT_TYPES.OLDEST;
}

// =========================
// STATE
// =========================
const state = {
  dataPromise: null,
  lastOpenedCardTrigger: null,
  activePopover: null,
  parsedCardsData: [],
};

const domMeta = new WeakMap();
const modalContentMap = new Map();
const cardMap = new Map();
const modalTrap = createFocusTrap();

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// =========================
// DOM CACHE
// =========================
const dom = {
  cards: Array.from(document.querySelectorAll(C.SEL.CARD)),
  versions: Array.from(document.querySelectorAll(C.SEL.VERSION)),
  dates: Array.from(document.querySelectorAll(C.SEL.DATE)),
  buttons: Array.from(document.querySelectorAll(C.SEL.BTN)),

  cardGrid: document.querySelector(C.SEL.CARD_GRID),
  sortSelect: document.getElementById(C.IDS.SORT_BY),

  gameDetailModal: document.getElementById(C.IDS.GAME_DETAIL_MODAL),
  gameDetailModalOverlay: document.getElementById(C.IDS.GAME_DETAIL_MODAL_OVERLAY),
  gameDetailModalCloseBtn: document.getElementById(C.IDS.GAME_DETAIL_MODAL_CLOSE),
  gameDetailModalTitle: document.getElementById(C.IDS.GAME_DETAIL_MODAL_TITLE),
  gameDetailModalBody: document.getElementById(C.IDS.GAME_DETAIL_MODAL_BODY),

  mainHeader: document.querySelector(C.SEL.MAIN_HEADER),
  mainContent: document.querySelector(C.SEL.MAIN_CONTENT),
  mainFooter: document.querySelector(C.SEL.MAIN_FOOTER),
};

dom.gameDetailModalHeader = dom.gameDetailModal?.querySelector(C.SEL.MODAL_HEADER);

const backgroundElementsToInert = [
  dom.mainHeader,
  dom.mainContent,
  dom.mainFooter,
].filter(Boolean);

// =========================
// PREBIND STATIC RELATIONSHIPS
// =========================
function bindStaticDom() {
  dom.cards.forEach(card => {
    const titleEl = card.querySelector(C.SEL.CARD_TITLE);
    const imgEl = card.querySelector(C.SEL.CARD_IMAGE);
    const imgContainer = card.querySelector(C.SEL.IMG_CONTAINER);
    const modalContent = card.querySelector(C.SEL.CARD_MODAL_CONTENT);
    const infoList = modalContent?.querySelector(C.SEL.INFO_LIST);
    const versionEl = card.querySelector(C.SEL.VERSION);

    domMeta.set(card, {
      titleEl,
      imgEl,
      imgContainer,
      infoListText: infoList?.textContent || '',
      hasBadge: false,
      titleText: normalizeText(titleEl?.textContent || ''),
      dateMs: 0,
    });

    if (versionEl) {
      const appId = versionEl.getAttribute(C.ATTR.APP);
      if (appId) cardMap.set(appId, card);
    }

    if (modalContent) {
      const modalId = modalContent.dataset[C.DATASET.MODAL_ID];
      if (modalId) {
        modalContentMap.set(modalId, modalContent);
      }
    }
  });

  dom.versions.forEach(el => {
    domMeta.set(el, { valEl: el.querySelector(C.SEL.VAL) });
  });

  dom.dates.forEach(el => {
    domMeta.set(el, { valEl: el.querySelector(C.SEL.VAL) });
  });

  dom.buttons.forEach(btn => {
    domMeta.set(btn, {
      card: btn.closest(C.SEL.CARD),
      isDropdown: !!btn.closest(C.SEL.DROPDOWN),
      loading: false,
    });
  });
}

// =========================
// DATA FETCH / HYDRATE
// =========================
function preprocessAppData(data) {
  for (const app of Object.values(data)) {
    if (app.assets) {
      const assetMap = {};
      for (const asset of app.assets) {
        assetMap[asset.id] = asset;
      }
      app._assetMap = assetMap;
    }

    if (app.releaseDate && app.releaseDate !== C.TXT.UNKNOWN) {
      const parsedMs = Date.parse(app.releaseDate);
      if (Number.isFinite(parsedMs)) {
        app._releaseMs = parsedMs;
      }
    }
  }
}

function hydrateCards(data) {
  if (!data) return;

  const now = Date.now();

  dom.versions.forEach(el => {
    const appId = el.getAttribute(C.ATTR.APP);
    const info = data[appId];
    if (!info) return;

    const meta = domMeta.get(el);
    if (info.version && info.version !== C.TXT.UNKNOWN) {
      if (meta?.valEl) meta.valEl.textContent = info.version;
    } else {
      el.style.display = 'none';
    }
  });

  dom.dates.forEach(el => {
    const appId = el.getAttribute(C.ATTR.APP);
    const info = data[appId];
    if (!info) return;

    const ms = info._releaseMs;
    const meta = domMeta.get(el);

    if (Number.isFinite(ms)) {
      if (meta?.valEl) {
        const time = document.createElement('time');
        time.className = 'release-date';
        time.dateTime = info.releaseDate;
        time.textContent = dateFormatter.format(ms);
        meta.valEl.replaceChildren(time);
      }

      const card = cardMap.get(appId);
      if (card) {
        const cardMeta = domMeta.get(card);
        if (cardMeta) {
          cardMeta.dateMs = ms;

          const timeDiff = now - ms;
          if (
            timeDiff >= 0 &&
            timeDiff < C.THIRTY_DAYS_MS &&
            cardMeta.imgContainer &&
            !cardMeta.hasBadge
          ) {
            cardMeta.hasBadge = true;

            const badge = document.createElement('img');
            badge.src = C.BADGE_SRC;
            badge.alt = 'New Update';
            badge.className = 'new-update-badge';

            cardMeta.imgContainer.appendChild(badge);
          }
        }
      }
    } else {
      el.style.display = 'none';
    }
  });
}

async function fetchAppData({ rerender = true } = {}) {
  if (state.dataPromise) return state.dataPromise;

  state.dataPromise = fetch(`${C.URL.VERSION}?cb=${Date.now()}`)
    .then(r => {
      if (!r.ok) throw new Error('Version fetch failed');
      return r.json();
    })
    .then(v => fetch(`${C.URL.APP_LINKS}?v=${v.version}`))
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      preprocessAppData(data);
      hydrateCards(data);
      rebuildParsedCardsData();

      if (rerender) {
        handleSortAndFilter();
      }

      return data;
    })
    .catch(err => {
      console.error('FATAL AppData:', err);
      state.dataPromise = null;
      return null;
    });

  return state.dataPromise;
}

// =========================
// SORT / FILTER
// =========================
function rebuildParsedCardsData() {
  state.parsedCardsData = dom.cards.map(card => {
    const meta = domMeta.get(card);

    return {
      element: card,
      title: meta?.titleText || '',
      date: meta?.dateMs || 0,
      compatibility: meta?.infoListText || '',
    };
  });
}

function handleSortAndFilter() {
  if (!dom.cardGrid) return;

  const sortType = dom.sortSelect?.value || C.SORT_TYPES.DEFAULT;

  const processedData = state.parsedCardsData
    .filter(data => {
      if (sortType === C.SORT_TYPES.XBOX_ONE) return data.compatibility.includes('Xbox One');
      if (sortType === C.SORT_TYPES.XBOX_SERIES) return data.compatibility.includes('Series S|X');
      return true;
    })
    .sort((a, b) => {
      if (sortType === C.SORT_TYPES.NEWEST) return b.date - a.date;
      if (sortType === C.SORT_TYPES.OLDEST) return a.date - b.date;
      if (sortType === C.SORT_TYPES.REVERSE_ALPHABETICAL) return b.title.localeCompare(a.title);
      return a.title.localeCompare(b.title);
    });

  const fragment = document.createDocumentFragment();
  processedData.forEach(item => fragment.appendChild(item.element));

  dom.cardGrid.replaceChildren(fragment);

  if (processedData.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'card-grid-empty-message';
    emptyMsg.textContent = 'No cards available.';
    dom.cardGrid.appendChild(emptyMsg);
  }
}

// =========================
// MODAL
// =========================
function updateModalHeaderThumb(cardElement) {
  const existingThumb = dom.gameDetailModalHeader?.querySelector(`.${C.CLASSES.MODAL_HEADER_THUMB}`);
  if (existingThumb) existingThumb.remove();

  const meta = domMeta.get(cardElement);
  const title = meta?.titleEl?.textContent || '';
  const imageSource = meta?.imgEl;

  if (dom.gameDetailModalTitle) dom.gameDetailModalTitle.textContent = title;

  if (imageSource && dom.gameDetailModalHeader) {
    const thumb = document.createElement('img');
    thumb.src = imageSource.src;
    thumb.alt = imageSource.alt || (title ? `${title} Thumbnail` : '');
    thumb.className = C.CLASSES.MODAL_HEADER_THUMB;
    dom.gameDetailModalHeader.insertBefore(thumb, dom.gameDetailModalTitle);
  }
}

function openGameDetailModal(cardLink) {
  if (!dom.gameDetailModal || !cardLink) return;

  const cardElement = cardLink.closest(C.SEL.CARD);
  const modalTriggerId = cardLink.dataset[C.DATASET.MODAL_TRIGGER];
  if (!cardElement || !modalTriggerId) return;

  const contentSource = modalContentMap.get(modalTriggerId);

  if (!contentSource) {
    dom.gameDetailModalBody.textContent = 'Details not available for this card.';
  } else {
    const contentClone = contentSource.cloneNode(true);
    contentClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    dom.gameDetailModalBody.replaceChildren(...contentClone.childNodes);
  }

  state.lastOpenedCardTrigger = cardLink;
  cardLink.setAttribute(C.ARIA.EXPANDED, C.ARIA.TRUE);

  window.dispatchEvent(new CustomEvent('requestScrollLock', { detail: { lock: true } }));

  backgroundElementsToInert.forEach(el => {
    el.inert = true;
    el.setAttribute('aria-hidden', 'true');
  });

  updateModalHeaderThumb(cardElement);

  dom.gameDetailModalOverlay?.classList.add(C.CLASSES.ACTIVE);
  dom.gameDetailModal.classList.add(C.CLASSES.ACTIVE);

  modalTrap.activate(dom.gameDetailModal);
}

function closeGameDetailModal() {
  if (!dom.gameDetailModal) return;

  dom.gameDetailModalOverlay?.classList.remove(C.CLASSES.ACTIVE);
  dom.gameDetailModal.classList.remove(C.CLASSES.ACTIVE);

  window.dispatchEvent(new CustomEvent('requestScrollLock', { detail: { lock: false } }));

  backgroundElementsToInert.forEach(el => {
    el.inert = false;
    el.removeAttribute('aria-hidden');
  });

  modalTrap.deactivate();

  if (state.lastOpenedCardTrigger) {
    state.lastOpenedCardTrigger.setAttribute(C.ARIA.EXPANDED, C.ARIA.FALSE);
    state.lastOpenedCardTrigger.focus({ preventScroll: true });
    state.lastOpenedCardTrigger = null;
  }
}

// =========================
// DOWNLOADS
// =========================
function initAriaLabels() {
  dom.buttons.forEach(btn => {
    if (btn.hasAttribute(C.ATTR.ARIA)) return;

    const meta = domMeta.get(btn);
    if (!meta?.card) return;

    const text = meta.isDropdown
      ? btn.textContent
      : domMeta.get(meta.card)?.titleEl?.textContent;

    if (text) {
      btn.setAttribute(C.ATTR.ARIA, `${C.TXT.DL_PREFIX} ${text.trim()}`);
    }
  });
}

async function handleDownloadClick(btn) {
  if (!domMeta.has(btn)) {
    domMeta.set(btn, {
      card: btn.closest(C.SEL.CARD),
      isDropdown: !!btn.closest(C.SEL.DROPDOWN),
      loading: false,
    });
  }

  const meta = domMeta.get(btn);
  if (meta.loading) return;

  const appId = btn.getAttribute(C.ATTR.APP);
  const assetId = btn.getAttribute(C.ATTR.ASSET);
  if (!appId || !assetId) {
    console.error('Missing attributes', btn);
    return;
  }

  meta.loading = true;
  btn.dataset.loading = '1';

  const data = await fetchAppData({ rerender: false });

  meta.loading = false;
  btn.removeAttribute('data-loading');

  if (!data) {
    alert('Load failed.');
    return;
  }

  const url = data[appId]?._assetMap?.[assetId]?.url;
  if (!url) {
    alert('Link not found.');
    return;
  }

  if (C.FILE_EXT.test(url)) {
    window.location.assign(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// =========================
// EVENTS
// =========================
function handleDocumentClick(event) {
  const { target } = event;

  const downloadBtn = target.closest(C.SEL.BTN);
  if (downloadBtn) {
    event.preventDefault();
    handleDownloadClick(downloadBtn);
    return;
  }

  const cardLink = target.closest(C.SEL.CARD_LINK);
  if (cardLink && cardLink.dataset[C.DATASET.MODAL_TRIGGER]) {
    event.preventDefault();
    openGameDetailModal(cardLink);
    return;
  }

  const popoverTrigger = target.closest(C.SEL.POPOVER_TRIGGER);
  if (popoverTrigger) {
    event.preventDefault();
    const menu = popoverTrigger.nextElementSibling;

    if (menu === state.activePopover) {
      menu.classList.remove(C.CLASSES.ACTIVE);
      state.activePopover = null;
      popoverTrigger.focus({ preventScroll: true });
      return;
    }

    if (state.activePopover) {
      state.activePopover.classList.remove(C.CLASSES.ACTIVE);
    }

    if (menu) {
      menu.classList.add(C.CLASSES.ACTIVE);
      state.activePopover = menu;
      menu.querySelector('a, button')?.focus({ preventScroll: true });
    }
    return;
  }

  if (state.activePopover && !target.closest(C.SEL.POPOVER_MENU)) {
    const trigger = state.activePopover.previousElementSibling;
    state.activePopover.classList.remove(C.CLASSES.ACTIVE);
    state.activePopover = null;
    trigger?.focus({ preventScroll: true });
  }

  const openDetailsDropdown = document.querySelector(`${C.SEL.ACTION_DROPDOWN}[open]`);
  if (openDetailsDropdown && !openDetailsDropdown.contains(target)) {
    openDetailsDropdown.removeAttribute('open');
  }
}

function handleDocumentKeydown(event) {
  if (dom.gameDetailModal?.classList.contains(C.CLASSES.ACTIVE)) {
    if (event.key === 'Escape') closeGameDetailModal();
    return;
  }

  if (
    document.activeElement &&
    document.activeElement.matches(C.SEL.CARD_LINK) &&
    (event.key === 'Enter' || event.key === ' ')
  ) {
    event.preventDefault();
    openGameDetailModal(document.activeElement);
  }
}

// =========================
// INIT
// =========================
function init() {
  if (!dom.cardGrid) return;

  bindStaticDom();

  dom.gameDetailModal?.setAttribute('role', 'dialog');
  dom.gameDetailModal?.setAttribute('aria-modal', 'true');

  dom.sortSelect?.addEventListener('change', handleSortAndFilter);
  dom.gameDetailModalOverlay?.addEventListener('click', closeGameDetailModal);
  dom.gameDetailModalCloseBtn?.addEventListener('click', closeGameDetailModal);

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);

  scheduleTask(initAriaLabels);

  rebuildParsedCardsData();

  const initialSortType = dom.sortSelect?.value || C.SORT_TYPES.DEFAULT;

  if (sortNeedsHydratedDates(initialSortType)) {
    if (dom.cardGrid) dom.cardGrid.style.visibility = 'hidden';

    fetchAppData({ rerender: true }).finally(() => {
      if (dom.cardGrid) dom.cardGrid.style.visibility = '';
      if (!state.dataPromise) {
        rebuildParsedCardsData();
        handleSortAndFilter();
      }
    });
  } else {
    handleSortAndFilter();
    fetchAppData({ rerender: false });
  }
}

init();