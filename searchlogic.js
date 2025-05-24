// searchlogic.js - WITH COMPREHENSIVE CONSOLE LOGS FOR DEBUGGING
document.addEventListener('DOMContentLoaded', () => {
    console.log('[searchlogic.js] DOMContentLoaded event fired.'); // LOG 1

    const searchBarContainer = document.getElementById('searchBar');
    if (!searchBarContainer) {
        console.error('[searchlogic.js] CRITICAL: searchBarContainer (div with id="searchBar") not found.');
        return;
    }
    console.log('[searchlogic.js] searchBarContainer found:', searchBarContainer); // LOG 2

    const searchInput = searchBarContainer.querySelector('input[type="text"]');
    if (!searchInput) {
        console.error('[searchlogic.js] CRITICAL: searchInput (input[type="text"]) not found inside searchBarContainer.');
        return;
    }
    console.log('[searchlogic.js] searchInput found:', searchInput); // LOG 3

    let autocompleteResults = document.getElementById('autocompleteResults');
    if (!autocompleteResults) {
        console.log('[searchlogic.js] autocompleteResults div not found in HTML, creating it dynamically.');
        autocompleteResults = document.createElement('div');
        autocompleteResults.id = 'autocompleteResults';
        autocompleteResults.classList.add('autocomplete-items');
        searchBarContainer.appendChild(autocompleteResults);
    } else {
        console.log('[searchlogic.js] autocompleteResults div found in HTML:', autocompleteResults);
    }
    autocompleteResults.style.display = 'none'; // Ensure it's hidden initially

    if (typeof searchEntries === 'undefined') {
        console.error('[searchlogic.js] CRITICAL: searchEntries is undefined! Make sure searchData.js is loaded before searchlogic.js and defines searchEntries.');
        return;
    }
    console.log('[searchlogic.js] searchEntries type:', typeof searchEntries, 'Length:', searchEntries ? searchEntries.length : 'N/A'); // LOG 4

    // --- Helper Function for Highlighting and Scrolling ---
    // (This function is assumed to be working, no logs added here for now unless suspected)
    function applyHighlightAndScroll(elementId) {
        if (!elementId) return;
        const targetElement = document.getElementById(elementId);
        const highlightedElements = document.querySelectorAll('.highlighted-by-search');
        highlightedElements.forEach(el => el.classList.remove('highlighted-by-search'));
        if (targetElement) {
            const topBar = document.querySelector('.top-bar');
            const topBarHeight = topBar ? topBar.offsetHeight : 0;
            const elementRect = targetElement.getBoundingClientRect();
            const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
            const desiredMarginFromTopBar = 20;
            let scrollToPosition = elementTopRelativeToDocument - topBarHeight - desiredMarginFromTopBar;
            if (scrollToPosition < 0) scrollToPosition = 0;
            window.scrollTo({ top: scrollToPosition, behavior: 'smooth' });
            targetElement.classList.add('highlighted-by-search');
            if (searchInput) {
                searchInput.blur();
            }
            setTimeout(() => {
                targetElement.classList.remove('highlighted-by-search');
            }, 2500);
        }
    }

    // --- Check URL Hash on Page Load ---
    const currentPathForHashCheck = window.location.pathname;
    if (window.location.hash) {
        console.log('[searchlogic.js] Hash found on page load:', window.location.hash);
        const targetIdFromHash = window.location.hash.substring(1);
        const entryForHash = searchEntries.find(entry => entry.id === targetIdFromHash && entry.page === currentPathForHashCheck);
        if (entryForHash) {
            console.log('[searchlogic.js] Matching entry found for hash. Scrolling after delay.');
            setTimeout(() => {
                applyHighlightAndScroll(targetIdFromHash);
            }, 300);
        } else {
            console.log('[searchlogic.js] No matching entry found for hash.');
        }
    }

    console.log('[searchlogic.js] Attempting to attach event listeners to searchInput...'); // LOG 5
    searchInput.addEventListener('input', function() {
        console.log('>>> [searchlogic.js] SEARCH INPUT EVENT FIRED! Value:', this.value); // LOG 6 - CRITICAL
        console.log('[searchlogic.js] Inside input listener - Is searchBarContainer visible?', searchBarContainer.classList.contains('search-bar-visible'));

        if (typeof searchEntries === 'undefined') { // Re-check, just in case
            console.error('[searchlogic.js] Inside input listener - CRITICAL: searchEntries is undefined!');
            return;
        }
        console.log('[searchlogic.js] Inside input listener - searchEntries length:', searchEntries.length);

        const query = this.value.toLowerCase().trim();
        console.log('[searchlogic.js] Inside input listener - Query:', query);
        autocompleteResults.innerHTML = ''; // Clear previous results

        if (query.length === 0) {
            console.log('[searchlogic.js] Inside input listener - Query is empty. Hiding autocomplete.');
            autocompleteResults.style.display = 'none';
            return;
        }

        let filteredEntries = searchEntries.filter(entry => {
            return entry && entry.name && typeof entry.name === 'string' && entry.name.toLowerCase().includes(query);
        });
        console.log('[searchlogic.js] Inside input listener - Filtered entries count:', filteredEntries.length, filteredEntries);

        if (filteredEntries.length > 0) {
            // Sorting logic from your GitHub version
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

            console.log('[searchlogic.js] Inside input listener - Attempting to display autocomplete.');
            autocompleteResults.style.display = 'block';

            // Check computed styles after attempting to set display: block
            setTimeout(() => {
                if (autocompleteResults && document.body.contains(autocompleteResults)) { // Check if still in DOM
                    console.log('[searchlogic.js] Inside input listener - Computed display for autocompleteResults:', window.getComputedStyle(autocompleteResults).display);
                    if (autocompleteResults.parentElement) {
                        console.log('[searchlogic.js] Inside input listener - Parent (searchBarContainer) computed visibility:', window.getComputedStyle(autocompleteResults.parentElement).visibility);
                        console.log('[searchlogic.js] Inside input listener - Parent (searchBarContainer) computed opacity:', window.getComputedStyle(autocompleteResults.parentElement).opacity);
                        console.log('[searchlogic.js] Inside input listener - Parent (searchBarContainer) classes:', autocompleteResults.parentElement.className);
                    } else {
                        console.warn('[searchlogic.js] Inside input listener - autocompleteResults has no parentElement!');
                    }
                } else {
                     console.warn('[searchlogic.js] Inside input listener - autocompleteResults no longer in DOM or null for computed style check.');
                }
            }, 0);

            filteredEntries.forEach(entry => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('autocomplete-suggestion');
                suggestionItem.innerHTML = `
                    <img src="${entry.icon}" alt="${entry.name}" class="suggestion-logo">
                    <span class="suggestion-name">${entry.name}</span>
                `;

                // Using the refactored click handler from your GitHub version
                suggestionItem.addEventListener('click', () => {
                    console.log('[searchlogic.js] Suggestion clicked:', entry.name);
                    const targetPage = entry.page;
                    const targetId = entry.id;
                    const targetUrl = `${targetPage}#${targetId}`;
                    const currentFullPath = window.location.pathname;

                    if (currentFullPath === targetPage) {
                        if (window.location.hash !== `#${targetId}`) {
                            window.location.hash = targetId;
                        }
                        applyHighlightAndScroll(targetId);
                    } else {
                        window.location.href = targetUrl;
                    }

                    // Rely on toggleSearch for cleanup (lines for direct cleanup are commented out as per your GitHub version)
                    if (searchBarContainer.classList.contains('search-bar-visible')) {
                        if (typeof toggleSearch === 'function') {
                            console.log('[searchlogic.js] Calling toggleSearch() from suggestion click.');
                            toggleSearch();
                        } else {
                            console.warn('[searchlogic.js] toggleSearch function not found! Using fallback cleanup.');
                            searchInput.value = '';
                            autocompleteResults.innerHTML = '';
                            autocompleteResults.style.display = 'none';
                            searchBarContainer.classList.remove('search-bar-visible');
                        }
                    }
                });
                autocompleteResults.appendChild(suggestionItem);
            });
            console.log('[searchlogic.js] Inside input listener - Autocomplete populated. InnerHTML length:', autocompleteResults.innerHTML.length);
        } else {
            console.log('[searchlogic.js] Inside input listener - No filtered entries. Hiding autocomplete.');
            autocompleteResults.style.display = 'none';
        }
        console.log('[searchlogic.js] >>> SEARCH INPUT EVENT END <<<');
    });

    searchInput.addEventListener('focus', function() {
        console.log('>>> [searchlogic.js] SEARCH INPUT FOCUS EVENT FIRED!');
        if (this.value.trim().length > 0) {
            // Trigger the input event to re-show suggestions if input already has text on focus
            console.log('[searchlogic.js] Focus event: Triggering input event manually.');
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    searchInput.addEventListener('keydown', function(event) {
        console.log('>>> [searchlogic.js] SEARCH INPUT KEYDOWN EVENT FIRED! Key:', event.key); // LOG 7
        // Using the Enter key logic from your GitHub version
        if (event.key === 'Enter') {
            console.log('[searchlogic.js] Enter key pressed.');
            event.preventDefault();
            const firstSuggestion = autocompleteResults.querySelector('.autocomplete-suggestion');
            let navigated = false;

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                console.log('[searchlogic.js] Enter: Clicking first suggestion.');
                firstSuggestion.click(); // This will call toggleSearch via its own click handler
                // Note: 'navigated' isn't explicitly set to true here in your version,
                // relying on the click handler to manage state.
            } else if (this.value.trim() !== '') {
                console.log('[searchlogic.js] Enter: Processing direct input value.');
                const queryFromInput = this.value.toLowerCase().trim();
                let navigatedTargetId = null;
                let navigatedTargetPage = null;
                const directMatch = searchEntries.find(entry => entry.name && typeof entry.name === 'string' && entry.name.toLowerCase() === queryFromInput);

                if (directMatch) {
                    navigatedTargetPage = directMatch.page;
                    navigatedTargetId = directMatch.id;
                } else {
                    let currentFilteredEntries = searchEntries.filter(entry => entry.name && typeof entry.name === 'string' && entry.name.toLowerCase().includes(queryFromInput));
                    if (currentFilteredEntries.length > 0) {
                        currentFilteredEntries.sort((a, b) => { /* ... sort logic ... */ });
                        const firstEntry = currentFilteredEntries[0];
                        navigatedTargetPage = firstEntry.page;
                        navigatedTargetId = firstEntry.id;
                    }
                }

                if (navigatedTargetId && navigatedTargetPage) {
                    console.log('[searchlogic.js] Enter: Navigating to direct match/first filtered.');
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
                } else {
                    console.log('[searchlogic.js] Enter: No direct navigation target found from input.');
                }
            }

            // This crucial block for hiding autocomplete on non-navigating Enter was missing in the GitHub version.
            // Adding it back based on standard UX and previous discussions.
            if (!navigated && autocompleteResults.style.display === 'block' && this.value.trim() !== '') {
                 console.log('[searchlogic.js] Enter: No navigation occurred, input not empty, hiding autocomplete.');
                 autocompleteResults.innerHTML = '';
                 autocompleteResults.style.display = 'none';
            }


            if (navigated) {
                console.log('[searchlogic.js] Enter: Navigation occurred.');
                if (searchBarContainer.classList.contains('search-bar-visible')) {
                    // The condition '!firstSuggestion' from your GitHub version is kept.
                    // If 'firstSuggestion' was clicked, its handler calls toggleSearch.
                    // If navigation happened directly (not via click), and there was no firstSuggestion (or it wasn't clicked), call toggleSearch.
                    if (!firstSuggestion && typeof toggleSearch === 'function') {
                        console.log('[searchlogic.js] Enter: Calling toggleSearch() because navigated directly.');
                        toggleSearch();
                    } else if (!firstSuggestion) { // Fallback if toggleSearch is not a function
                        console.warn('[searchlogic.js] Enter: toggleSearch function not found! Using fallback cleanup for direct navigation.');
                        this.value = '';
                        autocompleteResults.innerHTML = '';
                        autocompleteResults.style.display = 'none';
                        searchBarContainer.classList.remove('search-bar-visible');
                    } else if (firstSuggestion) {
                        console.log('[searchlogic.js] Enter: Assuming firstSuggestion.click() handled toggleSearch.');
                    }
                }
            } else if (this.value.trim() === '' && searchBarContainer.classList.contains('search-bar-visible')) {
                console.log('[searchlogic.js] Enter: Input is empty, search bar visible. Calling toggleSearch().');
                if (typeof toggleSearch === 'function') {
                    toggleSearch();
                }
            }

        } else if (event.key === 'Escape') {
            console.log('[searchlogic.js] Escape key pressed. Hiding autocomplete.');
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
        }
    });

    console.log('[searchlogic.js] Event listeners should now be attached to searchInput.'); // LOG 8
});
