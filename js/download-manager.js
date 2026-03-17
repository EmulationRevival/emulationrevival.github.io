document.addEventListener('DOMContentLoaded', () => {
    // 1. PERFORMANCE: Defer non-critical work to prevent network stalls
    const scheduleTask = window.requestIdleCallback || function (cb) { 
        return setTimeout(() => cb({ timeRemaining: () => 0 }), 200); 
    };

    const CONSTANTS = {
        VERSION_URL: '/json/version.json',
        APP_LINKS_URL: '/json/app-links.json',
        DATA_ATTR: {
            APP_ID_PROP: 'appId',
            ASSET_ID_PROP: 'assetId',
        },
        SELECTORS: {
            DOWNLOAD_LINK: '.download-link',
            CARD_CONTAINER: '.card',
            DROPDOWN_WRAPPER: '.action-dropdown',
            CARD_TITLE: '.card-title',
            APP_VERSION: '.app-version',
            APP_RELEASE_DATE: '.app-release-date',
            VAL_SPAN: '.val',
        },
        ARIA: {
            LABEL_ATTR: 'aria-label',
            DOWNLOAD_PREFIX: 'Download',
        },
        FILE_EXT_PATTERN: /\.(zip|msixbundle|msix|appx|exe|apk|7z|rar|tar|gz|dmg|pdf|mp3|mp4|avi|mov|jpg|jpeg|png|gif|webp|svg|docx?|xlsx?|pptx?|iso|bin|img|msi|deb|rpm|sh|bat|ps1|ini|cfg|ctl|json|txt|xml|csv)$/i
    };

    // --- State ---
    let appDataPromise = null;

    // --- Lazy Fetch Function ---
    function fetchAppData() {
        // If we already started fetching, just return the existing promise
        if (appDataPromise) return appDataPromise;

        appDataPromise = fetch(`${CONSTANTS.VERSION_URL}?cb=${Date.now()}`)
            .then(response => {
                if (!response.ok) throw new Error('Could not fetch version file.');
                return response.json();
            })
            .then(versionData => {
                const version = versionData.version;
                const finalUrl = `${CONSTANTS.APP_LINKS_URL}?v=${version}`;
                return fetch(finalUrl);
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(appData => {
                // Instantly populate all version and date fields on the page once data is loaded
                populateVersionAndDateData(appData);
                return appData;
            })
            .catch(error => {
                console.error(`FATAL: Could not fetch app links data. Error: ${error}`);
                appDataPromise = null; // Reset so it can try again if it fails
                return null;
            });

        return appDataPromise;
    }

    // --- Data Injection (OPTIMIZED & REPAIRED) ---
    function populateVersionAndDateData(data) {
        if (!data) return;
        
        // 1. Process all Version elements currently on the page
        const versionElements = document.querySelectorAll(CONSTANTS.SELECTORS.APP_VERSION);
        versionElements.forEach(versionLi => {
            // FIX: Using dataset matches data-app-id perfectly
            const appId = versionLi.dataset[CONSTANTS.DATA_ATTR.APP_ID_PROP];
            const appInfo = data[appId];

            if (appInfo && appInfo.version && appInfo.version !== "Unknown") {
                const valSpan = versionLi.querySelector(CONSTANTS.SELECTORS.VAL_SPAN);
                if (valSpan) valSpan.textContent = appInfo.version;
            } else {
                versionLi.style.display = 'none'; // Hide the element if version is Unknown
            }
        });

        // 2. Process all Release Date elements currently on the page
        const dateElements = document.querySelectorAll(CONSTANTS.SELECTORS.APP_RELEASE_DATE);
        const currentDate = new Date(); // Calculate the current date only once for performance

        dateElements.forEach(dateLi => {
            // FIX: Using dataset matches data-app-id perfectly
            const appId = dateLi.dataset[CONSTANTS.DATA_ATTR.APP_ID_PROP];
            const appInfo = data[appId];

            if (appInfo && appInfo.releaseDate && appInfo.releaseDate !== "Unknown") {
                const valSpan = dateLi.querySelector(CONSTANTS.SELECTORS.VAL_SPAN);
                if (valSpan) {
                    const iso = appInfo.releaseDate;
                    const display = new Date(iso).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });
                    valSpan.innerHTML = `<time class="release-date" datetime="${iso}">${display}</time>`;

                    // --- NEW OVERLAY LOGIC ---
                    const releaseDateObj = new Date(iso);
                    const timeDiff = currentDate.getTime() - releaseDateObj.getTime();
                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                    // Check if the update is less than 30 days old (and not in the future)
                    if (daysDiff >= 0 && daysDiff < 30) {
                        const parentCard = dateLi.closest(CONSTANTS.SELECTORS.CARD_CONTAINER);
                        if (parentCard) {
                            const imageContainer = parentCard.querySelector('.card-image-container');
                            // Ensure we don't accidentally add the badge twice
                            if (imageContainer && !imageContainer.querySelector('.new-update-badge')) {
                                // Ensure the container can anchor the absolute overlay
                                imageContainer.style.position = 'relative';
                                
                                const badge = document.createElement('img');
                                badge.src = '/images/new-update.svg';
                                badge.alt = 'New Update';
                                badge.className = 'new-update-badge';
                                
                                // Styling to perfectly overlay the container
                                badge.style.position = 'absolute';
                                badge.style.top = '0';
                                badge.style.left = '0';
                                badge.style.width = '100%';
                                badge.style.height = '100%';
                                badge.style.pointerEvents = 'none'; // Prevents blocking clicks on the card
                                badge.style.zIndex = '5'; // Ensures it sits above the main image
                                
                                imageContainer.appendChild(badge);
                            }
                        }
                    }
                }
            } else {
                dateLi.style.display = 'none'; // Hide the element if date is Unknown
            }
        });
    }

    // --- Main Click Handler (Event Delegation) ---
    document.body.addEventListener('click', async (event) => {
        const downloadButton = event.target.closest(CONSTANTS.SELECTORS.DOWNLOAD_LINK);
        if (!downloadButton) return;

        event.preventDefault();

        const appId = downloadButton.dataset[CONSTANTS.DATA_ATTR.APP_ID_PROP];
        const assetId = downloadButton.dataset[CONSTANTS.DATA_ATTR.ASSET_ID_PROP];

        if (!appId || !assetId) {
            console.error('Button is missing data-app-id or data-asset-id attributes.', downloadButton);
            return;
        }

        const originalButtonText = downloadButton.innerHTML;
        downloadButton.innerHTML = 'Loading...';
        downloadButton.style.pointerEvents = 'none';

        // Wait for the data. If it was already fetched in the background, this resolves instantly!
        const appData = await fetchAppData();

        downloadButton.innerHTML = originalButtonText;
        downloadButton.style.pointerEvents = '';

        if (!appData) {
            alert('Download data could not be loaded. Please check your connection and try again.');
            return;
        }

        const url = findAssetUrl(appData, appId, assetId);

        if (url) {
            updateAriaLabel(downloadButton);
            setDownloadLinkTargetAndGo(downloadButton, url);
        } else {
            alert(`Download link for ${appId} / ${assetId} could not be found.`);
        }
    });

    // --- Immediate Fetch ---
    // Executing this directly inside DOMContentLoaded removes the artificial idle delay
    // and populates the cards instantly.
    fetchAppData(); 

    // --- Helper Functions ---
    function findAssetUrl(data, appId, assetId) {
        const app = data[appId];
        if (!app) return null;
        const asset = app.assets.find(a => a.id === assetId);
        return (asset && asset.url) ? asset.url : null;
    }

    function setDownloadLinkTargetAndGo(link, url) {
        if (CONSTANTS.FILE_EXT_PATTERN.test(url)) {
            window.location.href = url;
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    function updateAriaLabel(linkElement) {
        const parentCard = linkElement.closest(CONSTANTS.SELECTORS.CARD_CONTAINER);
        if (!parentCard) return;
        
        let ariaLabelText;
        const isDropdownLink = linkElement.closest(CONSTANTS.SELECTORS.DROPDOWN_WRAPPER);
        
        if (isDropdownLink) {
            const linkText = linkElement.textContent.trim();
            ariaLabelText = `${CONSTANTS.ARIA.DOWNLOAD_PREFIX} ${linkText}`;
        } else {
            const titleElement = parentCard.querySelector(CONSTANTS.SELECTORS.CARD_TITLE);
            if (titleElement) {
                const appName = titleElement.textContent.trim();
                ariaLabelText = `${CONSTANTS.ARIA.DOWNLOAD_PREFIX} ${appName}`;
            }
        }
        
        if (ariaLabelText) {
            linkElement.setAttribute(CONSTANTS.ARIA.LABEL_ATTR, ariaLabelText);
        }
    }
});