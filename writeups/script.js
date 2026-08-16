const tableContainer = document.querySelector('.writeups-table');
const searchInput = document.getElementById('writeup-search');
let writeupsData = [];
let sortCol = '';
let sortAsc = true;

let activeFilters = {
    category: new Set(),
    difficulty: new Set(),
    os: new Set()
};

const difficultyOrder = {
    "Very Easy": 1,
    "Easy": 2,
    "Medium": 3,
    "Hard": 4,
    "Insane": 5
};

async function loadData() {
    try {
        const res = await fetch('./writeups_data.json');
        writeupsData = await res.json();
        initFilters();
        renderTable();
    } catch (error) {
        console.error("Failed to load writeups data", error);
    }
}

function renderTable() {
    // Remove existing rows except header
    const rows = tableContainer.querySelectorAll('.writeups-row:not(.writeups-head)');
    rows.forEach(row => row.remove());

    // Filter
    const query = searchInput.value.toLowerCase().trim();
    let filtered = writeupsData.filter(w => w.name.toLowerCase().includes(query));

    if (activeFilters.category.size > 0) {
        filtered = filtered.filter(w => activeFilters.category.has(w.category));
    }
    if (activeFilters.difficulty.size > 0) {
        filtered = filtered.filter(w => activeFilters.difficulty.has(w.difficulty));
    }
    if (activeFilters.os.size > 0) {
        filtered = filtered.filter(w => activeFilters.os.has(w.os));
    }

    // Sort
    if (sortCol) {
        filtered.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];

            // Custom sort for difficulty
            if (sortCol === 'difficulty') {
                valA = difficultyOrder[valA] || 0;
                valB = difficultyOrder[valB] || 0;
            }

            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });
    }

    // Render
    filtered.forEach(w => {
        const row = document.createElement('a');
        row.className = 'writeups-row';
        row.setAttribute('role', 'row');
        row.href = w.url;
        row.innerHTML = `
      <span role="cell" class="machine-cell">
        <img alt="${w.name} icon" src="${w.icon}" />
        <span>
          <strong>${w.name}</strong>
        </span>
      </span>
      <span role="cell">${w.category}</span>
      <span role="cell">${w.difficulty}</span>
      <span role="cell">${w.os}</span>
    `;
        tableContainer.appendChild(row);
    });

    const countEl = document.getElementById('writeup-count');
    if (countEl) {
        if (filtered.length === writeupsData.length) {
            countEl.textContent = `${filtered.length} writeups`;
        } else {
            countEl.textContent = `Showing ${filtered.length} of ${writeupsData.length}`;
        }
    }
}

// Event listeners
if (searchInput) {
    searchInput.addEventListener('input', renderTable);
}

document.querySelectorAll('.writeups-head [role="columnheader"]').forEach(header => {
    header.addEventListener('click', () => {
        const col = header.getAttribute('data-sort');
        if (!col) return;

        if (sortCol === col) {
            sortAsc = !sortAsc;
        } else {
            sortCol = col;
            sortAsc = true;
        }

        // Update icons
        document.querySelectorAll('.writeups-head [role="columnheader"]').forEach(h => {
            h.classList.remove('active', 'asc', 'desc');
        });

        header.classList.add('active');
        header.classList.add(sortAsc ? 'asc' : 'desc');

        renderTable();
    });
});

document.addEventListener('DOMContentLoaded', loadData);

function initFilters() {
    const categories = [...new Set(writeupsData.map(w => w.category))].filter(Boolean);
    const difficulties = [...new Set(writeupsData.map(w => w.difficulty))].filter(Boolean);
    const osList = [...new Set(writeupsData.map(w => w.os))].filter(Boolean);

    populateFilterMenu('category', categories);
    populateFilterMenu('difficulty', difficulties);
    populateFilterMenu('os', osList);
}

function populateFilterMenu(key, options) {
    const menu = document.getElementById(`filter-menu-${key}`);
    if (!menu) return;
    
    if (key === 'difficulty') {
        options.sort((a, b) => (difficultyOrder[a] || 0) - (difficultyOrder[b] || 0));
    } else {
        options.sort();
    }

    menu.innerHTML = options.map(opt => `
        <label onclick="event.stopPropagation()">
            <input type="checkbox" value="${opt}" onchange="handleFilterChange('${key}', this)">
            ${opt}
        </label>
    `).join('');
}

window.toggleFilter = function(event, key) {
    event.stopPropagation();
    const menu = document.getElementById(`filter-menu-${key}`);
    if (!menu) return;
    
    const isVisible = menu.style.display === 'block';
    
    document.querySelectorAll('.filter-menu').forEach(m => m.style.display = 'none');
    
    if (!isVisible) {
        menu.style.display = 'block';
    }
};

window.handleFilterChange = function(key, checkbox) {
    if (checkbox.checked) {
        activeFilters[key].add(checkbox.value);
    } else {
        activeFilters[key].delete(checkbox.value);
    }
    updateFilterLabels();
    renderTable();
};

function updateFilterLabels() {
    ['category', 'difficulty', 'os'].forEach(key => {
        const valEl = document.getElementById(`filter-val-${key}`);
        if (!valEl) return;
        
        if (activeFilters[key].size > 0) {
            const arr = Array.from(activeFilters[key]);
            valEl.textContent = `(${arr.join(', ')})`;
        } else {
            valEl.textContent = '';
        }
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-menu') && !e.target.closest('.filter-icon')) {
        document.querySelectorAll('.filter-menu').forEach(m => m.style.display = 'none');
    }
});
