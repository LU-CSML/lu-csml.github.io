import yaml
import re
import os
import random
from wordcloud import WordCloud

# Configuration
# Output to _includes to allow Jekyll {% include %}
DATA_FILE = r'c:\Users\liaml\Documents\GitHub\CSML\_data\talks.yml'
OUTPUT_FILE = r'c:\Users\liaml\Documents\GitHub\CSML\_includes\wordcloud.svg'
WIDTH = 800
HEIGHT = 400

# Palette
COLOR_RED = "#b5121b"
COLOR_GREY_DARK = "#333333"
COLOR_GREY_LIGHT = "#555555"

# Stopwords
STOPWORDS = {
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "will", "can", "us", 
  "abstract", "talk", "speaker", "title", "university", "lancaster", "statistics", "proposed", "novel", "methods", "method", "paper", "presentation", "introduction", "using", "based", "new", "problem", "approach", "results", "analysis", "data", "model", "models", "inference", "also", "use", "work", "show", "applications", "framework", "properties", "point", "general", "particular", "several", "study", "different", "provide", "via", "well", "within", "towards", "first", "two", "one", "propose", "consider", "time", "algorithm", "algorithms", "however", "often", "example", "large", "set", "number", "case", "function", "functions", "given", "known", "include", "used", "many", "discuss", "present", "demonstrate", "illustrate", "apply", "focus", "terms"
}

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def process_text(talks):
    text = ""
    for talk in talks:
        t_text = f"{talk.get('title', '')} {talk.get('abstract', '')}"
        t_text = re.sub(r'monte\s+carlo', 'monte_carlo', t_text, flags=re.IGNORECASE)
        t_text = t_text.replace('&', 'and')
        text += " " + t_text
    return text

def color_func(word, font_size, position, orientation, random_state=None, **kwargs):
    choices = [COLOR_RED, COLOR_RED, COLOR_GREY_DARK, COLOR_GREY_DARK, COLOR_GREY_LIGHT]
    return random.choice(choices)

def generate_svg():
    talks = load_data()
    text = process_text(talks)
    
    wc = WordCloud(
        width=WIDTH, 
        height=HEIGHT, 
        stopwords=STOPWORDS,
        background_color=None,
        mode="RGBA",
        color_func=color_func,
        font_path=r'C:\Windows\Fonts\arial.ttf', # Use Arial for generation to match sans-serif metrics better
        regexp=r"\w[\w']+",
        max_words=65,       # Increased back up slightly
        margin=30,          # Increased margin again
        min_font_size=10,
        collocations=False  
    )
    wc.generate(text)
    svg_content = wc.to_svg()
    
    # Strip XML header to make it safe for inline embedding
    svg_content = re.sub(r'<\?xml.*?>', '', svg_content)
    svg_content = re.sub(r'<!DOCTYPE.*?>', '', svg_content)
    
    # === CSS Overhaul ===
    style_block = """
    <style>
        :root {
            --wc-red: #b5121b;
            --wc-grey: #333333;
            --wc-hover-shadow: rgba(181, 18, 27, 0.4);
        }
        
        /* Inline SVG inherits CSS variables naturally! */
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
            /* Removed text-decoration: underline */
        }
    </style>
    """
    
    svg_content = svg_content.replace('</svg>', f'{style_block}</svg>')
    
    # No JS theme sync needed for inline SVG!

    def replacer(match):
        attributes = match.group(1)
        content = match.group(2)
        safe_word = content.replace("'", "\\'")
        
        css_class = "wc-word wc-grey"
        if COLOR_RED in attributes:
            css_class = "wc-word wc-red"
        
        # Strip existing fill
        attributes = re.sub(r'fill:[^;]+;', '', attributes)
        
        # Direct call to showWordModal since it is in same scope
        return f'<text {attributes} class="{css_class}" style="cursor: pointer; pointer-events: all;" onclick="showWordModal(\'{safe_word}\')">{content}</text>'

    pattern = r'<text ([^>]+)>([^<]+)</text>'
    svg_content = re.sub(pattern, replacer, svg_content)
    
    if 'viewBox' not in svg_content:
        svg_content = svg_content.replace(f'width="{WIDTH}"', f'width="100%" viewBox="0 0 {WIDTH} {HEIGHT}"')

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_svg()
