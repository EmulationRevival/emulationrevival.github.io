document.addEventListener('DOMContentLoaded', () => {
  // --- CONSTANTS ---
  const SELECTORS = {
    CARD: '.card',
    CARD_GRID: '.card-grid',
    CARD_LINK: '.card-link',
    CARD_TITLE: '.card-title',
    CARD_IMAGE: '.card-image',
    INFO_LIST: '.info-list',
    POPOVER_TRIGGER: '.popover-trigger',
    POPOVER_MENU: '.popover-menu',
    ACTION_DROPDOWN: '.action-dropdown',
    MODAL_HEADER: '.modal-header',
    MODAL_HEADER_THUMB: '.modal-header-thumb',
    MODAL_HEADER_TITLE: '.modal-header-title',
    MAIN_HEADER: '.main-header',
    MAIN_CONTENT: 'main',
    MAIN_FOOTER: '.main-footer',
    CARD_MODAL_CONTENT: '.card-modal-content',
    MODAL_CLOSE_BUTTON: '.modal-close-button',
    RELEASE_DATE: '.release-date'
  };

  const IDS = {
    SORT_BY: 'sortBy',
    GAME_DETAIL_MODAL: 'gameDetailModal',
    GAME_DETAIL_MODAL_OVERLAY: 'gameDetailModalOverlay',
    GAME_DETAIL_MODAL_CLOSE: 'gameDetailModalClose',
    GAME_DETAIL_MODAL_TITLE: 'gameDetailModalTitle',
    GAME_DETAIL_MODAL_BODY: 'gameDetailModalBody',
  };

  const CLASSES = {
    ACTIVE: 'active',
    OPEN: 'open',
    SELECTED: 'selected',
    MODAL_HEADER_THUMB: 'modal-header-thumb',
  };

  const KEYS = {
    TAB: 'Tab',
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
  };

  const SORT_TYPES = {
    ALPHABETICAL: 'alphabetical',
    REVERSE_ALPHABETICAL: 'reverse-alphabetical',
    XBOX_ONE: 'xbox-one',
    XBOX_SERIES: 'xbox-series',
    NEWEST: 'newest', 
    OLDEST: 'oldest', 
    DEFAULT: 'default',
  };

  const DATA_ATTRS = {
    MODAL_TRIGGER: 'modalTrigger', // used as dataset property, not full 'data-modal-trigger'
    MODAL_ID: 'modal-id', // used for selector
  };

  const ARIA = {
    EXPANDED: 'aria-expanded',
    HIDDEN: 'aria-hidden',
    TRUE: 'true',
    FALSE: 'false',
  };

  // --- DOM ELEMENTS ---
  const gameDetailModal = document.getElementById(IDS.GAME_DETAIL_MODAL);
  const gameDetailModalOverlay = document.getElementById(IDS.GAME_DETAIL_MODAL_OVERLAY);
  const gameDetailModalCloseBtn = document.getElementById(IDS.GAME_DETAIL_MODAL_CLOSE);
  const gameDetailModalHeader = gameDetailModal?.querySelector(SELECTORS.MODAL_HEADER);
  const gameDetailModalTitle = document.getElementById(IDS.GAME_DETAIL_MODAL_TITLE);
  const gameDetailModalBody = document.getElementById(IDS.GAME_DETAIL_MODAL_BODY);
  const mainHeader = document.querySelector(SELECTORS.MAIN_HEADER);
  const mainContent = document.querySelector(SELECTORS.MAIN_CONTENT);
  const mainFooter = document.querySelector(SELECTORS.MAIN_FOOTER);
  const sortSelect = document.getElementById(IDS.SORT_BY);
  const cardGrid = document.querySelector(SELECTORS.CARD_GRID);

  // --- STATE ---
  let lastOpenedCardTrigger = null;
  const backgroundElementsToInert = [mainHeader, mainContent, mainFooter].filter(Boolean);

  // --- CARDS CACHE ---
  // Cache all card elements at page load (original order)
  const ALL_CARDS = Array.from(document.querySelectorAll(SELECTORS.CARD));

  // --- SORTING & FILTERING ---

  function sortCards(cards, sortType) {
    return cards.slice().sort((a, b) => {
      // Handle Date Sorting
      if (sortType === SORT_TYPES.NEWEST || sortType === SORT_TYPES.OLDEST) {
        // Grab the ISO datetime attribute. If it's missing, default to an old date so it drops to the bottom.
        const dateA = a.querySelector(SELECTORS.RELEASE_DATE)?.getAttribute('datetime') || '1970-01-01';
        const dateB = b.querySelector(SELECTORS.RELEASE_DATE)?.getAttribute('datetime') || '1970-01-01';

        if (sortType === SORT_TYPES.NEWEST) {
          return dateB.localeCompare(dateA); // Newer (larger string) comes first
        } else {
          return dateA.localeCompare(dateB); // Older (smaller string) comes first
        }
      }

      // Fallback to Alphabetical Sorting
      const titleA = a.querySelector(SELECTORS.CARD_TITLE)?.textContent.toLowerCase() || '';
      const titleB = b.querySelector(SELECTORS.CARD_TITLE)?.textContent.toLowerCase() || '';
      if (sortType === SORT_TYPES.REVERSE_ALPHABETICAL) {
        return titleB.localeCompare(titleA);
      }
      // Default and 'alphabetical'
      return titleA.localeCompare(titleB);
    });
  }

  function filterCards(cards, filterType) {
    return cards.filter(card => {
      const modalContent = card.querySelector(SELECTORS.CARD_MODAL_CONTENT);
      const compatibility = modalContent?.querySelector(SELECTORS.INFO_LIST)?.textContent || '';
      if (filterType === SORT_TYPES.XBOX_ONE) {
        return compatibility.includes('Xbox One');
      }
      if (filterType === SORT_TYPES.XBOX_SERIES) {
        return compatibility.includes('Series S|X'); // Relaxed to strictly match the back-half of both variations
      }
      // Default: show all
      return true;
    });
  }

  // --- SIMPLIFIED UPDATE LOGIC ---
  function updateCardGrid(filteredCards) {
    const fragment = document.createDocumentFragment();
    filteredCards.forEach(card => {
      fragment.appendChild(card);
    });
    cardGrid.replaceChildren(fragment);

    // Show a message if the grid is empty
    if (filteredCards.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'card-grid-empty-message';
      emptyMsg.textContent = 'No cards available.';
      cardGrid.appendChild(emptyMsg);
    }
  }

  function handleSortAndFilter() {
    if (!cardGrid) return;
    const sortType = sortSelect?.value || SORT_TYPES.DEFAULT;
    const sortedCards = sortCards(ALL_CARDS, sortType);
    const filteredCards = filterCards(sortedCards, sortType);
    updateCardGrid(filteredCards);
  }

  // --- MODAL LOGIC ---

  function openGameDetailModal(cardLink) {
    if (!gameDetailModal || !cardLink) return;
    const cardElement = cardLink.closest(SELECTORS.CARD);
    const modalTriggerId = cardLink.dataset[DATA_ATTRS.MODAL_TRIGGER];
    if (!cardElement || !modalTriggerId) return;

    const contentSource = document.querySelector(`${SELECTORS.CARD_MODAL_CONTENT}[data-${DATA_ATTRS.MODAL_ID}="${modalTriggerId}"]`);
    if (!contentSource) {
      // Show a user-friendly message in the modal if content is missing
      gameDetailModalBody.textContent = 'Details not available for this card.';
      gameDetailModal.classList.add(CLASSES.ACTIVE);
      gameDetailModalOverlay?.classList.add(CLASSES.ACTIVE);
      gameDetailModalCloseBtn?.focus();
      return;
    }

    lastOpenedCardTrigger = cardLink;
    cardLink.setAttribute(ARIA.EXPANDED, ARIA.TRUE);

    // Scrollbar compensation
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    if (mainHeader) mainHeader.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = 'hidden';

    backgroundElementsToInert.forEach(el => el.inert = true);

    // Modal header thumbnail
    updateModalHeaderThumb(cardElement);

    // Clone modal content
    const contentClone = contentSource.cloneNode(true);
    gameDetailModalBody?.replaceChildren(...contentClone.childNodes);

    // Accessibility: Fallback focus to close button if no focusable elements
    const focusableElements = getFocusableElements(gameDetailModal);
    if (focusableElements.length === 0 && gameDetailModalCloseBtn) {
      gameDetailModalCloseBtn.focus();
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    gameDetailModalOverlay?.classList.add(CLASSES.ACTIVE);
    gameDetailModal.classList.add(CLASSES.ACTIVE);
  }

  function updateModalHeaderThumb(cardElement) {
    const existingThumb = gameDetailModalHeader?.querySelector(SELECTORS.MODAL_HEADER_THUMB);
    if (existingThumb) existingThumb.remove();

    const title = cardElement.querySelector(SELECTORS.CARD_TITLE)?.textContent;
    const imageSource = cardElement.querySelector(SELECTORS.CARD_IMAGE);

    if (gameDetailModalTitle) gameDetailModalTitle.textContent = title || '';

    if (imageSource && gameDetailModalHeader) {
      const thumb = document.createElement('img');
      thumb.src = imageSource.src;
      // Use the card's defined alt text for accessibility
      thumb.alt = imageSource.alt || (title ? `${title} Thumbnail` : '');
      thumb.className = CLASSES.MODAL_HEADER_THUMB;
      gameDetailModalHeader.insertBefore(thumb, gameDetailModalTitle);
    }
  }

  function closeGameDetailModal() {
    if (!gameDetailModal) return;
    gameDetailModalOverlay?.classList.remove(CLASSES.ACTIVE);
    gameDetailModal.classList.remove(CLASSES.ACTIVE);

    document.body.style.paddingRight = '';
    if (mainHeader) mainHeader.style.paddingRight = '';
    document.body.style.overflow = '';

    backgroundElementsToInert.forEach(el => el.inert = false);

    if (lastOpenedCardTrigger) {
      lastOpenedCardTrigger.setAttribute(ARIA.EXPANDED, ARIA.FALSE);
      lastOpenedCardTrigger.focus();
      lastOpenedCardTrigger = null;
    }
  }

  function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll(
        'a[href]:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);
  }

  function trapFocusInModal(event) {
    if (event.key !== KEYS.TAB) return;
    const focusableElements = getFocusableElements(gameDetailModal);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  // --- EVENT HANDLERS ---

  function handleDocumentClick(event) {
    const { target } = event;

    const cardLink = target.closest(SELECTORS.CARD_LINK);
    if (cardLink && cardLink.dataset[DATA_ATTRS.MODAL_TRIGGER]) {
      event.preventDefault();
      openGameDetailModal(cardLink);
      return;
    }

    const popoverTrigger = target.closest(SELECTORS.POPOVER_TRIGGER);
    const activePopover = document.querySelector(`${SELECTORS.POPOVER_MENU}.${CLASSES.ACTIVE}`);

    if (popoverTrigger) {
      event.preventDefault();
      const menu = popoverTrigger.nextElementSibling;
      if (activePopover) activePopover.classList.remove(CLASSES.ACTIVE);
      if (menu && activePopover !== menu) {
        menu.classList.add(CLASSES.ACTIVE);
        menu.querySelector('a')?.focus();
      }
      return;
    }

    if (activePopover && !target.closest(SELECTORS.POPOVER_MENU)) {
      activePopover.classList.remove(CLASSES.ACTIVE);
    }

    const openDetailsDropdown = document.querySelector(`${SELECTORS.ACTION_DROPDOWN}[${CLASSES.OPEN}]`);
    if (openDetailsDropdown && !openDetailsDropdown.contains(target)) {
      openDetailsDropdown.open = false;
    }
  }

  function handleDocumentKeydown(event) {
    if (gameDetailModal.classList.contains(CLASSES.ACTIVE)) {
      trapFocusInModal(event);
      if (event.key === KEYS.ESCAPE) {
        closeGameDetailModal();
      }
      return;
    }

    if (
      document.activeElement &&
      document.activeElement.matches(SELECTORS.CARD_LINK) &&
      (event.key === KEYS.ENTER || event.key === KEYS.SPACE)
    ) {
      event.preventDefault();
      openGameDetailModal(document.activeElement);
    }
  }

  // --- INITIALIZATION ---

  function bindEvents() {
    sortSelect?.addEventListener('change', handleSortAndFilter);
    gameDetailModalOverlay?.addEventListener('click', closeGameDetailModal);
    gameDetailModalCloseBtn?.addEventListener('click', closeGameDetailModal);

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeydown);
  }

  function init() {
    if (!cardGrid) {
      console.warn('Card grid not found. Card logic will not be initialized.');
      return;
    }
    handleSortAndFilter();
    bindEvents();
  }

  init();
});