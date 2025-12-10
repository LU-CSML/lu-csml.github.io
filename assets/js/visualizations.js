/**
 * CSML Visualizations
 * 
 * Handles the Word Cloud, Network Graph, and Streamgraph visualizations.
 * Data is passed from Jekyll via the window.CSML_DATA global object.
 * 
 * Dependencies: D3.js v6, vis-network.js, jQuery (for Bootstrap modals)
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION CONSTANTS
  // ============================================
  
  /** Chart dimensions and margins */
  const CHART_HEIGHT = {
    STREAM: 400,
    SPEAKER: 500,
    NETWORK: 600
  };
  
  /** Minimum word frequency to include in visualizations */
  const MIN_WORD_FREQUENCY = 2;
  
  /** Date validation bounds for talks */
  const YEAR_BOUNDS = { MIN: 2000, MAX: 2030 };
  
  /** Debounce delay for resize events (ms) */
  const RESIZE_DEBOUNCE_MS = 150;

  // ============================================
  // DATA INITIALIZATION
  // ============================================
  
  // Data is injected by Jekyll via window.CSML_DATA
  const DATA = window.CSML_DATA;
  if (!DATA || !DATA.talks) {
    console.error('CSML_DATA not found. Ensure data island is present in HTML.');
    return;
  }

  const today = new Date();
  const rawTalks = (DATA.talks || []).filter(t => {
      if (!t.date) return false;
      const talkDate = new Date(t.date);
      return talkDate < today; 
  });
  const stopWords = new Set(
    (DATA.stopwords?.english || []).concat(DATA.stopwords?.academic || [])
  );
  const talksUrl = DATA.talksUrl || '/talks';

  // Build frequency map and clean words
  const frequencyMap = {};
  
  rawTalks.forEach(function(talk) {
    // Parse words from title + abstract
    const text = ((talk.title || '') + ' ' + (talk.abstract || ''))
      .toLowerCase()
      .replace(/monte\s+carlo/g, 'monte_carlo');
    
    const words = text.split(/[\s.,;:\(\)\[\]"!?\\/]+/);
    const cleanWords = new Set();
    
    words.forEach(function(w) {
      if (!stopWords.has(w) && w.length > 3 && !/^\d+$/.test(w)) {
        cleanWords.add(w);
        frequencyMap[w] = (frequencyMap[w] || 0) + 1;
      }
    });
    
    talk.cleanWords = cleanWords;
  });

  // Create sorted word list
  const list = [];
  for (const w in frequencyMap) {
    if (frequencyMap[w] > 2) list.push([w, frequencyMap[w]]);
  }
  list.sort((a, b) => b[1] - a[1]);

  // State
  let network = null;
  let isCumulative = false;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Debounce: delays function execution until after wait ms have elapsed
   * since the last invocation. Essential for resize/scroll handlers.
   * @param {Function} func - Function to debounce
   * @param {number} wait - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Returns an interpolated heatmap color from orange to dark red.
   * @param {number} value - Current value
   * @param {number} min - Minimum value in range
   * @param {number} max - Maximum value in range
   * @returns {string} RGB color string
   */
  function getHeatmapColor(value, min, max) {
    const diff = max - min <= 0 ? 1 : max - min;
    const ratio = (value - min) / diff;
    const r1 = 230, g1 = 126, b1 = 34;  // Orange
    const r2 = 146, g2 = 43, b2 = 33;   // Dark Red
    const r = Math.round(r1 + ratio * (r2 - r1));
    const g = Math.round(g1 + ratio * (g2 - g1));
    const b = Math.round(b1 + ratio * (b2 - b1));
    return `rgb(${r},${g},${b})`;
  }

  // ============================================
  // WORD CLOUD (Fallback only)
  // ============================================
  
  function renderWordCloud() {
    const canvas = document.getElementById('word_cloud');
    if (!canvas) return;
    
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    canvas.width = container.offsetWidth;
    canvas.height = 400;

    const wordCloudColors = ['#b5121b', '#333333', '#555555', '#b5121b', '#333333'];
    const wordCloudList = list.slice(0, 100).map(item => [item[0].replace(/_/g, ' '), item[1]]);

    if (typeof WordCloud === 'undefined') {
      console.error('WordCloud library not loaded.');
      container.innerHTML = '<p class="text-danger">Error: WordCloud library missing.</p>';
      return;
    }

    try {
      WordCloud(canvas, {
        list: wordCloudList,
        gridSize: 10,
        weightFactor: size => Math.pow(size, 0.8) * 12,
        fontFamily: 'Outfit, sans-serif',
        color: () => wordCloudColors[Math.floor(Math.random() * wordCloudColors.length)],
        rotateRatio: 0,
        backgroundColor: '#ffffff',
        drawOutOfBound: false,
        click: item => showWordModal(item[0])
      });
    } catch (e) {
      console.error('WordCloud Error:', e);
    }
  }

  // ============================================
  // NETWORK GRAPH
  // ============================================
  
  /**
   * Renders the topic co-occurrence network graph using vis.js.
   * Topics are connected if they appear together in the same talk.
   * Uses Barnes-Hut simulation for force-directed layout.
   * @returns {void}
   */
  function renderGraph() {
    const container = document.getElementById('network-container');
    if (!container) return;

    const topN = parseInt(document.getElementById('nodeRange')?.value || 30);
    const minConn = parseInt(document.getElementById('edgeRange')?.value || 3);

    // Update labels
    const nodeVal = document.getElementById('nodeVal');
    const edgeVal = document.getElementById('edgeVal');
    if (nodeVal) nodeVal.innerText = topN;
    if (edgeVal) edgeVal.innerText = minConn;

    // Filter data
    const topList = list.slice(0, topN);
    const topWords = topList.map(item => item[0]);
    const maxFreq = topList.length > 0 ? topList[0][1] : 1;
    const minFreq = topList.length > 0 ? topList[topList.length - 1][1] : 1;

    // Build inverted index
    const invertedIndex = {};
    rawTalks.forEach((talk, talkIndex) => {
      talk.cleanWords.forEach(word => {
        if (!invertedIndex[word]) invertedIndex[word] = [];
        invertedIndex[word].push(talkIndex);
      });
    });

    // Generate edges
    const edges = [];
    const connectedIndices = new Set();
    const edgeMetaData = {};

    // Pre-compute Sets for O(1) lookup (optimization: O(N²×T) → O(N²+T))
    const invertedSets = {};
    topWords.forEach(w => {
      invertedSets[w] = new Set(invertedIndex[w] || []);
    });

    for (let i = 0; i < topN; i++) {
      for (let j = i + 1; j < topN; j++) {
        const wordA = topWords[i];
        const wordB = topWords[j];
        const setA = invertedSets[wordA];
        const setB = invertedSets[wordB];
        
        // O(min(|A|,|B|)) intersection using smaller set
        const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
        const sharedTalkIndices = [...smaller].filter(id => larger.has(id));
        const sharedCount = sharedTalkIndices.length;

        if (sharedCount >= minConn) {
          const edgeId = `${i}-${j}`;
          edges.push({
            id: edgeId,
            from: i,
            to: j,
            value: sharedCount,
            color: { inherit: 'both', opacity: 0.5 }
          });
          connectedIndices.add(i);
          connectedIndices.add(j);
          edgeMetaData[edgeId] = { wordA, wordB, count: sharedCount, talkIndices: sharedTalkIndices };
        }
      }
    }

    // Generate nodes
    const nodes = [];
    topWords.forEach((word, index) => {
      if (connectedIndices.has(index)) {
        const val = frequencyMap[word];
        nodes.push({
          id: index,
          label: word.replace(/_/g, ' '),
          value: val,
          color: getHeatmapColor(val, minFreq, maxFreq)
        });
      }
    });

    // Build graph
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    };

    const options = {
      nodes: {
        shape: 'dot',
        font: { face: 'Outfit', color: '#333', size: 16 },
        scaling: { min: 15, max: 50, label: { enabled: true, min: 14, max: 24 } }
      },
      edges: {
        scaling: { min: 1, max: 6 },
        smooth: { type: 'continuous', roundness: 0.5 }
      },
      /**
       * BARNES-HUT FORCE-DIRECTED LAYOUT:
       * An O(N log N) approximation of N-body simulation for graph layout.
       * 
       * Parameters:
       * - gravitationalConstant: -3000 (negative = repulsion between nodes)
       * - centralGravity: 0.3 (pulls nodes toward center, prevents drift)
       * - springLength: 100 (natural length of edges)
       * - springConstant: 0.05 (edge elasticity, lower = more flexible)
       * 
       * Reference: https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation
       */
      physics: {
        stabilization: { enabled: true, iterations: 1000, fit: true },
        barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 100, springConstant: 0.05 },
        solver: 'barnesHut'
      },
      interaction: { hover: true, zoomView: true, selectConnectedEdges: false }
    };

    if (network !== null) {
      network.destroy();
      network = null;
    }

    network = new vis.Network(container, data, options);

    // Interaction handlers
    network.on('click', function(params) {
      if (params.edges.length > 0 && params.nodes.length === 0) {
        const edgeId = params.edges[0];
        const meta = edgeMetaData[edgeId];
        if (meta) showEdgeModal(meta.wordA, meta.wordB);
      } else if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const clickedNode = nodes.find(n => n.id === clickedId);
        if (clickedNode) showWordModal(clickedNode.label);
      }
    });

    network.once('stabilizationIterationsDone', () => network.fit());
  }

  // ============================================
  // STREAMGRAPH
  // ============================================
  
  /**
   * Renders the topic evolution streamgraph using D3.js.
   * Shows how research topics have evolved over time.
   * Uses d3.stackOffsetSilhouette (wiggle minimization) for standard view,
   * or d3.stackOffsetNone for cumulative view.
   * @returns {void}
   */
  function renderStreamgraph() {
    if (typeof d3 === 'undefined') {
      console.warn('D3.js not loaded.');
      return;
    }

    const container = document.getElementById('stream-container');
    if (!container) return;

    try {
      container.innerHTML = '';
      const width = container.offsetWidth;
      const height = 400;
      const margin = { top: 20, right: 60, bottom: 30, left: 40 };

      // Group by year
      const yearMap = {};
      const allYears = new Set();

      rawTalks.forEach(t => {
        if (!t.date || t.date.length < 4) return;
        const yStr = t.date.substring(0, 4);
        const yInt = parseInt(yStr);
        
        // Date validation with warning for data debugging
        if (isNaN(yInt) || yInt < 2000 || yInt > 2030) {
          console.warn(`Streamgraph: Skipped invalid year "${yStr}" for talk: "${t.title}"`);
          return;
        }

        allYears.add(yStr);
        if (!yearMap[yStr]) yearMap[yStr] = {};

        t.cleanWords.forEach(w => {
          const displayWord = w.replace(/_/g, ' ');
          yearMap[yStr][displayWord] = (yearMap[yStr][displayWord] || 0) + 1;
        });
      });

      if (allYears.size === 0) {
        container.innerHTML = '<p class="text-center text-muted p-5">Not enough data.</p>';
        return;
      }

      const years = Array.from(allYears).sort();

      // Get top topics
      const overallFreq = {};
      rawTalks.forEach(t => {
        t.cleanWords.forEach(w => {
          const displayWord = w.replace(/_/g, ' ');
          overallFreq[displayWord] = (overallFreq[displayWord] || 0) + 1;
        });
      });

      const topicCount = parseInt(document.getElementById('topicCountRange')?.value || 8);
      const topTopicList = Object.keys(overallFreq)
        .map(w => [w, overallFreq[w]])
        .sort((a, b) => b[1] - a[1])
        .slice(0, topicCount)
        .map(item => item[0]);

      if (topTopicList.length === 0) return;

      // Prepare stack data
      const runningTotals = {};
      topTopicList.forEach(t => runningTotals[t] = 0);

      const data = years.map(y => {
        const obj = { year: new Date(y, 0, 1) };
        topTopicList.forEach(topic => {
          let val = yearMap[y][topic] || 0;
          if (isCumulative) {
            runningTotals[topic] += val;
            obj[topic] = runningTotals[topic];
          } else {
            obj[topic] = val;
          }
        });
        return obj;
      });

      // D3 stack
      const stack = d3.stack()
        .keys(topTopicList)
        .offset(isCumulative ? d3.stackOffsetNone : d3.stackOffsetSilhouette)
        .order(d3.stackOrderNone);

      const series = stack(data);

      // Scales
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([
          d3.min(series, layer => d3.min(layer, d => d[0])),
          d3.max(series, layer => d3.max(layer, d => d[1]))
        ])
        .range([height - margin.bottom, margin.top]);

      const color = d3.scaleOrdinal().domain(topTopicList).range(d3.schemeTableau10);

      const area = d3.area()
        .curve(d3.curveBasis)
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

      // Draw SVG
      const svg = d3.select('#stream-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // Draw streams
      svg.selectAll('path.stream')
        .data(series)
        .join('path')
        .attr('class', 'stream')
        .attr('fill', d => color(d.key))
        .attr('d', area)
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .style('transition', 'opacity 0.2s ease, filter 0.2s ease')
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1).style('filter', 'brightness(1.15) drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.85).style('filter', 'none');
        })
        .on('click', (event, d) => showWordModal(d.key))
        .append('title').text(d => d.key + ' (click for talks)');

      // Axis
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(Math.min(years.length, 12)));

      // Labels
      const isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const labelColor = isDarkMode ? '#fff' : '#333';
      const shadowColor = isDarkMode ? '0 0 4px #000' : '0 0 3px #fff';

      const labelPositions = [];
      series.forEach(d => {
        let maxDiff = 0, bestPoint = null, bestIdx = -1;

        for (let i = 2; i < d.length - 2; i++) {
          const diff = d[i][1] - d[i][0];
          if (diff > maxDiff) {
            maxDiff = diff;
            bestPoint = d[i];
            bestIdx = i;
          }
        }

        const streamHeight = bestPoint ? Math.abs(y(bestPoint[0]) - y(bestPoint[1])) : 0;
        const fontSize = Math.min(16, Math.max(10, streamHeight * 0.3));

        if (bestPoint && streamHeight > 12) {
          const px = x(bestPoint.data.year);
          const py = y((bestPoint[0] + bestPoint[1]) / 2);

          let angle = 0;
          if (bestIdx >= 2 && bestIdx < d.length - 2) {
            const prev = d[bestIdx - 2];
            const next = d[bestIdx + 2];
            const p1 = { x: x(prev.data.year), y: y((prev[0] + prev[1]) / 2) };
            const p2 = { x: x(next.data.year), y: y((next[0] + next[1]) / 2) };
            angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
            angle = Math.max(-30, Math.min(30, angle));
          }

          labelPositions.push({ key: d.key, x: px, y: py, fontSize, angle, visible: true });
        } else {
          labelPositions.push({ visible: false });
        }
      });

      svg.selectAll('.stream-label')
        .data(series)
        .join('text')
        .attr('class', 'stream-label')
        .attr('text-anchor', 'middle')
        .attr('fill', labelColor)
        .style('pointer-events', 'none')
        .style('text-shadow', shadowColor)
        .style('font-weight', '600')
        .style('font-family', 'sans-serif')
        .each(function(d, i) {
          const pos = labelPositions[i];
          if (pos?.visible) {
            d3.select(this)
              .attr('transform', `translate(${pos.x},${pos.y}) rotate(${pos.angle})`)
              .style('font-size', pos.fontSize + 'px')
              .text(d.key)
              .attr('opacity', 1);
          } else {
            d3.select(this).text('').attr('opacity', 0);
          }
        });

    } catch (e) {
      console.error(e);
      container.innerHTML = '<p class="text-danger p-3">Error rendering streamgraph.</p>';
    }
  }

  // ============================================
  // SPEAKER LEADERBOARD (Evolution Chart)
  // ============================================

  /**
   * Renders the speaker talk evolution chart using D3.js.
   * Shows cumulative talk counts per speaker over time.
   * Includes collision detection for label placement.
   * @returns {void}
   */
  function renderSpeakerChart() {
    if (typeof d3 === 'undefined') return;

    const container = document.getElementById('speaker-container');
    if (!container) return;

    try {
      container.innerHTML = '';
      const width = container.offsetWidth;
      const height = 500;
      const margin = { top: 20, right: 150, bottom: 40, left: 50 };

      // 1. Process Data & Date Filter
      const allYears = new Set();

      // First pass to get full year range for slider logic
      rawTalks.forEach(t => {
        if (!t.date || t.date.length < 4) return;
        const y = parseInt(t.date.substring(0, 4));
        if (!isNaN(y) && y >= 2000 && y <= 2030) allYears.add(y);
      });

      if (allYears.size === 0) {
        container.innerHTML = '<p class="text-center text-muted p-5">Not enough data.</p>';
        return;
      }

      const sortedYears = Array.from(allYears).sort((a, b) => a - b);
      const dataMinYear = sortedYears[0];
      const dataMaxYear = sortedYears[sortedYears.length - 1];

      // Update Slider Range if needed (once)
      const startYearInput = document.getElementById('speakerStartYear');
      if (startYearInput && !startYearInput.dataset.initialized) {
        startYearInput.min = dataMinYear;
        startYearInput.max = dataMaxYear;
        startYearInput.value = Math.max(dataMinYear, parseInt(startYearInput.value) || dataMinYear);
        const valSpan = document.getElementById('speakerStartYearVal');
        if (valSpan) valSpan.innerText = startYearInput.value;
        startYearInput.dataset.initialized = "true";
      }

      const selectedStartYear = parseInt(startYearInput?.value || dataMinYear);

      // Aggregate (with Start Year filter)
      const speakerYearMap = {}; 
      const speakerTotalMap = {}; 
      const speakerTalks = {}; // Store actual talks for modal

      rawTalks.forEach(t => {
        if (!t.date || t.date.length < 4 || !t.speaker) return;
        const y = parseInt(t.date.substring(0, 4));
        if (isNaN(y) || y < selectedStartYear || y > 2030) return; // Filter by Start Year

        let name = t.speaker.split('(')[0].trim();
        if (name.length < 2) return;

        if (!speakerYearMap[name]) speakerYearMap[name] = {};
        if (!speakerTalks[name]) speakerTalks[name] = [];
        
        speakerYearMap[name][y] = (speakerYearMap[name][y] || 0) + 1;
        speakerTotalMap[name] = (speakerTotalMap[name] || 0) + 1;
        speakerTalks[name].push(t);
      });

      // 2. Select Top N Speakers
      const topCount = parseInt(document.getElementById('speakerCountRange')?.value || 10);
      const topSpeakers = Object.keys(speakerTotalMap)
        .map(s => [s, speakerTotalMap[s]])
        .sort((a, b) => b[1] - a[1]) 
        .slice(0, topCount)
        .map(item => item[0]);

      if (topSpeakers.length === 0) {
        container.innerHTML = '<p class="text-center text-muted p-5">No talks found in this period.</p>';
        return;
      }

      // 3. Transform Data
      const seriesData = topSpeakers.map(speaker => {
        const values = [];
        let runningTotal = 0;
        
        for (let y = selectedStartYear; y <= dataMaxYear; y++) {
          const annualCount = speakerYearMap[speaker][y] || 0;
          runningTotal += annualCount;
          
          values.push({
            year: new Date(y, 0, 1),
            value: runningTotal,
            annual: annualCount
          });
        }
        return { name: speaker, values: values, talks: speakerTalks[speaker] || [] };
      });

      // 4. Draw
      const svg = d3.select('#speaker-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const x = d3.scaleTime()
        .domain([new Date(selectedStartYear, 0, 1), new Date(dataMaxYear, 0, 1)])
        .range([margin.left, width - margin.right]);

      const maxY = d3.max(seriesData, s => d3.max(s.values, d => d.value)) || 10;
      const y = d3.scaleLinear()
        .domain([0, maxY])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(topSpeakers);

      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveLinear);

      // Axes
      svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(Math.min(dataMaxYear - selectedStartYear + 1, 10)));

      svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      // Create tooltip for lines
      const lineTooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip speaker-line-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.85)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("z-index", 1000);

      // Draw visible lines (thinner, for visual)
      svg.selectAll(".line")
        .data(seriesData)
        .join("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => color(d.name))
        .attr("stroke-width", 3)
        .attr("d", d => line(d.values))
        .style("opacity", 0.8)
        .style("pointer-events", "none"); // Disable events on visible line

      // Draw invisible overlay lines (thicker, for interaction)
      svg.selectAll(".line-overlay")
        .data(seriesData)
        .join("path")
        .attr("class", "line-overlay")
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 15) // Much wider for easier clicking
        .attr("d", d => line(d.values))
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            // Highlight the actual line
            svg.selectAll(".line")
              .filter(ld => ld.name === d.name)
              .attr("stroke-width", 5);
            
            lineTooltip.style("visibility", "visible")
              .html(`<strong>${d.name}</strong><br>${d.talks.length} talks (${selectedStartYear}–${dataMaxYear})<br><em>Click for details</em>`);
        })
        .on("mousemove", (event) => {
            lineTooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function(event, d) {
            svg.selectAll(".line")
              .filter(ld => ld.name === d.name)
              .attr("stroke-width", 3);
            lineTooltip.style("visibility", "hidden");
        })
        .on("click", function(event, d) {
          // Show talks for this speaker in a modal
          const talks = d.talks;
          let html = '<div class="list-group">';
          talks.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          talks.forEach(t => {
            html += `<div class="list-group-item">
              <strong>${t.date || 'Unknown'}</strong>: ${t.title || '<em>Untitled</em>'}
            </div>`;
          });
          html += '</div>';
          
          document.getElementById('modal-label').textContent = `${d.name} - ${talks.length} Talks (${selectedStartYear}–${dataMaxYear})`;
          document.getElementById('modal-list').innerHTML = html;
          // Guard against missing jQuery/Bootstrap
          if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
            $('#shared-modal').modal('show');
          }
        });

      // 5. Label Collision Detection
      const labels = seriesData.map(d => {
        const lastVal = d.values[d.values.length - 1].value;
        return {
          name: d.name,
          value: lastVal,
          targetY: y(lastVal),
          y: y(lastVal),
          height: 14
        };
      });

      // Relax positions
      for (let i = 0; i < 50; i++) {
        labels.sort((a, b) => a.y - b.y);
        for (let j = 0; j < labels.length - 1; j++) {
          const a = labels[j];
          const b = labels[j + 1];
          const dy = b.y - a.y;
          if (dy < a.height) {
            const overlap = a.height - dy;
            a.y -= overlap / 2;
            b.y += overlap / 2;
          }
        }
      }

      // Draw Labels
      svg.selectAll(".label")
        .data(labels)
        .join("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("x", width - margin.right + 5)
        .attr("y", d => d.y)
        .attr("fill", d => color(d.name))
        .attr("alignment-baseline", "middle")
        .text(d => `${d.name} (${d.value})`);
      
      // Connecting lines for displaced labels
      svg.selectAll(".label-link")
        .data(labels.filter(d => Math.abs(d.y - d.targetY) > 2))
        .join("line")
        .attr("x1", width - margin.right)
        .attr("y1", d => d.targetY)
        .attr("x2", width - margin.right + 3)
        .attr("y2", d => d.y)
        .attr("stroke", d => color(d.name))
        .attr("stroke-width", 1)
        .style("opacity", 0.5);

      // Tooltip for points
      const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", 1000);

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
        .style("opacity", 0)
        .on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 1).attr("r", 6);
            tooltip.style("visibility", "visible")
                   .html(`<strong>${d.name}</strong><br>Year: ${d.year.getFullYear()}<br>Total: ${d.value}`);
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

  // ============================================
  // MODALS
  // ============================================
  
  function showEdgeModal(wordA, wordB) {
    const modalTitle = document.getElementById('edgeModalLabel');
    const modalBody = document.getElementById('edgeModalBody');
    if (!modalTitle || !modalBody) return;

    modalTitle.innerText = `Talks featuring "${wordA.replace(/_/g, ' ')}" + "${wordB.replace(/_/g, ' ')}"`;
    modalBody.innerHTML = '';

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    rawTalks.forEach(talk => {
      if (talk.cleanWords.has(wordA) && talk.cleanWords.has(wordB)) {
        const a = document.createElement('a');
        a.href = `${talksUrl}?q=${encodeURIComponent(talk.title)}`;
        a.className = 'list-group-item list-group-item-action';
        a.innerHTML = `<strong>${talk.date}</strong> (${talk.speaker})<br/>${talk.title}`;
        listGroup.appendChild(a);
      }
    });

    modalBody.appendChild(listGroup);
    // Guard against missing jQuery/Bootstrap
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#edgeModal').modal('show');
    }
  }

  // Expose for use by word cloud onclick
  window.showWordModal = function(word) {
    const modalTitle = document.getElementById('edgeModalLabel');
    const modalBody = document.getElementById('edgeModalBody');
    if (!modalTitle || !modalBody) return;

    modalTitle.innerText = `Talks featuring "${word}"`;
    modalBody.innerHTML = '';

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    let count = 0;
    rawTalks.forEach(talk => {
      const lookup = word.toLowerCase().replace(/ /g, '_');
      if (talk.cleanWords.has(lookup)) {
        count++;
        const a = document.createElement('a');
        a.href = `${talksUrl}?q=${encodeURIComponent(talk.title)}`;
        a.className = 'list-group-item list-group-item-action';
        a.innerHTML = `<strong>${talk.date}</strong> (${talk.speaker})<br/>${talk.title}`;
        listGroup.appendChild(a);
      }
    });

    if (count === 0) {
      modalBody.innerHTML = '<p class="text-muted">No talks found for this topic.</p>';
    } else {
      modalBody.appendChild(listGroup);
    }

    // Guard against missing jQuery/Bootstrap
    if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
      $('#edgeModal').modal('show');
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  
  renderWordCloud();
  renderGraph();
  renderStreamgraph();
  renderSpeakerChart();

  // Event listeners
  document.getElementById('nodeRange')?.addEventListener('input', renderGraph);
  document.getElementById('edgeRange')?.addEventListener('input', renderGraph);
  
  document.getElementById('topicCountRange')?.addEventListener('input', function() {
    const val = document.getElementById('topicCountVal');
    if (val) val.innerText = this.value;
    renderStreamgraph();
  });

  document.getElementById('cumulativeToggle')?.addEventListener('change', function() {
    isCumulative = this.checked;
    renderStreamgraph();
  });

  // Speaker Chart Events
  document.getElementById('speakerCountRange')?.addEventListener('input', function() {
    const val = document.getElementById('speakerCountVal');
    if (val) val.innerText = this.value;
    renderSpeakerChart();
  });

  document.getElementById('speakerStartYear')?.addEventListener('input', function() {
    const val = document.getElementById('speakerStartYearVal');
    if (val) val.innerText = this.value;
    renderSpeakerChart();
  });

  // Debounced resize handler to prevent excessive redraws
  const debouncedResize = debounce(() => {
    try { 
      renderStreamgraph(); 
      renderSpeakerChart();
    } catch(e) {
      console.warn('Resize render error:', e);
    }
  }, 150);

  window.addEventListener('resize', debouncedResize);
})();