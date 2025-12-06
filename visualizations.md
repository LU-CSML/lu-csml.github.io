---
layout: default
title: Data Visualization
---

Explore the research landscape of the Computational Statistics and Machine Learning (CSML) group.

---

## 1. Topic Word Cloud

Most frequent terms from all past and future talk abstracts. **Click a word** to see all related talks.

<!-- Smart Word Cloud: Uses pre-generated SVG if available, falls back to JS -->
<div id="wordcloud-container" class="mb-5" style="width: 100%; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); padding: 1rem; text-align: center;">
  {% smart_wordcloud %}
</div>

---

## 2. Topic Evolution Stream (New!)

How has the research focus changed over time? This streamgraph shows the rise and fall of top topics.

<!-- Streamgraph Container -->
<div class="d-flex justify-content-between align-items-center mb-2 flex-wrap">
  <span class="text-muted">Interactive Streamgraph</span>
  <div class="d-flex align-items-center">
    <label for="topicCountRange" class="mb-0 mr-2 text-muted" style="font-size: 0.9em;">Topics: <span id="topicCountVal">8</span></label>
    <input type="range" class="custom-range mr-3" id="topicCountRange" min="5" max="20" value="8" style="width: 80px;" aria-label="Select number of topics to display">
    <div class="custom-control custom-switch">
      <input type="checkbox" class="custom-control-input" id="cumulativeToggle">
      <label class="custom-control-label" for="cumulativeToggle">Cumulative View</label>
    </div>
  </div>
</div>
<div id="stream-container" class="mb-5" style="width: 100%; height: 400px; border: 1px solid #eee; border-radius: 8px;"></div>

---

## 3. Topic Co-occurrence Network

Visualizes how topics appear together in the same talks.

- **Node Size/Color**: Frequency of the topic. Warmer colors (Red) = more frequent.
- **Connections**: Two topics are connected if they appear in the same talk. Thicker edges mean they appear together more often.
- **Click an edge** to see the talks where both topics appear.
- **Click a node** to filter the talk archive.

<div class="row mb-3">
  <div class="col-md-6">
    <label for="nodeRange">Top Topics: <span id="nodeVal">30</span></label>
    <input type="range" class="custom-range" id="nodeRange" min="10" max="100" value="30" aria-label="Select number of top topics to display">
  </div>
  <div class="col-md-6">
    <label for="edgeRange">Min Connections: <span id="edgeVal">3</span></label>
    <input type="range" class="custom-range" id="edgeRange" min="1" max="10" value="3" aria-label="Select minimum connection strength between topics">
  </div>
</div>

<div id="network-container" class="mb-5" style="width: 100%; height: 600px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;"></div>

<!-- Modal for Shared Talks -->

<div class="modal fade" id="edgeModal" tabindex="-1" role="dialog" aria-labelledby="edgeModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="edgeModalLabel">Shared Talks</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="modal-body" id="edgeModalBody">
        <!-- Content injected via JS -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

<!-- D3.js -->
<script src="https://d3js.org/d3.v6.min.js"></script>
<!-- vis.js for Network Graph -->
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>

<script>
  // ============================================
  // 1. DATA PREPARATION (Liquid -> JS)
  // ============================================
  // Using jsonify for safe Liquid->JS data transfer (handles quotes, escapes, unicode)
  var rawTalks = [
  {% for talk in site.data.talks %}
    {
      title: {{ talk.title | strip_newlines | jsonify }},
      date: {{ talk.date | date: '%Y-%m-%d' | jsonify }},
      speaker: {{ talk.speaker | strip_newlines | jsonify }},
      words: new Set(({{ talk.title | jsonify }} + " " + {{ talk.abstract | default: "" | jsonify }})
        .toLowerCase()
        .replace(/monte\s+carlo/g, 'monte_carlo')
        .split(/[\s.,;:\(\)\[\]"!?\\/]+/)
      )
    },
  {% endfor %}
  ];

  // Stopwords loaded from _data/stopwords.yml (using jsonify for safe injection)
  var stopWords = new Set(
    {{ site.data.stopwords.english | jsonify }}
    .concat({{ site.data.stopwords.academic | jsonify }})
  );

  var frequencyMap = {};
  
  // Clean rawTalks words once
  rawTalks.forEach(function(talk) {
    var rawWordSet = talk.words;
    var cleanWords = new Set();
    rawWordSet.forEach(function(w) {
      if (!stopWords.has(w) && w.length > 3 && !/^\d+$/.test(w)) {
          cleanWords.add(w);
          frequencyMap[w] = (frequencyMap[w] || 0) + 1;
      }
    });
    talk.cleanWords = cleanWords; // Store back for fast lookup
  });

  var list = [];
  for (var w in frequencyMap) {
    if (frequencyMap[w] > 2) list.push([w, frequencyMap[w]]);
  }
  list.sort(function(a, b) { return b[1] - a[1]; });

  // ============================================
  // 2. WORD CLOUD RENDER (FALLBACK - only runs if SVG is missing)
  // ============================================
  var canvas = document.getElementById('word_cloud');
  if (canvas) {
      // Pre-calculate static values for better performance
      canvas.width = document.getElementById('canvas-container').offsetWidth;
      canvas.height = 400;

      var wordCloudColors = ['#b5121b', '#333333', '#555555', '#b5121b', '#333333'];
      var talksUrl = "{{ '/talks' | relative_url }}";
      
      // Limit to 100 words for rich visual appearance
      var wordCloudList = list.slice(0, 100).map(function(item) {
        return [item[0].replace(/_/g, ' '), item[1]];
      });

      if (typeof WordCloud === 'undefined') {
          console.error("WordCloud library not loaded.");
          document.getElementById('canvas-container').innerHTML = '<p class="text-danger">Error: WordCloud library missing.</p>';
      } else {
          try {
              WordCloud(canvas, {
                list: wordCloudList,
                gridSize: 10, // Precise placement
                weightFactor: function (size) { return Math.pow(size, 0.8) * 12; },
                fontFamily: 'Outfit, sans-serif',
                color: function (word, weight) {
                  return wordCloudColors[Math.floor(Math.random() * wordCloudColors.length)];
                },
                rotateRatio: 0,
                backgroundColor: '#ffffff',
                drawOutOfBound: false,
                click: function(item) {
                  showWordModal(item[0]);
                }
              });
          } catch (e) {
              console.error("WordCloud Error:", e);
          }
      }
  }

  // ============================================
  // 3. NETWORK GRAPH RENDER (Dynamic)
  // ============================================
  var container = document.getElementById('network-container');
  var network = null;
  let isCumulative = false;

  function getHeatmapColor(value, min, max) {
    var diff = max - min;
    if (diff <= 0) diff = 1; 
    var ratio = (value - min) / diff; 
    var r1 = 230, g1 = 126, b1 = 34; // Orange
    var r2 = 146, g2 = 43, b2 = 33;  // Dark Red
    var r = Math.round(r1 + ratio * (r2 - r1));
    var g = Math.round(g1 + ratio * (g2 - g1));
    var b = Math.round(b1 + ratio * (b2 - b1));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function renderGraph() {
    // 1. Get Slider Values
    var topN = parseInt(document.getElementById('nodeRange').value);
    var minConn = parseInt(document.getElementById('edgeRange').value);
  
    // Update labels
    document.getElementById('nodeVal').innerText = topN;
    document.getElementById('edgeVal').innerText = minConn;

    // 2. Filter Data
    var topList = list.slice(0, topN);
    var topWords = topList.map(item => item[0]);
    var maxFreq = topList.length > 0 ? topList[0][1] : 1;
    var minFreq = topList.length > 0 ? topList[topList.length - 1][1] : 1;

    // 3. Build Inverted Index for fast lookups (O(M × W_avg))
    // Maps each word to array of talk indices where it appears
    var invertedIndex = {};
    rawTalks.forEach(function(talk, talkIndex) {
      talk.cleanWords.forEach(function(word) {
        if (!invertedIndex[word]) invertedIndex[word] = [];
        invertedIndex[word].push(talkIndex);
      });
    });

    // 4. Generate Edges using Set Intersection
    // Complexity: O(N² × intersection_size) where N = topN nodes
    // At 100 nodes, this is ~5000 iterations - acceptable for browser.
    // If scaling beyond 200 nodes, consider Web Worker or pre-computation.
    var edges = [];
    var connectedIndices = new Set();
  
    // Store word pairs to look up later
    var edgeMetaData = {}; // Key: "fromId-toId", Value: { wordA, wordB, sharedCount }

    for (var i = 0; i < topN; i++) {
        for (var j = i + 1; j < topN; j++) {
            var wordA = topWords[i];
            var wordB = topWords[j];
        
          // Retrieve talk indices from inverted index
            var talksWithA = invertedIndex[wordA] || [];
            var talksWithB = invertedIndex[wordB] || [];
        
          // Find intersection (talks containing both words)
            var sharedTalkIndices = talksWithA.filter(function(id) {
                return talksWithB.includes(id);
            });
            var sharedCount = sharedTalkIndices.length;

            if (sharedCount >= minConn) {
                var edgeId = i + '-' + j; // Unique ID for edge lookups
                edges.push({ 
                    id: edgeId,
                    from: i, 
                    to: j, 
                    value: sharedCount,
                    color: { inherit: 'both', opacity: 0.5 }
                });
                connectedIndices.add(i);
                connectedIndices.add(j);
          
              // Store shared talk indices for modal display
                edgeMetaData[edgeId] = { 
                    wordA: wordA, 
                    wordB: wordB, 
                    count: sharedCount,
                    talkIndices: sharedTalkIndices
                };
            }
        }
    }

    // 5. Generate Nodes
    var nodes = [];
    topWords.forEach(function(word, index) {
        if (connectedIndices.has(index)) {
            var val = frequencyMap[word];
            nodes.push({ 
                id: index, 
                label: word.replace(/_/g, ' '), 
                value: val, 
                color: getHeatmapColor(val, minFreq, maxFreq)
            });
        }
    });

    // 5. Build Graph
    var data = { 
        nodes: new vis.DataSet(nodes), 
        edges: new vis.DataSet(edges) 
    };
  
    var options = {
        nodes: {
            shape: 'dot',
            font: { face: 'Outfit', color: '#333', size: 16 },
            scaling: { min: 15, max: 50, label: { enabled: true, min: 14, max: 24 } }
        },
        edges: {
            scaling: { min: 1, max: 6 },
            smooth: { type: 'continuous', roundness: 0.5 }
        },
        physics: {
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 50,
                fit: true
            },
            barnesHut: { 
                gravitationalConstant: -3000, 
                centralGravity: 0.3, 
                springLength: 100, 
                springConstant: 0.05
            },
            solver: 'barnesHut'
        },
        interaction: { hover: true, zoomView: true, selectConnectedEdges: false }
    };

    if (network !== null) {
        network.destroy();
        network = null;
    }
  
    network = new vis.Network(container, data, options);

    // 6. Interaction Handlers
    network.on("click", function(params) {
        // Handle Edge Click -> Modal
        if (params.edges.length > 0 && params.nodes.length === 0) {
             var edgeId = params.edges[0];
             var meta = edgeMetaData[edgeId];
             if (meta) {
                 showEdgeModal(meta.wordA, meta.wordB);
             }
        }
        // Handle Node Click -> Nav
        else if (params.nodes.length > 0) {
            var clickedId = params.nodes[0];
            var clickedNode = nodes.find(n => n.id === clickedId);
            if (clickedNode) {
                showWordModal(clickedNode.label);
            }
        }
    });
  
    network.once("stabilizationIterationsDone", function() {
       network.fit();
    });
  }

  function showEdgeModal(wordA, wordB) {
      var modalTitle = document.getElementById('edgeModalLabel');
      var modalBody = document.getElementById('edgeModalBody');
  
    modalTitle.innerText = 'Talks featuring "' + wordA.replace(/_/g, ' ') + '" + "' + wordB.replace(/_/g, ' ') + '"';
      modalBody.innerHTML = ''; // Clear previous

      // Use div instead of ul for clickable links
      var listGroup = document.createElement('div');
      listGroup.className = 'list-group';

      rawTalks.forEach(function(talk) {
          if (talk.cleanWords.has(wordA) && talk.cleanWords.has(wordB)) {
              var a = document.createElement('a');
              a.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(talk.title);
              a.className = 'list-group-item list-group-item-action';
              a.innerHTML = '<strong>' + talk.date + '</strong> (' + talk.speaker + ')<br/>' + talk.title;
              listGroup.appendChild(a);
          }
      });
  
    modalBody.appendChild(listGroup);
      $('#edgeModal').modal('show');
  }

  function showWordModal(word) {
    var modalTitle = document.getElementById('edgeModalLabel');
    var modalBody = document.getElementById('edgeModalBody');
  
    modalTitle.innerText = 'Talks featuring "' + word + '"';
    modalBody.innerHTML = '';

    var listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    var count = 0;
    rawTalks.forEach(function(talk) {
      var lookup = word.toLowerCase().replace(/ /g, '_');
      if (talk.cleanWords.has(lookup)) {
        count++;
        var a = document.createElement('a');
        a.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(talk.title);
        a.className = 'list-group-item list-group-item-action';
        a.innerHTML = '<strong>' + talk.date + '</strong> (' + talk.speaker + ')<br/>' + talk.title;
        listGroup.appendChild(a);
      }
    });
  
    if (count === 0) {
      modalBody.innerHTML = '<p class="text-muted">No talks found for this topic.</p>';
    } else {
      modalBody.appendChild(listGroup);
    }
  
    $('#edgeModal').modal('show');
  }

  // Initial Render & Bind Listeners
  try {
      renderGraph();
  } catch(e) { console.error("Network Graph Error:", e); }

  try {
      renderStreamgraph(); // Render Streamgraph
  } catch(e) { console.error("Streamgraph Error:", e); }
  
  try {
      if(document.getElementById('nodeRange')) document.getElementById('nodeRange').addEventListener('input', renderGraph);
      if(document.getElementById('edgeRange')) document.getElementById('edgeRange').addEventListener('input', renderGraph);
  } catch(e) {}
  
  window.addEventListener('resize',  function() {
      try { renderStreamgraph(); } catch(e){}
  });

  // Bind Toggle
  const toggle = document.getElementById('cumulativeToggle');
  if (toggle) {
      toggle.addEventListener('change', function(e) {
          isCumulative = e.target.checked;
          renderStreamgraph();
      });
  }

  // Bind Topic Count Slider
  const topicCountSlider = document.getElementById('topicCountRange');
  if (topicCountSlider) {
      topicCountSlider.addEventListener('input', function(e) {
          document.getElementById('topicCountVal').innerText = e.target.value;
          renderStreamgraph();
      });
  }

  // ============================================
  // 4. STREAMGRAPH LOGIC
  // ============================================


  function renderStreamgraph() {
    // Check D3
    if (typeof d3 === 'undefined') {
        console.warn("D3.js not loaded yet.");
        const c = document.getElementById('stream-container');
        if (c) c.innerHTML = '<p class="text-center text-danger">Error: D3.js library not loaded.</p>';
        return;
    }

    const container = document.getElementById('stream-container');
    if (!container) return;
    
    try {
        container.innerHTML = ''; // Clear
        const width = container.offsetWidth;
        const height = 400;
        const margin = {top: 20, right: 60, bottom: 30, left: 40}; // Increased right margin

        // 1. Process Data: Group by Year
        const yearMap = {}; // year -> { word -> count }
        const allYears = new Set();
        
        rawTalks.forEach(function(t) {
          if (!t.date || t.date.length < 4) return;
          
          const yStr = t.date.substring(0, 4);
          const yInt = parseInt(yStr);
          if (isNaN(yInt) || yInt < 2000 || yInt > 2030) return; // Basic validation check
          
          const y = yStr;
          allYears.add(y);
          if (!yearMap[y]) yearMap[y] = {};
          
          t.cleanWords.forEach(function(w) {
            const displayWord = w.replace(/_/g, ' '); 
            yearMap[y][displayWord] = (yearMap[y][displayWord] || 0) + 1;
          });
        });

        if (allYears.size === 0) {
            container.innerHTML = '<p class="text-center text-muted p-5">Not enough data to visualize timeline (Years: 0).</p>';
            return;
        }

        const years = Array.from(allYears).sort();
        
        // 2. Identify Top N Topics Overall
        const overallFreq = {};
        rawTalks.forEach(function(t) {
          if (!t.cleanWords) return;
          t.cleanWords.forEach(function(w) {
             const displayWord = w.replace(/_/g, ' ');
             overallFreq[displayWord] = (overallFreq[displayWord] || 0) + 1;
          });
        });
        
        // Get topic count from slider
        const topicCount = parseInt(document.getElementById('topicCountRange')?.value || 8);
        
        const topTopicList = Object.keys(overallFreq)
           .map(function(w) { return [w, overallFreq[w]]; })
           .sort(function(a,b) { return b[1] - a[1]; })
           .slice(0, topicCount)
           .map(function(item) { return item[0]; });

        if (topTopicList.length === 0) {
            container.innerHTML = '<p class="text-center text-muted p-5">No topics found.</p>';
            return;
        }

        // 3. Prepare Data for D3 Stack
        let runningTotals = {};
        topTopicList.forEach(t => runningTotals[t] = 0);

        const data = years.map(function(y) {
           const obj = { year: new Date(y, 0, 1) };
           topTopicList.forEach(function(topic) {
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

        // 4. D3 Stack
        const stack = d3.stack()
            .keys(topTopicList)
            .offset(isCumulative ? d3.stackOffsetNone : d3.stackOffsetSilhouette)
            .order(d3.stackOrderNone);

        const series = stack(data);

        // 5. Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.year; }))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([
                d3.min(series, function(layer) { return d3.min(layer, function(d) { return d[0]; }); }),
                d3.max(series, function(layer) { return d3.max(layer, function(d) { return d[1]; }); })
            ])
            .range([height - margin.bottom, margin.top]);

        const color = d3.scaleOrdinal()
            .domain(topTopicList)
            .range(d3.schemeTableau10);

        const area = d3.area()
            .curve(d3.curveBasis)
            .x(function(d) { return x(d.data.year); })
            .y0(function(d) { return y(d[0]); })
            .y1(function(d) { return y(d[1]); });

        // 6. Draw SVG
        const svg = d3.select("#stream-container")
          .append("svg")
          .attr("width", width)
          .attr("height", height);

        // Draw streams with hover and click interactions
        svg.selectAll("path.stream")
          .data(series)
          .join("path")
            .attr("class", "stream")
            .attr("fill", function(d) { return color(d.key); })
            .attr("d", area)
            .attr("opacity", 0.85)
            .style("cursor", "pointer")
            .style("transition", "opacity 0.2s ease, filter 0.2s ease")
            .on("mouseover", function(event, d) {
                d3.select(this)
                  .attr("opacity", 1)
                  .style("filter", "brightness(1.15) drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                  .attr("opacity", 0.85)
                  .style("filter", "none");
            })
            .on("click", function(event, d) {
                // Always show popup with talks for this topic
                showWordModal(d.key);
            })
            .append("title")
              .text(function(d) { return d.key + " (click for talks)"; });

        // Axis
        svg.append("g")
          .attr("transform", "translate(0," + (height - margin.bottom) + ")")
          .call(d3.axisBottom(x).ticks(Math.min(years.length, 12)));
          
        // Detect dark mode
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const labelColor = isDarkMode ? '#fff' : '#333';
        const shadowColor = isDarkMode ? '0 0 4px #000, 0 0 4px #000' : '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff';
        
        // Labels - "Thickest Point" strategy
        // Find where each stream is actually thickest and place labels there
        const labelPositions = [];
        const rightBound = width - margin.right; 
        const leftBound = margin.left;

        series.forEach(function(d) {
            // 1. Find the absolute widest point for this specific stream
            // We ignore the very edges (first/last 2 points) to avoid cut-off labels
            let maxDiff = 0;
            let bestPoint = null;
            let bestIdx = -1;

            for (let i = 2; i < d.length - 2; i++) {
                const diff = d[i][1] - d[i][0];
                if (diff > maxDiff) {
                    maxDiff = diff;
                    bestPoint = d[i];
                    bestIdx = i;
                }
            }

            // 2. Determine Font Size based on the stream thickness
            const streamHeight = bestPoint ? Math.abs(y(bestPoint[0]) - y(bestPoint[1])) : 0;
            
            // Scale font size: larger streams get larger text, clamped between 10px and 16px
            // This helps "Bayesian" pop out more than smaller streams
            const fontSize = Math.min(16, Math.max(10, streamHeight * 0.3));

            // 3. Visibility Threshold
            // Only show if the stream is thick enough at its peak
            if (bestPoint && streamHeight > 12) {
                const px = x(bestPoint.data.year);
                const py = y((bestPoint[0] + bestPoint[1]) / 2); // Vertical center

                // 4. Calculate Angle
                // We look at points slightly further apart (window of +/- 2) 
                // to get a smoother angle that ignores local jaggedness
                let angle = 0;
                if (bestIdx >= 2 && bestIdx < d.length - 2) {
                    const prev = d[bestIdx - 2];
                    const next = d[bestIdx + 2];
                    
                    const p1 = { x: x(prev.data.year), y: y((prev[0] + prev[1]) / 2) };
                    const p2 = { x: x(next.data.year), y: y((next[0] + next[1]) / 2) };
                    
                    // Calculate angle in degrees
                    const dy = p2.y - p1.y;
                    const dx = p2.x - p1.x;
                    angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    // Limit extreme angles so text is always readable
                    if (angle > 30) angle = 30;
                    if (angle < -30) angle = -30;
                }

                labelPositions.push({
                    key: d.key,
                    x: px,
                    y: py,
                    fontSize: fontSize,
                    angle: angle,
                    visible: true
                });
            } else {
                labelPositions.push({ visible: false });
            }
        });

        // Draw labels
        svg.selectAll(".stream-label")
            .data(series)
            .join("text") // Use .join() for cleaner D3 updates
            .attr("class", "stream-label")
            .attr("text-anchor", "middle") // CHANGED: Center text on the point
            .attr("fill", labelColor)
            .style("pointer-events", "none")
            .style("text-shadow", shadowColor)
            .style("font-weight", "600")
            .style("font-family", "sans-serif")
            .each(function(d, i) {
                const pos = labelPositions[i];
                if (pos && pos.visible) {
                    d3.select(this)
                        .attr("transform", `translate(${pos.x},${pos.y}) rotate(${pos.angle})`)
                        .style("font-size", pos.fontSize + "px")
                        .text(d.key)
                        .attr("opacity", 1);
                } else {
                    d3.select(this).text("").attr("opacity", 0);
                }
            });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="text-danger p-3">Error rendering streamgraph: ' + e.message + '</p>';
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  // Render graphs on page load
  renderGraph();
  renderStreamgraph();

  // Re-render on input changes
  document.getElementById('nodeRange').addEventListener('input', renderGraph);
  document.getElementById('edgeRange').addEventListener('input', renderGraph);
  document.getElementById('topicCountRange').addEventListener('input', function() {
      document.getElementById('topicCountVal').innerText = this.value;
      renderStreamgraph();
  });
  document.getElementById('cumulativeToggle').addEventListener('change', function() {
      isCumulative = this.checked;
      renderStreamgraph();
  });
</script>
