"""Build crisp 16px tactical-preview materials from a shared, limited pixel palette."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(128,64))
palettes=[('#263C3F','#30484A','#486064'),('#182E37','#223C46','#3B535B'),('#413E30','#504A37','#6C634A'),('#203C2A','#2C4930','#49613B')]
for row,(base,mid,light) in enumerate(palettes):
    for variant in range(8):
        tile=Image.new('RGB',(16,16),base);d=ImageDraw.Draw(tile)
        if variant>=4:
            road='#878C84' if row!=2 else '#8C8166'
            d.rectangle((0,0,15,15),fill=road)
            d.line((0,15,15,15),fill='#596461')
            d.line((15,0,15,15),fill='#596461')
            d.line((1,0,14,0),fill='#A3A89B')
            if variant%2:d.line([(4,0),(4,4),(6,6),(6,8)],fill='#737C73')
            else:d.rectangle((10,10,12,11),fill='#93988A')
            d.point((2,12),fill='#727A70')
        elif row in (2,3):
            d.rectangle((0,0,15,15),fill=base)
            for x,y,w,h in [(2,3,5,2),(9,8,4,3),(4,12,3,1)]:
                x=(x+variant*3)%12;y=(y+variant*2)%13
                d.rectangle((x,y,x+w,y+h),fill=mid)
                d.line((x,y,x+max(1,w-2),y),fill=light)
            if variant==2:d.rectangle((8,2,10,4),fill=light)
        else:
            d.rectangle((0,0,15,15),fill=base)
            d.line((0,15,15,15),fill='#14272D')
            d.line((15,0,15,15),fill='#14272D')
            d.line((0,0,15,0),fill=mid)
            d.rectangle((2,5,7,6),fill=mid)
            d.rectangle((10,11,13,12),fill=mid)
            if variant==1:
                d.rectangle((3,3,12,12),fill='#17282D')
                for y in (4,6,8,10):d.line((4,y,11,y),fill=light)
                d.point((3,3),fill='#718080')
                d.point((12,12),fill='#718080')
            elif variant==2:
                d.line((3,0,3,6),fill=mid)
                d.line((9,10,9,15),fill=light)
                if row==1:
                    d.rectangle((11,1,14,3),fill='#91702C')
                    d.line((11,1,12,1),fill='#C5993B')
            elif variant==3:
                d.rectangle((1,9,5,13),fill='#263F32')
                d.line((2,10,4,10),fill='#47634B')
        im.paste(tile,(variant*16,row*16))
im.save(ROOT/'subpackages/ui-images/assets/Image/ui/ui-map-terrain.png',optimize=True)
print('128 x 64 native pixel terrain atlas:',(ROOT/'subpackages/ui-images/assets/Image/ui/ui-map-terrain.png').stat().st_size,'bytes')
