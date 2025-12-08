# CSML Reading Group Website

This is the website for the Computational Statistics & Machine Learning (CSML) reading group at Lancaster University.

The site is built with [Jekyll](https://jekyllrb.com/) and hosted on GitHub Pages.

## Adding a New Talk

## Adding a New Talk

All talks are stored in `_data/talks.yml`. To add a new talk, add an entry at the top of the file:

```yaml
- date: 2025-12-15
  speaker: Jane Doe
  affiliation: Cambridge
  title: My Talk Title
```

### Optional Fields

You can include an abstract directly. **Note**: If your abstract contains colons (`:`), wrap the entire abstract in double quotes `"` to avoid errors.

```yaml
- date: 2025-12-15
  speaker: Jane Doe
  title: My Talk Title
  # Single link
  link: https://arxiv.org/abs/2025...
  link_text: arXiv
  # OR Multiple links
  links:
    - url: https://arxiv.org/abs/2025...
      text: Paper 1
    - url: https://github.com/janedoe/code
      text: Code
  abstract: "This is the abstract. If it has a colon: like this, wrap it in quotes."
  slides: https://example.com/slides.pdf
```

## Site Sections

- **Schedule** (`/schedule`): Shows upcoming talks and "Recent Past Talks" (from the current academic year only).
- **Past Talks** (`/talks`): The full archive of all past talks from previous years. Future talks do not appear here.

## Adding Slides

You can upload a PDF to the `pdf/` folder and link it:
`slides: /pdf/your_slides.pdf`

Or simply paste an external URL if hosted elsewhere.

## Local Development

### Prerequisites

1. **Ruby** (version 2.7 or higher) — [Installation guide](https://www.ruby-lang.org/en/documentation/installation/)

   - Windows: Use [RubyInstaller](https://rubyinstaller.org/)
   - macOS: `brew install ruby`
   - Linux: `sudo apt install ruby-full` (Debian/Ubuntu)

2. **Bundler** — Install with: `gem install bundler`

3. **Python Environment** (for Word Cloud generation)

   The site uses a Python script to generate the word cloud. You need to set up a virtual environment:

   ```bash
   # Create virtual environment
   python3 -m venv .venv

   # Install dependencies
   .venv/bin/pip install wordcloud pyyaml
   ```

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
├── talks.md               # Full archive (past talks by year)
├── post/                  # Abstract pages
├── pdf/                   # Slides PDFs
└── css/                   # Stylesheets
```
