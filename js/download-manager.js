document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // TASK SCHEDULER
    // =========================
    const scheduleTask = window.requestIdleCallback || (cb => 
        setTimeout(() => cb({ timeRemaining: () => 0 }), 200)
    );

    // =========================
    // CONFIG
    // =========================
    const C = {
        URL: {
            VERSION: '/json/version.json',
            APP_LINKS: '/json/app-links.json',
        },
        ATTR: {
            APP: 'data-app-id',
            ASSET: 'data-asset-id',
            ARIA: 'aria-label',
        },
        SEL: {
            BTN: '.download-link',
            CARD: '.card',
            DROPDOWN: '.action-dropdown',
            TITLE: '.card-title',
            VERSION: '.app-version',
            DATE: '.app-release-date',
            VAL: '.val',
            IMG_CONTAINER: '.card-image-container',
        },
        TXT: {
            UNKNOWN: 'Unknown',
            DL_PREFIX: 'Download',
        },
        FILE_EXT: /\.(zip|msixbundle|msix|appx|exe|apk|7z|rar|tar|gz|dmg|pdf|mp3|mp4|avi|mov|jpg|jpeg|png|gif|webp|svg|docx?|xlsx?|pptx?|iso|bin|img|msi|deb|rpm|sh|bat|ps1|ini|cfg|ctl|json|txt|xml|csv)$/i,
        BADGE_SRC: '/images/new-update.svg'
    };

    // =========================
    // STATE & CACHE
    // =========================
    const state = {
        dataPromise: null,
        thirtyDaysMs: 30 * 24 * 60 * 60 * 1000
    };

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC", year: "numeric", month: "long", day: "numeric"
    });

    const dom = {
        cards: document.querySelectorAll(C.SEL.CARD),
        versions: document.querySelectorAll(C.SEL.VERSION),
        dates: document.querySelectorAll(C.SEL.DATE),
        buttons: document.querySelectorAll(C.SEL.BTN)
    };

    const cardMap = {};
    
    // Pre-bind all static DOM relationships once
    dom.cards.forEach(card => {
        const imgContainer = card.querySelector(C.SEL.IMG_CONTAINER);
        if (imgContainer) {
            imgContainer.style.position = 'relative';
            card._imgContainer = imgContainer;
        }

        const versionEl = card.querySelector(C.SEL.VERSION);
        if (versionEl) {
            const appId = versionEl.getAttribute(C.ATTR.APP);
            if (appId) cardMap[appId] = card;
        }
    });

    dom.versions.forEach(el => el._val = el.querySelector(C.SEL.VAL));
    dom.dates.forEach(el => el._val = el.querySelector(C.SEL.VAL));
    
    dom.buttons.forEach(btn => {
        btn._card = btn.closest(C.SEL.CARD);
        btn._isDropdown = !!btn.closest(C.SEL.DROPDOWN);
    });

    // =========================
    // DATA FETCHING & PREPROCESSING
    // =========================
    function preprocessData(data) {
        for (const app of Object.values(data)) {
            if (app.assets) {
                const map = {};
                for (const a of app.assets) {
                    map[a.id] = a;
                }
                app._assetMap = map;
            }
            if (app.releaseDate && app.releaseDate !== C.TXT.UNKNOWN) {
                const parsedMs = Date.parse(app.releaseDate);
                if (Number.isFinite(parsedMs)) {
                    app._releaseMs = parsedMs;
                }
            }
        }
    }

    function fetchAppData() {
        if (state.dataPromise) return state.dataPromise;

        state.dataPromise = fetch(`${C.URL.VERSION}?cb=${Date.now()}`)
            .then(r => {
                if (!r.ok) throw new Error('Version fetch failed');
                return r.json();
            })
            .then(v => fetch(`${C.URL.APP_LINKS}?v=${v.version}`))
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                preprocessData(data);
                populateData(data);
                return data;
            })
            .catch(err => {
                console.error('FATAL AppData:', err);
                state.dataPromise = null; 
                return null;
            });

        return state.dataPromise;
    }

    // =========================
    // DOM POPULATION
    // =========================
    function populateData(data) {
        if (!data) return;

        const now = Date.now();

        // 1. Process Versions
        dom.versions.forEach(el => {
            const id = el.getAttribute(C.ATTR.APP);
            const info = data[id];
            if (!info) return;

            if (info.version && info.version !== C.TXT.UNKNOWN) {
                if (el._val) el._val.textContent = info.version;
            } else {
                el.style.display = 'none';
            }
        });

        // 2. Process Dates & Badges
        dom.dates.forEach(el => {
            const id = el.getAttribute(C.ATTR.APP);
            const info = data[id];
            if (!info) return;

            const ms = info._releaseMs;

            if (Number.isFinite(ms)) {
                if (el._val) {
                    const display = dateFormatter.format(ms);
                    
                    const time = document.createElement('time');
                    time.className = 'release-date';
                    time.dateTime = info.releaseDate;
                    time.textContent = display;
                    
                    el._val.replaceChildren(time);
                }

                // Avoid badge drift by using current 'now'
                const timeDiff = now - ms;
                if (timeDiff >= 0 && timeDiff < state.thirtyDaysMs) {
                    const card = cardMap[id];
                    const imgContainer = card?._imgContainer;
                    
                    if (imgContainer && !imgContainer._hasBadge) {
                        imgContainer._hasBadge = true;
                        
                        const badge = document.createElement('img');
                        badge.src = C.BADGE_SRC;
                        badge.alt = 'New Update';
                        badge.className = 'new-update-badge';
                        badge.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:5;';
                        
                        imgContainer.appendChild(badge);
                    }
                }
            } else {
                el.style.display = 'none';
            }
        });
    }

    // =========================
    // ARIA INITIALIZATION
    // =========================
    function initAriaLabels() {
        dom.buttons.forEach(btn => {
            if (btn.hasAttribute(C.ATTR.ARIA)) return; 

            const card = btn._card;
            if (!card) return;

            const text = btn._isDropdown ? btn.textContent : card.querySelector(C.SEL.TITLE)?.textContent;
            
            if (text) {
                btn.setAttribute(C.ATTR.ARIA, `${C.TXT.DL_PREFIX} ${text.trim()}`);
            }
        });
    }

    // =========================
    // EVENT DELEGATION
    // =========================
    document.body.addEventListener('click', async e => {
        const btn = e.target.closest(C.SEL.BTN);
        if (!btn) return;

        e.preventDefault();

        // JS Execution Lock
        if (btn._loading) return;
        
        const appId = btn.getAttribute(C.ATTR.APP);
        const assetId = btn.getAttribute(C.ATTR.ASSET);

        if (!appId || !assetId) {
            console.error('Missing attributes', btn);
            return;
        }

        btn._loading = true;
        btn.dataset.loading = '1';

        const data = await fetchAppData();

        btn._loading = false;
        btn.removeAttribute('data-loading');

        if (!data) {
            alert('Load failed.');
            return;
        }

        const url = data[appId]?._assetMap?.[assetId]?.url;

        if (url) {
            C.FILE_EXT.test(url) 
                ? window.location.assign(url) 
                : window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert(`Link not found.`);
        }
    });

    // =========================
    // INITIALIZATION
    // =========================
    fetchAppData(); 
    scheduleTask(initAriaLabels);
});