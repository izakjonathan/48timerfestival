"""Capture public festival pages and localize their same-origin static assets."""
import concurrent.futures
import json
import pathlib
import re
import subprocess
from urllib.parse import urljoin, urlsplit

from lxml import html

ROOT = pathlib.Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.48timerfestival.dk'
PATHS = ('', 'program/', 'galleri/', 'kort/', 'om-festivalen/', 'pressekit/',
         'kontakt-og-information/', 'bliv-partner/', 'bliv-frivillig/',
         'bliv-aktoer/', 'bliv-en-del-af-festivalen/', 'bliv-frivillig/fotograf-team/',
         'bliv-frivillig/pr-kommunikation/', 'bliv-frivillig/teknikservice/')
ASSET = re.compile(r'''(?:https?://(?:www\.)?48timerfestival\.dk)?/(?:wp-content|wp-includes)/[^\s"'<>),;\\]+''')
CSS_URL = re.compile(r'''url\(\s*(['"]?)([^'")]+)\1\s*\)''')

def fetch(url):
    return subprocess.check_output(['curl', '-fsSL', '--retry', '1', '--max-time', '35', url])

def localize(source, assets):
    def replace(match):
        path = urlsplit(match.group()).path
        assets.add(path)
        return '/festival-assets' + path
    return ASSET.sub(replace, source)

def page(path):
    url = ORIGIN + '/en/' + path
    doc = html.document_fromstring(fetch(url))
    assets = set()
    fields = {}
    # Keep the original markup and CSS hooks for responsive layouts and galleries.
    selector = '//body//*[self::h1 or self::h2 or self::h3 or self::h4 or self::p or self::a or self::img]'
    for el in doc.xpath(selector):
        kind = 'image' if el.tag == 'img' else 'link' if el.tag == 'a' else 'text'
        value = el.get('src', '') if kind == 'image' else (el.text or '').strip()
        if not value or (kind != 'image' and len(el)):
            continue
        key = str(len(fields))
        el.set('data-edit-key', key)
        fields[key] = {'kind': kind, 'value': value, 'href': el.get('href', ''), 'label': el.get('alt') or el.tag.upper()}
    for el in doc.xpath('//*[@href]'):
        href = el.get('href')
        if href.startswith(ORIGIN + '/en/') and urlsplit(href).path.removeprefix('/en/') in PATHS:
            el.set('href', href.removeprefix(ORIGIN))
            if el.get('data-edit-key'):
                fields[el.get('data-edit-key')]['href'] = el.get('href')
    for el in doc.xpath('//link[@rel="canonical"] | //link[@rel="shortlink"] | //link[contains(@href,"wp-json")]'):
        el.drop_tree()
    for el in doc.xpath('//script[contains(@id,"trp-dynamic-translator")]'):
        el.drop_tree()
    source = localize(html.tostring(doc, encoding='unicode', doctype='<!doctype html>'), assets)
    for field in fields.values():
        field['value'] = localize(field['value'], assets) if field['kind'] == 'image' else field['value']
    return '/en/' + path, {'html': source, 'fields': fields}, assets

def asset(path):
    url = ORIGIN + path
    target = ROOT / 'public' / 'festival-assets' / path.lstrip('/')
    refs = set()
    try:
        data = fetch(url)
    except subprocess.CalledProcessError:
        return path, refs
    if target.suffix == '.css':
        source = data.decode('utf-8', errors='replace')
        def replace(match):
            value = match[2].strip()
            if value.startswith(('data:', '#')):
                return match[0]
            absolute = urljoin(url, value)
            parts = urlsplit(absolute)
            if parts.hostname not in ('www.48timerfestival.dk', '48timerfestival.dk'):
                return match[0]
            refs.add(parts.path)
            return 'url("/festival-assets' + parts.path + (('#' + parts.fragment) if parts.fragment else '') + '")'
        data = CSS_URL.sub(replace, source).encode()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return None, refs

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    pages = {}
    pending = set()
    for route, record, assets in pool.map(page, PATHS):
        pages[route] = record
        pending.update(assets)
    (ROOT / 'content' / 'pages.json').write_text(json.dumps(pages, ensure_ascii=False))
    seen = set()
    missing = []
    while pending:
        batch = sorted(pending - seen)
        seen.update(batch)
        pending = set()
        for error, refs in pool.map(asset, batch):
            if error:
                missing.append(error)
            pending.update(refs - seen)
    print(f'{len(pages)} pages, {len(seen) - len(missing)} assets; missing: {missing}')
