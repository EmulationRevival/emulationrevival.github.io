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
        // This was in your original searchlogic.txt, ensures autocompleteResults div exists
        autocompleteResults = document.createElement('div');
        autocompleteResults.id = 'autocompleteResults';
        autocompleteResults.classList.add('autocomplete-items');
        searchBarContainer.appendChild(autocompleteResults);
    }
    autocompleteResults.style.display = 'none';

    if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries)) {
        // console.error('Search data (searchEntries) is not loaded or not an array!');
        return;
    }

    let currentHighlight = null; // From original file
    let activeSuggestionIndex = -1; // From original file

    // --- Helper Function for Highlighting and Scrolling (TARGETED MODIFICATIONS) ---
    function applyHighlightAndScroll(elementId) {
        if (!elementId) return;
        const targetElement = document.getElementById(elementId);

        if (currentHighlight && currentHighlight !== targetElement) {
            currentHighlight.classList.remove('highlighted-by-search');
        }

        if (targetElement) {
            // **MODIFICATION 1: Calculate scroll position with offset for fixed top bar**
            const topBar = document.querySelector('.top-bar');
            const topBarHeight = topBar ? topBar.offsetHeight : 0;
            const elementRect = targetElement.getBoundingClientRect();
            const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
            const desiredMarginFromTopBar = 20; // Adjust for spacing
            
            let scrollToPosition = elementTopRelativeToDocument - topBarHeight - desiredMarginFromTopBar;
            if (scrollToPosition < 0) scrollToPosition = 0;

            window.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
            // **END MODIFICATION 1**

            targetElement.classList.add('highlighted-by-search');
            currentHighlight = targetElement;

            // **MODIFICATION 2: Focus management**
            if (searchInput) {
                searchInput.blur(); // Remove focus from search input to help prevent page drift
            }
            // Optional: targetElement.focus({ preventScroll: true });
            // Test if searchInput.blur() alone is sufficient first.
            // **END MODIFICATION 2**

        } else {
            // console.warn(`Element with ID '${elementId}' not found for highlight/scroll.`);
        }
    }

    // --- Function to close search bar and clear (combines original logic) ---
    function closeAndClearSearchAfterNavigation() {
        if (searchInput) {
            searchInput.value = '';
        }
        if (autocompleteResults) {
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
        }
        activeSuggestionIndex = -1; // Reset active suggestion

        if (searchBarContainer.classList.contains('search-bar-visible')) {
            if (typeof toggleSearch === 'function') { // toggleSearch is from main.js
                toggleSearch();
            } else {
                searchBarContainer.classList.remove('search-bar-visible');
            }
        }
    }

    // --- Handle Hash on Page Load (from original, with slight delay for stability) ---
    function handleHashOnLoad() {
        if (window.location.hash) {
            const elementId = window.location.hash.substring(1);
            if (elementId) {
                setTimeout(() => {
                    applyHighlightAndScroll(elementId);
                }, 300); // Delay to allow page layout to stabilize
            }
        }
    }
    // Ensuring DOM is fully ready before trying to access hash or elements
    if (document.readyState === "complete" || document.readyState === "interactive") {
        handleHashOnLoad();
    } else {
        document.addEventListener("DOMContentLoaded", handleHashOnLoad);
    }


    // --- Event Listener for Search Input (Structure from original searchlogic.txt) ---
    searchInput.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase(); // Original uses toLowerCase here
        autocompleteResults.innerHTML = '';
        activeSuggestionIndex = -1; // Reset on new input

        if (!value) {
            autocompleteResults.style.display = 'none';
            return;
        }

        const filteredEntries = searchEntries.filter(entry =>
            (entry && entry.title && entry.title.toLowerCase().includes(value)) ||
            (entry && entry.keywords && entry.keywords.toLowerCase().includes(value))
        ).slice(0, 5);

        if (filteredEntries.length > 0) {
            filteredEntries.forEach(entry => {
                // Assuming entry structure from original: id, page, title, icon, pageName
                if (!entry || !entry.id || !entry.page || !entry.title) { return; } // Skip incomplete entries

                const itemDiv = document.createElement('div');
                itemDiv.classList.add('autocomplete-suggestion');
                
                let iconHtml = '';
                if (entry.icon) {
                    const iconSrc = entry.icon.startsWith('/') ? entry.icon : `/${entry.icon}`;
                    iconHtml = `<img src="${iconSrc}" class="autocomplete-icon" alt="${entry.title} icon">`;
                }
                
                const pageHintText = entry.pageName || '';
                itemDiv.innerHTML = `${iconHtml}<span class="autocomplete-text">${entry.title}</span><span class="autocomplete-page-hint">${pageHintText}</span>`;

                itemDiv.addEventListener('click', function() {
                    const targetId = entry.id;
                    const targetPage = entry.page.startsWith('/') ? entry.page : `/${entry.page}`;
                    const currentFullPath = window.location.pathname; // Original used window.location.pathname

                    // Compare if the target page is the current page.
                    // The original file had slightly different logic for this comparison.
                    // Using endsWith for flexibility with potential trailing slashes or base paths.
                    const onSamePage = currentFullPath.endsWith(targetPage) || (currentFullPath + '/') === targetPage || currentFullPath === targetPage;


                    if (onSamePage) {
                        if (window.location.hash !== `#${targetId}`) { // Avoid re-triggering if hash is already set
                           window.location.hash = targetId;
                        }
                        applyHighlightAndScroll(targetId); // Ensure scroll even if hash doesn't change behavior
                    } else {
                        window.location.href = `${targetPage}#${targetId}`;
                    }
                    closeAndClearSearchAfterNavigation();
                });
                autocompleteResults.appendChild(itemDiv);
            });
            autocompleteResults.style.display = 'block';
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    // --- Keyboard Navigation (Structure from original searchlogic.txt) ---
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
        let navigated = false; // Flag from original

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (suggestions.length > 0) { // Only navigate if there are suggestions
                activeSuggestionIndex++;
                if (activeSuggestionIndex >= suggestions.length) activeSuggestionIndex = 0;
                updateActiveSuggestion(suggestions, activeSuggestionIndex);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (suggestions.length > 0) { // Only navigate if there are suggestions
                activeSuggestionIndex--;
                if (activeSuggestionIndex < 0) activeSuggestionIndex = suggestions.length - 1;
                updateActiveSuggestion(suggestions, activeSuggestionIndex);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (activeSuggestionIndex > -1 && suggestions[activeSuggestionIndex]) {
                suggestions[activeSuggestionIndex].click(); // This will handle navigation and closing
                navigated = true; // From original logic
            } else if (this.value.trim() !== "") { // User hit enter on typed text
                // Original logic: find first match and navigate
                const value = this.value.trim().toLowerCase();
                const firstEntry = searchEntries.find(entry =>
                    (entry.title && entry.title.toLowerCase().includes(value)) ||
                    (entry.keywords && entry.keywords.toLowerCase().includes(value))
                );
                if (firstEntry && firstEntry.id && firstEntry.page) {
                    const targetId = firstEntry.id;
                    const targetPage = firstEntry.page.startsWith('/') ? firstEntry.page : `/${firstEntry.page}`;
                    const currentFullPath = window.location.pathname;
                    const onSamePage = currentFullPath.endsWith(targetPage) || (currentFullPath + '/') === targetPage || currentFullPath === targetPage;

                    if (onSamePage) {
                        if (window.location.hash !== `#${targetId}`) {
                            window.location.hash = targetId;
                        }
                        applyHighlightAndScroll(targetId);
                    } else {
                        window.location.href = `${targetPage}#${targetId}`;
                    }
                    navigated = true; // From original logic
                }
            }
            
            if (navigated) { // This part was in your original enter logic
                // The click handler or direct navigation already calls closeAndClearSearchAfterNavigation
                // So this might be redundant or handled by the simulated click.
                // For safety, ensure search closes if navigation happened.
                closeAndClearSearchAfterNavigation();
            } else if (this.value.trim() === "" || suggestions.length === 0) {
                // If Enter is pressed with no text, or no suggestions, just close.
                closeAndClearSearchAfterNavigation();
            }
            // If Enter is pressed with text but no navigation occurred (e.g. no match from typed text)
            // and suggestions were present but none selected, it might remain open.
            // The global click in main.js should handle this if focus leaves.

        } else if (event.key === 'Escape') {
            event.preventDefault();
            // Original logic for escape:
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
            activeSuggestionIndex = -1;
            // Also ensure the search bar itself closes if it was explicitly opened
            if (searchBarContainer.classList.contains('search-bar-visible') && this.value === '') {
                 if (typeof toggleSearch === 'function') { toggleSearch(); }
            }
        }
    });


            }
        }
    });
    */
});
                
