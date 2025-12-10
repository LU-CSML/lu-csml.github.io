"""
Word Cloud Generator

Generates an SVG word cloud from talk data for the CSML Jekyll site.
"""

import argparse
import os
import random
import re
import sys
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Set, Tuple, Optional

import yaml
from wordcloud import WordCloud

# Path configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

DEFAULT_DATA_FILE = os.path.join(PROJECT_ROOT, '_data', 'talks.yml')
DEFAULT_STOPWORDS_FILE = os.path.join(PROJECT_ROOT, '_data', 'stopwords.yml')
DEFAULT_OUTPUT_FILE = os.path.join(PROJECT_ROOT, '_includes', 'wordcloud.svg')

# Visualization Constants
WIDTH = 800
HEIGHT = 400
COLOR_RED = "#b5121b"
COLOR_GREY_DARK = "#333333"
COLOR_GREY_LIGHT = "#555555"


def load_stopwords(stopwords_file: str) -> Set[str]:
    """Load stopwords from YAML configuration."""
    if not os.path.exists(stopwords_file):
        return set()

    with open(stopwords_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}
    
    stopwords = set()
    stopwords.update(data.get('english', []))
    stopwords.update(data.get('academic', []))
    return stopwords


def load_talks(data_file: str) -> List[Dict[str, Any]]:
    """Load talk data from YAML."""
    if not os.path.exists(data_file):
        raise FileNotFoundError(f"Data file not found: {data_file}")

    with open(data_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    if not isinstance(data, list):
        raise ValueError(f"Expected list in {data_file}, got {type(data)}")
    
    return data


def process_text(talks: List[Dict[str, Any]]) -> str:
    """Extract and normalize text from titles and abstracts."""
    text_parts: List[str] = []
    
    for talk in talks:
        # Combine title and abstract
        content = f"{talk.get('title', '')} {talk.get('abstract', '')}"
        
        # Token normalization
        content = re.sub(r'monte\s+carlo', 'monte_carlo', content, flags=re.IGNORECASE)
        content = content.replace('&', 'and')
        
        text_parts.append(content)
    
    return " ".join(text_parts)


def color_func(
    word: str, 
    font_size: int, 
    position: Tuple[int, int], 
    orientation: int, 
    random_state: Any = None, 
    **kwargs: Any
) -> str:
    """Custom color function determining word color."""
    pallet = [COLOR_RED, COLOR_RED, COLOR_GREY_DARK, COLOR_GREY_DARK, COLOR_GREY_LIGHT]
    return random.choice(pallet)


def sanitize_svg(svg_content: str) -> str:
    """
    Parse and re-serialize SVG to ensure it is valid and header-free.
    This ensures safe inline embedding.
    """
    try:
        # Register namespaces to prevent 'ns0' prefixes if possible, 
        # though WordCloud usually produces simple SVG.
        ET.register_namespace("", "http://www.w3.org/2000/svg")
        
        root = ET.fromstring(svg_content)
        
        # Ensure correct namespace if missing (sometimes happens with fragments)
        if 'xmlns' not in root.attrib:
            root.attrib['xmlns'] = "http://www.w3.org/2000/svg"
            
        # Serialize without XML declaration
        clean_svg = ET.tostring(root, encoding='unicode', method='xml')
        return clean_svg
    except ET.ParseError as e:
        print(f"Warning: SVG parsing failed ({e}). Falling back to raw regex stripping.", file=sys.stderr)
        # Fallback to simple stripping if strictly necessary
        s = re.sub(r'<\?xml.*?>', '', svg_content)
        s = re.sub(r'<!DOCTYPE.*?>', '', s)
        return s


def generate_svg(
    data_file: str, 
    stopwords_file: str, 
    output_file: str,
    font_path: Optional[str] = None
) -> None:
    """Main generation logic."""
    stopwords = load_stopwords(stopwords_file)
    talks = load_talks(data_file)
    text = process_text(talks)
    
    if not text.strip():
        raise ValueError("No text found in talks data.")
    
    # Resolve font path if not provided
    if font_path is None:
        candidates = [
            r'C:\Windows\Fonts\arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
        ]
        for c in candidates:
            if os.path.exists(c):
                font_path = c
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
        max_words=150,
        margin=12,
        min_font_size=12,
        collocations=False  
    )
    
    wc.generate(text)
    raw_svg = wc.to_svg()
    
    # Robust Sanitization using XML parser
    svg_content = sanitize_svg(raw_svg)
    
    # Inject CSS styles for interactivity
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
    
    # Insert Style block before closing tag
    if '</svg>' in svg_content:
        svg_content = svg_content.replace('</svg>', f'{style_block}</svg>')
    else:
        svg_content += style_block

    # Post-process for interactivity (add onclick)
    # Using regex here because we are injecting non-standard JS attributes 
    # and classes that might be tedious to build via ElementTree for every node.
    def replacer(match: re.Match) -> str:
        attrs = match.group(1)
        content = match.group(2)
        safe_word = content.replace("'", "\\'")
        
        css_class = "wc-word wc-red" if COLOR_RED in attrs else "wc-word wc-grey"
        attrs = re.sub(r'fill:[^;]+;', '', attrs) # Remove hardcoded fill
        
        return (f'<text {attrs} class="{css_class}" '
                f'style="cursor: pointer; pointer-events: all;" '
                f'onclick="showWordModal(\'{safe_word}\')">{content}</text>')

    svg_content = re.sub(r'<text ([^>]+)>([^<]+)</text>', replacer, svg_content)
    
    # Ensure viewBox for responsiveness
    if 'viewBox' not in svg_content:
        svg_content = svg_content.replace(
            f'width="{WIDTH}"', 
            f'width="100%" viewBox="0 0 {WIDTH} {HEIGHT}"'
        )

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Generated wordcloud at {output_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate word cloud SVG for CSML site')
    parser.add_argument('--data', '-d', default=DEFAULT_DATA_FILE, help='Path to talks.yml')
    parser.add_argument('--stopwords', '-s', default=DEFAULT_STOPWORDS_FILE, help='Path to stopwords.yml')
    parser.add_argument('--output', '-o', default=DEFAULT_OUTPUT_FILE, help='Output path for SVG')
    parser.add_argument('--font', '-f', default=None, help='Custom font path')
    
    args = parser.parse_args()
    
    try:
        generate_svg(
            data_file=args.data,
            stopwords_file=args.stopwords,
            output_file=args.output,
            font_path=args.font
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
