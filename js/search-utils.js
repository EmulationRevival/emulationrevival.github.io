import {
  CARD_HASH_FOCUS_OPTIONS,
  scheduleHashTargetFocus,
} from './ui-utils.js';

let searchIndexCache = null;
let searchIndexPromise = null;
let searchIndexPathCache = null;

export async function loadSearchIndex(indexPath = '/json/search-index.json') {
  if (searchIndexCache && searchIndexPathCache === indexPath) {
    return searchIndexCache;
  }

  if (searchIndexPromise && searchIndexPathCache === indexPath) {
    return searchIndexPromise;
  }

  searchIndexPathCache = indexPath;

  searchIndexPromise = fetch(indexPath, { credentials: 'same-origin' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Index fetch failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error('Search index payload is not an array');
      }

      searchIndexCache = data;
      return searchIndexCache;
    })
    .catch(error => {
      searchIndexCache = null;
      searchIndexPromise = null;
      searchIndexPathCache = null;
      throw error;
    });

  return searchIndexPromise;
}

export function clearSearchIndexCache() {
  searchIndexCache = null;
  searchIndexPromise = null;
  searchIndexPathCache = null;
}

export function debounce(fn, wait) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function stripAccents(str = '') {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function getOrCreateLiveRegion({
  id,
  parent,
  role = 'status',
  live = 'polite',
  atomic = 'true',
  className = 'sr-only',
}) {
  let liveRegion = document.getElementById(id);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.setAttribute('role', role);
    liveRegion.setAttribute('aria-live', live);
    liveRegion.setAttribute('aria-atomic', atomic);
    liveRegion.className = className;
    parent?.appendChild(liveRegion);
  }

  return liveRegion;
}

export function setupComboboxAria({
  input,
  resultsContainer,
  resultsId,
  ariaLabel,
}) {
  if (!input || !resultsContainer) return;

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-haspopup', 'listbox');
  input.setAttribute('aria-controls', resultsId);
  input.setAttribute('aria-expanded', 'false');

  resultsContainer.setAttribute('role', 'listbox');

  if (ariaLabel) {
    resultsContainer.setAttribute('aria-label', ariaLabel);
  }
}

export function setAutocompleteVisibility({
  input,
  resultsContainer,
  visible,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
}) {
  if (!input || !resultsContainer) return;

  resultsContainer.style.display = visible ? 'block' : 'none';
  input.setAttribute('aria-expanded', visible ? 'true' : 'false');

  if (!visible) {
    input.removeAttribute('aria-activedescendant');

    if (activeSuggestionIndexRef) {
      activeSuggestionIndexRef.value = -1;
    }

    if (currentSuggestionsRef) {
      currentSuggestionsRef.value = [];
    }
  }
}

export function clearSuggestions({
  input,
  resultsContainer,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
}) {
  if (!input || !resultsContainer) return;

  resultsContainer.replaceChildren();
  input.removeAttribute('aria-activedescendant');

  if (activeSuggestionIndexRef) {
    activeSuggestionIndexRef.value = -1;
  }

  if (currentSuggestionsRef) {
    currentSuggestionsRef.value = [];
  }
}

export function clearSearchUiState({
  input,
  resultsContainer,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
  liveRegion,
  clearControl,
}) {
  if (!input || !resultsContainer) return;

  clearSuggestions({
    input,
    resultsContainer,
    activeSuggestionIndexRef,
    currentSuggestionsRef,
  });

  setAutocompleteVisibility({
    input,
    resultsContainer,
    visible: false,
    activeSuggestionIndexRef,
    currentSuggestionsRef,
  });

  if (liveRegion) {
    liveRegion.textContent = '';
  }

  clearControl?.sync?.();
}

export function resetSearchState({
  input,
  resultsContainer,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
  liveRegion,
  clearControl,
  blur = false,
}) {
  if (!input || !resultsContainer) return;

  input.value = '';

  clearSearchUiState({
    input,
    resultsContainer,
    activeSuggestionIndexRef,
    currentSuggestionsRef,
    liveRegion,
    clearControl,
  });

  if (blur) {
    input.blur();
  }
}

export function syncAriaState({
  input,
  resultsContainer,
  activeSuggestionIndexRef,
  activeClass = 'is-active',
}) {
  if (!input || !resultsContainer || !activeSuggestionIndexRef) return;

  const nodes = resultsContainer.children;

  if (!nodes.length) {
    activeSuggestionIndexRef.value = -1;
    input.removeAttribute('aria-activedescendant');
    return;
  }

  const activeIndex = activeSuggestionIndexRef.value;

  for (let i = 0; i < nodes.length; i++) {
    const isActive = i === activeIndex;
    nodes[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    nodes[i].classList.toggle(activeClass, isActive);
  }

  if (activeIndex >= 0 && activeIndex < nodes.length) {
    input.setAttribute('aria-activedescendant', nodes[activeIndex].id);
  } else {
    activeSuggestionIndexRef.value = -1;
    input.removeAttribute('aria-activedescendant');
  }
}

export function moveActiveSuggestion({
  input,
  resultsContainer,
  activeSuggestionIndexRef,
  direction,
  activeClass = 'is-active',
}) {
  if (!input || !resultsContainer || !activeSuggestionIndexRef) return;

  const nodes = resultsContainer.children;
  if (!nodes.length) return;

  if (activeSuggestionIndexRef.value < 0) {
    activeSuggestionIndexRef.value = direction === 'down' ? 0 : nodes.length - 1;
  } else {
    nodes[activeSuggestionIndexRef.value].setAttribute('aria-selected', 'false');
    nodes[activeSuggestionIndexRef.value].classList.remove(activeClass);

    if (direction === 'down') {
      activeSuggestionIndexRef.value = (activeSuggestionIndexRef.value + 1) % nodes.length;
    } else {
      activeSuggestionIndexRef.value = (activeSuggestionIndexRef.value - 1 + nodes.length) % nodes.length;
    }
  }

  const next = nodes[activeSuggestionIndexRef.value];
  next.setAttribute('aria-selected', 'true');
  next.classList.add(activeClass);
  input.setAttribute('aria-activedescendant', next.id);
  next.scrollIntoView({ block: 'nearest' });
}

export function setupClearableSearchInput({
  input,
  onClear,
  blurOnClear = true,
  wrapperClass = 'search-input-wrap',
  buttonClass = 'search-clear-btn',
  buttonLabel = 'Clear search',
  buttonText = '×',
}) {
  if (!input) {
    return {
      button: null,
      sync: () => {},
      clear: () => {},
    };
  }

  let wrapper = input.parentElement;
  if (!wrapper || !wrapper.classList.contains(wrapperClass)) {
    wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    input.parentNode?.insertBefore(wrapper, input);
    wrapper.appendChild(input);
  }

  let button = wrapper.querySelector(`.${buttonClass}`);
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = buttonClass;
    button.setAttribute('aria-label', buttonLabel);
    button.hidden = true;
    button.textContent = buttonText;
    wrapper.appendChild(button);
  }

  const sync = () => {
    button.hidden = input.value.trim().length === 0;
  };

  const clear = () => {
    input.value = '';
    onClear?.();
    sync();

    if (blurOnClear) {
      input.blur();
    }
  };

  input.addEventListener('input', sync);

  button.addEventListener('mousedown', event => {
    event.preventDefault();
  });

  button.addEventListener('click', () => {
    clear();
  });

  sync();

  return {
    button,
    sync,
    clear,
  };
}

export function createSearchTargetHighlighter({
  highlightClass = 'highlighted-by-search',
  durationMs = 2500,
  focusSelector = '.card-link',
} = {}) {
  let timeoutId = null;
  let currentElement = null;

  function clear() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (currentElement) {
      currentElement.classList.remove(highlightClass);
      currentElement = null;
    }
  }

  function focusTarget(element) {
    if (!element) return null;

    const targetToFocus = element.querySelector(focusSelector) || element;

    if (targetToFocus === element) {
      element.setAttribute('tabindex', '-1');
    }

    targetToFocus.focus({ preventScroll: true });

    if (targetToFocus === element) {
      targetToFocus.addEventListener('blur', () => {
        targetToFocus.removeAttribute('tabindex');
      }, { once: true });
    }

    return targetToFocus;
  }

  function highlight(element, { focus = true } = {}) {
    if (!element) return null;

    clear();

    currentElement = element;
    currentElement.classList.add(highlightClass);

    if (focus) {
      focusTarget(currentElement);
    }

    timeoutId = window.setTimeout(() => {
      if (currentElement) {
        currentElement.classList.remove(highlightClass);
        currentElement = null;
      }
      timeoutId = null;
    }, durationMs);

    return currentElement;
  }

  return {
    highlight,
    clear,
    focusTarget,
  };
}

export function renderNoSearchResults({
  input,
  resultsContainer,
  message,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
  liveRegion,
  clearControl,
  noResultsClass = 'autocomplete-no-results',
}) {
  if (!input || !resultsContainer) return;

  const noResults = document.createElement('div');
  noResults.className = noResultsClass;
  noResults.textContent = message;

  resultsContainer.replaceChildren(noResults);

  setAutocompleteVisibility({
    input,
    resultsContainer,
    visible: true,
    activeSuggestionIndexRef,
    currentSuggestionsRef,
  });

  input.removeAttribute('aria-activedescendant');

  if (activeSuggestionIndexRef) {
    activeSuggestionIndexRef.value = -1;
  }

  if (currentSuggestionsRef) {
    currentSuggestionsRef.value = [];
  }

  if (liveRegion) {
    liveRegion.textContent = message;
  }

  clearControl?.sync?.();
}

export function createSearchSuggestionNode({
  id,
  name,
  image,
  imageFallback = '/images/fallback.png',
  dataset = {},
  classNames = {},
}) {
  const {
    suggestion = 'autocomplete-suggestion',
    suggestionLogo = 'suggestion-logo',
    suggestionName = 'suggestion-name',
  } = classNames;

  const item = document.createElement('div');
  item.className = suggestion;
  item.setAttribute('role', 'option');
  item.setAttribute('aria-selected', 'false');
  item.id = id;

  Object.entries(dataset).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      item.dataset[key] = value;
    }
  });

  const img = document.createElement('img');
  img.src = image || imageFallback;
  img.alt = name;
  img.className = suggestionLogo;
  img.onerror = () => {
    img.onerror = null;
    img.src = imageFallback;
  };

  const span = document.createElement('span');
  span.className = suggestionName;
  span.textContent = name;

  item.append(img, span);

  return item;
}

export function renderSearchSuggestionsList({
  input,
  resultsContainer,
  suggestions,
  activeSuggestionIndexRef,
  currentSuggestionsRef,
  liveRegion,
  clearControl,
  suggestionIdPrefix = 'suggestion-',
  imageFallback = '/images/fallback.png',
  activeClass = 'is-active',
  classNames = {},
  liveRegionMessage,
  getDataset,
}) {
  if (!input || !resultsContainer || !Array.isArray(suggestions)) return;

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];

    const item = createSearchSuggestionNode({
      id: `${suggestionIdPrefix}${i}`,
      name: suggestion.name,
      image: suggestion.icon || suggestion.img || '',
      imageFallback,
      dataset: typeof getDataset === 'function' ? getDataset(suggestion, i) : {},
      classNames,
    });

    fragment.appendChild(item);
  }

  if (currentSuggestionsRef) {
    currentSuggestionsRef.value = suggestions;
  }

  if (activeSuggestionIndexRef) {
    activeSuggestionIndexRef.value = -1;
  }

  resultsContainer.replaceChildren(fragment);

  setAutocompleteVisibility({
    input,
    resultsContainer,
    visible: true,
    activeSuggestionIndexRef,
    currentSuggestionsRef,
  });

  syncAriaState({
    input,
    resultsContainer,
    activeSuggestionIndexRef,
    activeClass,
  });

  if (liveRegion && liveRegionMessage) {
    liveRegion.textContent = liveRegionMessage;
  }

  clearControl?.sync?.();
}

export function buildHashUrlForElementId(elementId) {
  const currentUrl = `${window.location.pathname || '/'}${window.location.search || ''}`;
  return `${currentUrl}#${encodeURIComponent(elementId)}`;
}

export function restoreHashTargetAfterRender({
  hash = window.location.hash,
  focusSelector = '.card-link',
  scrollBehavior = 'auto',
  scrollBlock = 'start',
} = {}) {
  if (!hash || hash.length < 2) return null;

  let elementId = '';

  try {
    elementId = decodeURIComponent(hash.slice(1));
  } catch {
    elementId = hash.slice(1);
  }

  if (!elementId) return null;

  const target = document.getElementById(elementId);
  if (!target || target.hidden) return null;

  const focusTarget = target.querySelector(focusSelector) || target;

  target.scrollIntoView({
    behavior: scrollBehavior,
    block: scrollBlock,
    inline: 'nearest',
  });

  if (focusTarget === target) {
    target.setAttribute('tabindex', '-1');
    target.addEventListener('blur', () => {
      target.removeAttribute('tabindex');
    }, { once: true });
  }

  focusTarget.focus({ preventScroll: true });

  return target;
}

function isSameDocumentNavigation(url) {
  if (!url) return false;

  try {
    const nextUrl = new URL(url, window.location.origin);
    const currentUrl = new URL(window.location.href);

    return (
      nextUrl.origin === currentUrl.origin &&
      nextUrl.pathname === currentUrl.pathname &&
      nextUrl.search === currentUrl.search &&
      nextUrl.hash.length > 1
    );
  } catch {
    return false;
  }
}

export function navigateToUrl(url, { focusOptions = CARD_HASH_FOCUS_OPTIONS } = {}) {
  if (!url) return false;

  const sameDocumentNavigation = isSameDocumentNavigation(url);

  window.location.assign(url);

  if (sameDocumentNavigation && focusOptions) {
    scheduleHashTargetFocus(focusOptions);
  }

  return true;
}