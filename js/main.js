document.addEventListener('DOMContentLoaded', () => {
    // 1. PERFORMANCE: Defer non-critical work with a robust fallback
    const scheduleTask = window.requestIdleCallback || function (cb) {
        return setTimeout(() => cb({ timeRemaining: () => 0 }), 200);
    };

    // =========================
    // CONSTANTS & CONFIGURATION
    // =========================
    const CONSTANTS = {
        SELECTORS: {
            HAMBURGER: '.hamburger-menu',
            NAV_LIST: '.nav-list',
            MAIN_HEADER: '.main-header',
            HAS_SUBMENU_LINK: '.has-submenu > a',
            SUBMENU: '.submenu',
            NAV_LINKS: '.nav-list a',
            DISCORD_TRIGGERS: '[data-modal-target="discord-hub"]',
            DISCORD_MODAL: '#discordHubModal',
            DISCORD_OVERLAY: '#discordHubOverlay',
            DISCORD_CLOSE: '#discordHubClose',
        },
        CLASSES: {
            ACTIVE: 'active',
            DRILLDOWN_BACK: 'drilldown-back',
        },
        BREAKPOINTS: {
            MENU_COLLAPSE: 992,
        },
        THEME: {
            STORAGE_KEY: 'theme',
        }
    };

    // Cached DOM Elements
    const hamburger = document.querySelector(CONSTANTS.SELECTORS.HAMBURGER);
    const navList = document.querySelector(CONSTANTS.SELECTORS.NAV_LIST);
    const mainHeader = document.querySelector(CONSTANTS.SELECTORS.MAIN_HEADER);
    const themeToggle = document.getElementById('theme-toggle');
    const submenuLinks = document.querySelectorAll(CONSTANTS.SELECTORS.HAS_SUBMENU_LINK);
    const allSubmenus = document.querySelectorAll(CONSTANTS.SELECTORS.SUBMENU);

    // =========================
    // SCROLL LOCK UTILITY
    // =========================
    function setScrollLock(lock) {
        if (lock) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            if (mainHeader) mainHeader.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.paddingRight = '';
            if (mainHeader) mainHeader.style.paddingRight = '';
            document.body.style.overflow = '';
        }
    }

    // =========================
    // DISCORD MODAL
    // =========================
    const discordTriggers = document.querySelectorAll(CONSTANTS.SELECTORS.DISCORD_TRIGGERS);
    const discordModal = document.querySelector(CONSTANTS.SELECTORS.DISCORD_MODAL);
    const discordOverlay = document.querySelector(CONSTANTS.SELECTORS.DISCORD_OVERLAY);

    const toggleDiscordModal = (e) => {
        if (e) e.preventDefault();
        if (!discordModal || !discordOverlay) return;

        const isOpen = discordModal.classList.contains(CONSTANTS.CLASSES.ACTIVE);

        discordModal.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
        discordOverlay.classList.toggle(CONSTANTS.CLASSES.ACTIVE);

        if (!isOpen) {
            setScrollLock(true);
            discordModal.setAttribute('aria-hidden', 'false');
            setTimeout(() => trapFocus(discordModal), 50);
        } else {
            setScrollLock(false);
            discordModal.setAttribute('aria-hidden', 'true');
            removeFocusTrap();
        }
    };

    if (discordModal && discordOverlay) {
        discordTriggers.forEach(t => t.addEventListener('click', toggleDiscordModal));
        const closeBtn = document.querySelector(CONSTANTS.SELECTORS.DISCORD_CLOSE);
        if (closeBtn) closeBtn.addEventListener('click', toggleDiscordModal);
        discordOverlay.addEventListener('click', toggleDiscordModal);
    }

    // =========================
    // MOBILE NAV POSITIONING
    // =========================
    function setMenuPosition() {
        if (!navList || !isMobile) {
            if (navList) {
                navList.style.top = '';
                navList.style.height = '';
            }
            return;
        }

        const headerHeight = mainHeader ? mainHeader.offsetHeight : 72;
        navList.style.top = `${headerHeight}px`;
        navList.style.height = `calc(100vh - ${headerHeight}px)`;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${CONSTANTS.BREAKPOINTS.MENU_COLLAPSE}px)`);
    let isMobile = mediaQuery.matches;

    mediaQuery.addEventListener('change', (e) => {
        isMobile = e.matches;
        setMenuPosition();

        if (!isMobile && navList?.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
            closeMenuFully();
        }
    });

    // Run immediately to avoid race condition
    setMenuPosition();

    // =========================
    // THEME LOGIC
    // =========================
    if (themeToggle) {
        const savedTheme =
            localStorage.getItem(CONSTANTS.THEME.STORAGE_KEY) ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.setAttribute('aria-pressed', savedTheme === 'dark');

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', target);
            themeToggle.setAttribute('aria-pressed', target === 'dark');

            localStorage.setItem(CONSTANTS.THEME.STORAGE_KEY, target);
        });
    }

    // =========================
    // FOCUS TRAP
    // =========================
    let lastFocusedElement = null;
    let focusTrapHandler = null;

    function getFocusable(container) {
        return Array.from(container.querySelectorAll('a[href], button:not([disabled])'))
            .filter(el => el.offsetParent !== null);
    }

    function trapFocus(container) {
        lastFocusedElement = document.activeElement;

        const initialFocusable = getFocusable(container);
        if (initialFocusable.length) initialFocusable[0].focus({ preventScroll: true });

        focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;

            const currentFocusable = getFocusable(container);
            if (!currentFocusable.length) return;

            const first = currentFocusable[0];
            const last = currentFocusable[currentFocusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus({ preventScroll: true });
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus({ preventScroll: true });
            }
        };

        container.addEventListener('keydown', focusTrapHandler);
    }

    function removeFocusTrap() {
        if (focusTrapHandler) {
            navList?.removeEventListener('keydown', focusTrapHandler);
            discordModal?.removeEventListener('keydown', focusTrapHandler);
            focusTrapHandler = null;
        }

        lastFocusedElement?.focus({ preventScroll: true });
    }

    // =========================
    // ESC KEY
    // =========================
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        if (discordModal?.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
            toggleDiscordModal();
            return;
        }

        if (navList?.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
            const openSubmenu = navList.querySelector('.submenu.active');

            if (openSubmenu) {
                openSubmenu.classList.remove(CONSTANTS.CLASSES.ACTIVE);

                const parentLink = openSubmenu.parentElement.querySelector('a');
                if (parentLink) {
                    parentLink.setAttribute('aria-expanded', 'false');
                    parentLink.focus({ preventScroll: true });
                }
            } else {
                closeMenuFully();
            }
        }
    });

    // =========================
    // MOBILE MENU
    // =========================
    function closeMenuFully() {
        setScrollLock(false);

        if (navList) navList.classList.remove(CONSTANTS.CLASSES.ACTIVE);

        if (hamburger) {
            hamburger.classList.remove(CONSTANTS.CLASSES.ACTIVE);
            hamburger.setAttribute('aria-expanded', 'false');
        }

        resetDrilldownMenus();
        removeFocusTrap();
    }

    if (hamburger && navList) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();

            const active = navList.classList.toggle(CONSTANTS.CLASSES.ACTIVE);

            hamburger.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
            hamburger.setAttribute('aria-expanded', active);

            if (active) {
                setScrollLock(true);
                trapFocus(navList);
            } else {
                setScrollLock(false);
                removeFocusTrap();
                resetDrilldownMenus();
            }
        });
    }

    function resetDrilldownMenus() {
        allSubmenus.forEach(m => m.classList.remove(CONSTANTS.CLASSES.ACTIVE));
        submenuLinks.forEach(l => l.setAttribute('aria-expanded', 'false'));
    }

    document.querySelectorAll(CONSTANTS.SELECTORS.NAV_LINKS).forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.defaultPrevented) return;
            if (link.parentElement.classList.contains('has-submenu')) return;

            closeMenuFully();
        });
    });

    submenuLinks.forEach(link => {
        const parentLi = link.parentElement;
        const submenu = parentLi.querySelector(CONSTANTS.SELECTORS.SUBMENU);

        if (submenu && !submenu.querySelector('.' + CONSTANTS.CLASSES.DRILLDOWN_BACK)) {
            const backButton = document.createElement('button');

            backButton.type = 'button';
            backButton.className = CONSTANTS.CLASSES.DRILLDOWN_BACK;
            backButton.setAttribute('tabindex', '0');
            backButton.setAttribute('aria-label', 'Back to previous menu');

            backButton.textContent = link.textContent.replace(/[▼►]/g, '').trim();

            backButton.onclick = (e) => {
                e.stopPropagation();

                submenu.classList.remove(CONSTANTS.CLASSES.ACTIVE);
                link.setAttribute('aria-expanded', 'false');

                link.focus({ preventScroll: true });
            };

            submenu.insertBefore(backButton, submenu.firstChild);
        }

        const handleSubmenuTrigger = function (e) {
            if (isMobile && submenu) {
                e.preventDefault();
                e.stopPropagation();

                submenu.classList.add(CONSTANTS.CLASSES.ACTIVE);
                this.setAttribute('aria-expanded', 'true');
            }
        };

        link.addEventListener('click', handleSubmenuTrigger);

        link.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && isMobile && submenu) {
                handleSubmenuTrigger.call(this, e);
            }
        });
    });

    // =========================
    // NON-CRITICAL LAZY INIT
    // =========================
    scheduleTask(() => {

        const copySpan = document.getElementById('copyright-year');
        if (copySpan) {
            copySpan.textContent = new Date().getFullYear();
        }

        document.querySelector('nav.main-nav')?.setAttribute('role', 'navigation');

        const path = window.location.pathname;

        document.querySelectorAll('.nav-list a, .footer-nav a').forEach(link => {
            try {
                if (new URL(link.href, location.origin).pathname === path) {
                    link.setAttribute('aria-current', 'page');
                }
            } catch {}
        });

        document.querySelectorAll('main a[href^="http"], .main-footer a[href^="http"], .main-header a[href^="http"]').forEach(link => {
    try {
        if (
            new URL(link.href).hostname !== window.location.hostname &&
            !link.classList.contains('download-link')
        ) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    } catch {}
});


        // Lite YouTube facade
        document.querySelectorAll('.lite-youtube').forEach(wrapper => {
            wrapper.addEventListener('click', function () {

                const videoId = this.getAttribute('data-video-id');

                const iframe = document.createElement('iframe');

                iframe.setAttribute(
                    'src',
                    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
                );

                iframe.setAttribute('title', 'YouTube Video');

                iframe.setAttribute(
                    'allow',
                    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                );

                iframe.setAttribute('allowfullscreen', 'true');

                iframe.style.position = 'absolute';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';

                this.innerHTML = '';
                this.appendChild(iframe);

            }, { once: true });
        });
    });

    // Handle bfcache restore
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) closeMenuFully();
    });
});
