import { initNavigation } from './navigation.js';
import { initAnimations, initCertificateSlider, initStrengthsScroller, initWriteupsGallery } from './animations.js';
import { initI18n } from './i18n.js';
import { initFeatures } from './features.js';
import { initPgpChannel, encryptForRecipient } from './pgp.js';
import { t } from './i18n.js';
import { initCyberRain } from './cyber-rain.js';

document.addEventListener('DOMContentLoaded', async () => {
  initCyberRain();
  initNavigation();
  initAnimations();
  initStrengthsScroller();
  initWriteupsGallery();
  initCertificateSlider();
  await initI18n();
  document.querySelector('[data-year]').textContent = new Date().getFullYear();
  initCopyButtons();
  initContactForm();
  initPgpChannel();
  loadHackTheBoxStats();
  initCountUp();
  initExperienceTimeline();
  initFeatures();
});

// Experience: tech chips from the translated stack line + spine progress on scroll.
function initExperienceTimeline() {
  const timeline = document.querySelector('[data-xp-timeline]');
  if (!timeline) return;
  const buildChips = (source) => {
    const target = source.parentElement.querySelector('.xp-stack');
    if (!target) return;
    const text = source.textContent.replace(/^[^:]*:\s*/, '').replace(/,?\s*(etc|etc\.)\.?$/i, '');
    target.replaceChildren(...text.split(',').map((item) => item.trim()).filter(Boolean).map((item) => {
      const chip = document.createElement('span');
      chip.textContent = item;
      return chip;
    }));
  };
  timeline.querySelectorAll('.xp-stack-source').forEach((source) => {
    buildChips(source);
    new MutationObserver(() => buildChips(source)).observe(source, { childList: true, characterData: true, subtree: true });
  });

  const fill = timeline.querySelector('.xp-spine i');
  const items = [...timeline.querySelectorAll('.xp-item')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const box = timeline.getBoundingClientRect();
    const anchor = window.innerHeight * .6;
    const progress = Math.max(0, Math.min(1, (anchor - box.top) / box.height));
    fill?.style.setProperty('--xp-progress', progress.toFixed(4));
    items.forEach((item) => {
      const marker = item.querySelector('.xp-marker');
      const top = marker ? marker.getBoundingClientRect().top + marker.offsetHeight / 2 : Infinity;
      item.classList.toggle('is-reached', top <= anchor);
    });
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}

// Count numbers up from zero the first time they scroll into view.
function initCountUp() {
  const targets = document.querySelectorAll('[data-count]');
  if (!targets.length || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target;
      const end = Number(el.dataset.count);
      if (!Number.isFinite(end) || end <= 0) return;
      const prefix = el.textContent.trim().startsWith('#') ? '#' : '';
      const start = performance.now();
      const duration = 1200;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  targets.forEach((el) => observer.observe(el));
}

function initHtbDepth() {
  const network = document.querySelector('.htb-network');
  if (!network || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [network.querySelector('.htb-hub'), ...network.querySelectorAll('.htb-stat-card')].filter(Boolean);
  let mouseX = 0;

  const calcAngleDegrees = (x, y) => x > 0
    ? Math.atan2(y, x) * 180 / Math.PI
    : Math.atan2(y, x) * 180 / Math.PI - 180;

  const placeCards = (nextMouseX = 0) => {
    mouseX = nextMouseX;
    const width = network.clientWidth;
    const height = network.clientHeight;
    const rx = Math.min(900, width * .30);
    const ry = Math.min(900, height * .34);

    cards.forEach((card, index) => {
      const theta = (((180 / cards.length) / 180) * index * Math.PI)
        - Math.PI
        + (Math.PI / cards.length) / 2
        - mouseX * (Math.PI / cards.length) * .45;
      const posx = Math.round(rx * Math.cos(theta));
      const posy = Math.round(ry * Math.sin(theta)) + ry * .55;
      const posZ = 30 - Math.abs(posx);
      const angle = calcAngleDegrees(posx, posy);
      card.style.transform = `translate3d(${posx}px, ${posy}px, ${posZ}px) rotate(${angle}deg)`;
    });
  };

  placeCards();
  window.addEventListener('resize', () => placeCards(mouseX), { passive: true });
  network.addEventListener('pointermove', (event) => {
    const bounds = network.getBoundingClientRect();
    const xNorm = (event.clientX - bounds.left) / (bounds.width / 2) - 1;
    placeCards(Math.max(-1, Math.min(1, xNorm)));
  });
  network.addEventListener('pointerleave', () => placeCards(0));
}

function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = document.documentElement.lang === 'fr' ? 'Copié !' : 'Copied!';
        setTimeout(() => { button.textContent = original; }, 1400);
      } catch { window.location.href = `mailto:${button.dataset.copy}`; }
    });
  });
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('button[type="submit"]');
  const encryptToggle = form.querySelector('[data-pgp-encrypt]');
  const encryptHelp = form.querySelector('[data-pgp-encrypt-help]');
  const endpoint = window.__APP_CONFIG__?.contactSheetEndpoint?.trim();
  const setStatus = (key, state) => {
    status.textContent = t(key);
    status.dataset.state = state;
  };

  // Encryption is only offered once a key has been retrieved and validated.
  const syncHelp = () => {
    const key = encryptToggle?.checked ? 'custom.pgp.encryptHelpOn' : 'custom.pgp.encryptHelpOff';
    if (encryptHelp) { encryptHelp.dataset.i18n = key; encryptHelp.textContent = t(key); }
  };
  document.addEventListener('pgp:state', ({ detail }) => {
    if (!encryptToggle) return;
    const usable = detail.state === 'verified' || detail.state === 'unpinned';
    encryptToggle.disabled = !usable;
    if (!usable) encryptToggle.checked = false;
    syncHelp();
  });
  encryptToggle?.addEventListener('change', syncHelp);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!endpoint) return setStatus('custom.form.notConfigured', 'error');
    submit.disabled = true;
    const data = Object.fromEntries(new FormData(form).entries());
    const encrypt = data.__encrypt === 'on';
    delete data.__encrypt;
    let payload = data;

    if (encrypt) {
      setStatus('custom.form.encrypting', 'pending');
      try {
        const plaintext = `Subject: ${data.subject || ''}\n\n${data.message || ''}`;
        const ciphertext = await encryptForRecipient(plaintext);
        // Only metadata needed to reply stays readable; subject and body leave as ciphertext.
        payload = { name: data.name, email: data.email, organization: data.organization, subject: '[OpenPGP encrypted]', message: ciphertext, encryption: 'openpgp' };
      } catch (error) {
        // Fail closed: never fall back to sending the plaintext.
        submit.disabled = false;
        return setStatus('custom.form.encryptFailed', 'error');
      }
    }

    setStatus('custom.form.sending', 'pending');
    try {
      // no-cors: Apps Script does not return CORS headers, so the response is opaque and
      // delivery cannot be confirmed from the browser. Report "submitted", not "delivered".
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      form.reset();
      syncHelp();
      setStatus(encrypt ? 'custom.form.sentEncrypted' : 'custom.form.sent', 'success');
    } catch (error) {
      setStatus('custom.form.failed', 'error');
    } finally { submit.disabled = false; }
  });
}

async function loadHackTheBoxStats() {
  try {
    const response = await fetch('assets/data/htb.json', { cache: 'no-store' });
    if (!response.ok) return;
    const { profile } = await response.json();
    const values = {
      '[data-htb-rank]': profile.rank,
      '[data-htb-points]': profile.points,
      '[data-htb-machines]': profile.system_owns,
      '[data-htb-users]': profile.user_owns,
      // Only overrides the authored value when the export actually provides it.
      '[data-htb-challenges]': profile.challenge_owns,
      '[data-htb-ranking]': `#${profile.ranking}`
    };
    Object.entries(values).forEach(([selector, value]) => {
      const target = document.querySelector(selector);
      if (!target || value === undefined) return;
      target.textContent = value;
      const numeric = String(value).replace(/[^0-9]/g, '');
      if (numeric && target.hasAttribute('data-count')) target.dataset.count = numeric;
    });
    const progress = Number(profile.rank_ownership);
    if (Number.isFinite(progress)) {
      const bar = document.querySelector('[data-htb-progress]');
      const label = document.querySelector('[data-htb-progress-label]');
      const pct = Math.max(0, Math.min(100, progress)).toFixed(1);
      bar?.style.setProperty('--progress', `${pct}%`);
      bar?.setAttribute('aria-valuenow', pct);
      if (label) label.textContent = `${pct}%`;
    }
    const next = document.querySelector('[data-htb-next]');
    if (next && profile.next_rank) next.textContent = profile.next_rank;
  } catch (error) { console.warn('Hack The Box data unavailable:', error); }
}
