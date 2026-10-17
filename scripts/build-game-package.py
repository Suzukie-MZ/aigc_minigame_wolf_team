#!/usr/bin/env python3
"""Build the upload ZIP; enforce the 6,000,000-byte main and individual subpackage budgets."""
import argparse
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 6_000_000
ENTRY_FILES = (
    'game.js', 'game.json', 'project.config.json', 'index.html',
    'ks-adapter.js', 'kwaiadapter.js', 'wxhelper.js', 'events.js',
)
RUNTIME_DIRS = ('js', 'api', 'standard', 'subpackages', 'assets')


def runtime_files():
    paths = [ROOT / name for name in ENTRY_FILES]
    for directory in RUNTIME_DIRS:
        paths.extend(path for path in (ROOT / directory).rglob('*')
                     if path.is_file() and not any(part.startswith('.') for part in path.relative_to(ROOT).parts)
                     and path.name != 'README.md' and not path.name.endswith(('.prompt.txt', '.source.md')))
    return sorted(set(paths))


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
    required = ['assets/home-asset/home-loading-qiyuan.webp', 'subpackages/ui-images/assets/Image/ui/ui-icons.png', 'subpackages/ui-images/assets/Image/ui/ui-map-reference.webp', 'subpackages/ui-images/assets/Image/ui/ui-tower-interface-v1.webp', 'subpackages/ui-images/assets/Image/ui/ui-hero-interface-v1.webp', 'subpackages/ui-images/assets/Image/ui/ui-level-briefing-v1.webp', 'subpackages/battle-images/assets/Image/ui/battle-scene-surround.webp', 'assets/Font/font-cn-ui-hd.png']
    required += [f'assets/Font/font-cn-main-{index}.png' for index in range(9)]
    for name in required:
        if name not in included:
            raise ValueError(f'Missing required local asset: {name}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'outputs/builds/aigc_minigame_wolf_team.zip')
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(ROOT):
        raise SystemExit('Build output must be outside package/ to avoid including the ZIP in the next upload')
    config = json.loads((ROOT / 'game.json').read_text())
    package_roots = [ROOT / item['root'] for item in config.get('subpackages', [])]
    directory_files = [path for path in ROOT.rglob('*') if path.is_file()]
    directory_main_size = sum(path.stat().st_size for path in directory_files
                              if not any(path.is_relative_to(root) for root in package_roots))
    directory_total_size = sum(path.stat().st_size for path in directory_files)
    if directory_main_size > LIMIT:
        raise SystemExit(f'Actual source-directory main package exceeds budget: {directory_main_size:,} > {LIMIT:,} bytes')
    paths = runtime_files()
    check_references(paths)
    raw_size = sum(path.stat().st_size for path in paths)
    subpackage_sizes = {item['name']: sum(path.stat().st_size for path in paths
                        if path.is_relative_to(ROOT / item['root']))
                        for item in config.get('subpackages', [])}
    directory_subpackage_sizes = {item['name']: sum(path.stat().st_size for path in directory_files
                                  if path.is_relative_to(ROOT / item['root']))
                                  for item in config.get('subpackages', [])}
    main_size = raw_size - sum(subpackage_sizes.values())
    if main_size > LIMIT:
        raise SystemExit(f'Runtime main package exceeds budget: {main_size:,} > {LIMIT:,} bytes')
    for name, size in directory_subpackage_sizes.items():
        if size > LIMIT:
            raise SystemExit(f'Subpackage {name} exceeds budget: {size:,} > {LIMIT:,} bytes')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in paths:
            info = zipfile.ZipInfo(path.relative_to(ROOT).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes(), compresslevel=9)
    zip_size = temporary.stat().st_size
    with zipfile.ZipFile(temporary) as archive:
        if archive.testzip() is not None:
            raise SystemExit('ZIP integrity check failed')
    temporary.replace(args.output)
    config = json.loads((ROOT / 'game.json').read_text())
    subpackage_sizes = {item['name']: sum(path.stat().st_size for path in paths
                        if path.is_relative_to(ROOT / item['root']))
                        for item in config.get('subpackages', [])}
    main_size = raw_size - sum(subpackage_sizes.values())
    report = {'directory_main_bytes': directory_main_size, 'directory_total_bytes': directory_total_size,
              'main_package_bytes': main_size, 'subpackage_bytes': subpackage_sizes,
              'directory_subpackage_bytes': directory_subpackage_sizes,
              'limit_bytes': LIMIT, 'runtime_bytes': raw_size, 'zip_bytes': zip_size,
              'file_count': len(paths), 'files': [path.relative_to(ROOT).as_posix() for path in paths]}
    args.output.with_suffix('.size.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f'Runtime total: {raw_size:,} bytes; ZIP: {zip_size:,} bytes; per-package limit: {LIMIT:,} bytes')
    print(f'Main package: {main_size:,} bytes; subpackages: {subpackage_sizes}')
    print(f'Actual directory: main {directory_main_size:,} bytes; total {directory_total_size:,} bytes (no hidden-file exclusions)')
    print(args.output)


if __name__ == '__main__':
    main()
