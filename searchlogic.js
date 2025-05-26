// searchlogic.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('[searchlogic.js] DOMContentLoaded event fired.');

    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('[searchlogic.js] CRITICAL: searchInput not found.');
        return;
    }

    let autocompleteResults = document.getElementById('autocompleteResults');
    if (!autocompleteResults) {
        console.error('[searchlogic.js] CRITICAL: autocompleteResults not found.');
        return;
    }
    autocompleteResults.style.display = 'none';

    if (typeof searchEntries === 'undefined' || !Array.isArray(searchEntries)) {
        console.error('[searchlogic.js] CRITICAL: searchEntries is undefined or not an array.');
        return;
    }
    console.log('[searchlogic.js] searchEntries loaded. Length:', searchEntries.length);

    function resetSearchUI() {
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
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
        
        let fixedHeaderHeight = 0; 

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
        let compareEntryPage = entryPage;

        if (compareEntryPage === "/") {
            compareEntryPage = "/index.html";
        }
        
        if (currentPath.endsWith("/index.html")) {
            // already fine
        } else if (currentPath.endsWith("/")) {
            currentPath = currentPath + "index.html";
        } else if (!currentPath.includes(".")) { // Likely a directory, assume index.html
            currentPath = currentPath + (currentPath.endsWith("/") ? "" : "/") + "index.html";
        }


        if (currentPath.endsWith(compareEntryPage)) {

            const matchIndex = currentPath.lastIndexOf(compareEntryPage);
            if (matchIndex === 0 || (matchIndex > 0 && currentPath.charAt(matchIndex - 1) === '/')) {
                return true;
            }
        }
        return false;
    }


    if (window.location.hash) {
        const targetIdFromHash = window.location.hash.substring(1);
        const entryForHash = searchEntries.find(entry => 
            entry.id === targetIdFromHash && isCurrentPage(entry.page)
        );
        if (entryForHash) {
            setTimeout(() => applyHighlightAndScroll(targetIdFromHash), 300);
        }
    }

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        autocompleteResults.innerHTML = '';

        if (query.length === 0) {
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
                    const targetUrl = `${entry.page}#${targetId}`; // entry.page is root-relative like /ports.html

                    console.log(`[searchlogic.js] Click - Target URL: "${targetUrl}"`);
                    if (isCurrentPage(entry.page)) {
                        console.log('[searchlogic.js] Same page navigation (hash)');
                        if (window.location.hash !== `#${targetId}`) {
                            window.location.hash = targetId;
                        } else {
                            applyHighlightAndScroll(targetId); 
                        }
                    } else {
                        console.log('[searchlogic.js] Different page navigation to:', targetUrl);
                        window.location.href = targetUrl;
                    }
                    resetSearchUI();
                });
                autocompleteResults.appendChild(suggestionItem);
            });
        } else {
            autocompleteResults.style.display = 'none';
        }
    });

    searchInput.addEventListener('focus', function() {
        if (this.value.trim().length > 0 && autocompleteResults.style.display === 'none') {
            this.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    searchInput.addEventListener('keydown', function(event) {
        let navigated = false;
        if (event.key === 'Enter') {
            event.preventDefault();
            const firstSuggestion = autocompleteResults.querySelector('.autocomplete-suggestion');

            if (autocompleteResults.style.display === 'block' && firstSuggestion) {
                firstSuggestion.click();
                navigated = true;
            } else if (this.value.trim() !== '') {
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
                    const targetUrl = `${targetToNavigate.page}#${targetId}`;
                    console.log(`[searchlogic.js] Enter - Target URL: "${targetUrl}"`);
                    if (isCurrentPage(targetToNavigate.page)) {
                        console.log('[searchlogic.js] Enter: Same page navigation (hash)');
                        if (window.location.hash !== `#${targetId}`) { window.location.hash = targetId; }
                        else { applyHighlightAndScroll(targetId); }
                    } else {
                        console.log('[searchlogic.js] Enter: Different page navigation to:', targetUrl);
                        window.location.href = targetUrl;
                    }
                    navigated = true;
                }
            }
            if (navigated) {
                resetSearchUI();
            } else if (this.value.trim() === '') {
                resetSearchUI();
            } else if (autocompleteResults.style.display === 'block') {
                autocompleteResults.style.display = 'none';
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
