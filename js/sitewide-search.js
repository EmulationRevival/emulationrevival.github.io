document.addEventListener('DOMContentLoaded', () => {
  // --- CONSTANTS ---
  const IDS = {
    SEARCH_INPUT_ID: 'sitewideSearch',
    RESULTS_CONTAINER_ID: 'sitewideAutocomplete',
    LIVE_REGION_ID: 'sitewideLiveRegion',
  };

  const SELECTORS = {
    SEARCH_CONTAINER: '.page-search-container',
    SUGGESTION: '.autocomplete-suggestion',
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
    ARIA_OWNS: 'aria-owns',
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
    // --- UPDATED PATH TO JSON FOLDER ---
    INDEX_PATH: '/json/search-index.json', 
    IMAGE_FALLBACK: '/images/fallback.png',
  };

  const TEMPLATES = {
    SUGGESTION_ID_PREFIX: 'site-suggest-',
    NO_RESULTS: (input) => `No results found for "${input}".`,
  };

  // --- DOM ELEMENTS ---
  const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
  const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);
  let masterIndex = [];
  let isIndexLoading = false;

  if (!searchInput || !autocompleteResults) return;

  // --- Live region for screen reader announcements ---
  let liveRegion = document.getElementById(IDS.LIVE_REGION_ID);
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = IDS.LIVE_REGION_ID;
    liveRegion.setAttribute(ATTRIBUTES.ROLE, ROLES.STATUS);
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    autocompleteResults.parentNode.appendChild(liveRegion);
  }

  // --- ARIA SETUP ---
  searchInput.setAttribute(ATTRIBUTES.ROLE, ROLES.COMBOBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_AUTOCOMPLETE, 'list');
  searchInput.setAttribute(ATTRIBUTES.ARIA_HASPOPUP, ROLES.LISTBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_OWNS, IDS.RESULTS_CONTAINER_ID);
  autocompleteResults.setAttribute(ATTRIBUTES.ROLE, ROLES.LISTBOX);

  // --- UTILITY: DEBOUNCE ---
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- DATA LOADING ---
  async function loadSearchIndex() {
    if (masterIndex.length > 0 || isIndexLoading) return;
    isIndexLoading = true;
    try {
      const response = await fetch(CONFIG.INDEX_PATH);
      if (!response.ok) throw new Error('Index fetch failed');
      masterIndex = await response.json();
      console.log('Sitewide index loaded successfully from /json/');
      
      // If the user already typed something while it was loading, trigger a search
      if (searchInput.value.trim().length >= CONFIG.MIN_QUERY_LENGTH) {
        searchInput.dispatchEvent(new Event('input'));
      }
    } catch (err) {
      console.warn('Sitewide Search: JSON index not found at ' + CONFIG.INDEX_PATH);
    } finally {
      isIndexLoading = false;
    }
  }

  // --- UI HELPERS ---
  function setAutocompleteVisibility(visible) {
    autocompleteResults.style.display = visible ? 'block' : 'none';
    searchInput.setAttribute(ATTRIBUTES.ARIA_EXPANDED, visible ? 'true' : 'false');
    if (!visible) searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
  }

  function syncAriaState() {
    const suggestions = Array.from(autocompleteResults.querySelectorAll(SELECTORS.SUGGESTION));
    suggestions.forEach((item, idx) => {
      if (idx === 0) {
        item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'true');
        item.classList.add(CLASSES.ACTIVE);
        searchInput.setAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT, item.id);
      } else {
        item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
        item.classList.remove(CLASSES.ACTIVE);
      }
    });
  }

  function moveActiveSuggestion(direction) {
    const suggestions = Array.from(autocompleteResults.querySelectorAll(SELECTORS.SUGGESTION));
    if (suggestions.length === 0) return;

    let currentIndex = suggestions.findIndex(s => s.getAttribute(ATTRIBUTES.ARIA_SELECTED) === 'true');
    if (currentIndex === -1) currentIndex = 0;

    suggestions[currentIndex].setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
    suggestions[currentIndex].classList.remove(CLASSES.ACTIVE);

    if (direction === 'down') {
      currentIndex = (currentIndex + 1) % suggestions.length;
    } else if (direction === 'up') {
      currentIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
    }

    const newActive = suggestions[currentIndex];
    newActive.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'true');
    newActive.classList.add(CLASSES.ACTIVE);
    searchInput.setAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT, newActive.id);
    newActive.scrollIntoView({ block: 'nearest' });
  }

  // --- RENDER ---
  function renderSuggestions(filtered, query) {
    autocompleteResults.innerHTML = '';

    if (filtered.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = CLASSES.NO_RESULTS;
      noResults.textContent = TEMPLATES.NO_RESULTS(query);
      autocompleteResults.appendChild(noResults);
      setAutocompleteVisibility(true);
      return;
    }

    filtered.slice(0, CONFIG.MAX_SUGGESTIONS).forEach((entry, index) => {
      const item = document.createElement('div');
      item.classList.add(CLASSES.SUGGESTION);
      item.setAttribute(ATTRIBUTES.ROLE, ROLES.OPTION);
      item.id = `${TEMPLATES.SUGGESTION_ID_PREFIX}${index}`;
      
      // Store URL for navigation on Enter or Click
      item.dataset.url = entry.url;

      // Image
      const img = document.createElement('img');
      img.src = entry.img || CONFIG.IMAGE_FALLBACK;
      img.className = CLASSES.SUGGESTION_LOGO;
      img.onerror = () => { img.src = CONFIG.IMAGE_FALLBACK; };

      // Name
      const span = document.createElement('span');
      span.className = CLASSES.SUGGESTION_NAME;
      span.textContent = entry.name;

      item.appendChild(img);
      item.appendChild(span);
      autocompleteResults.appendChild(item);
    });

    setAutocompleteVisibility(true);
    syncAriaState();
    liveRegion.textContent = `${filtered.length} results found.`;
  }

  // --- EVENT HANDLERS ---
  const handleInput = debounce((event) => {
    const query = event.target.value.toLowerCase().trim();
    if (query.length < CONFIG.MIN_QUERY_LENGTH) {
      setAutocompleteVisibility(false);
      return;
    }
    
    // Ensure data is loaded before filtering
    if (masterIndex.length === 0) {
       return;
    }

    const filtered = masterIndex.filter(item => {
      const nameMatch = item.name ? item.name.toLowerCase().includes(query) : false;
      const descMatch = item.description ? item.description.toLowerCase().includes(query) : false;
      return nameMatch || descMatch;
    });

    renderSuggestions(filtered, query);
  }, CONFIG.DEBOUNCE_MS);

  // Initialize data load ONLY when the user focuses on the search input
  searchInput.addEventListener('focus', loadSearchIndex, { once: true });

  searchInput.addEventListener('input', handleInput);

  searchInput.addEventListener('keydown', (event) => {
    const hasSuggestions = autocompleteResults.querySelector(SELECTORS.SUGGESTION);

    switch (event.key) {
      case KEYS.ENTER: {
        const activeSuggestion = autocompleteResults.querySelector('[aria-selected="true"]');
        if (activeSuggestion && activeSuggestion.dataset.url) {
          window.location.href = activeSuggestion.dataset.url;
        }
        break;
      }
      case KEYS.ARROW_DOWN:
        event.preventDefault();
        if (hasSuggestions) moveActiveSuggestion('down');
        break;
      case KEYS.ARROW_UP:
        event.preventDefault();
        if (hasSuggestions) moveActiveSuggestion('up');
        break;
      case KEYS.ESCAPE:
        setAutocompleteVisibility(false);
        break;
    }
  });

  autocompleteResults.addEventListener('click', (event) => {
    const suggestion = event.target.closest(SELECTORS.SUGGESTION);
    if (suggestion && suggestion.dataset.url) {
      window.location.href = suggestion.dataset.url;
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest(SELECTORS.SEARCH_CONTAINER)) {
      setAutocompleteVisibility(false);
    }
  });
});
