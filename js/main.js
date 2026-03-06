document.addEventListener('DOMContentLoaded', () => {
    // Calculate scrollbar width to prevent layout shift when modals open
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

    // =========================
    // CONSTANTS & CONFIGURATION
    // =========================
    const CONSTANTS = {
        SELECTORS: {
            HAMBURGER: '.hamburger-menu',
            NAV_LIST: '.nav-list',
            MAIN_HEADER: '.main-header',
            HAS_SUBMENU_LINK: '.has-submenu > a',
            SUBMENU: '.submenu, .sub-submenu',
            NAV_LINKS: '.nav-list a',
            FOOTER_NAV_LINKS: '.footer-nav a',
            EXTERNAL_LINKS: 'a[href^="http"]',
            HERO_SCROLL_BUTTON: '.scroll-down-btn',
            // --- Discord Modal ---
            DISCORD_TRIGGERS: '[data-modal-target="discord-hub"]',
            DISCORD_MODAL: '#discordHubModal',
            DISCORD_OVERLAY: '#discordHubOverlay',
            DISCORD_CLOSE: '#discordHubClose',
        },
        IDS: {
            THEME_TOGGLE: 'theme-toggle',
            COPYRIGHT_YEAR: 'copyright-year',
        },
        CLASSES: {
            ACTIVE: 'active',
            NO_SCROLL: 'no-scroll',
            DRILLDOWN_BACK: 'drilldown-back',
            IS_FLIPPED: 'is-flipped', // For submenu flipping
        },
        ATTRIBUTES: {
            ARIA_EXPANDED: 'aria-expanded',
            ARIA_PRESSED: 'aria-pressed',
            ARIA_CURRENT: 'aria-current',
            ARIA_LABEL: 'aria-label',
            ARIA_LIVE: 'aria-live',
            DATA_THEME: 'data-theme',
            TARGET: 'target',
            REL: 'rel',
            HREF: 'href',
        },
        EVENTS: {
            CLICK: 'click',
            RESIZE: 'resize',
            BEFORE_UNLOAD: 'beforeunload',
            KEYDOWN: 'keydown',
            MOUSEENTER: 'mouseenter',
            MOUSELEAVE: 'mouseleave',
            FOCUSIN: 'focusin',
            FOCUSOUT: 'focusout',
        },
        BREAKPOINTS: {
            MENU_COLLAPSE: 992,
        },
        THEME: {
            LIGHT: 'light',
            DARK: 'dark',
            STORAGE_KEY: 'theme',
        },
        LABELS: {
            CURRENT_PAGE_SUFFIX: ' - current page',
            EXTERNAL_LINK_SUFFIX: ' (opens in a new tab)',
        },
        TIMING: {
            MILLISECONDS_IN_A_DAY: 86400000,
            RESIZE_DEBOUNCE: 150,
        },
        MISC: {
            ARIA_CURRENT_VALUE: 'page',
            ARIA_LIVE_POLITE: 'polite',
            EXTERNAL_LINK_TARGET: '_blank',
            EXTERNAL_LINK_REL: 'noopener noreferrer',
            ARROW_REGEX: /[▼►]/g,
            FALLBACK_HEADER_HEIGHT: 72,
        },
    };

    // =========================
    // ELEMENT REFERENCES
    // =========================
    const hamburger = document.querySelector(CONSTANTS.SELECTORS.HAMBURGER);
    const navList = document.querySelector(CONSTANTS.SELECTORS.NAV_LIST);
    const body = document.body;
    const mainHeader = document.querySelector(CONSTANTS.SELECTORS.MAIN_HEADER);
    const themeToggle = document.getElementById(CONSTANTS.IDS.THEME_TOGGLE);

    // --- Discord Modal Elements ---
    const discordTriggers = document.querySelectorAll(CONSTANTS.SELECTORS.DISCORD_TRIGGERS);
    const discordModal = document.querySelector(CONSTANTS.SELECTORS.DISCORD_MODAL);
    const discordOverlay = document.querySelector(CONSTANTS.SELECTORS.DISCORD_OVERLAY);
    const discordClose = document.querySelector(CONSTANTS.SELECTORS.DISCORD_CLOSE);

    // =========================
    // HERO SCROLL BUTTON
    // =========================
    const heroScrollButton = document.querySelector(CONSTANTS.SELECTORS.HERO_SCROLL_BUTTON);
    if (heroScrollButton) {
        heroScrollButton.addEventListener(CONSTANTS.EVENTS.CLICK, function (event) {
            event.preventDefault();
            const targetId = this.getAttribute(CONSTANTS.ATTRIBUTES.HREF);
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement && mainHeader) {
                    const headerHeight = mainHeader.offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                }
            } catch (err) {
                console.error('Error in hero scroll button:', err);
            }
        });
    }

    // =========================
    // DISCORD HUB MODAL LOGIC
    // =========================
    if (discordTriggers.length > 0 && discordModal && discordOverlay) {
        const toggleDiscordModal = () => {
            const isOpen = discordModal.classList.contains(CONSTANTS.CLASSES.ACTIVE);
            
            discordModal.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
            discordOverlay.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
            
            // NOTE: body.classList.toggle(CONSTANTS.CLASSES.NO_SCROLL) has been intentionally removed
            // to prevent the browser from snapping to the top of the page when triggered from the footer.

            if (!isOpen) {
                discordModal.setAttribute('aria-hidden', 'false');
                // Tiny timeout allows the browser to compute "position: fixed" before focusing
                setTimeout(() => {
                    trapFocus(discordModal);
                }, 50);
            } else {
                discordModal.setAttribute('aria-hidden', 'true');
                removeFocusTrap();
            }
        };

        discordTriggers.forEach(trigger => {
            trigger.addEventListener(CONSTANTS.EVENTS.CLICK, (e) => {
                e.preventDefault();
                toggleDiscordModal();
            });
        });

        if (discordClose) {
            discordClose.addEventListener(CONSTANTS.EVENTS.CLICK, toggleDiscordModal);
        }
        discordOverlay.addEventListener(CONSTANTS.EVENTS.CLICK, toggleDiscordModal);
    }

    // =========================
    // MENU POSITIONING & RESIZE (debounced)
    // =========================
    function setMenuPosition() {
        if (!navList) return;
        try {
            if (window.innerWidth <= CONSTANTS.BREAKPOINTS.MENU_COLLAPSE) {
                const headerHeight = mainHeader ? mainHeader.offsetHeight : CONSTANTS.MISC.FALLBACK_HEADER_HEIGHT;
                navList.style.top = `${headerHeight}px`;
                navList.style.height = `calc(100vh - ${headerHeight}px)`;
            } else {
                navList.style.top = '';
                navList.style.height = '';
            }
        } catch (err) {
            console.error('Error setting menu position:', err);
        }
    }
    setMenuPosition();

    // A single, debounced resize listener for performance.
    let resizeTimeout;
    window.addEventListener(CONSTANTS.EVENTS.RESIZE, () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            setMenuPosition();
            setupDesktopSubmenuFlipping(); // Re-check submenu flipping logic

            // Close mobile menu if window is resized to desktop width
            if (window.innerWidth > CONSTANTS.BREAKPOINTS.MENU_COLLAPSE) {
                if (navList.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
                    hamburger.click();
                }
            }
        }, CONSTANTS.TIMING.RESIZE_DEBOUNCE);
    });

    // =========================
    // MENU FOCUS TRAP
    // =========================
    let lastFocusedElement = null;
    let focusTrapHandler = null;

    function getFocusableElements(container) {
        try {
            return Array.from(
                container.querySelectorAll(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                )
            ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden') && el.offsetParent !== null);
        } catch (err) {
            console.error('Error getting focusable elements:', err);
            return [];
        }
    }

    function trapFocus(container) {
        lastFocusedElement = document.activeElement;
        const focusableEls = getFocusableElements(container);
        if (!focusableEls.length) return;
        
        // Prevent scroll explicitly handles the jump issue
        focusableEls[0].focus({ preventScroll: true });

        focusTrapHandler = (e) => {
            if (e.key !== 'Tab') return;
            const focusable = getFocusableElements(container);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus({ preventScroll: true });
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus({ preventScroll: true });
                }
            }
        };
        container.addEventListener(CONSTANTS.EVENTS.KEYDOWN, focusTrapHandler);
    }

    function removeFocusTrap() {
        if (focusTrapHandler) {
            // Check both potential containers to ensure cleanup
            if (navList) navList.removeEventListener(CONSTANTS.EVENTS.KEYDOWN, focusTrapHandler);
            if (discordModal) discordModal.removeEventListener(CONSTANTS.EVENTS.KEYDOWN, focusTrapHandler);
            focusTrapHandler = null;
        }
        if (lastFocusedElement) {
            lastFocusedElement.focus({ preventScroll: true });
            lastFocusedElement = null;
        }
    }

    // =========================
    // HAMBURGER MENU TOGGLE
    // =========================
    if (hamburger && navList) {
        hamburger.addEventListener(CONSTANTS.EVENTS.CLICK, (e) => {
            e.stopPropagation();
            try {
                const isExpanded = hamburger.getAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED) === 'true';
                hamburger.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, (!isExpanded).toString());
                hamburger.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
                navList.classList.toggle(CONSTANTS.CLASSES.ACTIVE);
                body.classList.toggle(CONSTANTS.CLASSES.NO_SCROLL);
                if (!navList.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
                    resetDrilldownMenus();
                    removeFocusTrap();
                } else {
                    trapFocus(navList);
                }
            } catch (err) {
                console.error('Error toggling hamburger menu:', err);
            }
        });
    }

    // =========================
    // CONSOLIDATED ESCAPE KEY HANDLING
    // =========================
    document.addEventListener(CONSTANTS.EVENTS.KEYDOWN, (e) => {
        if (e.key === 'Escape') {
            // Check and close Discord modal first if active
            if (discordModal && discordModal.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
                discordClose.click();
                return;
            }

            const openSubmenu = navList && navList.querySelector('.submenu.active, .sub-submenu.active');
            if (openSubmenu) {
                openSubmenu.classList.remove(CONSTANTS.CLASSES.ACTIVE);
                const parentLink = openSubmenu.parentElement.querySelector('a');
                if (parentLink) {
                    parentLink.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, 'false');
                    parentLink.focus({ preventScroll: true });
                }
            } else if (navList && navList.classList.contains(CONSTANTS.CLASSES.ACTIVE)) {
                hamburger.click();
            }
        }
    });

    // =========================
    // SIBLING SUBMENU CLOSING (Mobile)
    // =========================
    function closeSiblingSubmenus(parentLi) {
        try {
            const siblings = parentLi.parentElement.children;
            for (let sibling of siblings) {
                if (sibling !== parentLi && sibling.classList.contains('has-submenu')) {
                    const submenu = sibling.querySelector(CONSTANTS.SELECTORS.SUBMENU);
                    if (submenu) submenu.classList.remove(CONSTANTS.CLASSES.ACTIVE);
                    const link = sibling.querySelector('a');
                    if (link) link.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, 'false');
                }
            }
        } catch (err) {
            console.error('Error closing sibling submenus:', err);
        }
    }

    // =========================
    // SUBMENU SETUP (Mobile)
    // =========================
    function setupSubmenu(submenu, menuItem) {
        if (!submenu.querySelector('.' + CONSTANTS.CLASSES.DRILLDOWN_BACK)) {
            const backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.className = CONSTANTS.CLASSES.DRILLDOWN_BACK;
            backButton.setAttribute('tabindex', '0');
            backButton.setAttribute('aria-label', `Back to previous menu`);
            backButton.textContent = menuItem.textContent.replace(CONSTANTS.MISC.ARROW_REGEX, '').trim();
            backButton.addEventListener(CONSTANTS.EVENTS.CLICK, (e) => {
                e.stopPropagation();
                submenu.classList.remove(CONSTANTS.CLASSES.ACTIVE);
                menuItem.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, 'false');
                menuItem.focus({ preventScroll: true });
            });
            backButton.addEventListener(CONSTANTS.EVENTS.KEYDOWN, (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    backButton.click();
                }
            });
            submenu.insertBefore(backButton, submenu.firstChild);
        }
    }

    // =========================
    // SUBMENU TOGGLE & KEYBOARD NAVIGATION (Mobile)
    // =========================
    document.querySelectorAll(CONSTANTS.SELECTORS.HAS_SUBMENU_LINK).forEach(menuItem => {
        menuItem.addEventListener(CONSTANTS.EVENTS.CLICK, function (e) {
            e.preventDefault();
            try {
                if (window.innerWidth <= CONSTANTS.BREAKPOINTS.MENU_COLLAPSE) {
                    const parentLi = this.parentElement;
                    const submenu = parentLi.querySelector(CONSTANTS.SELECTORS.SUBMENU);
                    if (submenu) {
                        e.stopPropagation();
                        closeSiblingSubmenus(parentLi);
                        setupSubmenu(submenu, menuItem);
                        submenu.classList.add(CONSTANTS.CLASSES.ACTIVE);
                        menuItem.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, 'true');
                    }
                }
            } catch (err) {
                console.error('Error handling submenu click:', err);
            }
        });
        menuItem.addEventListener(CONSTANTS.EVENTS.KEYDOWN, function (e) {
            if (
                (e.key === 'Enter' || e.key === ' ') &&
                window.innerWidth <= CONSTANTS.BREAKPOINTS.MENU_COLLAPSE
            ) {
                e.preventDefault();
                try {
                    this.click();
                } catch (err) {
                    console.error('Error handling submenu keyboard navigation:', err);
                }
            }
        });
    });

    // =========================
    // DESKTOP SUBMENU FLIP LOGIC (ACCESSIBLE)
    // =========================
    function setupDesktopSubmenuFlipping() {
        const NESTED_MENU_TRIGGER_SELECTOR = '.main-nav .submenu > .has-submenu';
        const NESTED_MENU_SELECTOR = '.sub-submenu';

        document.querySelectorAll(NESTED_MENU_TRIGGER_SELECTOR).forEach(trigger => {
            const nestedMenu = trigger.querySelector(NESTED_MENU_SELECTOR);
            if (!nestedMenu) return;

            // Always remove existing listeners before attaching new ones.
            if (trigger._submenuHandlers) {
                trigger.removeEventListener(CONSTANTS.EVENTS.MOUSEENTER, trigger._submenuHandlers.handleMouseEnter);
                trigger.removeEventListener(CONSTANTS.EVENTS.MOUSELEAVE, trigger._submenuHandlers.handleMouseLeave);
                trigger.removeEventListener(CONSTANTS.EVENTS.FOCUSIN, trigger._submenuHandlers.handleMouseEnter);
                trigger.removeEventListener(CONSTANTS.EVENTS.FOCUSOUT, trigger._submenuHandlers.handleMouseLeave);
            }

            // On mobile, ensure no listeners are active and clean up.
            if (window.innerWidth <= CONSTANTS.BREAKPOINTS.MENU_COLLAPSE) {
                delete trigger._submenuHandlers;
                return;
            }

            // Define named handlers ONCE to be reused (DRY principle).
            const handleMouseEnter = () => {
                const menuRect = nestedMenu.getBoundingClientRect();
                if (menuRect.right > window.innerWidth) {
                    nestedMenu.classList.add(CONSTANTS.CLASSES.IS_FLIPPED);
                }
            };

            const handleMouseLeave = () => {
                nestedMenu.classList.remove(CONSTANTS.CLASSES.IS_FLIPPED);
            };

            // Store the handlers on the element for easy removal.
            trigger._submenuHandlers = { handleMouseEnter, handleMouseLeave };

            // Attach listeners for BOTH mouse and keyboard focus.
            trigger.addEventListener(CONSTANTS.EVENTS.MOUSEENTER, handleMouseEnter);
            trigger.addEventListener(CONSTANTS.EVENTS.MOUSELEAVE, handleMouseLeave);
            trigger.addEventListener(CONSTANTS.EVENTS.FOCUSIN, handleMouseEnter);
            trigger.addEventListener(CONSTANTS.EVENTS.FOCUSOUT, handleMouseLeave);
        });
    }
    // Initial run on page load.
    setupDesktopSubmenuFlipping();

    // =========================
    // RESET/CLOSE DRILLDOWN MENUS
    // =========================
    function resetDrilldownMenus() {
        try {
            const submenus = document.querySelectorAll(CONSTANTS.SELECTORS.SUBMENU);
            const submenuLinks = document.querySelectorAll(CONSTANTS.SELECTORS.HAS_SUBMENU_LINK);
            submenus.forEach(menu => {
                menu.classList.remove(CONSTANTS.CLASSES.ACTIVE);
            });
            submenuLinks.forEach(menuItem => {
                menuItem.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_EXPANDED, 'false');
            });
        } catch (err) {
            console.error('Error resetting drilldown menus:', err);
        }
    }

    // =========================
    // THEME TOGGLE (WITH SYSTEM PREFERENCE)
    // =========================
    if (themeToggle) {
        themeToggle.addEventListener(CONSTANTS.EVENTS.CLICK, () => {
            try {
                const currentTheme = document.documentElement.getAttribute(CONSTANTS.ATTRIBUTES.DATA_THEME);
                const newTheme = currentTheme === CONSTANTS.THEME.LIGHT ? CONSTANTS.THEME.DARK : CONSTANTS.THEME.LIGHT;
                document.documentElement.setAttribute(CONSTANTS.ATTRIBUTES.DATA_THEME, newTheme);
                themeToggle.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_PRESSED, newTheme === CONSTANTS.THEME.DARK ? "true" : "false");
                localStorage.setItem(CONSTANTS.THEME.STORAGE_KEY, newTheme);
            } catch (err) {
                console.error('Error toggling theme:', err);
            }
        });

        try {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const savedTheme = localStorage.getItem(CONSTANTS.THEME.STORAGE_KEY);
            const initialTheme = savedTheme || (prefersDark ? CONSTANTS.THEME.DARK : CONSTANTS.THEME.LIGHT);
            document.documentElement.setAttribute(CONSTANTS.ATTRIBUTES.DATA_THEME, initialTheme);
            themeToggle.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_PRESSED, initialTheme === CONSTANTS.THEME.DARK ? "true" : "false");
        } catch (err) {
            console.error('Error applying saved theme:', err);
        }
    }

    // =========================
    // COPYRIGHT YEAR AUTO-UPDATE (ARIA live)
    // =========================
    const copyrightYearSpan = document.getElementById(CONSTANTS.IDS.COPYRIGHT_YEAR);
    if (copyrightYearSpan) {
        copyrightYearSpan.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LIVE, CONSTANTS.MISC.ARIA_LIVE_POLITE);
        const updateCopyrightYear = () => {
            try {
                const currentYear = new Date().getFullYear().toString();
                if (copyrightYearSpan.textContent !== currentYear) {
                    copyrightYearSpan.textContent = currentYear;
                }
            } catch (err) {
                console.error('Error updating copyright year:', err);
            }
        };
        updateCopyrightYear();
        const dailyUpdate = setInterval(updateCopyrightYear, CONSTANTS.TIMING.MILLISECONDS_IN_A_DAY);
        window.addEventListener(CONSTANTS.EVENTS.BEFORE_UNLOAD, () => {
            clearInterval(dailyUpdate);
        });
    }

    // =========================
    // CURRENT PAGE INDICATOR (ARIA, label)
    // =========================
    function updateCurrentPageIndicator() {
        const currentPath = window.location.pathname;
        const navLinks = [
            ...document.querySelectorAll(CONSTANTS.SELECTORS.NAV_LINKS),
            ...document.querySelectorAll(CONSTANTS.SELECTORS.FOOTER_NAV_LINKS),
        ];
        navLinks.forEach(link => {
            if (link.href && !link.href.endsWith('#')) {
                try {
                    const linkPath = new URL(link.href).pathname;
                    const isActive = linkPath === currentPath;
                    if (isActive) {
                        link.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_CURRENT, CONSTANTS.MISC.ARIA_CURRENT_VALUE);
                    } else {
                        link.removeAttribute(CONSTANTS.ATTRIBUTES.ARIA_CURRENT);
                    }
                    const navParent = link.closest('nav');
                    const navLabel = navParent ? navParent.getAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL) : '';
                    const linkLabel = link.textContent.trim();
                    const fullLabel = `${linkLabel}${navLabel ? ` (${navLabel})` : ''}${isActive ? CONSTANTS.LABELS.CURRENT_PAGE_SUFFIX : ''}`;
                    link.setAttribute(CONSTANTS.ATTRIBUTES.ARIA_LABEL, fullLabel);
                } catch (e) {
                    console.error('Error updating nav link:', e);
                }
            }
        });
    }
    updateCurrentPageIndicator();

    // =========================
    // EXTERNAL LINK DETECTION
    // =========================
    function updateExternalLinkAttributes(scope = document) {
        try {
            const links = scope.querySelectorAll('a[href]:not(.download-link)');
            links.forEach(link => {
                if (link.classList.contains('download-link')) return;
                const linkUrl = new URL(link.href, window.location.origin);
                if (linkUrl.origin !== window.location.origin) {
                    link.target = CONSTANTS.MISC.EXTERNAL_LINK_TARGET;
                    link.rel = CONSTANTS.MISC.EXTERNAL_LINK_REL;
                    if (!Array.from(link.children).some(child => child.classList && child.classList.contains('visually-hidden'))) {
                        const warningSpan = document.createElement('span');
                        warningSpan.className = 'visually-hidden';
                        warningSpan.textContent = CONSTANTS.LABELS.EXTERNAL_LINK_SUFFIX;
                        link.appendChild(warningSpan);
                    }
                }
            });
        } catch (err) {
            console.error('Error updating external link attributes:', err);
        }
    }
    updateExternalLinkAttributes();

    // =========================
    // ARIA ROLES FOR NAVIGATION
    // =========================
    const nav = document.querySelector('nav.main-nav');
    if (nav) nav.setAttribute('role', 'navigation');
    document.querySelectorAll('.nav-list, .submenu, .sub-submenu').forEach(ul => {
        ul.setAttribute('role', 'menu');
        Array.from(ul.children).forEach(li => {
            li.setAttribute('role', 'none');
            const link = li.querySelector('a, button');
            if (link) link.setAttribute('role', 'menuitem');
        });
    });
});
