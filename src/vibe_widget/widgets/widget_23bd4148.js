import * as d3 from "https://esm.sh/d3@7";

function render({ model, el }) {
  const data = model.get("data");
  
  if (!data || data.length === 0) {
    el.textContent = "No data available";
    return;
  }

  // Clear previous content
  el.innerHTML = "";

  // Set dimensions
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(el)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "#f8f9fa")
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, width])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height, 0]);

  // Create line generator
  const line = d3.line()
    .x(d => xScale(d.category) + xScale.bandwidth() / 2)
    .y(d => yScale(d.value));

  // Add gridlines
  svg.append("g")
    .attr("class", "gridlines")
    .attr("opacity", 0.1)
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    );

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 35)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Category");

  // Add Y axis
  svg.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("fill", "#333")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Value");

  // Add line path
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 3)
    .attr("d", line);

  // Add circles for data points
  svg.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(d.category) + xScale.bandwidth() / 2)
    .attr("cy", d => yScale(d.value))
    .attr("r", 5)
    .attr("fill", "#2563eb")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 7)
        .attr("fill", "#1d4ed8");
      
      // Show tooltip
      svg.append("text")
        .attr("class", "tooltip")
        .attr("x", xScale(d.category) + xScale.bandwidth() / 2)
        .attr("y", yScale(d.value) - 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#333")
        .attr("font-weight", "bold")
        .text(`${d.category}: ${d.value}`);
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 5)
        .attr("fill", "#2563eb");
      
      svg.selectAll(".tooltip").remove();
    });

  // Handle data changes
  model.on("change:data", () => {
    const newData = model.get("data");
    if (newData && newData.length > 0) {
      render({ model, el: el.parentElement });
    }
  });
}

export default { render };