// 파병 창: 보낼 묶음을 눌러서 고른다 (사용자 2026-10-07 "내가 만든 내 수비대 주황버섯 5마리가 안 떠. 그걸 눌러서 파병 보내기를 눌러야 완료").
//   예전엔 −/+ 스테퍼로 "앞에서부터 N묶음"만 정했다 → 스테퍼 · 그 아래 안내 두 줄(같은 내용이 아래 규칙 띠에도 있다)을 끄고,
//   그 자리에 보유 묶음 칸 10개(5 × 2줄 · 82x52)를 놓는다. 칸 = 몬스터 그림 + "이름 ×마릿수" · 고르면 Sel(금테 판).
//   채우는 쪽 = Npc/CommonNpcUIController(RenderPick · OnPick) · 서버 = LaneStateService.RequestDispatchPick + 뷰 B 행.
// 실행(월드 루트): node Docs/tools/design-ui/fix-dispatch-pick.cjs   (apply-dispatch.cjs 를 다시 돌렸으면 이것도 다시)
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CommonNpcGroup');
const C = S.COLOR;
const CP = [608, 218, 458, 446];      // 편성 판(시안 캔버스 x,y,w,h)
const PR = [624, 314, 426, 112];      // 묶음 칸 자리 = 옛 스테퍼(317~373) + 안내(383~422)
const P = 'Window/Content/Dispatch/CartPanel';
const TW = 82, TH = 52, GX = 4, GY = 8;

const ctr = (p, r, parent, extra) => S.place(b, p, Object.assign({ anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, extra || {}));
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));

const quiet = console.log; console.log = () => {};
try {
  for (const n of ['BtnCartMinus', 'BtnCartPlus', 'CartPlate', 'CartCount', 'Note']) S.place(b, P + '/' + n, { enable: false });

  if (S.has(b, P + '/PickRoot')) b.remove(P + '/PickRoot');
  if (S.has(b, P + '/PickEmpty')) b.remove(P + '/PickEmpty');
  S.newBox(b, P + '/PickRoot', { pos: S.at(...PR, CP), size: [PR[2], PR[3]] });
  for (let i = 0; i < 10; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    const R = [PR[0] + col * (TW + GX), PR[1] + row * (TH + GY), TW, TH];
    const p = `${P}/PickRoot/B_${i}`;
    b.button(p, '', { anchor: 'middle-center', pos: S.at(...R, PR), rect_size: [TW, TH], pivot: [0.5, 0.5], image_ruid: S.R('panel_row_short'), sprite_type: 1, bg_color: '#FFFFFF', font_size: 1, color: '#FFFFFF' });
    S.image(b, p, 'panel_row_short');
    b.patchComponent(p, S.BTN, { Transition: 0 }); // 고름 표시는 Sel 켜고 끄기(대상 줄과 같은 방식)
    S.font(b, p, { text: '' });
    S.place(b, p, { enable: false });
    img(p + '/Sel', 'panel_row_selected', R, R, { enable: false });
    img(p + '/Icon', 'icon_guard', [R[0] + (TW - 28) / 2, R[1] + 3, 28, 28], R);
    b.patchComponent(p + '/Icon', S.SPR, { PreserveSprite: 0 });
    txt(p + '/Label', '', [R[0] + 3, R[1] + 31, TW - 6, 19], R, { font: 'Noto700', size: 12, color: C.ivory });
    b.patchComponent(p + '/Label', S.TXT, { IsRichText: true, BestFit: true, MinSize: 8, MaxSize: 12, Overflow: 0 });
    S.back(b, p + '/Sel');
  }
  txt(P + '/PickEmpty', '보낼 수비대가 없어요 — 몬스터 모집관에서 모집하세요', PR, CP, { font: 'Noto700', size: 14, color: C.off });
} finally { console.log = quiet; }

b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.' + 'ui'), {
  bind: { mlua: path.join(WORLD, 'RootDesk/MyDesk/Npc/CommonNpcUIController.mlua'), props: { pickRoot: P + '/PickRoot', pickEmpty: P + '/PickEmpty' } },
  lint_verbose: !!process.env.LINT_V,
});
console.log('dispatch pick tiles 10');
