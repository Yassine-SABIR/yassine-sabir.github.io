(function () {
  const qs = (selector, ctx = document) => ctx.querySelector(selector);
  const qsa = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const config = window.__APP_CONFIG__ || {};

  const state = {
    lang: 'en',
    theme: 'dark',
    translations: {},
    htb: {
      rank: 'Pro Hacker',
      nextRank: 'Elite Hacker',
      points: 102,
      ranking: 854,
      systemOwns: 103,
      userOwns: 111
    }
  };

  const htbElements = {
    rankValue: qs('[data-htb="rank-value"]'),
    rankMeta: qs('[data-htb="rank-meta"]'),
    pointsValue: qs('[data-htb="points-value"]'),
    pointsMeta: qs('[data-htb="points-meta"]'),
    systemsValue: qs('[data-htb="systems-value"]'),
    systemsMeta: qs('[data-htb="systems-meta"]'),
    usersValue: qs('[data-htb="users-value"]'),
    usersMeta: qs('[data-htb="users-meta"]'),
    avatar: qs('[data-htb="avatar"]')
  };

  const themeToggle = qs('[data-theme-toggle]');
  const THEME_STORAGE_KEY = 'portfolio-theme';

  const updateYear = () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  };

  const loadTranslations = () => fetch('translations.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data && typeof data === 'object') {
        state.translations = data;
      }
    })
    .catch((error) => {
      console.warn('Translations unavailable', error);
      state.translations = {};
    });

  const formatOrdinal = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return String(value);
    }
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 13) {
      return `${num}th`;
    }
    switch (num % 10) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };

  const renderHackTheBox = () => {
    const data = state.htb;
    const lang = state.lang;

    if (htbElements.rankValue) {
      htbElements.rankValue.textContent = ensureNonBreakingSpace(data.rank);
    }

    // Avatar remains the static placeholder image.

    if (lang === 'fr') {
      if (htbElements.rankMeta) {
        htbElements.rankMeta.textContent = `Progression vers ${data.nextRank}`;
      }
      if (htbElements.pointsValue) {
        htbElements.pointsValue.textContent = `${data.points} pts`;
      }
      if (htbElements.pointsMeta) {
        htbElements.pointsMeta.textContent = `Classe ${data.ranking}e mondiale`;
      }
      if (htbElements.systemsValue) {
        htbElements.systemsValue.textContent = String(data.systemOwns);
      }
      if (htbElements.systemsMeta) {
        htbElements.systemsMeta.textContent = 'Compromission complete des cibles';
      }
      if (htbElements.usersValue) {
        htbElements.usersValue.textContent = String(data.userOwns);
      }
      if (htbElements.usersMeta) {
        htbElements.usersMeta.textContent = 'Trophees niveau utilisateur';
      }
    } else {
      if (htbElements.rankMeta) {
        htbElements.rankMeta.textContent = `Tracking progress toward ${data.nextRank}`;
      }
      if (htbElements.pointsValue) {
        htbElements.pointsValue.textContent = `${data.points} pts`;
      }
      if (htbElements.pointsMeta) {
        htbElements.pointsMeta.textContent = `Ranked ${formatOrdinal(data.ranking)} worldwide`;
      }
      if (htbElements.systemsValue) {
        htbElements.systemsValue.textContent = String(data.systemOwns);
      }
      if (htbElements.systemsMeta) {
        htbElements.systemsMeta.textContent = 'Full compromise of target hosts';
      }
      if (htbElements.usersValue) {
        htbElements.usersValue.textContent = String(data.userOwns);
      }
      if (htbElements.usersMeta) {
        htbElements.usersMeta.textContent = 'User-level access trophies';
      }
    }
  };

  const getTranslation = (lang, key, fallback) => {
    const dict = state.translations && state.translations[lang];
    if (dict && typeof dict[key] === 'string') {
      return dict[key];
    }
    const en = state.translations && state.translations.en;
    if (en && typeof en[key] === 'string') {
      return en[key];
    }
    return fallback;
  };

  const updateThemeToggleUI = () => {
    if (!themeToggle) {
      return;
    }
    const lang = state.lang;
    const theme = state.theme;
    const ariaKey = theme === 'light' ? 'theme.toggle.aria.light' : 'theme.toggle.aria.dark';
    const ariaFallback = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
    themeToggle.setAttribute('aria-label', getTranslation(lang, ariaKey, ariaFallback));
    themeToggle.dataset.i18nAria = ariaKey;
    themeToggle.classList.toggle('is-light', theme === 'light');
    themeToggle.classList.toggle('is-dark', theme !== 'light');
  };

  const applyTheme = (theme, persist = true) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    state.theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        console.warn('Unable to persist theme preference', error);
      }
    }
    updateThemeToggleUI();
  };

  const navToggle = qs('.nav-toggle');
  const nav = qs('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
  }

  const backToTop = qs('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  qsa('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
      } catch (error) {
        console.error('Clipboard copy failed', error);
      }
    });
  });

  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  const normalizeLines = (value) => (typeof value === 'string' ? value.replace(/\\n/g, '\n') : '');
  const ensureNonBreakingSpace = (value) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.replace(/\s+/, ' ');
  };

  const initCertificateSlider = () => {
    const slider = qs('[data-certificate-slider]');
    if (!slider) {
      return;
    }

    const viewport = qs('[data-slider-window]', slider);
    const track = qs('[data-slider-track]', slider);
    const slides = qsa('[data-slide]', slider);
    const prevBtn = qs('[data-slider-prev]', slider);
    const nextBtn = qs('[data-slider-next]', slider);
    const status = qs('[data-slider-status]', slider);

    if (!viewport || !track || !slides.length) {
      return;
    }

    let currentIndex = 0;

    if (prefersReducedMotion.matches) {
      track.style.transition = 'none';
    }

    const clampIndex = (value) => Math.min(Math.max(value, 0), slides.length - 1);

    const statusParts = () => (state.lang === 'fr'
      ? { label: 'Certificat', connector: 'sur' }
      : { label: 'Certificate', connector: 'of' });

    const updateStatus = () => {
      if (status) {
        const { label, connector } = statusParts();
        status.textContent = `${label} ${currentIndex + 1} ${connector} ${slides.length}`;
      }
      if (prevBtn) {
        prevBtn.disabled = currentIndex <= 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= slides.length - 1;
      }
    };

    const applyTransform = () => {
      const target = slides[currentIndex];
      if (!target) {
        return;
      }
      const offset = target.offsetLeft;
      track.style.transform = `translateX(-${offset}px)`;
    };

    const scrollToIndex = (index) => {
      currentIndex = clampIndex(index);
      updateStatus();
      applyTransform();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        scrollToIndex(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        scrollToIndex(currentIndex + 1);
      });
    }

    const handleResize = () => {
      requestAnimationFrame(() => {
        applyTransform();
      });
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('langchange', updateStatus);

    updateStatus();
    applyTransform();
  };

  const animateTerminal = (terminal) => {
    if (terminal.dataset.started === 'true') {
      return;
    }
    terminal.dataset.started = 'true';

    const commandEl = qs('[data-terminal-command]', terminal);
    const outputEl = qs('[data-terminal-output]', terminal);
    const hintLine = qs('[data-terminal-hint]', terminal);
    const cursorEl = qs('[data-terminal-cursor]', terminal);

    const commandEn = terminal.dataset.commandEn || (commandEl ? commandEl.textContent : '');
    const outputEn = (() => {
      if (outputEl) {
        const existing = outputEl.textContent;
        const stored = normalizeLines(terminal.dataset.outputEn || existing);
        terminal.dataset.outputEn = stored;
        return stored;
      }
      return '';
    })();

    const finish = () => {
      if (cursorEl) {
        cursorEl.classList.add('blinking');
      }
      if (hintLine) {
        hintLine.classList.add('visible');
      }
    };

    if (prefersReducedMotion.matches) {
      if (commandEl) {
        commandEl.textContent = commandEn;
      }
      if (outputEl) {
        outputEl.textContent = outputEn;
      }
      finish();
      return;
    }

    if (commandEl) {
      commandEl.textContent = '';
    }
    if (outputEl) {
      outputEl.textContent = '';
    }

    let charIndex = 0;
    const typeCommand = () => {
      if (!commandEl) {
        revealOutput();
        return;
      }
      if (charIndex <= commandEn.length) {
        commandEl.textContent = commandEn.slice(0, charIndex);
        charIndex += 1;
        setTimeout(typeCommand, 55);
      } else {
        revealOutput();
      }
    };

    let lineIndex = 0;
    const outputLines = outputEn.split('\n');
    const revealOutput = () => {
      if (!outputEl) {
        finish();
        return;
      }
      if (lineIndex < outputLines.length) {
        if (lineIndex > 0) {
          outputEl.textContent += '\n';
        }
        outputEl.textContent += outputLines[lineIndex];
        lineIndex += 1;
        setTimeout(revealOutput, 35);
      } else {
        finish();
      }
    };

    typeCommand();
  };

  const initTerminalAnimations = () => {
    const terminals = qsa('[data-terminal]');
    if (!terminals.length) {
      return;
    }

    if ('IntersectionObserver' in window && !prefersReducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateTerminal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.45 });

      terminals.forEach((terminal) => observer.observe(terminal));
    } else {
      terminals.forEach(animateTerminal);
    }
  };

  const initLanguageToggle = () => {
    const switcher = qs('[data-lang-switcher]');
    if (!switcher) {
      return;
    }

    const trigger = qs('[data-lang-trigger]', switcher);
    const menu = qs('[data-lang-menu]', switcher);
    const options = qsa('[data-lang-option]', switcher);
    const selectedLabel = qs('[data-lang-selected]', switcher);
    const selectedFlag = qs('[data-lang-flag]', switcher);

    if (!trigger || !menu || !options.length) {
      return;
    }

    menu.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    const textElements = qsa('[data-i18n]');
    const placeholderElements = qsa('[data-i18n-placeholder]');

    textElements.forEach((el) => {
      if (!el.dataset.i18nDefault) {
        el.dataset.i18nDefault = el.innerHTML;
      }
    });

    placeholderElements.forEach((el) => {
      if (!el.dataset.i18nPlaceholderDefault) {
        el.dataset.i18nPlaceholderDefault = el.getAttribute('placeholder') || '';
      }
    });

    let isMenuOpen = false;

    const closeMenu = () => {
      if (!isMenuOpen) {
        return;
      }
      isMenuOpen = false;
      switcher.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    };

    const focusActiveOption = () => {
      const activeOption = options.find((option) => option.dataset.langOption === state.lang);
      if (activeOption) {
        activeOption.focus();
      } else if (options.length) {
        options[0].focus();
      }
    };

    const openMenu = () => {
      if (isMenuOpen) {
        return;
      }
      isMenuOpen = true;
      switcher.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      focusActiveOption();
    };

    const toggleMenu = () => {
      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    const applyLanguage = (lang) => {
      const nextLang = lang === 'fr' ? 'fr' : 'en';
      state.lang = nextLang;

      textElements.forEach((el) => {
        const key = el.dataset.i18n;
        if (!key) {
          return;
        }
        const fallback = el.dataset.i18nDefault || el.innerHTML;
        el.innerHTML = getTranslation(nextLang, key, fallback);
      });

      placeholderElements.forEach((el) => {
        const key = el.dataset.i18nPlaceholder;
        if (!key) {
          return;
        }
        const fallback = el.dataset.i18nPlaceholderDefault || '';
        el.setAttribute('placeholder', getTranslation(nextLang, key, fallback));
      });

      qsa('[data-terminal]').forEach((terminal) => {
        const commandEl = qs('[data-terminal-command]', terminal);
        const outputEl = qs('[data-terminal-output]', terminal);
        if (outputEl && !terminal.dataset.outputEn) {
          terminal.dataset.outputEn = outputEl.textContent;
        }
        const commandEn = terminal.dataset.commandEn || (commandEl ? commandEl.textContent : '');
        const commandFr = terminal.dataset.commandFr || commandEn;
        const outputEn = normalizeLines(terminal.dataset.outputEn || '');
        const outputFr = normalizeLines(terminal.dataset.outputFr || outputEn);
        terminal.dataset.outputEn = outputEn;
        if (commandEl) {
          commandEl.textContent = nextLang === 'fr' ? commandFr : commandEn;
        }
        if (outputEl) {
          outputEl.textContent = nextLang === 'fr' ? outputFr : outputEn;
        }
      });

      const ariaFallback = nextLang === 'fr' ? 'Ouvrir le menu des langues' : 'Open language menu';
      const langAria = getTranslation(nextLang, 'lang.toggle.aria', ariaFallback);
      trigger.setAttribute('aria-label', langAria);
      trigger.dataset.i18nAria = 'lang.toggle.aria';

      if (selectedLabel) {
        const selectedKey = `lang.option.${nextLang}`;
        const fallbackLabel = nextLang === 'fr' ? 'Français' : 'English';
        selectedLabel.dataset.i18n = selectedKey;
        selectedLabel.textContent = getTranslation(nextLang, selectedKey, fallbackLabel);
      }

      if (selectedFlag) {
        selectedFlag.classList.toggle('lang-flag--fr', nextLang === 'fr');
        selectedFlag.classList.toggle('lang-flag--en', nextLang !== 'fr');
      }

      options.forEach((option) => {
        const optionLang = option.dataset.langOption === 'fr' ? 'fr' : 'en';
        const isActive = optionLang === nextLang;
        option.setAttribute('aria-checked', String(isActive));
        option.classList.toggle('is-active', isActive);
      });

      document.documentElement.dataset.lang = nextLang;
      trigger.dataset.currentLang = nextLang;
      switcher.dataset.currentLang = nextLang;

      renderHackTheBox();
      updateThemeToggleUI();
      document.dispatchEvent(new Event('langchange'));
      updateYear();
    };

    trigger.addEventListener('click', () => {
      toggleMenu();
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        applyLanguage(option.dataset.langOption || 'en');
        closeMenu();
        trigger.focus();
      });

      option.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
          trigger.focus();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!switcher.contains(event.target)) {
        closeMenu();
      }
    });

    switcher.addEventListener('focusout', (event) => {
      if (!switcher.contains(event.relatedTarget)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu();
        trigger.focus();
      }
    });

    applyLanguage('en');
  };

  const initThemeToggle = () => {
    if (!themeToggle) {
      applyTheme(state.theme || 'dark', false);
      return;
    }

    const stored = (() => {
      try {
        return localStorage.getItem(THEME_STORAGE_KEY);
      } catch (error) {
        return null;
      }
    })();

    const prefersLight = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: light)').matches;

    const initial = stored || (prefersLight ? 'light' : 'dark');
    applyTheme(initial, false);

    themeToggle.addEventListener('click', () => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next, true);
    });
  };

  const initHackTheBoxStats = () => {
    const endpoint = 'https://labs.hackthebox.com/api/v4/profile/1041901';
    const proxied = `https://proxy.cors.sh/${endpoint}`;

    const applyProfile = (payload) => {
      const profile = payload && payload.profile;
      if (!profile) {
        return;
      }
      const data = state.htb;
      if (typeof profile.rank === 'string' && profile.rank.trim()) {
        data.rank = profile.rank.trim();
      }
      if (typeof profile.next_rank === 'string' && profile.next_rank.trim()) {
        data.nextRank = profile.next_rank.trim();
      }
      if (typeof profile.points === 'number' && Number.isFinite(profile.points)) {
        data.points = Math.round(profile.points);
      }
      if (typeof profile.ranking === 'number' && Number.isFinite(profile.ranking)) {
        data.ranking = profile.ranking;
      }
      if (typeof profile.system_owns === 'number' && Number.isFinite(profile.system_owns)) {
      data.systemOwns = profile.system_owns;
    }
    if (typeof profile.user_owns === 'number' && Number.isFinite(profile.user_owns)) {
      data.userOwns = profile.user_owns;
    }
      renderHackTheBox();
    };

    const headers = {};
    if (typeof config.corsProxyKey === 'string' && config.corsProxyKey.trim()) {
      headers['x-cors-api-key'] = config.corsProxyKey.trim();
    }

    if (!headers['x-cors-api-key']) {
      console.warn('CORS proxy key missing; HackTheBox stats not refreshed.');
      return;
    }

    fetch(proxied, {
      headers,
      credentials: 'omit'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        try {
          return JSON.parse(text);
        } catch (error) {
          throw new Error('Invalid JSON from proxy');
        }
      })
      .then(applyProfile)
      .catch((error) => {
        console.warn('HackTheBox stats unavailable', error);
      });
  };

  const initContactForm = () => {
    const form = qs('.contact-form');
    if (!form) {
      return;
    }

    const statusEl = qs('[data-form-status]', form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const endpoint = (config && typeof config.contactSheetEndpoint === 'string'
      ? config.contactSheetEndpoint.trim()
      : '');

    const formMessages = {
      en: {
        'contact.form.status.sending': 'Sending…',
        'contact.form.status.success': 'Message sent successfully — thanks! I will follow up shortly.',
        'contact.form.status.error': 'Error while sending the message — please email me at sabir.yassine@proton.me.',
        'contact.form.status.missing': 'Form backend not configured — please email me at sabir.yassine@proton.me.'
      },
      fr: {
        'contact.form.status.sending': 'Envoi en cours…',
        'contact.form.status.success': 'Message envoyé avec succès — merci ! Je vous réponds rapidement.',
        'contact.form.status.error': 'Erreur lors de l’envoi du message — contactez-moi sur sabir.yassine@proton.me.',
        'contact.form.status.missing': 'Formulaire non configuré — écrivez-moi sur sabir.yassine@proton.me.'
      }
    };

    const resolveMessage = (lang, key) => {
      const langDict = formMessages[lang] || formMessages.en;
      return langDict[key] || formMessages.en[key] || key;
    };

    const setStatus = (key, tone = '') => {
      if (!statusEl) {
        return;
      }
      const message = key ? resolveMessage(state.lang, key) : '';
      statusEl.textContent = message;
      statusEl.dataset.statusKey = key || '';
      statusEl.dataset.statusTone = tone;
      statusEl.classList.remove('is-sent', 'is-error');
      if (tone === 'success') {
        statusEl.classList.add('is-sent');
      } else if (tone === 'error') {
        statusEl.classList.add('is-error');
      }
    };

    const refreshStatusLanguage = () => {
      if (!statusEl) {
        return;
      }
      const key = statusEl.dataset.statusKey;
      if (key) {
        setStatus(key, statusEl.dataset.statusTone || '');
      }
    };

    document.addEventListener('langchange', refreshStatusLanguage);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!endpoint) {
        setStatus('contact.form.status.missing', 'error');
        return;
      }

      const formData = new FormData(form);
      const payload = {
        name: (formData.get('name') || '').trim(),
        email: (formData.get('email') || '').trim(),
        organization: (formData.get('organization') || '').trim(),
        subject: (formData.get('subject') || '').trim(),
        message: (formData.get('message') || '').trim(),
        timestamp: new Date().toISOString()
      };

      if (!payload.name || !payload.email || !payload.message) {
        setStatus('contact.form.status.error', 'error');
        return;
      }

      try {
        setStatus('contact.form.status.sending');
        if (submitBtn) {
          submitBtn.disabled = true;
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        form.reset();
        setStatus('contact.form.status.success', 'success');
      } catch (error) {
        console.error('Contact form submission failed', error);
        setStatus('contact.form.status.error', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  };

  const bootstrap = () => {
    loadTranslations()
      .catch(() => {})
      .finally(() => {
        initThemeToggle();
        initLanguageToggle();
        renderHackTheBox();
        initHackTheBoxStats();
        initTerminalAnimations();
        initCertificateSlider();
        initContactForm();
        updateYear();
      });
  };

  bootstrap();
})();
