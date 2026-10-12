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

Omit the title and abstract until they are supplied; missing titles appear blank in the schedule. An optional `format` field (for example, `format: Online`) appears beneath the title when the format has been confirmed.

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
- **Past Talks** (`/talks`): The full archive of all past talks from previous years.
- **Speakers** (`/speakers`): A list of all speakers and their talks.
- **Our Research** (`/visualizations`): Interactive visualizations of group research topics and collaborations.

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

   The site generates the word cloud during each Jekyll build. Set up Python dependencies before starting the server. On Linux or macOS:

   ```bash
   # Create virtual environment
   python3 -m venv .venv

   # Install dependencies
   .venv/bin/python -m pip install -r scripts/requirements.txt
   ```

   On Windows (PowerShell):

   ```powershell
   py -m venv .venv
   .venv\Scripts\python.exe -m pip install -r scripts/requirements.txt
   ```

   Jekyll checks that a Python executable can import the required packages before using it. To choose another environment, set `WORDCLOUD_PYTHON` to its Python executable (`export WORDCLOUD_PYTHON=/path/to/python` on Linux/macOS, or `$env:WORDCLOUD_PYTHON = "C:\path\to\python.exe"` in PowerShell). If no working Python is available, the build stops with setup instructions instead of publishing a stale map.

### Running Locally

```bash
# Install dependencies (first time only)
bundle install

# Start the development server
bundle exec jekyll serve
```

The site will be available at **http://localhost:4000**.

The server will auto-rebuild when you make changes. Editing `_data/talks.yml`, `_data/stopwords.yml`, or the generator refreshes the word cloud and its `_data/wordcloud.json` lookup index before rendering. The SVG and topic results share the same word normalization. Unrelated edits reuse the existing map, and unchanged SVG content is not rewritten. Press `Ctrl+C` to stop.

## Deployment

Just push to the `master` branch - GitHub Pages will automatically rebuild the site.

## Structure

```
├── _data/
│   └── talks.yml          # All talk data lives here
├── _includes/             # Reusable HTML snippets (headers, rows, etc)
├── _layouts/
│   └── default.html       # Base HTML template
├── _plugins/              # Jekyll plugins (e.g. smart_wordcloud.rb)
├── assets/
│   ├── img/               # Images and logos
│   └── js/                # Custom JavaScript
├── pdf/                   # Slides PDFs
├── scripts/
│   └── generate_wordcloud.py # Word cloud generation script
├── index.md               # Homepage (shows recent 10 talks)
├── schedule.md            # Schedule page
├── speakers.md            # Speakers list page
├── talks.md               # Full archive (past talks by year)
└── visualizations.md      # Research visualization page
```
