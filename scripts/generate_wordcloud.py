"""
Word Cloud Generator for CSML Website

Generates an SVG word cloud from talk data for the Jekyll static site.
Run from project root: python scripts/generate_wordcloud.py
"""

import argparse
import os
import random
import re
from typing import Any, Callable

import yaml
from wordcloud import WordCloud

# Derive paths relative to project structure
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Default paths (can be overridden via CLI)
DEFAULT_DATA_FILE = os.path.join(PROJECT_ROOT, '_data', 'talks.yml')
DEFAULT_STOPWORDS_FILE = os.path.join(PROJECT_ROOT, '_data', 'stopwords.yml')
DEFAULT_OUTPUT_FILE = os.path.join(PROJECT_ROOT, '_includes', 'wordcloud.svg')

# Dimensions
WIDTH = 800
HEIGHT = 400

# Palette
COLOR_RED = "#b5121b"
COLOR_GREY_DARK = "#333333"
COLOR_GREY_LIGHT = "#555555"


def load_stopwords(stopwords_file: str) -> set[str]:
    """Load stopwords from YAML file (single source of truth)."""
    with open(stopwords_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    # Combine english and academic stopwords
    stopwords: set[str] = set()
    stopwords.update(data.get('english', []))
    stopwords.update(data.get('academic', []))
    return stopwords


def load_talks(data_file: str) -> list[dict[str, Any]]:
    """Load talk data from YAML file."""
    with open(data_file, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def process_text(talks: list[dict[str, Any]]) -> str:
    """
    Extract and preprocess text from talk titles and abstracts.
    
    Uses list accumulation + join() for O(N) string building
    instead of += which is O(N²) due to string immutability.
    """
    text_parts: list[str] = []
    
    for talk in talks:
        t_text = f"{talk.get('title', '')} {talk.get('abstract', '')}"
        # Preserve "monte carlo" as single token
        t_text = re.sub(r'monte\s+carlo', 'monte_carlo', t_text, flags=re.IGNORECASE)
        t_text = t_text.replace('&', 'and')
        text_parts.append(t_text)
    
    return " ".join(text_parts)


def color_func(
    word: str, 
    font_size: int, 
    position: tuple[int, int], 
    orientation: int, 
    random_state: Any = None, 
    **kwargs: Any
) -> str:
    """Color function for word cloud - returns Lancaster red/grey palette."""
    choices = [COLOR_RED, COLOR_RED, COLOR_GREY_DARK, COLOR_GREY_DARK, COLOR_GREY_LIGHT]
    return random.choice(choices)


def generate_svg(
    data_file: str, 
    stopwords_file: str, 
    output_file: str,
    font_path: str | None = None
) -> None:
    """Generate SVG word cloud and save to output file."""
    # Load data
    stopwords = load_stopwords(stopwords_file)
    talks = load_talks(data_file)
    text = process_text(talks)
    
    # Cross-platform font fallback (Windows → Linux → macOS → None)
    if font_path is None:
        font_candidates = [
            r'C:\Windows\Fonts\arial.ttf',                           # Windows
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',       # Linux (Debian/Ubuntu)
            '/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf',  # Linux (Fedora/RHEL)
            '/System/Library/Fonts/Helvetica.ttc',                   # macOS
        ]
        for candidate in font_candidates:
            if os.path.exists(candidate):
                font_path = candidate
                break
    
    wc = WordCloud(
        width=WIDTH, 
        height=HEIGHT, 
        stopwords=stopwords,
        background_color=None,
        mode="RGBA",
        color_func=color_func,
        font_path=font_path,
        regexp=r"\w[\w']+",
        max_words=100,
        margin=15,
        min_font_size=12,
        collocations=False  
    )
    wc.generate(text)
    svg_content = wc.to_svg()
    
    # Strip XML header for safe inline embedding (robust handling)
    try:
        svg_content = re.sub(r'<\?xml.*?>', '', svg_content)
        svg_content = re.sub(r'<!DOCTYPE.*?>', '', svg_content)
    except Exception as e:
        print(f"Warning: XML header stripping failed. SVG might contain duplicate headers. Error: {e}")
    
    # CSS for theming and interactivity
    style_block = """
    <style>
        :root {
            --wc-red: #b5121b;
            --wc-grey: #333333;
            --wc-hover-shadow: rgba(181, 18, 27, 0.4);
        }
        
        [data-theme="dark"] {
            --wc-red: #ff8a80;
            --wc-grey: #e0e0e0;
            --wc-hover-shadow: rgba(255, 138, 128, 0.4);
        }
        
        .wc-word {
            transition: all 0.2s ease;
            cursor: pointer !important;
            font-family: 'Outfit', sans-serif;
            opacity: 0.9;
        }

        .wc-red { fill: var(--wc-red); }
        .wc-grey { fill: var(--wc-grey); }

        .wc-word:hover {
            opacity: 1;
            filter: drop-shadow(0px 2px 4px var(--wc-hover-shadow));
        }
    </style>
    """
    
    svg_content = svg_content.replace('</svg>', f'{style_block}</svg>')

    def replacer(match: re.Match[str]) -> str:
        """Replace text elements with interactive, styled versions."""
        attributes = match.group(1)
        content = match.group(2)
        safe_word = content.replace("'", "\\'")
        
        css_class = "wc-word wc-grey"
        if COLOR_RED in attributes:
            css_class = "wc-word wc-red"
        
        # Strip existing fill
        attributes = re.sub(r'fill:[^;]+;', '', attributes)
        
        return f'<text {attributes} class="{css_class}" style="cursor: pointer; pointer-events: all;" onclick="showWordModal(\'{safe_word}\')">{content}</text>'

    pattern = r'<text ([^>]+)>([^<]+)</text>'
    svg_content = re.sub(pattern, replacer, svg_content)
    
    # Add viewBox for responsive scaling
    if 'viewBox' not in svg_content:
        svg_content = svg_content.replace(
            f'width="{WIDTH}"', 
            f'width="100%" viewBox="0 0 {WIDTH} {HEIGHT}"'
        )

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Generated {output_file}")


def main() -> None:
    """CLI entry point with argument parsing."""
    parser = argparse.ArgumentParser(
        description='Generate word cloud SVG from talk data'
    )
    parser.add_argument(
        '--data', '-d',
        default=DEFAULT_DATA_FILE,
        help=f'Path to talks YAML file (default: {DEFAULT_DATA_FILE})'
    )
    parser.add_argument(
        '--stopwords', '-s',
        default=DEFAULT_STOPWORDS_FILE,
        help=f'Path to stopwords YAML file (default: {DEFAULT_STOPWORDS_FILE})'
    )
    parser.add_argument(
        '--output', '-o',
        default=DEFAULT_OUTPUT_FILE,
        help=f'Path for output SVG (default: {DEFAULT_OUTPUT_FILE})'
    )
    parser.add_argument(
        '--font', '-f',
        default=None,
        help='Path to font file (optional, defaults to Arial on Windows)'
    )
    
    args = parser.parse_args()
    
    generate_svg(
        data_file=args.data,
        stopwords_file=args.stopwords,
        output_file=args.output,
        font_path=args.font
    )


if __name__ == "__main__":
    main()
