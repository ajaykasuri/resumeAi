#!/usr/bin/env python3
"""
Build the TrueType fonts that get EMBEDDED inside exported .docx files.

Why: Word only shows a web font (Inter, Syne, ...) if it is installed on the reader's computer.
Embedding the font in the .docx makes Word (Windows + Mac), LibreOffice and Pages show the same
typeface as the PDF/preview.

Source : the self-hosted @fontsource packages the frontend already uses (latin subset, SIL OFL).
Output : backend/assets/fonts/<slug>-{regular,bold,italic,bolditalic}.ttf  (committed, so deploys need no Python)

Run only when you add a font:
    cd frontend && npm i @fontsource/<name>      # already done for the 17 bundled families
    pip install fonttools
    python backend/scripts/build-word-fonts.py frontend/node_modules/@fontsource
"""
import os, sys
from fontTools.ttLib import TTFont

FAMILIES = {  # display name -> @fontsource package
    'DM Sans': 'dm-sans', 'Inter': 'inter', 'Lato': 'lato', 'Roboto': 'roboto', 'Open Sans': 'open-sans',
    'Playfair Display': 'playfair-display', 'Merriweather': 'merriweather', 'Source Serif 4': 'source-serif-4',
    'Syne': 'syne', 'JetBrains Mono': 'jetbrains-mono', 'Cormorant Garamond': 'cormorant-garamond',
    'Nunito': 'nunito', 'Work Sans': 'work-sans', 'Source Sans 3': 'source-sans-3', 'Poppins': 'poppins',
    'IBM Plex Sans': 'ibm-plex-sans', 'Lora': 'lora',
}
# style -> (fontsource file suffix, weight class, bold?, italic?, subfamily name)
STYLES = {
    'regular':    ('400-normal', 400, False, False, 'Regular'),
    'bold':       ('700-normal', 700, True,  False, 'Bold'),
    'italic':     ('400-italic', 400, False, True,  'Italic'),
    'bolditalic': ('700-italic', 700, True,  True,  'Bold Italic'),
}

def build(src_root, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    total = 0
    for family, pkg in FAMILIES.items():
        slug = pkg
        for key, (suffix, weight, bold, italic, sub) in STYLES.items():
            src = os.path.join(src_root, pkg, 'files', f'{pkg}-latin-{suffix}.woff')
            if not os.path.exists(src):
                continue
            f = TTFont(src)
            f.flavor = None                                   # woff -> plain sfnt/ttf
            for t in ('fvar', 'gvar', 'avar', 'STAT', 'HVAR', 'MVAR'):   # static faces only
                if t in f: del f[t]
            # Word matches embedded fonts by family + style, so normalise the name table.
            ps = f"{family.replace(' ', '')}-{sub.replace(' ', '')}"
            name = f['name']
            name.names = [n for n in name.names if n.nameID not in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25)]
            for pid, eid, lid in ((3, 1, 0x409), (1, 0, 0)):
                name.setName(family, 1, pid, eid, lid)
                name.setName(sub, 2, pid, eid, lid)
                name.setName(f'{family} {sub};static', 3, pid, eid, lid)
                name.setName(f'{family} {sub}', 4, pid, eid, lid)
                name.setName(ps, 6, pid, eid, lid)
            os2 = f['OS/2']
            os2.usWeightClass = weight
            sel = os2.fsSelection & ~(0x01 | 0x20 | 0x40)
            sel |= (0x01 if italic else 0) | (0x20 if bold else 0) | (0x40 if not bold and not italic else 0)
            os2.fsSelection = sel
            f['head'].macStyle = (1 if bold else 0) | (2 if italic else 0)
            if os2.fsType not in (0, 8):
                print(f'  ! {family} {sub}: embedding restricted (fsType={os2.fsType}) - skipped'); continue
            out = os.path.join(out_dir, f'{slug}-{key}.ttf')
            f.save(out)
            total += os.path.getsize(out)
            print(f'  {family:20s} {sub:12s} {os.path.getsize(out)//1024:4d} KB')
    print(f'total {total//1024} KB')

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else 'frontend/node_modules/@fontsource'
    build(src, os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts'))
