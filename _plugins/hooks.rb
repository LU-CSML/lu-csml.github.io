
Jekyll::Hooks.register :site, :after_init do |site|
  puts "   [WordCloud] Generating SVG word cloud..."
  
  # Check for Python executable in common locations (cross-platform)
  python_executable = nil
  candidates = [
    ".venv/Scripts/python.exe",  # Windows venv
    ".venv/bin/python",          # Unix venv
    "python3",                   # System python3
    "python"                     # Fallback
  ]
  
  candidates.each do |candidate|
    if File.exist?(candidate) || system(candidate, "--version", :out => File::NULL, :err => File::NULL)
      python_executable = candidate
      break
    end
  end

  if python_executable.nil?
    puts "   [WordCloud] Error: Python not found."
  elsif system(python_executable, "scripts/generate_wordcloud.py")
    puts "   [WordCloud] Success! Updated _includes/wordcloud.svg"
  else
    puts "   [WordCloud] Error: Python script failed."
  end
end
