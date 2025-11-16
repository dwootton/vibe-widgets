import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  el.innerHTML = "";
  el.style.cssText = `
    width: 100%;
    height: 600px;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #0f1428 100%);
    position: relative;
    overflow: hidden;
    font-family: 'Orbitron', monospace;
  `;

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
    
    .scatter-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 30%, rgba(0, 255, 170, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(255, 0, 230, 0.08) 0%, transparent 50%);
      animation: bgPulse 8s ease-in-out infinite;
    }
    
    @keyframes bgPulse {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.15); }
    }
    
    .grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(0, 255, 170, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 170, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      opacity: 0;
      animation: gridFadeIn 1.5s ease-out 0.3s forwards;
    }
    
    @keyframes gridFadeIn {
      to { opacity: 1; }
    }
    
    .title-container {
      position: absolute;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      text-align: center;
      opacity: 0;
      animation: titleSlide 1s ease-out 0.5s forwards;
    }
    
    @keyframes titleSlide {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    .main-title {
      font-family: 'Orbitron', monospace;
      font-weight: 900;
      font-size: 28px;
      color: #00ffaa;
      text-transform: uppercase;
      letter-spacing: 4px;
      text-shadow: 
        0 0 10px rgba(0, 255, 170, 0.8),
        0 0 20px rgba(0, 255, 170, 0.4),
        0 0 30px rgba(0, 255, 170, 0.2);
      margin: 0;
    }
    
    .subtitle {
      font-family: 'Rajdhani', sans-serif;
      font-weight: 300;
      font-size: 13px;
      color: #ff00e6;
      letter-spacing: 2px;
      margin-top: 5px;
      text-shadow: 0 0 8px rgba(255, 0, 230, 0.6);
    }
    
    .zoom-controls {
      position: absolute;
      top: 25px;
      right: 30px;
      display: flex;
      gap: 10px;
      z-index: 10;
      opacity: 0;
      animation: controlsSlide 1s ease-out 0.8s forwards;
    }
    
    @keyframes controlsSlide {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .zoom-btn {
      width: 40px;
      height: 40px;
      background: rgba(0, 255, 170, 0.1);
      border: 2px solid rgba(0, 255, 170, 0.5);
      color: #00ffaa;
      font-family: 'Orbitron', monospace;
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .zoom-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(0, 255, 170, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.5s, height 0.5s;
    }
    
    .zoom-btn:hover::before {
      width: 100px;
      height: 100px;
    }
    
    .zoom-btn:hover {
      background: rgba(0, 255, 170, 0.2);
      border-color: #00ffaa;
      box-shadow: 0 0 20px rgba(0, 255, 170, 0.5);
      transform: scale(1.1);
    }
    
    .zoom-btn span {
      position: relative;
      z-index: 1;
    }
    
    svg {
      display: block;
    }
    
    .axis path,
    .axis line {
      stroke: rgba(0, 255, 170, 0.3);
      stroke-width: 2;
      shape-rendering: crispEdges;
    }
    
    .axis text {
      fill: #00ffaa;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 600;
      font-size: 13px;
      text-shadow: 0 0 5px rgba(0, 255, 170, 0.5);
    }
    
    .axis-label {
      fill: #ff00e6;
      font-family: 'Orbitron', monospace;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
      text-shadow: 0 0 8px rgba(255, 0, 230, 0.7);
    }
    
    .data-point {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .data-point circle {
      filter: drop-shadow(0 0 8px currentColor);
    }
    
    .data-point:hover circle {
      filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor);
    }
    
    .tooltip {
      position: absolute;
      padding: 12px 16px;
      background: rgba(10, 14, 39, 0.95);
      border: 2px solid #00ffaa;
      border-radius: 8px;
      pointer-events: none;
      font-family: 'Rajdhani', sans-serif;
      font-size: 14px;
      color: #00ffaa;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 100;
      box-shadow: 
        0 0 20px rgba(0, 255, 170, 0.4),
        inset 0 0 20px rgba(0, 255, 170, 0.1);
      backdrop-filter: blur(10px);
    }
    
    .tooltip.visible {
      opacity: 1;
    }
    
    .tooltip-label {
      font-weight: 600;
      color: #ff00e6;
      text-shadow: 0 0 5px rgba(255, 0, 230, 0.6);
    }
    
    .crosshair {
      stroke: rgba(0, 255, 170, 0.3);
      stroke-width: 1;
      stroke-dasharray: 5, 5;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .crosshair.visible {
      opacity: 1;
    }
    
    @keyframes pointAppear {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.className = "scatter-container";
  el.appendChild(container);

  const gridOverlay = document.createElement("div");
  gridOverlay.className = "grid-overlay";
  container.appendChild(gridOverlay);

  const titleContainer = document.createElement("div");
  titleContainer.className = "title-container";
  titleContainer.innerHTML = `
    <h1 class="main-title">BIOMETRIC NEXUS</h1>
    <div class="subtitle">Height × Weight Matrix</div>
  `;
  container.appendChild(titleContainer);

  const zoomControls = document.createElement("div");
  zoomControls.className = "zoom-controls";
  zoomControls.innerHTML = `
    <button class="zoom-btn zoom-in"><span>+</span></button>
    <button class="zoom-btn zoom-out"><span>−</span></button>
    <button class="zoom-btn zoom-reset"><span>⟲</span></button>
  `;
  container.appendChild(zoomControls);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  container.appendChild(tooltip);

  const margin = { top: 100, right: 60, bottom: 80, left: 80 };
  const width = el.clientWidth - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", el.clientWidth)
    .attr("height", 600)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const crosshairX = svg.append("line")
    .attr("class", "crosshair")
    .attr("y1", 0)
    .attr("y2", height);

  const crosshairY = svg.append("line")
    .attr("class", "crosshair")
    .attr("x1", 0)
    .attr("x2", width);

  const xScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.height) - 10, d3.max(data, d => d.height) + 10])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.weight) - 10, d3.max(data, d => d.weight) + 10])
    .range([height, 0]);

  const xAxis = d3.axisBottom(xScale).ticks(8);
  const yAxis = d3.axisLeft(yScale).ticks(8);

  const xAxisG = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  const yAxisG = svg.append("g")
    .attr("class", "axis")
    .call(yAxis);

  svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .text("HEIGHT");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -55)
    .attr("x", -height / 2)
    .text("WEIGHT");

  const colorScale = d3.scaleSequential()
    .domain([0, data.length - 1])
    .interpolator(d3.interpolateRgbBasis(["#00ffaa", "#00ccff", "#ff00e6"]));

  const clip = svg.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  const scatterGroup = svg.append("g")
    .attr("clip-path", "url(#clip)");

  const points = scatterGroup.selectAll(".data-point")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "data-point")
    .style("opacity", 0)
    .style("transform", "scale(0)")
    .attr("transform", d => `translate(${xScale(d.height)},${yScale(d.weight)})`);

  points.each(function(d, i) {
    d3.select(this)
      .transition()
      .delay(i * 150 + 1000)
      .duration(600)
      .ease(d3.easeCubicOut)
      .style("opacity", 1)
      .style("transform", "scale(1)");
  });

  points.append("circle")
    .attr("r", 8)
    .attr("fill", (d, i) => colorScale(i))
    .attr("stroke", (d, i) => colorScale(i))
    .attr("stroke-width", 2);

  points.on("mouseenter", function(event, d) {
    d3.select(this).select("circle")
      .transition()
      .duration(200)
      .attr("r", 14);

    tooltip.innerHTML = `
      <div><span class="tooltip-label">HEIGHT:</span> ${d.height} cm</div>
      <div><span class="tooltip-label">WEIGHT:</span> ${d.weight} kg</div>
    `;
    tooltip.classList.add("visible");
  })
  .on("mousemove", function(event) {
    tooltip.style.left = (event.pageX - el.offsetLeft + 20) + "px";
    tooltip.style.top = (event.pageY - el.offsetTop - 40) + "px";
  })
  .on("mouseleave", function() {
    d3.select(this).select("circle")
      .transition()
      .duration(200)
      .attr("r", 8);
    tooltip.classList.remove("visible");
  });

  svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);
    if (mx >= 0 && mx <= width && my >= 0 && my <= height) {
      crosshairX.attr("x1", mx).attr("x2", mx).classed("visible", true);
      crosshairY.attr("y1", my).attr("y2", my).classed("visible", true);
    }
  })
  .on("mouseleave", function() {
    crosshairX.classed("visible", false);
    crosshairY.classed("visible", false);
  });

  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .extent([[0, 0], [width, height]])
    .on("zoom", (event) => {
      const transform = event.transform;
      
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
      
      xAxisG.call(xAxis.scale(newXScale));
      yAxisG.call(yAxis.scale(newYScale));
      
      points.attr("transform", d => 
        `translate(${newXScale(d.height)},${newYScale(d.weight)})`
      );
    });

  svg.call(zoom);

  zoomControls.querySelector(".zoom-in").addEventListener("click", () => {
    svg.transition().duration(500).call(zoom.scaleBy, 1.5);
  });

  zoomControls.querySelector(".zoom-out").addEventListener("click", () => {
    svg.transition().duration(500).call(zoom.scaleBy, 0.67);
  });

  zoomControls.querySelector(".zoom-reset").addEventListener("click", () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });

  model.on("change:data", () => {
    const newData = model.get("data");
    xScale.domain([d3.min(newData, d => d.height) - 10, d3.max(newData, d => d.height) + 10]);
    yScale.domain([d3.min(newData, d => d.weight) - 10, d3.max(newData, d => d.weight) + 10]);
    
    xAxisG.transition().duration(750).call(xAxis);
    yAxisG.transition().duration(750).call(yAxis);
    
    const updatedPoints = scatterGroup.selectAll(".data-point")
      .data(newData);
    
    updatedPoints.exit().remove();
    
    const newPoints = updatedPoints.enter()
      .append("g")
      .attr("class", "data-point")
      .merge(updatedPoints);
    
    newPoints.transition()
      .duration(750)
      .attr("transform", d => `translate(${xScale(d.height)},${yScale(d.weight)})`);
  });
}

export default { render };