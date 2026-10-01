// 방 대기 패널(LobbyGroup/RoomHud) + 출발 카운트다운 판(LobbyGroup/CountdownPanel)에 디자이너 시안(02-room)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-room.cjs
// 다시 돌려도 같은 결과가 나온다. apply-lobby.cjs 와 같은 UI 파일을 차례로 고치지만 자기 자식(RoomHud · CountdownPanel)만 만지고 묶는 property 도 각자 것만이라 서로 덮지 않는다.
// 글자를 채우는 쪽은 Match/LobbyUIController.mlua (이름 경로로 찾는다 · 아래 이름을 바꾸면 안 된다).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'LobbyGroup');
const before = b.listEntities().length;
const C = S.COLOR;

// 시안 캔버스 = 화면 왼쪽 위 1180x700 조각이라 캔버스 좌표가 곧 화면 좌표(왼쪽 위 기준)
const ROOM = [24, 176, 440, 512];
const STAT = [44, 254, 400, 42];
const R = 'RoomHud';

const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));

// ═══ 방 패널 판: 왼쪽 위 앵커(화면 왼쪽 위에서 24 · 176) ═══
S.place(b, R, { anchor: 'top-left', pivot: [0, 1], pos: [24, -176], size: [440, 512] });
S.image(b, R, 'panel_tooltip');

// 제목 줄: 난이도 엠블럼 + 제목 + 인원(정원이 차면 스크립트가 금색)
img(R + '/Emblem', 'emblem_3', [44, 194, 48, 48], ROOM);
ctr(R + '/RoomTitle', [104, 201, 230, 33.5], ROOM);
S.font(b, R + '/RoomTitle', { font: 'Maple', size: 24, color: C.ivory, h: 'left', v: 'middle', outline: false });
// 게임 글꼴이 시안보다 넓어 "/ 5" 가 26 폭에서 줄바꿈됐다(캡처 A11) → 폭을 40 으로 늘리고 묶음 전체를 왼쪽으로 14 옮겨 오른쪽 끝(445)을 지킨다.
txt(R + '/CountNum', '1', [379, 197, 30, 42], ROOM, { font: 'FootballB', size: 30, color: C.ivory, h: 'left' });
txt(R + '/CountMax', '/ 5', [405, 208, 40, 29], ROOM, { font: 'FootballB', size: 20, color: C.faint, h: 'left' });

// 안내 줄: 받침 · 아이콘을 평상 / 경고 / 카운트다운 3벌 미리 깔고 스크립트가 하나만 켠다. 글(RoomSub)은 받침보다 앞.
// (경고 = 붉은 칩 그림 · 카운트다운 = 금색 어두운 칩 그림을 늘려 받침으로 쓴다 — 시안의 전용 받침 그림이 없어 대체)
const ST = R + '/Status';
S.newBox(b, ST, { pos: S.at(...STAT, ROOM), size: [400, 42] });
img(ST + '/Plate', 'plate_dark', [0, 0, 400, 42], [0, 0, 400, 42]);
img(ST + '/PlateWarn', 'chip_red_dark', [0, 0, 400, 42], [0, 0, 400, 42], { enable: false });
img(ST + '/PlateCd', 'chip_gold_dark', [0, 0, 400, 42], [0, 0, 400, 42], { enable: false });
img(ST + '/IconInfo', 'icon_info', [58, 262, 26, 26], STAT);
img(ST + '/IconWarn', 'icon_warn', [58, 262, 26, 26], STAT, { enable: false });
img(ST + '/IconClock', 'icon_clock', [58, 262, 26, 26], STAT, { enable: false });
ctr(R + '/RoomSub', [92, 262, 330, 26], ROOM);
S.font(b, R + '/RoomSub', { font: 'Noto700', size: 18, color: C.sub, h: 'left', v: 'middle', outline: false });
S.before(b, ST, R + '/RoomSub');

// 참가자 5칸: 항상 켜 둔다. 바탕 3벌(참가자 · 나 · 빈 자리)을 스크립트가 고른다. 줄 자체 그림은 투명으로(아래 바탕이 대신).
for (let i = 0; i < 5; i++) {
  const Y = 308 + 58 * i;
  const RW = [44, Y, 400, 52];
  const P = `${R}/RoomRow_${i}`;
  ctr(P, RW, ROOM);
  S.tint(b, P, '#FFFFFF', 0);
  img(P + '/BgRow', 'panel_row', [44, Y, 400, 52], RW, { enable: false });
  img(P + '/BgMe', 'panel_row_hover', [44, Y, 400, 52], RW, { enable: false });
  img(P + '/BgEmpty', 'slot_item_drag', [44, Y, 400, 52], RW);
  txt(P + '/EmptyText', '빈 자리', [44, Y + 13.5, 400, 25], RW, { font: 'Noto700', size: 16, color: C.off });
  img(P + '/Crown', 'icon_crown', [56, Y + 15, 22, 22], RW, { enable: false });
  ctr(P + '/Name', [88, Y + 13.5, 206, 25], RW);
  S.font(b, P + '/Name', { font: 'Noto700', size: 18, color: C.ivory, h: 'left', v: 'middle', outline: false, overflow: 2 });
  // 🔴 칩 글자 대비: 시안 31 → 37(글자 + 2 × (테두리 11 + 1)). 게임 글꼴이 넓어 42(안쪽 18) · 오른쪽 끝(376)은 그대로.
  img(P + '/MeChip', 'chip_blue', [334, Y + 15.5, 42, 21], RW, { enable: false });
  S.newText(b, P + '/MeChip/Text', '나', { font: 'Noto700', size: 14, color: C.white, rect: [18, 21] });
  // 심장: 강퇴 버튼이 없는 줄 자리(아이콘 154 · 수 185). 강퇴 버튼이 있는 줄은 스크립트가 72 · 103 으로 옮긴다.
  img(P + '/HeartIcon', 'icon_balrog_heart', [386, Y + 12.5, 24, 24], RW, { enable: false });
  txt(P + '/HeartNum', '0', [414, Y + 13.5, 30, 25], RW, { font: 'FootballB', size: 18, color: C.ivory, h: 'left', enable: false });
  // 강퇴: 이름 BtnKick 유지 · 줄 오른쪽에서 10 안쪽
  S.place(b, P + '/BtnKick', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-10, 0], size: [72, 36] });
  S.button(b, P + '/BtnKick', { normal: 'btn_kick_default', pressed: 'btn_kick_pressed' });
  S.font(b, P + '/BtnKick', { font: 'Noto700', size: 16, color: C.white, h: 'center', v: 'middle', outline: false });
  // 바탕은 글자 · 버튼보다 뒤로(형제 배열 순서)
  S.back(b, P + '/BgEmpty');
  S.back(b, P + '/BgMe');
  S.back(b, P + '/BgRow');
}

// 시작하기 · 나가기 (BtnStart · BtnLeave 는 스크립트가 잡는다 · 글자 색/크기는 스크립트가 상태별로)
ctr(R + '/BtnStart', [44, 608, 195, 60], ROOM);
S.button(b, R + '/BtnStart', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
S.font(b, R + '/BtnStart', { font: 'Maple', size: 24, color: C.goldInk, h: 'center', v: 'middle', outline: false });
ctr(R + '/BtnLeave', [249, 608, 195, 60], ROOM);
S.button(b, R + '/BtnLeave', { normal: 'btn_blue_default', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, R + '/BtnLeave', { font: 'Maple', size: 24, color: C.ivory, h: 'center', v: 'middle', outline: false });

// ═══ 출발 카운트다운 판: 화면 위 가운데(위에서 32 · 340x154). 잠긴 동안만 스크립트가 켠다 ═══
const CD = 'CountdownPanel';
S.newImage(b, CD, 'panel_tooltip', { pos: [0, 431], size: [340, 154], enable: false });
S.newText(b, CD + '/Num', '5', { font: 'Bazzi', size: 64, color: C.gold, pos: [0, 31], rect: [120, 72] });
S.newText(b, CD + '/Text', '초 뒤 출발합니다', { font: 'Maple', size: 20, color: C.ivory, pos: [0, -21], rect: [220, 28] });
S.newImage(b, CD + '/Gauge', 'gauge_track', { pos: [0, -51], size: [300, 20] });
// 채움은 Filled 가로 · 트랙 안쪽 폭 268 (시안 300 은 100% 에서 트랙 밖으로 32 넘친다)
S.newImage(b, CD + '/Gauge/Fill', 'gauge_fill_gold', { anchor: 'middle-left', pivot: [0, 0.5], pos: [16, 0], size: [268, 8], type: 3 });

// 🔴 칩 글자 대비(시안 1790844637-7b1e): 글자를 다 맞춘 뒤에 건다(두 번 돌려도 같은 결과 · apply-lobby 와 같은 파일이라 로비 칩도 같은 값으로 다시 맞는다).
const touched = S.chipText(b);
console.log('chipText', touched.length, touched.map((t) => t.kind + ':' + t.path.replace('/ui/', '')).join(' '));

b.write(path.join(WORLD, 'ui', 'LobbyGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Match/LobbyUIController.mlua'),
    props: { countdownPanel: CD },
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`LobbyGroup(방 대기) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
