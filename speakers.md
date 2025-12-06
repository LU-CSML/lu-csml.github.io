---
layout: default
title: Speakers
description: Explore our speaker leaderboard featuring researchers who have presented at Lancaster University CSML seminars. Search by name to find all talks.
---

<style>
  .speaker-header {
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
  }
  
  .speaker-header:hover {
    background-color: #f8f9fa !important;
  }
  
  .chevron-icon {
    display: inline-block;
    margin-left: 8px;
    transition: transform 0.2s ease;
    width: 16px;
    height: 16px;
    vertical-align: middle;
  }
  
  .speaker-item.collapsed .chevron-icon {
    transform: rotate(-90deg);
  }
  
  .speaker-item .talks-list {
    max-height: 2000px;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }
  
  .speaker-item.collapsed .talks-list {
    max-height: 0;
    overflow: hidden;
  }
</style>

<h1>Past Speakers</h1>
<div class="row mb-4 align-items-center">
  <div class="col-md-6">
    <p class="mb-0">There are {{ site.data.talks | map: "speaker" | uniq | size }} speakers recorded in our database.</p>
  </div>
  <div class="col-md-6">
    <input type="text" id="speaker-search" class="form-control" placeholder="Search speakers..." aria-label="Search speakers by name">
  </div>
</div>

<div id="speakers-list">
  {% assign speakers = site.data.talks | group_by: "speaker" %}
  {% for speaker in speakers %}
    {% assign parent_loop_index = forloop.index %}
    {% assign should_collapse = false %}
    {% if speaker.items.size >= 3 %}
      {% assign should_collapse = true %}
    {% endif %}
    <div class="speaker-item card mb-4 zhadow{% if should_collapse %} collapsed{% endif %}" data-count="{{ speaker.items | size }}">
      <div class="card-header d-flex justify-content-between align-items-center speaker-header">
        <h3 class="m-0" style="font-size: 1.5rem;">
          {{ speaker.name }}
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </h3>
        <span class="badge badge-secondary count-badge" style="font-size: 1rem;">{{ speaker.items | size }} talk{% if speaker.items.size > 1 %}s{% endif %}</span>
      </div>
      <ul class="list-group list-group-flush talks-list">
        {% for talk in speaker.items %}
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div class="mr-3">
                <strong>{{ talk.date | date: "%Y-%m-%d" }}:</strong> {{ talk.title }}
              </div>
              <div class="text-nowrap">
                {% if talk.slides %}
                  <a href="{{ talk.slides }}" class="badge badge-warning text-dark border border-warning" target="_blank">Slides</a>
                {% endif %}
                
                {% comment %} Handle single link vs multiple links {% endcomment %}
                {% if talk.links %}
                  {% for link in talk.links %}
                    {% assign link_text_down = link.text | downcase %}
                    {% if link_text_down contains 'arxiv' %}
                       <a href="{{ link.url }}" class="badge badge-light border" style="background-color: #f8f9fa;" target="_blank">{% include icon-arxiv.svg %}</a>
                    {% else %}
                       <a href="{{ link.url }}" class="badge badge-info" target="_blank">{{ link.text | default: "Link" }}</a>
                    {% endif %}
                  {% endfor %}
                {% elsif talk.link %}
                    {% assign link_text_down = talk.link_text | downcase %}
                    {% if link_text_down contains 'arxiv' %}
                       <a href="{{ talk.link }}" class="badge badge-light border" style="background-color: #f8f9fa;" target="_blank">{% include icon-arxiv.svg %}</a>
                    {% else %}
                       <a href="{{ talk.link }}" class="badge badge-info" target="_blank">{{ talk.link_text | default: "Link" }}</a>
                    {% endif %}
                {% endif %}

                {% if talk.abstract %}
                  <button class="badge badge-secondary border-0 toggle-abstract" type="button" data-target="#abstract-{{ forloop.index }}-{{ parent_loop_index }}">
                    Abstract
                  </button>
                {% endif %}
              </div>
            </div>

            {% if talk.abstract %}
              <div id="abstract-{{ forloop.index }}-{{ parent_loop_index }}" class="abstract-content collapse mt-2">
                <div class="card card-body bg-light">
                  {{ talk.abstract | markdownify }}
                </div>
              </div>
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
    
    // Sort items by count descending
    items.sort(function(a, b) {
      var countA = parseInt(a.getAttribute('data-count'));
      var countB = parseInt(b.getAttribute('data-count'));
      return countB - countA; 
    });
    
    // Helper function to interpolate between two colors
    function interpolateColor(color1, color2, factor) {
      var result = color1.slice();
      for (var i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
      }
      return result;
    }
    
    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(function(x) {
        var hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
    
    // Find talk count ranges for gradient calculation
    var talkCounts = items.map(function(item) {
      return parseInt(item.getAttribute('data-count'));
    });
    var maxCount = Math.max.apply(null, talkCounts);
    var minCount = Math.min.apply(null, talkCounts);
    
    // Append sorted items and apply leaderboard colors with tie handling and gradient
    var currentRank = 0;
    var previousCount = -1;
    
    items.forEach(function(item, index) {
      list.appendChild(item);
      
      var count = parseInt(item.getAttribute('data-count'));
      
      // Handle ties: if same count as previous, keep same rank
      if (count !== previousCount) {
        currentRank = index + 1;
      }
      previousCount = count;
      
      var badge = item.querySelector('.count-badge');
      
      // Define medal colors
      var gold = [255, 215, 0];      // #FFD700
      var silver = [192, 192, 192];  // #C0C0C0
      var bronze = [205, 127, 50];   // #CD7F32
      var paleGray = [235, 235, 235]; // Very light gray for 1 talk
      
      var bgColor, textColor, titleText;
      
      if (currentRank === 1) {
        bgColor = rgbToHex.apply(null, gold);
        textColor = '#000';
        titleText = count === previousCount && index > 0 ? "Tied for Most Talks (Gold)" : "Most Talks (Gold)";
      } else if (currentRank === 2) {
        bgColor = rgbToHex.apply(null, silver);
        textColor = '#000';
        titleText = "2nd Most Talks (Silver)";
      } else if (currentRank === 3) {
        bgColor = rgbToHex.apply(null, bronze);
        textColor = '#fff';
        titleText = "3rd Most Talks (Bronze)";
      } else {
        // Gradient based on talk count, not rank
        // Get the talk count for rank 3 (bronze threshold)
        var bronzeCount = parseInt(items[2].getAttribute('data-count'));
        
        // Create gradient from bronze count down to 1 talk
        // If count equals bronzeCount, use bronze color
        // If count equals 1, use paleGray
        var gradientRange = Math.max(1, bronzeCount - minCount);
        var gradientPosition = (bronzeCount - count) / gradientRange;
        
        var interpolated = interpolateColor(bronze, paleGray, gradientPosition);
        bgColor = rgbToHex.apply(null, interpolated);
        
        // Determine text color based on brightness
        var brightness = (interpolated[0] * 299 + interpolated[1] * 587 + interpolated[2] * 114) / 1000;
        textColor = brightness > 155 ? '#000' : '#fff';
        titleText = count + " talk" + (count > 1 ? "s" : "");
      }
      
      badge.style.backgroundColor = bgColor;
      badge.style.color = textColor;
      badge.title = titleText;
    });

    // Toggle speaker card collapse on header click
    list.addEventListener('click', function(e) {
      var header = e.target.closest('.speaker-header');
      if (header) {
        var speakerCard = header.closest('.speaker-item');
        if (speakerCard) {
          speakerCard.classList.toggle('collapsed');
        }
      }
    });

    // Search Functionality
    var searchInput = document.getElementById('speaker-search');
    searchInput.addEventListener('keyup', function() {
      var filter = searchInput.value.toLowerCase();
      var countVisible = 0;
      
      items.forEach(function(item) {
        var name = item.querySelector('h3').innerText.toLowerCase();
        if (name.indexOf(filter) > -1) {
          item.style.display = "";
          countVisible++;
        } else {
          item.style.display = "none";
        }
      });

      // Show/hide "no results" message
      var existingMsg = document.getElementById('no-speaker-results');
      if (countVisible === 0 && filter.length > 0 && !existingMsg) {
        var noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-speaker-results';
        noResultsMsg.className = 'alert alert-warning mt-3';
        noResultsMsg.innerHTML = '<strong>No speakers found.</strong> Try a different search term.';
        list.insertBefore(noResultsMsg, list.firstChild);
      } else if ((countVisible > 0 || filter.length === 0) && existingMsg) {
        existingMsg.remove();
      }
    });

    // Abstract Toggle Functionality
    // Using event delegation for efficiency
    list.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('toggle-abstract')) {
        var targetId = e.target.getAttribute('data-target');
        var content = document.querySelector(targetId);
        if (content) {
             // Simple toggle class logic if not using bootstrap.js collapse
             if (content.classList.contains('show')) {
                 content.classList.remove('show');
             } else {
                 content.classList.add('show');
             }
        }
      }
    });

  });
</script>
