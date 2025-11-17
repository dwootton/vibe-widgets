import * as d3 from "https://esm.sh/d3@7";
import * as Plot from "https://esm.sh/@observablehq/plot@0.6";

function render({ model, el }) {
  const rawData = model.get("data");
  
  el.innerHTML = '';
  
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
    
    :root {
      --coral-cyan: #00fff5;
      --coral-blue: #0066ff;
      --coral-purple: #6600ff;
      --bleach-red: #ff0066;
      --bleach-orange: #ff6600;
      --ocean-deep: #000a1a;
      --ocean-mid: #001a33;
      --ocean-surface: #002b4d;
    }
    
    .coral-monitor {
      background: linear-gradient(135deg, var(--ocean-deep) 0%, var(--ocean-mid) 50%, var(--ocean-surface) 100%);
      color: var(--coral-cyan);
      font-family: 'Rajdhani', monospace;
      padding: 0;
      margin: 0;
      height: 900px;
      overflow: hidden;
      position: relative;
      box-shadow: inset 0 0 100px rgba(0, 255, 245, 0.1);
    }
    
    .coral-monitor::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 245, 0.03) 2px, rgba(0, 255, 245, 0.03) 4px);
      pointer-events: none;
      animation: scan 8s linear infinite;
      z-index: 1;
    }
    
    @keyframes scan {
      0% { transform: translateY(0); }
      100% { transform: translateY(20px); }
    }
    
    .header-zone {
      position: relative;
      z-index: 10;
      padding: 30px 40px 20px;
      background: linear-gradient(180deg, rgba(0, 10, 26, 0.9) 0%, transparent 100%);
      border-bottom: 2px solid var(--coral-cyan);
      box-shadow: 0 0 20px rgba(0, 255, 245, 0.3);
    }
    
    .title-main {
      font-family: 'Orbitron', monospace;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 4px;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      background: linear-gradient(90deg, var(--coral-cyan) 0%, var(--coral-blue) 50%, var(--coral-purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 0 30px rgba(0, 255, 245, 0.5);
      animation: glow-pulse 3s ease-in-out infinite;
    }
    
    @keyframes glow-pulse {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 10px rgba(0, 255, 245, 0.6)); }
      50% { filter: brightness(1.3) drop-shadow(0 0 20px rgba(0, 255, 245, 0.9)); }
    }
    
    .subtitle {
      font-size: 16px;
      font-weight: 300;
      letter-spacing: 2px;
      color: rgba(0, 255, 245, 0.7);
      margin: 0;
    }
    
    .status-bar {
      position: absolute;
      top: 35px;
      right: 40px;
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }
    
    .status-dot.critical {
      background: var(--bleach-red);
      box-shadow: 0 0 10px var(--bleach-red);
    }
    
    .status-dot.warning {
      background: var(--bleach-orange);
      box-shadow: 0 0 10px var(--bleach-orange);
    }
    
    .status-dot.normal {
      background: var(--coral-cyan);
      box-shadow: 0 0 10px var(--coral-cyan);
    }
    
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }
    
    .content-grid {
      position: relative;
      z-index: 5;
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      padding: 20px 40px;
      height: calc(100% - 160px);
    }
    
    .map-container {
      background: rgba(0, 26, 51, 0.4);
      border: 1px solid rgba(0, 255, 245, 0.3);
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 0 40px rgba(0, 255, 245, 0.2);
    }
    
    .map-container::before {
      content: 'LIVE SATELLITE FEED';
      position: absolute;
      top: 15px;
      left: 15px;
      font-family: 'Orbitron', monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--coral-cyan);
      z-index: 100;
      background: rgba(0, 10, 26, 0.8);
      padding: 5px 12px;
      border: 1px solid var(--coral-cyan);
      border-radius: 3px;
    }
    
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .panel {
      background: rgba(0, 26, 51, 0.5);
      border: 1px solid rgba(0, 255, 245, 0.3);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 0 20px rgba(0, 255, 245, 0.1);
    }
    
    .panel-title {
      font-family: 'Orbitron', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      color: var(--coral-cyan);
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      font-size: 13px;
    }
    
    .legend-color {
      width: 40px;
      height: 20px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .stat-card {
      background: rgba(0, 10, 26, 0.6);
      padding: 15px;
      border-radius: 6px;
      border: 1px solid rgba(0, 255, 245, 0.2);
    }
    
    .stat-label {
      font-size: 11px;
      font-weight: 300;
      letter-spacing: 1px;
      color: rgba(0, 255, 245, 0.6);
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    
    .stat-value {
      font-family: 'Orbitron', monospace;
      font-size: 24px;
      font-weight: 700;
      color: var(--coral-cyan);
    }
    
    .stat-value.warning {
      color: var(--bleach-orange);
    }
    
    .stat-value.critical {
      color: var(--bleach-red);
      animation: blink-alert 1s ease-in-out infinite;
    }
    
    @keyframes blink-alert {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .slider-control {
      margin-top: 10px;
    }
    
    .slider-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: rgba(0, 255, 245, 0.8);
      margin-bottom: 10px;
      display: block;
    }
    
    .time-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(0, 255, 245, 0.2);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }
    
    .time-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--coral-cyan);
      box-shadow: 0 0 10px var(--coral-cyan);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .time-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 20px var(--coral-cyan);
    }
    
    .time-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--coral-cyan);
      box-shadow: 0 0 10px var(--coral-cyan);
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .time-slider::-moz-range-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 20px var(--coral-cyan);
    }
    
    .current-time {
      font-family: 'Orbitron', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--coral-cyan);
      margin-top: 8px;
      text-align: center;
      letter-spacing: 1px;
    }
    
    .alert-zone {
      background: linear-gradient(135deg, rgba(255, 0, 102, 0.1) 0%, rgba(255, 102, 0, 0.1) 100%);
      border: 1px solid var(--bleach-red);
      border-radius: 6px;
      padding: 15px;
      margin-top: 10px;
    }
    
    .alert-title {
      font-family: 'Orbitron', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--bleach-red);
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .alert-text {
      font-size: 12px;
      line-height: 1.5;
      color: rgba(255, 102, 0, 0.9);
    }
    
    svg text {
      font-family: 'Rajdhani', monospace;
    }
  `;
  el.appendChild(style);
  
  const container = document.createElement('div');
  container.className = 'coral-monitor';
  el.appendChild(container);
  
  // Convert Kelvin to Celsius and filter ocean data
  const oceanData = rawData
    .filter(d => d.mask === 1 && !isNaN(d.analysed_sst) && d.analysed_sst > 0)
    .map(d => ({
      ...d,
      temp_celsius: d.analysed_sst - 273.15,
      bleaching: d.analysed_sst - 273.15 > 30
    }));
  
  // Sample data for visualization (take every 10th point to manage size)
  const sampledData = oceanData.filter((d, i) => i % 10 === 0);
  
  // Calculate statistics
  const temps = sampledData.map(d => d.temp_celsius);
  const avgTemp = d3.mean(temps);
  const maxTemp = d3.max(temps);
  const bleachingCount = sampledData.filter(d => d.bleaching).length;
  const bleachingPercent = (bleachingCount / sampledData.length * 100).toFixed(1);
  
  // Header
  const header = document.createElement('div');
  header.className = 'header-zone';
  header.innerHTML = `
    <h1 class="title-main">REEF SENTINEL</h1>
    <p class="subtitle">Global Coral Bleaching Monitoring System</p>
    <div class="status-bar">
      <div class="status-indicator">
        <div class="status-dot ${bleachingPercent > 20 ? 'critical' : bleachingPercent > 10 ? 'warning' : 'normal'}"></div>
        <span>SYSTEM ACTIVE</span>
      </div>
      <div class="status-indicator">
        <span>2019-07-22</span>
      </div>
    </div>
  `;
  container.appendChild(header);
  
  // Content grid
  const contentGrid = document.createElement('div');
  contentGrid.className = 'content-grid';
  container.appendChild(contentGrid);
  
  // Map container
  const mapContainer = document.createElement('div');
  mapContainer.className = 'map-container';
  contentGrid.appendChild(mapContainer);
  
  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  contentGrid.appendChild(sidebar);
  
  // Stats panel
  const statsPanel = document.createElement('div');
  statsPanel.className = 'panel';
  statsPanel.innerHTML = `
    <div class="panel-title">Thermal Analysis</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Avg Temp</div>
        <div class="stat-value">${avgTemp.toFixed(1)}°C</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Max Temp</div>
        <div class="stat-value ${maxTemp > 30 ? 'critical' : maxTemp > 28 ? 'warning' : ''}">${maxTemp.toFixed(1)}°C</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bleach Risk</div>
        <div class="stat-value ${bleachingPercent > 20 ? 'critical' : bleachingPercent > 10 ? 'warning' : ''}">${bleachingPercent}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Data Points</div>
        <div class="stat-value">${sampledData.length.toLocaleString()}</div>
      </div>
    </div>
  `;
  sidebar.appendChild(statsPanel);
  
  // Legend panel
  const legendPanel = document.createElement('div');
  legendPanel.className = 'panel';
  legendPanel.innerHTML = `
    <div class="panel-title">Temperature Scale</div>
    <div class="legend-item">
      <div class="legend-color" style="background: #0a0080;"></div>
      <span>&lt; 10°C Arctic</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #0066ff;"></div>
      <span>10-20°C Cold</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #00ffcc;"></div>
      <span>20-26°C Optimal</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ffff00;"></div>
      <span>26-30°C Warm</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ff6600;"></div>
      <span>30-32°C Stress</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #ff0066;"></div>
      <span>&gt; 32°C Critical</span>
    </div>
  `;
  sidebar.appendChild(legendPanel);
  
  // Alert panel
  if (bleachingPercent > 10) {
    const alertPanel = document.createElement('div');
    alertPanel.className = 'panel';
    alertPanel.innerHTML = `
      <div class="panel-title">Alert System</div>
      <div class="alert-zone">
        <div class="alert-title">⚠ Bleaching Warning</div>
        <div class="alert-text">
          ${bleachingPercent}% of monitored reef areas show temperatures exceeding bleaching threshold (30°C). 
          Immediate conservation response recommended.
        </div>
      </div>
    `;
    sidebar.appendChild(alertPanel);
  }
  
  // Time control panel
  const timePanel = document.createElement('div');
  timePanel.className = 'panel';
  timePanel.innerHTML = `
    <div class="panel-title">Temporal Control</div>
    <div class="slider-control">
      <label class="slider-label">Simulation Time Offset</label>
      <input type="range" min="0" max="10" value="0" class="time-slider" id="timeSlider">
      <div class="current-time" id="currentTime">Day +0 Hours</div>
    </div>
  `;
  sidebar.appendChild(timePanel);
  
  // Color scale function
  function getTempColor(temp) {
    if (temp < 10) return '#0a0080';
    if (temp < 20) return '#0066ff';
    if (temp < 26) return '#00ffcc';
    if (temp < 30) return '#ffff00';
    if (temp < 32) return '#ff6600';
    return '#ff0066';
  }
  
  // Create initial plot
  function createPlot(timeOffset = 0) {
    const plotData = sampledData.map(d => ({
      ...d,
      temp_adjusted: d.temp_celsius + (Math.sin(d.lon / 50 + timeOffset) * 0.3)
    }));
    
    const plot = Plot.plot({
      width: mapContainer.offsetWidth,
      height: mapContainer.offsetHeight,
      margin: 40,
      style: {
        background: 'transparent',
        color: '#00fff5'
      },
      x: {
        label: 'Longitude',
        grid: true,
        tickFormat: d => `${d}°`,
        domain: [-180, 180]
      },
      y: {
        label: 'Latitude',
        grid: true,
        tickFormat: d => `${d}°`,
        domain: [-90, 90]
      },
      marks: [
        Plot.dot(plotData, {
          x: 'lon',
          y: 'lat',
          fill: d => getTempColor(d.temp_adjusted),
          r: 1.5,
          opacity: 0.6
        }),
        Plot.dot(plotData.filter(d => d.temp_adjusted > 30), {
          x: 'lon',
          y: 'lat',
          stroke: '#ff0066',
          r: 3,
          strokeWidth: 2,
          fill: 'none',
          opacity: 0.8
        })
      ]
    });
    
    mapContainer.innerHTML = '';
    mapContainer.appendChild(plot);
  }
  
  createPlot(0);
  
  // Time slider interaction
  const slider = el.querySelector('#timeSlider');
  const timeDisplay = el.querySelector('#currentTime');
  
  slider.addEventListener('input', (e) => {
    const offset = parseFloat(e.target.value);
    timeDisplay.textContent = `Day +${offset} Hours`;
    createPlot(offset);
  });
  
  // Handle model data changes
  model.on('change:data', () => {
    const newData = model.get('data');
    if (newData && newData.length > 0) {
      render({ model, el });
    }
  });
}

export default { render };