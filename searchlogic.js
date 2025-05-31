// searchlogic.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('[searchlogic.js] DOMContentLoaded event fired.');

    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('[searchlogic.js] CRITICAL: searchInput not found.');
        return;
    }

    const autocompleteResults = document.getElementById('autocompleteResults');
    if (!autocompleteResults) {
        console.error('[searchlogic.js] CRITICAL: autocompleteResults not found.');
        return;
    }
    autocompleteResults.style.display = 'none'; // Initialize as hidden

    if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries)) {
        console.error('[searchlogic.js] CRITICAL: searchEntries is undefined or not an array.');
        return;
    }
    console.log('[searchlogic.js] searchEntries loaded. Length:', searchEntries.length);

    function resetSearchUI() {
        if (searchInput) {
            searchInput.value = '';
            // searchInput.blur(); // Optional: remove focus from input
        }
        if (autocompleteResults) {
            autocompleteResults.innerHTML = '';
            autocompleteResults.style.display = 'none';
        }
    }

    function applyHighlightAndScroll(elementId) {
        if (!elementId) { console.warn('[applyHighlightAndScroll] No elementId provided'); return; }
        const targetElement = document.getElementById(elementId);
        console.log(`[applyHighlightAndScroll] Attempting to find ID: "${elementId}". Found:`, targetElement);
        if (!targetElement) { console.warn(`[applyHighlightAndScroll] Target ID "${elementId}" not found.`); return; }

        const highlightedElements = document.querySelectorAll('.highlighted-by-search');
        highlightedElements.forEach(el => el.classList.remove('highlighted-by-search'));
        
        let fixedHeaderHeight = 0; // Placeholder: Calculate if you have a fixed header
        // e.g., const header = document.querySelector('header.fixed'); if (header) fixedHeaderHeight = header.offsetHeight;

        const elementRect = targetElement.getBoundingClientRect();
        const elementTopRelativeToDocument = elementRect.top + window.pageYOffset;
        const desiredMarginFromTop = 20; 
        let scrollToPosition = elementTopRelativeToDocument - fixedHeaderHeight - desiredMarginFromTop;

        if (scrollToPosition < 0) scrollToPosition = 0;

        window.scrollTo({ top: scrollToPosition, behavior: 'smooth' });
        targetElement.classList.add('highlighted-by-search');
        setTimeout(() => {
            targetElement.classList.remove('highlighted-by-search');
        }, 2500);
    }
    
    function isCurrentPage(entryPage) {
        let currentPath = window.location.pathname;
        // Normalize currentPath: ensure it ends with a filename, typically index.html for directories
        if (currentPath.endsWith('/')) {
            currentPath += 'index.html';
        } else {
            const pathSegments = currentPath.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (!lastSegment.includes('.')) { // No file extension, assume directory
                currentPath += '/index.html';
            }
        }

        // Normalize entryPage: ensure it's a full path if currentPath is
        let compareEntryPage = entryPage;
        if (compareEntryPage === "/") { // Root path
            compareEntryPage = "/index.html";
        }
        // Ensure entryPage starts with '/' if currentPath does, for consistent comparison
        if (currentPath.startsWith('/') && !compareEntryPage.startsWith('/')) {
            compareEntryPage = `/${compareEntryPage}`;
        }
        
        return currentPath === compareEntryPage;
    }

    if (window.location.hash) {
        const targetIdFromHash = window.location.hash.substring(1);
        if(Array.isArray(searchEntries) && searchEntries.length > 0) {
            const entryForHash = searchEntries.find(entry => 
                entry.id === targetIdFromHash && isCurrentPage(entry.page)
            );
            if (entryForHash) {
                setTimeout(() => applyHighlightAndScroll(targetIdFromHash), 300); // Delay for page rendering
            }
        }
    }

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        autocompleteResults.innerHTML = '';

        if (query.length === 0) {
            autocompleteResults.style.display = 'none';
            return;
        }

        if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries)) {
            console.error('[searchlogic.js] searchEntries became undefined during input event.');
            autocompleteResults.style.display = 'none';
            return;
        }
        
        let filteredEntries = searchEntries.filter(entry => 
            entry && entry.name && typeof entry.name === 'string' && entry.name.toLowerCase().includes(query)
        );

        if (filteredEntries.length > 0) {
            filteredEntries.sort((a, b) => {
                const aNameLower = a.name.toLowerCase(); const bNameLower = b.name.toLowerCase();
                const aStartsWithQuery = aNameLower.startsWith(query); const bStartsWithQuery = bNameLower.startsWith(query);
                if (aStartsWithQuery && !bStartsWithQuery) return -1; if (!aStartsWithQuery && bStartsWithQuery) return 1;
                if (aNameLower < bNameLower) return -1; if (aNameLower > bNameLower) return 1; return 0;
            });
            autocompleteResults.style.display = 'block';

            filteredEntries.forEach(entry => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('autocomplete-suggestion');
                suggestionItem.innerHTML = `
                    <img src="${entry.icon}" alt="${entry.name}" class="suggestion-logo">
                    <span class="suggestion-name">${entry.name}</span>`;

                suggestionItem.addEventListener('click', () => {
                    const targetId = entry.id;
                    const targetPage = entry.page;
                    const targetUrl = `${targetPage}#${targetId}`;

                    console.log(`[searchlogic.js] Click - Target URL: "${targetUrl}"`);
                    
                    const isSamePageNav = isCurrentPage(targetPage);

                    if (isSamePageNav) {
                        console.log('[searchlogic.js] Same page navigation (hash)');
                        if (window.location.hash !== `#${targetId}`) {
                            window.location.hash = targetId; // Triggers hashchange for applyHighlightAndScroll
                        } else {
                            applyHighlightAndScroll(targetId); // Already on the hash, just scroll/highlight
                        }
                    } else {
                        console.log('[searchlogic.js] Different page navigation to:', targetUrl);
                        window.location.href = targetUrl;
                    }
                    
                    resetSearchUI(); // Clears input, hides autocomplete

                    if (isSamePageNav) {
                        const sidebar = document.getElementById("sidebar");
                        if (sidebar && sidebar.classList.contains("overlay-active")) {
                            // Ensure toggleMenu is accessible (e.g., window.toggleMenu if in another file)
                            if (typeof toggleMenu === 'function') {
                                console.log('[searchlogic.js] Closing sidebar for same-page navigation.');
                                toggleMenu();
                            } else {
                                console.error('[searchlogic.js] toggleMenu function is NOT defined or accessible from searchlogic.js!');
                            }
                        }
                    }
                });
                autocompleteResults.appendChild(suggestionItem);
            });
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    searchInput.addEventListener('focus', function() {
        // If there's text and results were previously generated but hidden, show them.
        // Or, if there's text, re-trigger input to re-filter (e.g., if results were cleared by clicking outside).
        if (this.value.trim().length > 0) {
             if (autocompleteResults.children.length > 0 && autocompleteResults.style.display === 'none') {
                autocompleteResults.style.display = 'block';
             } else if (autocompleteResults.children.length === 0) { // No results currently rendered, try to generate them
                this.dispatchEvent(new Event('input', { bubbles:true }));
             }
        }
    });

    searchInput.addEventListener('keydown', function(event) {
        let navigated = false;
        if (event.key === 'Enter') {
            event.preventDefault();
            const firstSuggestion = autocompleteResults.querySelector('.autocomplete-suggestion');

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                firstSuggestion.click(); // The click handler will now take care of resetSearchUI and sidebar closing
                // navigated = true; // Not strictly needed here as click() handles it
            } else if (this.value.trim() !== '') {
                // Logic for when Enter is pressed without visible suggestions (from your original code)
                const queryFromInput = this.value.toLowerCase().trim();
                let targetToNavigate = null;
                const directMatch = searchEntries.find(entry => entry.name && typeof entry.name === 'string' && entry.name.toLowerCase() === queryFromInput);

                if (directMatch) {
                    targetToNavigate = directMatch;
                } else {
                    let currentFilteredEntries = searchEntries.filter(entry => entry.name && typeof entry.name === 'string' && entry.name.toLowerCase().includes(queryFromInput));
                    if (currentFilteredEntries.length > 0) {
                        currentFilteredEntries.sort((a,b) => { 
                            const aNameLower = a.name.toLowerCase(); const bNameLower = b.name.toLowerCase();
                            const aStartsWithQuery = aNameLower.startsWith(queryFromInput); const bStartsWithQuery = bNameLower.startsWith(queryFromInput);
                            if (aStartsWithQuery && !bStartsWithQuery) return -1; if (!aStartsWithQuery && bStartsWithQuery) return 1;
                            if (aNameLower < bNameLower) return -1; if (aNameLower > bNameLower) return 1; return 0;
                        });
                        targetToNavigate = currentFilteredEntries[0];
                    }
                }

                if (targetToNavigate) {
                    const targetId = targetToNavigate.id;
                    const targetPage = targetToNavigate.page;
                    const targetUrl = `${targetPage}#${targetId}`;
                    console.log(`[searchlogic.js] Enter - Direct Target URL: "${targetUrl}"`);
                    
                    const isSamePageNav = isCurrentPage(targetPage);
                    if (isSamePageNav) {
                        console.log('[searchlogic.js] Enter: Same page navigation (hash)');
                        if (window.location.hash !== `#${targetId}`) { window.location.hash = targetId; }
                        else { applyHighlightAndScroll(targetId); }
                    } else {
                        console.log('[searchlogic.js] Enter: Different page navigation to:', targetUrl);
                        window.location.href = targetUrl;
                    }
                    resetSearchUI(); // Reset UI after direct Enter navigation

                    // Also close sidebar if applicable for direct Enter navigation
                    if (isSamePageNav) {
                        const sidebar = document.getElementById("sidebar");
                        if (sidebar && sidebar.classList.contains("overlay-active")) {
                            if (typeof toggleMenu === 'function') {
                                toggleMenu();
                            } else {
                                 console.error('[searchlogic.js] toggleMenu function is NOT defined (Enter key path)!');
                            }
                        }
                    }
                } else { // No match found on Enter, just hide suggestions if they were somehow open
                    if (autocompleteResults.style.display === 'block') {
                        autocompleteResults.style.display = 'none';
                    }
                }
            } else if (this.value.trim() === '') { // Enter on empty input
                 resetSearchUI();
            }
        } else if (event.key === 'Escape') {
            resetSearchUI();
        }
    });

    window.addEventListener('hashchange', () => {
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            if(Array.isArray(searchEntries)){
                const entry = searchEntries.find(e => e.id === targetId && isCurrentPage(e.page));
                if (entry) {
                    applyHighlightAndScroll(targetId);
                }
            }
        }
    }, false);

    console.log('[searchlogic.js] Event listeners attached.');
});
