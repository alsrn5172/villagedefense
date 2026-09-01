# 노드를 "지역별로 자기 마을 옆에 모아" 놓는다.
#
# 왜 길 위 자동 배치를 포기했는가:
#   · 사용자가 다시 그린 길이 구름·해안과 같은 순백이라 색으로 분리가 안 된다
#     (임계값을 좁히면 길이 끊기고, 넓히면 섬 전체가 한 덩어리가 된다 — 실측 반복 확인)
#   · 원본 지도의 길로 깔면 사용자가 지운 구역(커닝타워·골드비치 등)으로 노드가 들어간다
#   → 그래서 "정확한 자리"는 사람이 Maker 에서 잡고, 여기서는 **집기 쉬운 자리**만 만든다.
#
# 마을은 지도 아이콘 위에 정확히, 나머지는 마을 둘레에 겹치지 않게 배치한다.
# 드래그 후 sync_worldmap_nodes.cjs 로 CSV 에 고정한다.
from PIL import Image, ImageDraw
import math

BG = 'draft_clean.png'
im = Image.open(BG).convert('RGB')
W, H = im.size                      # 637 x 475
def board(p): return ((p[0] - W/2) * 2, (H/2 - p[1]) * 2)   # Board 1274x950

# 지도 아이콘에서 읽은 마을 위치(원본 픽셀 = 편집본에서도 동일 — 실측 0~3px 오차)
TOWN = {
    'SixPath':     (283, 232), 'KerningCity': (175, 216), 'Perion': (338, 106),
    'Henesys':     (218, 286), 'LithHarbor':  (120, 296), 'Ellinia': (420, 288),
    'Nautilus':    (446, 366),
}
# MAP-ROUTE-RULES 체인 순서: 여섯갈래길 쪽 → 보스 쪽
CHAIN = {
 'KerningCity': [('KerningCity_Hunt_SubwayLine1','지하철 1호선','Hunt'),
                 ('KerningCity_Village_SubwayEntrance','지하철 입구','Village'),
                 ('KerningCity_Hunt_ConstructionSite','폐공사장','Hunt'),
                 ('KerningCity_Village_MinimiMain','커닝시티','Village'),
                 ('KerningCity_Hunt_SewerApproach','하수구 통로','Hunt'),
                 ('KerningCity_Boss_KingSlime','킹슬라임','Boss')],
 'Henesys':    [('Henesys_Hunt_GolemsTemple','골렘의 사원','Hunt'),
                ('Henesys_Hunt_HillNorth','북쪽 언덕','Hunt'),
                ('Henesys_Village_MinimiMain','헤네시스','Village'),
                ('Henesys_Hunt_BlueMushroomTrail','파란버섯의 숲','Hunt'),
                ('Henesys_Boss_Mushmom','머쉬맘','Boss')],
 'Ellinia':    [('Ellinia_Hunt_TreeTrunkNest2','나무 둥지 2','Hunt'),
                ('Ellinia_Hunt_GreenTreeTrunk','초록 나무 둥치','Hunt'),
                ('Ellinia_Village_MinimiMain','엘리니아','Village'),
                ('Ellinia_Hunt_GiantTree','거대한 나무','Hunt'),
                ('Ellinia_Boss_Ephenia','에페니아','Boss')],
 'Perion':     [('Perion_Hunt_NorthernRidge','북쪽 산등성이','Hunt'),
                ('Perion_Hunt_WildBoarLand','와일드보어의 땅','Hunt'),
                ('Perion_Village_MinimiMain','페리온','Village'),
                ('Perion_Hunt_SouthernRidge','남쪽 산등성이','Hunt'),
                ('Perion_Boss_Stumpy','스텀피','Boss')],
 'Nautilus':   [('Nautilus_Hunt_WayToBeach','해변 가는 길','Hunt'),
                ('Nautilus_Hunt_PigPasture','돼지 목장','Hunt'),
                ('Nautilus_Village_MinimiMain','노틸러스','Village'),
                ('Nautilus_Village_MinimiShip','노틸러스호','Village'),
                ('Nautilus_Hunt_RibbonPigBeach','리본돼지 해변','Hunt'),
                ('Nautilus_Boss_Pianus','피아누스','Boss')],
 'LithHarbor': [('LithHarbor_Hunt_PigBeach','돼지 해변','Hunt'),
                ('LithHarbor_Hunt_RightAroundLithHarbor','리스항구 주변','Hunt'),
                ('LithHarbor_Village_MinimiMain','리스항구','Village'),
                ('LithHarbor_Hunt_ForestTrail1','숲의 오솔길 1','Hunt'),
                ('LithHarbor_Boss_Mano','마노','Boss')],
}
RING = 46          # 마을 둘레 반경(원본 px). 보드에서는 ×2 = 92px
MARGIN = 26        # 지도 가장자리 여백

rows = [('SixPathCrossway', '여섯갈래길', 'SixPath', 'Hub', TOWN['SixPath'], '6개 지역 중심 허브')]

for region, chain in CHAIN.items():
    vx, vy = TOWN[region]
    village = next(c for c in chain if c[0].endswith('_Village_MinimiMain'))
    others  = [c for c in chain if c is not village]
    rows.append((village[0], village[1], region, village[2], (vx, vy), '지도 아이콘 위'))

    # 여섯갈래길 반대쪽 반원에 체인 순서대로 늘어놓는다(밖으로 갈수록 보스에 가까움).
    base = math.atan2(vy - TOWN['SixPath'][1], vx - TOWN['SixPath'][0])
    n = len(others)
    span = math.radians(200)
    for i, (m, l, t) in enumerate(others):
        ang = base - span/2 + span * (i / max(n - 1, 1))
        x = vx + math.cos(ang) * RING
        y = vy + math.sin(ang) * RING
        x = max(MARGIN, min(W - MARGIN, x))
        y = max(MARGIN, min(H - MARGIN, y))
        rows.append((m, l, region, t, (x, y), ''))

rows.append(('Sleepywood_Village_MinimiMain','슬리피우드','Sleepywood','Village',(378,402),'포탈망 제외'))

# 미리보기
COL={'Hub':(23,180,250),'Village':(23,180,250),'Boss':(233,43,227),'Hunt':(250,213,74)}
prev=im.copy(); d=ImageDraw.Draw(prev)
for m,l,reg,t,(x,y),note in rows:
    r={'Hub':9,'Village':8,'Boss':8,'Hunt':5}[t]
    d.ellipse([x-r,y-r,x+r,y+r], fill=COL[t], outline=(20,20,20))
prev.save('stage_preview.png')

out=['MapName,Label,Region,Type,NodeEntity,X,Y,ShowLabel,LabelDX,LabelDY,Enabled,#Note']
for m,l,reg,t,p,note in rows:
    bx,by=board(p)
    en='false' if m.startswith('Sleepywood') else 'true'
    out.append(f'{m},{l},{reg},{t},Node_{m},{bx:.1f},{by:.1f},false,0.0,-34.0,{en},{note}')
for m,l,e,x,y in [('map01','1지역 · 초원 전선','Region1',-255,120),
                  ('map02','2지역 · 구름 전선','Region2',-31.6577,12.0001),
                  ('map03','3지역 · 설원 전선','Region3',201.3748,-150.1548)]:
    out.append(f'{m},{l},Temp,Temp,{e},{x:.1f},{y:.1f},false,0.0,-34.0,false,임시맵 · 파병 {e.lower()}')
open('WorldMapNodes.csv','w',encoding='utf-8').write(chr(10).join(out)+chr(10))

hyp=lambda p,q:((p[0]-q[0])**2+(p[1]-q[1])**2)**.5
live=[r for r in rows if not r[0].startswith('Sleepywood')]
pairs=sorted((hyp(a[4],b[4]),a[0],b[0]) for i,a in enumerate(live) for b in live[i+1:])
print('노드', len(rows), '| 가장 가까운 3쌍(보드 px):')
for dd,m1,m2 in pairs[:3]: print(f'   {dd*2:6.1f}  {m1} ~ {m2}')
