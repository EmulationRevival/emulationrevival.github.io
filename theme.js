// theme.js - Critical script to apply theme class ASAP to <html>

(function() {
    // This IIFE (Immediately Invoked Function Expression) runs right away.
    const htmlElement = document.documentElement;

    function applyInitialThemeClass(theme) {
        if (theme === 'light') {
            htmlElement.classList.add('light-theme');
        } else { // 'dark' or no preference (defaults to dark if no class is added)
            htmlElement.classList.remove('light-theme');
        }
    }

    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyInitialThemeClass(savedTheme);
            return; 
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            applyInitialThemeClass('light');
        } else {
            applyInitialThemeClass('dark'); 
        }
    } catch (e) {
        console.warn("Initial theme application (in theme.js) failed:", e);
        htmlElement.classList.remove('light-theme'); // Fallback
    }
})();