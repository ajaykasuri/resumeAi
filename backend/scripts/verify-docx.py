#!/usr/bin/env python3
"""
Structural check for .docx files — catches what makes Microsoft Word say "unreadable content / corrupted".
Usage: python verify-docx.py file1.docx [file2.docx ...]    (exit code 1 if any file fails)
"""
import sys, zipfile, re, posixpath
from xml.dom import minidom
import xml.etree.ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def check(path):
    errs = []
    try: z = zipfile.ZipFile(path)
    except Exception as e: return [f'not a valid zip: {e}']
    names = set(z.namelist())
    if z.testzip(): errs.append('zip CRC error')
    for req in ('[Content_Types].xml', '_rels/.rels', 'word/document.xml'):
        if req not in names: errs.append(f'missing part {req}')
    # 1) every XML part is well-formed
    for n in names:
        if n.endswith('.xml') or n.endswith('.rels'):
            try: minidom.parseString(z.read(n))
            except Exception as e: errs.append(f'{n}: malformed XML ({e})')
    if errs: return errs
    # 2) every relationship target exists
    for n in [n for n in names if n.endswith('.rels')]:
        base = posixpath.dirname(posixpath.dirname(n))
        for r in ET.fromstring(z.read(n)):
            if r.get('TargetMode') == 'External': continue
            t = r.get('Target'); full = t.lstrip('/') if t.startswith('/') else posixpath.normpath(posixpath.join(base, t))
            if full not in names: errs.append(f'{n}: broken target {t}')
    # 3) every part has a content type
    ct = ET.fromstring(z.read('[Content_Types].xml')); ns = ct.tag.split('}')[0] + '}'
    defaults = {d.get('Extension').lower() for d in ct.findall(ns + 'Default')}
    overrides = {o.get('PartName').lstrip('/') for o in ct.findall(ns + 'Override')}
    for n in names:
        if n == '[Content_Types].xml' or n.endswith('/'): continue
        if n not in overrides and n.rsplit('.', 1)[-1].lower() not in defaults: errs.append(f'no content type for {n}')
    # 4) WordprocessingML rules Word enforces
    doc = ET.fromstring(z.read('word/document.xml'))
    for tc in doc.iter(W + 'tc'):
        kids = [k for k in tc if k.tag != W + 'tcPr']
        if not kids or kids[-1].tag != W + 'p': errs.append('table cell must END with a paragraph (Word reports corruption otherwise)')
    for tbl in doc.iter(W + 'tbl'):
        if tbl.find(W + 'tblGrid') is None: errs.append('table without tblGrid')
        if not tbl.findall(W + 'tr'): errs.append('table without rows')
    for tr in doc.iter(W + 'tr'):
        if not tr.findall(W + 'tc'): errs.append('row without cells')
    if 'word/numbering.xml' in names:
        numbering = ET.fromstring(z.read('word/numbering.xml'))
        abstract_ids = {item.get(W + 'abstractNumId') for item in numbering.findall(W + 'abstractNum')}
        numbering_ids = {}
        for item in numbering.findall(W + 'num'):
            num_id = item.get(W + 'numId')
            abstract = item.find(W + 'abstractNumId')
            if num_id and abstract is not None and abstract.get(W + 'val') in abstract_ids:
                numbering_ids[num_id] = True
        for num_pr in doc.iter(W + 'numPr'):
            num_id = num_pr.find(W + 'numId')
            level = num_pr.find(W + 'ilvl')
            if num_id is None or num_id.get(W + 'val') not in numbering_ids:
                errs.append('paragraph references an undefined numbering ID')
            if level is not None and level.get(W + 'val') not in {str(n) for n in range(9)}:
                errs.append('paragraph has an invalid numbering level')
    raw = z.read('word/document.xml').decode('utf8', 'replace')
    if re.search(r'w:(val|w|sz|fill|color)="(NaN|undefined|null|Infinity)"', raw): errs.append('NaN/undefined written into an attribute')
    for m in re.finditer(r'w:fill="([^"]*)"', raw):
        if not re.fullmatch(r'[0-9A-Fa-f]{6}|auto', m.group(1)): errs.append(f'invalid shading colour {m.group(1)!r}'); break
    # 5) embedded fonts are consistent
    if 'word/fontTable.xml' in names:
        ft = z.read('word/fontTable.xml').decode()
        for rid in re.findall(r'<w:embed\w+ r:id="(rId\d+)"', ft):
            if f'Id="{rid}"' not in z.read('word/_rels/fontTable.xml.rels').decode(): errs.append(f'font relationship {rid} missing')
    return errs

bad = 0
for f in sys.argv[1:]:
    e = sorted(set(check(f)))
    print(('FAIL ' if e else 'ok   ') + f)
    for x in e: print('     -', x)
    bad += bool(e)
sys.exit(1 if bad else 0)
