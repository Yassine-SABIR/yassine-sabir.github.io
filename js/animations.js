export function initAnimations() {
  initTimelineConnector();
  initTerminalTyping();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll('[data-reveal]');
  initScrollProgress(reduced);
  initSectionEntrances(reduced);
  if (reduced || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    document.body.classList.add('page-ready');
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8%' });
  // Stagger delays are computed per sibling group by js/reveal.js.
  elements.forEach((element) => observer.observe(element));

  // Let the hero settle for a frame before its inner elements enter in sequence.
  window.requestAnimationFrame(() => {
    window.setTimeout(() => document.body.classList.add('page-ready'), 80);
  });
}

function initTerminalTyping() {
  const terminal = document.querySelector('[data-terminal-typing]');
  const command = terminal?.querySelector('[data-terminal-command]');
  const output = terminal?.querySelector('[data-terminal-output]');
  if (!terminal || !command || !output) return;

  const commandText = command.textContent.trim();
  const outputText = output.textContent.trim();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderComplete = () => {
    command.textContent = commandText;
    output.textContent = outputText;
    terminal.classList.add('terminal-typing-complete');
  };

  if (reduced || !('IntersectionObserver' in window)) {
    renderComplete();
    return;
  }

  command.textContent = '';
  // Keep the command as the only typed input: the terminal response prints at once.
  const type = (target, text, speed, done) => {
    const characters = Array.from(text);
    let index = 0;
    const write = () => {
      target.textContent += characters[index] || '';
      index += 1;
      if (index < characters.length) {
        window.setTimeout(write, speed);
      } else {
        done?.();
      }
    };
    write();
  };

  const start = () => {
    if (terminal.dataset.typingStarted) return;
    terminal.dataset.typingStarted = 'true';
    terminal.classList.add('is-typing');
    type(command, commandText, 55, () => {
      window.setTimeout(() => {
        output.textContent = outputText;
        terminal.classList.remove('is-typing');
        terminal.classList.add('terminal-typing-complete');
      }, 160);
    });
  };

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      start();
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: .35 });
  observer.observe(terminal);
}

function initScrollProgress(reduced) {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  if (reduced) {
    progress.style.transform = 'scaleX(1)';
    return;
  }

  let ticking = false;
  const update = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const value = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
    progress.style.transform = `scaleX(${value})`;
    ticking = false;
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
}

function initSectionEntrances(reduced) {
  const sections = document.querySelectorAll('main > section, .site-footer');
  if (reduced || !('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('is-in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6%' });

  sections.forEach((section) => observer.observe(section));
}

function initTimelineConnector() {
  const timeline = document.querySelector('.timeline');
  const svg = timeline?.querySelector('.timeline-connector');
  const path = svg?.querySelector('path');
  const dots = timeline ? [...timeline.querySelectorAll('.timeline-dot')] : [];
  if (!timeline || !svg || !path || dots.length < 2) return;

  const updatePath = () => {
    const timelineBox = timeline.getBoundingClientRect();
    if (!timelineBox.width || !timelineBox.height) return;
    const points = dots.map((dot) => {
      const box = dot.getBoundingClientRect();
      return {
        x: ((box.left + box.width / 2 - timelineBox.left) / timelineBox.width) * 100,
        y: ((box.top + box.height / 2 - timelineBox.top) / timelineBox.height) * 100
      };
    });
    const first = points[0];
    let definition = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      const middle = previous.y + (point.y - previous.y) * .5;
      definition += ` C ${previous.x.toFixed(2)} ${middle.toFixed(2)}, ${point.x.toFixed(2)} ${middle.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    });
    path.setAttribute('d', definition);
  };

  window.requestAnimationFrame(updatePath);
  window.addEventListener('resize', updatePath, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updatePath).observe(timeline);
}

export function initStrengthsScroller() {
  const list = document.querySelector('.strengths-list');
  const track = list?.querySelector('.strengths-track');
  const group = track?.querySelector('.strengths-group');
  if (!list || !track || !group || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rows = [...group.children];
  if (rows.length < 2) return;

  const pause = 2000;
  const duration = 850;
  let timer;
  let fallbackTimer;

  const getGap = () => {
    const styles = getComputedStyle(group);
    return Number.parseFloat(styles.rowGap || styles.gap) || 0;
  };

  // Size the viewport to exactly the 3 rows currently in view (so a 4th never peeks and the
  // 3rd is never cut). Rows change height after web fonts load, on language switch and on
  // resize, so re-measure whenever any row resizes (one rAF-batched pass). During a move the
  // height animates to the next trio with the same timing as the scroll.
  const VISIBLE = 3;
  let sizeFrame = 0;
  const heightFor = (start) => {
    const items = [...group.children];
    const visible = Math.min(VISIBLE, items.length);
    let total = 0;
    for (let i = 0; i < visible; i += 1) total += items[(start + i) % items.length].offsetHeight;
    const styles = getComputedStyle(list);
    const padding = (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
    return Math.ceil(total + getGap() * (visible - 1) + padding + 2);
  };
  // The outer footprint stays constant (tallest trio): a bottom margin absorbs the
  // difference, so content below the scroller never shifts between cycles.
  let reserved = 0;
  const applyHeight = (start) => {
    const height = heightFor(start);
    list.style.height = `${height}px`;
    list.style.marginBottom = `${reserved - height}px`;
  };
  const updateViewportHeight = () => {
    sizeFrame = 0;
    if (group.classList.contains('is-moving')) return;
    const count = group.children.length;
    reserved = Math.max(...Array.from({ length: count }, (_, i) => heightFor(i)));
    list.style.maxHeight = 'none';
    applyHeight(0);
  };
  const requestSize = () => { if (!sizeFrame) sizeFrame = window.requestAnimationFrame(updateViewportHeight); };

  requestSize();
  document.fonts?.ready.then(requestSize);
  document.addEventListener('languagechange', requestSize);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(requestSize);
    rows.forEach((row) => observer.observe(row));
  } else {
    window.addEventListener('resize', requestSize, { passive: true });
  }

  const scheduleNext = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(moveNext, pause);
  };

  const moveNext = () => {
    const firstRow = group.firstElementChild;
    if (!firstRow) return;
    if (document.hidden) {
      scheduleNext();
      return;
    }

    group.style.setProperty('--strength-step', `${firstRow.offsetHeight + getGap()}px`);
    group.style.transition = `transform ${duration}ms cubic-bezier(.65, 0, .35, 1)`;
    list.style.transition = `height ${duration}ms cubic-bezier(.65, 0, .35, 1), margin-bottom ${duration}ms cubic-bezier(.65, 0, .35, 1)`;
    group.getBoundingClientRect();
    group.classList.add('is-moving');
    applyHeight(1);

    window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(completeMove, duration + 150);
  };

  const completeMove = () => {
    window.clearTimeout(fallbackTimer);
    if (!group.classList.contains('is-moving')) return;

    const firstRow = group.firstElementChild;
    group.style.transition = 'none';
    if (firstRow) group.append(firstRow);
    group.classList.remove('is-moving');
    group.getBoundingClientRect();
    group.style.removeProperty('transition');
    list.style.removeProperty('transition');
    requestSize();
    scheduleNext();
  };

  group.addEventListener('transitionend', (event) => {
    if (event.target !== group || event.propertyName !== 'transform') return;
    completeMove();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) completeMove();
  });
  scheduleNext();
}

export function initWriteupsGallery() {
  const gallery = document.querySelector('[data-writeups-gallery]');
  const sphere = gallery?.querySelector('#writeups-sphere');
  const sources = gallery ? [...gallery.querySelectorAll('.writeup-source')] : [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!gallery || !sphere || !sources.length || sphere.dataset.initialized) return;
  sphere.dataset.initialized = 'true';

  const sourceItems = sources.map((source) => ({
    href: source.href,
    src: source.querySelector('img')?.src,
    alt: source.querySelector('img')?.alt || 'Writeup image',
    title: source.dataset.title || source.querySelector('img')?.alt || 'Writeup',
    description: source.dataset.description || ''
  }));
  const galleryItems = [...sourceItems, ...sourceItems, ...sourceItems, ...sourceItems].slice(0, 24);
  const scene = gallery.querySelector('.scene');
  const mouseLayer = gallery.querySelector('.sphere-mouse-layer');
  const panel = gallery.querySelector('.floating-text');
  const header = document.querySelector('.site-header, header');
  const cards = [];

  // ---- Cards --------------------------------------------------------------
  galleryItems.forEach((item, index) => {
    const card = document.createElement('a');
    card.className = 'clay-card';
    card.href = item.href;
    card.setAttribute('aria-label', `Open ${item.title} writeup`);
    card.dataset.index = String(index);
    card.dataset.source = String(index % sourceItems.length);
    // Only the first copy of each writeup is keyboard-reachable; duplicates are decorative.
    if (index >= sourceItems.length) card.tabIndex = -1;

    const image = document.createElement('img');
    image.src = item.src;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.draggable = false;
    card.appendChild(image);

    const caption = document.createElement('span');
    caption.className = 'clay-card-title';
    caption.textContent = item.title;
    card.appendChild(caption);

    cards.push(card);
    sphere.appendChild(card);
  });
  sphere.setAttribute('role', 'group');
  sphere.setAttribute('aria-roledescription', '3D carousel');
  sphere.setAttribute('aria-label', 'Writeups — drag or use arrow keys to rotate');

  // ---- Geometry: everything derives from the measured scene, not the window --
  const HALF_CARD_H = 0.6875;    // half card height / card width (cards are 1 : 1.375)
  const PERSPECTIVE_K = 5;       // perspective = radius * K  → front cards magnified K/(K-1)
  const GAP = 0.86;              // card height as a share of the spacing between card centres
  let mode = '';
  let visibleCount = cards.length;

  // Positions are relative to .writeups-stage (the sphere layer's containing block).
  const stage = gallery.querySelector('.writeups-stage') || scene;
  const layoutSphere = () => {
    if (!stage) return;
    const sceneW = stage.clientWidth;
    const sceneH = stage.clientHeight;
    if (!sceneW || !sceneH) return;
    const headerH = header ? header.offsetHeight + 16 : 80;
    const short = sceneH < 560 && sceneW > sceneH;
    const nextMode = short ? 'is-side' : sceneW >= 1000 ? 'is-wide' : 'is-stack';
    if (nextMode !== mode) {
      gallery.classList.remove('is-wide', 'is-side', 'is-stack');
      gallery.classList.add(nextMode);
      mode = nextMode;
    }

    // Fewer cards on small containers keeps them legible and cheaper to composite.
    const target = sceneW < 480 ? 12 : sceneW < 900 ? 14 : 18;
    if (target !== visibleCount) {
      visibleCount = target;
      cards.forEach((card, index) => { card.hidden = index >= target; });
    }

    // Available box for the sphere (half extents) + its centre, per mode.
    let halfW;
    let halfH;
    let cx;
    let cy;
    const gap = 16;
    if (mode === 'is-stack') {
      const panelH = panel ? panel.offsetHeight + gap * 1.5 : sceneH * 0.3;
      const top = headerH;
      const bottom = sceneH - panelH;
      halfW = sceneW / 2 - gap / 2;
      halfH = Math.max((bottom - top) / 2 - gap / 2, 70);
      cx = sceneW / 2;
      cy = top + (bottom - top) / 2;
    } else {
      const panelRight = panel ? panel.offsetLeft + panel.offsetWidth : sceneW * 0.3;
      const free = sceneW - panelRight;
      halfW = free / 2 - gap * 1.5;
      halfH = (sceneH - headerH) / 2 - gap;
      cx = panelRight + free / 2;
      cy = headerH + (sceneH - headerH) / 2;
    }
    const extent = Math.max(60, Math.min(halfW, halfH));
    // Solve radius + card so that radius + half a card fits the extent.
    // Phones get relatively larger cards so captions stay legible.
    // Cards must not intersect: the mean distance between neighbouring centres on a
    // Fibonacci sphere is ≈ r·sqrt(4π/N); the front-most card is also magnified by
    // the perspective. Card height ≤ GAP × spacing ÷ magnification.
    const magnification = PERSPECTIVE_K / (PERSPECTIVE_K - 1);
    const spacingRatio = Math.sqrt((4 * Math.PI) / visibleCount);
    const CARD_RATIO = (GAP * spacingRatio) / (2 * HALF_CARD_H) / magnification; // card width / radius
    let radius = extent / (1 + CARD_RATIO * HALF_CARD_H * magnification);
    radius = Math.max(48, Math.min(380, radius));
    // Non-overlap wins over size: the card never exceeds what the spacing allows.
    const cardW = Math.floor(Math.min(160, radius * CARD_RATIO));

    gallery.style.setProperty('--card-w', `${cardW}px`);
    gallery.style.setProperty('--sphere-x', `${Math.round(cx)}px`);
    gallery.style.setProperty('--sphere-y', `${Math.round(cy)}px`);
    // Perspective scales with the sphere so depth reads the same at every size.
    gallery.style.setProperty('--perspective', `${Math.round(radius * PERSPECTIVE_K)}px`);

    // Fibonacci sphere over the visible cards only.
    const count = visibleCount;
    for (let index = 0; index < count; index += 1) {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      const rotY = Math.atan2(x, z) * (180 / Math.PI);
      const rotX = Math.asin(-y / radius) * (180 / Math.PI);
      cards[index].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg)`;
    }
  };

  // One rAF-batched relayout, triggered by the actual containers resizing
  // (window resize, rotation, mobile URL bar, zoom, panel text changes).
  let layoutFrame = 0;
  const scheduleLayout = () => {
    if (layoutFrame) return;
    layoutFrame = window.requestAnimationFrame(() => { layoutFrame = 0; layoutSphere(); });
  };
  layoutSphere();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleLayout);
    observer.observe(stage);
    if (panel) observer.observe(panel);
  } else {
    window.addEventListener('resize', scheduleLayout, { passive: true });
  }

  // ---- Interaction: mouse tilt, drag/swipe with inertia, keyboard ----------
  // The drag layer adds yaw on top of the scroll-driven rotation of .sphere.
  let yaw = 0;
  let tiltX = 0;
  let tiltY = 0;
  let velocity = 0;
  let inertiaFrame = 0;
  const applyLayer = () => {
    if (mouseLayer) mouseLayer.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${(yaw + tiltY).toFixed(2)}deg)`;
  };

  scene?.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || drag || reduced) return;
    const bounds = scene.getBoundingClientRect();
    tiltY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 28;
    tiltX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -20;
    applyLayer();
  });
  scene?.addEventListener('pointerleave', () => { tiltX = 0; tiltY = 0; applyLayer(); });

  // Drag: touch-action: pan-y (CSS) keeps vertical page scrolling native; we only
  // take over once the gesture is clearly horizontal.
  let drag = null;
  let suppressClick = false;
  scene?.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    window.cancelAnimationFrame(inertiaFrame);
    drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastT: performance.now(), active: false, id: event.pointerId };
    suppressClick = false;
  });
  scene?.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      drag.active = true;
      suppressClick = true;
      gallery.classList.add('is-dragging');
      scene.setPointerCapture?.(event.pointerId);
    }
    const now = performance.now();
    const step = (event.clientX - drag.lastX) * 0.35;
    velocity = Math.max(-6, Math.min(6, (step / Math.max(8, now - drag.lastT)) * 16));
    yaw += step;
    drag.lastX = event.clientX;
    drag.lastT = now;
    applyLayer();
  });
  const endDrag = () => {
    if (!drag) return;
    const wasActive = drag.active;
    drag = null;
    gallery.classList.remove('is-dragging');
    if (!wasActive || reduced) return;
    const glide = () => {
      velocity *= 0.94;
      yaw += velocity;
      applyLayer();
      if (Math.abs(velocity) > 0.05) inertiaFrame = window.requestAnimationFrame(glide);
    };
    inertiaFrame = window.requestAnimationFrame(glide);
  };
  scene?.addEventListener('pointerup', endDrag);
  scene?.addEventListener('pointercancel', endDrag);
  // A drag must not also open the card under the finger.
  sphere.addEventListener('click', (event) => {
    if (suppressClick) { event.preventDefault(); suppressClick = false; }
  }, true);

  // Keyboard: arrows rotate; focusing a card shows its details in the panel.
  gallery.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !event.target.closest('.clay-card')) return;
    event.preventDefault();
    yaw += event.key === 'ArrowLeft' ? -24 : 24;
    applyLayer();
    const focusable = cards.filter((card) => card.tabIndex !== -1 && !card.hidden);
    const current = focusable.indexOf(event.target.closest('.clay-card'));
    focusable[(current + (event.key === 'ArrowLeft' ? -1 : 1) + focusable.length) % focusable.length]?.focus({ preventScroll: true });
  });

  const title = gallery.querySelector('#writeups-dynamic-title');
  const description = gallery.querySelector('#writeups-dynamic-desc');
  const featureImage = gallery.querySelector('#writeups-dynamic-image');
  const featureLink = gallery.querySelector('#writeups-dynamic-link');
  let activeTextIndex = -1;

  const showItem = (item) => {
    if (title) title.textContent = item.title;
    if (description) description.textContent = item.description;
    if (featureImage) {
      featureImage.src = item.src;
      featureImage.alt = item.alt;
    }
    if (featureLink) featureLink.href = item.href;
  };
  gallery.addEventListener('focusin', (event) => {
    const card = event.target.closest('.clay-card');
    if (card) showItem(sourceItems[Number(card.dataset.source)]);
  });

  const updateActiveCard = (progress) => {
    const textIndex = Math.floor(progress * sourceItems.length) % sourceItems.length;
    if (textIndex !== activeTextIndex) {
      activeTextIndex = textIndex;
      showItem(sourceItems[textIndex]);
    }

    const focusIndex = Math.floor(progress * visibleCount);
    cards.forEach((card, index) => {
      card.classList.toggle('active-card', Math.abs(index - focusIndex) < 2);
    });
  };

  if (reduced || !window.gsap || !window.ScrollTrigger) {
    updateActiveCard(0);
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.gsap.to(sphere, {
    rotateY: 720,
    rotateX: 45,
    ease: 'none',
    scrollTrigger: {
      trigger: gallery,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => updateActiveCard(self.progress)
    }
  });
  updateActiveCard(0);
}

export function initCertificateSlider() {
  const slider = document.querySelector('[data-slider]');
  if (!slider) return;
  const track = slider.querySelector('[data-slider-track]');
  const slides = [...slider.querySelectorAll('[data-slide]')];
  const previous = slider.querySelector('[data-slider-prev]');
  const next = slider.querySelector('[data-slider-next]');
  const status = slider.querySelector('[data-slider-status]');
  let index = 0;

  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    if (status) status.textContent = `${index + 1} / ${slides.length}`;
  };
  previous?.addEventListener('click', () => { index = Math.max(0, index - 1); render(); });
  next?.addEventListener('click', () => { index = Math.min(slides.length - 1, index + 1); render(); });
  render();
}
