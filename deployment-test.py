import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('assemble_pages', Path(__file__).parent / 'scripts/assemble-pages.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DeploymentAssemblyTests(unittest.TestCase):
    def test_separate_sources_and_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('live', 'preview'):
                source = root / name
                (source / 'docs').mkdir(parents=True)
                (source / 'docs/index.html').write_text('<body>' + name + '</body>' + ('<!-- pixel-collect-preview -->' if name == 'preview' else ''))
                subprocess.run(['git', 'init', '-q', str(source)], check=True)
                subprocess.run(['git', '-C', str(source), 'add', 'docs'], check=True)
                subprocess.run(['git', '-C', str(source), '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', name], check=True)
            module.assemble(root / 'live', root / 'preview', root / 'out', 'feat/test<escape>')
            self.assertEqual((root / 'out/index.html').read_text(), '<body>live</body>')
            preview = (root / 'out/preview/index.html').read_text()
            self.assertIn('DEVELOPMENT PREVIEW', preview)
            self.assertIn('feat/test&lt;escape&gt;', preview)
            self.assertIn('preview</body>', preview)
            info = json.loads((root / 'out/preview/build-info.json').read_text())
            self.assertEqual(info['branch'], 'feat/test<escape>')
            self.assertEqual(len(info['commit']), 40)
            with self.assertRaises(ValueError):
                module.assemble(root / 'live', root / 'preview', root / 'out', 'other')
            (root / 'preview/docs/index.html').write_text('<body>unsafe legacy build</body>')
            with self.assertRaisesRegex(ValueError, 'predates isolated saves'):
                module.assemble(root / 'live', root / 'preview', root / 'unsafe-out', 'legacy')


if __name__ == '__main__':
    unittest.main()
