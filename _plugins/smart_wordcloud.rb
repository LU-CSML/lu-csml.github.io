module Jekyll
  class SmartWordCloudTag < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
    end

    def render(context)
      site = context.registers[:site]
      svg_path = File.join(site.source, "_includes", "wordcloud.svg")
      
      if File.exist?(svg_path)
        # return the SVG content
        # We can simulate an include, or just read the file
        File.read(svg_path)
      else
        # Return fallback HTML
        <<~HTML
          <div id="canvas-container" class="mb-5 zhadow" style="width: 100%; height: 400px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color); position: relative;">
            <canvas id="word_cloud" style="width: 100%; height: 100%;"></canvas>
            <div id="fallback-message" class="text-muted small p-2" style="position:absolute; bottom:0; width:100%;">
               Generating Word Cloud client-side...
            </div>
          </div>
        HTML
      end
    end
  end
end

Liquid::Template.register_tag('smart_wordcloud', Jekyll::SmartWordCloudTag)
