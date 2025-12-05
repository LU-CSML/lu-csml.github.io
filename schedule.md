---
layout: default
title: Schedule 2025/26 - CSML
---

# Schedule 2025/26

Here is the schedule for the 2025/26 academic year.

{% assign current_date = "now" | date: "%Y-%m-%d" %}
{% assign academic_year_start = "2025-08-01" %}

<!-- Sort ascending for Upcoming (Next talk first) -->

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

{% if has_upcoming %}

<h2>Upcoming Talks</h2>
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
      {% for talk in talks_asc %}
        {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
        {% if talk_date >= current_date %}
          <tr>
            <td class="talk-date-col">{{ talk.date | date: "%-d %b %Y" }}</td>
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
        {% endif %}
      {% endfor %}
    </tbody>
  </table>
</div>
{% endif %}

<!-- PAST TALKS SECTION -->
<h2>Past Talks</h2>
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
      {% for talk in talks_desc %}
        {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
        <!-- Logic: Must be after Aug 2025 BUT before Today -->
        {% if talk_date >= academic_year_start and talk_date < current_date %}
          <tr>
            <td class="talk-date-col">{{ talk.date | date: "%-d %b %Y" }}</td>
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
        {% endif %}
      {% endfor %}
    </tbody>
  </table>
</div>
