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

  for (let i = 0; i < nodes.length; i++) {
    const isActive = i === 0;
    nodes[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    nodes[i].classList.toggle(activeClass, isActive);

    if (isActive) {
      activeSuggestionIndexRef.value = 0;
      input.setAttribute('aria-activedescendant', nodes[i].id);
    }
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
    activeSuggestionIndexRef.value = 0;
  }

  nodes[activeSuggestionIndexRef.value].setAttribute('aria-selected', 'false');
  nodes[activeSuggestionIndexRef.value].classList.remove(activeClass);

  if (direction === 'down') {
    activeSuggestionIndexRef.value = (activeSuggestionIndexRef.value + 1) % nodes.length;
  } else {
    activeSuggestionIndexRef.value = (activeSuggestionIndexRef.value - 1 + nodes.length) % nodes.length;
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