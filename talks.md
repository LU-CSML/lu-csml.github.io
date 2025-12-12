---
layout: default
title: Past Talks - CSML
description: Browse our archive of past CSML seminar talks from 2007 to present. Search by speaker, title, or abstract to find research presentations.
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
    
    // Rows and Headers
    var rows = document.querySelectorAll('.talk-table tbody tr');
    var yearHeaders = document.querySelectorAll('.year-header');

    // ============================================
    // SCROLL SPY FOR YEAR NAVIGATION  
    // ============================================
    var yearLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    // Create an intersection observer to detect visible year sections
    var observerOptions = {
      root: null,
      rootMargin: '0px',  // Trigger when any part is visible
      threshold: 0.01     // Trigger as soon as 1% is visible
    };

    var activeYear = null;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var yearId = entry.target.id;
          
          if (yearId && yearId !== activeYear) {
            activeYear = yearId;
            
            // Remove active styling from all year links
            yearLinks.forEach(function(link) {
              link.style.color = '';
              link.style.fontWeight = '';
            });
            
            // Add active styling to current year
            var activeLink = document.querySelector('.nav-link[href="#' + yearId + '"]');
            
            if (activeLink) {
              activeLink.style.color = '#dc143c'; // Bright crimson red
              activeLink.style.fontWeight = '800'; // Extra bold
            }
          }
        }
      });
    }, observerOptions);

    // Observe all year header sections
    yearHeaders.forEach(function(header) {
      observer.observe(header);
    });

    function filterTalks(query) {
      query = query.trim();
      
      if (!query) {
        // Show all
        rows.forEach(r => r.style.display = '');
        yearHeaders.forEach(h => h.style.display = '');
        document.getElementById('no-results-message')?.remove();
        return;
      }
      
      // Hide all year headers initially
      yearHeaders.forEach(el => el.style.display = 'none');
      
      // Simple case-insensitive matching (includes partial matches)
      var lowerQuery = query.toLowerCase();
      var visibleCount = 0;
      var visibleYears = new Set(); // Track which years have visible talks

      rows.forEach(function(row) {
        if (row.classList.contains('year-header')) return;
        // Skip abstract rows - they follow their parent talk row
        if (row.classList.contains('abstract-row')) return;

        var text = row.textContent.toLowerCase();
        
        // Find the next sibling abstract row if it exists
        var nextRow = row.nextElementSibling;
        var abstractRow = (nextRow && nextRow.classList.contains('abstract-row')) ? nextRow : null;
        
        if (text.includes(lowerQuery)) {
          row.style.display = '';
          if (abstractRow) abstractRow.style.display = '';
          visibleCount++;
          
          // Track this year as having visible talks
          var yearAttr = row.getAttribute('data-year');
          if (yearAttr) visibleYears.add(yearAttr);
        } else {
          row.style.display = 'none';
          if (abstractRow) abstractRow.style.display = 'none';
        }
      });
      
      // Show year headers for years with visible talks
      yearHeaders.forEach(function(header) {
        var headerYear = header.getAttribute('data-year-header');
        if (headerYear && visibleYears.has(headerYear)) {
          header.style.display = '';
        }
      });
      
      // Show "no results" message if needed
      var existingMsg = document.getElementById('no-results-message');
      if (visibleCount === 0 && !existingMsg) {
        var noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-results-message';
        noResultsMsg.className = 'alert alert-warning mt-3';
        noResultsMsg.innerHTML = '<strong>No results found.</strong> Try a different search term.';
        document.querySelector('.talk-table').parentNode.insertBefore(noResultsMsg, document.querySelector('.talk-table'));
      } else if (visibleCount > 0 && existingMsg) {
        existingMsg.remove();
      }
    }

    // 1. Check URL Params
    var urlParams = new URLSearchParams(window.location.search);
    var qParam = urlParams.get('q');

    if (qParam) {
      var decoded = decodeURIComponent(qParam).trim();
      searchInput.value = decoded;
      filterTalks(decoded);
    }

    // 2. Listen for Input
    searchInput.addEventListener('keyup', function() {
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
  <div class="col-md-1 d-none d-md-block" style="max-width: 70px;" role="navigation" aria-label="Year navigation">
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
              <tr class="year-header" id="{{ current_year }}" data-year-header="{{ current_year }}">
                <td colspan="4"><a href="#{{ current_year }}">{{ current_year }}</a></td>
              </tr>
            {% endif %}
            {% include talk_row.html talk=talk year=talk_year %}
          {% endfor %}
        </tbody>
      </table>
    </div>

  </div>
</div>
