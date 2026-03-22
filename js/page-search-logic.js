import {
  loadSearchIndex,
  debounce,
  stripAccents,
  getOrCreateLiveRegion,
  setupComboboxAria,
  setAutocompleteVisibility,
  clearSearchUiState,
  resetSearchState,
  moveActiveSuggestion,
  setupClearableSearchInput,
  createSearchTargetHighlighter,
  renderNoSearchResults,
  renderSearchSuggestionsList,
  scrollToSearchTarget,
} from './search-utils.js';

const IDS = {
  SEARCH_INPUT_ID: 'pageSearchInput',
  RESULTS_CONTAINER_ID: 'pageAutocompleteResults',
  LIVE_REGION_ID: 'autocompleteLiveRegion',
  SORT_BY: 'sortBy',
};

const SELECTORS = {
  MAIN_HEADER: '.main-header',
  SEARCH_CONTAINER: '.page-search-container',
  CARD: '.card',
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

if (!searchInput || !autocompleteResults) {
} else {
  const activeSuggestionIndexRef = { value: -1 };
  const currentSuggestionsRef = { value: [] };

  let searchIndexCache = [];

  const elementMap = new Map();
  const visibilityCache = new WeakMap();

  const liveRegion = getOrCreateLiveRegion({
    id: IDS.LIVE_REGION_ID,
    parent: autocompleteResults.parentNode,
  });

  const targetHighlighter = createSearchTargetHighlighter({
    highlightClass: CLASSES.HIGHLIGHT,
    durationMs: CONFIG.HIGHLIGHT_DURATION_MS,
    focusSelector: '.card-link',
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

  const clearControl = setupClearableSearchInput({
    input: searchInput,
    onClear: () => {
      clearSearchUiState({
        input: searchInput,
        resultsContainer: autocompleteResults,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
        liveRegion,
        clearControl,
      });
    },
  });

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

  function applyHighlightAndScroll(elementId) {
    const targetElement = elementMap.get(elementId) || document.getElementById(elementId);
    if (!targetElement) return;

    scrollToSearchTarget({
      element: targetElement,
      mainHeaderSelector: SELECTORS.MAIN_HEADER,
      extraOffset: CONFIG.SCROLL_OFFSET_PX,
      behavior: CONFIG.SCROLL_BEHAVIOR,
    });

    targetHighlighter.highlight(targetElement);
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
      renderNoSearchResults({
        input: searchInput,
        resultsContainer: autocompleteResults,
        message: TEMPLATES.NO_RESULTS(query),
        activeSuggestionIndexRef,
        currentSuggestionsRef,
        liveRegion,
        clearControl,
        noResultsClass: CLASSES.NO_RESULTS,
      });
      return;
    }

    renderSearchSuggestionsList({
      input: searchInput,
      resultsContainer: autocompleteResults,
      suggestions: filtered,
      activeSuggestionIndexRef,
      currentSuggestionsRef,
      liveRegion,
      clearControl,
      suggestionIdPrefix: TEMPLATES.SUGGESTION_ID_PREFIX,
      imageFallback: CONFIG.IMAGE_FALLBACK,
      activeClass: CLASSES.ACTIVE,
      classNames: {
        suggestion: CLASSES.SUGGESTION,
        suggestionLogo: CLASSES.SUGGESTION_LOGO,
        suggestionName: CLASSES.SUGGESTION_NAME,
      },
      liveRegionMessage: `${filtered.length} suggestion${filtered.length > 1 ? 's' : ''} for "${query}" available.`,
      getDataset: suggestion => ({
        entryId: suggestion.id,
      }),
    });
  }

  function updateSuggestions(query) {
    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
  }

  function processInputValue(rawValue) {
    const query = rawValue.trim();

    if (query.length === 0) {
      clearSearchUiState({
        input: searchInput,
        resultsContainer: autocompleteResults,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
        liveRegion,
        clearControl,
      });
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