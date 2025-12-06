
Jekyll::Hooks.register :site, :after_init do |site|
  puts "   [WordCloud] Generating SVG word cloud..."
  
  # Check if python is available
  if system("python --version") || system("python3 --version")
    # Run the script
    # We use full path or relative to root (pwd is usually site root)
    if system("python scripts/generate_wordcloud.py")
      puts "   [WordCloud] Success! Updated _includes/wordcloud.svg"
    else
      puts "   [WordCloud] Error: Python script failed."
    end
  else
     puts "   [WordCloud] Warning: Python not found. Skipping word cloud generation."
  end
end
