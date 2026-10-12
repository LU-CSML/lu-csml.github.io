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
    background-color: var(--tr-hover-bg) !important;
  }
  
  .chevron-icon {
    display: inline-block;
    margin-left: 8px;
    transition: transform 0.2s ease;
    width: 16px;
    height: 16px;
    vertical-align: middle;
  }
  
  .count-badge {
    background: var(--header-bg);
    color: var(--secondary-text);
    border: 1px solid var(--th-border-color);
    font-size: 0.85rem !important;
    font-weight: 500;
    padding: 0.4em 0.65em;
  }
  .speaker-item.zhadow { box-shadow: none; }

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
{% assign now_ts = site.time | date: "%s" | plus: 0 %}

{% capture past_speakers_str %}
{% for talk in site.data.talks %}
{% assign talk_ts = talk.date | date: "%s" | plus: 0 %}
{% if talk_ts < now_ts %}
{{ talk.speaker }}|
{% endif %}
{% endfor %}
{% endcapture %}
{% assign past_speaker_count = past_speakers_str | split: "|" | uniq | size %}

<div class="row mb-4 align-items-center">
  <div class="col-md-6">
    <p class="mb-0">There are {{ past_speaker_count }} speakers recorded in our database.</p>
  </div>
  <div class="col-md-6">
    <input type="text" id="speaker-search" class="form-control" placeholder="Search speakers..." aria-label="Search speakers by name">
  </div>
</div>

<div id="speakers-list">
  {% assign speakers = site.data.talks | group_by: "speaker" %}
  {% for speaker in speakers %}
    
    {% assign past_count = 0 %}
    {% capture speaker_past_items %}
      {% for talk in speaker.items %}
        {% assign t_ts = talk.date | date: "%s" | plus: 0 %}
        {% if t_ts < now_ts %}
          {{ forloop.index0 }},
          {% assign past_count = past_count | plus: 1 %}
        {% endif %}
      {% endfor %}
    {% endcapture %}
    {% assign past_indices = speaker_past_items | split: "," %}

    {% if past_count > 0 %}
      {% assign parent_loop_index = forloop.index %}
      {% assign should_collapse = false %}
      {% if past_count >= 3 %}
        {% assign should_collapse = true %}
      {% endif %}
    <div class="speaker-item card mb-4 zhadow{% if should_collapse %} collapsed{% endif %}" data-count="{{ past_count }}" data-speaker-name="{{ speaker.name }}">
      <div class="card-header d-flex justify-content-between align-items-center speaker-header" role="button" tabindex="0" aria-expanded="{% if should_collapse %}false{% else %}true{% endif %}">
        <h3 class="m-0" style="font-size: 1.5rem;">
          {{ speaker.name }}
          <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </h3>
        <span class="badge badge-secondary count-badge" style="font-size: 1rem;">{{ past_count }} talk{% if past_count > 1 %}s{% endif %}</span>
      </div>
      <ul class="list-group list-group-flush talks-list">
        {% for talk in speaker.items %}
          {% assign t_ts = talk.date | date: "%s" | plus: 0 %}
          {% if t_ts < now_ts %}
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div class="mr-3">
                <strong>{{ talk.date | date: "%Y-%m-%d" }}:</strong> {{ talk.title }}
              </div>
              <div class="text-nowrap">
                {% include talk_links.html talk=talk %}

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
          {% endif %}
        {% endfor %}
      </ul>
    </div>
    {% endif %}

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
    
    // Append speakers in descending talk-count order.
    items.forEach(function(item) {
      list.appendChild(item);
      
      var count = parseInt(item.getAttribute('data-count'));
      
      var badge = item.querySelector('.count-badge');
      
      badge.title = count + (count === 1 ? " talk" : " talks");
    });

    // Toggle speaker card collapse on header click
    list.addEventListener('click', function(e) {
      var header = e.target.closest('.speaker-header');
      if (header) {
        var speakerCard = header.closest('.speaker-item');
        if (speakerCard) {
          speakerCard.classList.toggle('collapsed');
          header.setAttribute('aria-expanded', !speakerCard.classList.contains('collapsed'));
        }
      }
    });

    list.addEventListener('keydown', function(e) {
      if (e.target.classList.contains('speaker-header') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.target.click();
      }
    });

    // Search Functionality
    var searchInput = document.getElementById('speaker-search');
    searchInput.addEventListener('input', function() {
      var filter = searchInput.value.toLowerCase();
      var countVisible = 0;
      
      items.forEach(function(item) {
        // Use data attribute for robust search (not affected by HTML structure changes)
        var name = (item.getAttribute('data-speaker-name') || '').toLowerCase();
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
