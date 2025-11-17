import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  // Container setup
  el.innerHTML = '';
  el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  el.style.padding = '20px';
  el.style.backgroundColor = '#f8f9fa';
  
  const container = document.createElement('div');
  container.style.backgroundColor = 'white';
  container.style.borderRadius = '8px';
  container.style.padding = '20px';
  container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  el.appendChild(container);
  
  // Title
  const title = document.createElement('h2');
  title.textContent = 'Cancer Mortality Rates: Crude vs Age-Adjusted';
  title.style.marginTop = '0';
  title.style.color = '#2c3e50';
  container.appendChild(title);
  
  // Filter section
  const filterContainer = document.createElement('div');
  filterContainer.style.marginBottom = '20px';
  filterContainer.style.display = 'flex';
  filterContainer.style.gap = '10px';
  filterContainer.style.alignItems = 'center';
  container.appendChild(filterContainer);
  
  const filterLabel = document.createElement('label');
  filterLabel.textContent = 'Filter by Cancer Type: ';
  filterLabel.style.fontWeight = 'bold';
  filterLabel.style.color = '#34495e';
  filterContainer.appendChild(filterLabel);
  
  const filterInput = document.createElement('input');
  filterInput.type = 'text';
  filterInput.placeholder = 'e.g., Lung, Breast, Colon...';
  filterInput.style.padding = '8px 12px';
  filterInput.style.border = '1px solid #ddd';
  filterInput.style.borderRadius = '4px';
  filterInput.style.width = '300px';
  filterInput.style.fontSize = '14px';
  filterContainer.appendChild(filterInput);
  
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear';
  clearButton.style.padding = '8px 16px';
  clearButton.style.backgroundColor = '#e74c3c';
  clearButton.style.color = 'white';
  clearButton.style.border = 'none';
  clearButton.style.borderRadius = '4px';
  clearButton.style.cursor = 'pointer';
  clearButton.style.fontSize = '14px';
  filterContainer.appendChild(clearButton);
  
  const countDisplay = document.createElement('span');
  countDisplay.style.marginLeft = '15px';
  countDisplay.style.color = '#7f8c8d';
  countDisplay.style.fontSize = '14px';
  filterContainer.appendChild(countDisplay);
  
  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.width = '100%';
  chartDiv.style.height = '600px';
  container.appendChild(chartDiv);
  
  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = 'rgba(0,0,0,0.85)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '12px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.opacity = '0';
  tooltip.style.transition = 'opacity 0.2s';
  tooltip.style.fontSize = '13px';
  tooltip.style.maxWidth = '300px';
  tooltip.style.zIndex = '1000';
  el.appendChild(tooltip);
  
  let filteredData = data.filter(d => 
    d['Crude Rate'] != null && 
    d['Age-Adjusted Rate'] != null &&
    d['Cancer Sites'] != null
  );
  
  function updateChart(searchTerm = '') {
    let displayData = filteredData;
    
    if (searchTerm) {
      displayData = filteredData.filter(d => 
        d['Cancer Sites'].toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    countDisplay.textContent = `Showing ${displayData.length} of ${filteredData.length} cancer types`;
    
    const margin = { top: 20, right: 120, bottom: 60, left: 60 };
    const width = chartDiv.clientWidth - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;
    
    chartDiv.innerHTML = '';
    
    const svg = d3.select(chartDiv)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(displayData, d => d['Crude Rate']) * 1.05])
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(displayData, d => d['Age-Adjusted Rate']) * 1.05])
      .range([height, 0]);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(displayData, d => d['Deaths'])])
      .range([3, 20]);
    
    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(''));
    
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat(''));
    
    // Diagonal reference line
    const maxVal = Math.max(xScale.domain()[1], yScale.domain()[1]);
    svg.append('line')
      .attr('x1', xScale(0))
      .attr('y1', yScale(0))
      .attr('x2', xScale(maxVal))
      .attr('y2', yScale(maxVal))
      .attr('stroke', '#95a5a6')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.5);
    
    // Circles
    const circles = svg.selectAll('circle')
      .data(displayData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d['Crude Rate']))
      .attr('cy', d => yScale(d['Age-Adjusted Rate']))
      .attr('r', d => sizeScale(d['Deaths']))
      .attr('fill', (d, i) => colorScale(i))
      .attr('opacity', 0.7)
      .attr('stroke', '#2c3e50')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('stroke-width', 2);
        
        tooltip.innerHTML = `
          <strong>${d['Cancer Sites']}</strong><br/>
          Crude Rate: ${d['Crude Rate'].toFixed(1)}<br/>
          Age-Adjusted Rate: ${d['Age-Adjusted Rate'].toFixed(1)}<br/>
          Deaths: ${d['Deaths'].toLocaleString()}<br/>
          Rate Difference: ${(d['Crude Rate'] - d['Age-Adjusted Rate']).toFixed(1)}
        `;
        tooltip.style.opacity = '1';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
      })
      .on('mousemove', function(event) {
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.7)
          .attr('stroke-width', 1);
        
        tooltip.style.opacity = '0';
      });
    
    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .style('font-size', '12px');
    
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Crude Rate (per 100,000)');
    
    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '12px');
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Age-Adjusted Rate (per 100,000)');
    
    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`);
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('Circle Size:');
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', 15)
      .style('font-size', '11px')
      .style('fill', '#7f8c8d')
      .text('Death Count');
  }
  
  updateChart();
  
  filterInput.addEventListener('input', (e) => {
    updateChart(e.target.value);
  });
  
  clearButton.addEventListener('click', () => {
    filterInput.value = '';
    updateChart();
  });
  
  model.on("change:data", () => {
    const newData = model.get("data");
    filteredData = newData.filter(d => 
      d['Crude Rate'] != null && 
      d['Age-Adjusted Rate'] != null &&
      d['Cancer Sites'] != null
    );
    updateChart(filterInput.value);
  });
}

export default { render };