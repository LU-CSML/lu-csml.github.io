---
layout: default
title: All Talks - CSML
---

# Past Talks

{% assign sorted_talks = site.data.talks | sort: "date" | reverse %}
{% assign current_year = "" %}

<div class="year-index mb-4 p-3 bg-light rounded">
  <span class="font-weight-bold mr-2">Jump to year:</span>
  {% assign years = site.data.talks | map: "date" | date: "%Y" | uniq | sort | reverse %}
  {% for year in years %}
    <a href="#{{ year }}" class="badge badge-light border text-danger mr-1 p-2" style="font-size: 0.9em;">{{ year }}</a>
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
