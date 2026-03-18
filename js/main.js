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
        SEL: {
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
        CLS: {
            ACTIVE: 'active',
            BACK: 'drilldown-back',
        },
        BP: {
            MOBILE: 992,
        },
        THEME_KEY: 'theme'
    };

    // =========================
    // DOM CACHE
    // =========================
    const el = {
        hamburger: document.querySelector(C.SEL.HAMBURGER),
        nav: document.querySelector(C.SEL.NAV_LIST),
        header: document.querySelector(C.SEL.MAIN_HEADER),
        themeToggle: document.getElementById('theme-toggle'),
        submenuLinks: document.querySelectorAll(C.SEL.HAS_SUBMENU_LINK),
        submenus: document.querySelectorAll(C.SEL.SUBMENU),
        discordModal: document.querySelector(C.SEL.DISCORD_MODAL),
        discordOverlay: document.querySelector(C.SEL.DISCORD_OVERLAY),
        discordTriggers: document.querySelectorAll(C.SEL.DISCORD_TRIGGERS),
        discordClose: document.querySelector(C.SEL.DISCORD_CLOSE),
    };

    // =========================
    // STATE
    // =========================
    const state = {
        isMobile: window.matchMedia(`(max-width:${C.BP.MOBILE}px)`).matches,
        activeTrapContainer: null,
        activeTrapHandler: null,
        lastFocus: null,
    };

    // =========================
    // UTIL: SCROLL LOCK
    // =========================
    let scrollLocks = 0;
    let scrollBarWidth = '0px';
    
    function setScrollLock(lock) {
        const body = document.body;
        if (!body) return;

        if (lock) {
            if (scrollLocks === 0) {
                scrollBarWidth = `${window.innerWidth - document.documentElement.clientWidth}px`;
            }
            scrollLocks++;
        } else if (scrollLocks > 0) {
            scrollLocks--;
        }

        if (scrollLocks > 0) {
            body.style.overflow = 'hidden';
            body.style.paddingRight = scrollBarWidth;
            el.header && (el.header.style.paddingRight = scrollBarWidth);
        } else {
            body.style.overflow = '';
            body.style.paddingRight = '';
            el.header && (el.header.style.paddingRight = '');
        }
    }

    // CROSS-SCRIPT COMMUNICATION: Listen for cards requesting a scroll lock
    window.addEventListener('requestScrollLock', e => {
        if (e.detail && typeof e.detail.lock === 'boolean') {
            setScrollLock(e.detail.lock);
        }
    });

    // =========================
    // UTIL: FOCUS TRAP
    // =========================
    function getFocusable(container) {
        return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
            .filter(n => n.offsetParent !== null);
    }

    function activateTrap(container) {
        if (!container) return;

        deactivateTrap(); // Ensure single trap BEFORE checking focusables

        const focusables = getFocusable(container);
        if (!focusables.length) return; // Prevent dead zones

        const active = document.activeElement;
        state.lastFocus = (active && active !== document.body) ? active : null;
        state.activeTrapContainer = container;

        focusables[0].focus({ preventScroll: true });

        const handler = e => {
            if (e.key !== 'Tab') return;

            const items = getFocusable(container);
            if (!items.length) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus({ preventScroll: true });
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus({ preventScroll: true });
            }
        };

        state.activeTrapHandler = handler;
        container.addEventListener('keydown', handler);
    }

    function deactivateTrap() {
        const c = state.activeTrapContainer;
        if (!c) return;

        c.removeEventListener('keydown', state.activeTrapHandler);
        
        state.activeTrapHandler = null;
        state.activeTrapContainer = null;

        if (state.lastFocus && document.contains(state.lastFocus) && state.lastFocus.offsetParent !== null) {
            state.lastFocus.focus({ preventScroll: true });
        }
    }

    // =========================
    // MODAL
    // =========================
    function toggleModal(force) {
        const { discordModal, discordOverlay } = el;
        if (!discordModal || !discordOverlay) return;

        const open = force ?? !discordModal.classList.contains(C.CLS.ACTIVE);

        discordModal.classList.toggle(C.CLS.ACTIVE, open);
        discordOverlay.classList.toggle(C.CLS.ACTIVE, open);
        discordModal.setAttribute('aria-hidden', String(!open));

        setScrollLock(open);
        
        if (open) {
            requestAnimationFrame(() => activateTrap(discordModal));
        } else {
            deactivateTrap();
        }
    }

    el.discordTriggers.forEach(t =>
        t.addEventListener('click', e => {
            e.preventDefault();
            toggleModal(true);
        })
    );

    el.discordClose?.addEventListener('click', () => toggleModal(false));
    el.discordOverlay?.addEventListener('click', () => toggleModal(false));

    // =========================
    // MENU
    // =========================
    function resetSubmenus() {
        el.submenus.forEach(m => m.classList.remove(C.CLS.ACTIVE));
        el.submenuLinks.forEach(l => l.setAttribute('aria-expanded', 'false'));
    }

    function closeMenu() {
        if (!el.nav) return;

        el.nav.classList.remove(C.CLS.ACTIVE);
        el.hamburger?.classList.remove(C.CLS.ACTIVE);
        el.hamburger?.setAttribute('aria-expanded', 'false');

        resetSubmenus();
        deactivateTrap();
        setScrollLock(false);
    }

    el.hamburger?.addEventListener('click', e => {
        e.stopPropagation();

        const open = el.nav.classList.toggle(C.CLS.ACTIVE);
        el.hamburger.classList.toggle(C.CLS.ACTIVE, open);
        el.hamburger.setAttribute('aria-expanded', open);

        if (open) {
            setScrollLock(true);
            activateTrap(el.nav);
        } else {
            closeMenu();
        }
    });

    // =========================
    // SUBMENUS
    // =========================
    el.submenuLinks.forEach(link => {
        const submenu = link.parentElement?.querySelector(C.SEL.SUBMENU);
        if (!submenu) return;

        function openSubmenu(e) {
            if (!state.isMobile) return;
            e.preventDefault();
            e.stopPropagation();

            if (submenu.classList.contains(C.CLS.ACTIVE)) return;

            // Close other submenus to control stacking and sync ARIA
            el.submenus.forEach(m => {
                if (m !== submenu) {
                    m.classList.remove(C.CLS.ACTIVE);
                    const parentLink = m.parentElement?.querySelector(':scope > a');
                    parentLink?.setAttribute('aria-expanded', 'false');
                }
            });

            submenu.classList.add(C.CLS.ACTIVE);
            link.setAttribute('aria-expanded', 'true');
        }

        link.addEventListener('click', openSubmenu);
        link.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                openSubmenu(e);
            }
        });
    });

    // =========================
    // NAV DELEGATION
    // =========================
    el.nav?.addEventListener('click', e => {
        const back = e.target.closest('.' + C.CLS.BACK);
        if (back) {
            const submenu = back.closest(C.SEL.SUBMENU);
            submenu?.classList.remove(C.CLS.ACTIVE);

            const parentLink = submenu?.parentElement?.querySelector(':scope > a');
            parentLink?.setAttribute('aria-expanded', 'false');
            parentLink?.focus({ preventScroll: true });
            return;
        }

        const link = e.target.closest('a');
        if (!link || link.parentElement.classList.contains('has-submenu')) return;

        closeMenu();
    });

    // =========================
    // ESC HANDLER
    // =========================
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;

        if (el.discordModal?.classList.contains(C.CLS.ACTIVE)) {
            toggleModal(false);
            return;
        }

        if (el.nav?.classList.contains(C.CLS.ACTIVE)) {
            const openSub = el.nav.querySelector(C.SEL.SUBMENU + '.' + C.CLS.ACTIVE);
            if (openSub) {
                openSub.classList.remove(C.CLS.ACTIVE);
                
                const parentLink = openSub.parentElement?.querySelector(':scope > a');
                parentLink?.setAttribute('aria-expanded', 'false');
                parentLink?.focus({ preventScroll: true });
                
                return;
            }
            closeMenu();
        }
    });

    // =========================
    // MEDIA QUERY
    // =========================
    const mq = window.matchMedia(`(max-width:${C.BP.MOBILE}px)`);
    const handleMqChange = e => {
        state.isMobile = e.matches;
        if (!state.isMobile) closeMenu();
    };
    
    // Support legacy Safari
    if (mq.addEventListener) {
        mq.addEventListener('change', handleMqChange);
    } else {
        mq.addListener(handleMqChange);
    }

    // =========================
    // THEME
    // =========================
    if (el.themeToggle) {
        const saved =
            localStorage.getItem(C.THEME_KEY) ||
            (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        document.documentElement.dataset.theme = saved;
        el.themeToggle.setAttribute('aria-pressed', saved === 'dark');

        el.themeToggle.addEventListener('click', () => {
            const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = next;
            el.themeToggle.setAttribute('aria-pressed', next === 'dark');
            localStorage.setItem(C.THEME_KEY, next);
        });
    }

    // =========================
    // DEFERRED TASKS
    // =========================
    scheduleTask(() => {
        const copyYear = document.getElementById('copyright-year');
        if (copyYear) copyYear.textContent = new Date().getFullYear();

        document.querySelector('nav.main-nav')?.setAttribute('role', 'navigation');

        const path = location.pathname;

        document.querySelectorAll('.nav-list a, .footer-nav a').forEach(link => {
            try {
                if (new URL(link.href, location.origin).pathname === path) {
                    link.setAttribute('aria-current', 'page');
                }
            } catch {}
        });

        document.querySelectorAll('a[href^="http"]').forEach(link => {
            try {
                if (new URL(link.href).hostname !== location.hostname &&
                    !link.classList.contains('download-link')) {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
            } catch {}
        });

        // Lite YouTube
        document.querySelectorAll('.lite-youtube').forEach(w => {
            w.addEventListener('click', function () {
                const id = this.dataset.videoId;
                if (!id) return;

                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
                iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
                iframe.allowFullscreen = true;
                iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';

                this.innerHTML = '';
                this.appendChild(iframe);
            }, { once: true });
        });
    });

    // =========================
    // BF CACHE FIX
    // =========================
    window.addEventListener('pageshow', e => {
        if (e.persisted) closeMenu();
    });
});