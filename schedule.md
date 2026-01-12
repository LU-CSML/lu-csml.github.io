---
layout: default
title: Schedule - CSML
description: View the upcoming schedule for Lancaster University CSML seminar series. See upcoming talks and recent presentations.
---

{% assign current_year = "now" | date: "%Y" | plus: 0 %}
{% assign current_month = "now" | date: "%m" | plus: 0 %}
{% if current_month >= 8 %}{% assign academic_year = current_year %}{% else %}{% assign academic_year = current_year | minus: 1 %}{% endif %}
{% assign next_year = academic_year | plus: 1 %}
{% assign academic_year_start = academic_year | append: "-08-01" %}
{% assign current_date = "now" | date: "%Y-%m-%d" %}

# Schedule {{ academic_year }}/{{ next_year | slice: 2, 2 }}

Here is the schedule for the {{ academic_year }}/{{ next_year | slice: 2, 2 }} academic year.

<!-- Sort talks -->

{% assign talks_asc = site.data.talks | sort: "date" %}

<!-- Sort descending for Past (Recent talk first) -->

{% assign talks_desc = site.data.talks | sort: "date" | reverse %}

<!-- UPCOMING TALKS SECTION -->

{% assign has_upcoming = false %}
{% for talk in talks_asc %}
{% assign talk_date = talk.date | date: "%Y-%m-%d" %}
{% if talk_date >= current_date %}
{% assign has_upcoming = true %}
{% break %}
{% endif %}
{% endfor %}

<ul class="nav nav-tabs mb-3" id="scheduleTabs" role="tablist">
  <li class="nav-item">
    <a class="nav-link {% if has_upcoming %}active{% endif %}" id="upcoming-tab" data-toggle="tab" href="#upcoming" role="tab" aria-controls="upcoming" aria-selected="{{ has_upcoming }}">Upcoming Talks</a>
  </li>
  <li class="nav-item">
    <a class="nav-link {% unless has_upcoming %}active{% endunless %}" id="past-tab" data-toggle="tab" href="#past" role="tab" aria-controls="past" aria-selected="{% unless has_upcoming %}true{% else %}false{% endunless %}">Past Talks (This Term)</a>
  </li>
</ul>

<div class="tab-content" id="scheduleTabsContent">

  <div class="tab-pane fade {% if has_upcoming %}show active{% endif %}" id="upcoming" role="tabpanel" aria-labelledby="upcoming-tab">
    {% if has_upcoming %}
      
      {% assign has_michaelmas = false %}
      {% assign has_lent = false %}
      {% assign has_summer = false %}
      
      <!-- Pre-calculate terms -->
      {% for talk in talks_asc %}
        {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
        {% if talk_date >= current_date %}
          {% assign m = talk.date | date: "%m" | plus: 0 %}
          {% if m >= 8 and m <= 12 %}
            {% assign has_michaelmas = true %}
          {% elsif m >= 1 and m <= 4 %}
            {% assign has_lent = true %}
          {% else %}
            {% assign has_summer = true %}
          {% endif %}
        {% endif %}
      {% endfor %}

      <div class="d-flex justify-content-between align-items-center mb-3">
        {% assign upcoming_term_count = 0 %}
        {% if has_michaelmas %}{% assign upcoming_term_count = upcoming_term_count | plus: 1 %}{% endif %}
        {% if has_lent %}{% assign upcoming_term_count = upcoming_term_count | plus: 1 %}{% endif %}
        {% if has_summer %}{% assign upcoming_term_count = upcoming_term_count | plus: 1 %}{% endif %}

        <ul class="nav nav-pills mb-0" id="termTabs" role="tablist">
          <li class="nav-item">
            <a class="nav-link active" id="all-terms-tab" data-toggle="pill" href="#all-terms" role="tab" aria-controls="all-terms" aria-selected="true">All Terms</a>
          </li>

          {% if upcoming_term_count > 1 %}
            {% if has_michaelmas %}
              <li class="nav-item">
                <a class="nav-link" id="michaelmas-tab" data-toggle="pill" href="#michaelmas" role="tab" aria-controls="michaelmas" aria-selected="false">Michaelmas Term</a>
              </li>
            {% endif %}

            {% if has_lent %}
              <li class="nav-item">
                <a class="nav-link" id="lent-tab" data-toggle="pill" href="#lent" role="tab" aria-controls="lent" aria-selected="false">Lent Term</a>
              </li>
            {% endif %}

            {% if has_summer %}
              <li class="nav-item">
                <a class="nav-link" id="summer-tab" data-toggle="pill" href="#summer" role="tab" aria-controls="summer" aria-selected="false">Summer Term</a>
              </li>
            {% endif %}
          {% endif %}
        </ul>

        <div class="form-inline">
          <input class="form-control" type="text" id="upcomingSearch" placeholder="Search upcoming talks..." aria-label="Search">
        </div>
      </div>

      <div class="tab-content" id="termTabsContent">

        <!-- All Terms Pane (Default) -->
        <div class="tab-pane fade show active" id="all-terms" role="tabpanel" aria-labelledby="all-terms-tab">
          {% assign previous_term = "" %}

          {% for talk in talks_asc %}
            {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
            {% if talk_date >= current_date %}

              {% assign m = talk.date | date: "%m" | plus: 0 %}
              {% if m >= 8 and m <= 12 %}
                {% assign current_term = "Michaelmas Term" %}
              {% elsif m >= 1 and m <= 4 %}
                {% assign current_term = "Lent Term" %}
              {% else %}
                {% assign current_term = "Summer Term" %}
              {% endif %}

              {% if current_term != previous_term %}
                {% if previous_term != "" %}
                  </tbody></table></div>
                {% endif %}

                <h3 class="mt-4 term-header">{{ current_term }}</h3>
                <div class="table-responsive term-table-container">
                <table class="talk-table">
                  {% include talk_table_header.html %}
                  <tbody>
                {% assign previous_term = current_term %}
              {% endif %}

              {% include talk_row.html talk=talk %}
            {% endif %}
          {% endfor %}

          {% if previous_term != "" %}
            </tbody></table></div>
          {% endif %}
        </div>

        {% if has_michaelmas %}
          <div class="tab-pane fade" id="michaelmas" role="tabpanel" aria-labelledby="michaelmas-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_asc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% if m >= 8 and m <= 12 %}
                        {% include talk_row.html talk=talk %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}

        {% if has_lent %}
          <div class="tab-pane fade" id="lent" role="tabpanel" aria-labelledby="lent-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_asc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% if m >= 1 and m <= 4 %}
                        {% include talk_row.html talk=talk %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}

        {% if has_summer %}
          <div class="tab-pane fade" id="summer" role="tabpanel" aria-labelledby="summer-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_asc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% unless m >= 1 and m <= 4 or m >= 8 and m <= 12 %}
                         {% include talk_row.html talk=talk %}
                      {% endunless %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}
      </div>

    {% else %}
      <p class="mt-3 text-muted">No upcoming talks currently scheduled for this term.</p>
    {% endif %}

  </div>
  
  <div class="tab-pane fade {% unless has_upcoming %}show active{% endunless %}" id="past" role="tabpanel" aria-labelledby="past-tab">
    
    {% assign has_past_michaelmas = false %}
    {% assign has_past_lent = false %}
    {% assign has_past_summer = false %}
    
    <!-- Pre-calculate terms for Past Talks -->
    {% for talk in talks_desc %}
      {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
      {% if talk_date >= academic_year_start and talk_date < current_date %}
        {% assign m = talk.date | date: "%m" | plus: 0 %}
        {% if m >= 8 and m <= 12 %}
          {% assign has_past_michaelmas = true %}
        {% elsif m >= 1 and m <= 4 %}
          {% assign has_past_lent = true %}
        {% else %}
          {% assign has_past_summer = true %}
        {% endif %}
      {% endif %}
    {% endfor %}

    <div class="d-flex justify-content-between align-items-center mb-3">
        {% assign past_term_count = 0 %}
        {% if has_past_michaelmas %}{% assign past_term_count = past_term_count | plus: 1 %}{% endif %}
        {% if has_past_lent %}{% assign past_term_count = past_term_count | plus: 1 %}{% endif %}
        {% if has_past_summer %}{% assign past_term_count = past_term_count | plus: 1 %}{% endif %}

        <ul class="nav nav-pills mb-0" id="pastTermTabs" role="tablist">
          <li class="nav-item">
            <a class="nav-link active" id="past-all-terms-tab" data-toggle="pill" href="#past-all-terms" role="tab" aria-controls="past-all-terms" aria-selected="true">All Terms</a>
          </li>

          {% if past_term_count > 1 %}
            {% if has_past_summer %}
              <li class="nav-item">
                <a class="nav-link" id="past-summer-tab" data-toggle="pill" href="#past-summer" role="tab" aria-controls="past-summer" aria-selected="false">Summer Term</a>
              </li>
            {% endif %}

            {% if has_past_lent %}
              <li class="nav-item">
                <a class="nav-link" id="past-lent-tab" data-toggle="pill" href="#past-lent" role="tab" aria-controls="past-lent" aria-selected="false">Lent Term</a>
              </li>
            {% endif %}

            {% if has_past_michaelmas %}
              <li class="nav-item">
                <a class="nav-link" id="past-michaelmas-tab" data-toggle="pill" href="#past-michaelmas" role="tab" aria-controls="past-michaelmas" aria-selected="false">Michaelmas Term</a>
              </li>
            {% endif %}
          {% endif %}
        </ul>

        <div class="form-inline">
            <input class="form-control" type="text" id="pastSearch" placeholder="Search past talks..." aria-label="Search">
        </div>
    </div>

    <div class="tab-content" id="pastTermTabsContent">

        <!-- Past All Terms Pane (Default) -->
        <div class="tab-pane fade show active" id="past-all-terms" role="tabpanel" aria-labelledby="past-all-terms-tab">
          {% assign previous_term = "" %}

          {% for talk in talks_desc %}
            {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
            {% if talk_date >= academic_year_start and talk_date < current_date %}

              {% assign m = talk.date | date: "%m" | plus: 0 %}
              {% if m >= 8 and m <= 12 %}
                {% assign current_term = "Michaelmas Term" %}
              {% elsif m >= 1 and m <= 4 %}
                {% assign current_term = "Lent Term" %}
              {% else %}
                {% assign current_term = "Summer Term" %}
              {% endif %}

              {% if current_term != previous_term %}
                {% if previous_term != "" %}
                  </tbody></table></div>
                {% endif %}

                <h3 class="mt-4 term-header">{{ current_term }}</h3>
                <div class="table-responsive term-table-container">
                <table class="talk-table">
                  {% include talk_table_header.html %}
                  <tbody>
                {% assign previous_term = current_term %}
              {% endif %}

              {% include talk_row.html talk=talk %}
            {% endif %}
          {% endfor %}

          {% if previous_term != "" %}
            </tbody></table></div>
          {% endif %}
        </div>

        {% if has_past_summer %}
          <div class="tab-pane fade" id="past-summer" role="tabpanel" aria-labelledby="past-summer-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_desc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= academic_year_start and talk_date < current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% unless m >= 1 and m <= 4 or m >= 8 and m <= 12 %}
                        {% include talk_row.html talk=talk %}
                      {% endunless %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}

        {% if has_past_lent %}
          <div class="tab-pane fade" id="past-lent" role="tabpanel" aria-labelledby="past-lent-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_desc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= academic_year_start and talk_date < current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% if m >= 1 and m <= 4 %}
                        {% include talk_row.html talk=talk %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}

        {% if has_past_michaelmas %}
          <div class="tab-pane fade" id="past-michaelmas" role="tabpanel" aria-labelledby="past-michaelmas-tab">
            <div class="table-responsive">
              <table class="talk-table">
                {% include talk_table_header.html %}
                <tbody>
                  {% for talk in talks_desc %}
                    {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
                    {% if talk_date >= academic_year_start and talk_date < current_date %}
                      {% assign m = talk.date | date: "%m" | plus: 0 %}
                      {% if m >= 8 and m <= 12 %}
                        {% include talk_row.html talk=talk %}
                      {% endif %}
                    {% endif %}
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        {% endif %}

    </div>

  </div>
</div>

<script>
    function setupSearch(inputId, containerSelector, headerSelector = null) {
        var input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('keyup', function() {
            var searchTerm = this.value.toLowerCase();
            
            // Scope rows to the specific container to avoid cross-filtering
            var container = document.querySelector(containerSelector);
            if (!container) return;
            
            var rows = container.querySelectorAll('.talk-table tbody tr');
            
            // Filter rows
            rows.forEach(function(row) {
                var text = row.textContent.toLowerCase();
                if(text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });

            // Optional: Handle Headers (specifically for 'All Terms' view in Upcoming/Past)
            if (headerSelector) {
                var headerContainers = document.querySelectorAll(headerSelector);
                headerContainers.forEach(function(tableContainer) {
                    var visibleRows = tableContainer.querySelectorAll('tbody tr:not([style*="display: none"])').length;
                    var header = tableContainer.previousElementSibling;
                    
                    if (visibleRows > 0) {
                        if (header && header.classList.contains('term-header')) {
                            header.style.display = '';
                        }
                        tableContainer.style.display = '';
                    } else {
                        if (header && header.classList.contains('term-header')) {
                             header.style.display = 'none';
                        }
                        tableContainer.style.display = 'none';
                    }
                });
            }
        });
    }

    // Setup filtering for Upcoming Talks
    setupSearch('upcomingSearch', '#termTabsContent', '#all-terms .term-table-container');

    // Setup filtering for Past Talks
    setupSearch('pastSearch', '#pastTermTabsContent', '#past-all-terms .term-table-container');
</script>
