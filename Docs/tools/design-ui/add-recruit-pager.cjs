// 몬스터 모집관 창(VillageLifeGroup · 모집 탭)에 카드 쪽 넘김(◀ 1 / 7 ▶)을 더한다 (2차 패치 · 2026-10-13).
// 해금 가능한 종이 34개로 늘어 카드 5장(Card_0~4)에 다 안 들어간다 → 서버가 해금한 종 전부를 보내고(LaneStateService.BuildView recruit),
// 클라(Npc/VillageLifeUIController.mlua RenderPager · OnRecruitPage)가 5장씩 쪽을 나눠 보여 준다.
// 실행(월드 루트에서): node Docs/tools/design-ui/add-recruit-pager.cjs   (다시 돌려도 같은 결과 · 기존 엔티티는 건드리지 않는다 — 새 노드만 더한다)
//
// 새 노드(컨트롤러가 이름 경로로 찾는다 — 바꾸면 안 된다): Window/Content/Recruit/Pager/{BtnPrev, BtnNext, PageText}
//   - Pager 는 처음엔 꺼 둔다. 쪽이 둘 이상일 때만 컨트롤러가 켠다(한 쪽뿐이면 통째로 숨김).
//   - 버튼 = 조련 창 강화 버튼과 같은 작은 금 버튼(btn_gold_default_sm · 꺼짐 btn_gold_disabled_sm) + 창고 넣기 · 꺼내기와 같은 Arrow 그림(꺼지면 회색 반투명).
//   - 글자 "1 / 7" = 풋볼 굵게 18 · 현재 쪽만 금색(IsRichText).
//   - 자리 = 카드 줄(캔버스 y 352~614) 아래 도움말 줄(y 626~650)과 바닥 띠(y 714~) 사이의 빈 줄 y 660~704 한가운데. 도움말 줄은 그대로다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'VillageLifeGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h · 1200x900 캔버스) — apply-life.cjs 와 같은 좌표계
const CNT = [134, 218, 932, 594];
const RC = 'Window/Content/Recruit';

// 쪽 넘김 묶음: 콘텐츠 가운데(x 600) · 세로 가운데 682 — ◀ 64 + 8 + 글자 80 + 8 + ▶ 64 = 224 (위 도움말 줄과 아래 바닥 띠에서 각각 10 떨어진다)
const PG = [488, 660, 224, 44];
const P = RC + '/Pager';
S.newBox(b, P, { pos: S.at(PG[0], PG[1], PG[2], PG[3], CNT), size: [PG[2], PG[3]], enable: false });

const arrowBtn = (name, x, icon) => {
  const p = `${P}/${name}`;
  const r = [x, 660, 64, 44];
  b.button(p, '', { anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], PG), rect_size: [r[2], r[3]], pivot: [0.5, 0.5] });
  S.button(b, p, { normal: 'btn_gold_default_sm', disabled: 'btn_gold_disabled_sm' });
  S.font(b, p, { text: '' });
  S.newImage(b, p + '/Arrow', icon, { pos: [0, 0], size: [24, 24] }); // 그림 켬/끔 색은 컨트롤러 SetArrow
};
arrowBtn('BtnPrev', 488, 'icon_arrow_left');
arrowBtn('BtnNext', 648, 'icon_arrow_right');

// 쪽수 글자: 컨트롤러가 "<color=#E8B64C>현재</color> / 전체" 로 채운다. "7 / 7" 은 물론 두 자리 쪽("10 / 10")도 80 폭 안에 들어간다.
S.newText(b, P + '/PageText', '<color=#E8B64C>1</color> / 1', { pos: S.at(560, 664, 80, 36, PG), rect: [80, 36], font: 'FootballB', size: 20, color: C.sub, h: 'center' });
b.patchComponent(P + '/PageText', S.TXT, { IsRichText: true });

b.write(path.join(WORLD, 'ui', 'VillageLifeGroup.ui'), { lint_verbose: !!process.env.LINT_V });
console.log(`VillageLifeGroup(모집 쪽 넘김) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
