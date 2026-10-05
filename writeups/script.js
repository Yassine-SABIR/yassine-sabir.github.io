const tableContainer = document.querySelector('.writeups-table');
const searchInput = document.getElementById('writeup-search');
const countEl = document.getElementById('writeup-count');
const emptyEl = document.getElementById('writeups-empty');
const activeFiltersEl = document.getElementById('active-filters');
const statsEl = document.getElementById('writeup-stats');

const FILTER_KEYS = ['category', 'difficulty', 'os'];
const difficultyOrder = {
    "Very Easy": 1,
    "Easy": 2,
    "Medium": 3,
    "Hard": 4,
    "Insane": 5
};
const osIcons = {
    Linux: 'fa-brands fa-linux',
    Windows: 'fa-brands fa-windows',
    Android: 'fa-brands fa-android'
};
const categoryIcons = {
    Pentesting: 'fa-solid fa-crosshairs',
    DFIR: 'fa-solid fa-magnifying-glass',
    SOC: 'fa-solid fa-shield-halved',
    'Malware Analysis': 'fa-solid fa-bug'
};

let writeupsData = [];
let sortCol = '';
let sortAsc = true;
const activeFilters = Object.fromEntries(FILTER_KEYS.map((key) => [key, new Set()]));

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const slug = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function loadData() {
    try {
        const res = await fetch('./writeups_data.json');
        writeupsData = await res.json();
        initFilters();
        renderStats();
        renderTable();
    } catch (error) {
        console.error("Failed to load writeups data", error);
    }
}

function getFiltered() {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = writeupsData.filter((w) => !query || [w.name, w.category, w.difficulty, w.os]
        .some((field) => String(field || '').toLowerCase().includes(query)));

    FILTER_KEYS.forEach((key) => {
        if (activeFilters[key].size > 0) filtered = filtered.filter((w) => activeFilters[key].has(w[key]));
    });

    if (sortCol) {
        filtered.sort((a, b) => {
            let valA = a[sortCol] || '';
            let valB = b[sortCol] || '';
            if (sortCol === 'difficulty') {
                valA = difficultyOrder[valA] || 0;
                valB = difficultyOrder[valB] || 0;
            }
            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }
    return filtered;
}

function rowTemplate(w) {
    const os = w.os
        ? `<span class="os-tag"><i class="${osIcons[w.os] || 'fa-solid fa-desktop'}" aria-hidden="true"></i>${escapeHtml(w.os)}</span>`
        : '<span class="muted-dash" aria-label="Not applicable">—</span>';
    return `
      <span role="cell" class="machine-cell">
        <img alt="" src="${escapeHtml(w.icon)}" loading="lazy" width="48" height="48" />
        <span>
          <strong>${escapeHtml(w.name)}</strong>
          <small>Hack The Box</small>
        </span>
      </span>
      <span role="cell"><span class="category-tag"><i class="${categoryIcons[w.category] || 'fa-solid fa-folder'}" aria-hidden="true"></i>${escapeHtml(w.category)}</span></span>
      <span role="cell"><span class="difficulty-pill" data-difficulty="${slug(w.difficulty)}">${escapeHtml(w.difficulty)}</span></span>
      <span role="cell" class="os-cell">${os}<i class="fa-solid fa-arrow-right row-arrow" aria-hidden="true"></i></span>
    `;
}

function renderTable() {
    tableContainer.querySelectorAll('.writeups-row:not(.writeups-head)').forEach((row) => row.remove());

    const filtered = getFiltered();
    const fragment = document.createDocumentFragment();
    filtered.forEach((w, index) => {
        const row = document.createElement('a');
        row.className = 'writeups-row';
        row.setAttribute('role', 'row');
        row.href = w.url;
        row.style.setProperty('--row-index', Math.min(index, 12));
        row.setAttribute('aria-label', `${w.name} — ${w.category}, ${w.difficulty}${w.os ? `, ${w.os}` : ''}`);
        row.innerHTML = rowTemplate(w);
        fragment.appendChild(row);
    });
    tableContainer.appendChild(fragment);

    if (emptyEl) emptyEl.hidden = filtered.length > 0;
    tableContainer.classList.toggle('is-empty', filtered.length === 0);

    if (countEl) {
        countEl.textContent = filtered.length === writeupsData.length
            ? `${filtered.length} writeups`
            : `${filtered.length} of ${writeupsData.length}`;
    }
    renderActiveFilters();
}

function renderStats() {
    if (!statsEl) return;
    const countBy = (key) => writeupsData.reduce((acc, w) => {
        if (w[key]) acc[w[key]] = (acc[w[key]] || 0) + 1;
        return acc;
    }, {});
    const total = writeupsData.length || 1;
    const totalEl = document.getElementById('writeup-total');
    if (totalEl) totalEl.textContent = writeupsData.length;

    statsEl.innerHTML = Object.entries(countBy('category')).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
      <li>
        <button type="button" class="stat-filter" data-quick-filter="category" data-value="${escapeHtml(name)}" aria-label="Show ${count} ${escapeHtml(name)} reports">
          <i class="${categoryIcons[name] || 'fa-solid fa-folder'}" aria-hidden="true"></i>
          <span class="stat-name">${escapeHtml(name)}</span>
          <strong>${count}</strong>
          <span class="stat-bar" aria-hidden="true"><i style="--share:${(count / total * 100).toFixed(1)}%"></i></span>
        </button>
      </li>`).join('');

    const diffEl = document.getElementById('writeup-difficulty');
    if (diffEl) {
        const counts = countBy('difficulty');
        diffEl.innerHTML = Object.keys(counts)
            .sort((a, b) => (difficultyOrder[a] || 0) - (difficultyOrder[b] || 0))
            .map((name) => `<li style="--share:${(counts[name] / total * 100).toFixed(1)}" data-difficulty="${slug(name)}" title="${escapeHtml(name)}: ${counts[name]}">
                <span class="difficulty-pill" data-difficulty="${slug(name)}">${escapeHtml(name)}</span><strong>${counts[name]}</strong></li>`).join('');
    }
}

function renderActiveFilters() {
    if (!activeFiltersEl) return;
    const chips = FILTER_KEYS.flatMap((key) => [...activeFilters[key]].map((value) => `
      <button type="button" class="filter-chip" data-remove-filter="${key}" data-value="${escapeHtml(value)}" aria-label="Remove filter ${escapeHtml(value)}">
        ${escapeHtml(value)} <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>`));
    activeFiltersEl.hidden = chips.length === 0;
    activeFiltersEl.innerHTML = chips.length
        ? `<span class="active-filters-label">Filters</span>${chips.join('')}<button type="button" class="filter-clear" data-clear-filters>Clear all</button>`
        : '';

    FILTER_KEYS.forEach((key) => {
        const toggle = document.querySelector(`[data-filter-toggle="${key}"]`);
        toggle?.classList.toggle('has-filter', activeFilters[key].size > 0);
        document.querySelectorAll(`[data-quick-filter="${key}"]`).forEach((button) => {
            button.setAttribute('aria-pressed', String(activeFilters[key].has(button.dataset.value)));
        });
        document.querySelectorAll(`#filter-menu-${key} input`).forEach((input) => {
            input.checked = activeFilters[key].has(input.value);
        });
    });
}

function initFilters() {
    FILTER_KEYS.forEach((key) => {
        const options = [...new Set(writeupsData.map((w) => w[key]))].filter(Boolean);
        if (key === 'difficulty') {
            options.sort((a, b) => (difficultyOrder[a] || 0) - (difficultyOrder[b] || 0));
        } else {
            options.sort();
        }
        const menu = document.getElementById(`filter-menu-${key}`);
        if (!menu) return;
        menu.innerHTML = options.map((opt) => {
            const total = writeupsData.filter((w) => w[key] === opt).length;
            return `
            <label>
                <input type="checkbox" value="${escapeHtml(opt)}" data-filter-key="${key}">
                <span class="filter-check" aria-hidden="true"></span>
                <span class="filter-label">${escapeHtml(opt)}</span>
                <span class="filter-total">${total}</span>
            </label>`;
        }).join('');
    });
}

function closeMenus(except) {
    document.querySelectorAll('.filter-menu').forEach((menu) => {
        if (menu === except) return;
        menu.hidden = true;
        document.querySelector(`[aria-controls="${menu.id}"]`)?.setAttribute('aria-expanded', 'false');
    });
}

function clearFilters() {
    FILTER_KEYS.forEach((key) => activeFilters[key].clear());
    searchInput.value = '';
    renderTable();
}

function setSort(col) {
    if (sortCol === col) {
        sortAsc = !sortAsc;
    } else {
        sortCol = col;
        sortAsc = true;
    }
    document.querySelectorAll('.writeups-head [role="columnheader"]').forEach((header) => {
        const active = header.dataset.sort === sortCol;
        header.classList.toggle('active', active);
        header.classList.toggle('asc', active && sortAsc);
        header.classList.toggle('desc', active && !sortAsc);
        header.setAttribute('aria-sort', active ? (sortAsc ? 'ascending' : 'descending') : 'none');
    });
    renderTable();
}

// Event listeners
searchInput?.addEventListener('input', renderTable);
searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        searchInput.value = '';
        renderTable();
    }
});

document.addEventListener('keydown', (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (event.key === '/' && !typing) {
        event.preventDefault();
        searchInput?.focus();
    }
    if (event.key === 'Escape') closeMenus();
});

document.addEventListener('click', (event) => {
    const sortButton = event.target.closest('[data-sort-button]');
    if (sortButton) {
        setSort(sortButton.dataset.sortButton);
        return;
    }

    const toggle = event.target.closest('[data-filter-toggle]');
    if (toggle) {
        const menu = document.getElementById(toggle.getAttribute('aria-controls'));
        const open = menu.hidden;
        closeMenus(menu);
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) menu.querySelector('input')?.focus();
        return;
    }

    const remove = event.target.closest('[data-remove-filter]');
    if (remove) {
        activeFilters[remove.dataset.removeFilter].delete(remove.dataset.value);
        renderTable();
        return;
    }

    const quick = event.target.closest('[data-quick-filter]');
    if (quick) {
        const set = activeFilters[quick.dataset.quickFilter];
        const only = set.size === 1 && set.has(quick.dataset.value);
        set.clear();
        if (!only) set.add(quick.dataset.value);
        renderTable();
        document.getElementById('collection-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    if (event.target.closest('[data-clear-filters]')) {
        clearFilters();
        return;
    }

    if (!event.target.closest('.filter-menu')) closeMenus();
});

document.addEventListener('change', (event) => {
    const input = event.target.closest('[data-filter-key]');
    if (!input) return;
    const set = activeFilters[input.dataset.filterKey];
    if (input.checked) set.add(input.value); else set.delete(input.value);
    renderTable();
});

document.addEventListener('DOMContentLoaded', loadData);
