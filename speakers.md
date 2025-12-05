---
layout: default
title: Speakers
---

<h1>Past Speakers</h1>
<div class="row mb-4 align-items-center">
  <div class="col-md-6">
    <p class="mb-0">There have been {{ site.data.talks | map: "speaker" | uniq | size }} speakers recorded in our database.</p>
  </div>
  <div class="col-md-6">
    <input type="text" id="speaker-search" class="form-control" placeholder="Search speakers...">
  </div>
</div>

<div id="speakers-list">
  {% assign speakers = site.data.talks | group_by: "speaker" %}
  {% for speaker in speakers %}
    {% assign parent_loop_index = forloop.index %}
    <div class="speaker-item card mb-4 zhadow" data-count="{{ speaker.items | size }}">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="m-0" style="font-size: 1.5rem;">{{ speaker.name }}</h3>
        <span class="badge badge-secondary count-badge" style="font-size: 1rem;">{{ speaker.items | size }} talk{% if speaker.items.size > 1 %}s{% endif %}</span>
      </div>
      <ul class="list-group list-group-flush">
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
    
    // Append sorted items and apply leaderboard colors to count badges
    items.forEach(function(item, index) {
      list.appendChild(item);
      
      var badge = item.querySelector('.count-badge');
      if (index === 0) {
        // Gold
        badge.style.backgroundColor = '#FFD700'; 
        badge.style.color = '#000';
        badge.title = "Most Talks (Gold)";
      } else if (index === 1) {
        // Silver
        badge.style.backgroundColor = '#C0C0C0'; 
        badge.style.color = '#000';
        badge.title = "2nd Most Talks (Silver)";
      } else if (index === 2) {
        // Bronze
        badge.style.backgroundColor = '#CD7F32'; 
        badge.style.color = '#fff';
        badge.title = "3rd Most Talks (Bronze)";
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
