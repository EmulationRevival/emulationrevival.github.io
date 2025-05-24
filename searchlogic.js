// searchlogic.js
// Based on YOUR working version, with minimal targeted changes for scroll and focus.

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
        // console.error('Search data (searchEntries) is not loaded! Make sure searchData.js is included before searchlogic.js and uses absolute paths for "page" and "icon".');
        return;
    }

    // --- Helper Function for Highlighting and Scrolling ---
    function applyHighlightAndScroll(elementId) {
        if (!elementId) return; // Added safety
        const targetElement = document.getElementById(elementId);

        // Remove existing highlights (if any, from your previous structure logic)
        const highlightedElements = document.querySelectorAll('.highlighted-by-search');
        highlightedElements.forEach(el => el.classList.remove('highlighted-by-search'));

        if (targetElement) {
            // MODIFICATION 1: Scroll with offset for fixed top bar
            const topBar = document.querySelector('.top-bar');
            const topBarHeight = topBar ? topBar.offsetHeight : 0;
            const elementRect = targetElement.getBoundingClientRect();
            const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
            const desiredMarginFromTopBar = 20; // Adjust as needed
            
            let scrollToPosition = elementTopRelativeToDocument - topBarHeight - desiredMarginFromTopBar;
            if (scrollToPosition < 0) scrollToPosition = 0;

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
            // END MODIFICATION 1

            targetElement.classList.add('highlighted-by-search');
            
            // MODIFICATION 2: Focus management
            if (searchInput) {
                searchInput.blur();
            }
            // END MODIFICATION 2
            
            // Original logic for temporary highlight removal
            setTimeout(() => {
                targetElement.classList.remove('highlighted-by-search');
            }, 2500);
        }
    }

    // --- Check URL Hash on Page Load ---
    const currentPathForHashCheck = window.location.pathname; 
    if (window.location.hash) {
        const targetIdFromHash = window.location.hash.substring(1);
        const entryForHash = searchEntries.find(entry => entry.id === targetIdFromHash && entry.page === currentPathForHashCheck);
        if (entryForHash) {
            // MODIFICATION 3: Add delay for stability
            setTimeout(() => {
                applyHighlightAndScroll(targetIdFromHash);
            }, 300); // Adjust delay if needed
            // END MODIFICATION 3
        }
    }

    // --- Input Event Handler ---
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        autocompleteResults.innerHTML = '';

        if (query.length === 0) {
            autocompleteResults.style.display = 'none';
            return;
        }

        let filteredEntries = searchEntries.filter(entry => {
            // Using entry.name as per your provided working script
            return entry.name && entry.name.toLowerCase().includes(query);
        });

        if (filteredEntries.length > 0) {
            filteredEntries.sort((a, b) => {
                const aNameLower = a.name.toLowerCase();
                const bNameLower = b.name.toLowerCase();
                const aStartsWithQuery = aNameLower.startsWith(query);
                const bStartsWithQuery = bNameLower.startsWith(query);
                if (aStartsWithQuery && !bStartsWithQuery) return -1;
                if (!aStartsWithQuery && bStartsWithQuery) return 1;
                if (aNameLower < bNameLower) return -1;
                if (aNameLower > bNameLower) return 1;
                return 0;
            });
        }

        if (filteredEntries.length > 0) {
            autocompleteResults.style.display = 'block';
            filteredEntries.forEach(entry => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('autocomplete-suggestion');
                suggestionItem.innerHTML = `
                    <img src="${entry.icon}" alt="${entry.name}" class="suggestion-logo">
                    <span class="suggestion-name">${entry.name}</span>
                `;

                // --- Suggestion Click Handler (inside input event) ---
                suggestionItem.addEventListener('click', () => {
                    const targetPage = entry.page; 
                    const targetId = entry.id;
                    const targetUrl = `${targetPage}#${targetId}`; 
                    const currentFullPath = window.location.pathname; 

                    if (currentFullPath === targetPage) { 
                        if (window.location.hash !== `#${targetId}`) { // Prevent re-adding same hash
                            window.location.hash = targetId;
                        }
                        applyHighlightAndScroll(targetId); // Ensure scroll/highlight
                    } else {
                        window.location.href = targetUrl; 
                    }

                    searchInput.value = '';
                    autocompleteResults.innerHTML = '';
                    autocompleteResults.style.display = 'none';

                    if (searchBarContainer.classList.contains('search-bar-visible')) {
                        if (typeof toggleSearch === 'function') {
                            toggleSearch();
                        } else {
                            searchBarContainer.classList.remove('search-bar-visible');
                        }
                    }
                });
                autocompleteResults.appendChild(suggestionItem);
            });
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    // --- Focus Event Handler ---
    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length > 0) {
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // --- Keydown Event Handler (for Enter and Escape) ---
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const firstSuggestion = autocompleteResults.querySelector('.autocomplete-suggestion');
            let navigated = false;
            let navigatedTargetId = null;
            let navigatedTargetPage = null;

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                // Simulate click on the first suggestion if suggestions are visible
                // This assumes you want to navigate to the first visible suggestion
                // To make it use arrow-key selected one, you'd need to track activeSuggestionIndex
                firstSuggestion.click(); 
                // Note: The click handler above will set navigated = true if it finds entry.id and entry.page
                // However, the 'navigated' variable here isn't directly set by that click()
                // This part might need adjustment if Enter on a non-arrow-selected item is complex
            } else if (this.value.trim() !== '') { // User typed and hit enter
                const queryFromInput = this.value.toLowerCase().trim();
                // Using entry.name as per your script
                const directMatch = searchEntries.find(entry => entry.name && entry.name.toLowerCase() === queryFromInput);

                if (directMatch) {
                    navigatedTargetPage = directMatch.page; 
                    navigatedTargetId = directMatch.id;
                } else {
                    // Fallback to first filtered entry if no direct exact match
                    let currentFilteredEntries = searchEntries.filter(entry => entry.name && entry.name.toLowerCase().includes(queryFromInput));
                    if (currentFilteredEntries.length > 0) {
                        // Sort them as in the input handler to get the "best" first match
                        currentFilteredEntries.sort((a, b) => {
                            const aNameLower = a.name.toLowerCase();
                            const bNameLower = b.name.toLowerCase();
                            const aStartsWithQuery = aNameLower.startsWith(queryFromInput);
                            const bStartsWithQuery = bNameLower.startsWith(queryFromInput);
                            if (aStartsWithQuery && !bStartsWithQuery) return -1;
                            if (!aStartsWithQuery && bStartsWithQuery) return 1;
                            if (aNameLower < bNameLower) return -1;
                            if (aNameLower > bNameLower) return 1;
                            return 0;
                        });
                        const firstEntry = currentFilteredEntries[0];
                        navigatedTargetPage = firstEntry.page; 
                        navigatedTargetId = firstEntry.id;
                    }
                }

                if (navigatedTargetId && navigatedTargetPage) {
                    const targetUrl = `${navigatedTargetPage}#${navigatedTargetId}`;
                    const currentFullPath = window.location.pathname;

                    if (currentFullPath === navigatedTargetPage) {
                        if (window.location.hash !== `#${navigatedTargetId}`) {
                           window.location.hash = navigatedTargetId;
                        }
                        applyHighlightAndScroll(navigatedTargetId);
                    } else {
                        window.location.href = targetUrl;
                    }
                    navigated = true;
                }

                if (navigated) {
                    this.value = '';
                }
                autocompleteResults.innerHTML = '';
                autocompleteResults.style.display = 'none';

                if (navigated && searchBarContainer.classList.contains('search-bar-visible')) {
                    if (typeof toggleSearch === 'function') {
                        toggleSearch();
                    } else {
                        searchBarContainer.classList.remove('search-bar-visible');
                    }
                }
            } else if (searchBarContainer.classList.contains('search-bar-visible')) {
                // If enter is pressed with an empty field, just close the search bar
                if (typeof toggleSearch === 'function') { toggleSearch(); }
            }
        } else if (event.key === 'Escape') {
             autocompleteResults.innerHTML = '';
             autocompleteResults.style.display = 'none';
             // Optionally also close the search bar itself if it's open:
             // if (searchBarContainer.classList.contains('search-bar-visible')) {
             //    if (typeof toggleSearch === 'function') { toggleSearch(); }
             // }
        }
    });
});
