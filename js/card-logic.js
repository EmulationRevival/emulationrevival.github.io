import { scheduleTask, createFocusTrap } from './ui-utils.js';
import { restoreHashTargetAfterRender } from './search-utils.js';

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
    ACTION_DROPDOWN: '.action-dropdown',
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
    SORT_FIELD: 'sortField',
    SORT_DIRECTION: 'sortDirection',
    COMPATIBILITY_FILTER: 'compatibilityFilter',
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
    RELEASE_STATE: 'data-release-state',
    DISABLED: 'aria-disabled',
  },

  DATASET: {
    MODAL_TRIGGER: 'modalTrigger',
    MODAL_ID: 'modalId',
    SORT_DIRECTION_LABEL: 'sortDirectionLabel',
  },

  CLASSES: {
    ACTIVE: 'active',
    MODAL_HEADER_THUMB: 'modal-header-thumb',
    EMPTY_MESSAGE: 'card-grid-empty-message',
    COMING_SOON_BADGE: 'coming-soon-badge',
    NEW_UPDATE_BADGE: 'new-update-badge',
    UPCOMING_ACTION: 'is-upcoming-action',
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

  SORT_FIELDS: {
    RELEASE_DATE: 'release-date',
    TITLE: 'title',
  },

  SORT_DIRECTIONS: {
    ASC: 'asc',
    DESC: 'desc',
  },

  FILTERS: {
    ALL: 'all',
    XBOX_ONE: 'xbox-one',
    XBOX_SERIES: 'xbox-series',
  },

  TXT: {
    UNKNOWN: 'Unknown',
    DL_PREFIX: 'Download',
    EMPTY: 'No cards available.',
    COMING_SOON: 'Coming Soon',
    NEW_UPDATE: 'New Update',
    UPCOMING_ALERT: 'This item is not available yet.',
    SORT_DIRECTION_ASC: 'Sort ascending',
    SORT_DIRECTION_DESC: 'Sort descending',
    SORT_DIRECTION_ASC_SHORT: 'Ascending',
    SORT_DIRECTION_DESC_SHORT: 'Descending',
  },

  ARIA: {
    EXPANDED: 'aria-expanded',
    TRUE: 'true',
    FALSE: 'false',
  },

  RELEASE_STATE: {
    LIVE: 'live',
    UPCOMING: 'upcoming',
    RECENT: 'recent',
  },

  FILE_EXT: /\.(zip|msixbundle|msix|appx|exe|apk|7z|rar|tar|gz|dmg|pdf|mp3|mp4|avi|mov|jpg|jpeg|png|gif|webp|svg|docx?|xlsx?|pptx?|iso|bin|img|msi|deb|rpm|sh|bat|ps1|ini|cfg|ctl|json|txt|xml|csv)$/i,
  THIRTY_DAYS_MS: 30 * 24 * 60 * 60 * 1000,
};

function normalizeText(str = '') {
  return str.toLowerCase().trim();
}

function sortNeedsHydratedDates(sortField) {
  return sortField === C.SORT_FIELDS.RELEASE_DATE;
}

function isValidSortField(value) {
  return value === C.SORT_FIELDS.RELEASE_DATE || value === C.SORT_FIELDS.TITLE;
}

function isValidSortDirection(value) {
  return value === C.SORT_DIRECTIONS.ASC || value === C.SORT_DIRECTIONS.DESC;
}

function isValidCompatibilityFilter(value) {
  return value === C.FILTERS.ALL || value === C.FILTERS.XBOX_ONE || value === C.FILTERS.XBOX_SERIES;
}

function mapLegacySortType(sortType) {
  if (sortType === C.SORT_TYPES.NEWEST) {
    return {
      sortField: C.SORT_FIELDS.RELEASE_DATE,
      sortDirection: C.SORT_DIRECTIONS.DESC,
      compatibilityFilter: C.FILTERS.ALL,
    };
  }

  if (sortType === C.SORT_TYPES.OLDEST) {
    return {
      sortField: C.SORT_FIELDS.RELEASE_DATE,
      sortDirection: C.SORT_DIRECTIONS.ASC,
      compatibilityFilter: C.FILTERS.ALL,
    };
  }

  if (sortType === C.SORT_TYPES.REVERSE_ALPHABETICAL) {
    return {
      sortField: C.SORT_FIELDS.TITLE,
      sortDirection: C.SORT_DIRECTIONS.DESC,
      compatibilityFilter: C.FILTERS.ALL,
    };
  }

  if (sortType === C.SORT_TYPES.XBOX_ONE) {
    return {
      sortField: C.SORT_FIELDS.TITLE,
      sortDirection: C.SORT_DIRECTIONS.ASC,
      compatibilityFilter: C.FILTERS.XBOX_ONE,
    };
  }

  if (sortType === C.SORT_TYPES.XBOX_SERIES) {
    return {
      sortField: C.SORT_FIELDS.TITLE,
      sortDirection: C.SORT_DIRECTIONS.ASC,
      compatibilityFilter: C.FILTERS.XBOX_SERIES,
    };
  }

  return {
    sortField: C.SORT_FIELDS.TITLE,
    sortDirection: C.SORT_DIRECTIONS.ASC,
    compatibilityFilter: C.FILTERS.ALL,
  };
}

const state = {
  dataPromise: null,
  lastOpenedCardTrigger: null,
  activePopover: null,
  parsedCardsData: [],
  sortField: C.SORT_FIELDS.RELEASE_DATE,
  sortDirection: C.SORT_DIRECTIONS.DESC,
  compatibilityFilter: C.FILTERS.ALL,
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

const dom = {
  cards: Array.from(document.querySelectorAll(C.SEL.CARD)),
  versions: Array.from(document.querySelectorAll(C.SEL.VERSION)),
  dates: Array.from(document.querySelectorAll(C.SEL.DATE)),
  buttons: Array.from(document.querySelectorAll(C.SEL.BTN)),

  cardGrid: document.querySelector(C.SEL.CARD_GRID),
  sortFieldSelect: document.getElementById(C.IDS.SORT_FIELD),
  sortDirectionButton: document.getElementById(C.IDS.SORT_DIRECTION),
  compatibilityFilterSelect: document.getElementById(C.IDS.COMPATIBILITY_FILTER),
  legacySortSelect: document.getElementById(C.IDS.SORT_BY),

  gameDetailModal: document.getElementById(C.IDS.GAME_DETAIL_MODAL),
  gameDetailModalOverlay: document.getElementById(C.IDS.GAME_DETAIL_MODAL_OVERLAY),
  gameDetailModalCloseBtn: document.getElementById(C.IDS.GAME_DETAIL_MODAL_CLOSE),
  gameDetailModalTitle: document.getElementById(C.IDS.GAME_DETAIL_MODAL_TITLE),
  gameDetailModalBody: document.getElementById(C.IDS.GAME_DETAIL_MODAL_BODY),

  mainHeader: document.querySelector(C.SEL.MAIN_HEADER),
  mainContent: document.querySelector(C.SEL.MAIN_CONTENT),
  mainFooter: document.querySelector(C.SEL.MAIN_FOOTER),

  emptyMessage: null,
};

dom.gameDetailModalHeader = dom.gameDetailModal?.querySelector(C.SEL.MODAL_HEADER);

const backgroundElementsToInert = [
  dom.mainHeader,
  dom.mainContent,
  dom.mainFooter,
].filter(Boolean);

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
      hasComingSoonBadge: false,
      titleText: normalizeText(titleEl?.textContent || ''),
      dateMs: 0,
      compatibilityText: normalizeText(infoList?.textContent || ''),
      releaseState: C.RELEASE_STATE.LIVE,
    });

    if (versionEl) {
      const appId = versionEl.getAttribute(C.ATTR.APP);
      if (appId) {
        cardMap.set(appId, card);
      }
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
      originalText: btn.textContent.trim(),
    });
  });
}

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

function setCardReleaseState(card, releaseState) {
  const cardMeta = domMeta.get(card);
  if (!cardMeta) return;

  cardMeta.releaseState = releaseState;
  card.setAttribute(C.ATTR.RELEASE_STATE, releaseState);
}

function ensureComingSoonBadge(cardMeta) {
  if (!cardMeta?.imgContainer || cardMeta.hasComingSoonBadge) return;

  const badge = document.createElement('div');
  badge.className = C.CLASSES.COMING_SOON_BADGE;
  badge.textContent = C.TXT.COMING_SOON;
  cardMeta.imgContainer.appendChild(badge);
  cardMeta.hasComingSoonBadge = true;
}

function removeComingSoonBadge(cardMeta) {
  if (!cardMeta?.imgContainer || !cardMeta.hasComingSoonBadge) return;

  const badge = cardMeta.imgContainer.querySelector(`.${C.CLASSES.COMING_SOON_BADGE}`);
  badge?.remove();
  cardMeta.hasComingSoonBadge = false;
}

function ensureNewUpdateBadge(cardMeta) {
  if (!cardMeta?.imgContainer || cardMeta.hasBadge) return;

  const badge = document.createElement('div');
  badge.className = C.CLASSES.NEW_UPDATE_BADGE;
  badge.textContent = C.TXT.NEW_UPDATE;
  cardMeta.imgContainer.appendChild(badge);
  cardMeta.hasBadge = true;
}

function removeNewUpdateBadge(cardMeta) {
  if (!cardMeta?.imgContainer || !cardMeta.hasBadge) return;

  const badge = cardMeta.imgContainer.querySelector(`.${C.CLASSES.NEW_UPDATE_BADGE}`);
  badge?.remove();
  cardMeta.hasBadge = false;
}

function setButtonUpcomingState(btn, isUpcoming) {
  const meta = domMeta.get(btn);
  if (!meta) return;

  if (!meta.originalText) {
    meta.originalText = btn.textContent.trim();
  }

  if (isUpcoming) {
    btn.classList.add(C.CLASSES.UPCOMING_ACTION);
    btn.setAttribute(C.ATTR.DISABLED, C.ARIA.TRUE);
    btn.setAttribute('tabindex', '-1');
    btn.textContent = C.TXT.COMING_SOON;
  } else {
    btn.classList.remove(C.CLASSES.UPCOMING_ACTION);
    btn.removeAttribute(C.ATTR.DISABLED);
    btn.removeAttribute('tabindex');
    btn.textContent = meta.originalText || btn.textContent;
  }
}

function setDropdownUpcomingState(dropdown, isUpcoming) {
  if (!dropdown) return;

  const summary = dropdown.querySelector('summary');
  const links = dropdown.querySelectorAll('.download-link');

  if (summary) {
    if (!summary.dataset.originalText) {
      summary.dataset.originalText = summary.textContent.trim();
    }

    if (isUpcoming) {
      summary.classList.add(C.CLASSES.UPCOMING_ACTION);
      summary.setAttribute(C.ATTR.DISABLED, C.ARIA.TRUE);
      summary.textContent = C.TXT.COMING_SOON;
    } else {
      summary.classList.remove(C.CLASSES.UPCOMING_ACTION);
      summary.removeAttribute(C.ATTR.DISABLED);
      summary.textContent = summary.dataset.originalText || summary.textContent;
    }
  }

  links.forEach(link => setButtonUpcomingState(link, isUpcoming));

  if (isUpcoming) {
    dropdown.removeAttribute('open');
  }
}

function syncCardActionState(card) {
  const cardMeta = domMeta.get(card);
  if (!cardMeta) return;

  const isUpcoming = cardMeta.releaseState === C.RELEASE_STATE.UPCOMING;
  const actionsRoot = card.querySelector(C.SEL.CARD_MODAL_CONTENT);

  if (!actionsRoot) return;

  const directButtons = actionsRoot.querySelectorAll(`${C.SEL.BTN}:not(${C.SEL.DROPDOWN} ${C.SEL.BTN})`);
  const dropdowns = actionsRoot.querySelectorAll(C.SEL.DROPDOWN);

  directButtons.forEach(btn => setButtonUpcomingState(btn, isUpcoming));
  dropdowns.forEach(dropdown => setDropdownUpcomingState(dropdown, isUpcoming));
}

function syncModalActionState() {
  if (!dom.gameDetailModalBody) return;

  const activeCard = state.lastOpenedCardTrigger?.closest(C.SEL.CARD);
  if (!activeCard) return;

  const cardMeta = domMeta.get(activeCard);
  const isUpcoming = cardMeta?.releaseState === C.RELEASE_STATE.UPCOMING;

  const directButtons = dom.gameDetailModalBody.querySelectorAll(`${C.SEL.BTN}:not(${C.SEL.DROPDOWN} ${C.SEL.BTN})`);
  const dropdowns = dom.gameDetailModalBody.querySelectorAll(C.SEL.DROPDOWN);

  directButtons.forEach(btn => {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent.trim();
    }

    if (isUpcoming) {
      btn.classList.add(C.CLASSES.UPCOMING_ACTION);
      btn.setAttribute(C.ATTR.DISABLED, C.ARIA.TRUE);
      btn.setAttribute('tabindex', '-1');
      btn.textContent = C.TXT.COMING_SOON;
    } else {
      btn.classList.remove(C.CLASSES.UPCOMING_ACTION);
      btn.removeAttribute(C.ATTR.DISABLED);
      btn.removeAttribute('tabindex');
      btn.textContent = btn.dataset.originalText || btn.textContent;
    }
  });

  dropdowns.forEach(dropdown => {
    const summary = dropdown.querySelector('summary');
    const links = dropdown.querySelectorAll('.download-link');

    if (summary) {
      if (!summary.dataset.originalText) {
        summary.dataset.originalText = summary.textContent.trim();
      }

      if (isUpcoming) {
        summary.classList.add(C.CLASSES.UPCOMING_ACTION);
        summary.setAttribute(C.ATTR.DISABLED, C.ARIA.TRUE);
        summary.textContent = C.TXT.COMING_SOON;
      } else {
        summary.classList.remove(C.CLASSES.UPCOMING_ACTION);
        summary.removeAttribute(C.ATTR.DISABLED);
        summary.textContent = summary.dataset.originalText || summary.textContent;
      }
    }

    links.forEach(link => {
      if (!link.dataset.originalText) {
        link.dataset.originalText = link.textContent.trim();
      }

      if (isUpcoming) {
        link.classList.add(C.CLASSES.UPCOMING_ACTION);
        link.setAttribute(C.ATTR.DISABLED, C.ARIA.TRUE);
        link.setAttribute('tabindex', '-1');
        link.textContent = C.TXT.COMING_SOON;
      } else {
        link.classList.remove(C.CLASSES.UPCOMING_ACTION);
        link.removeAttribute(C.ATTR.DISABLED);
        link.removeAttribute('tabindex');
        link.textContent = link.dataset.originalText || link.textContent;
      }
    });

    if (isUpcoming) {
      dropdown.removeAttribute('open');
    }
  });
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
      if (meta?.valEl) {
        meta.valEl.textContent = info.version;
      }
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

          const isUpcoming = ms > now;
          const timeDiff = now - ms;

          if (isUpcoming) {
            setCardReleaseState(card, C.RELEASE_STATE.UPCOMING);
            removeNewUpdateBadge(cardMeta);
            ensureComingSoonBadge(cardMeta);
          } else if (timeDiff >= 0 && timeDiff < C.THIRTY_DAYS_MS) {
            setCardReleaseState(card, C.RELEASE_STATE.RECENT);
            removeComingSoonBadge(cardMeta);
            ensureNewUpdateBadge(cardMeta);
          } else {
            setCardReleaseState(card, C.RELEASE_STATE.LIVE);
            removeComingSoonBadge(cardMeta);
            removeNewUpdateBadge(cardMeta);
          }

          syncCardActionState(card);
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

function rebuildParsedCardsData() {
  state.parsedCardsData = dom.cards.map(card => {
    const meta = domMeta.get(card);

    return {
      element: card,
      title: meta?.titleText || '',
      date: meta?.dateMs || 0,
      compatibility: meta?.compatibilityText || '',
      releaseState: meta?.releaseState || C.RELEASE_STATE.LIVE,
    };
  });
}

function cardMatchesFilter(cardData) {
  if (state.compatibilityFilter === C.FILTERS.XBOX_ONE) {
    return cardData.compatibility.includes('xbox one');
  }

  if (state.compatibilityFilter === C.FILTERS.XBOX_SERIES) {
    return cardData.compatibility.includes('series s|x');
  }

  return true;
}

function compareCardsByTitle(a, b) {
  return a.title.localeCompare(b.title);
}

function compareCardsByDate(a, b) {
  const dateDiff = a.date - b.date;
  if (dateDiff !== 0) return dateDiff;
  return compareCardsByTitle(a, b);
}

function compareCardData(a, b) {
  const baseResult = state.sortField === C.SORT_FIELDS.RELEASE_DATE
    ? compareCardsByDate(a, b)
    : compareCardsByTitle(a, b);

  return state.sortDirection === C.SORT_DIRECTIONS.DESC ? baseResult * -1 : baseResult;
}

function getEmptyMessage() {
  if (!dom.cardGrid) return null;

  if (dom.emptyMessage) {
    return dom.emptyMessage;
  }

  dom.emptyMessage = document.createElement('div');
  dom.emptyMessage.className = C.CLASSES.EMPTY_MESSAGE;
  dom.emptyMessage.textContent = C.TXT.EMPTY;
  dom.emptyMessage.hidden = true;

  return dom.emptyMessage;
}

function updateSortDirectionButton() {
  const button = dom.sortDirectionButton;
  if (!button) return;

  const isAscending = state.sortDirection === C.SORT_DIRECTIONS.ASC;
  const shortLabel = isAscending ? C.TXT.SORT_DIRECTION_ASC_SHORT : C.TXT.SORT_DIRECTION_DESC_SHORT;
  const fullLabel = isAscending ? C.TXT.SORT_DIRECTION_ASC : C.TXT.SORT_DIRECTION_DESC;

  button.setAttribute('aria-label', fullLabel);
  button.setAttribute('title', fullLabel);
  button.setAttribute('aria-pressed', String(isAscending));
  button.dataset.sortDirection = state.sortDirection;

  const labelTarget = button.querySelector('[data-sort-direction-label]');
  if (labelTarget) {
    labelTarget.textContent = shortLabel;
  }
}

function syncControlsFromState() {
  if (dom.sortFieldSelect) {
    dom.sortFieldSelect.value = state.sortField;
  }

  if (dom.compatibilityFilterSelect) {
    dom.compatibilityFilterSelect.value = state.compatibilityFilter;
  }

  updateSortDirectionButton();
}

function initializeControlState() {
  if (dom.sortFieldSelect || dom.sortDirectionButton || dom.compatibilityFilterSelect) {
    if (dom.sortFieldSelect && isValidSortField(dom.sortFieldSelect.value)) {
      state.sortField = dom.sortFieldSelect.value;
    }

    if (dom.compatibilityFilterSelect && isValidCompatibilityFilter(dom.compatibilityFilterSelect.value)) {
      state.compatibilityFilter = dom.compatibilityFilterSelect.value;
    }

    const initialDirection = dom.sortDirectionButton?.dataset.sortDirection;
    if (isValidSortDirection(initialDirection)) {
      state.sortDirection = initialDirection;
    }

    syncControlsFromState();
    return;
  }

  const legacySortType = dom.legacySortSelect?.value || C.SORT_TYPES.NEWEST;
  const mappedState = mapLegacySortType(legacySortType);

  state.sortField = mappedState.sortField;
  state.sortDirection = mappedState.sortDirection;
  state.compatibilityFilter = mappedState.compatibilityFilter;
}

function handleSortAndFilter() {
  if (!dom.cardGrid) return;

  const processedData = state.parsedCardsData
    .filter(cardMatchesFilter)
    .sort(compareCardData);

  const visibleItems = new Set(processedData);
  const fragment = document.createDocumentFragment();
  let visibleCount = 0;

  for (let i = 0; i < processedData.length; i += 1) {
    const item = processedData[i];

    item.element.hidden = false;
    item.element.setAttribute('aria-hidden', 'false');
    visibleCount += 1;
    fragment.appendChild(item.element);
  }

  for (let i = 0; i < state.parsedCardsData.length; i += 1) {
    const item = state.parsedCardsData[i];
    if (visibleItems.has(item)) continue;

    item.element.hidden = true;
    item.element.setAttribute('aria-hidden', 'true');
    fragment.appendChild(item.element);
  }

  const emptyMsg = getEmptyMessage();
  if (emptyMsg) {
    emptyMsg.hidden = visibleCount !== 0;
    fragment.appendChild(emptyMsg);
  }

  dom.cardGrid.replaceChildren(fragment);
}

function handleSortFieldChange(event) {
  const nextValue = event.target.value;
  if (!isValidSortField(nextValue)) return;

  state.sortField = nextValue;
  handleSortAndFilter();
}

function handleCompatibilityFilterChange(event) {
  const nextValue = event.target.value;
  if (!isValidCompatibilityFilter(nextValue)) return;

  state.compatibilityFilter = nextValue;
  handleSortAndFilter();
}

function handleSortDirectionToggle() {
  state.sortDirection = state.sortDirection === C.SORT_DIRECTIONS.DESC
    ? C.SORT_DIRECTIONS.ASC
    : C.SORT_DIRECTIONS.DESC;

  updateSortDirectionButton();
  handleSortAndFilter();
}

function handleLegacySortChange(event) {
  const mappedState = mapLegacySortType(event.target.value);

  state.sortField = mappedState.sortField;
  state.sortDirection = mappedState.sortDirection;
  state.compatibilityFilter = mappedState.compatibilityFilter;

  handleSortAndFilter();
}

function updateModalHeaderThumb(cardElement) {
  const existingThumb = dom.gameDetailModalHeader?.querySelector(`.${C.CLASSES.MODAL_HEADER_THUMB}`);
  if (existingThumb) {
    existingThumb.remove();
  }

  const meta = domMeta.get(cardElement);
  const title = meta?.titleEl?.textContent || '';
  const imageSource = meta?.imgEl;

  if (dom.gameDetailModalTitle) {
    dom.gameDetailModalTitle.textContent = title;
  }

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

  const cardMeta = domMeta.get(cardElement);
  dom.gameDetailModal.setAttribute(
    C.ATTR.RELEASE_STATE,
    cardMeta?.releaseState || C.RELEASE_STATE.LIVE
  );

  syncModalActionState();

  dom.gameDetailModalOverlay?.classList.add(C.CLASSES.ACTIVE);
  dom.gameDetailModal.classList.add(C.CLASSES.ACTIVE);

  modalTrap.activate(dom.gameDetailModal);
}

function closeGameDetailModal() {
  if (!dom.gameDetailModal) return;

  dom.gameDetailModalOverlay?.classList.remove(C.CLASSES.ACTIVE);
  dom.gameDetailModal.classList.remove(C.CLASSES.ACTIVE);
  dom.gameDetailModal.removeAttribute(C.ATTR.RELEASE_STATE);

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
      originalText: btn.textContent.trim(),
    });
  }

  const meta = domMeta.get(btn);
  if (meta.loading) return;

  const card = meta.card || btn.closest(C.SEL.CARD);
  const cardMeta = card ? domMeta.get(card) : null;

  if (cardMeta?.releaseState === C.RELEASE_STATE.UPCOMING) {
    alert(C.TXT.UPCOMING_ALERT);
    return;
  }

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

function handleDocumentClick(event) {
  const { target } = event;

  const dropdownSummary = target.closest('.action-dropdown summary');
  if (dropdownSummary && dropdownSummary.classList.contains(C.CLASSES.UPCOMING_ACTION)) {
    event.preventDefault();
    return;
  }

  const downloadBtn = target.closest(C.SEL.BTN);
  if (downloadBtn) {
    if (downloadBtn.classList.contains(C.CLASSES.UPCOMING_ACTION)) {
      event.preventDefault();
      return;
    }

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
    if (event.key === 'Escape') {
      closeGameDetailModal();
    }
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

function init() {
  if (!dom.cardGrid) return;

  bindStaticDom();
  initializeControlState();

  dom.gameDetailModal?.setAttribute('role', 'dialog');
  dom.gameDetailModal?.setAttribute('aria-modal', 'true');

  dom.sortFieldSelect?.addEventListener('change', handleSortFieldChange);
  dom.sortDirectionButton?.addEventListener('click', handleSortDirectionToggle);
  dom.compatibilityFilterSelect?.addEventListener('change', handleCompatibilityFilterChange);
  dom.legacySortSelect?.addEventListener('change', handleLegacySortChange);

  dom.gameDetailModalOverlay?.addEventListener('click', closeGameDetailModal);
  dom.gameDetailModalCloseBtn?.addEventListener('click', closeGameDetailModal);

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleDocumentKeydown);

  scheduleTask(initAriaLabels);

  rebuildParsedCardsData();

  if (sortNeedsHydratedDates(state.sortField)) {
    if (dom.cardGrid) {
      dom.cardGrid.style.visibility = 'hidden';
    }

    fetchAppData({ rerender: true }).finally(() => {
      if (dom.cardGrid) {
        dom.cardGrid.style.visibility = '';
      }

      if (!state.dataPromise) {
        rebuildParsedCardsData();
        handleSortAndFilter();
      }

      scheduleTask(() => {
        restoreHashTargetAfterRender({
          focusSelector: C.SEL.CARD_LINK,
        });
      });
    });
  } else {
    handleSortAndFilter();

    fetchAppData({ rerender: false }).finally(() => {
      scheduleTask(() => {
        restoreHashTargetAfterRender({
          focusSelector: C.SEL.CARD_LINK,
        });
      });
    });
  }
}

init();