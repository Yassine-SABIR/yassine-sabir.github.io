// Shared theme controller — the only place that toggles light/dark.
// Loaded as a classic script on every page; the inline <head> snippet only
// sets the initial theme to avoid a flash.
(function () {
  const KEY = 'portfolio-theme';
  const root = document.documentElement;
  const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
  const sync = () => {
    const theme = current();
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      button.setAttribute('aria-pressed', String(theme === 'light'));
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6faf8' : '#0b111b');
  };
  const set = (theme) => {
    root.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch (error) { /* storage unavailable */ }
    sync();
  };
  const init = () => {
    sync();
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-theme-toggle]')) set(current() === 'light' ? 'dark' : 'light');
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
