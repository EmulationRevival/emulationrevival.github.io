async function loadRecentUpdates() {
    const RECENT_GRID = document.getElementById('recent-updates-grid');
    const RECENT_SECTION = document.getElementById('recent-updates-section');
    
    if (!RECENT_GRID || !RECENT_SECTION) return;

    try {
        // The crucial fix for PWA
        const fetchOpts = { cache: 'no-store' };

        // OPTIMIZATION 1: Parallel Fetching
        // Start fetching search-index immediately since it doesn't depend on version.json
        const searchIndexPromise = fetch(`/json/search-index.json?cb=${Date.now()}`, fetchOpts).then(res => {
            if (!res.ok) throw new Error("Could not fetch search index");
            return res.json();
        });

        // 1. Fetch version and release date data
        const vRes = await fetch(`/json/version.json?cb=${Date.now()}`, fetchOpts);
        if (!vRes.ok) throw new Error("Could not fetch version.json");
        const vData = await vRes.json();
        
        // Start fetching app-links now that we have the version
        const appLinksPromise = fetch(`/json/app-links.json?v=${vData.version}`, fetchOpts).then(res => {
            if (!res.ok) throw new Error("Could not fetch app-links.json");
            return res.json();
        });

        // Wait for both data sources to finish downloading simultaneously
        const [searchIndex, appData] = await Promise.all([searchIndexPromise, appLinksPromise]);

        // OPTIMIZATION 2: O(1) Hash Map Lookup
        // Instead of running .find() in a loop (which causes hundreds of slow searches), 
        // we build a dictionary of the search index once.
        const searchMap = new Map();
        for (const item of searchIndex) {
            if (item.name) {
                searchMap.set(item.name.toLowerCase().trim(), item);
            }
        }

        // 3. Filter for updates < 30 days old
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentApps = [];

        for (const [appId, info] of Object.entries(appData)) {
            if (info.releaseDate && info.releaseDate !== "Unknown") {
                const rDate = new Date(info.releaseDate).getTime();
                
                if (rDate >= thirtyDaysAgo) {
                    // Cross-reference with search index using our instant lookup map
                    const appNameCleaned = info.name ? info.name.toLowerCase().trim() : "";
                    const searchData = searchMap.get(appNameCleaned);
                    
                    if (searchData) {
                        recentApps.push({ 
                            timestamp: rDate, 
                            searchData: searchData 
                        });
                    }
                }
            }
        }

        // 4. Sort newest updates first
        recentApps.sort((a, b) => b.timestamp - a.timestamp);

        // 5. Build the HTML and reveal the section if updates exist
        if (recentApps.length > 0) {
            // Clear it first in case of BFCache restoring an already-populated grid
            RECENT_GRID.innerHTML = ''; 
            
            RECENT_GRID.innerHTML = recentApps.map(app => {
                const data = app.searchData;
                return `
                    <div class="card">
                        <a href="${data.url}" class="card-link">
                            <div class="card-image-container" style="position: relative;">
                                <img src="${data.img}" alt="${data.name} Logo" class="card-image">
                                <div class="new-update-badge" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('/images/new-update.svg'); background-size: 100% 100%; background-repeat: no-repeat; pointer-events: none; z-index: 10;"></div>
                            </div>
                            <div class="card-content">
                                <h3 class="card-title">${data.name}</h3>
                                <p class="card-description">${data.description}</p>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
            
            RECENT_SECTION.style.display = 'block';
        } else {
            RECENT_SECTION.style.display = 'none';
        }
    } catch (error) {
        console.error("Failed to load recent updates:", error);
    }
}

// --- Lifecycle Event Listeners ---

// 1. Standard initial load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRecentUpdates);
} else {
    loadRecentUpdates();
}

// 2. Mobile BFCache load (when user swipes back to the page)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        loadRecentUpdates();
    }
});
