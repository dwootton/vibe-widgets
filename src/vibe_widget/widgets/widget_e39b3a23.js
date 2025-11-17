import React, { useEffect, useRef } from 'react';
import * as d3 from "https://esm.sh/d3@7";

function BarChart({ data }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Set dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("background-color", "#f9f9f9")
      .style("border-radius", "8px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([height, 0]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "12px");

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale))
      .style("font-size", "12px");

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text("Value");

    // Add bars with animation
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.category))
      .attr("width", xScale.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#ff69b4")
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.7)
          .attr("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))");

        // Show tooltip
        const tooltip = d3.select(containerRef.current)
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background-color", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .text(`${d.category}: ${d.value}`);

        const x = event.pageX - containerRef.current.getBoundingClientRect().left;
        const y = event.pageY - containerRef.current.getBoundingClientRect().top;
        tooltip.style("left", (x + 10) + "px").style("top", (y - 20) + "px");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("filter", "none");

        d3.selectAll(".tooltip").remove();
      })
      .transition()
      .duration(800)
      .attr("y", d => yScale(d.value))
      .attr("height", d => height - yScale(d.value));
  }, [data]);

  return <div ref={containerRef} style={{ position: 'relative' }} />;
}

export default BarChart;