#!/usr/bin/env python3
"""Stage only runtime files for the installed ksmg CLI (no WebP support)."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('runtime_package', ROOT / 'scripts/build-game-package.py')
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/ksmg-preview')
    args = parser.parse_args()
    destination = args.output.resolve()
    if destination == ROOT or destination in ROOT.parents:
        raise SystemExit('Refusing to overwrite source directory')
    marker = destination / '.ksmg-stage.json'
    if destination.exists():
        if not marker.exists():
            raise SystemExit('Output exists and is not a generated preview directory')
        shutil.rmtree(destination)
    paths = package.runtime_files()
    package.check_references(paths)
    destination.mkdir(parents=True)
    marker.write_text('{}\n')
    replacements = {}
    for path in paths:
        relative = path.relative_to(ROOT)
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix.lower() == '.webp':
            image = Image.open(path)
            # Keep dimensions and alpha. RGB panels use high quality 4:4:4 JPEG;
            # transparent pixel art uses indexed PNG, supported by the native CLI.
            if image.mode == 'RGB':
                target = target.with_suffix('.jpg')
                image.save(target, 'JPEG', quality=90, subsampling=0, optimize=True)
            else:
                target = target.with_suffix('.png')
                image.convert('RGBA').quantize(colors=256, method=Image.Quantize.FASTOCTREE,
                    dither=Image.Dither.NONE).save(target, 'PNG', optimize=True)
            replacements[relative.as_posix()] = target.relative_to(destination).as_posix()
        else:
            shutil.copy2(path, target)
    for path in destination.rglob('*'):
        if path.suffix not in ('.js', '.json', '.html') or path == marker:
            continue
        source = path.read_text()
        for old, new in replacements.items():
            source = source.replace(old, new)
        path.write_text(source)
    config = json.loads((destination / 'game.json').read_text())
    files = [p for p in destination.rglob('*') if p.is_file() and p != marker]
    subroots = [destination / item['root'] for item in config.get('subpackages', [])]
    main_bytes = sum(p.stat().st_size for p in files if not any(p.is_relative_to(r) for r in subroots))
    total_bytes = sum(p.stat().st_size for p in files)
    if main_bytes > 6_000_000 or total_bytes > 30_000_000:
        raise SystemExit(f'Preview budget exceeded: main={main_bytes}, total={total_bytes}')
    if any(p.suffix.lower() == '.webp' for p in files):
        raise SystemExit('Unsupported WebP left in CLI stage')
    for path in files:
        if path.suffix != '.js':
            continue
        import re
        source = re.sub(r'/\*.*?\*/', '', path.read_text(), flags=re.DOTALL)
        source = re.sub(r'^\s*//.*$', '', source, flags=re.MULTILINE)
        for ref in re.findall(r"['\"]((?:assets|subpackages)/[^'\"]+\.(?:png|jpg|jpeg|webp|plist))['\"]", source):
            if not (destination / ref).exists():
                raise SystemExit(f'Missing stage resource: {ref}')
    report = {'source': str(ROOT), 'main_bytes': main_bytes, 'total_bytes': total_bytes,
              'webp_conversions': replacements, 'file_count': len(files)}
    marker.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'CLI preview main: {main_bytes:,} / 6,000,000 bytes')
    print(f'CLI preview total: {total_bytes:,} / 30,000,000 bytes')
    print(f'Converted {len(replacements)} WebP textures; preserved dimensions and transparency.')
    print(f'ksmg preview {destination} -q')


if __name__ == '__main__':
    main()
