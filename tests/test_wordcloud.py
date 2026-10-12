import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('generate_wordcloud', ROOT / 'scripts/generate_wordcloud.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class WordCloudTests(unittest.TestCase):
    def test_svg_is_valid_deterministic_and_clickable(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            data, stopwords, output = (folder / name for name in ('talks.yml', 'stopwords.yml', 'cloud.svg'))
            data.write_text('- title: "Bayesian researcher\'s models"\n- speaker: No title yet\n', encoding='utf-8')
            stopwords.write_text('{}', encoding='utf-8')
            generator.generate_svg(data, stopwords, output)
            original = output.read_bytes()
            modified = output.stat().st_mtime_ns
            root = ET.fromstring(original)
            words = root.findall('{http://www.w3.org/2000/svg}text')
            self.assertEqual(root.get('viewBox'), '0 0 800 400')
            self.assertEqual({node.text for node in words}, {'Bayesian', 'researcher', 'models'})
            for node in words:
                handler = node.get('onclick')
                self.assertEqual(json.loads(handler[len('showWordModal('):-1]), node.text)
                self.assertNotIn('fill:', node.get('style'))
            generator.generate_svg(data, stopwords, output)
            self.assertEqual(output.read_bytes(), original)
            self.assertEqual(output.stat().st_mtime_ns, modified)


if __name__ == '__main__':
    unittest.main()
