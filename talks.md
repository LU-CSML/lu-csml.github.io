---
layout: default
title: Past Talks - CSML
---

# Past Talks

<div class="row mb-4 align-items-center">
  <div class="col-md-6">
    <p class="mb-0">There are {{ site.data.talks | size }} talks recorded in our database.</p>
  </div>
  <div class="col-md-6">
    <input type="text" id="talk-search" class="form-control" placeholder="Search by title, speaker, or abstract..." aria-label="Search talks by title, speaker, or abstract">
  </div>
</div>

<script>
  function clearSearch() {
    window.location.href = "{{ '/talks' | relative_url }}";
  }

  document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('talk-search');
    var banner = document.getElementById('search-banner');
    var bannerTerm = document.getElementById('search-term');
    
    // Rows and Headers
    var rows = document.querySelectorAll('.talk-table tbody tr');
    var yearHeaders = document.querySelectorAll('.year-header');

    function filterTalks(query) {
      query = query.trim();
      
      if (!query) {
        // Show all
        rows.forEach(r => r.style.display = '');
        return;
      }
      
      // Hide all year headers initially
      yearHeaders.forEach(el => el.style.display = 'none');
      
      // Simple case-insensitive matching (includes partial matches)
      var lowerQuery = query.toLowerCase();

      rows.forEach(function(row) {
        if (row.classList.contains('year-header')) return;

        var text = row.textContent.toLowerCase();
        
        if (text.includes(lowerQuery)) {
          row.style.display = '';
          // Show the year header for this visible row
          var prev = row.previousElementSibling;
          while (prev) {
            if (prev.classList.contains('year-header')) {
              prev.style.display = '';
              break;
            }
            prev = prev.previousElementSibling;
          }
        } else {
          row.style.display = 'none';
        }
      });
    }

    // 1. Check URL Params
    var urlParams = new URLSearchParams(window.location.search);
    var qParam = urlParams.get('q');

    if (qParam) {
      var decoded = decodeURIComponent(qParam).trim();
      searchInput.value = decoded;
      banner.style.display = 'block';
      bannerTerm.innerText = decoded;
      filterTalks(decoded);
    }

    // 2. Listen for Input
    searchInput.addEventListener('keyup', function() {
      // If user types, hide the "Showing results for: ..." banner from URL param
      banner.style.display = 'none';
      filterTalks(searchInput.value);
    });
  });
</script>

{% assign now_unix = 'now' | date: '%s' %}
{% assign past_talks = '' | split: '' %}
{% for talk in site.data.talks %}
{% assign talk_unix = talk.date | date: '%s' %}
{% if talk_unix < now_unix %}
{% assign past_talks = past_talks | push: talk %}
{% endif %}
{% endfor %}

{% assign sorted_talks = past_talks | sort: "date" | reverse %}
{% assign talks_by_year = past_talks | group_by_exp: "item", "item.date | date: '%Y'" | sort: "name" | reverse %}
{% assign current_year = "" %}

<div class="row">
  <!-- Desktop Sidebar Navigation -->
  <div class="col-md-1 d-none d-md-block" style="max-width: 70px;">
    <div class="sticky-top pt-3" style="top: 80px; max-height: 90vh; overflow-y: auto;">
      <h6 class="text-secondary mb-2" style="font-size: 0.75rem; font-weight: 600;">YEARS</h6>
      <ul class="nav flex-column">
        {% for year_group in talks_by_year %}
          <li class="nav-item">
            <a class="nav-link pl-0 py-1 text-muted" style="font-size: 0.85rem; padding: 0.25rem 0 !important;" href="#{{ year_group.name }}">{{ year_group.name }}</a>
          </li>
        {% endfor %}
      </ul>
    </div>
  </div>

  <!-- Main Content -->
  <div class="col-md-11">
    <!-- Mobile Top Navigation (Visible only on small screens) -->
    <div class="year-index mb-4 p-3 bg-light rounded d-md-none">
      <span class="font-weight-bold mr-2">Jump to year:</span>
      {% for year_group in talks_by_year %}
        <a href="#{{ year_group.name }}" class="badge badge-light border text-danger mr-1 p-2" style="font-size: 0.9em;">{{ year_group.name }}</a>
      {% endfor %}
    </div>

    <div class="table-responsive">
      <table class="talk-table">
        <thead>
          <tr>
            <th class="talk-date-col">Date</th>
            <th class="talk-speaker-col">Speaker</th>
            <th class="talk-title-col">Title</th>
            <th class="talk-links-col">Links</th>
          </tr>
        </thead>
        <tbody>
          {% for talk in sorted_talks %}
            {% assign talk_year = talk.date | date: "%Y" %}
            {% if talk_year != current_year %}
              {% assign current_year = talk_year %}
              <tr class="year-header" id="{{ current_year }}">
                <td colspan="4"><a href="#{{ current_year }}">{{ current_year }}</a></td>
              </tr>
            {% endif %}
            <tr>
              <td class="talk-date-col">{{ talk.date | date: "%-d %b" }}</td>
              <td class="talk-speaker-col">
                {{ talk.speaker }}
                {% if talk.affiliation %}
                  <span class="talk-affiliation">{{ talk.affiliation }}</span>
                {% endif %}
              </td>
              <td class="talk-title-col">
                <em>{{ talk.title }}</em>
                {% if talk.abstract %}
                  <details class="abstract-toggle">
                    <summary>
                      <span class="arrow">&#9654;</span> Abstract
                    </summary>
                    <div class="abstract-content">
                      {{ talk.abstract }}
                    </div>
                  </details>
                {% endif %}
              </td>
              <td class="talk-links-col">
              {% if talk.slides %}
                <a href="{{ talk.slides }}" class="badge badge-warning text-dark border border-warning" target="_blank">Slides</a>
              {% endif %}

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
            </td>
            </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>

  </div>
</div>
