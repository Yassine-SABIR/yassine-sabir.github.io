// Interactive features: terminal, writeup data (coverage, grid view, counts),
// project details modal, PGP fingerprint and the footer audit-log stream.

const WRITEUPS_URL = 'writeups/writeups_data.json';
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let writeupsPromise;
const loadWriteups = () => {
  writeupsPromise ??= fetch(WRITEUPS_URL).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  return writeupsPromise;
};

export async function initFeatures() {
  initTerminal();
  initProjectModal();
  initFooterLogs();
  const writeups = await loadWriteups();
  if (!writeups.length) return;
  document.querySelectorAll('[data-writeup-count]').forEach((el) => { el.textContent = writeups.length; });
  document.querySelector('[data-writeups-cta]')?.setAttribute('aria-label', `Writeups (${writeups.length})`);
  renderCoverage(writeups);
  initWriteupsViews(writeups);
}

/* ---------------------------------------------------------------- Terminal */
function initTerminal() {
  const form = document.querySelector('[data-terminal-form]');
  const input = form?.querySelector('[data-terminal-input]');
  const history = document.querySelector('[data-terminal-history]');
  const body = document.querySelector('[data-terminal-typing]');
  if (!form || !input || !history || !body) return;

  const past = [];
  let cursor = 0;
  const line = (html, cls = '') => {
    const el = document.createElement('div');
    el.className = `terminal-out ${cls}`.trim();
    el.innerHTML = html;
    history.appendChild(el);
  };
  const scroll = () => { body.scrollTop = body.scrollHeight; };
  const g = (t) => `<span class="t-green">${t}</span>`;
  const m = (t) => `<span class="t-muted">${t}</span>`;

  const commands = {
    help: () => [
      'Available commands:',
      `  ${g('whoami')}        who is behind this terminal`,
      `  ${g('nmap ys4b')}     scan my skill "ports"`,
      `  ${g('skills')}        core technical domains`,
      `  ${g('certs')}         achievements & certificates`,
      `  ${g('writeups')}      latest published reports`,
      `  ${g('htb')}           Hack The Box stats`,
      `  ${g('contact')}       how to reach me`,
      `  ${g('matrix')}        …you know`,
      `  ${g('history')}       previous commands`,
      `  ${g('clear')}         clear the screen`
    ],
    whoami: () => ['yassine-sabir — cybersecurity engineer', m('offensive security · digital forensics (ICS/PLC) · secure infrastructure'), m('Grenoble INP ESISAR & ENSIAS · Paris, FR')],
    'nmap ys4b': () => [
      'Starting Nmap 7.94 ( https://nmap.org )',
      'Nmap scan report for ys4b.portfolio (127.0.0.1)',
      'PORT      STATE  SERVICE    SKILL',
      `22/tcp    ${g('open')}   ssh        Linux privesc`,
      `80/tcp    ${g('open')}   http       Web pentest · Burp`,
      `88/tcp    ${g('open')}   kerberos   Active Directory`,
      `443/tcp   ${g('open')}   https      TLS/SSH research`,
      `445/tcp   ${g('open')}   smb        Windows exploitation`,
      `502/tcp   ${g('open')}   modbus     ICS/PLC forensics`,
      `1194/udp  ${g('open')}   openvpn    Multi-DMZ design`,
      `5555/tcp  ${g('open')}   adb        Android reversing`,
      m('Nmap done: 1 IP address (1 host up) scanned')
    ],
    skills: () => ['Offensive security · Defensive & forensics · Networks & systems', 'Analysis & reverse engineering · Cryptography · Python/Bash/C/Go/PowerShell'],
    certs: () => [
      `${g('▸')} Hack The Box Season 6 — Platinum tier, #632 / 7 797`,
      `${g('▸')} Hack The Box Season 5 — Ruby tier, #1 408 / 7 825`,
      `${g('▸')} TryHackMe — Advent of Cyber 2022`,
      `${g('▸')} TOEIC 850/990`
    ],
    htb: () => {
      const read = (sel) => document.querySelector(sel)?.textContent.trim() || '?';
      return [`rank      ${g(read('[data-htb-rank]'))}`, `ranking   ${read('[data-htb-ranking]')}`, `points    ${read('[data-htb-points]')}`, `roots     ${read('[data-htb-machines]')}`, `users     ${read('[data-htb-users]')}`];
    },
    writeups: async () => {
      const list = await loadWriteups();
      return [...list.slice(0, 6).map((w) => `${g('▸')} <a href="${escapeHtml(w.url.replace('./', 'writeups/'))}">${escapeHtml(w.name)}</a> ${m(`${escapeHtml(w.difficulty)} · ${escapeHtml(w.os || w.category)}`)}`), m(`… ${Math.max(0, list.length - 6)} more → `) + '<a href="writeups/">writeups/</a>'];
    },
    contact: () => ['email   <a href="mailto:sabir.yassine@proton.me">sabir.yassine@proton.me</a>', 'linkedin <a href="https://www.linkedin.com/in/sabir-yassine" target="_blank" rel="noopener">in/sabir-yassine</a>', m('PGP key available in the contact section')],
    history: () => past.map((cmd, i) => `${String(i + 1).padStart(3)}  ${escapeHtml(cmd)}`),
    matrix: () => { document.body.classList.add('matrix-mode'); setTimeout(() => document.body.classList.remove('matrix-mode'), 2600); return [g('Wake up, Neo…')]; },
    sudo: () => ['[sudo] password for visitor: ', `${g('Nice try.')} This incident will be reported.`],
    clear: () => { history.innerHTML = ''; body.querySelector('.terminal-output')?.remove(); body.querySelector('.terminal-line:not(.terminal-input-line)')?.remove(); return []; }
  };
  const aliases = { 'nmap': 'nmap ys4b', 'nmap ys4b.pro': 'nmap ys4b', 'ls': 'help', 'cat certs.txt': 'certs', 'cat aboutme.txt': 'whoami', 'id': 'whoami' };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    input.value = '';
    if (!raw) return;
    past.push(raw);
    cursor = past.length;
    line(`<span class="prompt">YS4B@Portfolio:~ $</span> ${escapeHtml(raw)}`);
    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    const fn = commands[key] || commands[aliases[key]] || (key.startsWith('sudo') ? commands.sudo : null);
    const out = fn ? await fn() : [`${escapeHtml(raw.split(' ')[0])}: command not found — try ${g('help')}`];
    out.forEach((text) => line(text));
    scroll();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && past.length) { cursor = Math.max(0, cursor - 1); input.value = past[cursor]; event.preventDefault(); }
    if (event.key === 'ArrowDown' && past.length) { cursor = Math.min(past.length, cursor + 1); input.value = past[cursor] || ''; event.preventDefault(); }
    if (event.key === 'Tab') {
      const match = Object.keys(commands).find((c) => c.startsWith(input.value.toLowerCase()) && input.value);
      if (match) { input.value = match; event.preventDefault(); }
    }
  });
  // Clicking anywhere in the terminal focuses the prompt.
  body.addEventListener('click', (event) => { if (!event.target.closest('a') && !window.getSelection()?.toString()) input.focus({ preventScroll: true }); });
}

/* ---------------------------------------------------------------- Coverage */
function renderCoverage(writeups) {
  const host = document.querySelector('[data-coverage]');
  if (!host) return;
  const total = writeups.length;
  const group = (key, fallback) => Object.entries(writeups.reduce((acc, w) => {
    const value = w[key] || fallback;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const order = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Insane'];
  const blocks = [
    ['fa-solid fa-layer-group', 'Domain', group('category')],
    ['fa-solid fa-desktop', 'Target OS', group('os', 'Challenge (no OS)')],
    ['fa-solid fa-gauge-high', 'Difficulty', group('difficulty').sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))]
  ];
  host.innerHTML = blocks.map(([icon, title, rows]) => `
    <div class="coverage-block">
      <p class="coverage-title"><i class="${icon}" aria-hidden="true"></i> ${title}</p>
      <div class="coverage-stack" aria-hidden="true">${rows.map(([name, n]) => `<i data-tone="${slug(name)}" style="flex:${n}" title="${escapeHtml(name)}: ${n}"></i>`).join('')}</div>
      <ul>${rows.map(([name, n]) => `<li data-tone="${slug(name)}"><span class="coverage-swatch" aria-hidden="true"></span><span>${escapeHtml(name)}</span><strong>${n}</strong><small>${Math.round((n / total) * 100)}%</small></li>`).join('')}</ul>
    </div>`).join('');
}

/* ----------------------------------------------------- Writeups: 3D vs grid */
function initWriteupsViews(writeups) {
  const gallery = document.querySelector('[data-writeups-gallery]');
  const gridView = document.querySelector('[data-writeups-grid]');
  const list = document.querySelector('[data-writeups-grid-list]');
  const hint = document.querySelector('[data-writeups-hint]');
  const buttons = [...document.querySelectorAll('[data-writeups-view]')];
  if (!gallery || !gridView || !list || !buttons.length) return;

  let filter = 'all';
  const render = () => {
    const items = writeups.filter((w) => filter === 'all' || w.os === filter || w.difficulty === filter);
    list.innerHTML = items.map((w) => `
      <a class="writeup-tile" href="${escapeHtml(w.url.replace('./', 'writeups/'))}">
        <img src="writeups/${escapeHtml(w.icon)}" alt="" loading="lazy" width="56" height="56">
        <span class="writeup-tile-body">
          <strong>${escapeHtml(w.name)}</strong>
          <span class="writeup-tile-meta">
            <span class="difficulty-badge" data-difficulty="${slug(w.difficulty)}">${escapeHtml(w.difficulty)}</span>
            <span>${w.os ? `<i class="fa-brands fa-${w.os === 'Windows' ? 'windows' : 'linux'}" aria-hidden="true"></i> ${escapeHtml(w.os)}` : escapeHtml(w.category)}</span>
          </span>
        </span>
        <i class="fa-solid fa-arrow-right writeup-tile-arrow" aria-hidden="true"></i>
      </a>`).join('') || '<p class="writeups-grid-empty">No writeup matches this filter.</p>';
  };

  const setView = (view) => {
    const grid = view === 'grid';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.writeupsView === view)));
    gallery.hidden = grid;
    gridView.hidden = !grid;
    if (hint) hint.hidden = grid;
    if (grid && !list.children.length) render();
    try { localStorage.setItem('writeups-view', view); } catch { /* storage unavailable */ }
    window.ScrollTrigger?.refresh();
  };
  buttons.forEach((b) => b.addEventListener('click', () => setView(b.dataset.writeupsView)));
  gridView.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-grid-filter]');
    if (!chip) return;
    filter = chip.dataset.gridFilter;
    gridView.querySelectorAll('[data-grid-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    render();
  });
  let saved = null;
  try { saved = localStorage.getItem('writeups-view'); } catch { /* storage unavailable */ }
  // Small screens and reduced motion default to the quick grid.
  setView(saved || (reducedMotion() ? 'grid' : 'sphere'));
}

/* ------------------------------------------------------- Project modal */
const PROJECT_DIAGRAMS = {
  dmz: { caption: 'Simplified segmentation overview', zones: [['Internet', 'untrusted'], ['iptables firewall', 'edge'], ['DMZ · public services', 'dmz', 'HTTP · DNS · SMTP'], ['DMZ · remote access', 'dmz', 'OpenVPN'], ['LAN · identity & logs', 'lan', 'OpenLDAP · rsyslog']] },
  ad: { caption: 'Simplified domain overview', zones: [['Clients', 'untrusted', 'domain-joined workstations'], ['Domain controller', 'edge', 'AD DS · DNS · DHCP'], ['Group Policy', 'dmz', 'security baselines'], ['Admin tier', 'lan', 'PowerShell automation']] },
  terrapin: { caption: 'Attack flow (CVE-2023-48795)', zones: [['SSH client', 'lan'], ['Attacker (MitM)', 'untrusted', 'prefix truncation'], ['SSH server', 'lan', 'ChaCha20-Poly1305 / EtM']] }
};

function initProjectModal() {
  const modal = document.querySelector('[data-project-modal]');
  if (!modal || typeof modal.showModal !== 'function') return;
  const q = (sel) => modal.querySelector(sel);
  const links = window.__APP_CONFIG__?.projectLinks || {};

  const open = (key) => {
    const card = document.querySelector(`[data-project="${key}"]`);
    if (!card) return;
    q('[data-project-modal-index]').textContent = `Project ${card.querySelector('.card-index span')?.textContent || ''}`;
    q('[data-project-modal-title]').textContent = card.querySelector('h3')?.textContent || '';
    q('[data-project-modal-tags]').innerHTML = card.querySelector('.project-tags')?.innerHTML || '';
    q('[data-project-modal-summary]').textContent = card.querySelector(':scope > p')?.textContent || '';
    q('[data-project-modal-facts]').innerHTML = card.querySelector('dl')?.innerHTML || '';

    const diagram = PROJECT_DIAGRAMS[key];
    const fig = q('[data-project-diagram]');
    fig.hidden = !diagram;
    if (diagram) {
      fig.innerHTML = `<div class="diagram-flow">${diagram.zones.map(([name, tone, detail]) => `
        <div class="diagram-node" data-tone="${tone}"><strong>${escapeHtml(name)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>`).join('<span class="diagram-link" aria-hidden="true"></span>')}</div>
        <figcaption>${escapeHtml(diagram.caption)}</figcaption>`;
    }
    const projectLinks = links[key] || {};
    q('[data-project-modal-links]').innerHTML = Object.entries(projectLinks).map(([label, href]) => `
      <a class="btn btn-secondary" href="${escapeHtml(href)}" target="_blank" rel="noopener"><i class="fa-brands fa-${label === 'github' ? 'github' : 'link'}" aria-hidden="true"></i> ${label === 'github' ? 'GitHub repository' : escapeHtml(label)}</a>`).join('');
    modal.showModal();
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-project-open]');
    if (trigger) open(trigger.dataset.projectOpen);
    if (event.target.closest('[data-project-close]') || event.target === modal) modal.close();
  });
}

/* --------------------------------------------- Footer audit-log stream */
export function initFooterLogs() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  let host = footer.querySelector('[data-footer-logs]');
  if (!host) {
    host = document.createElement('div');
    host.className = 'footer-logs';
    host.dataset.footerLogs = '';
    host.setAttribute('aria-hidden', 'true');
    footer.appendChild(host);
  }
  const hex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const entries = [
    () => `[OK]   integrity verified  sha256:${hex().slice(0, 24)}…`,
    () => '[INFO] connection secured  TLS 1.3 · X25519 · AES-256-GCM',
    () => `[OK]   signature valid     ed25519:${hex().slice(0, 16)}`,
    () => '[INFO] firewall policy     default deny · 0 violations',
    () => `[OK]   session hash        ${hex()}`,
    () => '[INFO] audit log rotated   retention 90d',
    () => '[OK]   headers hardened    CSP · HSTS · X-Frame-Options'
  ];
  const rows = 6;
  const push = () => {
    const row = document.createElement('span');
    const time = new Date().toISOString().slice(11, 19);
    row.textContent = `${time} ${entries[Math.floor(Math.random() * entries.length)]()}`;
    host.appendChild(row);
    while (host.children.length > rows) host.firstElementChild.remove();
  };
  for (let i = 0; i < rows; i += 1) push();
  if (reducedMotion()) return;
  let timer;
  const observer = new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(push, 1400);
  });
  observer.observe(footer);
}
