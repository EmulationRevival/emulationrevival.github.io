// searchlogic.js
// Revised to work with absolute paths in searchData.js for 'page' and 'icon' properties,
// and to correctly compare full pathnames for same-page vs. cross-page logic.

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
        autocompleteResults = document.createElement('div');
        autocompleteResults.id = 'autocompleteResults';
        autocompleteResults.classList.add('autocomplete-items');
        searchBarContainer.appendChild(autocompleteResults);
    }
    autocompleteResults.style.display = 'none';

    if (typeof searchEntries === 'undefined') {
        console.error('Search data (searchEntries) is not loaded! Make sure searchData.js is included before searchlogic.js and uses absolute paths for "page" and "icon".');
        return;
    }

    // --- Helper Function for Highlighting and Scrolling ---
    function applyHighlightAndScroll(elementId) {
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetElement.classList.add('highlighted-by-search');
            setTimeout(() => {
                targetElement.classList.remove('highlighted-by-search');
            }, 2500);
        }
    }

    // --- Check URL Hash on Page Load ---
    const currentPathForHashCheck = window.location.pathname; // Use full pathname
    if (window.location.hash) {
        const targetIdFromHash = window.location.hash.substring(1);
        // Compare against full 'page' path from searchEntries
        const entryForHash = searchEntries.find(entry => entry.id === targetIdFromHash && entry.page === currentPathForHashCheck);
        if (entryForHash) {
            setTimeout(() => {
                applyHighlightAndScroll(targetIdFromHash);
            }, 100);
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
            return entry.name.toLowerCase().includes(query);
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
                // Assumes entry.icon in searchData.js is now an absolute path like "/images/icon.png"
                suggestionItem.innerHTML = `
                    <img src="${entry.icon}" alt="${entry.name}" class="suggestion-logo">
                    <span class="suggestion-name">${entry.name}</span>
                `;

                // --- Suggestion Click Handler (inside input event) ---
                suggestionItem.addEventListener('click', () => {
                    const targetPage = entry.page; // This is now an absolute path (e.g., "/emulators.html")
                    const targetId = entry.id;
                    const targetUrl = `${targetPage}#${targetId}`; // Correctly forms an absolute URL path
                    const currentFullPath = window.location.pathname; // Use full pathname

                    if (currentFullPath === targetPage) { // Compare full paths
                        window.location.hash = targetId;
                        applyHighlightAndScroll(targetId);
                    } else {
                        window.location.href = targetUrl; // Navigates correctly using absolute path
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
            let navigatedTargetPage = null; // Will be an absolute path from searchData.js

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                firstSuggestion.click();
            } else if (this.value.trim() !== '') {
                const queryFromInput = this.value.toLowerCase().trim();
                const directMatch = searchEntries.find(entry => entry.name.toLowerCase() === queryFromInput);

                if (directMatch) {
                    navigatedTargetPage = directMatch.page; // Absolute path
                    navigatedTargetId = directMatch.id;
                } else {
                    let currentFilteredEntries = searchEntries.filter(entry => entry.name.toLowerCase().includes(queryFromInput));
                    if (currentFilteredEntries.length > 0) {
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
                        navigatedTargetPage = firstEntry.page; // Absolute path
                        navigatedTargetId = firstEntry.id;
                    }
                }

                if (navigatedTargetId && navigatedTargetPage) {
                    const targetUrl = `${navigatedTargetPage}#${navigatedTargetId}`; // Correctly forms absolute URL path
                    const currentFullPath = window.location.pathname; // Use full pathname

                    if (currentFullPath === navigatedTargetPage) { // Compare full paths
                        window.location.hash = navigatedTargetId;
                        applyHighlightAndScroll(navigatedTargetId);
                    } else {
                        window.location.href = targetUrl; // Navigates correctly
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
            }
        } else if (event.key === 'Escape') {
             autocompleteResults.innerHTML = '';
             autocompleteResults.style.display = 'none';
        }
    });
});
            
