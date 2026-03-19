/**
 * sitewide-search.js
 * Automated Sitewide Search
 * Module-safe
 */

// --- CONSTANTS ---
const IDS = {
  SEARCH_INPUT_ID: 'sitewideSearch',
  RESULTS_CONTAINER_ID: 'sitewideAutocomplete',
  LIVE_REGION_ID: 'sitewideLiveRegion',
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
};

const ATTRIBUTES = {
  ROLE: 'role',
  ARIA_AUTOCOMPLETE: 'aria-autocomplete',
  ARIA_HASPOPUP: 'aria-haspopup',
  ARIA_CONTROLS: 'aria-controls',
  ARIA_EXPANDED: 'aria-expanded',
  ARIA_SELECTED: 'aria-selected',
  ARIA_ACTIVEDESCENDANT: 'aria-activedescendant',
};

const ROLES = {
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  STATUS: 'status',
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
};

const TEMPLATES = {
  SUGGESTION_ID_PREFIX: 'site-suggest-',
  NO_RESULTS: input => `No results found for "${input}".`,
};

// --- DOM ELEMENTS ---
const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);

if (!searchInput || !autocompleteResults) {
  // noop
} else {
  // --- STATE ---
  let searchIndexCache = [];
  let searchIndexPromise = null;
  let activeSuggestionIndex = -1;

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

  function debounce(fn, wait) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function setAutocompleteVisibility(visible) {
    autocompleteResults.style.display = visible ? 'block' : 'none';
    searchInput.setAttribute(ATTRIBUTES.ARIA_EXPANDED, visible ? 'true' : 'false');

    if (!visible) {
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
      activeSuggestionIndex = -1;
    }
  }

  function clearSuggestions() {
    autocompleteResults.replaceChildren();
    activeSuggestionIndex = -1;
    searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
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

  function navigateToSuggestionUrl(url) {
    if (!url) return;
    window.location.assign(url);
  }

  async function loadSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;

    searchIndexPromise = fetch(CONFIG.INDEX_PATH)
      .then(response => {
        if (!response.ok) throw new Error('Index fetch failed');
        return response.json();
      })
      .then(masterIndex => {
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
      })
      .catch(err => {
        console.warn(`Sitewide Search: JSON index not found at ${CONFIG.INDEX_PATH}`, err);
        searchIndexCache = [];
        return searchIndexCache;
      });

    return searchIndexPromise;
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

  function renderSuggestions(filtered, query) {
    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = CLASSES.NO_RESULTS;
      noResults.textContent = TEMPLATES.NO_RESULTS(query);

      autocompleteResults.replaceChildren(noResults);
      setAutocompleteVisibility(true);
      liveRegion.textContent = TEMPLATES.NO_RESULTS(query);
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
      activeSuggestionIndex = -1;
      return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < filtered.length; i++) {
      const entry = filtered[i];

      const item = document.createElement('div');
      item.className = CLASSES.SUGGESTION;
      item.setAttribute(ATTRIBUTES.ROLE, ROLES.OPTION);
      item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
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
    setAutocompleteVisibility(true);
    syncAriaState();

    liveRegion.textContent =
      `${filtered.length} result${filtered.length > 1 ? 's' : ''} found for "${query}".`;
  }

  function processInputValue(rawValue) {
    const query = rawValue.trim();

    if (query.length < CONFIG.MIN_QUERY_LENGTH) {
      clearSuggestions();
      setAutocompleteVisibility(false);
      liveRegion.textContent = '';
      return;
    }

    if (searchIndexCache.length === 0) return;

    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
  }

  const handleInput = debounce(event => {
    processInputValue(event.target.value);
  }, CONFIG.DEBOUNCE_MS);

  searchInput.addEventListener('input', handleInput);

  searchInput.addEventListener('keydown', event => {
    const hasSuggestions =
      autocompleteResults.children.length > 0 &&
      autocompleteResults.firstElementChild?.classList.contains(CLASSES.SUGGESTION);

    switch (event.key) {
      case KEYS.ENTER: {
        const activeSuggestion =
          activeSuggestionIndex >= 0 ? autocompleteResults.children[activeSuggestionIndex] : null;

        if (activeSuggestion?.dataset.url) {
          event.preventDefault();
          navigateToSuggestionUrl(activeSuggestion.dataset.url);
        }
        break;
      }

      case KEYS.ARROW_DOWN:
        if (hasSuggestions) {
          event.preventDefault();
          moveActiveSuggestion('down');
        }
        break;

      case KEYS.ARROW_UP:
        if (hasSuggestions) {
          event.preventDefault();
          moveActiveSuggestion('up');
        }
        break;

      case KEYS.ESCAPE:
        clearSuggestions();
        setAutocompleteVisibility(false);
        liveRegion.textContent = '';
        break;
    }
  });

  autocompleteResults.addEventListener('click', event => {
    const suggestion = event.target.closest(`.${CLASSES.SUGGESTION}`);
    if (suggestion?.dataset.url) {
      navigateToSuggestionUrl(suggestion.dataset.url);
    }
  });

  document.addEventListener('click', event => {
    if (!event.target.closest(SELECTORS.SEARCH_CONTAINER)) {
      setAutocompleteVisibility(false);
    }
  });

  searchInput.addEventListener('focus', () => {
    const query = searchInput.value.trim();
    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });

  loadSearchIndex().then(() => {
    const query = searchInput.value.trim();
    if (query.length >= CONFIG.MIN_QUERY_LENGTH) {
      processInputValue(query);
    }
  });
}