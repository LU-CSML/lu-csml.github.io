require "digest"
require "open3"

module CSMLWordCloud
  def self.generate(site)
    source = site.source
    inputs = ["_data/talks.yml", "_data/stopwords.yml", "scripts/generate_wordcloud.py", "scripts/requirements.txt"]
    digest = Digest::SHA256.new
    inputs.each do |path|
      digest.update(File.binread(File.join(source, path)))
    end
    fingerprint = digest.hexdigest
    output = File.join(source, "_includes", "wordcloud.svg")
    index = File.join(source, "_data", "wordcloud.json")
    return if site.instance_variable_get(:@wordcloud_fingerprint) == fingerprint && File.exist?(output) && File.exist?(index)

    configured_python = ENV["WORDCLOUD_PYTHON"]
    candidates = if configured_python && !configured_python.empty?
      [configured_python]
    else
      [File.join(source, ".venv", "Scripts", "python.exe"),
       File.join(source, ".venv", "bin", "python"), "python3", "py", "python"]
    end
    python = candidates.find do |candidate|
      system(candidate, "-c", "import yaml, wordcloud, matplotlib", out: File::NULL, err: File::NULL)
    end
    unless python
      raise Jekyll::Errors::FatalException, "Word cloud requires Python with scripts/requirements.txt installed. Set WORDCLOUD_PYTHON to that Python executable if needed."
    end

    Jekyll.logger.info "WordCloud:", "Generating SVG from talk data..."
    stdout, stderr, status = Open3.capture3(python, File.join(source, "scripts", "generate_wordcloud.py"),
      "--data", File.join(source, "_data", "talks.yml"),
      "--stopwords", File.join(source, "_data", "stopwords.yml"), "--output", output, "--index", index)
    unless status.success?
      raise Jekyll::Errors::FatalException, "Word cloud generation failed:\n#{stdout}#{stderr}"
    end
    site.instance_variable_set(:@wordcloud_fingerprint, fingerprint)
    Jekyll.logger.info "WordCloud:", "SVG ready."
  end
end

# Runs before reading source files on both the first build and serve rebuilds.
Jekyll::Hooks.register :site, :after_reset do |site|
  CSMLWordCloud.generate(site)
end
