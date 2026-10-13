// 몬스터 조련사 창(VillageLifeGroup · 조련 탭)에 줄 쪽 넘김(◀ 1 / 5 ▶)을 더한다 (2차 패치 · 2026-10-13 · 모집 창 add-recruit-pager.cjs 와 같은 결정).
// 줄이 8개(Row_0~7)뿐이라 해금한 종이 8을 넘으면 나머지가 안 보였다(도움말 줄에 "N종 더 있음" 글자만) → 서버가 해금한 종 전부를 보내고
// (LaneStateService.BuildView train · 정렬 = 모집 창과 같은 티어 → 지역 레벨 → id), 클라(Npc/VillageLifeUIController.mlua ApplyPager · OnTrainPage)가 8줄씩 쪽을 나눠 보여 준다.
// 실행(월드 루트에서): node Docs/tools/design-ui/add-train-pager.cjs   (다시 돌려도 같은 결과 · 기존 엔티티는 건드리지 않는다 — 새 노드만 더한다)
//
// 새 노드(컨트롤러가 이름 경로로 찾는다 — 바꾸면 안 된다): Window/Content/Train/Pager/{BtnPrev, BtnNext, PageText}
//   - 모양은 모집 창 Pager 와 같다(작은 금 버튼 64x44 + 화살표 24 + 풋볼 굵게 20 "현재(금색) / 전체"). Pager 는 처음엔 꺼 둔다 — 쪽이 둘 이상일 때만 컨트롤러가 켠다.
//   - 자리 = 머리 줄(HeadLabel "해금한 몬스터" 와 HeadHint "강화 = …" 사이 빈 곳 · 캔버스 y 220~264)의 가운데. 줄 목록(y 270~) 위 6, 아래 보유 칩 줄(y 764~)은 줄이 8개 꽉 차 자리가 없다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageLifeGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) — apply-life.cjs 와 같은 좌표계
const CNT = [134, 218, 932, 594];
const TR = 'Window/Content/Train';

// 쪽 넘김 묶음: ◀ 64 + 8 + 글자 80 + 8 + ▶ 64 = 224 · 왼쪽 끝 458(글자 "해금한 몬스터" 끝 ≈ 331 과 "강화 = …" 시작 ≈ 746 사이 가운데) · 세로 가운데 242
const PG = [458, 220, 224, 44];
const P = TR + '/Pager';
S.newBox(b, P, { pos: S.at(PG[0], PG[1], PG[2], PG[3], CNT), size: [PG[2], PG[3]], enable: false });

const arrowBtn = (name, x, icon) => {
  const p = `${P}/${name}`;
  const r = [x, 220, 64, 44];
  b.button(p, '', { anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], PG), rect_size: [r[2], r[3]], pivot: [0.5, 0.5] });
  S.button(b, p, { normal: 'btn_gold_default_sm', disabled: 'btn_gold_disabled_sm' });
  S.font(b, p, { text: '' });
  S.newImage(b, p + '/Arrow', icon, { pos: [0, 0], size: [24, 24] }); // 그림 켬/끔 색은 컨트롤러 SetArrow
};
arrowBtn('BtnPrev', 458, 'icon_arrow_left');
arrowBtn('BtnNext', 618, 'icon_arrow_right');

S.newText(b, P + '/PageText', '<color=#E8B64C>1</color> / 1', { pos: S.at(530, 224, 80, 36, PG), rect: [80, 36], font: 'FootballB', size: 20, color: C.sub, h: 'center' });
b.patchComponent(P + '/PageText', S.TXT, { IsRichText: true });

b.write(path.join(WORLD, 'ui', 'VillageLifeGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageLifeGroup(조련 쪽 넘김) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
