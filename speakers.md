---
layout: default
title: Speakers
---

<h1>Past Speakers</h1>
<p>There have been {{ site.data.talks | map: "speaker" | uniq | size }} speakers recorded in our database.</p>

<div id="speakers-list">
  {% assign speakers = site.data.talks | group_by: "speaker" %}
  {% for speaker in speakers %}
    <div class="speaker-item card mb-4 zhadow" data-count="{{ speaker.items | size }}">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="m-0" style="font-size: 1.5rem;">{{ speaker.name }}</h3>
        <span class="badge badge-secondary" style="font-size: 1rem;">{{ speaker.items | size }} talk{% if speaker.items.size > 1 %}s{% endif %}</span>
      </div>
      <ul class="list-group list-group-flush">
        {% for talk in speaker.items %}
          <li class="list-group-item">
            <strong>{{ talk.date | date: "%Y-%m-%d" }}:</strong> {{ talk.title }}
            {% if talk.links %}
              <a href="{{ talk.links }}" class="ml-2 badge badge-info">{{ talk.link_text | default: "Link" }}</a>
            {% endif %}
            {% if talk.slides %}
              <a href="{{ talk.slides }}" class="ml-2 badge badge-warning">Slides</a>
            {% endif %}
            
            {% if talk.abstract %}
              <details class="abstract-toggle mt-1">
                <summary>Abstract <span class="arrow">▶</span></summary>
                <div class="abstract-content">
                  {{ talk.abstract | markdownify }}
                </div>
              </details>
            {% endif %}
          </li>
        {% endfor %}
      </ul>
    </div>
  {% endfor %}
</div>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    var list = document.getElementById('speakers-list');
    var items = Array.prototype.slice.call(list.querySelectorAll('.speaker-item'));
    
    items.sort(function(a, b) {
      var countA = parseInt(a.getAttribute('data-count'));
      var countB = parseInt(b.getAttribute('data-count'));
      return countB - countA; // Descending order
    });
    
    items.forEach(function(item) {
      list.appendChild(item);
    });
  });
</script>
