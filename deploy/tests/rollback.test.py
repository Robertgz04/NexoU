"""Pruebas del despliegue sin tocar Docker ni los servicios reales."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]

DOCKER = '''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
p=Path(os.environ['FAKE_STATE'])
s=json.loads(p.read_text()); a=sys.argv[1:]; mode=os.environ['FAKE_MODE']; code=0
s['commands'].append(a)
if a[0]=='build': code=1 if mode=='build_failure' else 0
elif a[:2]==['container','inspect']: code=0 if a[2] in s['containers'] else 1
elif a[0]=='run': s['containers'].append(a[a.index('--name')+1])
elif a[0]=='exec': code=1 if (mode=='candidate_failure' and a[1]=='nexou-api-candidate') or (mode=='api_failure' and a[1]=='nexou-api') else 0
elif a[0]=='rename': s['containers'].remove(a[1]); s['containers'].append(a[2])
elif a[0]=='rm':
 for name in a[1:]:
  if name in s['containers']: s['containers'].remove(name)
p.write_text(json.dumps(s)); sys.exit(code)
'''

class Deployment(unittest.TestCase):
    def run_case(self, mode):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'deploy').mkdir()
            # El lock de la prueba también está aislado.
            script = (ROOT / 'deploy/start.sh').read_text().replace(
                '/run/lock/nexou-api-deploy.lock', str(root / 'deploy.lock'))
            (root / 'deploy/start.sh').write_text(script)
            tools = root / 'bin'
            tools.mkdir()
            for name, content in {
                'docker': DOCKER,
                'sleep': '#!/bin/sh\nexit 0\n',
                'curl': '#!/bin/sh\nexit 0\n',
            }.items():
                p = tools / name
                p.write_text(content)
                p.chmod(0o755)
            state = root / 'state.json'
            state.write_text(json.dumps({'containers': ['nexou-api'], 'commands': []}))
            result = subprocess.run(['bash', str(root / 'deploy/start.sh')],
                env={**os.environ, 'PATH': str(tools) + ':' + os.environ['PATH'],
                     'FAKE_STATE': str(state), 'FAKE_MODE': mode},
                capture_output=True, text=True)
            return result.returncode, json.loads(state.read_text())

    def test_build_failure_preserves_live_api(self):
        code, state = self.run_case('build_failure')
        self.assertNotEqual(code, 0)
        self.assertEqual(state['containers'], ['nexou-api'])
        self.assertFalse(any(c[0] == 'stop' for c in state['commands']))

    def test_candidate_failure_preserves_live_api(self):
        code, state = self.run_case('candidate_failure')
        self.assertNotEqual(code, 0)
        self.assertEqual(state['containers'], ['nexou-api'])
        self.assertFalse(any(c[0] == 'stop' for c in state['commands']))

    def test_failed_replacement_restores_previous(self):
        code, state = self.run_case('api_failure')
        self.assertNotEqual(code, 0)
        self.assertEqual(state['containers'], ['nexou-api'])
        self.assertIn(['start', 'nexou-api'], state['commands'])

    def test_success_keeps_previous_container(self):
        code, state = self.run_case('success')
        self.assertEqual(code, 0)
        self.assertEqual(set(state['containers']), {'nexou-api', 'nexou-api-previous'})

if __name__ == '__main__':
    unittest.main()
