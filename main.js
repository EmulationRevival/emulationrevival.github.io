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

// --- MENU AND SEARCH TOGGLE FUNCTIONS (CALLED VIA ONCLICK IN HTML) ---
function toggleMenu() {
    const menu = document.getElementById("menu");
    if (menu) {
        menu.classList.toggle("visible");
    }
}

function toggleSearch(event) {
    if (event) {
        event.stopPropagation(); // Prevent this click from being caught by the global listener
    }
    const searchBarElement = document.getElementById("searchBar");
    const searchInput = searchBarElement ? searchBarElement.querySelector('input[type="text"]') : null;
    const autocompleteResults = document.getElementById('autocompleteResults');

    if (searchBarElement) {
        const wasVisible = searchBarElement.classList.contains('search-bar-visible');
        searchBarElement.classList.toggle('search-bar-visible');

        if (!wasVisible && searchBarElement.classList.contains('search-bar-visible')) {
            if (searchInput) {
                searchInput.focus();
            }
        } else if (wasVisible && !searchBarElement.classList.contains('search-bar-visible')) {
            if (searchInput) {
                searchInput.value = '';
            }
            if (autocompleteResults) {
                autocompleteResults.style.display = 'none';
                autocompleteResults.innerHTML = '';
            }
        }
    }
}

// --- CARD HEIGHT EQUALIZATION (FOR PAGES WITH .product-wrapper) ---
function equalizeInitialCardHeights() {
    const productWrapper = document.querySelector('.product-wrapper');
    if (!productWrapper) return;

    const cards = Array.from(productWrapper.querySelectorAll('.box-container'));
    if (cards.length === 0) return;

    let maxHeight = 0;

    // Reset heights first to accurately measure natural height
    cards.forEach(card => {
        if (!card.classList.contains('expanded') && !card.classList.contains('expanded-dropdown')) {
            card.style.height = 'auto';
            card.style.minHeight = '0';
            card.style.maxHeight = 'none';
            const mainTopContent = card.querySelector('.main-card-top-content');
            if (mainTopContent) {
                mainTopContent.style.height = 'auto'; // Reset inner content height
            }
        }
    });

    if (cards.length > 0) cards[0].offsetHeight; // Force reflow

    // Calculate max height among non-expanded cards
    cards.forEach(card => {
        if (!card.classList.contains('expanded') && !card.classList.contains('expanded-dropdown')) {
            const currentCardHeight = card.scrollHeight;
            if (currentCardHeight > maxHeight) {
                maxHeight = currentCardHeight;
            }
        }
    });

    // Apply the calculated max height to cards and adjust inner content
    if (maxHeight > 0) {
        cards.forEach(card => {
            if (!card.classList.contains('expanded') && !card.classList.contains('expanded-dropdown')) {
                const targetHeightPx = `${maxHeight}px`;
                card.style.minHeight = targetHeightPx;
                card.style.maxHeight = targetHeightPx;
                card.style.height = targetHeightPx;

                const mainTopContent = card.querySelector('.main-card-top-content');
                if (mainTopContent) {
                    const computedCardStyle = window.getComputedStyle(card);
                    const cardPaddingTop = parseFloat(computedCardStyle.paddingTop) || 0;
                    const cardPaddingBottom = parseFloat(computedCardStyle.paddingBottom) || 0;
                    const totalVerticalCardPadding = cardPaddingTop + cardPaddingBottom;

                    let infoBoxHeight = 0;
                    // .info-box is the next sibling of .main-card-top-content in the HTML structure
                    const infoBox = mainTopContent.nextElementSibling;
                    if (infoBox && infoBox.classList.contains('info-box')) {
                        // Get its current rendered height. If display:none (original CSS for collapsed),
                        // offsetHeight should be 0.
                        infoBoxHeight = infoBox.offsetHeight;
                    }
                    
                    let availableHeightForMainTop = maxHeight - totalVerticalCardPadding - infoBoxHeight;
                    
                    if (availableHeightForMainTop < 0) availableHeightForMainTop = 0; 
                    
                    mainTopContent.style.height = `${availableHeightForMainTop}px`;
                }
            }
        });
    }
}


// --- DOMCONTENTLOADED EVENT LISTENER ---
document.addEventListener("DOMContentLoaded", () => {
    const sideMenu = document.getElementById("menu");
    const menuToggle = document.querySelector(".menu-toggle");
    const searchBar = document.getElementById("searchBar");
    const searchIcon = document.querySelector(".search-icon");
    const searchInput = searchBar ? searchBar.querySelector('input[type="text"]') : null;
    const productWrapper = document.querySelector('.product-wrapper');

    function setupExternalLinks() {
        const links = document.body.querySelectorAll('a');
        const currentHostname = window.location.hostname;
        links.forEach(link => {
            if (link.href && link.host && link.host !== currentHostname) {
                if (link.protocol === "http:" || link.protocol === "https:") {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
            }
        });
    }
    setupExternalLinks();

    if (productWrapper) {
        document.querySelectorAll('.info-toggle').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentBox = button.closest('.box-container');
                if (!currentBox) return;
                const isCurrentlyExpanded = currentBox.classList.contains('expanded');
                document.querySelectorAll('.box-container.expanded').forEach(otherBox => {
                    if (otherBox !== currentBox) {
                        otherBox.classList.remove('expanded');
                    }
                });
                currentBox.classList.toggle('expanded', !isCurrentlyExpanded);
            });
        });

        if (typeof downloads !== 'undefined') {
            const linkElements = document.querySelectorAll('a[id^="download-"], .dropdown-menu a[id]');
            linkElements.forEach(element => {
                const id = element.id;
                let downloadUrl = null;
                if (downloads[id]) {
                    downloadUrl = downloads[id];
                } else if (downloads[id.replace('download-', '')]) {
                    downloadUrl = downloads[id.replace('download-', '')];
                }
                if (downloadUrl) {
                    element.href = downloadUrl;
                }
            });
        }

        document.querySelectorAll('.dropdown .download-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = button.closest('.dropdown');
                if (!dropdown) return;
                const box = dropdown.closest('.box-container');
                const menu = dropdown.querySelector('.dropdown-menu');
                if (!menu) return;
                const isCurrentlyShown = menu.style.display === 'block';
                document.querySelectorAll('.dropdown .dropdown-menu').forEach(otherMenu => {
                    if (otherMenu !== menu && otherMenu.style.display === 'block') {
                        otherMenu.style.display = 'none';
                        const otherDropdown = otherMenu.closest('.dropdown');
                        if (otherDropdown) otherDropdown.classList.remove('show');
                        const otherBox = otherDropdown ? otherDropdown.closest('.box-container') : null;
                        if (otherBox) otherBox.classList.remove('expanded-dropdown');
                    }
                });
                if (isCurrentlyShown) {
                    menu.style.display = 'none';
                    dropdown.classList.remove('show');
                    if (box) box.classList.remove('expanded-dropdown');
                } else {
                    menu.style.display = 'block';
                    dropdown.classList.add('show');
                    if (box) box.classList.add('expanded-dropdown');
                }
            });
        });
        equalizeInitialCardHeights();
    }

    function closeAndResetSearch() {
        if (searchBar && searchBar.classList.contains('search-bar-visible')) {
            searchBar.classList.remove('search-bar-visible');
            if (searchInput) {
                searchInput.value = '';
            }
            const autocompleteResults = document.getElementById('autocompleteResults');
            if (autocompleteResults) {
                autocompleteResults.style.display = 'none';
                autocompleteResults.innerHTML = '';
            }
        }
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        const autocompleteResults = document.getElementById('autocompleteResults');
        if (sideMenu && menuToggle && sideMenu.classList.contains('visible') &&
            !sideMenu.contains(target) && !menuToggle.contains(target)) {
            sideMenu.classList.remove('visible');
        }
        if (searchBar && searchIcon) {
            if (searchBar.classList.contains('search-bar-visible') &&
                !searchBar.contains(target) && !searchIcon.contains(target)) {
                closeAndResetSearch();
            }
        }
        if (autocompleteResults && autocompleteResults.style.display === 'block') {
             if (!searchInput || (searchInput && !searchInput.contains(target) && !autocompleteResults.contains(target))) {
                autocompleteResults.style.display = 'none';
                autocompleteResults.innerHTML = '';
            }
        }
        if (productWrapper) {
            document.querySelectorAll('.dropdown .dropdown-menu').forEach(menu => {
                if (menu.style.display === 'block') {
                    const dropdown = menu.closest('.dropdown');
                    if (dropdown && !dropdown.contains(target)) {
                        menu.style.display = 'none';
                        dropdown.classList.remove('show');
                        const box = dropdown.closest('.box-container');
                        if (box) box.classList.remove('expanded-dropdown');
                    }
                }
            });
            const clickedBox = target.closest('.box-container');
            document.querySelectorAll('.box-container.expanded').forEach(expandedBox => {
                if (expandedBox !== clickedBox) {
                    const isToggleButtonOfAnotherCard = target.classList.contains('info-toggle') && target.closest('.box-container') !== expandedBox;
                    if (!isToggleButtonOfAnotherCard) {
                         expandedBox.classList.remove('expanded');
                    }
                } else {
                    if (!target.closest('.info-toggle') && !target.closest('.dropdown')) {
                        // Intentionally do nothing to keep it open if click is inside expanded content
                    }
                }
            });
        }
    });

    if (sideMenu) {
        sideMenu.addEventListener('click', (event) => event.stopPropagation());
    }
    if (searchInput) {
        searchInput.addEventListener('click', (event) => event.stopPropagation());
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

            if (productWrapper) { 
                let resizeTimeoutForCards; 
                window.addEventListener('resize', () => { 
                    clearTimeout(resizeTimeoutForCards);
                    if (window.innerWidth > 600) { 
                        resizeTimeoutForCards = setTimeout(equalizeInitialCardHeights, 250); 
                    } else {
                    }
                }); 
            } 
   }); 
