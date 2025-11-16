import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "600px";
  container.style.position = "relative";
  el.appendChild(container);
  
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  
  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background", "#f9f9f9")
    .style("border-radius", "8px");
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  const clip = g.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);
  
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.height))
    .range([0, width])
    .nice();
  
  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.weight))
    .range([height, 0])
    .nice();
  
  const xAxis = g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));
  
  const yAxis = g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale));
  
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Height");
  
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Weight");
  
  const scatter = g.append("g")
    .attr("clip-path", "url(#clip)");
  
  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000);
  
  function updateScatter() {
    const circles = scatter.selectAll("circle")
      .data(data);
    
    circles.enter()
      .append("circle")
      .merge(circles)
      .attr("cx", d => xScale(d.height))
      .attr("cy", d => yScale(d.weight))
      .attr("r", 6)
      .attr("fill", "#4a90e2")
      .attr("stroke", "#2c5aa0")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 9)
          .attr("opacity", 1);
        
        tooltip
          .style("opacity", 1)
          .html(`Height: ${d.height}<br>Weight: ${d.weight}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("opacity", 0.7);
        
        tooltip.style("opacity", 0);
      });
    
    circles.exit().remove();
  }
  
  updateScatter();
  
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .extent([[0, 0], [width, height]])
    .on("zoom", function(event) {
      const newXScale = event.transform.rescaleX(xScale);
      const newYScale = event.transform.rescaleY(yScale);
      
      xAxis.call(d3.axisBottom(newXScale));
      yAxis.call(d3.axisLeft(newYScale));
      
      scatter.selectAll("circle")
        .attr("cx", d => newXScale(d.height))
        .attr("cy", d => newYScale(d.weight));
    });
  
  svg.call(zoom);
  
  const resetButton = d3.select(container)
    .append("button")
    .text("Reset Zoom")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("padding", "8px 16px")
    .style("background", "#4a90e2")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "4px")
    .style("cursor", "pointer")
    .style("font-size", "12px")
    .style("z-index", 1000)
    .on("click", function() {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    })
    .on("mouseover", function() {
      d3.select(this).style("background", "#357abd");
    })
    .on("mouseout", function() {
      d3.select(this).style("background", "#4a90e2");
    });
  
  container.appendChild(svg.node());
  
  model.on("change:data", () => {
    const newData = model.get("data");
    data.length = 0;
    data.push(...newData);
    
    xScale.domain(d3.extent(data, d => d.height)).nice();
    yScale.domain(d3.extent(data, d => d.weight)).nice();
    
    xAxis.call(d3.axisBottom(xScale));
    yAxis.call(d3.axisLeft(yScale));
    
    updateScatter();
    
    svg.call(zoom.transform, d3.zoomIdentity);
  });
}

export default { render };