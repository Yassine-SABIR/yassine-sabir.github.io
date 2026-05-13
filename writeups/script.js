const tableContainer = document.querySelector('.writeups-table');
const searchInput = document.getElementById('writeup-search');
let writeupsData = [];
let sortCol = '';
let sortAsc = true;

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
