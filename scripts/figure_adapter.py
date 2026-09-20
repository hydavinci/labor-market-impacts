"""Conservative adapter for the original 4096px Anthropic Figure 2 layout.
Labels/order/legend/frame must be pixel-identical to reference. Raster readings
remain approximate (~2pp); unsupported designs fail rather than being guessed.
"""
import io
import math
from PIL import Image, ImageChops, ImageDraw
CENTER=(2042.3,2099.2)
RADIUS=1360.7
IDS='management business-finance computer-math architecture-engineering life-social-sciences social-services legal education-library arts-media healthcare-practitioners healthcare-support protective-service food-serving grounds-maintenance personal-care sales office-admin agriculture construction installation-repair production transportation'.split()

def extract(content,reference):
    im=Image.open(io.BytesIO(content))
    if im.format!='PNG' or im.size!=(4096,4096):raise ValueError('Unsupported figure format or geometry')
    im=im.convert('RGB');ref=Image.open(io.BytesIO(reference)).convert('RGB')
    if ref.size!=im.size:raise ValueError('Invalid adapter reference')
    diff=ImageChops.difference(im,ref);x,y=CENTER;r=RADIUS-3
    ImageDraw.Draw(diff).ellipse((x-r,y-r,x+r,y+r),fill=(0,0,0))
    if diff.getbbox():raise ValueError('Figure labels, order, legend or outer scale changed')
    # Internal radial tick labels must also remain unchanged (0.2 through 0.8).
    for ratio in (.2,.4,.6,.8):
        tx=x-ratio*RADIUS/math.sqrt(2);ty=y-ratio*RADIUS/math.sqrt(2)
        box=(round(tx-38),round(ty-38),round(tx+38),round(ty+38))
        if ImageChops.difference(im.crop(box),ref.crop(box)).getbbox():
            raise ValueError('Internal radial scale changed or obscured')
    pixels=im.load();result=[]
    for i,cid in enumerate(IDS):
        a=-math.pi/2+i*2*math.pi/22;ca,sa=math.cos(a),math.sin(a);values=[]
        for series in ('blue','red'):
            hits=[]
            for rr in range(round(RADIUS)+24):
                colors=[pixels[round(x+ca*rr-sa*off),round(y+sa*rr+ca*off)] for off in (-1,0,1)]
                if any((b>140 and g>70 and red<110 and b-red>70) if series=='blue' else (red>150 and g<130 and b<130 and red-g>60) for red,g,b in colors):hits.append(rr)
            if len(hits)<8:raise ValueError(f'Missing {series} marker at {cid}')
            edge=hits[-1]
            if sum(edge-8<=h<=edge for h in hits)<5:raise ValueError(f'Ambiguous marker at {cid}')
            offset=16 if series=='blue' else 16/max(abs(ca),abs(sa))
            value=round((edge-offset)/RADIUS*100)
            if not 0<=value<=100:raise ValueError(f'Out-of-range coverage at {cid}')
            values.append(value)
        if values[1]>values[0]:raise ValueError(f'Observed exceeds theoretical at {cid}')
        result.append(dict(id=cid,theoretical=values[0],observed=values[1]))
    return result
