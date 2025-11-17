import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  el.innerHTML = '';
  
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    .table-container {
      width: 100%;
      height: 700px;
      background: linear-gradient(165deg, #0a0e1a 0%, #1a1625 50%, #0f1419 100%);
      padding: 48px;
      font-family: 'Crimson Text', serif;
      color: #e8dcc4;
      position: relative;
      overflow: hidden;
    }
    
    .table-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(139, 92, 46, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(46, 71, 93, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .table-header {
      margin-bottom: 32px;
      position: relative;
      z-index: 1;
    }
    
    .table-title {
      font-family: 'Cinzel', serif;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #d4af69;
      margin: 0 0 12px 0;
      text-shadow: 0 0 20px rgba(212, 175, 105, 0.3);
    }
    
    .filter-input {
      background: rgba(232, 220, 196, 0.05);
      border: 1px solid rgba(212, 175, 105, 0.2);
      border-radius: 0;
      padding: 12px 18px;
      font-family: 'Crimson Text', serif;
      font-size: 16px;
      color: #e8dcc4;
      width: 320px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }
    
    .filter-input::placeholder {
      color: rgba(232, 220, 196, 0.4);
      font-style: italic;
    }
    
    .filter-input:focus {
      background: rgba(232, 220, 196, 0.08);
      border-color: #d4af69;
      box-shadow: 0 0 20px rgba(212, 175, 105, 0.15);
    }
    
    .table-wrapper {
      max-height: 520px;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(212, 175, 105, 0.15);
      background: rgba(10, 14, 26, 0.6);
      backdrop-filter: blur(10px);
    }
    
    .table-wrapper::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    
    .table-wrapper::-webkit-scrollbar-track {
      background: rgba(232, 220, 196, 0.03);
    }
    
    .table-wrapper::-webkit-scrollbar-thumb {
      background: rgba(212, 175, 105, 0.3);
      transition: background 0.3s;
    }
    
    .table-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(212, 175, 105, 0.5);
    }
    
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .data-table thead {
      position: sticky;
      top: 0;
      z-index: 10;
      background: linear-gradient(180deg, #1a1625 0%, #14111d 100%);
    }
    
    .data-table th {
      padding: 18px 24px;
      text-align: left;
      font-family: 'Cinzel', serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #d4af69;
      border-bottom: 2px solid rgba(212, 175, 105, 0.3);
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: all 0.3s ease;
      white-space: pre-line;
    }
    
    .data-table th:hover {
      background: rgba(212, 175, 105, 0.08);
      color: #e8c87a;
    }
    
    .sort-indicator {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .data-table th:hover .sort-indicator {
      opacity: 0.5;
    }
    
    .data-table th.sorted .sort-indicator {
      opacity: 1;
    }
    
    .data-table th.sorted.asc .sort-indicator::after {
      content: '▲';
    }
    
    .data-table th.sorted.desc .sort-indicator::after {
      content: '▼';
    }
    
    .data-table tbody tr {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: fadeIn 0.6s ease-out backwards;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .data-table tbody tr:nth-child(even) {
      background: rgba(232, 220, 196, 0.02);
    }
    
    .data-table tbody tr:hover {
      background: rgba(212, 175, 105, 0.08);
      transform: translateX(4px);
      box-shadow: inset 3px 0 0 #d4af69;
    }
    
    .data-table td {
      padding: 16px 24px;
      font-size: 15px;
      color: #e8dcc4;
      border-bottom: 1px solid rgba(212, 175, 105, 0.06);
      transition: all 0.3s;
    }
    
    .no-results {
      text-align: center;
      padding: 60px;
      font-size: 18px;
      color: rgba(232, 220, 196, 0.4);
      font-style: italic;
    }
    
    .row-count {
      position: absolute;
      bottom: 24px;
      right: 48px;
      font-size: 13px;
      color: rgba(212, 175, 105, 0.6);
      font-style: italic;
      z-index: 1;
    }
  `;
  el.appendChild(style);
  
  const container = document.createElement('div');
  container.className = 'table-container';
  
  const header = document.createElement('div');
  header.className = 'table-header';
  
  const title = document.createElement('h1');
  title.className = 'table-title';
  title.textContent = 'Cycle Analytics';
  header.appendChild(title);
  
  const filterInput = document.createElement('input');
  filterInput.className = 'filter-input';
  filterInput.type = 'text';
  filterInput.placeholder = 'Filter rows by any column...';
  header.appendChild(filterInput);
  
  container.appendChild(header);
  
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'table-wrapper';
  
  const table = document.createElement('table');
  table.className = 'data-table';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  let sortColumn = null;
  let sortDirection = 'asc';
  let filterText = '';
  
  const columns = data.columns;
  
  columns.forEach((col, idx) => {
    const th = document.createElement('th');
    th.textContent = col;
    th.dataset.column = idx;
    
    const sortIndicator = document.createElement('span');
    sortIndicator.className = 'sort-indicator';
    th.appendChild(sortIndicator);
    
    th.addEventListener('click', () => {
      if (sortColumn === idx) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = idx;
        sortDirection = 'asc';
      }
      
      document.querySelectorAll('.data-table th').forEach(header => {
        header.classList.remove('sorted', 'asc', 'desc');
      });
      
      th.classList.add('sorted', sortDirection);
      
      renderRows();
    });
    
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);
  
  const rowCount = document.createElement('div');
  rowCount.className = 'row-count';
  container.appendChild(rowCount);
  
  function renderRows() {
    tbody.innerHTML = '';
    
    let rows = data.sample.map((row, idx) => ({ ...row, _idx: idx }));
    
    if (filterText) {
      rows = rows.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(filterText.toLowerCase())
        );
      });
    }
    
    if (sortColumn !== null) {
      const colName = columns[sortColumn];
      rows.sort((a, b) => {
        let valA = a[colName] || '';
        let valB = b[colName] || '';
        
        const numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
        const numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
        
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        
        if (sortDirection === 'asc') {
          return valA < valB ? -1 : valA > valB ? 1 : 0;
        } else {
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        }
      });
    }
    
    if (rows.length === 0) {
      const noResultsRow = document.createElement('tr');
      const noResultsCell = document.createElement('td');
      noResultsCell.colSpan = columns.length;
      noResultsCell.className = 'no-results';
      noResultsCell.textContent = 'No matching records found';
      noResultsRow.appendChild(noResultsCell);
      tbody.appendChild(noResultsRow);
      rowCount.textContent = '0 rows';
      return;
    }
    
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${idx * 0.03}s`;
      
      columns.forEach(col => {
        const td = document.createElement('td');
        td.textContent = row[col] || '';
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    rowCount.textContent = `${rows.length} row${rows.length !== 1 ? 's' : ''}`;
  }
  
  filterInput.addEventListener('input', (e) => {
    filterText = e.target.value;
    renderRows();
  });
  
  renderRows();
  
  el.appendChild(container);
  
  model.on("change:data", () => {
    const newData = model.get("data");
    Object.assign(data, newData);
    sortColumn = null;
    sortDirection = 'asc';
    filterText = '';
    filterInput.value = '';
    renderRows();
  });
}

export default { render };