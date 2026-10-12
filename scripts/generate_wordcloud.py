"""
Word Cloud Generator

Generates an SVG word cloud from talk data for the CSML Jekyll site.
"""

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Set, Tuple, Optional

import yaml
from wordcloud import WordCloud
from wordcloud.tokenization import process_tokens

from matplotlib import font_manager
from pathlib import Path

# Path configuration
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent

DEFAULT_DATA_FILE = PROJECT_ROOT / '_data' / 'talks.yml'
DEFAULT_STOPWORDS_FILE = PROJECT_ROOT / '_data' / 'stopwords.yml'
DEFAULT_OUTPUT_FILE = PROJECT_ROOT / '_includes' / 'wordcloud.svg'
DEFAULT_INDEX_FILE = PROJECT_ROOT / '_data' / 'wordcloud.json'

# Visualization Constants
WIDTH = 800
HEIGHT = 400
COLOR_RED = "#b5121b"
COLOR_GREY_DARK = "#333333"
COLOR_GREY_LIGHT = "#555555"


def load_stopwords(stopwords_file: Path) -> Set[str]:
    """Load stopwords from YAML configuration."""
    if not stopwords_file.exists():
        return set()

    with open(stopwords_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}
    
    stopwords = set()
    stopwords.update(data.get('english', []))
    stopwords.update(data.get('academic', []))
    return stopwords


def load_talks(data_file: Path) -> List[Dict[str, Any]]:
    """Load talk data from YAML."""
    if not data_file.exists():
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
        content = f"{talk.get('title') or ''} {talk.get('abstract') or ''}"
        
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
    return random_state.choice(pallet)


def generate_svg(
    data_file: Path, 
    stopwords_file: Path, 
    output_file: Path,
    font_path: Optional[str] = None,
    index_file: Optional[Path] = None
) -> None:
    """Main generation logic."""
    stopwords = load_stopwords(stopwords_file)
    talks = load_talks(data_file)
    text = process_text(talks)
    
    if not text.strip():
        raise ValueError("No text found in talks data.")
    
    # Matplotlib ships this font on all supported platforms.
    if font_path is None:
        font_path = font_manager.findfont(font_manager.FontProperties(family="DejaVu Sans"), fallback_to_default=False)

    wc = WordCloud(
        width=WIDTH, 
        height=HEIGHT, 
        stopwords=stopwords,
        background_color=None,
        mode="RGBA",
        color_func=color_func,
        font_path=font_path,
        regexp=r"\w[\w']+",
        max_words=38,
        max_font_size=106,
        margin=16,
        min_font_size=14,
        prefer_horizontal=1,
        relative_scaling=0.25,
        normalize_plurals=False,
        random_state=42,
        collocations=False
    )
    
    # Use the same normalization for the cloud and every word-to-talk lookup.
    raw_counts = wc.process_text(text)
    words = [word for word, count in raw_counts.items() for _ in range(count)]
    counts, standard_forms = process_tokens(words, normalize_plurals=True)
    terms = {word.lower(): {"word": word, "key": word.lower(), "mentions": count, "talks": []}
             for word, count in counts.items()}
    for index, talk in enumerate(talks):
        keys = {standard_forms[word.lower()].lower() for word in wc.process_text(process_text([talk]))}
        for key in keys:
            terms[key]["talks"].append(index)
    topic_index = {"terms": sorted(terms.values(), key=lambda term: -term["mentions"]),
                   "aliases": {word: canonical.lower() for word, canonical in standard_forms.items()}}
    wc.generate_from_frequencies(counts)
    raw_svg = wc.to_svg(embed_font=True)
    
    # Edit the XML tree so namespaces, attributes, and click handlers are escaped once.
    namespace = "http://www.w3.org/2000/svg"
    ET.register_namespace("", namespace)
    root = ET.fromstring(raw_svg)
    root.set("width", "100%")
    root.set("height", "auto")
    root.set("viewBox", f"0 0 {WIDTH} {HEIGHT}")

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
    
    root.append(ET.fromstring(style_block))
    for node in root.findall(f"{{{namespace}}}text"):
        style = node.get("style", "")
        css_class = "wc-word wc-red" if COLOR_RED in style else "wc-word wc-grey"
        node.set("class", css_class)
        # Class-based colors allow theme changes; retain other inline styles.
        style = re.sub(r"(?:^|;)\s*fill:[^;]*(?:;|$)", ";", style)
        node.set("style", style.strip(";") + ";cursor: pointer; pointer-events: all;")
        word = node.text or ''
        node.set("onclick", f"showWordModal({json.dumps(word, ensure_ascii=False)}, true)")
        node.set("data-topic", word.lower())
        node.set("tabindex", "0")
        node.set("role", "button")
        node.set("aria-label", f"Show talks about {word.replace('_', ' ')}")
        node.set("onkeydown", f"if(event.key==='Enter'||event.key===' '){{event.preventDefault();showWordModal({json.dumps(word, ensure_ascii=False)}, true)}}")
        node.text = word.replace('_', ' ')

    svg_content = ET.tostring(root, encoding="unicode")
    # Validate the final result, including styles and handlers.
    ET.fromstring(svg_content)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    if not output_file.exists() or output_file.read_text(encoding="utf-8") != svg_content:
        output_file.write_text(svg_content, encoding="utf-8")

    index_file = index_file or output_file.with_suffix(".json")
    index_file.parent.mkdir(parents=True, exist_ok=True)
    index_content = json.dumps(topic_index, ensure_ascii=False, indent=2) + "\n"
    if not index_file.exists() or index_file.read_text(encoding="utf-8") != index_content:
        index_file.write_text(index_content, encoding="utf-8")
    print(f"Generated wordcloud at {output_file} and topic index at {index_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate word cloud SVG for CSML site')
    parser.add_argument('--data', '-d', default=DEFAULT_DATA_FILE, help='Path to talks.yml')
    parser.add_argument('--stopwords', '-s', default=DEFAULT_STOPWORDS_FILE, help='Path to stopwords.yml')
    parser.add_argument('--output', '-o', default=DEFAULT_OUTPUT_FILE, help='Output path for SVG')
    parser.add_argument('--index', default=DEFAULT_INDEX_FILE, help='Output path for word-to-talk index')
    parser.add_argument('--font', '-f', default=None, help='Custom font path')
    
    args = parser.parse_args()
    
    try:
        generate_svg(
            data_file=Path(args.data),
            stopwords_file=Path(args.stopwords),
            output_file=Path(args.output),
            font_path=args.font,
            index_file=Path(args.index)
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
