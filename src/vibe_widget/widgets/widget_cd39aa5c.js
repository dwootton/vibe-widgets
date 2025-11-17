import * as d3 from "https://esm.sh/d3@7";
import * as topojson from "https://esm.sh/topojson-client@3";

function render({ model, el }) {
  const data = model.get("data");
  
  // Parse and clean data
  const earthquakes = data
    .filter(d => d.latitude != null && d.longitude != null && d.magnitude != null && d.datetime != null)
    .map(d => ({
      ...d,
      datetime: new Date(d.datetime),
      magnitude: +d.magnitude,
      depth: d.depth != null ? +d.depth : null,
      latitude: +d.latitude,
      longitude: +d.longitude
    }))
    .sort((a, b) => a.datetime - b.datetime);

  if (earthquakes.length === 0) {
    el.innerHTML = "<div style='color: white; padding: 20px;'>No valid earthquake data available</div>";
    return;
  }

  // Setup
  const width = el.clientWidth || 1200;
  const height = 700;
  
  // Inject custom fonts and styles
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@300;400;600&display=swap');
    
    .earthquake-viz {
      background: radial-gradient(ellipse at top, #0a0e27, #020408);
      position: relative;
      overflow: hidden;
      font-family: 'Rajdhani', sans-serif;
      color: #e0e6ff;
    }
    
    .earthquake-viz::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(255, 60, 0, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(0, 200, 255, 0.03) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .viz-title {
      font-family: 'Orbitron', monospace;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      text-align: center;
      padding: 30px 0 10px 0;
      background: linear-gradient(135deg, #ff3c00, #ff8800, #00c8ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: pulse 3s ease-in-out infinite;
      text-shadow: 0 0 30px rgba(255, 60, 0, 0.3);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    }
    
    .viz-subtitle {
      text-align: center;
      font-size: 14px;
      letter-spacing: 3px;
      color: #7a8ab0;
      margin-bottom: 20px;
      font-weight: 300;
    }
    
    .map-container {
      position: relative;
    }
    
    .land {
      fill: #1a1f3a;
      stroke: #2a3558;
      stroke-width: 0.5px;
    }
    
    .graticule {
      fill: none;
      stroke: #151933;
      stroke-width: 0.5px;
      stroke-opacity: 0.3;
    }
    
    .earthquake-marker {
      transition: all 0.3s ease;
      cursor: pointer;
      filter: drop-shadow(0 0 3px currentColor);
    }
    
    .earthquake-marker:hover {
      transform: scale(1.5);
      filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 12px currentColor);
    }
    
    .timeline-container {
      padding: 30px 50px;
      position: relative;
    }
    
    .timeline-label {
      font-family: 'Orbitron', monospace;
      font-size: 12px;
      letter-spacing: 2px;
      color: #7a8ab0;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    
    .slider-track {
      position: relative;
      height: 8px;
      background: linear-gradient(90deg, #1a1f3a, #2a3558);
      border-radius: 4px;
      overflow: visible;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    .slider-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff3c00, #ff6600, #ff8800);
      border-radius: 4px;
      transition: width 0.1s ease;
      box-shadow: 0 0 10px rgba(255, 60, 0, 0.5);
    }
    
    .slider-handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, #fff, #ff8800);
      border: 3px solid #ff3c00;
      border-radius: 50%;
      cursor: grab;
      box-shadow: 0 0 15px rgba(255, 60, 0, 0.8), 0 0 30px rgba(255, 60, 0, 0.4);
      transition: transform 0.2s ease;
    }
    
    .slider-handle:active {
      cursor: grabbing;
      transform: translate(-50%, -50%) scale(1.2);
    }
    
    .current-time {
      font-family: 'Orbitron', monospace;
      font-size: 16px;
      text-align: center;
      margin-top: 15px;
      color: #ff8800;
      letter-spacing: 1px;
    }
    
    .legend-container {
      position: absolute;
      top: 120px;
      right: 30px;
      background: rgba(10, 14, 39, 0.85);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a3558;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    
    .legend-title {
      font-family: 'Orbitron', monospace;
      font-size: 14px;
      letter-spacing: 2px;
      margin-bottom: 12px;
      color: #00c8ff;
      text-transform: uppercase;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin: 8px 0;
      font-size: 12px;
      color: #b0b8d0;
    }
    
    .legend-circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }
    
    .depth-legend {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #2a3558;
    }
    
    .depth-scale {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }
    
    .depth-gradient {
      width: 100px;
      height: 12px;
      background: linear-gradient(90deg, #00ff88, #ffff00, #ff6600, #cc0000);
      border-radius: 6px;
      margin-right: 10px;
    }
    
    .depth-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #7a8ab0;
      margin-top: 5px;
    }
    
    .stats-panel {
      position: absolute;
      top: 120px;
      left: 30px;
      background: rgba(10, 14, 39, 0.85);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #2a3558;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      min-width: 200px;
    }
    
    .stat-item {
      margin: 12px 0;
    }
    
    .stat-label {
      font-size: 11px;
      color: #7a8ab0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .stat-value {
      font-family: 'Orbitron', monospace;
      font-size: 24px;
      color: #ff8800;
      font-weight: 700;
      margin-top: 4px;
    }
    
    .tooltip {
      position: absolute;
      background: rgba(2, 4, 8, 0.95);
      border: 1px solid #ff8800;
      padding: 12px 16px;
      border-radius: 6px;
      pointer-events: none;
      font-size: 13px;
      line-height: 1.6;
      box-shadow: 0 4px 20px rgba(255, 136, 0, 0.3);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .tooltip-title {
      font-family: 'Orbitron', monospace;
      font-weight: 600;
      color: #ff8800;
      margin-bottom: 6px;
    }
    
    .tooltip-row {
      color: #b0b8d0;
      margin: 3px 0;
    }
    
    .tooltip-label {
      color: #7a8ab0;
      margin-right: 6px;
    }
  `;
  el.appendChild(style);

  // Create container
  const container = document.createElement("div");
  container.className = "earthquake-viz";
  container.style.width = width + "px";
  container.style.height = height + "px";
  el.appendChild(container);

  // Title
  const title = document.createElement("div");
  title.className = "viz-title";
  title.textContent = "Seismic Activity";
  container.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.className = "viz-subtitle";
  subtitle.textContent = "Global Earthquake Monitor • January 2025";
  container.appendChild(subtitle);

  // Map container
  const mapContainer = document.createElement("div");
  mapContainer.className = "map-container";
  container.appendChild(mapContainer);

  // Create SVG
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", 450)
    .style("display", "block");

  mapContainer.appendChild(svg.node());

  // Projection
  const projection = d3.geoEquirectangular()
    .scale(180)
    .translate([width / 2, 225]);

  const path = d3.geoPath(projection);

  // Add graticule
  const graticule = d3.geoGraticule();
  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

  // Load and draw world map
  const worldMap = svg.append("g").attr("class", "world");

  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(response => response.json())
    .then(world => {
      worldMap.append("g")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .join("path")
        .attr("class", "land")
        .attr("d", path);
    });

  // Magnitude color scale
  const magnitudeColor = d3.scaleSequential()
    .domain([2, 7])
    .interpolator(d3.interpolateRgb("#00ff88", "#ff0000"));

  // Magnitude size scale
  const magnitudeSize = d3.scaleSqrt()
    .domain([2, 7])
    .range([3, 15]);

  // Depth color scale
  const depthColor = d3.scaleSequential()
    .domain([0, 640])
    .interpolator(d3.interpolateRgb("#00ff88", "#cc0000"));

  // Earthquake markers group
  const markersGroup = svg.append("g").attr("class", "markers");

  // Tooltip
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  container.appendChild(tooltip);

  // Stats panel
  const statsPanel = document.createElement("div");
  statsPanel.className = "stats-panel";
  statsPanel.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">Visible Events</div>
      <div class="stat-value" id="visible-count">0</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Max Magnitude</div>
      <div class="stat-value" id="max-magnitude">0.0</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Avg Depth</div>
      <div class="stat-value" id="avg-depth">--</div>
    </div>
  `;
  container.appendChild(statsPanel);

  // Legend
  const legend = document.createElement("div");
  legend.className = "legend-container";
  legend.innerHTML = `
    <div class="legend-title">Magnitude</div>
    ${[7, 6, 5, 4, 3, 2].map(mag => `
      <div class="legend-item">
        <div class="legend-circle" style="background: ${magnitudeColor(mag)}; width: ${magnitudeSize(mag)}px; height: ${magnitudeSize(mag)}px;"></div>
        <span>${mag}.0+</span>
      </div>
    `).join('')}
    <div class="depth-legend">
      <div class="legend-title">Depth (km)</div>
      <div class="depth-scale">
        <div class="depth-gradient"></div>
      </div>
      <div class="depth-labels">
        <span>0</span>
        <span>640</span>
      </div>
    </div>
  `;
  container.appendChild(legend);

  // Timeline
  const timelineContainer = document.createElement("div");
  timelineContainer.className = "timeline-container";
  container.appendChild(timelineContainer);

  const timelineLabel = document.createElement("div");
  timelineLabel.className = "timeline-label";
  timelineLabel.textContent = "Temporal Explorer";
  timelineContainer.appendChild(timelineLabel);

  const sliderTrack = document.createElement("div");
  sliderTrack.className = "slider-track";
  timelineContainer.appendChild(sliderTrack);

  const sliderFill = document.createElement("div");
  sliderFill.className = "slider-fill";
  sliderTrack.appendChild(sliderFill);

  const sliderHandle = document.createElement("div");
  sliderHandle.className = "slider-handle";
  sliderTrack.appendChild(sliderHandle);

  const currentTime = document.createElement("div");
  currentTime.className = "current-time";
  timelineContainer.appendChild(currentTime);

  // Time range
  const timeExtent = d3.extent(earthquakes, d => d.datetime);
  let currentTimeValue = timeExtent[1];

  // Update visualization
  function updateVisualization() {
    const visibleQuakes = earthquakes.filter(d => d.datetime <= currentTimeValue);
    
    // Update markers
    const markers = markersGroup.selectAll(".earthquake-marker")
      .data(visibleQuakes, d => d.event_id);

    markers.exit()
      .transition()
      .duration(200)
      .attr("r", 0)
      .style("opacity", 0)
      .remove();

    const markersEnter = markers.enter()
      .append("circle")
      .attr("class", "earthquake-marker")
      .attr("cx", d => projection([d.longitude, d.latitude])[0])
      .attr("cy", d => projection([d.longitude, d.latitude])[1])
      .attr("r", 0)
      .style("fill", d => d.depth != null ? depthColor(d.depth) : magnitudeColor(d.magnitude))
      .style("opacity", 0)
      .style("stroke", d => magnitudeColor(d.magnitude))
      .style("stroke-width", 1.5);

    markersEnter.transition()
      .duration(400)
      .delay((d, i) => i * 5)
      .attr("r", d => magnitudeSize(d.magnitude))
      .style("opacity", 0.8);

    markersEnter
      .on("mouseenter", function(event, d) {
        tooltip.style.opacity = "1";
        tooltip.innerHTML = `
          <div class="tooltip-title">M${d.magnitude.toFixed(1)} Earthquake</div>
          <div class="tooltip-row"><span class="tooltip-label">Location:</span>${d.location || "Unknown"}</div>
          <div class="tooltip-row"><span class="tooltip-label">Time:</span>${d.datetime.toISOString().slice(0, 19).replace('T', ' ')}</div>
          <div class="tooltip-row"><span class="tooltip-label">Depth:</span>${d.depth != null ? d.depth.toFixed(1) + ' km' : 'Unknown'}</div>
          <div class="tooltip-row"><span class="tooltip-label">Coords:</span>${d.latitude.toFixed(2)}°, ${d.longitude.toFixed(2)}°</div>
        `;
      })
      .on("mousemove", function(event) {
        tooltip.style.left = (event.pageX + 15) + "px";
        tooltip.style.top = (event.pageY - 15) + "px";
      })
      .on("mouseleave", function() {
        tooltip.style.opacity = "0";
      });

    // Update stats
    document.getElementById("visible-count").textContent = visibleQuakes.length;
    const maxMag = d3.max(visibleQuakes, d => d.magnitude) || 0;
    document.getElementById("max-magnitude").textContent = maxMag.toFixed(1);
    
    const quakesWithDepth = visibleQuakes.filter(d => d.depth != null);
    if (quakesWithDepth.length > 0) {
      const avgDepth = d3.mean(quakesWithDepth, d => d.depth);
      document.getElementById("avg-depth").textContent = avgDepth.toFixed(0) + " km";
    } else {
      document.getElementById("avg-depth").textContent = "--";
    }

    // Update time display
    currentTime.textContent = currentTimeValue.toISOString().slice(0, 19).replace('T', ' ') + " UTC";
  }

  // Slider interaction
  let isDragging = false;

  function updateSlider(clientX) {
    const rect = sliderTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    currentTimeValue = new Date(
      timeExtent[0].getTime() + percentage * (timeExtent[1].getTime() - timeExtent[0].getTime())
    );
    
    sliderFill.style.width = (percentage * 100) + "%";
    sliderHandle.style.left = (percentage * 100) + "%";
    
    updateVisualization();
  }

  sliderHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      updateSlider(e.clientX);
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  sliderTrack.addEventListener("click", (e) => {
    updateSlider(e.clientX);
  });

  // Initial render
  sliderFill.style.width = "100%";
  sliderHandle.style.left = "100%";
  updateVisualization();
}

export default { render };