import yaml
import re
import os
from wordcloud import WordCloud
import matplotlib.pyplot as plt

# Configuration
DATA_FILE = r'c:\Users\liaml\Documents\GitHub\CSML\_data\talks.yml'
OUTPUT_FILE = r'c:\Users\liaml\Documents\GitHub\CSML\assets\img\wordcloud.svg'
WIDTH = 800
HEIGHT = 400

# Stopwords (aligned with the JS version)
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
        # Normalize Monte Carlo
        t_text = re.sub(r'monte\s+carlo', 'monte_carlo', t_text, flags=re.IGNORECASE)
        text += " " + t_text
    return text

def color_func(word, font_size, position, orientation, random_state=None, **kwargs):
    # Retrieve colors from CSS variables at runtime? No, SVG doesn't work that way easily for 'fill'.
    # Instead, we will assign a CLASS to each word, and let CSS handle the color.
    # But wordcloud library doesn't easily support adding classes per word in the generation step.
    # Workaround: Generate purely black/gray map, then post-process SVG to add classes.
    return "rgb(0, 0, 0)" 

def generate_svg():
    talks = load_data()
    text = process_text(talks)
    
    # Generate Word Cloud
    wc = WordCloud(
        width=WIDTH, 
        height=HEIGHT, 
        stopwords=STOPWORDS,
        background_color=None, # Transparent
        mode="RGBA",
        color_func=color_func,
        font_path=None, # Uses default, can be changed
        regexp=r"\w[\w']+",
        max_words=100
    )
    wc.generate(text)
    
    # Get SVG string
    svg_content = wc.to_svg()
    
    # Post-process SVG to make it interactive and theme-able
    
    # 1. Add Styles
    style_block = """
    <style>
        .wc-word {
            fill: var(--text-color, #444);
            transition: all 0.2s ease;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
        }
        [data-theme="dark"] .wc-word {
            fill: var(--text-color, #e0e0e0);
        }
        .wc-word:hover {
            fill: var(--link-color, #b5121b) !important;
            transform: scale(1.1);
            filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.2));
            text-decoration: underline;
        }
    </style>
    """
    
    # Inject style before </svg>
    svg_content = svg_content.replace('</svg>', f'{style_block}</svg>')
    
    # 2. Add classes and interactions to text elements
    # The wordcloud library generates <text ... style="fill: rgb(0,0,0)">WORD</text>
    # We want to replace the hardcoded fill and add class="wc-word" and onclick handler
    
    # Regex to find text tags. 
    # This is a bit brittle but standard for the output of `wordcloud` library.
    
    def replacer(match):
        attributes = match.group(1)
        content = match.group(2)
        # Remove existing inline fill/font-family to let CSS take over (optional, but cleaner)
        # attributes = re.sub(r'fill:[^;]+;', '', attributes)
        
        # Add class and click handler
        # We need to escape the word for the JS function call
        safe_word = content.replace("'", "\\'")
        
        return f'<text {attributes} class="wc-word" onclick="parent.showWordModal(\'{safe_word}\')">{content}</text>'

    # Pattern: <text (attributes)>(content)</text>
    pattern = r'<text ([^>]+)>([^<]+)</text>'
    svg_content = re.sub(pattern, replacer, svg_content)
    
    # 3. Add viewbox if missing (usually wordcloud includes width/height but not viewbox)
    if 'viewBox' not in svg_content:
        svg_content = svg_content.replace(f'width="{WIDTH}"', f'width="100%" viewBox="0 0 {WIDTH} {HEIGHT}"')
        
    
    # Write to file
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_svg()
