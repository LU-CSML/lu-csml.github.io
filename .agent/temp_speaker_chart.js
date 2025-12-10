
  // ============================================
  // SPEAKER LEADERBOARD (Evolution Chart)
  // ============================================

  function renderSpeakerChart() {
    if (typeof d3 === 'undefined') return;

    const container = document.getElementById('speaker-container');
    if (!container) return;

    try {
      container.innerHTML = '';
      const width = container.offsetWidth;
      const height = 500;
      const margin = { top: 20, right: 150, bottom: 40, left: 50 };

      // 1. Process Data
      const speakerYearMap = {}; // { Speaker: { Year: Count } }
      const speakerTotalMap = {}; // { Speaker: TotalCount }
      const allYears = new Set();

      rawTalks.forEach(t => {
        if (!t.date || t.date.length < 4 || !t.speaker) return;
        const yStr = t.date.substring(0, 4);
        const yInt = parseInt(yStr);
        if (isNaN(yInt) || yInt < 2000 || yInt > 2030) return;

        allYears.add(yInt);
        
        // Clean speaker name (remove affiliation if present "Name (Affiliation)")
        let name = t.speaker.split('(')[0].trim();
        if (name.length < 2) return;

        if (!speakerYearMap[name]) speakerYearMap[name] = {};
        speakerYearMap[name][yInt] = (speakerYearMap[name][yInt] || 0) + 1;
        speakerTotalMap[name] = (speakerTotalMap[name] || 0) + 1;
      });

      if (allYears.size === 0) {
        container.innerHTML = '<p class="text-center text-muted p-5">Not enough data.</p>';
        return;
      }

      const years = Array.from(allYears).sort((a, b) => a - b);
      const minYear = years[0];
      const maxYear = years[years.length - 1];

      // 2. Select Top N Speakers
      const topCount = parseInt(document.getElementById('speakerCountRange')?.value || 10);
      const topSpeakers = Object.keys(speakerTotalMap)
        .map(s => [s, speakerTotalMap[s]])
        .sort((a, b) => b[1] - a[1]) // Descending
        .slice(0, topCount)
        .map(item => item[0]);

      // 3. Transform Data for D3
      // We need an array of series: [{ name: "Liam", values: [{year: 2020, count: 1}, ...] }]
      const isSpeakerCumulative = document.getElementById('speakerCumulativeToggle')?.checked ?? true;

      const seriesData = topSpeakers.map(speaker => {
        const values = [];
        let runningTotal = 0;
        
        // Fill in all years (including gaps)
        for (let y = minYear; y <= maxYear; y++) {
          const annualCount = speakerYearMap[speaker][y] || 0;
          runningTotal += annualCount;
          
          values.push({
            year: new Date(y, 0, 1),
            value: isSpeakerCumulative ? runningTotal : annualCount,
            annual: annualCount // Keep raw annual for tooltip
          });
        }
        return { name: speaker, values: values };
      });

      // 4. Scales and Draw
      const svg = d3.select('#speaker-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const x = d3.scaleTime()
        .domain([new Date(minYear, 0, 1), new Date(maxYear, 0, 1)])
        .range([margin.left, width - margin.right]);

      const maxY = d3.max(seriesData, s => d3.max(s.values, d => d.value)) || 10;
      const y = d3.scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(topSpeakers);

      // Lines
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(isSpeakerCumulative ? d3.curveStepAfter : d3.curveMonotoneX); // Step for cumulative looks cleaner for counts

      // Gridlines
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(years.length).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""))
        .style("stroke-opacity", 0.1);
        
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""))
        .style("stroke-opacity", 0.1);

      // Axes
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(Math.min(years.length, 12)));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      // Draw Paths
      const path = svg.selectAll(".line")
        .data(seriesData)
        .join("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d.name))
        .attr("stroke-width", 3)
        .attr("d", d => line(d.values))
        .style("opacity", 0.8);

      // Labels at the end of lines
      svg.selectAll(".label")
        .data(seriesData)
        .join("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("x", width - margin.right + 5)
        .attr("y", d => y(d.values[d.values.length - 1].value))
        .attr("fill", d => color(d.name))
        .attr("alignment-baseline", "middle")
        .text(d => d.name + (isSpeakerCumulative ? ` (${d.values[d.values.length - 1].value})` : ""));

      // Interactivity (Voronoi or simple overlay)
      // For simplicity, using Points + Tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

      // Merge all points strictly for circles
      const allPoints = [];
      seriesData.forEach(s => {
        s.values.forEach(v => {
            allPoints.push({ ...v, name: s.name });
        });
      });

      svg.selectAll("circle")
        .data(allPoints)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", d => color(d.name))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("opacity", 0) // Hidden by default, show on hover
        .on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 1).attr("r", 6);
            tooltip.style("visibility", "visible")
                   .html(`<strong>${d.name}</strong><br>Year: ${d.year.getFullYear()}<br>${isSpeakerCumulative ? 'Total' : 'Count'}: ${d.value}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 0).attr("r", 4);
            tooltip.style("visibility", "hidden");
        });

    } catch (e) {
      console.error(e);
      container.innerHTML = '<p class="text-danger p-3">Error rendering speaker chart.</p>';
    }
  }

