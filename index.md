---
layout: default
title: CSML
---

# Lancaster University CSML

Lancaster University CSML is a weekly seminar organized by the Lancaster [computational statistics section](https://www.lancaster.ac.uk/maths/research/statistics/bayesian-and-computational-statistics/) to discuss research from all areas of Computational Statistics, Machine Learning, and related fields.

We host talks by invited external speakers, as well as discussion meetings by contributing internal speakers.

**We usually meet at 15:00 GMT on Thursdays.**

A full list of past talks [can be found here](/talks).

## Recent & Upcoming Talks

{% assign sorted_talks = site.data.talks | sort: "date" | reverse %}
{% for talk in sorted_talks limit:10 %}

<div class="talk">
  <span class="talk-date">{{ talk.date | date: "%-d %B %Y" }}</span><br>
  <span class="talk-speaker">{{ talk.speaker }}</span>{% if talk.affiliation %} <span class="talk-affiliation">({{ talk.affiliation }})</span>{% endif %}<br>
  <em>{{ talk.title }}</em>{% if talk.link %} [<a href="{{ talk.link }}">{{ talk.link_text | default: "Link" }}</a>]{% endif %}
</div>
{% endfor %}

---

The main organizer for the 2025-2026 academic year is **Liam Llamazares** (l[dot]llamazares[at]lancaster).
