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

- **Node Size/Color**: Frequency of the topic. Darker red = more frequent.
- **Connections**: Two topics are connected if they appear in the same talk.
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
  var topN = 30; // Increased back slightly for dedicated page
  var topWords = list.slice(0, topN).map(function(item) { return item[0]; });
  
  // Helper: Color Gradient Function (3-Stop Heat Map)
  // Low: Grey (#888), Med: Orange (#d35400), High: Brand Red (#b5121b)
  function getColor(value, min, max) {
    if (min === max) return '#b5121b';
    var ratio = (value - min) / (max - min);
    
    if (ratio < 0.33) return '#888888';       // Low freq
    if (ratio < 0.66) return '#d35400';       // Medium (Orange)
    return '#b5121b';                         // High (Red)
  }

  var maxFreq = list[0][1];
  var minFreq = list[topN-1][1];

  var nodes = topWords.map(function(word, index) {
    var val = frequencyMap[word];
    return { 
      id: index, 
      label: word, 
      value: val, 
      color: getColor(val, minFreq, maxFreq)
    };
  });

  var edges = [];
  for (var i = 0; i < topN; i++) {
    for (var j = i + 1; j < topN; j++) {
      var wordA = topWords[i];
      var wordB = topWords[j];
      var sharedCount = 0;

      talkWords.forEach(function(uniqueWords) {
        if (uniqueWords.has(wordA) && uniqueWords.has(wordB)) sharedCount++;
      });

      // Filter: Only show connection if they share MORE THAN 1 talk
      // Back to strict filtering as requested to reduce density
      if (sharedCount > 1) {
        edges.push({ 
          from: i, 
          to: j, 
          value: sharedCount,
          color: { 
            inherit: 'both', 
            opacity: 0.8 
          }
        });
      }
    }
  }

  var container = document.getElementById('network-container');
  var data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  var options = {
    nodes: {
      shape: 'dot',
      font: { face: 'Outfit', color: '#333' },
      scaling: { min: 10, max: 40 }
    },
    edges: {
      scaling: { min: 1, max: 8 },
      smooth: { type: 'continuous' }
    },
    physics: {
      stabilization: false,
      barnesHut: { gravitationalConstant: -8000, springConstant: 0.01, springLength: 150 }
    },
    interaction: { hover: true }
  };

  var network = new vis.Network(container, data, options);

  network.on("click", function(params) {
    if (params.nodes.length > 0) {
      window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(nodes[params.nodes[0]].label);
    }
  });
</script>
