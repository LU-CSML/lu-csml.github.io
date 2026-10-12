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
            original_index = output.with_suffix('.json').read_bytes()
            index_modified = output.with_suffix('.json').stat().st_mtime_ns
            root = ET.fromstring(original)
            words = root.findall('{http://www.w3.org/2000/svg}text')
            self.assertEqual(root.get('viewBox'), '0 0 800 400')
            self.assertEqual({node.text for node in words}, {'Bayesian', 'researcher', 'models'})
            for node in words:
                handler = node.get('onclick')
                self.assertEqual(json.loads(handler[len('showWordModal('):-len(', true)')]), node.text)
                self.assertNotIn('fill:', node.get('style'))
                self.assertEqual(node.get('role'), 'button')
                self.assertEqual(node.get('tabindex'), '0')
                self.assertNotIn('this.click()', node.get('onkeydown'))
                self.assertIn('showWordModal(', node.get('onkeydown'))
            generator.generate_svg(data, stopwords, output)
            self.assertEqual(output.read_bytes(), original)
            self.assertEqual(output.stat().st_mtime_ns, modified)
            self.assertEqual(output.with_suffix('.json').read_bytes(), original_index)
            self.assertEqual(output.with_suffix('.json').stat().st_mtime_ns, index_modified)

    def test_index_covers_short_words_case_and_plurals_across_talks(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            data, stopwords, output = (folder / name for name in ('talks.yml', 'stopwords.yml', 'cloud.svg'))
            data.write_text('- title: "GP model monte carlo"\n- title: "gp models"\n- speaker: No title yet\n', encoding='utf-8')
            stopwords.write_text('{}', encoding='utf-8')
            generator.generate_svg(data, stopwords, output)
            index = json.loads(output.with_suffix('.json').read_text())
            terms = {term['key']: term for term in index['terms']}
            self.assertEqual(terms['gp']['talks'], [0, 1])
            self.assertEqual(terms['model']['talks'], [0, 1])
            self.assertEqual(index['aliases']['models'], 'model')
            self.assertEqual(terms['monte_carlo']['talks'], [0])
            nodes = ET.fromstring(output.read_text()).findall('{http://www.w3.org/2000/svg}text')
            for node in nodes:
                self.assertTrue(terms[node.get('data-topic')]['talks'])
            self.assertNotIn(2, [i for term in terms.values() for i in term['talks']])



if __name__ == '__main__':
    unittest.main()
