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
  SEARCH_INPUT_ID: 'sitewideSearch',
  RESULTS_CONTAINER_ID: 'sitewideAutocomplete',
  LIVE_REGION_ID: 'sitewideLiveRegion',
  SEARCH_TOGGLE_ID: 'sitewideSearchToggle',
  SEARCH_PANEL_ID: 'sitewideSearchPanel',
  MAIN_NAVIGATION_ID: 'main-navigation',
};

const SELECTORS = {
  SEARCH_CONTAINER: '.page-search-container',
};

const CLASSES = {
  SUGGESTION: 'autocomplete-suggestion',
  SUGGESTION_LOGO: 'suggestion-logo',
  SUGGESTION_NAME: 'suggestion-name',
  NO_RESULTS: 'autocomplete-no-results',
  ACTIVE: 'is-active',
  SEARCH_PANEL_ACTIVE: 'active',
  NAV_ACTIVE: 'active',
};

const KEYS = {
  ENTER: 'Enter',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ESCAPE: 'Escape',
};

const CONFIG = {
  DEBOUNCE_MS: 150,
  MIN_QUERY_LENGTH: 1,
  MAX_SUGGESTIONS: 10,
  INDEX_PATH: '/json/search-index.json',
  IMAGE_FALLBACK: '/images/fallback.png',
  MOBILE_BREAKPOINT: 991,
};

const EVENTS = {
  INPUT: 'input',
  CLICK: 'click',
  KEYDOWN: 'keydown',
  FOCUS: 'focus',
  REQUEST_MOBILE_SEARCH_PANEL: 'requestMobileSearchPanel',
  NAV_MENU_STATE_CHANGE: 'navMenuStateChange',
  REQUEST_CLOSE_MOBILE_MENU: 'requestCloseMobileMenu',
};

const TEMPLATES = {
  SUGGESTION_ID_PREFIX: 'site-suggest-',
  NO_RESULTS: input => `No results found for "${input}".`,
};

const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);
const searchToggle = document.getElementById(IDS.SEARCH_TOGGLE_ID);
const searchPanel = document.getElementById(IDS.SEARCH_PANEL_ID);
const mainNavigation = document.getElementById(IDS.MAIN_NAVIGATION_ID);

if (!searchInput || !autocompleteResults) {
} else {
  const mobileQuery = window.matchMedia(`(max-width: ${CONFIG.MOBILE_BREAKPOINT}px)`);
  const activeSuggestionIndexRef = { value: -1 };
  const currentSuggestionsRef = { value: [] };

  let searchIndexCache = [];

  const liveRegion = getOrCreateLiveRegion({
    id: IDS.LIVE_REGION_ID,
    parent: autocompleteResults.parentNode,
  });

  setupComboboxAria({
    input: searchInput,
    resultsContainer: autocompleteResults,
    resultsId: IDS.RESULTS_CONTAINER_ID,
  });

  function isMobileViewport() {
    return mobileQuery.matches;
  }

  function isMobileMenuOpen() {
    return !!mainNavigation?.classList.contains(CLASSES.NAV_ACTIVE);
  }

  function isDesktopSearchPanelOpen() {
    return !!searchPanel?.classList.contains(CLASSES.SEARCH_PANEL_ACTIVE);
  }

  function clearSitewideResults() {
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
  }

  function resetSitewideSearch({ blur = false } = {}) {
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
    onClear: clearSitewideResults,
  });

  function syncSearchAccessibility() {
    if (!searchPanel || !searchToggle) return;

    if (isMobileViewport()) {
      searchPanel.setAttribute('aria-hidden', 'false');
      searchToggle.setAttribute('aria-expanded', String(isMobileMenuOpen()));
    } else {
      searchPanel.setAttribute('aria-hidden', isDesktopSearchPanelOpen() ? 'false' : 'true');
      searchToggle.setAttribute('aria-expanded', isDesktopSearchPanelOpen() ? 'true' : 'false');
    }
  }

  function openSearchPanel({ focusInput = false } = {}) {
    if (!searchPanel || !searchToggle || isMobileViewport()) return;

    searchPanel.classList.add(CLASSES.SEARCH_PANEL_ACTIVE);
    syncSearchAccessibility();

    if (focusInput) {
      requestAnimationFrame(() => {
        searchInput.focus({ preventScroll: true });
      });
    }
  }

  function closeSearchPanel({ restoreFocus = false } = {}) {
    if (!searchPanel || !searchToggle || isMobileViewport()) return;

    searchPanel.classList.remove(CLASSES.SEARCH_PANEL_ACTIVE);
    resetSitewideSearch();
    syncSearchAccessibility();

    if (restoreFocus) {
      searchToggle.focus({ preventScroll: true });
    }
  }

  function requestMobileSearchOpen() {
    window.dispatchEvent(new CustomEvent(EVENTS.REQUEST_MOBILE_SEARCH_PANEL, {
      detail: {
        focusTarget: searchInput,
      },
    }));
  }

  function requestMobileMenuClose() {
    window.dispatchEvent(new CustomEvent(EVENTS.REQUEST_CLOSE_MOBILE_MENU));
  }

  function navigateToSuggestion(url) {
    if (!url) return;

    resetSitewideSearch();

    if (isMobileViewport()) {
      requestMobileMenuClose();
    } else if (isDesktopSearchPanelOpen()) {
      searchPanel.classList.remove(CLASSES.SEARCH_PANEL_ACTIVE);
      syncSearchAccessibility();
    }

    window.location.assign(url);
  }

  function toggleSearchPanel() {
    if (!searchPanel || !searchToggle) return;

    if (isMobileViewport()) {
      requestMobileSearchOpen();
      return;
    }

    if (isDesktopSearchPanelOpen()) {
      closeSearchPanel({ restoreFocus: true });
    } else {
      openSearchPanel({ focusInput: true });
    }
  }

  function renderSuggestions(filtered, query) {
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = CLASSES.NO_RESULTS;
      noResults.textContent = TEMPLATES.NO_RESULTS(query);

      autocompleteResults.replaceChildren(noResults);

      setAutocompleteVisibility({
        input: searchInput,
        resultsContainer: autocompleteResults,
        visible: true,
        activeSuggestionIndexRef,
        currentSuggestionsRef,
      });

      liveRegion.textContent = TEMPLATES.NO_RESULTS(query);
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
      item.dataset.url = entry.url;

      const img = document.createElement('img');
      img.src = entry.img || CONFIG.IMAGE_FALLBACK;
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

    syncAriaState({
      input: searchInput,
      resultsContainer: autocompleteResults,
      activeSuggestionIndexRef,
      activeClass: CLASSES.ACTIVE,
    });

    liveRegion.textContent =
      `${filtered.length} result${filtered.length > 1 ? 's' : ''} found for "${query}".`;

    clearControl.sync();
  }

  async function hydrateSearchIndex() {
    try {
      const masterIndex = await loadSearchIndex(CONFIG.INDEX_PATH);

      searchIndexCache = masterIndex
        .map(item => ({
          name: item.name || '',
          description: item.description || '',
          url: item.url || '',
          img: item.img || '',
          searchKey: stripAccents(`${item.name || ''} ${item.description || ''}`),
        }))
        .filter(item => item.url && item.name);

      return searchIndexCache;
    } catch (err) {
      console.warn(`Sitewide Search: JSON index not found at ${CONFIG.INDEX_PATH}`, err);
      searchIndexCache = [];
      return searchIndexCache;
    }
  }

  function getFilteredSuggestions(query) {
    const normalizedQuery = stripAccents(query.trim());
    if (normalizedQuery.length < CONFIG.MIN_QUERY_LENGTH) return [];

    const results = [];

    for (let i = 0; i < searchIndexCache.length; i++) {
      const item = searchIndexCache[i];
      if (!item.searchKey.includes(normalizedQuery)) continue;

      results.push(item);

      if (results.length >= CONFIG.MAX_SUGGESTIONS) break;
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }

  function processInputValue(rawValue) {
    const query = rawValue.trim();

    if (query.length < CONFIG.MIN_QUERY_LENGTH) {
      clearSitewideResults();
      clearControl.sync();
      return;
    }

    if (searchIndexCache.length === 0) return;

    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
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
        const activeSuggestion =
          activeSuggestionIndexRef.value >= 0 ? autocompleteResults.children[activeSuggestionIndexRef.value] : null;

        if (activeSuggestion?.dataset.url) {
          event.preventDefault();
          navigateToSuggestion(activeSuggestion.dataset.url);
        }
        break;
      }

      case KEYS.ARROW_DOWN:
        if (hasSuggestions) {
          event.preventDefault();
          moveActiveSuggestion({
            input: searchInput,
            resultsContainer: autocompleteResults,
            activeSuggestionIndexRef,
            direction: 'down',
            activeClass: CLASSES.ACTIVE,
          });
        }
        break;

      case KEYS.ARROW_UP:
        if (hasSuggestions) {
          event.preventDefault();
          moveActiveSuggestion({
            input: searchInput,
            resultsContainer: autocompleteResults,
            activeSuggestionIndexRef,
            direction: 'up',
            activeClass: CLASSES.ACTIVE,
          });
        }
        break;

      case KEYS.ESCAPE:
        event.preventDefault();
        if (hasSuggestions || searchInput.value.trim()) {
          resetSitewideSearch({ blur: true });
        } else if (!isMobileViewport() && isDesktopSearchPanelOpen()) {
          closeSearchPanel({ restoreFocus: true });
        }
        break;
    }
  });

  autocompleteResults.addEventListener(EVENTS.CLICK, event => {
    const suggestion = event.target.closest(`.${CLASSES.SUGGESTION}`);
    if (suggestion?.dataset.url) {
      navigateToSuggestion(suggestion.dataset.url);
    }
  });

  document.addEventListener(EVENTS.CLICK, event => {
    const { target } = event;
    if (!target || target.nodeType !== 1) return;

    const isOutsideSearch =
      !target.closest(SELECTORS.SEARCH_CONTAINER) &&
      !target.closest(`#${IDS.SEARCH_TOGGLE_ID}`) &&
      !target.closest(`#${IDS.SEARCH_PANEL_ID}`);

    if (isOutsideSearch) {
      clearSitewideResults();

      if (!isMobileViewport() && isDesktopSearchPanelOpen()) {
        closeSearchPanel();
      }
    }
  });

  searchInput.addEventListener(EVENTS.FOCUS, () => {
    const query = searchInput.value.trim();

    if (!isMobileViewport() && !isDesktopSearchPanelOpen()) {
      openSearchPanel();
      return;
    }

    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });

  searchToggle?.addEventListener(EVENTS.CLICK, event => {
    event.preventDefault();
    toggleSearchPanel();
  });

  window.addEventListener(EVENTS.NAV_MENU_STATE_CHANGE, () => {
    resetSitewideSearch();
    syncSearchAccessibility();
  });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', syncSearchAccessibility);
  } else {
    mobileQuery.addListener(syncSearchAccessibility);
  }

  hydrateSearchIndex().then(() => {
    const query = searchInput.value.trim();
    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });

  syncSearchAccessibility();
}