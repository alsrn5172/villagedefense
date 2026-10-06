// 공용 스크롤바 (사용자 2026-10-07 "UI 스크롤들이 스크롤바가 위아래로 움직이면서 나타나야 하는데 이상하게 구현돼 있음").
//   엔진 막대는 창마다 제각각(그림형 · 금색 평면 · 회색 · 숨김)이고 손잡이 그림(48x208 Simple)이 늘어나 찌그러졌다
//   → 엔진 막대는 숨기고(ScrollBarVisible = 2 Hide), 목록 옆에 시안 그림 막대를 붙인다. 움직이는 건 RootDesk/MyDesk/UIScrollBars.mlua.
//   짝 규칙: 목록 X 의 형제 "XScrollTrack"(scroll_track · 16 폭 · Sliced) + 그 자식 "Thumb"(scroll_thumb_1x · 12 폭 · Sliced · 위 기준).
//   자리: 목록 오른쪽 여백이 16 이상이면 그 안쪽(오른쪽 끝에서 2), 아니면 목록 바깥 오른쪽 2.
//   로비 매치 목록의 가짜 막대(ScrollTrack · ScrollThumb · 표시용)는 지운다(사용자 선택 "가짜 막대 삭제").
// 실행(월드 루트): node Docs/tools/design-ui/fix-scrollbars.cjs
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const GRID = 'MOD.Core.GridViewComponent', SCROLL = 'MOD.Core.ScrollLayoutGroupComponent', UIT = 'MOD.Core.UITransformComponent';
const TRACK_W = 16, THUMB_W = 12, GAP = 2;

const LISTS = {
  AccountRecordGroup: ['Window/Pages/Achievement/Grid', 'Window/Pages/Collection/Grid', 'Window/Pages/History/Grid', 'Window/Pages/Title/Grid'],
  CharacterGroup: ['Window/Content/Inventory/Grid'],
  SkillWindow: ['Window/ListArea'],
  VillageRecordGroup: ['Window/Content/Collection/CollGrid'],
  VillageWorkshopGroup: ['Window/Content/Craft/Grid', 'Window/Content/EnhancePick/PickGrid', 'Window/Content/Potion/Grid'],
  WorldMapGroup: ['MapPanel/DispatchPanel/Win/ListPane/ListView', 'MapPanel/DispatchPanel/Win/Receipt/List'],
};
const ANCHOR = { '0.5,0.5': 'middle-center', '0.5,1': 'top-center' };

let total = 0;
for (const [group, lists] of Object.entries(LISTS)) {
  const b = S.open(WORLD, group);
  const quiet = console.log; console.log = () => {};
  try {
    for (const p of lists) {
      const abs = b.find(p).path;
      const g = b.getComponent(abs, GRID), sc = b.getComponent(abs, SCROLL);
      const t = b.getComponent(abs, UIT);
      const amin = t.AnchorsMin, amax = t.AnchorsMax;
      if (amin.x !== amax.x || amin.y !== amax.y) throw new Error('늘이기 앵커 목록은 아직 안 됨: ' + abs);
      const anchor = ANCHOR[`${+amin.x},${+amin.y}`];
      if (!anchor) throw new Error('앵커 이름 없음: ' + abs);
      const w = t.RectSize.x, h = t.RectSize.y;
      // 목록 중심(앵커 기준) = 위치 + (0.5 − 피벗) × 크기
      const cx = t.anchoredPosition.x + (0.5 - t.Pivot.x) * w;
      const cy = t.anchoredPosition.y + (0.5 - t.Pivot.y) * h;
      const padR = ((g || sc).Padding || {}).right || 0;
      const right = cx + w / 2;
      const tx = padR >= TRACK_W ? right - GAP - TRACK_W / 2 : right + GAP + TRACK_W / 2;
      const name = p.slice(p.lastIndexOf('/') + 1) + 'ScrollTrack';
      const tp = p.slice(0, p.lastIndexOf('/') + 1) + name;
      if (S.has(b, tp)) b.remove(tp);
      S.newImage(b, tp, 'scroll_track', { anchor, pivot: [0.5, 0.5], pos: [tx, cy], size: [TRACK_W, h], enable: false });
      S.newImage(b, tp + '/Thumb', 'scroll_thumb_1x', { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -GAP], size: [THUMB_W, 52] });
      b.patchComponent(abs, g ? GRID : SCROLL, { ScrollBarVisible: 2 });
      quiet(`${group} ${p} → ${name} x=${tx} y=${cy} h=${h} ${padR >= TRACK_W ? '안쪽' : '바깥'}`);
      total++;
    }
  } finally { console.log = quiet; }
  b.write(path.join(WORLD, 'ui', group + '.' + 'ui'), { lint_verbose: !!process.env.LINT_V });
}

// 로비 가짜 막대 삭제
{
  const b = S.open(WORLD, 'LobbyGroup');
  for (const n of ['Window/Matches/ScrollTrack', 'Window/Matches/ScrollThumb']) if (S.has(b, n)) b.remove(n);
  b.write(path.join(WORLD, 'ui', 'LobbyGroup.' + 'ui'), { lint_verbose: !!process.env.LINT_V });
}
console.log('scrollbars', total);
