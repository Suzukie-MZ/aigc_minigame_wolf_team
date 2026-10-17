"""Build a higher-resolution UI glyph overlay; keep the full bundled font as fallback."""
import argparse
import json
import math
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--font', default='/System/Library/Fonts/STHeiti Medium.ttc')
args = parser.parse_args()
source = ''.join((ROOT / p).read_text() for p in (
    'js/render/renderer.js', 'js/render/battle-messages.js', 'js/play/game-features.js', 'js/play/neutral-config.js'))
extra = '守住霓虹防线抵御来袭的敌人'+'前线守望者秘法先知远征先锋'+'守望棱塔穿云弩台秘法尖塔震荡重炮星辉工坊远征哨塔'+'霓虹防线钢铁苍穹量子哨站数据风暴峡谷哨戒线垂直贫民窟星子方舟极光要塞脉冲电网深蓝港区'
chars = ''.join(chr(i) for i in range(32, 127)) + '！？。，、：；（）【】《》＋－−×÷％…·—→' + ''.join(sorted(set(re.findall(r'[\u3400-\u9fff]', source + extra + (ROOT / 'scripts/data/map-level-labels.json').read_text()))))
chars = ''.join(dict.fromkeys(chars))
cell, pad, cols, size = 64, 8, 20, 46
rows = math.ceil(len(chars) / cols)
alpha = Image.new('L', (cols * cell, rows * cell))
font = ImageFont.truetype(args.font, size, index=1)
ascent, descent = font.getmetrics()
advances = {}
ink_centers = []
for i, ch in enumerate(chars):
    if ch == ' ':
        ink_centers.append(23)
        advances[ch] = round(font.getlength(ch) / size, 4)
        continue
    glyph = Image.new('L', (cell, cell))
    draw = ImageDraw.Draw(glyph)
    # One shared baseline; preserve the typeface's real em and advance widths.
    draw.text((pad + 1, pad + ascent), ch, anchor='ls', font=font,
              fill=255, stroke_width=1, stroke_fill=255)
    bounds = glyph.getbbox()
    ink_centers.append((bounds[1] + bounds[3]) / 2 - pad)
    advances[ch] = round(font.getlength(ch) / size, 4)
    alpha.paste(glyph, ((i % cols) * cell, (i // cols) * cell))
# Indexed white + 16 levels of alpha preserves antialiasing without an RGBA copy.
indexed = alpha.point(lambda value: round(value / 255 * 15)).convert('P')
indexed.putpalette([255] * 768)
indexed.info['transparency'] = bytes(round(min(i, 15) * 255 / 15) for i in range(256))
out = ROOT / 'assets/Font/font-cn-ui-hd.png'
indexed.save(out, optimize=True, bits=4)
data = dict(key='font-cn-ui-hd', characters=chars, cell=cell, padding=pad,
            columns=cols, rows=rows, width=cols*cell, height=rows*cell, glyphPixels=cell-pad*2, emSize=size, ascent=ascent, descent=descent, advances=advances, inkCenters=ink_centers, weight='bold')
(ROOT / 'js/render/ui-font-hd-data.js').write_text(
    '(function(){window.M3.UIFontHDData=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';})();\n')
print(f'{len(chars)} glyphs, {cols*cell} x {rows*cell}, {out.stat().st_size:,} bytes')
