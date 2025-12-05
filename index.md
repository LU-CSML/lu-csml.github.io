---
layout: default
title: CSML
---

# Lancaster University CSML

Lancaster University CSML is a weekly seminar organized by the Lancaster [Computational Statistics section](https://www.lancaster.ac.uk/maths/research/statistics/bayesian-and-computational-statistics/) to discuss research from all areas of Computational Statistics, Machine Learning, and related fields.

We host talks by invited external speakers, as well as discussion meetings by contributing internal speakers.

**We meet at 15:00 - 16:00 GMT on Thursdays.** The location is the [Postgraduate Statistics Centre (PSC), Lecture Theatre](https://use.mazemap.com/#v=1&center=-2.784180,54.008594&zoom=18&campusid=341&zlevel=1&sharepoitype=poi&sharepoi=1002612354).

<script src="https://cdnjs.cloudflare.com/ajax/libs/wordcloud2.js/1.2.2/wordcloud2.min.js"></script>
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>

<!-- Word Cloud Container -->
<div id="canvas-container" class="mb-4" style="width: 100%; height: 400px; border: 1px solid #eee; border-radius: 8px; position: relative;">
  <canvas id="word_cloud" style="width: 100%; height: 100%;"></canvas>
</div>

<!-- Network Graph Container -->
<h3 class="mt-5 mb-3">Topic Connections</h3>
<p class="text-muted">Explore how different research topics are connected. Lines indicate that two topics appeared in the same talk.</p>
<div id="network-container" class="mb-5" style="width: 100%; height: 500px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;"></div>

<script>
  // 1. Get talk data
  var talks = [
  {% for talk in site.data.talks %}
    "{{ talk.title | escape }} {{ talk.abstract | escape }}",
  {% endfor %}
  ];

  // 2. Stop words list
  var stopWords = new Set([
  // English Stopwords
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "will", "can", "us", 
  // Academic/Generic fillers
  "abstract", "talk", "speaker", "title", "university", "lancaster", "statistics", "proposed", "novel", "methods", "method", "paper", "presentation", "introduction", "using", "based", "new", "problem", "approach", "results", "analysis", "data", "model", "models", "inference", "also", "use", "work", "show", "applications", "framework", "properties", "point", "general", "particular", "several", "study", "different", "provide", "via", "well", "within", "towards", "first", "two", "one", "propose", "consider", "time", "algorithm", "algorithms", "however", "often", "example", "large", "set", "number", "case", "function", "functions", "given", "known", "include", "used", "many", "discuss", "present", "demonstrate", "illustrate", "apply", "focus", "terms"
  ]);

  var frequencyMap = {};
  var talkWords = []; // Array of Sets, one per talk

  // 3. Process each talk (Document Frequency)
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

    talkWords.push(uniqueWords); // Store for Network Graph

    uniqueWords.forEach(function(w) {
      frequencyMap[w] = (frequencyMap[w] || 0) + 1;
    });
  });

  // 4. Prepare List for WordCloud (Top words)
  var list = [];
  for (var w in frequencyMap) {
    if (frequencyMap[w] > 2) list.push([w, frequencyMap[w]]);
  }
  
  // Sort by frequency
  list.sort(function(a, b) { return b[1] - a[1]; });

  // -----------------------------------------------------
  // RENDER WORD CLOUD
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // RENDER NETWORK GRAPH (Vis.js)
  // -----------------------------------------------------
  // Take top N words for the graph to avoid clutter
  var topN = 25; // Reduced from 30
  var topWords = list.slice(0, topN).map(function(item) { return item[0]; });
  
  // Create Nodes
  var nodes = topWords.map(function(word, index) {
    return { 
      id: index, 
      label: word, 
      value: frequencyMap[word], // Size based on freq
      color: '#b5121b' // Default RED
    };
  });

  // Create Edges (Co-occurrence)
  var edges = [];
  // Compare every pair of top words (N^2 complexity, but N=30 is tiny)
  for (var i = 0; i < topN; i++) {
    for (var j = i + 1; j < topN; j++) {
      var wordA = topWords[i];
      var wordB = topWords[j];
      var sharedCount = 0;

      // Count how many talks contain both words
      talkWords.forEach(function(uniqueWords) {
        if (uniqueWords.has(wordA) && uniqueWords.has(wordB)) {
          sharedCount++;
        }
      });

      // Filter: Only show connection if they share GREATER THAN 1 talk
      // This removes the "hairball" of one-off connections
      if (sharedCount > 1) {
        edges.push({ 
          from: i, 
          to: j, 
          value: sharedCount, // Thickness
          color: { color: '#cccccc', highlight: '#333333' }
        });
      }
    }
  }

  var container = document.getElementById('network-container');
  var data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  var options = {
    nodes: {
      shape: 'dot',
      font: { face: 'Outfit' },
      scaling: { min: 15, max: 40 } // Slightly larger nodes
    },
    edges: {
      scaling: { min: 1, max: 8 }, // Thicker strong lines
      smooth: { type: 'continuous' } // Nicer curves
    },
    physics: {
      stabilization: false,
      // Stronger repulsion to spread them out
      barnesHut: { gravitationalConstant: -8000, springConstant: 0.01, springLength: 150 }
    },
    interaction: { hover: true }
  };

  var network = new vis.Network(container, data, options);

  // Click handler for Graph
  network.on("click", function(params) {
    if (params.nodes.length > 0) {
      var nodeId = params.nodes[0];
      var word = nodes[nodeId].label;
      window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(word);
    }
  });
</script>

### [View 2025/26 Schedule](/schedule)

> [View Past Talks Archive](/talks)

---

We regularly host lunches with external speakers. This is an excellent opportunity for informal discussion in a relaxed setting. If you would like to join the group for lunch or schedule a brief meeting with a visiting speaker, please contact the organizer [Liam Llamazares](https://liamllamazareselias.com) (l.llamazareselias[at]lancaster.ac.uk). All are welcome! Suggestions for external speakers or offers to give a talk are also appreciated.
