// 확인 창(PopupGroup) + 알림 토스트(ToastGroup)에 디자이너 시안(06-popup)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-popup.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const r2 = (v) => Math.round(v * 2) / 2;
const atL = (x, y, h, par) => [r2(x - (par[0] + par[2] / 2)), r2(-((y + h / 2) - (par[1] + par[3] / 2)))];

// 옛 글자(TextComponent)를 TextGUIRendererComponent 로 바꾼다(MSW 내장 Maple 을 쓰려면 이쪽이어야 한다). 같은 엔티티 · 컴포넌트만 교체.
function toGui(b, p, text, size, color, bold) {
  b.upsertComponent(p, S.TXT, S.UIBuilder._textGuiRenderer(text, size, color, bold, 4, {}));
}
// 색만 칠하는 판(o.ruid 가 없으면 ImageRUID 비움 · 있으면 그 9-slice 그림을 틴트) · Sliced
function newFlat(b, p, o) {
  b.sprite(p, { anchor: 'middle-center', pos: o.pos, rect_size: o.size, pivot: [0.5, 0.5], image_ruid: S.R('panel_inner'), sprite_type: 1, color: o.color, alpha: o.alpha == null ? 1 : o.alpha, raycast: false });
  b.patchComponent(p, S.SPR, { ImageRUID: { DataId: o.ruid || '' }, Type: 1 });
}
const ROUNDRECT = 'f5e5fbd6dd224f2d8a5af320436b95f0';   // 게임에 이미 있는 흰 둥근사각 9-slice(테두리 14) — 버튼 영역 모서리를 창 곡선에 맞추려고 쓴다

// ═════════ 확인 창 (PopupGroup) ═════════
{
  const b = S.open(WORLD, 'PopupGroup');
  const PANEL = [280, 150, 640, 332];       // 시안 캔버스에서 창 상자
  const BAND = [294, 164, 612, 64];
  const AREA = [288, 365, 624, 117];
  const P = 'PopupBack/PopupPanel';

  S.tint(b, 'PopupBack', S.COLOR.veil, 0.6);
  b.patchComponent('PopupBack', S.SPR, { Type: 1 });
  S.place(b, P, { pos: [0, 0], size: [640, 332] });
  S.image(b, P, 'panel_window');

  // 버튼 영역(어두운 바탕 · 버튼과 구분선보다 뒤) + 위 1px 선(기존 deco_line 재사용)
  newFlat(b, P + '/ButtonArea', { pos: S.at(...AREA, PANEL), size: [624, 117], color: '#0F182C', ruid: ROUNDRECT });
  S.place(b, P + '/deco_line', { anchor: 'middle-center', pos: S.at(288, 365, 624, 1, PANEL), size: [624, 1] });
  S.tint(b, P + '/deco_line', '#2E3F63', 1);

  // 제목 줄: 띠 + 경고 아이콘 + 제목(런타임 값 · 왼쪽 끝 기준)
  S.newImage(b, P + '/TitleBand', 'panel_title_bar', { pos: S.at(...BAND, PANEL), size: [612, 64] });
  S.newImage(b, P + '/TitleBand/Icon', 'icon_warn', { pos: S.at(523.5, 183, 26, 26, BAND), size: [26, 26] });
  S.newText(b, P + '/TitleBand/Title', '확인', { font: 'Maple', size: 24, color: S.COLOR.title, h: 'left', pivot: [0, 0.5], pos: atL(559.5, 179, 33.5, BAND), rect: [340, 34], overflow: 1 });

  // 메시지(옛 TextComponent → 글자 렌더러)
  toGui(b, P + '/PopupMessage', '', 24, S.COLOR.ivory, true);
  S.place(b, P + '/PopupMessage', { pos: S.at(280, 228, 640, 137, PANEL), size: [552, 137] });
  S.font(b, P + '/PopupMessage', { font: 'Maple', size: 24, color: S.COLOR.ivory, h: 'center', v: 'middle', outline: false, text: '' });

  // 확인 · 취소
  toGui(b, P + '/PopupBtnOK', '확인', 24, S.COLOR.goldInk, true);
  S.place(b, P + '/PopupBtnOK', { pos: S.at(318, 384, 275, 68, PANEL), size: [275, 68] });
  S.button(b, P + '/PopupBtnOK', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
  S.font(b, P + '/PopupBtnOK', { font: 'Maple', size: 24, color: S.COLOR.goldInk, h: 'center', v: 'middle', outline: false, text: '확인' });
  toGui(b, P + '/PopupBtnCancel', '취소', 24, S.COLOR.ivory, true);
  S.place(b, P + '/PopupBtnCancel', { pos: S.at(607, 384, 275, 68, PANEL), size: [275, 68] });
  S.button(b, P + '/PopupBtnCancel', { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' });
  S.font(b, P + '/PopupBtnCancel', { font: 'Maple', size: 24, color: S.COLOR.ivory, h: 'center', v: 'middle', outline: false, text: '취소' });

  // 그리기 순서: 버튼 영역 · 제목 띠는 기존 글자·버튼보다 뒤, 선은 영역 위
  S.back(b, P + '/ButtonArea');
  S.before(b, P + '/deco_line', P + '/PopupBtnCancel');   // (영역 바로 위 · 버튼 아래)

  b.write(path.join(WORLD, 'ui', 'PopupGroup.ui'), {
    bind: {
      mlua: path.join(WORLD, 'RootDesk/MyDesk/UIPopup.mlua'),
      props: { message: P + '/PopupMessage', titleIcon: P + '/TitleBand/Icon', title: P + '/TitleBand/Title' },
    },
  });
  console.log('PopupGroup 적용 끝');
}

// ═════════ 알림 토스트 (ToastGroup) ═════════
{
  const b = S.open(WORLD, 'ToastGroup');
  const T = 'Toast_message';
  // 판: 위 가운데 · 위쪽 끝이 화면 위에서 156(시계·목표 바 아래). 크기·아이콘은 문구에 따라 스크립트가 고른다(기본 = 두 줄형 940x86).
  S.place(b, T, { pivot: [0.5, 1], pos: [0, -156], size: [940, 86] });
  S.image(b, T, 'panel_tooltip');
  b.patchComponent(T, 'MOD.Core.TextComponent', { Text: '' });   // 옛 글자는 비움(문구는 Title / Sub 가 맡는다 · 스크립트가 잡고 있어 지우지 않는다)
  // 두 줄형 기준 좌표(판 가운데 기준)
  S.newImage(b, T + '/IconGem', 'ico_gem', { pos: [-432, 0], size: [28, 28] });
  S.newImage(b, T + '/IconInfo', 'icon_info', { pos: [-326, 0], size: [24, 24], enable: false });
  S.newText(b, T + '/Title', '', { font: 'Noto700', size: 18, color: S.COLOR.ivory, h: 'left', pivot: [0, 0.5], pos: [-404, 13.5], rect: [850, 27], overflow: 1 });
  S.newText(b, T + '/Sub', '', { font: 'Noto500', size: 18, color: S.COLOR.sub, h: 'left', pivot: [0, 0.5], pos: [-404, -13.5], rect: [850, 27], overflow: 1 });

  b.write(path.join(WORLD, 'ui', 'ToastGroup.ui'), {
    bind: {
      mlua: path.join(WORLD, 'RootDesk/MyDesk/UIToast.mlua'),
      props: { iconGem: T + '/IconGem', iconInfo: T + '/IconInfo', title: T + '/Title', sub: T + '/Sub' },
    },
  });
  console.log('ToastGroup 적용 끝');
}
