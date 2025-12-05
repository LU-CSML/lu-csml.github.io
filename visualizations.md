---
layout: default
title: Data Visualization
---

# Research Topic Visualizations

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
- **Click a node** to filter the talk archive.

<div id="network-container" class="mb-5" style="width: 100%; height: 600px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;"></div>

<script>
  // ============================================
  // 1. DATA PREPARATION (Liquid -> JS)
  // ============================================
  var talks = [
  {% for talk in site.data.talks %}
    "{{ talk.title | escape }} {{ talk.abstract | escape }}",
  {% endfor %}
  ];

  var stopWords = new Set([
  // English Stopwords
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "will", "can", "us", 
  // Academic fillers
  "abstract", "talk", "speaker", "title", "university", "lancaster", "statistics", "proposed", "novel", "methods", "method", "paper", "presentation", "introduction", "using", "based", "new", "problem", "approach", "results", "analysis", "data", "model", "models", "inference", "also", "use", "work", "show", "applications", "framework", "properties", "point", "general", "particular", "several", "study", "different", "provide", "via", "well", "within", "towards", "first", "two", "one", "propose", "consider", "time", "algorithm", "algorithms", "however", "often", "example", "large", "set", "number", "case", "function", "functions", "given", "known", "include", "used", "many", "discuss", "present", "demonstrate", "illustrate", "apply", "focus", "terms"
  ]);

  var frequencyMap = {};
  var talkWords = []; 

  talks.forEach(function(talkText) {
    var txt = document.createElement("textarea");
    txt.innerHTML = talkText;
    var decodedText = txt.value;
    var words = decodedText.toLowerCase().split(/[\s.,;:\(\)\[\]"!?\\/]+/);
    
    var uniqueWords = new Set();
    words.forEach(function(w) {
      if (!stopWords.has(w) && w.length > 3 && !/^\d+$/.test(w)) {
        uniqueWords.add(w);
      }
    });

    talkWords.push(uniqueWords); 

    uniqueWords.forEach(function(w) {
      frequencyMap[w] = (frequencyMap[w] || 0) + 1;
    });
  });

  var list = [];
  for (var w in frequencyMap) {
    if (frequencyMap[w] > 2) list.push([w, frequencyMap[w]]);
  }
  list.sort(function(a, b) { return b[1] - a[1]; });

  // Get top N words
  var topN = 30;
  var topList = list.slice(0, topN);
  var topWords = topList.map(function(item) { return item[0]; });
  
  // Find min/max for scaling
  var maxFreq = topList[0][1];
  var minFreq = topList[topList.length - 1][1];

  // ============================================
  // 2. WORD CLOUD RENDER
  // ============================================
  var canvas = document.getElementById('word_cloud');
  canvas.width = document.getElementById('canvas-container').offsetWidth;
  canvas.height = 400;

  WordCloud(canvas, {
    list: list,
    gridSize: 10,
    weightFactor: function (size) { return Math.pow(size, 0.8) * 12; },
    fontFamily: 'Outfit, sans-serif',
    color: function (word, weight) {
      var colors = ['#b5121b', '#333333', '#555555', '#b5121b', '#333333'];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    rotateRatio: 0,
    backgroundColor: '#ffffff',
    drawOutOfBound: false,
    click: function(item) {
      window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(item[0]);
    }
  });

  // ============================================
  // 3. NETWORK GRAPH RENDER
  // ============================================
  
  // Heatmap Color Generator: Orange (#e67e22) to Dark Red (#922b21)
  function getHeatmapColor(value, min, max) {
    var diff = max - min;
    if (diff === 0) diff = 1; // avoid division by zero
    var ratio = (value - min) / diff; // 0 to 1
    
    // Start RGB (Orange: 230, 126, 34)
    var r1 = 230, g1 = 126, b1 = 34;
    // End RGB (Dark Red: 146, 43, 33)
    var r2 = 146, g2 = 43, b2 = 33;
    
    var r = Math.round(r1 + ratio * (r2 - r1));
    var g = Math.round(g1 + ratio * (g2 - g1));
    var b = Math.round(b1 + ratio * (b2 - b1));
    
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // 1. Generate Edges & Track Connected Nodes
  var edges = [];
  var connectedIndices = new Set();

  for (var i = 0; i < topN; i++) {
    for (var j = i + 1; j < topN; j++) {
      var wordA = topWords[i];
      var wordB = topWords[j];
      var sharedCount = 0;

      talkWords.forEach(function(uniqueWords) {
        if (uniqueWords.has(wordA) && uniqueWords.has(wordB)) sharedCount++;
      });

      // Filter: STRICTER threshold (>2) to reduce clutter as requested
      if (sharedCount > 2) {
        edges.push({ 
          from: i, 
          to: j, 
          value: sharedCount,
          color: { inherit: 'both', opacity: 0.5 } // More transparent edges
        });
        connectedIndices.add(i);
        connectedIndices.add(j);
      }
    }
  }

  // 2. Generate Only Connected Nodes
  var nodes = [];
  topWords.forEach(function(word, index) {
      if (connectedIndices.has(index)) {
        var val = frequencyMap[word];
        nodes.push({ 
          id: index, // Use original index as ID so edges match
          label: word, 
          value: val, 
          color: getHeatmapColor(val, minFreq, maxFreq)
        });
      }
  });

  var container = document.getElementById('network-container');
  var data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  var options = {
    nodes: {
      shape: 'dot',
      font: { 
        face: 'Outfit', 
        color: '#333',
        size: 16
      },
      scaling: { 
        min: 15, 
        max: 50,
        label: { enabled: true, min: 14, max: 24 } // Scale labels with nodes
      }
    },
    edges: {
      scaling: { min: 1, max: 6 },
      smooth: { type: 'continuous', roundness: 0.5 }
    },
    physics: {
      stabilization: {
        enabled: true,
        iterations: 1500,
        updateInterval: 50,
        onlyDynamicEdges: false,
        fit: true // Ensure it fits after stabilization
      },
      barnesHut: { 
        gravitationalConstant: -2000, // Reduced repulsion to keep it tighter
        centralGravity: 0.5, // Stronger pull to center to avoid spread
        springLength: 80, // Shorter springs to reduce edge length
        springConstant: 0.04
      },
      maxVelocity: 40,
      minVelocity: 0.5,
      solver: 'barnesHut'
    },
    interaction: { 
      hover: true,
      zoomView: true 
    },
    layout: {
      randomSeed: 2 // Deterministic layout
    }
  };

  var network = new vis.Network(container, data, options);

  network.on("click", function(params) {
    if (params.nodes.length > 0) {
      // Find the node object to get the correct label, as params.nodes[0] is the ID
      var clickedId = params.nodes[0];
      var clickedNode = nodes.find(n => n.id === clickedId);
      if (clickedNode) {
          window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(clickedNode.label);
      }
    }
  });
  
  // Extra fit after load just in case
  network.once("stabilizationIterationsDone", function() {
      network.fit();
  });
</script>
