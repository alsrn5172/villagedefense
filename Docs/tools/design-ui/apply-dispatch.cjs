// 공용 창(CommonNpcGroup) 중 파병 접수(Content/Dispatch)에 디자이너 시안(13-dispatch)을 입힌다. 창 틀(제목 띠 · 닫기 · 하단 띠 · 주 버튼)은 _npc-frame.cjs 가 같이 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-dispatch.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다(Target_i · Q_i · Name · Label 은 스크립트가 이름으로 잡는다).
// 글자를 채우는 쪽은 Npc/CommonNpcUIController.mlua. 서버 뷰 열이 더 필요한 것(주인 이름)은 하지 않는다.
const path = require('path');
const S = require('./skin.cjs');
const F = require('./_npc-frame.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CommonNpcGroup');
const before = b.listEntities().length;
const C = S.COLOR;

F.frame(b);

// ── 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) ──
const WIN = F.WIN;
const DISP = F.CONTENT;                 // Dispatch = Content 와 같은 상자
const TP = [134, 218, 458, 446];        // 대상 마을 판
const CP = [608, 218, 458, 446];        // 편성 판
const TR = [150, 280, 426, 360];        // 대상 줄 컨테이너
const QR = [632, 472.5, 410, 176];      // 대기열 줄 컨테이너
const QBOX = [624, 464.5, 426, 185.5];  // 대기열 홈
const D = 'Window/Content/Dispatch';
const T = D + '/TargetPanel';
const P = D + '/CartPanel';

const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));

// 파병 창에서만 보이는 제목 깃발(글자 폭이 NPC 이름마다 달라 고정 자리 근사)
img('Window/TitleBar/TitleIconGuard', 'flag_guard', [505, 147, 34, 34], F.TITLE);

// Dispatch 는 Content 를 꽉 채운다(늘림 앵커 그대로).

// ═══ 대상 마을 판 ═══
ctr(T, TP, DISP);
S.image(b, T, 'panel_inner');
img(T + '/TitleIcon', 'ico_home', [150, 234.5, 26, 26], TP);
ctr(T + '/Title', [186, 233.5, 160, 28], TP);
S.font(b, T + '/Title', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false, text: '대상 마을' });
// 🔴 게임 글꼴은 시안 글꼴보다 10~15% 넓어 폭 164.5 에선 "5곳" 이 둘째 줄로 꺾인다(2차 묶음 실측) → 오른쪽 끝(576)은 그대로 두고 왼쪽으로 넓힌다
txt(T + '/TitleNote', '내 마을 제외 · 허브에서는 5곳', [326, 238.5, 250, 18], TP, { font: 'Noto700', size: 13, color: C.faint, h: 'right' });

ctr(T + '/TargetRoot', TR, TP);
for (let i = 0; i < 5; i++) {
  const R = [150, 280 + 72 * i, 426, 64];
  const p = `${T}/TargetRoot/Target_${i}`;
  ctr(p, R, TR);
  S.image(b, p, 'panel_row');
  b.patchComponent(p, S.BTN, { Transition: 0 }); // 고름 · 주인 없음 표시는 Sel / Locked 를 켜고 끄는 걸로(그림 교체)
  S.font(b, p, { text: '' });
  img(p + '/Sel', 'panel_row_selected', R, R, { enable: false });
  img(p + '/Locked', 'panel_row_locked', R, R, { enable: false, alpha: 0.8 });
  img(p + '/Emblem', 'emblem_kerning', [172, R[1] + 12, 40, 40], R);
  ctr(p + '/Name', [228, R[1] + 18, 230, 28], R);
  S.font(b, p + '/Name', { font: 'Maple', size: 20, color: C.ivory, h: 'left', v: 'middle', outline: false });
  img(p + '/OwnerChip', 'chip_gray_dark', [464.5, R[1] + 22, 75.5, 19.5], R, { enable: false });
  txt(p + '/OwnerChip/Text', '주인 없음', [0, 0, 75.5, 19.5], [0, 0, 75.5, 19.5], { font: 'Noto700', size: 13, color: '#C9D2E3' });
  S.back(b, p + '/Locked');
  S.back(b, p + '/Sel'); // Sel 이 맨 뒤 · Locked 는 그 다음(겹치지 않는다)
}

// ═══ 편성 판 ═══
ctr(P, CP, DISP);
S.image(b, P, 'panel_inner');
img(P + '/TitleIcon', 'flag_guard', [624, 234.5, 26, 26], CP);
ctr(P + '/Title', [660, 233.5, 160, 28], CP);
S.font(b, P + '/Title', { font: 'Maple', size: 20, color: C.title, h: 'left', v: 'middle', outline: false, text: '편성' });

// 보유 수비대: 아이콘 + "보유 수비대" + N묶음(금색) + (u마리 · c칸)
img(P + '/HaveIcon', 'icon_guard', [624, 282.5, 24, 24], CP);
txt(P + '/HaveLabel', '보유 수비대', [656, 282, 76, 25], CP, { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
ctr(P + '/CartHave', [732.5, 282, 56, 25], CP);
S.font(b, P + '/CartHave', { font: 'Maple', size: 18, color: C.gold, h: 'left', v: 'middle', outline: false, text: '0묶음' });
txt(P + '/HaveNote', '', [796, 285, 120, 19.5], CP, { font: 'Noto700', size: 14, color: C.faint, h: 'left' });

// 묶음 수 스테퍼: − [받침 + N묶음] +
const BM = [702, 317, 60, 56];
const BP = [912, 317, 60, 56];
ctr(P + '/BtnCartMinus', BM, CP);
S.button(b, P + '/BtnCartMinus', { normal: 'btn_blue_default', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, P + '/BtnCartMinus', { text: '' });
img(P + '/BtnCartMinus/Icon', 'icon_minus', [719, 332, 26, 26], BM);
ctr(P + '/BtnCartPlus', BP, CP);
S.button(b, P + '/BtnCartPlus', { normal: 'btn_blue_default', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
S.font(b, P + '/BtnCartPlus', { text: '' });
img(P + '/BtnCartPlus/Icon', 'icon_plus', [929, 332, 26, 26], BP);
img(P + '/CartPlate', 'plate_dark', [772, 317, 130, 56], CP);
ctr(P + '/CartCount', [772, 317, 130, 56], CP);
S.font(b, P + '/CartCount', { font: 'Maple', size: 24, color: C.ivory, h: 'center', v: 'middle', outline: false, text: '1묶음' });
b.patchComponent(P + '/CartCount', S.TXT, { IsRichText: true });
S.before(b, P + '/CartPlate', P + '/CartCount');

ctr(P + '/Note', [624, 383, 426, 39], CP);
S.font(b, P + '/Note', { font: 'Noto500', size: 13, color: C.faint, h: 'center', v: 'middle', outline: false, text: '고른 묶음은 다음 투입 때 대상 마을 쪽에 합류해요\n합류 전까지는 아래 목록에서 취소할 수 있어요' });

// 대기 중인 파병: 소제목 + 개수 + 구분선 · 홈 · (빈 안내 | 줄 4개)
ctr(P + '/QueueTitle', [624, 432, 100, 22.5], CP);
S.font(b, P + '/QueueTitle', { font: 'Maple', size: 16, color: C.title, h: 'left', v: 'middle', outline: false, text: '대기 중인 파병' });
txt(P + '/QueueCount', '0 / 4', [729.5, 434.5, 34, 18], CP, { font: 'FootballB', size: 13, color: C.faint, h: 'left' });
img(P + '/QueueDivider', 'deco_divider', [765, 436.5, 285, 14], CP);
b.sprite(P + '/QueueBox', { anchor: 'middle-center', pos: S.at(...QBOX, CP), rect_size: [QBOX[2], QBOX[3]], pivot: [0.5, 0.5], color: C.veil, alpha: 0.35, sprite_type: 1, raycast: false });
txt(P + '/QueueEmpty', '대기 중인 파병이 없어요', [632, 472.5, 410, 100], CP, { font: 'Noto700', size: 14, color: C.off });
ctr(P + '/QueueRoot', QR, CP);
for (let i = 0; i < 4; i++) {
  const R = [632, 472.5 + 44 * i, 410, 40];
  const p = `${P}/QueueRoot/Q_${i}`;
  ctr(p, R, QR);
  S.image(b, p, 'plate_dark');
  b.patchComponent(p, S.BTN, { Transition: 0 });
  S.font(b, p, { text: '' });
  img(p + '/Emblem', 'emblem_kerning', [640, R[1] + 7, 26, 26], R);
  // 🔴 "커닝시티 · 주황버섯 Orange Mushroom 5마리" 는 게임 글꼴에선 296 · 14px 안에 안 들어가 "5마리" 가 둘째 줄로 꺾인다(2차 묶음 실측) → 13px · 폭 308(취소 버튼을 50 폭으로 줄여 오른쪽으로)
  ctr(p + '/Label', [676, R[1] + 10, 308, 20], R);
  S.font(b, p + '/Label', { font: 'Noto700', size: 13, color: C.ivory, h: 'left', v: 'middle', outline: false });
  b.patchComponent(p + '/Label', S.TXT, { IsRichText: true });
  // 취소 버튼(전용): 지금까지 줄 전체를 눌러 취소하던 것을 이 버튼으로 옮긴다
  const KB = [986, R[1] + 4, 50, 32];
  b.button(p + '/BtnCancel', '취소', { anchor: 'middle-center', pos: S.at(...KB, R), rect_size: [50, 32], pivot: [0.5, 0.5] });
  S.button(b, p + '/BtnCancel', { normal: 'btn_kick_default', pressed: 'btn_kick_pressed' });
  S.font(b, p + '/BtnCancel', { font: 'Noto700', size: 14, color: C.white, h: 'center', v: 'middle', outline: false, text: '취소' });
}
S.before(b, P + '/QueueBox', P + '/QueueRoot');
S.before(b, P + '/QueueEmpty', P + '/QueueRoot');
S.before(b, P + '/QueueBox', P + '/QueueEmpty');

// ═══ 아래 규칙 안내 · 접수 중지 띠 ═══
img(D + '/HelpIcon', 'icon_help', [134, 683, 22, 22], DISP);
ctr(D + '/DispatchStatus', [164, 674, 902, 40], DISP);
S.font(b, D + '/DispatchStatus', { font: 'Noto700', size: 14, color: C.faint, h: 'left', v: 'middle', outline: false });
const WB = [134, 664, 932, 50];
img(D + '/WarnBar', 'bar_goal_warn', WB, DISP, { enable: false });
img(D + '/WarnBar/Icon', 'icon_warn', [154, 677, 24, 24], WB);
txt(D + '/WarnBar/Text', '', [190, 664, 860, 50], WB, { font: 'Noto700', size: 16, color: '#FFE2DC', h: 'left' });

b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Npc/CommonNpcUIController.mlua'),
    props: Object.assign(F.frameProps(), {
      titleIconGuard: 'Window/TitleBar/TitleIconGuard',
      haveNote: P + '/HaveNote', queueCount: P + '/QueueCount', queueEmpty: P + '/QueueEmpty',
      helpIcon: D + '/HelpIcon', warnBar: D + '/WarnBar', warnText: D + '/WarnBar/Text',
    }),
  },
  lint_verbose: !!process.env.LINT_V,
});
console.log(`CommonNpcGroup(파병 접수 + 창 틀) 적용 끝 — 새 엔티티 ${b.listEntities().length - before}개`);
