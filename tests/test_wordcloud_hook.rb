require "jekyll"
require "tmpdir"
require "fileutils"
require_relative "../_plugins/hooks"

# Temporary fixtures have no virtual environment; use the project's interpreter.
local_python = File.expand_path("../.venv/bin/python", __dir__)
if !ENV["WORDCLOUD_PYTHON"] && File.exist?(local_python)
  ENV["WORDCLOUD_PYTHON"] = local_python
end

class WordCloudHookTest
  def assert_includes(text, expected)
    raise "Missing #{expected.inspect}" unless text.include?(expected)
  end

  def assert_equal(expected, actual)
    raise "Expected #{expected.inspect}, got #{actual.inspect}" unless expected == actual
  end

  def assert_raises(exception)
    begin
      yield
    rescue exception => error
      return error
    end
    raise "Expected #{exception}"
  end

  def test_rebuild_updates_map_before_rendering_and_ignores_unchanged_inputs
    Dir.mktmpdir("csml-wordcloud") do |source|
      FileUtils.mkdir_p(["_data", "_includes", "scripts"].map { |path| File.join(source, path) })
      ["scripts/generate_wordcloud.py", "scripts/requirements.txt"].each do |path|
        FileUtils.cp(File.expand_path("../#{path}", __dir__), File.join(source, path))
      end
      data = File.join(source, "_data", "talks.yml")
      output = File.join(source, "_includes", "wordcloud.svg")
      File.write(data, "- title: alphawave\n")
      File.write(File.join(source, "_data", "stopwords.yml"), "{}")
      File.write(File.join(source, "index.html"), "---\n---\n{% include wordcloud.svg %}")
      site = Jekyll::Site.new(Jekyll.configuration("source" => source, "destination" => File.join(source, "_site"), "plugins_dir" => []))
      # Generation must use the configured source, not the working directory.
      Dir.chdir(Dir.tmpdir) { site.process }
      assert_includes File.read(output), "alphawave"
      File.write(data, "- title: alphawave\n- title: betawave\n")
      site.process
      assert_includes File.read(File.join(source, "_site", "index.html")), "betawave"
      modified = File.mtime(output)
      site.process
      assert_equal modified, File.mtime(output)
    end
  end

  def test_missing_dependencies_stop_build_with_setup_instructions
    previous = ENV["WORDCLOUD_PYTHON"]
    ENV["WORDCLOUD_PYTHON"] = "/nonexistent/csml-python"
    error = assert_raises(Jekyll::Errors::FatalException) do
      Jekyll::Site.new(Jekyll.configuration("source" => File.expand_path("..", __dir__)))
    end
    assert_includes error.message, "scripts/requirements.txt"
  ensure
    ENV["WORDCLOUD_PYTHON"] = previous
  end
end

checks = WordCloudHookTest.new
checks.test_rebuild_updates_map_before_rendering_and_ignores_unchanged_inputs
checks.test_missing_dependencies_stop_build_with_setup_instructions
puts "Word cloud hook checks passed."
