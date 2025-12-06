---
layout: default
title: Data Visualization
---

Explore the research landscape of the Computational Statistics and Machine Learning (CSML) group.

---

## 1. Topic Word Cloud

Most frequent terms from all past and future talk abstracts. **Click a word** to see all related talks.

<script src="https://cdnjs.cloudflare.com/ajax/libs/wordcloud2.js/1.2.2/wordcloud2.min.js"></script>

<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>

<div id="canvas-container" class="mb-5" style="width: 100%; height: 400px; border: 1px solid #eee; border-radius: 8px; position: relative;">
  <canvas id="word_cloud" style="width: 100%; height: 100%;"></canvas>
</div>

---

## 2. Topic Co-occurrence Network

Visualizes how topics appear together in the same talks.

- **Node Size/Color**: Frequency of the topic. Warmer colors (Red) = more frequent.
- **Connections**: Two topics are connected if they appear in the same talk. **Thicker lines** mean they appear together more often.
- **Click a line** to see the talks where both topics appear.
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

<script>
  // ============================================
  // 1. DATA PREPARATION (Liquid -> JS)
  // ============================================
  // Store raw talk objects for modal lookup
  var rawTalks = [
  {% for talk in site.data.talks %}
    {
      title: "{{ talk.title | strip_newlines | escape }}",
      date: "{{ talk.date | date: '%Y-%m-%d' }}",
      speaker: "{{ talk.speaker | strip_newlines | escape }}",
      words: new Set("{{ talk.title | strip_newlines | escape }} {{ talk.abstract | strip_newlines | escape }}".toLowerCase().split(/[\s.,;:\(\)\[\]"!?\\/]+/))
    },
  {% endfor %}
  ];

  var stopWords = new Set([
  // English Stopwords
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "will", "can", "us", 
  // Academic fillers
  "abstract", "talk", "speaker", "title", "university", "lancaster", "statistics", "proposed", "novel", "methods", "method", "paper", "presentation", "introduction", "using", "based", "new", "problem", "approach", "results", "analysis", "data", "model", "models", "inference", "also", "use", "work", "show", "applications", "framework", "properties", "point", "general", "particular", "several", "study", "different", "provide", "via", "well", "within", "towards", "first", "two", "one", "propose", "consider", "time", "algorithm", "algorithms", "however", "often", "example", "large", "set", "number", "case", "function", "functions", "given", "known", "include", "used", "many", "discuss", "present", "demonstrate", "illustrate", "apply", "focus", "terms"
  ]);

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
  // 2. WORD CLOUD RENDER (OPTIMIZED)
  // ============================================
  // Pre-calculate static values for better performance
  var canvas = document.getElementById('word_cloud');
  canvas.width = document.getElementById('canvas-container').offsetWidth;
  canvas.height = 400;

  var wordCloudColors = ['#b5121b', '#333333', '#555555', '#b5121b', '#333333'];
  var talksUrl = "{{ '/talks' | relative_url }}";
  
  // Limit to 100 words for rich visual appearance
  var wordCloudList = list.slice(0, 100);

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

  // ============================================
  // 3. NETWORK GRAPH RENDER (Dynamic)
  // ============================================
  var container = document.getElementById('network-container');
  var network = null;

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

    // 4. Generate Edges using Set Intersection (O(N² × small_intersection))
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
                label: word, 
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
                window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(clickedNode.label);
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
  
    modalTitle.innerText = 'Talks featuring "' + wordA + '" + "' + wordB + '"';
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
      if (talk.cleanWords.has(word)) {
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
  renderGraph();
  document.getElementById('nodeRange').addEventListener('input', renderGraph);
  document.getElementById('edgeRange').addEventListener('input', renderGraph);
</script>
