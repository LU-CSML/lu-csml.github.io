---
layout: default
title: Schedule 2025/26 - CSML
description: View the upcoming schedule for Lancaster University CSML seminar series. See upcoming talks and recent presentations from the 2025/26 academic year.
---

# Schedule 2025/26

Here is the schedule for the 2025/26 academic year.

{% comment %}
Date Comparison Note:
We use string comparison for ISO 8601 dates (YYYY-MM-DD).
This works correctly because ISO 8601 is lexicographically sortable:
"2025-01-15" > "2024-12-31" evaluates to true.
No need for Unix timestamp conversion.
{% endcomment %}

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
