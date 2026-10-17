#!/usr/bin/env python3
"""Build the upload ZIP; enforce the 6,000,000-byte main and individual subpackage budgets."""
import argparse
import json
from pathlib import Path
import re
import zipfile
import shutil
import io
import struct
import zlib
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 6_000_000
ENTRY_FILES = (
    'game.js', 'game.json', 'project.config.json', 'index.html',
    'ks-adapter.js', 'kwaiadapter.js', 'wxhelper.js', 'events.js',
)
RUNTIME_DIRS = ('js', 'api', 'standard', 'subpackages', 'assets')
# Development sources remain in the checkout; combat images load from CDN.
EXCLUDED_PREFIXES = ('subpackages/combat/', 'assets/terrain-depth/')
EXCLUDED_FILES = {'js/render/combat-atlas-data.js', 'js/render/terrain-depth.js'}


def release_file(path):
    name = path.relative_to(ROOT).as_posix()
    return name not in EXCLUDED_FILES and not name.startswith(EXCLUDED_PREFIXES)


def runtime_files():
    paths = [ROOT / name for name in ENTRY_FILES]
    for directory in RUNTIME_DIRS:
        paths.extend(path for path in (ROOT / directory).rglob('*')
                     if path.is_file() and not any(part.startswith('.') for part in path.relative_to(ROOT).parts)
                     and path.name != 'README.md' and not path.name.endswith(('.prompt.txt', '.source.md')))
    return sorted(path for path in set(paths) if release_file(path))


def check_references(paths):
    included = {path.relative_to(ROOT).as_posix() for path in paths}
    for path in paths:
        if not path.exists():
            raise ValueError(f'Missing entry file: {path}')
        if path.suffix not in ('.js', '.html'):
            continue
        source = re.sub(r'/\*.*?\*/', '', path.read_text(), flags=re.DOTALL)
        source = re.sub(r'^\s*//.*$', '', source, flags=re.MULTILINE)
        # Static entry imports are standalone statements; skip commented examples.
        for ref in re.findall(r'''(?:^\s*require\(\s*['"]([^'"]+)['"]|<script\s+src=['"]([^'"]+)['"])''', source, re.MULTILINE):
            name = next(value for value in ref if value).split('?')[0]
            if name.startswith(('http:', 'https:', 'data:')):
                continue
            candidate = (path.parent / name).resolve()
            if candidate.suffix == '':
                candidate = candidate.with_suffix('.js')
            if candidate.is_relative_to(ROOT) and candidate.relative_to(ROOT).as_posix() not in included:
                raise ValueError(f'Unpackaged reference in {path.relative_to(ROOT)}: {name}')
    # Manifests loaded later can switch UI icons back to their original images.
    # Preserve and verify every explicit local image path, including those originals.
    for path in paths:
        if path.suffix != '.js':
            continue
        source = re.sub(r'/\*.*?\*/', '', path.read_text(), flags=re.DOTALL)
        source = re.sub(r'^\s*//.*$', '', source, flags=re.MULTILINE)
        for name in re.findall(r"""['\"]((?:assets|subpackages)/[^'\"]+?\.(?:png|webp|jpe?g))(?:\?[^'\"]*)?['\"]""", source):
            if name not in included:
                raise ValueError(f'Unpackaged image reference in {path.relative_to(ROOT)}: {name}')
    required = ['assets/home-asset/home-loading-qiyuan.webp', 'subpackages/ui-images/assets/Image/ui/ui-icons.png', 'subpackages/ui-images/assets/Image/ui/ui-map-reference.webp', 'subpackages/ui-images/assets/Image/ui/ui-tower-interface-v1.webp', 'subpackages/ui-images/assets/Image/ui/ui-hero-interface-v1.webp', 'subpackages/ui-images/assets/Image/ui/ui-level-briefing-v1.webp', 'subpackages/battle-images/assets/Image/ui/pixel-units-25d-v1.webp', 'subpackages/battle-images/assets/Image/ui/battle-scene-surround.webp', 'assets/Font/font-cn-ui-hd.png']
    required += [f'assets/Font/font-cn-main-{index}.png' for index in range(9)]
    for name in required:
        if name not in included:
            raise ValueError(f'Missing required local asset: {name}')


def optimized_png(path):
    """Lossless byte reduction, verified by exact decoded RGBA pixel equality."""
    original = path.read_bytes()
    with Image.open(path) as source:
        expected = source.convert('RGBA').tobytes()
        image = source.copy()
        if image.mode == 'RGBA' and image.getchannel('A').getextrema() == (255, 255):
            image = image.convert('RGB')
        buffer = io.BytesIO()
        image.save(buffer, format='PNG', optimize=True)
    candidate = buffer.getvalue()
    offset, chunks, compressed = 8, [], b''
    while offset < len(candidate):
        length = int.from_bytes(candidate[offset:offset + 4], 'big')
        kind = candidate[offset + 4:offset + 8]
        value = candidate[offset + 8:offset + 8 + length]
        offset += length + 12
        if kind == b'IDAT':
            compressed += value
        else:
            chunks.append((kind, value))
    raw = zlib.decompress(compressed)
    choices = [original, candidate]
    def chunk(kind, value):
        return struct.pack('>I', len(value)) + kind + value + struct.pack('>I', zlib.crc32(kind + value) & 0xffffffff)
    for strategy in (zlib.Z_FILTERED, zlib.Z_DEFAULT_STRATEGY, zlib.Z_RLE):
        encoder = zlib.compressobj(9, zlib.DEFLATED, 15, 9, strategy)
        payload = encoder.compress(raw) + encoder.flush()
        output = candidate[:8]
        for kind, value in chunks:
            if kind == b'IEND':
                output += chunk(b'IDAT', payload)
            output += chunk(kind, value)
        choices.append(output)
    result = min(choices, key=len)
    with Image.open(io.BytesIO(result)) as check:
        if check.size != image.size or check.convert('RGBA').tobytes() != expected:
            raise ValueError(f'PNG optimization changed pixels: {path}')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'outputs/builds/aigc_minigame_wolf_team.zip')
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(ROOT):
        raise SystemExit('Build output must be outside package/ to avoid including the ZIP in the next upload')
    paths = runtime_files()
    check_references(paths)
    destination = args.output.with_suffix('').resolve()
    if destination == ROOT or destination in ROOT.parents:
        raise SystemExit('Refusing to overwrite source directory or its parents')
    marker = destination / '.runtime-stage.json'
    if destination.exists() and not marker.exists():
        raise SystemExit('Output directory exists and is not a generated runtime stage')
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    marker.write_text('{}\n')
    for path in paths:
        target = destination / path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() == '.png':
            target.write_bytes(optimized_png(path))
        else:
            shutil.copy2(path, target)
    config = json.loads((destination / 'game.json').read_text())
    staged_files = [path for path in destination.rglob('*') if path.is_file() and path != marker]
    subpackage_sizes = {item['name']: sum(path.stat().st_size for path in staged_files
                        if path.is_relative_to(destination / item['root']))
                        for item in config.get('subpackages', [])}
    raw_size = sum(path.stat().st_size for path in staged_files)
    main_size = raw_size - sum(subpackage_sizes.values())
    if main_size > LIMIT:
        raise SystemExit(f'Runtime main package exceeds budget: {main_size:,} > {LIMIT:,} bytes')
    for name, size in subpackage_sizes.items():
        if size > LIMIT:
            raise SystemExit(f'Subpackage {name} exceeds budget: {size:,} > {LIMIT:,} bytes')
    if raw_size > 30_000_000:
        raise SystemExit(f'Runtime total exceeds 30 MB: {raw_size:,} bytes')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(staged_files):
            info = zipfile.ZipInfo(path.relative_to(destination).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes(), compresslevel=9)
    zip_size = temporary.stat().st_size
    with zipfile.ZipFile(temporary) as archive:
        if archive.testzip() is not None:
            raise SystemExit('ZIP integrity check failed')
    temporary.replace(args.output)
    report = {'stage_directory': str(destination),
              'main_package_bytes': main_size, 'subpackage_bytes': subpackage_sizes,
              'limit_bytes': LIMIT, 'runtime_bytes': raw_size, 'zip_bytes': zip_size,
              'lossless_png_savings': sum(path.stat().st_size for path in paths) - raw_size,
              'file_count': len(staged_files),
              'files': [path.relative_to(destination).as_posix() for path in sorted(staged_files)]}
    args.output.with_suffix('.size.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Runtime total: {raw_size:,} bytes; ZIP: {zip_size:,} bytes; per-package limit: {LIMIT:,} bytes')
    print(f'Main package: {main_size:,} bytes; subpackages: {subpackage_sizes}')
    print(f'Upload staged runtime directory: {destination}')
    print(args.output)



if __name__ == '__main__':
    main()
