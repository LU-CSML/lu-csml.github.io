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
  // DATA INITIALIZATION
  // ============================================
  
  // Data is injected by Jekyll via window.CSML_DATA
  const DATA = window.CSML_DATA;
  if (!DATA || !DATA.talks) {
    console.error('CSML_DATA not found. Ensure data island is present in HTML.');
    return;
  }

  const rawTalks = DATA.talks;
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
    // Complexity: O(N² × intersection_size) where N = topN nodes
    // At 100 nodes this is ~5000 iterations - acceptable for browser
    const edges = [];
    const connectedIndices = new Set();
    const edgeMetaData = {};

    for (let i = 0; i < topN; i++) {
      for (let j = i + 1; j < topN; j++) {
        const wordA = topWords[i];
        const wordB = topWords[j];
        const talksWithA = invertedIndex[wordA] || [];
        const talksWithB = invertedIndex[wordB] || [];
        
        const sharedTalkIndices = talksWithA.filter(id => talksWithB.includes(id));
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
        if (isNaN(yInt) || yInt < 2000 || yInt > 2030) return;

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
    $('#edgeModal').modal('show');
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

    $('#edgeModal').modal('show');
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  
  renderWordCloud();
  renderGraph();
  renderStreamgraph();

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

  window.addEventListener('resize', () => {
    try { renderStreamgraph(); } catch(e) {}
  });

})();
