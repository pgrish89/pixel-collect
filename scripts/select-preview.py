"""Select an existing development branch and republish the stable preview URL."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import quote


def select(branch):
    gh = shutil.which('gh') or str(Path.home() / '.local/bin/gh')
    repo = 'pgrish89/pixel-collect'
    subprocess.run(['git', 'check-ref-format', '--branch', branch], check=True, capture_output=True)
    subprocess.run([gh, 'api', f'repos/{repo}/branches/{quote(branch, safe="")}'], check=True, capture_output=True)
    # Pages initially only allows deployments from main; allow this selected branch too.
    endpoint = f'repos/{repo}/environments/github-pages/deployment-branch-policies'
    policies = json.loads(subprocess.check_output([gh, 'api', endpoint], text=True))['branch_policies']
    if not any(policy['name'] == branch and policy['type'] == 'branch' for policy in policies):
        subprocess.run([gh, 'api', '--method', 'POST', endpoint, '-f', f'name={branch}', '-f', 'type=branch'], check=True, capture_output=True)
    policies = json.loads(subprocess.check_output([gh, 'api', endpoint], text=True))['branch_policies']
    if not any(policy['name'] == branch and policy['type'] == 'branch' for policy in policies):
        raise RuntimeError('Preview deployment permission verification failed')
    subprocess.run([gh, 'variable', 'set', 'PREVIEW_BRANCH', '--repo', repo, '--body', branch], check=True)
    result = json.loads(subprocess.check_output([gh, 'api', f'repos/{repo}/actions/variables/PREVIEW_BRANCH'], text=True))
    if result['value'] != branch:
        raise RuntimeError('Preview branch verification failed')
    subprocess.run([gh, 'workflow', 'run', 'pages.yml', '--repo', repo, '--ref', 'main'], check=True)
    print(f'Preview branch selected: {branch}. Deployment requested; verify the Actions run before claiming it is live.')
    print('https://pgrish89.github.io/pixel-collect/preview/')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/select-preview.py BRANCH_NAME')
    select(sys.argv[1])
