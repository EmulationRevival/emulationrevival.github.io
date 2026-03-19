// --- CONSTANTS ---
const IDS = {
  SEARCH_INPUT_ID: 'pageSearchInput',
  RESULTS_CONTAINER_ID: 'pageAutocompleteResults',
  LIVE_REGION_ID: 'autocompleteLiveRegion',
  SORT_BY: 'sortBy',
};

const SELECTORS = {
  HIGHLIGHTED: '.highlighted-by-search',
  MAIN_HEADER: '.main-header',
  SEARCH_CONTAINER: '.page-search-container',
  CARD: '.card',
  CARD_LINK: '.card-link',
};

const CLASSES = {
  HIGHLIGHT: 'highlighted-by-search',
  SUGGESTION: 'autocomplete-suggestion',
  SUGGESTION_LOGO: 'suggestion-logo',
  SUGGESTION_NAME: 'suggestion-name',
  NO_RESULTS: 'autocomplete-no-results',
  ACTIVE: 'is-active',
};

const ATTRIBUTES = {
  ROLE: 'role',
  ARIA_AUTOCOMPLETE: 'aria-autocomplete',
  ARIA_HASPOPUP: 'aria-haspopup',
  ARIA_CONTROLS: 'aria-controls',
  ARIA_EXPANDED: 'aria-expanded',
  ARIA_LABEL: 'aria-label',
  ARIA_SELECTED: 'aria-selected',
  ARIA_ACTIVEDESCENDANT: 'aria-activedescendant',
  TABINDEX: 'tabindex',
};

const ROLES = {
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  STATUS: 'status',
};

const EVENTS = {
  INPUT: 'input',
  CLICK: 'click',
  KEYDOWN: 'keydown',
  FOCUS: 'focus',
  CHANGE: 'change',
};

const KEYS = {
  ENTER: 'Enter',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ESCAPE: 'Escape',
  TAB: 'Tab',
};

const CONFIG = {
  INDEX_PATH: '/json/search-index.json',
  SCROLL_BEHAVIOR: 'smooth',
  SCROLL_OFFSET_PX: 20,
  HIGHLIGHT_DURATION_MS: 2500,
  DEBOUNCE_MS: 150,
  MIN_QUERY_LENGTH: 1,
  MAX_SUGGESTIONS: 10,
  IMAGE_FALLBACK: '/images/fallback.png',
  HASH_SCROLL_DELAY_MS: 150,
};

const TEMPLATES = {
  SUGGESTION_ID_PREFIX: 'suggestion-',
  ARIA_LABEL_SUGGESTIONS: 'Suggested items',
  NO_RESULTS: input => (
    input ? `No results found for "${input}".` : 'No results found.'
  ),
};

// --- DOM ELEMENTS ---
const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);
const sortSelect = document.getElementById(IDS.SORT_BY);
const mainHeader = document.querySelector(SELECTORS.MAIN_HEADER);

// --- EARLY NULL CHECKS ---
if (!searchInput || !autocompleteResults) {
  // Module script; safe early exit if search UI is not present on page.
} else {
  // --- STATE ---
  let searchIndexCache = [];
  let searchIndexPromise = null;
  let currentSuggestions = [];
  let activeSuggestionIndex = -1;
  let highlightTimeoutId = null;

  // O(1) DOM lookup and cheap visibility cache
  const elementMap = new Map();     // id -> element
  const visibilityCache = new WeakMap(); // element -> visible boolean

  // --- LIVE REGION ---
  let liveRegion = document.getElementById(IDS.LIVE_REGION_ID);
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = IDS.LIVE_REGION_ID;
    liveRegion.setAttribute(ATTRIBUTES.ROLE, ROLES.STATUS);
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    autocompleteResults.parentNode?.appendChild(liveRegion);
  }

  // --- ARIA SETUP ---
  searchInput.setAttribute(ATTRIBUTES.ROLE, ROLES.COMBOBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_AUTOCOMPLETE, 'list');
  searchInput.setAttribute(ATTRIBUTES.ARIA_HASPOPUP, ROLES.LISTBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_CONTROLS, IDS.RESULTS_CONTAINER_ID);
  searchInput.setAttribute(ATTRIBUTES.ARIA_EXPANDED, 'false');

  autocompleteResults.setAttribute(ATTRIBUTES.ROLE, ROLES.LISTBOX);
  autocompleteResults.setAttribute(ATTRIBUTES.ARIA_LABEL, TEMPLATES.ARIA_LABEL_SUGGESTIONS);

  // --- UTILITIES ---
  function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function debounce(fn, wait) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function buildElementIndex() {
    elementMap.clear();
    document.querySelectorAll(SELECTORS.CARD).forEach(card => {
      if (card.id) {
        elementMap.set(card.id, card);
        visibilityCache.set(card, card.offsetParent !== null);
      }
    });
  }

  function syncVisibilityCache() {
    elementMap.forEach(el => {
      visibilityCache.set(el, el.offsetParent !== null);
    });
  }

  function setAutocompleteVisibility(visible) {
    autocompleteResults.style.display = visible ? 'block' : 'none';
    searchInput.setAttribute(ATTRIBUTES.ARIA_EXPANDED, visible ? 'true' : 'false');

    if (!visible) {
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
      activeSuggestionIndex = -1;
      currentSuggestions = [];
    }
  }

  function clearSuggestions() {
    autocompleteResults.replaceChildren();
    currentSuggestions = [];
    activeSuggestionIndex = -1;
    searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
  }

  function resetSearchUI() {
    searchInput.value = '';
    clearSuggestions();
    setAutocompleteVisibility(false);
    liveRegion.textContent = '';
  }

  function removeExistingHighlights() {
    document.querySelectorAll(SELECTORS.HIGHLIGHTED).forEach(el => {
      el.classList.remove(CLASSES.HIGHLIGHT);
    });
  }

  function getHeaderHeight() {
    return mainHeader ? mainHeader.offsetHeight : 0;
  }

  function scrollToElement(element, headerHeight) {
    const offsetPosition =
      element.offsetTop - headerHeight - CONFIG.SCROLL_OFFSET_PX;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: CONFIG.SCROLL_BEHAVIOR,
    });
  }

  function focusAndHighlightElement(element) {
    if (highlightTimeoutId) {
      clearTimeout(highlightTimeoutId);
      highlightTimeoutId = null;
    }

    element.classList.add(CLASSES.HIGHLIGHT);

    const targetToFocus = element.querySelector(SELECTORS.CARD_LINK) || element;

    if (targetToFocus === element) {
      element.setAttribute(ATTRIBUTES.TABINDEX, '-1');
    }

    targetToFocus.focus({ preventScroll: true });

    highlightTimeoutId = window.setTimeout(() => {
      element.classList.remove(CLASSES.HIGHLIGHT);

      if (targetToFocus === element) {
        targetToFocus.addEventListener('blur', () => {
          targetToFocus.removeAttribute(ATTRIBUTES.TABINDEX);
        }, { once: true });
      }

      highlightTimeoutId = null;
    }, CONFIG.HIGHLIGHT_DURATION_MS);
  }

  function applyHighlightAndScroll(elementId) {
    const targetElement = elementMap.get(elementId) || document.getElementById(elementId);
    if (!targetElement) return;

    removeExistingHighlights();
    const headerHeight = getHeaderHeight();
    scrollToElement(targetElement, headerHeight);
    focusAndHighlightElement(targetElement);
  }

  // --- SEARCH INDEX LOADING ---
  async function loadSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;

    searchIndexPromise = fetch(CONFIG.INDEX_PATH)
      .then(response => {
        if (!response.ok) throw new Error('Index fetch failed');
        return response.json();
      })
      .then(masterIndex => {
        const currentPageFile =
          window.location.pathname.split('/').pop() || 'index.html';

        const pageSpecificData = masterIndex.filter(item =>
          item.url.includes(currentPageFile)
        );

        searchIndexCache = pageSpecificData
          .map(item => {
            const elementId = item.url.split('#')[1];
            if (!elementId) return null;

            return {
              id: elementId,
              name: item.name || '',
              searchKey: stripAccents(`${item.name || ''} ${item.description || ''}`),
              icon: item.img || '',
            };
          })
          .filter(Boolean);

        return searchIndexCache;
      })
      .catch(err => {
        console.warn('Page Search: JSON index not found or failed to load.', err);
        searchIndexCache = [];
        return searchIndexCache;
      });

    return searchIndexPromise;
  }

  // --- SUGGESTION FILTERING ---
  function getFilteredSuggestions(query) {
    const normalizedQuery = stripAccents(query.trim());
    if (normalizedQuery.length < CONFIG.MIN_QUERY_LENGTH) return [];

    const results = [];

    for (let i = 0; i < searchIndexCache.length; i++) {
      const entry = searchIndexCache[i];

      if (!entry.searchKey.includes(normalizedQuery)) continue;

      const element = elementMap.get(entry.id);
      if (!element) continue;
      if (!visibilityCache.get(element)) continue;

      results.push(entry);
    }

    results.sort((a, b) => a.name.localeCompare(b.name));

    return results.slice(0, CONFIG.MAX_SUGGESTIONS);
  }

  function syncAriaState() {
    const nodes = autocompleteResults.children;
    if (!nodes.length) {
      activeSuggestionIndex = -1;
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
      return;
    }

    for (let i = 0; i < nodes.length; i++) {
      const isActive = i === 0;
      nodes[i].setAttribute(ATTRIBUTES.ARIA_SELECTED, isActive ? 'true' : 'false');
      nodes[i].classList.toggle(CLASSES.ACTIVE, isActive);

      if (isActive) {
        activeSuggestionIndex = 0;
        searchInput.setAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT, nodes[i].id);
      }
    }
  }

  function moveActiveSuggestion(direction) {
    const nodes = autocompleteResults.children;
    if (!nodes.length) return;

    if (activeSuggestionIndex < 0) activeSuggestionIndex = 0;

    nodes[activeSuggestionIndex].setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
    nodes[activeSuggestionIndex].classList.remove(CLASSES.ACTIVE);

    if (direction === 'down') {
      activeSuggestionIndex = (activeSuggestionIndex + 1) % nodes.length;
    } else {
      activeSuggestionIndex = (activeSuggestionIndex - 1 + nodes.length) % nodes.length;
    }

    const next = nodes[activeSuggestionIndex];
    next.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'true');
    next.classList.add(CLASSES.ACTIVE);
    searchInput.setAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT, next.id);
    next.scrollIntoView({ block: 'nearest' });
  }

  function renderSuggestions(filtered, query) {
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = CLASSES.NO_RESULTS;

      const message = TEMPLATES.NO_RESULTS(query);
      noResults.textContent = message;

      autocompleteResults.replaceChildren(noResults);
      setAutocompleteVisibility(true);
      liveRegion.textContent = message;
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
      activeSuggestionIndex = -1;
      currentSuggestions = [];
      return;
    }

    currentSuggestions = filtered;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];

      const item = document.createElement('div');
      item.className = CLASSES.SUGGESTION;
      item.setAttribute(ATTRIBUTES.ROLE, ROLES.OPTION);
      item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
      item.id = `${TEMPLATES.SUGGESTION_ID_PREFIX}${i}`;
      item.dataset.entryId = entry.id;

      const img = document.createElement('img');
      img.src = entry.icon || CONFIG.IMAGE_FALLBACK;
      img.alt = entry.name;
      img.className = CLASSES.SUGGESTION_LOGO;
      img.onerror = () => {
        img.onerror = null;
        img.src = CONFIG.IMAGE_FALLBACK;
      };

      const span = document.createElement('span');
      span.className = CLASSES.SUGGESTION_NAME;
      span.textContent = entry.name;

      item.append(img, span);
      fragment.appendChild(item);
    }

    autocompleteResults.replaceChildren(fragment);
    setAutocompleteVisibility(true);
    liveRegion.textContent =
      `${filtered.length} suggestion${filtered.length > 1 ? 's' : ''} for "${query}" available.`;
    syncAriaState();
  }

  function updateSuggestions(query) {
    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
  }

  function processInputValue(rawValue) {
    const query = rawValue.trim();

    if (query.length === 0) {
      clearSuggestions();
      setAutocompleteVisibility(false);
      liveRegion.textContent = '';
      return;
    }

    if (searchIndexCache.length === 0) return;

    updateSuggestions(query);
  }

  const handleInput = debounce(event => {
    processInputValue(event.target.value);
  }, CONFIG.DEBOUNCE_MS);

  // --- EVENTS ---
  searchInput.addEventListener(EVENTS.INPUT, handleInput);

  searchInput.addEventListener(EVENTS.KEYDOWN, event => {
    const hasSuggestions = autocompleteResults.children.length > 0 &&
      autocompleteResults.firstElementChild?.classList.contains(CLASSES.SUGGESTION);

    switch (event.key) {
      case KEYS.ENTER: {
        if (!hasSuggestions) return;

        event.preventDefault();
        event.stopPropagation();

        const activeSuggestion =
          activeSuggestionIndex >= 0 ? autocompleteResults.children[activeSuggestionIndex] : null;

        if (activeSuggestion?.dataset.entryId) {
          applyHighlightAndScroll(activeSuggestion.dataset.entryId);
          resetSearchUI();
        }
        break;
      }

      case KEYS.ARROW_DOWN: {
        if (!hasSuggestions) return;
        event.preventDefault();
        moveActiveSuggestion('down');
        break;
      }

      case KEYS.ARROW_UP: {
        if (!hasSuggestions) return;
        event.preventDefault();
        moveActiveSuggestion('up');
        break;
      }

      case KEYS.ESCAPE:
        resetSearchUI();
        break;

      case KEYS.TAB:
        break;
    }
  });

  autocompleteResults.addEventListener(EVENTS.CLICK, event => {
    const suggestion = event.target.closest(`.${CLASSES.SUGGESTION}`);
    if (!suggestion?.dataset.entryId) return;

    event.preventDefault();
    applyHighlightAndScroll(suggestion.dataset.entryId);
    resetSearchUI();
  });

  document.addEventListener(EVENTS.CLICK, event => {
    if (!event.target.closest(SELECTORS.SEARCH_CONTAINER)) {
      setAutocompleteVisibility(false);
    }
  });

  searchInput.addEventListener(EVENTS.FOCUS, () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
      processInputValue(query);
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener(EVENTS.CHANGE, () => {
      syncVisibilityCache();

      const query = searchInput.value.trim();
      if (query.length > 0) {
        processInputValue(query);
      }
    });
  }

  function handleHashNavigation() {
    if (!window.location.hash) return;

    const targetId = window.location.hash.substring(1);
    window.setTimeout(() => {
      applyHighlightAndScroll(targetId);
    }, CONFIG.HASH_SCROLL_DELAY_MS);
  }

  // --- INIT ---
  buildElementIndex();
  syncVisibilityCache();
  loadSearchIndex().then(() => {
    const query = searchInput.value.trim();
    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });

  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);
}