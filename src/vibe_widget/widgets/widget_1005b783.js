import { marked } from "https://esm.sh/marked@11";

function render({ model, el }) {
  const rawData = model.get("data");
  
  // Clean and restructure the data
  const cleanData = rawData.slice(1).map(row => ({
    cycle: row["Cycle \nName"],
    ki: parseFloat(row["KI \n(1/km)"]) || 0,
    distance: parseFloat(row["Distance \n(mi)"]) || 0,
    improvedSpeed: row["Percent Fuel Savings"],
    decreasedAccel: row["Column_4"],
    eliminateStops: row["Column_5"],
    decreasedIdle: row["Column_6"]
  }));

  const headers = [
    { key: 'cycle', label: 'Cycle Name', sortable: true },
    { key: 'ki', label: 'KI (1/km)', sortable: true },
    { key: 'distance', label: 'Distance (mi)', sortable: true },
    { key: 'improvedSpeed', label: 'Improved Speed', sortable: true },
    { key: 'decreasedAccel', label: 'Decreased Accel', sortable: true },
    { key: 'eliminateStops', label: 'Eliminate Stops', sortable: true },
    { key: 'decreasedIdle', label: 'Decreased Idle', sortable: true }
  ];

  el.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Mono:wght@400;600&display=swap');
      
      :root {
        --bg-primary: #0a0e27;
        --bg-secondary: #141b3d;
        --bg-hover: #1a2350;
        --text-primary: #e8e9f0;
        --text-secondary: #9197b3;
        --accent-gold: #d4af37;
        --accent-cyan: #00d4ff;
        --accent-red: #ff4757;
        --border-color: #2a3458;
      }
      
      .table-container {
        background: linear-gradient(135deg, #0a0e27 0%, #141b3d 100%);
        min-height: 600px;
        padding: 3rem;
        font-family: 'IBM Plex Mono', monospace;
        color: var(--text-primary);
        position: relative;
        overflow: hidden;
      }
      
      .table-container::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
        animation: pulse 8s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
        50% { transform: scale(1.2) rotate(90deg); opacity: 0.8; }
      }
      
      .header-section {
        position: relative;
        z-index: 1;
        margin-bottom: 2.5rem;
      }
      
      .title {
        font-family: 'Playfair Display', serif;
        font-size: 3.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-cyan) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0 0 1rem 0;
        letter-spacing: -0.02em;
        animation: slideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .subtitle {
        color: var(--text-secondary);
        font-size: 0.95rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        animation: fadeIn 1s ease-out 0.3s both;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .controls {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        position: relative;
        z-index: 1;
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .search-box {
        flex: 1;
        min-width: 300px;
        position: relative;
      }
      
      .search-box input {
        width: 100%;
        padding: 1rem 1.5rem 1rem 3.5rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-primary);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.95rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      .search-box input:focus {
        outline: none;
        border-color: var(--accent-gold);
        box-shadow: 0 4px 30px rgba(212, 175, 55, 0.3);
        transform: translateY(-2px);
      }
      
      .search-box::before {
        content: '⌕';
        position: absolute;
        left: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--accent-gold);
        font-size: 1.3rem;
        font-weight: 600;
      }
      
      .filter-group {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      
      .filter-select {
        padding: 1rem 2.5rem 1rem 1.5rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-primary);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23d4af37' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      .filter-select:hover {
        border-color: var(--accent-cyan);
        transform: translateY(-2px);
      }
      
      .reset-btn {
        padding: 1rem 2rem;
        background: linear-gradient(135deg, var(--accent-red) 0%, #ee5a6f 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        box-shadow: 0 4px 20px rgba(255, 71, 87, 0.3);
      }
      
      .reset-btn:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 30px rgba(255, 71, 87, 0.5);
      }
      
      .table-wrapper {
        position: relative;
        z-index: 1;
        overflow-x: auto;
        border-radius: 16px;
        background: var(--bg-secondary);
        box-shadow: 0 10px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid var(--border-color);
        animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
      }
      
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      
      thead {
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      th {
        padding: 1.5rem 1.5rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--accent-gold);
        border-bottom: 2px solid var(--border-color);
        cursor: pointer;
        user-select: none;
        transition: all 0.3s ease;
        position: relative;
      }
      
      th:hover {
        background: var(--bg-hover);
        color: var(--accent-cyan);
      }
      
      th.sortable::after {
        content: '⇅';
        margin-left: 0.5rem;
        opacity: 0.3;
        transition: all 0.3s ease;
      }
      
      th.sort-asc::after {
        content: '↑';
        opacity: 1;
        color: var(--accent-gold);
      }
      
      th.sort-desc::after {
        content: '↓';
        opacity: 1;
        color: var(--accent-gold);
      }
      
      tbody tr {
        border-bottom: 1px solid var(--border-color);
        transition: all 0.3s ease;
        animation: fadeInRow 0.5s ease-out both;
      }
      
      @keyframes fadeInRow {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      tbody tr:nth-child(1) { animation-delay: 0.1s; }
      tbody tr:nth-child(2) { animation-delay: 0.2s; }
      tbody tr:nth-child(3) { animation-delay: 0.3s; }
      tbody tr:nth-child(4) { animation-delay: 0.4s; }
      tbody tr:nth-child(5) { animation-delay: 0.5s; }
      
      tbody tr:hover {
        background: var(--bg-hover);
        transform: scale(1.01);
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1);
      }
      
      td {
        padding: 1.25rem 1.5rem;
        color: var(--text-primary);
        font-size: 0.95rem;
      }
      
      td:first-child {
        font-weight: 600;
        color: var(--accent-cyan);
      }
      
      .percentage-cell {
        position: relative;
        font-weight: 600;
      }
      
      .percentage-bar {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
        border-radius: 4px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: -1;
      }
      
      .no-results {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--text-secondary);
        font-size: 1.1rem;
        animation: fadeIn 0.5s ease-out;
      }
      
      .stats-bar {
        display: flex;
        gap: 2rem;
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
      }
      
      .stat-item {
        flex: 1;
        text-align: center;
      }
      
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--accent-gold);
        font-family: 'Playfair Display', serif;
      }
      
      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-top: 0.5rem;
      }
    </style>
    
    <div class="table-container">
      <div class="header-section">
        <h1 class="title">Fuel Efficiency Analysis</h1>
        <p class="subtitle">Interactive Data Explorer</p>
      </div>
      
      <div class="controls">
        <div class="search-box">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Search across all columns..."
          />
        </div>
        
        <div class="filter-group">
          <select id="columnFilter" class="filter-select">
            <option value="">All Columns</option>
            <option value="cycle">Cycle Name</option>
            <option value="ki">KI (1/km)</option>
            <option value="distance">Distance (mi)</option>
            <option value="improvedSpeed">Improved Speed</option>
            <option value="decreasedAccel">Decreased Accel</option>
            <option value="eliminateStops">Eliminate Stops</option>
            <option value="decreasedIdle">Decreased Idle</option>
          </select>
          
          <button id="resetBtn" class="reset-btn">Reset</button>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table id="dataTable">
          <thead>
            <tr id="headerRow"></tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
      
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value" id="totalRows">0</div>
          <div class="stat-label">Total Cycles</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="avgKI">0</div>
          <div class="stat-label">Avg KI</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="avgDistance">0</div>
          <div class="stat-label">Avg Distance</div>
        </div>
      </div>
    </div>
  `;

  let currentSort = { column: null, direction: 'asc' };
  let filteredData = [...cleanData];

  function parsePercentage(val) {
    if (typeof val === 'string') {
      return parseFloat(val.replace('%', '')) || 0;
    }
    return val;
  }

  function renderTable(data) {
    const headerRow = el.querySelector('#headerRow');
    const tableBody = el.querySelector('#tableBody');
    
    // Render headers
    headerRow.innerHTML = headers.map(header => `
      <th class="${header.sortable ? 'sortable' : ''} ${currentSort.column === header.key ? 'sort-' + currentSort.direction : ''}" 
          data-column="${header.key}">
        ${header.label}
      </th>
    `).join('');
    
    // Render rows
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="no-results">No results found</td></tr>';
    } else {
      tableBody.innerHTML = data.map((row, index) => `
        <tr style="animation-delay: ${index * 0.1}s">
          <td>${row.cycle}</td>
          <td>${row.ki.toFixed(2)}</td>
          <td>${row.distance.toFixed(1)}</td>
          <td class="percentage-cell">
            <div class="percentage-bar" style="width: ${parsePercentage(row.improvedSpeed) * 3}%"></div>
            ${row.improvedSpeed}
          </td>
          <td class="percentage-cell">
            <div class="percentage-bar" style="width: ${parsePercentage(row.decreasedAccel) * 3}%"></div>
            ${row.decreasedAccel}
          </td>
          <td class="percentage-cell">
            <div class="percentage-bar" style="width: ${parsePercentage(row.eliminateStops) * 3}%"></div>
            ${row.eliminateStops}
          </td>
          <td class="percentage-cell">
            <div class="percentage-bar" style="width: ${parsePercentage(row.decreasedIdle) * 3}%"></div>
            ${row.decreasedIdle}
          </td>
        </tr>
      `).join('');
    }
    
    updateStats(data);
  }

  function updateStats(data) {
    const totalRows = el.querySelector('#totalRows');
    const avgKI = el.querySelector('#avgKI');
    const avgDistance = el.querySelector('#avgDistance');
    
    totalRows.textContent = data.length;
    
    if (data.length > 0) {
      const sumKI = data.reduce((sum, row) => sum + row.ki, 0);
      const sumDistance = data.reduce((sum, row) => sum + row.distance, 0);
      avgKI.textContent = (sumKI / data.length).toFixed(2);
      avgDistance.textContent = (sumDistance / data.length).toFixed(1);
    } else {
      avgKI.textContent = '0';
      avgDistance.textContent = '0';
    }
  }

  function sortTable(column) {
    if (currentSort.column === column) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.column = column;
      currentSort.direction = 'asc';
    }
    
    filteredData.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];
      
      // Handle percentages
      if (typeof valA === 'string' && valA.includes('%')) {
        valA = parsePercentage(valA);
        valB = parsePercentage(valB);
      }
      
      // Handle numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return currentSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      
      // Handle strings
      const comparison = String(valA).localeCompare(String(valB));
      return currentSort.direction === 'asc' ? comparison : -comparison;
    });
    
    renderTable(filteredData);
  }

  function filterTable() {
    const searchTerm = el.querySelector('#searchInput').value.toLowerCase();
    const columnFilter = el.querySelector('#columnFilter').value;
    
    filteredData = cleanData.filter(row => {
      const columns = columnFilter ? [columnFilter] : Object.keys(row);
      
      return columns.some(col => {
        const value = String(row[col]).toLowerCase();
        return value.includes(searchTerm);
      });
    });
    
    renderTable(filteredData);
  }

  function reset() {
    el.querySelector('#searchInput').value = '';
    el.querySelector('#columnFilter').value = '';
    currentSort = { column: null, direction: 'asc' };
    filteredData = [...cleanData];
    renderTable(filteredData);
  }

  // Event listeners
  el.querySelector('#headerRow').addEventListener('click', (e) => {
    if (e.target.tagName === 'TH' && e.target.dataset.column) {
      sortTable(e.target.dataset.column);
    }
  });

  el.querySelector('#searchInput').addEventListener('input', filterTable);
  el.querySelector('#columnFilter').addEventListener('change', filterTable);
  el.querySelector('#resetBtn').addEventListener('click', reset);

  // Initial render
  renderTable(filteredData);

  // Listen for data changes
  model.on('change:data', () => {
    const newData = model.get('data');
    cleanData.length = 0;
    cleanData.push(...newData.slice(1).map(row => ({
      cycle: row["Cycle \nName"],
      ki: parseFloat(row["KI \n(1/km)"]) || 0,
      distance: parseFloat(row["Distance \n(mi)"]) || 0,
      improvedSpeed: row["Percent Fuel Savings"],
      decreasedAccel: row["Column_4"],
      eliminateStops: row["Column_5"],
      decreasedIdle: row["Column_6"]
    })));
    reset();
  });
}

export default { render };