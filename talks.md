---
layout: default
title: Past Talks - CSML
---

# Past Talks

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
  <div class="col-md-2 d-none d-md-block">
    <div class="sticky-top pt-3" style="top: 80px; max-height: 90vh; overflow-y: auto;">
      <h5 class="text-secondary mb-3">Years</h5>
      <ul class="nav flex-column">
        {% for year_group in talks_by_year %}
          <li class="nav-item">
            <a class="nav-link pl-0 py-1 text-muted" href="#{{ year_group.name }}">{{ year_group.name }}</a>
          </li>
        {% endfor %}
      </ul>
    </div>
  </div>

  <!-- Main Content -->
  <div class="col-md-10">
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
                   [<a href="{{ talk.slides }}">Slides</a>]
                {% endif %}
                {% if talk.links %}
                  {% for link in talk.links %}
                    [<a href="{{ link.url }}">{{ link.text | default: "Link" }}</a>]
                  {% endfor %}
                {% elsif talk.link %}
                   [<a href="{{ talk.link }}">{{ talk.link_text | default: "Link" }}</a>]
                {% endif %}
              </td>
            </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>

  </div>
</div>
