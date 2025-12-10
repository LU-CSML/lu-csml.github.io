---
layout: default
title: CSML
description: Lancaster University CSML weekly seminar series. Explore our schedule, past talks, speakers, and interactive visualizations of research topics.
---

<div id="hero-canvas-container" style="position: relative; width: 100%; height: 250px; margin-bottom: 2rem;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; width: 100%;">
    <h1 style="color: #333; text-shadow: 0 0 20px rgba(255,255,255,0.8); margin: 0;">Lancaster University CSML</h1>
  </div>
</div>
<script src="{{ '/assets/js/hero_animation.js' | relative_url }}"></script>

[Lancaster University](https://www.lancaster.ac.uk) CSML is a weekly seminar organized by the Lancaster [Computational Statistics section](https://www.lancaster.ac.uk/maths/research/statistics/bayesian-and-computational-statistics/) to discuss research from all areas of Computational Statistics, Machine Learning, and related fields. We provide a platform for our members to share their research and ideas, and we host talks by invited external speakers.

**We meet at 15:00 - 16:00 GMT on Thursdays** at the <a href="https://use.mazemap.com/#v=1&center=-2.784180,54.008594&zoom=18&campusid=341&zlevel=1&sharepoitype=poi&sharepoi=1002612354" target="_blank">Postgraduate Statistics Centre (PSC), Lecture Theatre</a>.

{% assign current_year = "now" | date: "%Y" | plus: 0 %}
{% assign current_month = "now" | date: "%m" | plus: 0 %}
{% if current_month >= 8 %}{% assign academic_year = current_year %}{% else %}{% assign academic_year = current_year | minus: 1 %}{% endif %}
{% assign next_year = academic_year | plus: 1 %}

### [View {{ academic_year }}/{{ next_year | slice: 2, 2 }} Schedule](/schedule)

---

### Join Us!

We regularly host lunches with external speakers. This is an excellent opportunity for informal discussion in a relaxed setting. To join the group for lunch or schedule a brief meeting with a visiting speaker, please contact the organizer [Liam Llamazares](https://liamllamazareselias.com). All are welcome!

Check out our [interactive visualizations](/visualizations) to explore our research and contribute a session to grow our research and join our community. We are happy to receive speaker suggestions and contributions.

---

### Explore our Archives

<div class="row mt-3">
  <div class="col-md-6 mb-3">
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">Past Talks</h5>
        <p class="card-text">Browse our archive of past seminars.</p>
        <a href="{{ '/talks' | relative_url }}" class="btn btn-outline-info">View Archive</a>
      </div>
    </div>
  </div>
  <div class="col-md-6 mb-3">
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">Speakers</h5>
        <p class="card-text">See our wonderful past speakers.</p>
        <a href="{{ '/speakers' | relative_url }}" class="btn btn-outline-info">View Speakers</a>
      </div>
    </div>
  </div>
</div>

---
