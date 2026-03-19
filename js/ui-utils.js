export const scheduleTask = window.requestIdleCallback || (cb =>
  setTimeout(() => cb({ timeRemaining: () => 0 }), 200)
);

export function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null);
}

export function createFocusTrap() {
  let activeContainer = null;
  let activeHandler = null;
  let lastFocus = null;

  function activate(container) {
    if (!container) return;

    deactivate();

    const focusables = getFocusableElements(container);
    if (!focusables.length) return;

    const active = document.activeElement;
    lastFocus = active && active !== document.body ? active : null;
    activeContainer = container;

    focusables[0].focus({ preventScroll: true });

    activeHandler = event => {
      if (event.key !== 'Tab') return;

      const items = getFocusableElements(container);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    container.addEventListener('keydown', activeHandler);
  }

  function deactivate() {
    if (!activeContainer) return;

    activeContainer.removeEventListener('keydown', activeHandler);
    activeContainer = null;
    activeHandler = null;

    if (lastFocus && document.contains(lastFocus) && lastFocus.offsetParent !== null) {
      lastFocus.focus({ preventScroll: true });
    }

    lastFocus = null;
  }

  return {
    activate,
    deactivate,
  };
}