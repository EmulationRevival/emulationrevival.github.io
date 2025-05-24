// searchlogic.js

document.addEventListener('DOMContentLoaded', () => {
    const searchBarContainer = document.getElementById('searchBar');
    if (!searchBarContainer) {
        console.error('Search bar container (div with id="searchBar") not found.');
        return;
    }

    const searchInput = searchBarContainer.querySelector('input[type="text"]');
    if (!searchInput) {
        console.error('Search input field (input type="text" inside div id="searchBar") not found.');
        return;
    }

    let autocompleteResults = document.getElementById('autocompleteResults');
    if (!autocompleteResults) {
        // This was in your original file to create the div if it doesn't exist
        autocompleteResults = document.createElement('div');
        autocompleteResults.id = 'autocompleteResults';
        autocompleteResults.classList.add('autocomplete-items');
        searchBarContainer.appendChild(autocompleteResults);
    }
    autocompleteResults.style.display = 'none';

    if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries)) {
        console.error('Search data (searchEntries) is not loaded or not an array! Make sure searchData.js is included before searchlogic.js.');
        return;
    }

    let currentHighlight = null;
    let activeSuggestionIndex = -1; // As in your original file

    // --- Helper Function for Highlighting and Scrolling (TARGETED MODIFICATIONS) ---
    function applyHighlightAndScroll(elementId) {
        if (!elementId) {
            console.warn("applyHighlightAndScroll called with no elementId");
            return;
        }
        const targetElement = document.getElementById(elementId);

        if (currentHighlight && currentHighlight !== targetElement) {
            currentHighlight.classList.remove('highlighted-by-search');
        }

        if (targetElement) {
            const topBar = document.querySelector('.top-bar'); // Assuming your top bar has class 'top-bar'
            const topBarHeight = topBar ? topBar.offsetHeight : 0;
            const elementRect = targetElement.getBoundingClientRect();
            const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
            const desiredMarginFromTopBar = 20; // Adjust this for desired spacing below the top bar
            
            let scrollToPosition = elementTopRelativeToDocument - topBarHeight - desiredMarginFromTopBar;
            if (scrollToPosition < 0) {
                scrollToPosition = 0; // Prevent scrolling to a negative position
            }

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });

            targetElement.classList.add('highlighted-by-search');
            currentHighlight = targetElement;

            if (searchInput) {
                searchInput.blur(); // Remove focus from the search input
            }
            // Optional: Consider focusing the targetElement if blurring searchInput isn't enough.
            // targetElement.focus({ preventScroll: true }); 
            // (If you use this, ensure targetElement can receive focus, e.g., with tabindex="-1")
        } else {
            // console.warn(`Element with ID '${elementId}' not found for highlight/scroll.`);
        }
    }

    // --- Handle Hash on Page Load (from original, with added delay) ---
    function handleHashOnLoad() {
        if (window.location.hash) {
            const elementId = window.location.hash.substring(1); // Remove #
            if (elementId) {
                setTimeout(() => {
                    applyHighlightAndScroll(elementId);
                }, 300); // Delay to allow layout to stabilize, adjust if needed
            }
        }
    }
    // Ensure DOM is fully ready before trying to access hash or elements
    // This check is good practice.
    if (document.readyState === "complete" || document.readyState === "interactive") {
        handleHashOnLoad();
    } else {
        document.addEventListener("DOMContentLoaded", handleHashOnLoad);
    }

    // --- Event Listener for Search Input (Copied from your searchlogic.txt) ---
    searchInput.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim(); // Your original had toLowerCase().trim()
        autocompleteResults.innerHTML = '';
        activeSuggestionIndex = -1; // Reset active index

        if (!value) {
            autocompleteResults.style.display = 'none';
            return;
        }

        const filteredEntries = searchEntries.filter(entry =>
            (entry.title && entry.title.toLowerCase().includes(value)) ||
            (entry.keywords && entry.keywords.toLowerCase().includes(value))
        ).slice(0, 5); // Limit to 5 results as per your original

        if (filteredEntries.length > 0) {
            filteredEntries.forEach(entry => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('autocomplete-suggestion');
                
                let iconHtml = '';
                if (entry.icon) { // Assuming icon path is correctly formed in searchData.js
                    iconHtml = `<img src="${entry.icon}" class="autocomplete-icon" alt="${entry.title} icon">`;
                }
                
                const pageNameHtml = entry.pageName ? `<span class="autocomplete-page-hint">${entry.pageName}</span>` : '';
                itemDiv.innerHTML = `${iconHtml}<span class="autocomplete-text">${entry.title}</span>${pageNameHtml}`;

                itemDiv.addEventListener('click', function() {
                    const navigatedTargetId = entry.id;
                    const navigatedTargetPage = entry.page; // page path from searchData.js
                    const targetUrl = `${navigatedTargetPage}#${navigatedTargetId}`;
                    const currentFullPath = window.location.pathname;

                    if (currentFullPath === navigatedTargetPage) {
                        window.location.hash = navigatedTargetId;
                        applyHighlightAndScroll(navigatedTargetId);
                    } else {
                        window.location.href = targetUrl;
                    }

                    // Logic from your original file to clear and close search after click
                    searchInput.value = '';
                    autocompleteResults.innerHTML = '';
                    autocompleteResults.style.display = 'none';
                    activeSuggestionIndex = -1;
                    if (searchBarContainer.classList.contains('search-bar-visible')) {
                        if (typeof toggleSearch === 'function') {
                            toggleSearch(); // Call from main.js
                        } else {
                            searchBarContainer.classList.remove('search-bar-visible');
                        }
                    }
                });
                autocompleteResults.appendChild(itemDiv);
            });
            autocompleteResults.style.display = 'block';
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    // --- Keyboard Navigation (Copied from your searchlogic.txt) ---
    function updateActiveSuggestion(suggestions, index) { // Original helper
        suggestions.forEach((suggestion, i) => {
            if (i === index) {
                suggestion.classList.add('autocomplete-active');
            } else {
                suggestion.classList.remove('autocomplete-active');
            }
        });
    }

    searchInput.addEventListener('keydown', function(event) {
        const suggestions = autocompleteResults.querySelectorAll('.autocomplete-suggestion');
        let navigated = false; // From original

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (suggestions.length > 0) {
                activeSuggestionIndex++;
                if (activeSuggestionIndex >= suggestions.length) activeSuggestionIndex = 0;
                updateActiveSuggestion(suggestions, activeSuggestionIndex);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (suggestions.length > 0) {
                activeSuggestionIndex--;
                if (activeSuggestionIndex < 0) activeSuggestionIndex = suggestions.length - 1;
                updateActiveSuggestion(suggestions, activeSuggestionIndex);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            let navigatedTargetId = null;
            let navigatedTargetPage = null;

            if (activeSuggestionIndex > -1 && suggestions[activeSuggestionIndex]) {
                // Find the entry corresponding to the active suggestion to get its page and id
                // This part needs to safely get the original entry data
                const activeText = suggestions[activeSuggestionIndex].querySelector('.autocomplete-text').textContent;
                const activeEntry = searchEntries.find(e => e.title === activeText); // Assuming title is unique enough for this
                if (activeEntry) {
                    navigatedTargetId = activeEntry.id;
                    navigatedTargetPage = activeEntry.page;
                }
            } else if (this.value.trim() !== "") { // If user typed text and hit enter
                const value = this.value.toLowerCase().trim();
                const firstEntry = searchEntries.find(entry =>
                    (entry.title && entry.title.toLowerCase().includes(value)) ||
                    (entry.keywords && entry.keywords.toLowerCase().includes(value))
                );
                if (firstEntry) {
                    navigatedTargetId = firstEntry.id;
                    navigatedTargetPage = firstEntry.page;
                }
            }

            if (navigatedTargetId && navigatedTargetPage) {
                const targetUrl = `${navigatedTargetPage}#${navigatedTargetId}`;
                const currentFullPath = window.location.pathname;

                if (currentFullPath === navigatedTargetPage) {
                    window.location.hash = navigatedTargetId;
                    applyHighlightAndScroll(navigatedTargetId);
                } else {
                    window.location.href = targetUrl;
                }
                navigated = true;
            }

            if (navigated) { // From original logic
                this.value = ''; // Clear search input
            }
            // Common cleanup for Enter key, whether navigated or not (if suggestions were shown)
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
            activeSuggestionIndex = -1;

            if (navigated && searchBarContainer.classList.contains('search-bar-visible')) {
                if (typeof toggleSearch === 'function') {
                    toggleSearch();
                } else {
                    searchBarContainer.classList.remove('search-bar-visible');
                }
            } else if (!navigated && this.value.trim() === "" && searchBarContainer.classList.contains('search-bar-visible')) {
                // If enter pressed with empty field, also close search bar
                 if (typeof toggleSearch === 'function') { toggleSearch(); }
            }


        } else if (event.key === 'Escape') {
            event.preventDefault(); // Added preventDefault
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
            activeSuggestionIndex = -1;
        }
    });

});
