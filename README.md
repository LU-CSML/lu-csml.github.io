# CSML Reading Group Website

This is the website for the Computational Statistics & Machine Learning (CSML) reading group at Lancaster University.

The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub Pages.

## Adding a New Talk

All talks are stored in `_data/talks.yml`. To add a new talk, add an entry at the top of the file:

```yaml
- date: 2025-12-15
  speaker: Jane Doe
  affiliation: Cambridge
  title: My Talk Title
```

### Optional Fields

You can also include:

```yaml
- date: 2025-12-15
  speaker: Jane Doe
  affiliation: Cambridge
  title: My Talk Title
  abstract: doe2025 # Links to post/doe2025/
  slides: /pdf/doe_slides.pdf # Links to pdf/doe_slides.pdf
  link: https://arxiv.org/... # External link (e.g., arXiv)
  link_text: arXiv # Text for the external link
```

## Adding an Abstract

1. Create a folder in `post/` with a short identifier, e.g., `post/doe2025/`
2. Add an `index.html` file with the abstract content
3. Reference it in `talks.yml` using `abstract: doe2025`

## Adding Slides

1. Upload the PDF to the `pdf/` folder
2. Reference it in `talks.yml` using `slides: /pdf/your_slides.pdf`

## Local Development

### Prerequisites

1. **Ruby** (version 2.7 or higher) — [Installation guide](https://www.ruby-lang.org/en/documentation/installation/)

   - Windows: Use [RubyInstaller](https://rubyinstaller.org/)
   - macOS: `brew install ruby`
   - Linux: `sudo apt install ruby-full` (Debian/Ubuntu)

2. **Bundler** — Install with: `gem install bundler`

### Running Locally

```bash
# Install dependencies (first time only)
bundle install

# Start the development server
bundle exec jekyll serve
```

The site will be available at **http://localhost:4000**.

The server will auto-rebuild when you make changes. Press `Ctrl+C` to stop.

## Deployment

Just push to the `main` branch - GitHub Pages will automatically rebuild the site.

## Structure

```
├── _data/
│   └── talks.yml          # All talk data lives here
├── _layouts/
│   └── default.html       # Base HTML template
├── index.md               # Homepage (shows recent 10 talks)
├── talks.md               # Full archive (all talks by year)
├── post/                  # Abstract pages
├── pdf/                   # Slides PDFs
└── css/                   # Stylesheets
```
