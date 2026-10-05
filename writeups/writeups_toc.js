/**
 * writeups_toc.js
 * Progressive enhancements shared by every writeup report:
 *  - two-column layout with a sticky table of contents (collapsible on small screens)
 *  - terminal-style code blocks with a language label and a copy button
 *  - reading progress bar, back-to-top button, heading anchors
 *  - difficulty colouring, responsive tables and an image lightbox
 * Every step is optional: if the markup is missing, the page still renders as authored.
 */
document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector('.challenge-main');
    if (!mainContent) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    enhanceMeta();
    enhanceCodeBlocks(mainContent);
    enhanceTables(mainContent);
    enhanceImages(mainContent);
    buildToc(mainContent, reducedMotion);
    buildProgress();
    buildBackToTop(reducedMotion);
});

/* ---------- Meta: colour the difficulty value ---------- */
function enhanceMeta() {
    document.querySelectorAll('.challenge-meta > div').forEach((item) => {
        const label = item.querySelector('.meta-label');
        const value = item.querySelector('.meta-value');
        if (!label || !value) return;
        const key = label.textContent.trim().toLowerCase();
        item.dataset.meta = key.replace(/[^a-z]+/g, '-');
        if (key === 'difficulty') {
            value.dataset.difficulty = value.textContent.trim().toLowerCase().replace(/[^a-z]+/g, '-');
        }
    });
}

/* ---------- Code blocks ---------- */
function dedent(text) {
    const lines = text.replace(/\t/g, '    ').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
    const min = indents.length ? Math.min(...indents) : 0;
    return lines.map((line) => line.slice(min)).join('\n');
}

function languageOf(code) {
    const match = code.className.match(/language-([a-z0-9]+)/i);
    if (!match) return null;
    const names = { bash: 'bash', python: 'python', xml: 'xml', sql: 'sql', java: 'java', go: 'go', javascript: 'js', cshtml: 'html' };
    return names[match[1]] || match[1];
}

function makeCopyButton(getText) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copy</span>';
    button.addEventListener('click', async () => {
        const label = button.querySelector('span');
        try {
            await navigator.clipboard.writeText(getText());
            button.classList.add('is-copied');
            label.textContent = 'Copied';
        } catch {
            label.textContent = 'Press Ctrl+C';
        }
        window.setTimeout(() => {
            button.classList.remove('is-copied');
            label.textContent = 'Copy';
        }, 1600);
    });
    return button;
}

function wrapCodeBlock(target, code, { label, kind }) {
    const block = document.createElement('figure');
    block.className = `code-block code-block--${kind}`;
    const head = document.createElement('figcaption');
    head.className = 'code-block-head';
    head.innerHTML = `<span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="code-lang">${label}</span>`;
    head.appendChild(makeCopyButton(() => code.textContent.trim()));
    target.replaceWith(block);
    block.append(head, target);
    return block;
}

function enhanceCodeBlocks(root) {
    // Raw command output: <pre class="terminal"><code>…</code></pre>
    root.querySelectorAll('pre.terminal').forEach((pre) => {
        const code = pre.querySelector('code');
        [...pre.childNodes].forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
        });
        if (code && code.children.length === 0) code.textContent = dedent(code.textContent);
        // Authors wrap <pre> in <p>; lift it out so the block gets its full width and spacing.
        const parent = pre.parentElement;
        if (parent?.tagName === 'P' && !parent.textContent.replace(pre.textContent, '').trim()) parent.replaceWith(pre);
        wrapCodeBlock(pre, code || pre, { label: 'output', kind: 'output' });
    });

    // Highlighted commands: <p><code class="language-bash">…</code></p>
    root.querySelectorAll('code[class*="language-"]').forEach((code) => {
        if (code.closest('.code-block')) return;
        const parent = code.parentElement;
        const lang = languageOf(code) || 'code';
        let target = code;
        if (parent?.tagName === 'PRE') {
            target = parent;
        } else if (parent?.tagName === 'P' && parent.children.length === 1 && !parent.textContent.replace(code.textContent, '').trim()) {
            const pre = document.createElement('pre');
            pre.className = code.className;
            parent.replaceWith(pre);
            pre.appendChild(code);
            target = pre;
        } else if (parent && !['P', 'LI', 'TD', 'TH', 'SPAN', 'A', 'STRONG', 'EM'].includes(parent.tagName)) {
            // Bare <code> placed directly in a section: treat it as a block.
            const pre = document.createElement('pre');
            pre.className = code.className;
            code.replaceWith(pre);
            pre.appendChild(code);
            target = pre;
        } else {
            return;
        }
        if (code.children.length === 0) code.textContent = dedent(code.textContent);
        wrapCodeBlock(target, code, { label: lang, kind: lang === 'bash' ? 'shell' : 'source' });
    });
}

/* ---------- Tables ---------- */
function enhanceTables(root) {
    root.querySelectorAll('table').forEach((table) => {
        if (table.parentElement.classList.contains('table-wrap')) return;
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        wrap.tabIndex = 0;
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Scrollable table');
        table.replaceWith(wrap);
        wrap.appendChild(table);
    });
}

/* ---------- Images: click to zoom ---------- */
function enhanceImages(root) {
    const images = [...root.querySelectorAll('img')].filter((img) => !img.closest('a'));
    if (!images.length) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'writeup-lightbox';
    dialog.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close image"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button><img alt=""><p class="lightbox-caption"></p>';
    document.body.appendChild(dialog);
    const full = dialog.querySelector('img');
    const caption = dialog.querySelector('.lightbox-caption');
    const close = () => dialog.close();
    dialog.querySelector('.lightbox-close').addEventListener('click', close);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });

    images.forEach((img) => {
        img.loading = img.loading || 'lazy';
        img.classList.add('is-zoomable');
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Enlarge image${img.alt ? `: ${img.alt}` : ''}`);
        const open = () => {
            full.src = img.currentSrc || img.src;
            full.alt = img.alt;
            caption.textContent = img.alt || '';
            if (typeof dialog.showModal === 'function') dialog.showModal();
        };
        img.addEventListener('click', open);
        img.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
    });
}

/* ---------- Table of contents ---------- */
function buildToc(mainContent, reducedMotion) {
    const headers = mainContent.querySelectorAll('h2, h3, h4');
    if (headers.length === 0) return;

    document.body.classList.add('has-toc');

    // Wrap the report in a two-column layout so the TOC can be sticky instead of fixed.
    const layout = document.createElement('div');
    layout.className = 'writeup-layout';
    mainContent.replaceWith(layout);

    const tocContainer = document.createElement('nav');
    tocContainer.className = 'writeup-toc';
    tocContainer.setAttribute('aria-label', 'Table of Contents');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'toc-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span class="toc-toggle-label"><i class="fa-solid fa-list-ul" aria-hidden="true"></i> On this page</span><span class="toc-current"></span><i class="fa-solid fa-chevron-down toc-chevron" aria-hidden="true"></i>';

    const tocTitle = document.createElement('h3');
    tocTitle.className = 'toc-title';
    tocTitle.textContent = 'Overview';

    const tocList = document.createElement('ol');
    tocList.className = 'toc-list';
    tocList.id = 'writeup-toc-list';
    toggle.setAttribute('aria-controls', tocList.id);

    tocContainer.append(toggle, tocTitle, tocList);
    layout.append(tocContainer, mainContent);

    toggle.addEventListener('click', () => {
        const open = !tocContainer.classList.contains('is-open');
        tocContainer.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    });

    const tocItems = [];
    const idCount = {};

    headers.forEach((header) => {
        // Many reports reuse the same id; make every heading id unique.
        let baseId = header.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        if (header.id && document.querySelectorAll(`#${CSS.escape(header.id)}`).length === 1) baseId = header.id;
        let finalId = baseId;
        if (idCount[baseId] !== undefined) {
            idCount[baseId] += 1;
            finalId = `${baseId}-${idCount[baseId]}`;
        } else {
            idCount[baseId] = 0;
        }
        header.id = finalId;

        const label = header.textContent.trim();
        const anchor = document.createElement('a');
        anchor.className = 'heading-anchor';
        anchor.href = `#${finalId}`;
        anchor.setAttribute('aria-label', `Link to ${label}`);
        anchor.textContent = '#';
        header.appendChild(anchor);

        const level = Number(header.tagName.slice(1));
        const listItem = document.createElement('li');
        listItem.className = `toc-item toc-level-${level}`;

        const link = document.createElement('a');
        link.href = `#${finalId}`;
        link.textContent = label;
        link.className = 'toc-link';

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(finalId);
            if (!target) return;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 90;
            window.scrollTo({ top: targetPosition, behavior: reducedMotion ? 'auto' : 'smooth' });
            history.pushState(null, '', `#${finalId}`);
            tocContainer.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        });

        listItem.appendChild(link);
        tocList.appendChild(listItem);
        tocItems.push({ header, link });
    });

    const current = toggle.querySelector('.toc-current');
    let ticking = false;
    const highlightOnScroll = () => {
        ticking = false;
        const scrollPosition = window.scrollY + 140;
        let currentActive = tocItems[0];
        for (const item of tocItems) {
            if (item.header.getBoundingClientRect().top + window.scrollY <= scrollPosition) currentActive = item;
            else break;
        }
        tocItems.forEach((item) => {
            const active = item === currentActive;
            item.link.classList.toggle('active', active);
            if (active) item.link.setAttribute('aria-current', 'location'); else item.link.removeAttribute('aria-current');
        });
        current.textContent = currentActive.link.textContent;

        // Keep the active link visible inside the scrollable sidebar.
        const linkRect = currentActive.link.getBoundingClientRect();
        const listRect = tocList.getBoundingClientRect();
        if (linkRect.bottom > listRect.bottom) tocList.scrollTop += linkRect.bottom - listRect.bottom + 20;
        else if (linkRect.top < listRect.top) tocList.scrollTop -= listRect.top - linkRect.top + 20;
    };
    const requestHighlight = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(highlightOnScroll);
    };

    window.addEventListener('scroll', requestHighlight, { passive: true });
    window.addEventListener('resize', requestHighlight, { passive: true });
    highlightOnScroll();
}

/* ---------- Reading progress & back to top ---------- */
function buildProgress() {
    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
        ticking = false;
        const available = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });
    update();
}

function buildBackToTop(reducedMotion) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    document.body.appendChild(button);
    const update = () => button.classList.toggle('is-visible', window.scrollY > window.innerHeight * .8);
    window.addEventListener('scroll', update, { passive: true });
    update();
}
