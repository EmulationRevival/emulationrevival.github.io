import {
  loadSearchIndex,
  debounce,
  stripAccents,
  getOrCreateLiveRegion,
  setupComboboxAria,
  setAutocompleteVisibility,
  clearSuggestions,
  resetSearchState,
  syncAriaState,
  moveActiveSuggestion,
  setupClearableSearchInput,
} from './search-utils.js';

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

const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);
const sortSelect = document.getElementById(IDS.SORT_BY);
const mainHeader = document.querySelector(SELECTORS.MAIN_HEADER);

if (!searchInput || !autocompleteResults) {
} else {
  const activeSuggestionIndexRef = { value: -1 };
  const currentSuggestionsRef = { value: [] };

  let searchIndexCache = [];
  let highlightTimeoutId = null;

  const elementMap = new Map();
  const visibilityCache = new WeakMap();

  const liveRegion = getOrCreateLiveRegion({
    id: IDS.LIVE_REGION_ID,
    parent: autocompleteResults.parentNode,
  });

  setupComboboxAria({
    input: searchInput,
    resultsContainer: autocompleteResults,
    resultsId: IDS.RESULTS_CONTAINER_ID,
    ariaLabel: TEMPLATES.ARIA_LABEL_SUGGESTIONS,
  });

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

  function resetSearchUI({ blur = false } = {}) {
    resetSearchState({
      input: searchInput,
      resultsContainer: autocompleteResults,
      activeSuggestionIndexRef,
      currentSuggestionsRef,
      liveRegion,
      clearControl,
      blur,
    });
  }

  const clearControl = setupClearableSearchInput({
    input: searchInput,
    onClear: () => {
      clearSuggestions({
        input: searchInput,
        resultsContainer: autocompleteResults,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      setAutocompleteVisibility({
        input: searchInput,
        resultsContainer: autocompleteResults,
        visible: false,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      liveRegion.textContent = '';
    },
  });

  function removeExistingHighlights() {
    document.querySelectorAll(SELECTORS.HIGHLIGHTED).forEach(el => {
      el.classList.remove(CLASSES.HIGHLIGHT);
    });
  }

  function getHeaderHeight() {
    return mainHeader ? mainHeader.offsetHeight : 0;
  }

  function scrollToElement(element, headerHeight) {
    const offsetPosition = element.offsetTop - headerHeight - CONFIG.SCROLL_OFFSET_PX;

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
      element.setAttribute('tabindex', '-1');
    }

    targetToFocus.focus({ preventScroll: true });

    highlightTimeoutId = window.setTimeout(() => {
      element.classList.remove(CLASSES.HIGHLIGHT);

      if (targetToFocus === element) {
        targetToFocus.addEventListener('blur', () => {
          targetToFocus.removeAttribute('tabindex');
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

  async function hydrateSearchIndex() {
    try {
      const masterIndex = await loadSearchIndex(CONFIG.INDEX_PATH);
      const currentPageFile = window.location.pathname.split('/').pop() || 'index.html';

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
    } catch (err) {
      console.warn('Page Search: JSON index not found or failed to load.', err);
      searchIndexCache = [];
      return searchIndexCache;
    }
  }

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

  function renderSuggestions(filtered, query) {
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = CLASSES.NO_RESULTS;

      const message = TEMPLATES.NO_RESULTS(query);
      noResults.textContent = message;

      autocompleteResults.replaceChildren(noResults);

      setAutocompleteVisibility({
        input: searchInput,
        resultsContainer: autocompleteResults,
        visible: true,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      liveRegion.textContent = message;
      searchInput.removeAttribute('aria-activedescendant');
      activeSuggestionIndexRef.value = -1;
      currentSuggestionsRef.value = [];
      clearControl.sync();
      return;
    }

    currentSuggestionsRef.value = filtered;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];

      const item = document.createElement('div');
      item.className = CLASSES.SUGGESTION;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
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

    setAutocompleteVisibility({
      input: searchInput,
      resultsContainer: autocompleteResults,
      visible: true,
      activeSuggestionIndexRef,
      currentSuggestionsRef,
    });

    liveRegion.textContent =
      `${filtered.length} suggestion${filtered.length > 1 ? 's' : ''} for "${query}" available.`;

    syncAriaState({
      input: searchInput,
      resultsContainer: autocompleteResults,
      activeSuggestionIndexRef,
      activeClass: CLASSES.ACTIVE,
    });

    clearControl.sync();
  }

  function updateSuggestions(query) {
    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
  }

  function processInputValue(rawValue) {
    const query = rawValue.trim();

    if (query.length === 0) {
      clearSuggestions({
        input: searchInput,
        resultsContainer: autocompleteResults,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      setAutocompleteVisibility({
        input: searchInput,
        resultsContainer: autocompleteResults,
        visible: false,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      liveRegion.textContent = '';
      clearControl.sync();
      return;
    }

    if (searchIndexCache.length === 0) return;

    updateSuggestions(query);
  }

  const handleInput = debounce(event => {
    processInputValue(event.target.value);
  }, CONFIG.DEBOUNCE_MS);

  searchInput.addEventListener(EVENTS.INPUT, handleInput);

  searchInput.addEventListener(EVENTS.KEYDOWN, event => {
    const hasSuggestions =
      autocompleteResults.children.length > 0 &&
      autocompleteResults.firstElementChild?.classList.contains(CLASSES.SUGGESTION);

    switch (event.key) {
      case KEYS.ENTER: {
        if (!hasSuggestions) return;

        event.preventDefault();
        event.stopPropagation();

        const activeSuggestion =
          activeSuggestionIndexRef.value >= 0 ? autocompleteResults.children[activeSuggestionIndexRef.value] : null;

        if (activeSuggestion?.dataset.entryId) {
          applyHighlightAndScroll(activeSuggestion.dataset.entryId);
          resetSearchUI();
        }
        break;
      }

      case KEYS.ARROW_DOWN: {
        if (!hasSuggestions) return;
        event.preventDefault();

        moveActiveSuggestion({
          input: searchInput,
          resultsContainer: autocompleteResults,
          activeSuggestionIndexRef,
          direction: 'down',
          activeClass: CLASSES.ACTIVE,
        });
        break;
      }

      case KEYS.ARROW_UP: {
        if (!hasSuggestions) return;
        event.preventDefault();

        moveActiveSuggestion({
          input: searchInput,
          resultsContainer: autocompleteResults,
          activeSuggestionIndexRef,
          direction: 'up',
          activeClass: CLASSES.ACTIVE,
        });
        break;
      }

      case KEYS.ESCAPE:
        resetSearchUI({ blur: true });
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
    const { target } = event;
    if (!target || target.nodeType !== 1) return;

    if (!target.closest(SELECTORS.SEARCH_CONTAINER)) {
      setAutocompleteVisibility({
        input: searchInput,
        resultsContainer: autocompleteResults,
        visible: false,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });
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

  buildElementIndex();
  syncVisibilityCache();

  hydrateSearchIndex().then(() => {
    const query = searchInput.value.trim();
    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });

  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);
}