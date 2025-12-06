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
          {% include talk_row.html talk=talk %}
        {% endif %}
      {% endfor %}
    </tbody>
  </table>
</div>
{% endif %}

<!-- PAST TALKS SECTION -->
<h2>Past talks this term</h2>
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
          {% include talk_row.html talk=talk %}
        {% endif %}
      {% endfor %}
    </tbody>
  </table>
</div>
