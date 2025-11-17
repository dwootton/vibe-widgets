import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  // Create container with custom styling
  el.innerHTML = "";
  const container = document.createElement("div");
  container.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 40px;
    font-family: 'Crimson Text', serif;
    background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 500px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  `;
  
  // Add decorative background elements
  const bgDecor = document.createElement("div");
  bgDecor.style.cssText = `
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,107,107,0.1) 0%, transparent 70%);
    border-radius: 50%;
    top: -100px;
    right: -100px;
    pointer-events: none;
  `;
  container.appendChild(bgDecor);
  
  const bgDecor2 = document.createElement("div");
  bgDecor2.style.cssText = `
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(100,200,255,0.08) 0%, transparent 70%);
    border-radius: 50%;
    bottom: -50px;
    left: -50px;
    pointer-events: none;
  `;
  container.appendChild(bgDecor2);
  
  // Title
  const title = document.createElement("h1");
  title.textContent = "Category Performance";
  title.style.cssText = `
    font-size: 42px;
    font-weight: 400;
    color: #fafafa;
    margin: 0 0 40px 0;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 1;
    text-align: center;
    font-family: 'Playfair Display', serif;
  `;
  container.appendChild(title);
  
  // Chart container
  const chartContainer = document.createElement("div");
  chartContainer.style.cssText = `
    width: 100%;
    max-width: 600px;
    height: 350px;
    position: relative;
    z-index: 1;
  `;
  container.appendChild(chartContainer);
  
  // SVG setup
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;
  
  const svg = d3.select(chartContainer)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto");
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Scales
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, width])
    .padding(0.25);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) * 1.1])
    .range([height, 0]);
  
  // Color scale with vibrant palette
  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.category))
    .range(["#ff6b6b", "#4ecdc4", "#ffd93d", "#a8e6cf"]);
  
  // Add grid lines
  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    );
  
  // Y-axis
  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yScale).ticks(5))
    .style("color", "#888")
    .style("font-size", "12px")
    .style("font-family", "Lora, serif");
  
  // X-axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style("color", "#888")
    .style("font-size", "14px")
    .style("font-family", "Lora, serif")
    .style("font-weight", "600");
  
  // Bars with animation
  const bars = g.selectAll(".bar")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "bar");
  
  bars.append("rect")
    .attr("x", d => xScale(d.category))
    .attr("y", height)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("fill", d => colorScale(d.category))
    .attr("rx", 6)
    .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.3))")
    .style("cursor", "pointer")
    .on("mouseenter", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("fill", d3.color(colorScale(d.category)).brighter(0.5))
        .style("filter", "drop-shadow(0 12px 24px rgba(0,0,0,0.5))");
      
      tooltip.style("opacity", 1)
        .html(`<strong>${d.category}</strong><br/>${d.value}`)
        .style("left", (event.pageX - chartContainer.getBoundingClientRect().left + 10) + "px")
        .style("top", (event.pageY - chartContainer.getBoundingClientRect().top - 28) + "px");
    })
    .on("mouseleave", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("fill", colorScale(d.category))
        .style("filter", "drop-shadow(0 8px 16px rgba(0,0,0,0.3))");
      
      tooltip.style("opacity", 0);
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 120)
    .attr("y", d => yScale(d.value))
    .attr("height", d => height - yScale(d.value));
  
  // Value labels on bars
  bars.append("text")
    .attr("x", d => xScale(d.category) + xScale.bandwidth() / 2)
    .attr("y", height)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#fafafa")
    .attr("font-size", "14px")
    .attr("font-family", "Lora, serif")
    .attr("font-weight", "600")
    .attr("opacity", 0)
    .text(d => d.value)
    .transition()
    .duration(800)
    .delay((d, i) => i * 120 + 400)
    .attr("y", d => yScale(d.value) - 15)
    .attr("opacity", 1);
  
  // Tooltip
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position: absolute;
    background: rgba(250, 250, 250, 0.95);
    color: #1a1a2e;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    backdrop-filter: blur(4px);
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: Lora, serif;
  `;
  chartContainer.appendChild(tooltip);
  
  el.appendChild(container);
  
  // Handle data updates
  model.on("change:data", () => {
    const newData = model.get("data");
    render({ model: { get: (key) => newData }, el });
  });
}

export default { render };