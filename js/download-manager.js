// download-manager.js
document.addEventListener('DOMContentLoaded', async () => {
    
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
        },
        ARIA: {
            LABEL_ATTR: 'aria-label',
            DOWNLOAD_PREFIX: 'Download',
        },
        FILE_EXT_PATTERN: /\.(zip|msixbundle|msix|appx|exe|apk|7z|rar|tar|gz|dmg|pdf|mp3|mp4|avi|mov|jpg|jpeg|png|gif|webp|svg|docx?|xlsx?|pptx?|iso|bin|img|msi|deb|rpm|sh|bat|ps1|ini|cfg|ctl|json|txt|xml|csv)$/i
    };

    // --- Data Fetching with Cache Busting ---
    const appDataPromise = fetch(`${CONSTANTS.VERSION_URL}?cb=${Date.now()}`)
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
        .catch(error => {
            console.error(`FATAL: Could not fetch app links data. Downloads will not work. Error: ${error}`);
            return null;
        });

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

        const appData = await appDataPromise;

        downloadButton.innerHTML = originalButtonText;
        downloadButton.style.pointerEvents = '';
        
        if (!appData) {
            alert('Download data could not be loaded. Please check the console for errors.');
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
