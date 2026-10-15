"""Combine main's public files and the selected branch's preview files."""
import html
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


def assemble(live, preview, output, branch):
    live, preview, output = map(Path, (live, preview, output))
    if output.exists():
        raise ValueError('Output must not already exist')
    for source in (live, preview):
        if not (source / 'docs/index.html').is_file():
            raise ValueError(f'Missing hosted game: {source}')
    # Preview must never execute an old build that writes production saves.
    if 'pixel-collect-preview' not in (preview / 'docs/index.html').read_text():
        raise ValueError('Preview branch predates isolated saves; update it from current main first')
    shutil.copytree(live / 'docs', output)
    shutil.copytree(preview / 'docs', output / 'preview')
    for source, destination, ref in ((live, output, 'main'), (preview, output / 'preview', branch)):
        sha = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
        (destination / 'build-info.json').write_text(json.dumps({'branch': ref, 'commit': sha}, indent=2) + '\n')
    page = output / 'preview/index.html'
    text = page.read_text()
    badge = '<div role="status" style="padding:12px;text-align:center;background:#4a315f;color:#fff;font:14px system-ui">DEVELOPMENT PREVIEW · ' + html.escape(branch) + ' · Separate test saves · <a style="color:#aaffdf" href="../">Live game</a></div>'
    page.write_text(text.replace('<body>', '<body>' + badge, 1))


if __name__ == '__main__':
    assemble(sys.argv[1], sys.argv[2], sys.argv[3], os.environ.get('PREVIEW_BRANCH', 'develop'))
