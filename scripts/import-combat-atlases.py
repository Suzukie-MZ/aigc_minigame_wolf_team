#!/usr/bin/env python3
from pathlib import Path
import json,plistlib,re,argparse,shutil,struct
parser=argparse.ArgumentParser(description="Import reviewed tower and hero combat atlases into local client/admin projects")
parser.add_argument("--source",type=Path,required=True,help="Server game_idea/data directory at reviewed commit 7890a77")
parser.add_argument("--client",type=Path,required=True)
parser.add_argument("--admin",type=Path,required=True)
args=parser.parse_args()
root=args.source
roles={}; manifest=[]
names={'tower':['守望棱塔','穿云弩台','秘法尖塔','震荡重炮','星辉工坊','远征哨塔'],'hero':['前线守望者','秘法先知','远征先锋']}
def nums(s): return [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?',s)]
def atlas(p,key,url):
 d=plistlib.loads(p.read_bytes());width,height=nums(d['metadata']['size']);frames=[]
 for name,f in sorted(d['frames'].items()):
  x,y,w,h=nums(f['textureRect']);cw,ch=nums(f['spriteSourceSize']);ox,oy=nums(f['spriteOffset']);sw,sh=nums(f['spriteSize'])
  assert not f['textureRotated']
  frames.append({'name':name,'rect':[x,y,w,h],'offset':[(cw-sw)/2+ox,(ch-sh)/2-oy],'source':[cw,ch]})
 return {'key':key,'url':url,'width':width,'height':height,'frames':frames}
for kind,ns in names.items():
 for i,name in enumerate(ns,1):
  role={'name':name,'kind':kind,'economy':name=='星辉工坊'};rid=f'{kind}-{i}';roles[rid]=role
  specs=[]
  if kind=='tower':
   role['levels']={}
   for lv in range(1,7):
    item={};role['levels'][str(lv)]=item
    specs.append((item,'attack',root/f'tower_attack_atlas/{name}/{name}_Lv{lv}_attack.plist',f'{rid}/lv{lv}-attack.png'))
    specs.append((item,'effects',root/f'tower_effect_atlas/{name}/{name}_Lv{lv}_{"pulse_resource" if role["economy"] else "projectile_hit"}.plist',f'{rid}/lv{lv}-effects.png'))
  else:
   role['directions']={}
   for direction in ['up','down','left','right']:
    p=root/f'hero_attack_atlas/{name}/{name}_{direction}_attack.plist'
    if p.exists():specs.append((role['directions'],direction,p,f'{rid}/{direction}-attack.png'))
   specs.append((role,'effects',root/f'hero_effect_atlas/{name}/{name}_projectile_hit.plist',f'{rid}/effects.png'))
  for target,field,p,url in specs:
   a=atlas(p,'combat-'+url[:-4].replace('/','-'),'combat-atlas/'+url);target[field]=a
   manifest.append({'source':str(p.with_suffix('.png')),'url':a['url']})
   if field=='effects':
    target['effectGroups']={}
    for group in (['pulse','resource'] if role['economy'] else ['projectile','hit']):
     target['effectGroups'][group]=[f for f in a['frames'] if '_'+group+'_' in f['name']]
  if kind=='hero' and 'left' not in role['directions']:role['directions']['left']={**role['directions']['right'],'mirror':True}
data=json.dumps({'schemaVersion':1,'sourceCommit':'7890a777b3ed7632a57f87b20ec0e8822c142f30','roles':roles},ensure_ascii=False,indent=2)+'\n'
for record in manifest:
 source=Path(record['source'])
 if not source.is_file():raise FileNotFoundError(source)
 raw=source.read_bytes()
 if raw[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Not a PNG: '+str(source))
 # Match original atlas dimensions before preserving the supplied PNG unchanged.
 d=plistlib.loads(source.with_suffix('.plist').read_bytes())
 if tuple(nums(d['metadata']['size'])) != struct.unpack('>II',raw[16:24]):raise ValueError('Atlas size mismatch: '+str(source))
for record in manifest:
 for base in [args.client/'subpackages/combat',args.admin/'public']:
  dest=base/record['url'];dest.parent.mkdir(exist_ok=True,parents=True);shutil.copyfile(record['source'],dest)
(args.admin/'lib/combat-atlas-data.json').write_text(data)
(args.client/'js/render/combat-atlas-data.js').write_text('(function () { window.M3 = window.M3 || {}; window.M3.CombatAtlasData = '+data.strip()+'; })();\n')
(args.client/'subpackages/combat/game.js').write_text('// Local tower and hero combat artwork package.\n')
print('Imported',len(manifest),'PNG atlases and shared frame data; no CDN publication')
