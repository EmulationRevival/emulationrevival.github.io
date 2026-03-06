// recent-update.js

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const AUTO_UPDATES_BASE_PATH = '/json/updates.json';
    const MANUAL_UPDATES_PATH = '/json/manual-updates.json';
    // NEW: Path to the version file.
    const VERSION_PATH = '/json/updates-version.json';

    const PREFIXES = {
        COMMIT: 'Latest commit: ',
        TAG: 'Last tagged release: ',
        BUILD: 'Latest successful build: '
    };

    const CONFIGS = {
        // Release-based
        duckstation: { type: 'release' },
        pcsx2: { type: 'release' },
        netherSX2: { type: 'release' },
        rpcsxAndroid: { type: 'release' },
        shadPS4: { type: 'release' },
        
        // Commit-based
        rpcs3: { type: 'commit', prefix: PREFIXES.COMMIT },
        beetlePsx: { type: 'commit', prefix: PREFIXES.COMMIT },
        pcsxRearmed: { type: 'commit', prefix: PREFIXES.COMMIT },
        lrps2: { type: 'commit', prefix: PREFIXES.COMMIT },
        
        // Tag-based
        play: { type: 'tag', prefix: PREFIXES.TAG },
        
        // Workflow-based
        fpPS4: { type: 'workflow', prefix: PREFIXES.BUILD },
        
        // Manual
        'duckstationAndroid': { type: 'manual' }
    };

    // --- PROCESSING ENGINE ---
    const DATE_FORMAT_OPTIONS = { year: 'numeric', month: 'long', day: 'numeric' };
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', DATE_FORMAT_OPTIONS);

    const elementsToUpdate = document.querySelectorAll('.recent-update');
    if (elementsToUpdate.length === 0) {
        return;
    }
    
    console.log('Fetching update data for elements on this page...');

    // NEW: The fetch process now includes cache-busting.
    const fetchWithCacheBusting = async () => {
        // First, get the latest version timestamp. Bust cache for the version file itself.
        const versionResponse = await fetch(`${VERSION_PATH}?cb=${Date.now()}`);
        if (!versionResponse.ok) throw new Error('Could not fetch updates-version.json');
        const versionData = await versionResponse.json();
        const version = versionData.version;

        // Now fetch the main data files using the version as a cache-busting query parameter.
        const [autoUpdatesResponse, manualUpdatesResponse] = await Promise.all([
            fetch(`${AUTO_UPDATES_BASE_PATH}?v=${version}`).then(res => res.ok ? res.json() : {}),
            fetch(MANUAL_UPDATES_PATH).then(res => res.ok ? res.json() : {}) // Manual updates don't need busting
        ]);

        return { ...autoUpdatesResponse, ...manualUpdatesResponse };
    };


    fetchWithCacheBusting()
    .then(allUpdates => {
        elementsToUpdate.forEach(element => {
            const key = element.dataset.updateKey;
            if (!key) {
                console.warn('Element has class "recent-update" but is missing a "data-update-key" attribute.', element);
                return;
            }

            const config = CONFIGS[key];
            const data = allUpdates[key];

            if (!config || !data) {
                console.warn(`Missing config or data for key: ${key}`);
                return;
            }

            let text = '';
            switch (config.type) {
                case 'release':
                    text = `${data.version} (${formatDate(data.date)})`;
                    break;
                case 'commit':
                case 'tag':
                case 'workflow':
                    text = `${config.prefix}${formatDate(data.date)}`;
                    break;
                case 'manual':
                    text = data.lastUpdate;
                    break;
                default:
                    text = `Unknown type: ${config.type}`;
                    break;
            }

            if (text) {
                element.textContent = text;
            }
        });
    })
    .catch(error => {
        console.error('CRITICAL: Could not load or process update files.', error);
    });
});
