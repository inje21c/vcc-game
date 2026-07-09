"""
slice_assets.py (v3) — 감귤섬 삼총사 에셋 파이프라인
2026-07-09 확정 정책:
 - 목표 해상도 128px/타일 (32px 강제 다운스케일 폐기 — ChatGPT 생성물은
   고해상도 픽셀풍 일러스트이므로 고품질 리샘플로 디테일을 보존한다.
   레트로 감성은 해상도가 아니라 아트 스타일에서 나온다)
 - 배경 키잉 후 알파 2px 침식으로 헤일로 제거
 - 오브젝트 부스러기(최대 성분 2% 미만) 제거
 - 지형 = A버전(테두리 유지, 격자 가독성 = 귤 경제의 메커니즘 요구사항)
 - 물만 연속면: 적응형 크롭 + 인페인트 + 채도 +35% 보정, BOX 리샘플
게임 캔버스: 룸 = 15×15×128 = 1920px 논리 해상도, CSS로 반응형 축소.

[v4 추가 — 지형 시트 2세대 (2026-07-09)]
지형은 마젠타(#FF00FF) 배경 + 모서리 충전 정사각 타일 + 2~3px 내장 테두리로
재생성된 시트를 사용한다 (process_terrain_v4.py 경로: 투영 프로파일 경계검출
→ 마젠타 크로마키 → 잔여 안티에일리어싱 인페인트 → 128px LANCZOS).
격자 가독성은 타일에 구워진 내장 테두리가 담당한다. 체커보드 배경 소스와
물결 테두리 타일은 폐기 — 정렬·연속성·키잉 전 문제의 근원이었다.
"""
import numpy as np
from PIL import Image, ImageFilter

UP='/mnt/user-data/uploads'; OUT='/home/claude/assets128'
import os; os.makedirs(OUT, exist_ok=True)
CELL=128

def remove_checker(img):
    a = np.array(img.convert('RGBA'), dtype=np.int16)
    r,g,b = a[...,0],a[...,1],a[...,2]
    bg = (np.abs(r-g)<=7)&(np.abs(g-b)<=7)&(np.abs(r-b)<=7)&(np.minimum(np.minimum(r,g),b)>=236)
    a[...,3] = np.where(bg,0,255)
    return a

def erode_alpha(arr, px=2):
    """키잉 헤일로 제거: 알파 경계를 안쪽으로 px만큼 침식"""
    im = Image.fromarray(arr.astype(np.uint8),'RGBA')
    alpha = im.getchannel('A').filter(ImageFilter.MinFilter(px*2+1))
    im.putalpha(alpha)
    return np.array(im, dtype=np.int16)

def cut(cell, clean=False):
    if clean:  # 부스러기 제거
        from scipy import ndimage
    fg = cell[...,3]>0
    ys,xs = np.where(fg)
    return cell[ys.min():ys.max()+1, xs.min():xs.max()+1]

def pad_sq(c):
    h,w=c.shape[:2]; side=max(h,w)
    sq=np.zeros((side,side,4),dtype=np.int16)
    sq[(side-h)//2:(side-h)//2+h,(side-w)//2:(side-w)//2+w]=c
    return sq

def save(arr, name, resample=Image.LANCZOS, target=CELL):
    im=Image.fromarray(arr.astype(np.uint8),'RGBA').resize((target,target), resample)
    im.save(f'{OUT}/{name}.png')

def strip_debris(cell):
    fg=(cell[...,3]>0).astype(np.uint8)
    import collections
    H,W=fg.shape; lab=np.zeros((H,W),np.int32); cur=0
    for i in range(H):
        for j in range(W):
            if fg[i,j] and lab[i,j]==0:
                cur+=1; q=collections.deque([(i,j)]); lab[i,j]=cur
                while q:
                    y,x=q.popleft()
                    for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):
                        ny,nx=y+dy,x+dx
                        if 0<=ny<H and 0<=nx<W and fg[ny,nx] and lab[ny,nx]==0:
                            lab[ny,nx]=cur; q.append((ny,nx))
    if cur==0: return cell
    sizes=np.bincount(lab.ravel())[1:]
    keep=set(np.where(sizes>=sizes.max()*0.02)[0]+1)
    out=cell.copy(); out[...,3]=np.where(np.isin(lab,list(keep)),out[...,3],0)
    return out

DIRS=['down','up','left','right']

# 캐릭터 3 + 오브젝트: 침식 2px로 헤일로 제거 후 128px LANCZOS
for sheet, prefix in [('sheet_cat.png','cat'),('sheet_rabbit.png','rabbit'),('sheet_turtle.png','turtle')]:
    arr = erode_alpha(remove_checker(Image.open(f'{UP}/{sheet}')), 2)
    H,W=arr.shape[:2]; ch,cw=H//3,W//4
    ids=[f'spr_{prefix}_{d}_{f}' for f in['a','b','act'] for d in DIRS]
    k=0
    for r in range(3):
        for c in range(4):
            cell=strip_debris(arr[r*ch:(r+1)*ch, c*cw:(c+1)*cw])
            save(pad_sq(cut(cell)), ids[k]); k+=1

oarr = erode_alpha(remove_checker(Image.open(f'{UP}/sheet_objects.png')), 2)
oh,ow=oarr.shape[0]//2, oarr.shape[1]//4
oids=['obj_rock','obj_bomb','obj_tangerine','obj_key','obj_chest_closed','obj_chest_open','obj_button_off','obj_button_on']
k=0
for r in range(2):
    for c in range(4):
        cell=strip_debris(oarr[r*oh:(r+1)*oh, c*ow:(c+1)*ow])
        save(pad_sq(cut(cell)), oids[k]); k+=1

uarr = erode_alpha(remove_checker(Image.open(f'{UP}/ui_icon_tangerine_key.png')), 2)
uh,uw=uarr.shape[0], uarr.shape[1]//2
for i,n in enumerate(['ui_icon_tangerine','ui_icon_key']):
    save(pad_sq(cut(strip_debris(uarr[:, i*uw:(i+1)*uw]))), n)

# 지형: A버전 정본 (테두리 유지), 128px LANCZOS
tarr = remove_checker(Image.open(f'{UP}/sheet_terrain.png'))
th,tw=tarr.shape[0]//2, tarr.shape[1]//5
tids=['tile_ground_a','tile_ground_b','tile_tree','tile_water_a','tile_water_b',
      'tile_pit','tile_pit_filled','tile_door_wood','tile_door_stone','tile_volcanic']
k=0
for r in range(2):
    for c in range(5):
        cell=tarr[r*th:(r+1)*th, c*tw:(c+1)*tw]
        cell=erode_alpha(cell,2)
        save(pad_sq(cut(cell)), tids[k]); k+=1

# 물 전용: 적응형 평면화 + 인페인트 + 채도 보정, BOX 리샘플
def adaptive_flat(cell, thresh=0.97):
    fg=cell[...,3]>0; ys,xs=np.where(fg)
    c=cell[ys.min():ys.max()+1, xs.min():xs.max()+1].copy()
    def rr(i): return (c[i,:,3]>0).mean()
    def rc(j): return (c[:,j,3]>0).mean()
    t,b,l,r=0,c.shape[0]-1,0,c.shape[1]-1
    while t<b and rr(t)<thresh: t+=1
    while b>t and rr(b)<thresh: b-=1
    while l<r and rc(l)<thresh: l+=1
    while r>l and rc(r)<thresh: r-=1
    c=c[t:b+1,l:r+1].copy()
    for _ in range(64):
        hole=c[...,3]==0
        if not hole.any(): break
        for dy,dx in((0,1),(0,-1),(1,0),(-1,0)):
            src=np.roll(c,(dy,dx),axis=(0,1))
            fill=hole&(src[...,3]>0); c[fill]=src[fill]; hole=c[...,3]==0
    c[...,3]=255
    return c

import colorsys
for name,(r,c) in {'tile_water_a':(0,3),'tile_water_b':(0,4)}.items():
    cell=tarr[r*th:(r+1)*th, c*tw:(c+1)*tw]
    flat=adaptive_flat(cell)
    im=Image.fromarray(flat.astype(np.uint8),'RGBA').resize((CELL,CELL), Image.BOX)
    # 채도·청색 보정
    hsv=np.array(im.convert('HSV'),dtype=np.float32)
    hsv[...,1]=np.clip(hsv[...,1]*1.35,0,255)   # 채도 +35%
    hsv[...,2]=np.clip(hsv[...,2]*0.96,0,255)
    out=Image.fromarray(hsv.astype(np.uint8),'HSV').convert('RGBA')
    out.save(f'{OUT}/{name}.png')
print('v3:', len(os.listdir(OUT)), 'assets @128px')
