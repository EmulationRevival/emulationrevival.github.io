// searchlogic.js
document.addEventListener('DOMContentLoaded', () => {
    const searchBarContainer = document.getElementById('searchBar');
    if (!searchBarContainer) {
        // console.error('Search bar container (div with id="searchBar") not found.');
        return;
    }

    const searchInput = searchBarContainer.querySelector('input[type="text"]');
    if (!searchInput) {
        // console.error('Search input field (input type="text" inside div id="searchBar") not found.');
        return;
    }

    let autocompleteResults = document.getElementById('autocompleteResults');
    if (!autocompleteResults) {
        autocompleteResults = document.createElement('div');
        autocompleteResults.id = 'autocompleteResults';
        autocompleteResults.classList.add('autocomplete-items');
        searchBarContainer.appendChild(autocompleteResults);
    }
    autocompleteResults.style.display = 'none';

    if (typeof searchEntries === 'undefined') {
        // console.error('Search data (searchEntries) is not loaded!');
        return;
    }

    let currentHighlight = null;

    // --- Helper Function to Close Search Bar and Clear Input ---
    function closeSearchBarAndClearInput(clearInput = true) {
        if (clearInput) {
            searchInput.value = '';
        }
        autocompleteResults.innerHTML = '';
        autocompleteResults.style.display = 'none';

        // Ensure toggleSearch (from main.js) is available and called
        if (searchBarContainer.classList.contains('search-bar-visible')) {
            if (typeof toggleSearch === 'function') {
                toggleSearch(); // This should handle toggling the class and focusing if needed
            } else {
                searchBarContainer.classList.remove('search-bar-visible'); // Fallback
            }
        }
    }

    // --- Helper Function for Highlighting and Scrolling (MODIFIED) ---
    function applyHighlightAndScroll(elementId) {
        const targetElement = document.getElementById(elementId);

        if (currentHighlight) {
            currentHighlight.classList.remove('highlighted-by-search');
        }

        if (targetElement) {
            // Scroll into view with offset for fixed header
            const topBar = document.querySelector('.top-bar');
            const topBarHeight = topBar ? topBar.offsetHeight : 0; // Default to 0 if not found
            const elementRect = targetElement.getBoundingClientRect();
            const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
            const desiredMarginFromTopBar = 20; // Space between top bar and highlighted element
            
            // Ensure scrollToPosition is not negative if element is already near top
            let scrollToPosition = elementTopRelativeToDocument - topBarHeight - desiredMarginFromTopBar;
            if (scrollToPosition < 0) scrollToPosition = 0;


            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });

            // Apply highlight after a short delay to allow scroll to start/finish
            // This can sometimes help with visual consistency.
            setTimeout(() => {
                targetElement.classList.add('highlighted-by-search');
                currentHighlight = targetElement;

                // Focus management to potentially help with page drifting
                if (searchInput) {
                    searchInput.blur(); // Remove focus from search input
                }
                // Optionally, focus the target element itself, but prevent additional scrolling.
                // targetElement.focus({ preventScroll: true }); 
                // Be cautious with this if the element isn't naturally focusable or if it causes other issues.
                // Sometimes, just blurring the input is enough.
            }, 150); // Adjust delay if needed, or remove setTimeout if direct highlight is preferred.

        } else {
            // console.warn(`Element with ID '${elementId}' not found for highlighting.`);
        }
    }

    // --- Handle Hash on Page Load ---
    function handleHashOnLoad() {
        if (window.location.hash) {
            const elementId = window.location.hash.substring(1);
            if (elementId) {
                // Delay slightly to ensure page layout is stable, especially if images are loading
                setTimeout(() => {
                    applyHighlightAndScroll(elementId);
                }, 250); // Adjust delay if necessary
            }
        }
    }
    handleHashOnLoad(); // Call on initial load

    // --- Event Listener for Search Input ---
    searchInput.addEventListener('input', function () {
        const value = this.value;
        autocompleteResults.innerHTML = '';
        if (!value) {
            autocompleteResults.style.display = 'none';
            return;
        }

        const filteredEntries = searchEntries.filter(entry =>
            entry.title.toLowerCase().includes(value.toLowerCase()) ||
            (entry.keywords && entry.keywords.toLowerCase().includes(value.toLowerCase()))
        ).slice(0, 5); // Limit to 5 results

        if (filteredEntries.length > 0) {
            filteredEntries.forEach(entry => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('autocomplete-suggestion');
                
                let iconHtml = '';
                if (entry.icon) { // icon path should be absolute or correctly relative from root
                    const iconSrc = entry.icon.startsWith('/') ? entry.icon : `/${entry.icon}`;
                    iconHtml = `<img src="${iconSrc}" class="autocomplete-icon" alt="${entry.title} icon">`;
                }

                itemDiv.innerHTML = `${iconHtml}<span class="autocomplete-text">${entry.title}</span><span class="autocomplete-page-hint">${entry.pageName || ''}</span>`;
                itemDiv.addEventListener('click', function () {
                    // Determine target: entry.id should be the ID of the element on the page
                    const targetId = entry.id; 
                    const targetPage = entry.page.startsWith('/') ? entry.page : `/${entry.page}`; // Ensure absolute path

                    const currentFullPath = window.location.pathname;

                    if (currentFullPath === targetPage) {
                        window.location.hash = targetId; // This will trigger hashchange or be caught by manual call
                        applyHighlightAndScroll(targetId); // Scroll and highlight on same page
                    } else {
                        window.location.href = `${targetPage}#${targetId}`; // Navigate to different page
                    }
                    closeSearchBarAndClearInput();
                });
                autocompleteResults.appendChild(itemDiv);
            });
            autocompleteResults.style.display = 'block';
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    // --- Keyboard Navigation for Autocomplete and Enter Key ---
    searchInput.addEventListener('keydown', function (event) {
        const items = autocompleteResults.querySelectorAll('.autocomplete-suggestion');
        let currentFocus = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('autocomplete-active')) {
                currentFocus = index;
            }
        });

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (currentFocus > -1 && items[currentFocus]) {
                items[currentFocus].click(); // Simulate click on the active item
            } else if (items.length > 0) {
                // If no item is actively focused via keyboard but results exist,
                // navigate to the first one (optional behavior)
                // items[0].click(); 
            }
             closeSearchBarAndClearInput(false); // Don't clear input yet, click handler will
        } else if (event.key === 'Escape') {
            closeSearchBarAndClearInput();
        }

        function addActive(items) {
            if (!items || items.length === 0) return false;
            removeActive(items);
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = items.length - 1;
            items[currentFocus].classList.add('autocomplete-active');
        }

        function removeActive(items) {
            items.forEach(item => item.classList.remove('autocomplete-active'));
        }
    });

    // Hide autocomplete if clicking outside the search bar or results
    // This is already handled by the global click listener in main.js now,
    // so this specific document click listener might be redundant if main.js handles it.
    // However, let's keep a specific one for search for now, ensuring it plays nice.
    document.addEventListener('click', function(event) {
        if (autocompleteResults.style.display === 'block') {
            if (!searchBarContainer.contains(event.target) && !autocompleteResults.contains(event.target)) {
                autocompleteResults.innerHTML = '';
                autocompleteResults.style.display = 'none';
            }
        }
    });
});
