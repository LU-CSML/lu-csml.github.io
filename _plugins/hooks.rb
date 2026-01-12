
Jekyll::Hooks.register :site, :after_init do |site|
  puts "   [WordCloud] Generating SVG word cloud..."
  
  # Check if python is available
  python_executable = "python"
  if File.exist?(".venv/bin/python")
    python_executable = ".venv/bin/python"
  elsif system("python3 --version", :out => File::NULL)
    python_executable = "python3"
  end

  if system("#{python_executable} scripts/generate_wordcloud.py")
    puts "   [WordCloud] Success! Updated _includes/wordcloud.svg"
  else
    puts "   [WordCloud] Error: Python script failed."
  end
end
