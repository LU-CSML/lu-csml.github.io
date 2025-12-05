---
layout: default
title: CSML
---

# Lancaster University CSML

Lancaster University CSML is a weekly seminar organized by the Lancaster [Computational Statistics section](https://www.lancaster.ac.uk/maths/research/statistics/bayesian-and-computational-statistics/) to discuss research from all areas of Computational Statistics, Machine Learning, and related fields.

We host talks by invited external speakers, as well as discussion meetings by contributing internal speakers.

**We meet at 15:00 - 16:00 GMT on Thursdays.** The location is the [Postgraduate Statistics Centre (PSC), Lecture Theatre](https://use.mazemap.com/#v=1&center=-2.784180,54.008594&zoom=18&campusid=341&zlevel=1&sharepoitype=poi&sharepoi=1002612354).

<script src="https://cdnjs.cloudflare.com/ajax/libs/wordcloud2.js/1.2.2/wordcloud2.min.js"></script>

<div id="canvas-container" class="mb-4" style="width: 100%; height: 400px; border: 1px solid #eee; border-radius: 8px; position: relative;">
  <canvas id="word_cloud" style="width: 100%; height: 100%;"></canvas>
</div>

<script>
  // 1. Get talk data as a JSON array of strings (one string per talk)
  // We use proper JSON formatting to handle quotes safely
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

  // 3. Process each talk individually (Document Frequency)
  talks.forEach(function(talkText) {
    // Decode HTML entities
    var txt = document.createElement("textarea");
    txt.innerHTML = talkText;
    var decodedText = txt.value;

    var words = decodedText.toLowerCase().split(/[\s.,;:\(\)\[\]"!?\\/]+/);
    
    // Create a set of unique words for THIS talk
    var uniqueWords = new Set();
    
    words.forEach(function(w) {
      if (!stopWords.has(w) && w.length > 3 && !/^\d+$/.test(w)) {
        uniqueWords.add(w);
      }
    });

    // Add +1 to global count for each unique word found in this talk
    uniqueWords.forEach(function(w) {
      frequencyMap[w] = (frequencyMap[w] || 0) + 1;
    });
  });

  // 6. Convert to array for WordCloud
  var list = [];
  for (var w in frequencyMap) {
    if (frequencyMap[w] > 2) { 
      list.push([w, frequencyMap[w]]);
    }
  }

  // 7. Render
  var canvas = document.getElementById('word_cloud');
  canvas.width = document.getElementById('canvas-container').offsetWidth;
  canvas.height = 400;

  WordCloud(canvas, {
    list: list,
    gridSize: 10,
    weightFactor: function (size) {
      return Math.pow(size, 0.8) * 12; 
    },
    fontFamily: 'Outfit, sans-serif',
    // CSML Brand Colors: Red (#b5121b), Dark Grey (#333), Light Grey (#777)
    color: function (word, weight) {
      var colors = ['#b5121b', '#333333', '#555555', '#b5121b', '#333333'];
      return colors[Math.floor(Math.random() * colors.length)];
    },
    rotateRatio: 0, // Force horizontal text for cleanliness
    backgroundColor: '#ffffff',
    drawOutOfBound: false,
    click: function(item) {
      // Redirect to talks page with search query
      window.location.href = "{{ '/talks' | relative_url }}?q=" + encodeURIComponent(item[0]);
    }
  });
</script>

### [View 2025/26 Schedule](/schedule)

> [View Past Talks Archive](/talks)

---

We regularly host lunches with external speakers. This is an excellent opportunity for informal discussion in a relaxed setting. If you would like to join the group for lunch or schedule a brief meeting with a visiting speaker, please contact the organizer [Liam Llamazares](https://liamllamazareselias.com) (l.llamazareselias[at]lancaster.ac.uk). All are welcome! Suggestions for external speakers or offers to give a talk are also appreciated.
