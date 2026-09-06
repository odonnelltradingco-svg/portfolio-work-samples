from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import json
import unittest
from urllib.error import HTTPError
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen

from audit import audit

HERE = Path(__file__).parent
CHANGES = {
    'Assets/site.css': 'assets/site.css',
    'file:///C:/sample/mark.svg': 'assets/mark.svg',
    'details.htm#delivery': 'details.html#delivery',
}
MIMES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml'}


@contextmanager
def strict_host(folder):
    """Exact URL-key lookup prevents Windows from masking case mismatches."""
    files = {p.relative_to(folder).as_posix(): p.read_bytes() for p in folder.rglob('*') if p.is_file()}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            key = path.removeprefix('/client-preview/').lstrip('/') if path.startswith('/client-preview/') else path.lstrip('/')
            if not key:
                key = 'index.html'
            if key not in files:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header('Content-Type', MIMES[Path(key).suffix])
            self.send_header('Content-Length', str(len(files[key])))
            self.end_headers()
            self.wfile.write(files[key])

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    worker = Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}'
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=3)


def verify_http():
    result = audit(HERE / 'fixed')
    requests = []
    with strict_host(HERE / 'fixed') as origin:
        for prefix in ['/', '/client-preview/']:
            targets = [origin + prefix]
            for row in result['results']:
                targets.append(urljoin(origin + prefix + row['document'], row['url']))
            for target in targets:
                with urlopen(target, timeout=5) as response:
                    body = response.read()
                    path = urlsplit(target).path
                    suffix = Path(path).suffix if not path.endswith('/') else '.html'
                    assert response.status == 200
                    assert response.headers['Content-Type'] == MIMES[suffix]
                    assert body
                    requests.append({'path': path, 'status': response.status, 'content_type': response.headers['Content-Type']})
        try:
            urlopen(origin + '/Assets/site.css', timeout=5)
        except HTTPError as error:
            assert error.code == 404
            wrong_case = error.code
            error.close()
        else:
            raise AssertionError('Test host must reject incorrect case even on Windows.')
    return {'successful_requests': len(requests), 'prefixes': ['/', '/client-preview/'], 'incorrect_case_status': wrong_case, 'requests': requests}


class RepairTests(unittest.TestCase):
    def test_three_planted_problems_and_every_fixed_reference(self):
        before, fixed = audit(HERE / 'before'), audit(HERE / 'fixed')
        self.assertEqual(before['status_counts'], {'case_mismatch': 1, 'local_file': 1, 'missing': 1, 'ok': 5})
        self.assertEqual((fixed['html_files'], fixed['references'], fixed['ok'], fixed['needs_review']), (2, 8, 8, 0))
        self.assertEqual([r['line'] for r in before['results'] if r['status'] != 'ok'], [7, 11, 19])

    def test_only_three_references_change_and_other_files_stay_identical(self):
        before = (HERE / 'before/index.html').read_text(encoding='utf-8')
        expected = before
        for old, new in CHANGES.items():
            self.assertEqual(expected.count(old), 1)
            expected = expected.replace(old, new)
        self.assertEqual(expected, (HERE / 'fixed/index.html').read_text(encoding='utf-8'))
        for name in ['details.html', 'assets/site.css', 'assets/mark.svg']:
            self.assertEqual((HERE / 'before' / name).read_bytes(), (HERE / 'fixed' / name).read_bytes())

    def test_fixed_site_resolves_over_http_at_root_and_subfolder(self):
        verified = verify_http()
        self.assertEqual(verified['successful_requests'], 18)
        self.assertEqual(verified['incorrect_case_status'], 404)

    def test_query_fragments_external_and_outside_paths_are_not_silently_passed(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'assets').mkdir()
            (root / 'assets/theme file.css').write_text('body{}', encoding='utf-8')
            (root / 'index.html').write_text('<div id="ready"></div><a href="#ready">Good</a><a href="#missing">Bad</a><link href="assets/theme%20file.css?v=2"><a href="../outside.html">Outside</a><a href="https://example.invalid/">External</a><link href="/assets/theme%20file.css">', encoding='utf-8')
            self.assertEqual(audit(root)['status_counts'], {'missing_fragment': 1, 'not_checked': 1, 'ok': 2, 'outside_root': 1, 'root_relative': 1})

    def test_base_element_requires_manual_review(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'index.html').write_text('<base href="/other/"><a href="index.html">Home</a>', encoding='utf-8')
            self.assertEqual(audit(root)['status_counts'], {'unsupported_base': 1})


if __name__ == '__main__':
    unittest.main()
