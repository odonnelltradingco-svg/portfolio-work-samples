"""Read-only local HTML reference audit. No remote requests or code execution."""
from __future__ import annotations

import argparse
import json
import posixpath
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

URL_ATTRIBUTES = {'a': 'href', 'link': 'href', 'img': 'src', 'script': 'src', 'iframe': 'src', 'source': 'src'}


class Document(HTMLParser):
    def __init__(self, content: str):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.ids = set()
        self.base_hrefs = []
        self.feed(content)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        if tag == 'base' and attrs.get('href'):
            self.base_hrefs.append(attrs['href'])
        attribute = URL_ATTRIBUTES.get(tag)
        if attribute and attribute in attrs:
            self.references.append({'line': self.getpos()[0], 'tag': tag, 'attribute': attribute, 'url': attrs[attribute] or ''})


def audit(root: Path) -> dict:
    root = root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError('Choose a directory containing a static website.')
    files = {}
    for file in sorted(root.rglob('*')):
        if file.is_symlink():
            raise ValueError('Symlinks are not supported; audit a standalone copy.')
        if file.is_file():
            if len(files) >= 1000:
                raise ValueError('This sample auditor is limited to 1,000 files.')
            files[file.relative_to(root).as_posix()] = file
    documents = {}
    for name, path in files.items():
        if path.suffix.lower() in {'.html', '.htm'}:
            if path.stat().st_size > 2_000_000:
                raise ValueError('HTML files must be smaller than 2 MB.')
            documents[name] = Document(path.read_text(encoding='utf-8-sig'))
    if not documents:
        raise ValueError('No HTML documents found.')
    folded = {}
    for name in files:
        folded.setdefault(name.casefold(), []).append(name)
    rows = []
    for name, document in documents.items():
        for reference in document.references:
            row = {'document': name, **reference, 'status': 'ok', 'target': None, 'detail': ''}
            raw = reference['url']
            try:
                url = urlsplit(raw)
            except ValueError:
                row.update(status='invalid_url', detail='URL could not be parsed.')
                rows.append(row)
                continue
            if document.base_hrefs:
                row.update(status='unsupported_base', detail='A base element changes URL resolution; review manually.')
            elif url.scheme.lower() == 'file' or (len(url.scheme) == 1 and raw[1:2] == ':'):
                row.update(status='local_file', detail='Points to a computer file, not an uploaded website asset.')
            elif url.scheme or url.netloc:
                row.update(status='not_checked', detail='External or special-scheme URL; no request made.')
            elif '\\' in raw:
                row.update(status='backslash', detail='Use URL forward slashes; backslashes are not checked.')
            elif not raw:
                row.update(status='empty', detail='Empty reference; review the intended destination.')
            else:
                decoded = unquote(url.path)
                if '\\' in decoded or '\x00' in decoded:
                    row.update(status='invalid_path', detail='Encoded backslash or null byte is not supported.')
                    rows.append(row)
                    continue
                target = (posixpath.normpath(decoded.lstrip('/')) if decoded.startswith('/') else
                          posixpath.normpath(posixpath.join(posixpath.dirname(name), decoded)) if decoded else name)
                if target == '..' or target.startswith('../'):
                    row.update(status='outside_root', detail='Reference leaves the selected website folder.')
                else:
                    if target == '.' or decoded.endswith('/'):
                        target = posixpath.join('' if target == '.' else target, 'index.html')
                    row['target'] = target
                    if target not in files:
                        matches = folded.get(target.casefold(), [])
                        if matches:
                            row.update(status='case_mismatch', detail='Actual filename: ' + ', '.join(matches))
                        else:
                            row.update(status='missing', detail='Target is not included in this website folder.')
                    elif url.fragment and target in documents and unquote(url.fragment) not in documents[target].ids:
                        row.update(status='missing_fragment', detail='Destination HTML does not contain the requested id.')
                    elif decoded.startswith('/'):
                        row.update(status='root_relative', detail='Resolves at the domain root; review before a subfolder deployment.')
            rows.append(row)
    counts = Counter(row['status'] for row in rows)
    return {
        'html_files': len(documents),
        'references': len(rows),
        'ok': counts.get('ok', 0),
        'not_checked': counts.get('not_checked', 0),
        'needs_review': sum(count for status, count in counts.items() if status not in {'ok', 'not_checked'}),
        'status_counts': dict(sorted(counts.items())),
        'results': rows,
        'scope': 'HTML href/src references and HTML id fragments only. Case-sensitive filenames. No CSS imports, srcset, runtime JavaScript, forms, server routes, external requests or browser rendering checks.',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('folder', type=Path)
    args = parser.parse_args()
    try:
        result = audit(args.folder)
    except (ValueError, OSError, UnicodeError) as error:
        parser.exit(2, f'Audit could not run: {error}\n')
    print(json.dumps(result, indent=2))
    raise SystemExit(1 if result['needs_review'] else 0)
