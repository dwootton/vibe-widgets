import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  // Clear previous content
  el.innerHTML = "";
  
  // Set up dimensions
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(el)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#f8f9fa")
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)");
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const xScale = d3.scaleLinear()
    .domain([140, 180])
    .range([0, width]);
  
  const yScale = d3.scaleLinear()
    .domain([40, 80])
    .range([height, 0]);
  
  // Add grid lines
  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    );
  
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .attr("opacity", 0.1)
    .call(d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat("")
    );
  
  // Add axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Height (cm)");
  
  g.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Weight (kg)");
  
  // Create tooltip
  const tooltip = d3.select(el)
    .append("div")
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", "0")
    .style("transition", "opacity 0.3s");
  
  // Create person pictograph
  function drawPerson(x, y, size = 1) {
    const g = svg.append("g")
      .attr("transform", `translate(${x},${y})`);
    
    // Head
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", -8 * size)
      .attr("r", 4 * size)
      .attr("fill", "#FF6B6B");
    
    // Body
    g.append("line")
      .attr("x1", 0)
      .attr("y1", -4 * size)
      .attr("x2", 0)
      .attr("y2", 4 * size)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 2 * size);
    
    // Arms
    g.append("line")
      .attr("x1", -4 * size)
      .attr("y1", 0)
      .attr("x2", 4 * size)
      .attr("y2", 0)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 2 * size);
    
    // Legs
    g.append("line")
      .attr("x1", -2 * size)
      .attr("y1", 4 * size)
      .attr("x2", -2 * size)
      .attr("y2", 8 * size)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 2 * size);
    
    g.append("line")
      .attr("x1", 2 * size)
      .attr("y1", 4 * size)
      .attr("x2", 2 * size)
      .attr("y2", 8 * size)
      .attr("stroke", "#FF6B6B")
      .attr("stroke-width", 2 * size);
  }
  
  // Plot data points as pictographs
  data.forEach((d, i) => {
    const x = margin.left + xScale(d.height);
    const y = margin.top + yScale(d.weight);
    
    const personGroup = svg.append("g")
      .attr("class", "person")
      .style("cursor", "pointer");
    
    // Draw person
    const g = personGroup.append("g")
      .attr("transform", `translate(${x},${y})`);
    
    // Head
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", -8)
      .attr("r", 4)
      .attr("fill", "#4ECDC4");
    
    // Body
    g.append("line")
      .attr("x1", 0)
      .attr("y1", -4)
      .attr("x2", 0)
      .attr("y2", 4)
      .attr("stroke", "#4ECDC4")
      .attr("stroke-width", 2);
    
    // Arms
    g.append("line")
      .attr("x1", -4)
      .attr("y1", 0)
      .attr("x2", 4)
      .attr("y2", 0)
      .attr("stroke", "#4ECDC4")
      .attr("stroke-width", 2);
    
    // Legs
    g.append("line")
      .attr("x1", -2)
      .attr("y1", 4)
      .attr("x2", -2)
      .attr("y2", 8)
      .attr("stroke", "#4ECDC4")
      .attr("stroke-width", 2);
    
    g.append("line")
      .attr("x1", 2)
      .attr("y1", 4)
      .attr("x2", 2)
      .attr("y2", 8)
      .attr("stroke", "#4ECDC4")
      .attr("stroke-width", 2);
    
    // Add invisible circle for interaction
    personGroup.append("circle")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 15)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this).transition().duration(200)
          .attr("r", 20);
        
        g.selectAll("*").transition().duration(200)
          .attr("stroke", "#FFD93D")
          .attr("fill", "#FFD93D");
        
        tooltip.style("opacity", 1)
          .html(`Height: ${d.height} cm<br/>Weight: ${d.weight} kg`)
          .style("left", (x + 20) + "px")
          .style("top", (y - 30) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).transition().duration(200)
          .attr("r", 15);
        
        g.selectAll("*").transition().duration(200)
          .attr("stroke", "#4ECDC4")
          .attr("fill", "#4ECDC4");
        
        tooltip.style("opacity", 0);
      });
  });
  
  // Add title
  d3.select(el).insert("div", ":first-child")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("margin-bottom", "15px")
    .style("color", "#333")
    .text("Height vs Weight Pictograph");
  
  // Listen for data changes
  model.on("change:data", () => {
    render({ model, el });
  });
}

export default { render };