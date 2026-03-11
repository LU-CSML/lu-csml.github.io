
Jekyll::Hooks.register :site, :after_init do |site|
  puts "   [WordCloud] Generating SVG word cloud..."
  
  # Check if python is available
  python_executable = "python"
  if File.exist?(".venv/bin/python")
    python_executable = ".venv/bin/python"
  elsif File.exist?(".venv/Scripts/python.exe")
    python_executable = ".venv/Scripts/python.exe"
  elsif system("python3 --version", :out => File::NULL, :err => File::NULL)
    python_executable = "python3"
  elsif system("py --version", :out => File::NULL, :err => File::NULL)
    python_executable = "py"
  end

  if system("#{python_executable} scripts/generate_wordcloud.py")
    puts "   [WordCloud] Success! Updated _includes/wordcloud.svg"
  else
    puts "   [WordCloud] Error: Python script failed."
  end
end
