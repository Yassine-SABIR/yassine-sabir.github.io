export function initNavigation() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-navigation]');
  const links = [...document.querySelectorAll('[data-navigation] a[href^="#"]')];

  const setIcon = (open) => {
    const icon = toggle?.querySelector('i');
    icon?.classList.toggle('fa-bars', !open);
    icon?.classList.toggle('fa-xmark', open);
    toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  const closeMenu = () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    setIcon(false);
    document.body.classList.remove('menu-open');
  };

  toggle?.addEventListener('click', () => {
    const open = !nav?.classList.contains('is-open');
    nav?.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    setIcon(open);
    document.body.classList.toggle('menu-open', open);
  });

  links.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu();
      toggle?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (nav?.classList.contains('is-open') && !header?.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
  window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true });

  // Every section drives the active link; sections without their own nav entry
  // (HTB, picoCTF, achievements…) inherit the closest preceding linked section.
  const linkFor = new Map();
  let current = null;
  document.querySelectorAll('main > section').forEach((section) => {
    const own = links.find((link) => link.getAttribute('href') === `#${section.id}`);
    if (own) current = own;
    if (current) linkFor.set(section, current);
  });
  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
      const active = [...visible].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      if (!active) return;
      const target = linkFor.get(active);
      links.forEach((link) => {
        const on = link === target;
        link.classList.toggle('active', on);
        if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55%' });
    linkFor.forEach((_, section) => observer.observe(section));
  }
}
