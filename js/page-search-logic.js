document.addEventListener('DOMContentLoaded', () => {
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
    SUGGESTION: '.autocomplete-suggestion',
    SEARCH_CONTAINER: '.page-search-container',
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
    ARIA_OWNS: 'aria-owns',
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
  };
  const KEYS = {
    ENTER: 'Enter',
    ARROW_DOWN: 'ArrowDown',
    ARROW_UP: 'ArrowUp',
    ESCAPE: 'Escape',
    TAB: 'Tab',
  };
  const CONFIG = {
    INDEX_PATH: '/json/search-index.json', // Path to your global JSON
    SCROLL_BEHAVIOR: 'smooth',
    SCROLL_OFFSET_PX: 20,
    HIGHLIGHT_DURATION_MS: 2500,
    DEBOUNCE_MS: 150,
    MIN_QUERY_LENGTH: 1,
    MAX_SUGGESTIONS: 10,
    IMAGE_FALLBACK: '/images/fallback.png', 
  };
  const TEMPLATES = {
    SUGGESTION_ID_PREFIX: 'suggestion-',
    ARIA_LABEL_SUGGESTIONS: 'Suggested items',
    NO_RESULTS: (input) => input
      ? `No results found for "${input}".`
      : 'No results found.',
  };

  // --- DOM ELEMENTS ---
  const searchInput = document.getElementById(IDS.SEARCH_INPUT_ID);
  const autocompleteResults = document.getElementById(IDS.RESULTS_CONTAINER_ID);
  const sortSelect = document.getElementById(IDS.SORT_BY);

  let searchIndexCache = [];
  let isIndexLoading = false;

  // --- Live region for screen reader announcements ---
  let liveRegion = document.getElementById(IDS.LIVE_REGION_ID);
  if (!liveRegion && autocompleteResults) {
    liveRegion = document.createElement('div');
    liveRegion.id = IDS.LIVE_REGION_ID;
    liveRegion.setAttribute(ATTRIBUTES.ROLE, ROLES.STATUS);
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    autocompleteResults.parentNode.appendChild(liveRegion);
  }

  // --- EARLY NULL CHECKS ---
  if (!searchInput || !autocompleteResults) return;

  // --- ARIA SETUP ---
  searchInput.setAttribute(ATTRIBUTES.ROLE, ROLES.COMBOBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_AUTOCOMPLETE, 'list');
  searchInput.setAttribute(ATTRIBUTES.ARIA_HASPOPUP, ROLES.LISTBOX);
  searchInput.setAttribute(ATTRIBUTES.ARIA_OWNS, IDS.RESULTS_CONTAINER_ID);

  autocompleteResults.setAttribute(ATTRIBUTES.ROLE, ROLES.LISTBOX);
  autocompleteResults.setAttribute(ATTRIBUTES.ARIA_LABEL, TEMPLATES.ARIA_LABEL_SUGGESTIONS);

  // --- UTILITY: ACCENT-INSENSITIVE SEARCH ---
  function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // =========================
  // JSON DATA LOADING & FILTERING
  // =========================
  async function loadSearchIndex() {
    if (searchIndexCache.length > 0 || isIndexLoading) return;
    isIndexLoading = true;
    
    try {
      const response = await fetch(CONFIG.INDEX_PATH);
      if (!response.ok) throw new Error('Index fetch failed');
      const masterIndex = await response.json();

      // Extract the current filename (e.g., 'emulators.html') to filter the global JSON
      const currentPageFile = window.location.pathname.split('/').pop() || 'index.html';

      // Keep only items that belong to this specific page
      const pageSpecificData = masterIndex.filter(item => item.url.includes(currentPageFile));

      // Map it into our rapid-search cache
      searchIndexCache = pageSpecificData.map(item => {
        // Extract the DOM ID from the URL (everything after the #)
        const elementId = item.url.split('#')[1];
        
        return {
          id: elementId,
          name: item.name,
          searchKey: stripAccents(`${item.name} ${item.description || ''}`),
          icon: item.img,
        };
      });

      // If the user already typed something while it was loading, trigger a search
      if (searchInput.value.trim().length >= CONFIG.MIN_QUERY_LENGTH) {
        searchInput.dispatchEvent(new Event('input'));
      }

    } catch (err) {
      console.warn('Page Search: JSON index not found or failed to load.', err);
    } finally {
      isIndexLoading = false;
    }
  }

  // --- UTILITY: DEBOUNCE ---
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- UTILITY: AUTOCOMPLETE VISIBILITY ---
  function setAutocompleteVisibility(visible) {
    autocompleteResults.style.display = visible ? 'block' : 'none';
    searchInput.setAttribute(ATTRIBUTES.ARIA_EXPANDED, visible ? 'true' : 'false');
    if (!visible) searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
  }

  // --- UI RESET ---
  function resetSearchUI() {
    searchInput.value = '';
    autocompleteResults.innerHTML = '';
    setAutocompleteVisibility(false);
    liveRegion.textContent = '';
  }

  // --- HIGHLIGHT AND SCROLL ---
  function removeExistingHighlights() {
    document.querySelectorAll(SELECTORS.HIGHLIGHTED).forEach(el => {
      el.classList.remove(CLASSES.HIGHLIGHT);
    });
  }

  function getHeaderHeight() {
    const header = document.querySelector(SELECTORS.MAIN_HEADER);
    return header ? header.offsetHeight : 0;
  }

  function scrollToElement(element, headerHeight) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight - CONFIG.SCROLL_OFFSET_PX;
    window.scrollTo({
      top: offsetPosition,
      behavior: CONFIG.SCROLL_BEHAVIOR
    });
  }

  function focusAndHighlightElement(element) {
    element.classList.add(CLASSES.HIGHLIGHT);
    
    // Find the actual interactive trigger inside the card
    const targetToFocus = element.querySelector(SELECTORS.CARD_LINK) || element;
    
    // Only add tabindex="-1" if we are forced to focus a non-interactive element
    if (targetToFocus === element) {
      element.setAttribute(ATTRIBUTES.TABINDEX, '-1');
    }
    
    targetToFocus.focus({ preventScroll: true });
    
    setTimeout(() => {
      element.classList.remove(CLASSES.HIGHLIGHT);
      if (targetToFocus === element) {
        targetToFocus.addEventListener('blur', () => {
          targetToFocus.removeAttribute(ATTRIBUTES.TABINDEX);
        }, { once: true });
      }
    }, CONFIG.HIGHLIGHT_DURATION_MS);
  }

  function applyHighlightAndScroll(elementId) {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;
    removeExistingHighlights();
    const headerHeight = getHeaderHeight();
    scrollToElement(targetElement, headerHeight);
    focusAndHighlightElement(targetElement);
  }

  // --- SUGGESTION FILTERING ---
  function getFilteredSuggestions(query) {
    const normalizedQuery = stripAccents(query.trim());
    if (normalizedQuery.length < CONFIG.MIN_QUERY_LENGTH) return [];
    
    return searchIndexCache.filter(entry => {
      // 1. Must match search query
      if (!entry.searchKey.includes(normalizedQuery)) return false;
      
      // 2. Must be physically visible on the page (respects your dropdown sort/filters)
      const cardEl = document.getElementById(entry.id);
      return cardEl && cardEl.style.display !== 'none';
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- ARIA State Sync Helper ---
  function syncAriaState() {
    const suggestions = Array.from(autocompleteResults.querySelectorAll(SELECTORS.SUGGESTION));
    let activeFound = false;
    suggestions.forEach((item, idx) => {
      if (!activeFound && idx === 0) {
        item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'true');
        item.classList.add(CLASSES.ACTIVE);
        searchInput.setAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT, item.id);
        activeFound = true;
      } else {
        item.setAttribute(ATTRIBUTES.ARIA_SELECTED, 'false');
        item.classList.remove(CLASSES.ACTIVE);
      }
    });
    if (!activeFound) {
      searchInput.removeAttribute(ATTRIBUTES.ARIA_ACTIVEDESCENDANT);
    }
  }

  // --- KEYBOARD NAVIGATION HELPER ---
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

  // --- RENDER SUGGESTIONS ---
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
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.slice(0, CONFIG.MAX_SUGGESTIONS).forEach((entry, index) => {
      const item = document.createElement('div');
      item.classList.add(CLASSES.SUGGESTION);
      item.setAttribute(ATTRIBUTES.ROLE, ROLES.OPTION);
      item.id = `${TEMPLATES.SUGGESTION_ID_PREFIX}${index}`;
      item.dataset.entryId = entry.id;

      const img = document.createElement('img');
      img.src = entry.icon || CONFIG.IMAGE_FALLBACK;
      img.alt = entry.name;
      img.className = CLASSES.SUGGESTION_LOGO;
      img.onerror = () => { img.src = CONFIG.IMAGE_FALLBACK; };

      const span = document.createElement('span');
      span.className = CLASSES.SUGGESTION_NAME;
      span.textContent = entry.name;

      item.appendChild(img);
      item.appendChild(span);

      fragment.appendChild(item);
    });

    autocompleteResults.replaceChildren(fragment);
    setAutocompleteVisibility(true);
    liveRegion.textContent = `${filtered.length} suggestion${filtered.length > 1 ? 's' : ''} for "${query}" available.`;
    syncAriaState();
  }

  // --- CONSOLIDATED SUGGESTION UPDATE ---
  function updateSuggestions(query) {
    const filtered = getFilteredSuggestions(query);
    renderSuggestions(filtered, query);
  }

  // --- DEBOUNCED INPUT HANDLER ---
  const handleInput = debounce(function (event) {
    const query = event.target.value.trim();
    if (query.length === 0) {
      autocompleteResults.innerHTML = '';
      setAutocompleteVisibility(false);
      liveRegion.textContent = '';
      return;
    }

    // Ensure data is loaded before trying to filter
    if (searchIndexCache.length === 0) return;

    updateSuggestions(query);
  }, CONFIG.DEBOUNCE_MS);

  // --- INITIALIZATION & EVENT LISTENERS ---
  
  loadSearchIndex(); // Fetch JSON immediately to prevent typing delay

  searchInput.addEventListener(EVENTS.INPUT, handleInput);

  searchInput.addEventListener(EVENTS.KEYDOWN, function (event) {
    const hasSuggestions = autocompleteResults.querySelector(SELECTORS.SUGGESTION);

    switch (event.key) {
      case KEYS.ENTER: {
        if (!hasSuggestions) return;
        event.preventDefault();
        event.stopPropagation(); // <-- This stops the keypress from triggering the modal!
        const activeSuggestion = autocompleteResults.querySelector('[aria-selected="true"]');
        if (activeSuggestion && activeSuggestion.dataset.entryId) {
          applyHighlightAndScroll(activeSuggestion.dataset.entryId);
          resetSearchUI();
        }
        break;
      }
      case KEYS.ARROW_DOWN: {
        event.preventDefault();
        if (!hasSuggestions && searchInput.value.trim().length === 0) {
          updateSuggestions('');
        } else {
          moveActiveSuggestion('down');
        }
        break;
      }
      case KEYS.ARROW_UP:
        if (!hasSuggestions) return;
        event.preventDefault();
        moveActiveSuggestion('up');
        break;
      case KEYS.ESCAPE:
        resetSearchUI();
        break;
      case KEYS.TAB:
        break;
    }
  });

  autocompleteResults.addEventListener(EVENTS.CLICK, function (event) {
    const suggestion = event.target.closest(SELECTORS.SUGGESTION);
    if (suggestion && suggestion.dataset.entryId) {
      event.preventDefault(); 
      applyHighlightAndScroll(suggestion.dataset.entryId);
      resetSearchUI();
    }
  });

  document.addEventListener(EVENTS.CLICK, function (event) {
    if (!event.target.closest(SELECTORS.SEARCH_CONTAINER)) {
      setAutocompleteVisibility(false);
    }
  });

  searchInput.addEventListener('focus', function () {
    if (searchInput.value.trim().length > 0) {
      updateSuggestions(searchInput.value);
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      if (searchInput.value.trim().length > 0) {
        updateSuggestions(searchInput.value);
      }
    });
  }

  // --- CROSS-PAGE HIGHLIGHT LISTENER ---
  function handleHashNavigation() {
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      // Slight delay ensures the DOM is fully painted
      setTimeout(() => {
        applyHighlightAndScroll(targetId);
      }, 150);
    }
  }

  // Fire once on initial load (for cross-page navigation)
  handleHashNavigation();
  
  // Fire again if the hash changes without a page reload (for same-page sitewide search)
  window.addEventListener('hashchange', handleHashNavigation);
});
