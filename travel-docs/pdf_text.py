# -*- coding: utf-8 -*-
"""Minimal PDF text extraction (Flate + ToUnicode CID fonts), enough for page lookup."""
import re
import sys
import zlib


def _objects(raw):
    objs = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b', raw):
        num = int(m.group(1))
        start = m.end()
        end = raw.find(b'endobj', start)
        if end < 0:
            continue
        objs[num] = raw[start:end]
    return objs


def _stream(body):
    m = re.search(rb'stream\r?\n', body)
    if not m:
        return None
    start = m.end()
    end = body.find(b'endstream', start)
    if end < 0:
        return None
    data = body[start:end]
    if data.endswith(b'\r\n'):
        data = data[:-2]
    elif data.endswith((b'\n', b'\r')):
        data = data[:-1]
    head = body[:m.start()]
    if b'FlateDecode' in head:
        try:
            data = zlib.decompress(data)
        except Exception:
            try:
                data = zlib.decompressobj().decompress(data)
            except Exception:
                return None
    return data


def _hex_str(h):
    try:
        return bytes.fromhex(h.decode('ascii')).decode('utf-16-be', 'ignore')
    except Exception:
        return ''


def _cmap_for(objs, num):
    body = objs.get(num, b'')
    m = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R', body)
    if not m:
        return None
    data = _stream(objs.get(int(m.group(1)), b''))
    if not data:
        return None
    mapping = {}
    for block in re.findall(rb'beginbfchar(.*?)endbfchar', data, re.S):
        for src, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block):
            mapping[int(src, 16)] = _hex_str(dst)
    for block in re.findall(rb'beginbfrange(.*?)endbfrange', data, re.S):
        for lo, hi, dst in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block):
            a, b = int(lo, 16), int(hi, 16)
            base = _hex_str(dst)
            if not base:
                continue
            start = ord(base[0])
            for i in range(b - a + 1):
                mapping[a + i] = chr(start + i) + base[1:]
        for lo, hi, arr in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[(.*?)\]', block, re.S):
            a = int(lo, 16)
            items = re.findall(rb'<([0-9A-Fa-f]+)>', arr)
            for i, item in enumerate(items):
                mapping[a + i] = _hex_str(item)
    return mapping


def _font_map(objs, page_body):
    m = re.search(rb'/Resources\s+(\d+)\s+0\s+R', page_body)
    res = objs.get(int(m.group(1)), b'') if m else page_body
    fm = re.search(rb'/Font\s+(\d+)\s+0\s+R', res)
    if fm:
        font_dict = objs.get(int(fm.group(1)), b'')
    else:
        fm = re.search(rb'/Font\s*<<(.*?)>>', res, re.S)
        if not fm:
            return {}
        font_dict = fm.group(1)
    return {k.decode(): int(v) for k, v in re.findall(rb'/(F\w+)\s+(\d+)\s+0\s+R', font_dict)}


def _decode(data, cmap, wide=False):
    if not data:
        return ''
    if cmap:
        out = []
        if wide:
            for i in range(0, len(data) - 1, 2):
                out.append(cmap.get((data[i] << 8) | data[i + 1], ''))
        else:
            for b in data:
                out.append(cmap.get(b, ''))
        return ''.join(out)
    try:
        return data.decode('utf-8')
    except Exception:
        return data.decode('latin1', 'ignore')


def _literal(token):
    if token.startswith(b'<'):
        h = re.sub(rb'\s+', b'', token[1:-1])
        if len(h) % 2:
            h = b'0' + h
        try:
            return bytes.fromhex(h.decode('ascii'))
        except Exception:
            return b''
    body = token[1:-1]
    out = bytearray()
    i = 0
    while i < len(body):
        c = body[i]
        if c == 0x5C and i + 1 < len(body):
            n = body[i + 1]
            if n in b'nrtbf':
                out.append({110: 10, 114: 13, 116: 9, 98: 8, 102: 12}.get(n, n))
                i += 2
                continue
            if 0x30 <= n <= 0x37:
                oct_digits = bytearray()
                j = i + 1
                while j < len(body) and len(oct_digits) < 3 and 0x30 <= body[j] <= 0x37:
                    oct_digits.append(body[j])
                    j += 1
                out.append(int(oct_digits, 8) & 0xFF)
                i = j
                continue
            out.append(n)
            i += 2
            continue
        out.append(c)
        i += 1
    return bytes(out)


TOKEN = re.compile(
    rb'/(F\w+)\s+[\d.]+\s+Tf|(<[0-9A-Fa-f\s]+>|\((?:\\.|[^\\()])*\))\s*(?:Tj|\'|\")|\[(.*?)\]\s*TJ',
    re.S)


def _page_text(content, fonts, objs):
    cmaps = {}
    wide = {}
    for name, num in fonts.items():
        if num not in cmaps:
            cmaps[num] = _cmap_for(objs, num)
            wide[num] = b'/Subtype/Type0' in objs.get(num, b'')
    cur = None
    out = []
    for m in TOKEN.finditer(content):
        if m.group(1):
            cur = fonts.get(m.group(1).decode())
        elif m.group(2):
            out.append(_decode(_literal(m.group(2)), cmaps.get(cur), wide.get(cur, False)))
        elif m.group(3):
            for sm in re.finditer(rb'<([0-9A-Fa-f\s]+)>|\((?:\\.|[^\\()])*\)', m.group(3), re.S):
                tok = sm.group(0)
                out.append(_decode(_literal(tok), cmaps.get(cur), wide.get(cur, False)))
    return ''.join(out)


def _page_order(objs):
    root = None
    for num, body in objs.items():
        if re.search(rb'/Type\s*/Catalog', body):
            m = re.search(rb'/Pages\s+(\d+)\s+0\s+R', body)
            if m:
                root = int(m.group(1))
            break
    if root is None:
        return sorted(n for n, b in objs.items()
                      if re.search(rb'/Type\s*/Page\b(?!s)', b) and b'/Contents' in b)
    order = []
    stack = [root]
    seen = set()
    while stack:
        num = stack.pop()
        if num in seen:
            continue
        seen.add(num)
        body = objs.get(num, b'')
        if re.search(rb'/Type\s*/Page\b(?!s)', body):
            order.append(num)
            continue
        m = re.search(rb'/Kids\s*\[(.*?)\]', body, re.S)
        if not m:
            continue
        kids = [int(x) for x in re.findall(rb'(\d+)\s+0\s+R', m.group(1))]
        stack.extend(reversed(kids))
    return order


def extract_pages(path):
    raw = open(path, 'rb').read()
    objs = _objects(raw)
    texts = []
    for num in _page_order(objs):
        body = objs.get(num, b'')
        cm = re.search(rb'/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)', body)
        if not cm:
            texts.append('')
            continue
        refs = [int(x) for x in re.findall(rb'(\d+)\s+\d+\s+R', cm.group(1))]
        fonts = _font_map(objs, body)
        chunks = []
        for ref in refs:
            data = _stream(objs.get(ref, b''))
            if data:
                chunks.append(_page_text(data, fonts, objs))
        texts.append(''.join(chunks))
    return texts


if __name__ == '__main__':
    pages = extract_pages(sys.argv[1])
    for i, t in enumerate(pages, 1):
        clean = re.sub(r'\s+', '', t)
        print(f'--- page {i} ({len(clean)} chars) ---')
        print(clean[:160])
