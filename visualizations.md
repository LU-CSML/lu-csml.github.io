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

## 2. Topic Evolution Stream

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
          <span aria-hidden="true">&times;</span>
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

<!-- Data Island: Inject Jekyll data for external JS consumption -->
<script>
  window.CSML_DATA = {
    talks: [
      {% for talk in site.data.talks %}
      {
        title: {{ talk.title | strip_newlines | jsonify }},
        date: {{ talk.date | date: '%Y-%m-%d' | jsonify }},
        speaker: {{ talk.speaker | strip_newlines | jsonify }},
        abstract: {{ talk.abstract | default: "" | jsonify }}
      }{% unless forloop.last %},{% endunless %}
      {% endfor %}
    ],
    stopwords: {
      english: {{ site.data.stopwords.english | jsonify }},
      academic: {{ site.data.stopwords.academic | jsonify }}
    },
    talksUrl: "{{ '/talks' | relative_url }}"
  };
</script>

<!-- Visualization Logic (external for better maintainability) -->
<script src="{{ '/assets/js/visualizations.js' | relative_url }}"></script>
