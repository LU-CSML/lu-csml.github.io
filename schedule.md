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
    <a class="nav-link {% unless has_upcoming %}active{% endunless %}" id="past-tab" data-toggle="tab" href="#past" role="tab" aria-controls="past" aria-selected="{{ has_upcoming == false }}">Past Talks (This Term)</a>
  </li>
</ul>

<div class="tab-content" id="scheduleTabsContent">
  <div class="tab-pane fade {% if has_upcoming %}show active{% endif %}" id="upcoming" role="tabpanel" aria-labelledby="upcoming-tab">
    {% if has_upcoming %}
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
    {% else %}
      <p class="mt-3 text-muted">No upcoming talks currently scheduled for this term.</p>
    {% endif %}
  </div>
  
  <div class="tab-pane fade {% unless has_upcoming %}show active{% endunless %}" id="past" role="tabpanel" aria-labelledby="past-tab">
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
  </div>
</div>
