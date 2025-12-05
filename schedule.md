---
layout: default
title: Schedule 2025/26 - CSML
---

# Schedule 2025/26

Here is the schedule for the 2025/26 academic year.

{% assign current_date = "now" | date: "%Y-%m-%d" %}
{% assign academic_year_start = "2025-08-01" %}
{% assign sorted_talks = site.data.talks | sort: "date" %}

<div class="table-responsive">
  <table class="talk-table">
    <thead>
      <tr>
        <th class="talk-date-col">Date</th>
        <th class="talk-speaker-col">Speaker</th>
        <th class="talk-title-col">Title</th>
      </tr>
    </thead>
    <tbody>
      {% for talk in sorted_talks %}
        {% assign talk_date = talk.date | date: "%Y-%m-%d" %}
        {% if talk_date >= academic_year_start %}
          <tr>
            <td class="talk-date-col">{{ talk.date | date: "%-d %b %Y" }}</td>
            <td class="talk-speaker-col">
              {{ talk.speaker }}
              {% if talk.affiliation %}
                <span class="talk-affiliation">{{ talk.affiliation }}</span>
              {% endif %}
            </td>
            <td class="talk-title-col">
              {% if talk.slides %}
                <a href="{{ talk.slides }}">{{ talk.title }}</a>
              {% elsif talk.link %}
                <a href="{{ talk.link }}">{{ talk.title }}</a>
              {% else %}
                {{ talk.title }}
              {% endif %}
              
              {% if talk.slides and talk.link %}
                 [<a href="{{ talk.link }}">{{ talk.link_text | default: "Link" }}</a>]
              {% elsif talk.link and talk.slides == nil %}
                 [<a href="{{ talk.link }}">{{ talk.link_text | default: "Link" }}</a>]
              {% endif %}
            </td>
          </tr>
        {% endif %}
      {% endfor %}
    </tbody>
  </table>
</div>
