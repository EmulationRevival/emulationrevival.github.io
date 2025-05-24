// searchlogic.js
// Based on YOUR working version, with redundancies removed when toggleSearch is called.

document.addEventListener('DOMContentLoaded', () => {
    const searchBarContainer = document.getElementById('searchBar');


    // --- Suggestion Click Handler (inside input event) ---
    suggestionItem.addEventListener('click', () => {
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

    searchInput.value = '';
    autocompleteResults.innerHTML = '';
    autocompleteResults.style.display = 'none';


        if (searchBarContainer.classList.contains('search-bar-visible')) {
            if (typeof toggleSearch === 'function') {
                toggleSearch(); // This should handle clearing input and hiding autocomplete
            } else {
                // Fallback if toggleSearch is not defined (keep cleanup here for safety)
                searchInput.value = '';
                autocompleteResults.innerHTML = '';
                autocompleteResults.style.display = 'none';
                searchBarContainer.classList.remove('search-bar-visible');
            }
        }
    });
    autocompleteResults.appendChild(suggestionItem);
    // ... (rest of input event handler) ...

    // --- Focus Event Handler ---
    // ... (Focus event handler remains the same) ...

    // --- Keydown Event Handler (for Enter and Escape) ---
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const firstSuggestion = autocompleteResults.querySelector('.autocomplete-suggestion');
            let navigated = false;
            let navigatedTargetId = null;
            let navigatedTargetPage = null;

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                firstSuggestion.click(); // The click handler above will manage UI reset via toggleSearch
                navigated = true; // Assuming click() always implies navigation for this logic path.
                                  // Note: 'navigated' here is for the Enter key's own flow control.
                                  // The actual navigation and toggleSearch call happens within the click handler.
            } else if (this.value.trim() !== '') {
                const queryFromInput = this.value.toLowerCase().trim();
                const directMatch = searchEntries.find(entry => entry.name && entry.name.toLowerCase() === queryFromInput);

                if (directMatch) {
                    navigatedTargetPage = directMatch.page;
                    navigatedTargetId = directMatch.id;
                } else {
                    let currentFilteredEntries = searchEntries.filter(entry => entry.name && entry.name.toLowerCase().includes(queryFromInput));
                    if (currentFilteredEntries.length > 0) {
                        currentFilteredEntries.sort(/* ... sort logic ... */);
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

                // If navigation did not occur via a suggestion click,
                // but Enter was pressed on a query (navigated might be true or false from direct input logic)
                if (!navigated && autocompleteResults.style.display === 'block') {
                    // If user pressed Enter on a query that didn't lead to navigation,
                    // just hide the suggestions. Don't necessarily close the search bar.
                    autocompleteResults.innerHTML = '';
                    autocompleteResults.style.display = 'none';
                }
            }

            // Handle closing search bar if navigation occurred OR if Enter pressed on empty field
            if (navigated) {
                // If navigation occurred (either by simulating click or direct Enter logic)
                // and search bar is visible, toggleSearch should handle cleanup.
                if (searchBarContainer.classList.contains('search-bar-visible')) {
                    if (typeof toggleSearch === 'function') {
                        // toggleSearch() is expected to be called already if firstSuggestion.click() was triggered.
                        // If navigation happened via direct input (not suggestion click), call toggleSearch here.
                        // To avoid double calls if firstSuggestion.click() happened, this condition could be more specific,
                        // but toggleSearch is idempotent for closing.
                        if (!firstSuggestion) { // Only call if not already called by simulated click
                           toggleSearch();
                        }
                    } else {
                        // Fallback if toggleSearch is not available
                        this.value = ''; // Redundant if toggleSearch called by click
                        autocompleteResults.innerHTML = ''; // Redundant
                        autocompleteResults.style.display = 'none'; // Redundant
                        searchBarContainer.classList.remove('search-bar-visible');
                    }
                } else if (!searchBarContainer.classList.contains('search-bar-visible') && navigated) {
                    // If search bar wasn't visible but navigation happened (programmatic?), ensure input is clear.
                    // This is a less common path for user-triggered Enter.
                    this.value = '';
                    autocompleteResults.innerHTML = '';
                    autocompleteResults.style.display = 'none';
                }
            } else if (this.value.trim() === '' && searchBarContainer.classList.contains('search-bar-visible')) {
                // If enter is pressed with an empty field in a visible search bar, close it.
                if (typeof toggleSearch === 'function') {
                    toggleSearch();
                }
            }
            // If navigated is false and input was not empty, autocomplete already hidden above.

        } else if (event.key === 'Escape') {
             autocompleteResults.innerHTML = ''; // Keep this: user escapes from suggestions
             autocompleteResults.style.display = 'none'; // Keep this
             // Optional: if (this.value.trim() === '') { toggleSearch(); } // Close search bar if input is empty on Esc
        }
    });
});
