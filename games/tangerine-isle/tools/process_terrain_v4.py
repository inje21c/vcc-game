import numpy as np
from PIL import Image

SRC='/mnt/user-data/uploads/ChatGPT_Image_2026년_7월_9일_오전_09_17_12.png'
OUT='/home/claude/assets128'

img = np.array(Image.open(SRC).convert('RGB'), dtype=np.int16)
r,g,b = img[...,0], img[...,1], img[...,2]
magenta = (r>=180)&(b>=180)&(g<=120)
fg = ~magenta

# 투영 프로파일로 타일 경계 검출 (그리드 가정 없이 견고)
def spans(profile, min_len=30):
    out=[]; start=None
    for i,v in enumerate(profile):
        if v and start is None: start=i
        if not v and start is not None:
            if i-start>=min_len: out.append((start,i))
            start=None
    if start is not None and len(profile)-start>=min_len: out.append((start,len(profile)))
    return out

col_spans = spans(fg.any(axis=0))
row_spans = spans(fg.any(axis=1))
print('cols:',len(col_spans),'rows:',len(row_spans))
assert len(col_spans)==5 and len(row_spans)==2, '그리드 검출 실패'

ids=['tile_ground_a','tile_ground_b','tile_tree','tile_water_a','tile_water_b',
     'tile_pit','tile_pit_filled','tile_door_wood','tile_door_stone','tile_volcanic']
k=0
for (y0,y1) in row_spans:
    for (x0,x1) in col_spans:
        cell = img[y0:y1, x0:x1]
        # 셀 내부 잔여 마젠타 픽셀(테두리 안티에일리어싱) 검사
        cm = (cell[...,0]>=180)&(cell[...,2]>=180)&(cell[...,1]<=120)
        if cm.any():
            # 가장자리 안티에일리어싱: 최근접 비마젠타 색으로 치환
            c=cell.copy()
            for _ in range(8):
                if not cm.any(): break
                for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):
                    s=np.roll(c,(dy,dx),axis=(0,1))
                    sm=(s[...,0]>=180)&(s[...,2]>=180)&(s[...,1]<=120)
                    fill=cm&~sm; c[fill]=s[fill]
                    cm=(c[...,0]>=180)&(c[...,2]>=180)&(c[...,1]<=120)
            cell=c
        im=Image.fromarray(cell.astype(np.uint8),'RGB').resize((128,128),Image.LANCZOS)
        im=im.convert('RGBA')
        im.save(f'{OUT}/{ids[k]}.png')
        print(ids[k],'✓',f'{x1-x0}x{y1-y0}')
        k+=1
