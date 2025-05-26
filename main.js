// main.js - Updated for Overlay Sidebar

// --- GLOBAL UTILITY FUNCTIONS ---
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// --- THEME SWITCHING FUNCTIONS ---
function applyThemeAndSave(theme) {
  const htmlElement = document.documentElement;
  const themeSwitchButton = document.getElementById("themeSwitch");
  const themeIconSun = document.getElementById("themeIconSun");
  const themeIconMoon = document.getElementById("themeIconMoon");

  if (theme === "light") {
    htmlElement.classList.add("light-theme");
    if (themeSwitchButton) themeSwitchButton.setAttribute("aria-label", "Switch to Dark Theme");
    if (themeIconSun) themeIconSun.style.display = "none";
    if (themeIconMoon) themeIconMoon.style.display = "block";
  } else { // dark
    htmlElement.classList.remove("light-theme");
    if (themeSwitchButton) themeSwitchButton.setAttribute("aria-label", "Switch to Light Theme");
    if (themeIconSun) themeIconSun.style.display = "block";
    if (themeIconMoon) themeIconMoon.style.display = "none";
  }
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    console.warn("LocalStorage is not available. Theme preference will not be saved.");
  }
}

function toggleThemeOnClick() {
  const htmlElement = document.documentElement;
  if (htmlElement.classList.contains("light-theme")) {
    applyThemeAndSave("dark");
  } else {
    applyThemeAndSave("light");
  }
}

// --- SIDEBAR MENU TOGGLE FUNCTION (OVERLAY LOGIC) ---
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const menuToggleButton = document.querySelector(".menu-toggle");
  const pageDimOverlay = document.querySelector(".page-dim-overlay"); // Get the page dim overlay

  if (sidebar && menuToggleButton && pageDimOverlay) {
    const isActive = sidebar.classList.toggle("overlay-active"); // Toggle the overlay state
    pageDimOverlay.classList.toggle("active", isActive); // Sync dim overlay with sidebar
    document.body.classList.toggle('no-scroll', isActive); // Prevent body scroll when overlay is active

    menuToggleButton.setAttribute("aria-expanded", String(isActive));
  }

}

// --- SIDEBAR SEARCH TRIGGER FUNCTION (FOR OVERLAY) ---
function handleSidebarSearchTriggerClick() {
  const sidebar = document.getElementById("sidebar");
  const searchInput = document.getElementById("searchInput");

  if (sidebar && searchInput) {
    if (!sidebar.classList.contains("overlay-active")) { // If overlay is not active
      toggleMenu(); // Activate it (this will make the search input visible)
      setTimeout(() => {
        searchInput.focus(); // Focus after transition
      }, 300); // Corresponds to --sidebar-transition-speed
    } else {
      searchInput.focus(); // Already active, just focus
    }
  }
}

// --- ACTIVE SIDEBAR LINK FUNCTION ---
function setActiveSidebarLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");

  if (navLinks.length > 0) {
    navLinks.forEach(link => {
      let linkHref = link.getAttribute("href").split('/').pop() || 'index.html';
      if (link.getAttribute("href") === "./" || link.getAttribute("href") === "index.html") {
        linkHref = 'index.html';
      }
      link.classList.toggle("active", linkHref === currentPath);
    });
  }
}

// --- CARD HEIGHT EQUALIZATION (REVISED) ---
function equalizeInitialCardHeights() {
  const productWrapper = document.querySelector('.product-wrapper');
  if (!productWrapper) return;

  const cards = Array.from(productWrapper.querySelectorAll('.box-container'));
  if (cards.length === 0) return;

  let maxMainContentHeight = 0;

  cards.forEach(card => {
    if (!card.classList.contains('expanded') && !card.classList.contains('dropdown-active-overflow')) {
      card.style.height = 'auto';
      card.style.minHeight = '';
      card.style.maxHeight = '';
      const mainTopContent = card.querySelector('.main-card-top-content');
      if (mainTopContent) {
        mainTopContent.style.height = 'auto';
      }
    }
  });

  if (cards.length > 0) { try { productWrapper.offsetHeight; } catch(e){} }

  cards.forEach(card => {
    if (!card.classList.contains('expanded') && !card.classList.contains('dropdown-active-overflow')) {
      const mainTopContent = card.querySelector('.main-card-top-content');
      if (mainTopContent) {
        const currentMainContentHeight = mainTopContent.scrollHeight;
        if (currentMainContentHeight > maxMainContentHeight) {
          maxMainContentHeight = currentMainContentHeight;
        }
      }
    }
  });

  if (maxMainContentHeight > 0) {
    cards.forEach(card => {
      if (!card.classList.contains('expanded') && !card.classList.contains('dropdown-active-overflow')) {
        const mainTopContent = card.querySelector('.main-card-top-content');
        if (mainTopContent) {
          mainTopContent.style.height = `${maxMainContentHeight}px`;
        }
      }
    });
  }
}

// --- CONTRIBUTOR MODAL FUNCTIONS ---
let lastOpenedContributorLink = null;

function openContributorModal(contributorData, triggerElement) {
  const contributorModalOverlay = document.getElementById('contributorModalOverlay');
  const contributorModal = document.getElementById('contributorModal');
  const contributorModalCloseBtn = document.getElementById('contributorModalClose');
  const contributorModalTitle = document.getElementById('contributorModalTitle');
  const contributorModalBody = document.getElementById('contributorModalBody');

  if (!contributorModal || !contributorModalOverlay || !contributorModalBody || !contributorModalTitle) {
    console.error("MODAL ERROR: One or more core modal HTML elements are MISSING.");
    return;
  }

  lastOpenedContributorLink = triggerElement;
  contributorModalTitle.textContent = contributorData.name || "Contributor Information";
  contributorModalBody.innerHTML = '';

  if (contributorData.githubUrl) {
    contributorModalBody.innerHTML += `
      <a href="${contributorData.githubUrl}" class="contributor-link-item" target="_blank" rel="noopener noreferrer">
        <img src="images/github-logo.svg" alt="GitHub" class="contributor-link-icon">
        <span class="contributor-link-text">View GitHub Profile</span>
      </a>`;
  }
  if (contributorData.kofiUrl) {
    contributorModalBody.innerHTML += `
      <a href="${contributorData.kofiUrl}" class="contributor-link-item" target="_blank" rel="noopener noreferrer">
        <img src="images/kofi-logo.svg" alt="Ko-fi" class="contributor-link-icon">
        <span class="contributor-link-text">Support on Ko-fi</span>
      </a>`;
  }
  if (contributorData.paypalUrl) {
    contributorModalBody.innerHTML += `
      <a href="${contributorData.paypalUrl}" class="contributor-link-item" target="_blank" rel="noopener noreferrer">
        <img src="images/paypal-logo.svg" alt="PayPal" class="contributor-link-icon">
        <span class="contributor-link-text">Donate via PayPal</span>
      </a>`;
  }
  if (contributorData.buymeacoffeeUrl) {
    contributorModalBody.innerHTML += `
      <a href="${contributorData.buymeacoffeeUrl}" class="contributor-link-item" target="_blank" rel="noopener noreferrer">
        <img src="images/buymeacoffee-logo.svg" alt="Buy Me a Coffee" class="contributor-link-icon">
        <span class="contributor-link-text">Buy Me a Coffee</span>
      </a>`;
  }

  contributorModalOverlay.classList.add('active');
  contributorModal.classList.add('active');
  document.body.classList.add('no-scroll'); // Prevent body scroll when modal is active

  if (contributorModalCloseBtn) {
    contributorModalCloseBtn.focus();
  } else {
    console.warn("Modal close button (contributorModalClose) not found for focusing.");
  }
}

function closeContributorModal() {
  const contributorModalOverlay = document.getElementById('contributorModalOverlay');
  const contributorModal = document.getElementById('contributorModal');
  if (!contributorModal || !contributorModalOverlay) return;

  contributorModalOverlay.classList.remove('active');
  contributorModal.classList.remove('active');
  document.body.classList.remove('no-scroll'); // Re-enable body scroll

  if (lastOpenedContributorLink) {
    lastOpenedContributorLink.focus();
    lastOpenedContributorLink = null;
  }
}

// --- CONTENT CAROUSEL FUNCTION ---
function setupContentCarousel() {
  const carouselTrack = document.getElementById('carouselTrack');
  const carouselDotsContainer = document.getElementById('carouselDots');
  const prevButton = document.getElementById('carouselPrev');
  const nextButton = document.getElementById('carouselNext');
  const carouselSection = document.querySelector('.content-carousel-section');

  if (!carouselTrack || !carouselDotsContainer || !prevButton || !nextButton || !carouselSection) {
    if (carouselSection) carouselSection.style.display = 'none';
    console.warn("Carousel elements not fully found. Carousel will not be initialized.");
    return;
  }

  if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries) || searchEntries.length === 0) {
    carouselSection.style.display = 'none';
    console.warn("searchEntries is undefined or empty. Carousel will not be initialized.");
    return;
  }

  const itemsWithIcons = searchEntries.filter(entry => entry && entry.icon);
  const shuffledItems = itemsWithIcons.sort(() => 0.5 - Math.random());
  const carouselItems = shuffledItems.slice(0, 10);

  if (carouselItems.length === 0) {
    carouselSection.style.display = 'none';
    console.warn("No suitable items with icons for the carousel.");
    return;
  }

  carouselItems.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.classList.add('carousel-slide');
    const linkUrl = `${item.page}#${item.id}`;
    slide.innerHTML = `
      <a href="${linkUrl}">
        <img src="${item.icon}" alt="${item.name}">
        <div class="slide-caption">${item.name}</div>
      </a>
    `;
    carouselTrack.appendChild(slide);

    if (carouselItems.length > 1) {
      const dot = document.createElement('span');
      dot.classList.add('carousel-dot');
      dot.dataset.slideTo = index;
      if (index === 0) dot.classList.add('active');
      carouselDotsContainer.appendChild(dot);
    }
  });

  if (carouselItems.length <= 1) {
    if(prevButton) prevButton.style.display = 'none';
    if(nextButton) nextButton.style.display = 'none';
    if(carouselDotsContainer) carouselDotsContainer.style.display = 'none';
    return;
  }

  let currentSlide = 0;
  const totalSlides = carouselItems.length;

  function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
  }

  let autoplayInterval = null;
  const autoplayDelay = 5000;

  function stopAutoplay() { clearInterval(autoplayInterval); }
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateCarousel();
    }, autoplayDelay);
  }
  function resetAutoplay() { stopAutoplay(); startAutoplay(); }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentSlide = (currentSlide + 1) % totalSlides;
      updateCarousel();
      resetAutoplay();
    });
  }
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateCarousel();
      resetAutoplay();
    });
  }
  if (carouselDotsContainer) {
    carouselDotsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('carousel-dot')) {
        currentSlide = parseInt(e.target.dataset.slideTo, 10);
        updateCarousel();
        resetAutoplay();
      }
    });
  }

  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoplay);
    carouselContainer.addEventListener('mouseleave', startAutoplay);
    carouselContainer.addEventListener('focusin', stopAutoplay); // For keyboard navigation
    carouselContainer.addEventListener('focusout', startAutoplay);
  }

  startAutoplay();
  updateCarousel();
}


// --- DOMCONTENTLOADED EVENT LISTENER ---
document.addEventListener("DOMContentLoaded", () => {
  const themeSwitchButton = document.getElementById("themeSwitch");
  const themeIconSun = document.getElementById("themeIconSun");
  const themeIconMoon = document.getElementById("themeIconMoon");

  const sidebar = document.getElementById("sidebar");
  const menuToggleButton = document.querySelector(".menu-toggle");
  const pageDimOverlay = document.querySelector(".page-dim-overlay"); // Get the page dim overlay

  const sidebarSearchInput = document.getElementById("searchInput");
  const sidebarSearchTriggerButton = document.querySelector(".sidebar-search-trigger"); // For the trigger icon/button
  const autocompleteResults = document.getElementById("autocompleteResults");

  const productWrapper = document.querySelector('.product-wrapper');

  const contributorModalOverlay = document.getElementById('contributorModalOverlay');
  const contributorModalCloseBtn = document.getElementById('contributorModalClose');

  function syncThemeButtonUIState() {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains("light-theme")) {
      if (themeSwitchButton) themeSwitchButton.setAttribute("aria-label", "Switch to Dark Theme");
      if (themeIconSun) themeIconSun.style.display = "none";
      if (themeIconMoon) themeIconMoon.style.display = "block";
    } else {
      if (themeSwitchButton) themeSwitchButton.setAttribute("aria-label", "Switch to Light Theme");
      if (themeIconSun) themeIconSun.style.display = "block";
      if (themeIconMoon) themeIconMoon.style.display = "none";
    }
  }
  syncThemeButtonUIState();
  if (themeSwitchButton) {
    themeSwitchButton.addEventListener("click", toggleThemeOnClick);
  }

  setActiveSidebarLink();

  if (menuToggleButton && sidebar) {
    // Initial ARIA state for sidebar toggle (should be closed by default)
    menuToggleButton.setAttribute("aria-expanded", String(sidebar.classList.contains("overlay-active")));
    menuToggleButton.setAttribute("aria-controls", "sidebar");
    menuToggleButton.addEventListener("click", toggleMenu); // Attach toggleMenu to the button
  }

  // Add listener for the new sidebar search trigger button
  if (sidebarSearchTriggerButton) {
    sidebarSearchTriggerButton.addEventListener("click", handleSidebarSearchTriggerClick);
  }


  const currentYear = new Date().getFullYear().toString();
  const sidebarYearSpan = document.getElementById("currentYear");
  if (sidebarYearSpan) sidebarYearSpan.textContent = currentYear;
  const footerYearSpan = document.getElementById("footerCurrentYear");
  if (footerYearSpan) footerYearSpan.textContent = currentYear;

  function setupExternalLinks() {
    const links = document.body.querySelectorAll('a');
    const currentHostname = window.location.hostname;
    links.forEach(link => {
      if (link.href && link.host && link.host !== currentHostname &&
          !link.classList.contains('contributor-name-link') && // Exclude specific internal-like links
          !link.classList.contains('carousel-slide') && // Exclude carousel links if they are internal
          link.closest('.sidebar-nav') === null && // Exclude sidebar navigation links
          link.closest('.dropdown-menu') === null // Exclude dropdown menu items if internal
         ) {
        if (link.protocol === "http:" || link.protocol === "https:") {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      }
    });
  }
  setupExternalLinks();

  if (productWrapper) {
    // Info Toggle Logic
    document.querySelectorAll('.info-toggle').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentBox = button.closest('.box-container');
        if (!currentBox) return;
        const wasExpanded = currentBox.classList.contains('expanded');

        document.querySelectorAll('.box-container.expanded').forEach(otherBox => {
          if (otherBox !== currentBox) {
            otherBox.classList.remove('expanded');
            const otherButton = otherBox.querySelector('.info-toggle');
            if (otherButton) {
              otherButton.setAttribute('aria-expanded', 'false');
              otherButton.classList.remove('info-toggle-active');
            }
          }
        });
        currentBox.classList.toggle('expanded', !wasExpanded);
        button.setAttribute('aria-expanded', String(!wasExpanded));
        button.classList.toggle('info-toggle-active', !wasExpanded);
      });
    });

    // Download Links Population
    if (typeof downloads !== 'undefined' && downloads) {
      const linkElements = document.querySelectorAll('a[id^="download-"], .dropdown-menu a[id]');
      linkElements.forEach(element => {
        const id = element.id;
        let downloadUrl = null;
        if (downloads[id]) {
          downloadUrl = downloads[id];
        } else if (id && downloads[id.replace('download-', '')]) {
          downloadUrl = downloads[id.replace('download-', '')];
        }
        if (downloadUrl) element.href = downloadUrl;
      });
    }

    // Dropdown Logic
    document.querySelectorAll('.box-link.download-item-wrapper.dropdown .action-button.download-action-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const clickedButton = e.currentTarget;
        const parentWrapper = clickedButton.closest('.box-link.download-item-wrapper.dropdown');
        if (!parentWrapper) return;
        const menu = parentWrapper.querySelector('.dropdown-menu');
        const currentBox = parentWrapper.closest('.box-container');
        if (!menu) return;
        const isCurrentlyOpen = menu.classList.contains('open');

        document.querySelectorAll('.dropdown-menu.open').forEach(otherMenu => {
          if (otherMenu !== menu) {
            otherMenu.classList.remove('open');
            const otherParentWrapper = otherMenu.closest('.box-link.download-item-wrapper.dropdown');
            if (otherParentWrapper) {
              otherParentWrapper.classList.remove('show');
              const otherTriggerButton = otherParentWrapper.querySelector('.action-button.download-action-btn');
              if (otherTriggerButton) otherTriggerButton.setAttribute('aria-expanded', 'false');
              const otherBoxContainer = otherParentWrapper.closest('.box-container');
              if (otherBoxContainer) otherBoxContainer.classList.remove('dropdown-active-overflow');
            }
          }
        });

        menu.classList.toggle('open');
        const isOpenNow = menu.classList.contains('open');
        clickedButton.setAttribute('aria-expanded', String(isOpenNow));
        if (parentWrapper) parentWrapper.classList.toggle('show', isOpenNow);
        if (currentBox) currentBox.classList.toggle('dropdown-active-overflow', isOpenNow);
      });
    });

    // Card Height Equalization
    if (document.readyState === "complete" || document.readyState === "interactive") {
      equalizeInitialCardHeights();
    } else {
      window.addEventListener('load', equalizeInitialCardHeights);
    }

    let resizeTimeoutForCards;
    let lastKnownWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeoutForCards);
      resizeTimeoutForCards = setTimeout(() => {
        const currentWidth = window.innerWidth;
        if (Math.abs(currentWidth - lastKnownWidth) > 50 || (lastKnownWidth <= 1024 && currentWidth > 1024) || (lastKnownWidth > 1024 && currentWidth <= 1024) ) {
          equalizeInitialCardHeights();
          lastKnownWidth = currentWidth;
        }
      }, 250);
    });
  }

  // Contributor Modal Listeners
  if (contributorModalOverlay) {
    contributorModalOverlay.addEventListener('click', closeContributorModal);
  }
  if (contributorModalCloseBtn) {
    contributorModalCloseBtn.addEventListener('click', closeContributorModal);
  }
  document.addEventListener('keydown', (event) => {
    const contributorModal = document.getElementById('contributorModal');
    if (event.key === 'Escape' && contributorModal && contributorModal.classList.contains('active')) {
      closeContributorModal();
    }
  });

  const contributorLinks = document.querySelectorAll('.contributor-name-link');
  if (contributorLinks.length > 0) {
    contributorLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        const data = {
          name: this.dataset.name,
          githubUrl: this.dataset.githubUrl,
          kofiUrl: this.dataset.kofiUrl,
          paypalUrl: this.dataset.paypalUrl,
          buymeacoffeeUrl: this.dataset.buymeacoffeeUrl
        };
        openContributorModal(data, this);
      });
    });
  }

  // Initialize Content Carousel
  if (document.getElementById('carouselTrack')) {
    setupContentCarousel();
  }

  // Add click listener for the page dim overlay to close the sidebar
  if (pageDimOverlay) {
    pageDimOverlay.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains("overlay-active")) {
        toggleMenu();
      }
    });
  }

  // Global click listener for closing autocomplete, dropdowns, info-boxes
  document.addEventListener('click', (event) => {
    const target = event.target;

    // Sidebar is now closed by clicking its own dim overlay or toggle button
    // No need for an "outside click" detection for the sidebar itself here,
    // as the dim overlay covers the rest of the content.

    // Close autocomplete if clicked outside search interaction area
    if (autocompleteResults && sidebarSearchInput) {
      const searchInteractionArea = document.querySelector('.sidebar-search-interaction-area');
      if (autocompleteResults.style.display === 'block' &&
          searchInteractionArea && !searchInteractionArea.contains(target)) {
        sidebarSearchInput.value = ''; // Clear search input
        autocompleteResults.style.display = 'none';
        autocompleteResults.innerHTML = '';
      }
    }

    // Close dropdowns if clicked outside
    if (productWrapper) {
      document.querySelectorAll('.dropdown-menu.open').forEach(openMenu => {
        const parentWrapper = openMenu.closest('.box-link.download-item-wrapper.dropdown');
        if (parentWrapper && !parentWrapper.contains(target)) {
          openMenu.classList.remove('open');
          const triggerButton = parentWrapper.querySelector('.action-button.download-action-btn');
          if (triggerButton) triggerButton.setAttribute('aria-expanded', 'false');
          if (parentWrapper) parentWrapper.classList.remove('show');
          const boxContainer = parentWrapper.closest('.box-container');
          if (boxContainer) boxContainer.classList.remove('dropdown-active-overflow');
        }
      });

      // Close expanded info-boxes if clicked outside
      const clickedOnAnyInfoToggle = target.closest('.info-toggle');
      document.querySelectorAll('.box-container.expanded').forEach(expandedBox => {
        if (!expandedBox.contains(target) && (!clickedOnAnyInfoToggle || !expandedBox.querySelector('.info-toggle').contains(clickedOnAnyInfoToggle)) ) {
          const dropdownToggleOfThisCard = expandedBox.querySelector('.action-button.download-action-btn');
          if (!dropdownToggleOfThisCard || !dropdownToggleOfThisCard.contains(target)) {
            expandedBox.classList.remove('expanded');
            const infoButton = expandedBox.querySelector('.info-toggle');
            if (infoButton) {
              infoButton.setAttribute('aria-expanded', 'false');
              infoButton.classList.remove('info-toggle-active');
            }
          }
        }
      });
    }
  });

  // Prevent event bubbling from certain elements
  if (sidebar) {
    sidebar.addEventListener('click', (event) => {
      // Stop propagation only if the click is on the sidebar itself (padding area)
      // and not on an interactive element within it.
      if (event.target === sidebar) {
         event.stopPropagation();
      }
    });
  }
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.addEventListener('click', event => {
      if (!event.target.closest('a')) {
        event.stopPropagation();
      }
    });
  });
  document.querySelectorAll('.info-box').forEach(infoBox => {
    infoBox.addEventListener('click', event => {
      if (!event.target.closest('a')) {
        event.stopPropagation();
      }
    });
  });

}); // End DOMContentLoaded