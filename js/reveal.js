// Shared scroll experience: reveal-on-scroll with per-group stagger and a
// single rAF-throttled parallax variable. Pure transform/opacity, no layout reads
// in the scroll path except one getBoundingClientRect per parallax element.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Writeup pages: tag content blocks so they share the portfolio's reveal language.
  const AUTO = ['.writeups-collection', '.card > .section-heading', '.card > p', '.card > ul', '.card > ol', '.code-block', '.table-wrap', '.card img', '.update'];
  const STEP = 60;
  const MAX_DELAY = 360;

  const run = () => {
    if (document.body.classList.contains('challenge-body')) {
      document.querySelectorAll(AUTO.join(',')).forEach((el) => {
        if (!el.closest('[data-reveal]')) el.setAttribute('data-reveal', '');
      });
    }
    const targets = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        // Elements entering together cascade in reading order; nothing ever waits
        // on content further down the page.
        entries.filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((entry, index) => {
            entry.target.style.setProperty('--delay', `${Math.min(index * STEP, MAX_DELAY)}ms`);
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach((el) => observer.observe(el));
    }

    const layers = [...document.querySelectorAll('[data-parallax]')];
    if (reduced || !layers.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      layers.forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) return;
        const factor = Number(el.dataset.parallax) || 0.08;
        const offset = (box.top + box.height / 2 - vh / 2) * -factor;
        el.style.setProperty('--parallax', Math.max(-60, Math.min(60, offset)).toFixed(1));
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  };

  // Run after other DOMContentLoaded enhancers (TOC, code blocks) have built their markup.
  const start = () => window.setTimeout(run, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
