// 이용권 상점 창(BoostShopGroup) — 디자이너 시안 "이용권 상점 (월드코인)" (WO-053 · 2026-10-07 넘김본).
// 자료: 메월드폴더/리소스파일/빅토리아마을전_UI_넘김_이용권상점_NPC대화창/ (README 요소 번호 #n · 04_화면_참고 1920×1080 캡처에서 좌표를 잼)
// 창 틀은 NPC 창 공통(_npc-frame.cjs 와 같은 980×720 · 캔버스 가운데보다 20px 아래 · 문장 · 제목 띠 · 닫기 자리).
// 좌표 = 부모 중심 기준(y 위가 +). 창 안 좌표는 캡처의 (x − 960, 560 − y).
// 🔴 시안의 #5 내 월드코인 · #6 충전 · #18 잔액 변화 · #19 코인 부족 창은 만들지 않는다 — MSW 에 잔액 · 충전 API 가 없다(WO-053 §0).
// 그림: 기존 ruid-map.json(WO-039 업로드) + 쿠폰 3장은 boost-ruids.json(upload-boost.cjs). ruid-map.json 은 #202 가 잡고 있어 고치지 않는다.
// 실행: node Docs/tools/design-ui/apply-boostshop.cjs   (새 파일을 통째로 만든다 · 다시 돌려도 같은 결과 · 바인딩 다시 주입)
const fs = require('fs');
const path = require('path');
const S = require('./skin.cjs');
const C = S.COLOR;

const WORLD = path.resolve(__dirname, '..', '..', '..');
const UI_PATH = path.join(WORLD, 'ui', 'BoostShopGroup' + '.ui');
const MLUA = path.join(WORLD, 'RootDesk', 'MyDesk', 'Progression', 'BoostShopUIController.mlua');
const BOOST = JSON.parse(fs.readFileSync(path.join(__dirname, 'boost-ruids.json'), 'utf8'));
const coupon = (d) => BOOST['coupon_pass_' + d + 'd'].ruid;

const b = new S.UIBuilder('BoostShopGroup', 27);

const img = (p, key, pos, size, o) => S.newImage(b, p, key, Object.assign({ pos, size }, o || {}));
const txt = (p, text, pos, rect, o) => S.newText(b, p, text, Object.assign({ pos, rect }, o || {}));
const leftTxt = (p, text, left, y, w, h, o) => txt(p, text, [left + w / 2, y], [w, h], Object.assign({ h: 'left' }, o || {}));
const rich = (p) => b.patchComponent(p, S.TXT, { IsRichText: true });
const line = (p, pos, w, hex, a) => b.sprite(p, { anchor: 'middle-center', pos, rect_size: [w, 1], pivot: [0.5, 0.5], color: hex, alpha: a, sprite_type: 0, raycast: false });
const btn = (p, label, pos, size, skin, fontOpt) => {
  b.button(p, label, { anchor: 'middle-center', pos, rect_size: size, pivot: [0.5, 0.5] });
  S.button(b, p, skin);
  S.font(b, p, Object.assign({ font: 'Maple', size: 22, h: 'center', v: 'middle', outline: false, text: label }, fontOpt || {}));
};

// ── #1 화면 막 ──
b.sprite('Dimmer', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080], color: C.veil, alpha: 0.6, sprite_type: 1, raycast: true, enable: false });

// ── #2 창 판 + 문장 · #3 제목 · #4 닫기 ──
img('Window', 'panel_window', [0, -20], [980, 720], { enable: false });
img('Window/Crest', 'deco_crest', [0, 368], [300, 88]);
img('Window/Band', 'panel_title_bar', [0, 306], [780, 64]);
img('Window/TitleCoin', 'ico_coin', [-76, 306], [34, 34]);
txt('Window/Title', '이용권 상점', [22, 306], [200, 42], { font: 'Maple', size: 30, color: C.title, shadow: true });
img('Window/SparkleL', 'deco_sparkle', [-111, 306], [18, 18]);
img('Window/SparkleR', 'deco_sparkle', [111, 306], [18, 18]);
btn('Window/BtnClose', '', [444, 306], [52, 52], { normal: 'btn_close_default', hover: 'btn_close_hover' });

// ── 머리 줄: "이용권" (오른쪽 월드코인 · 충전은 없음) ──
img('Window/HeadCoin', 'ico_coin', [-453, 236], [22, 22]);
leftTxt('Window/HeadLabel', '이용권', -436, 236, 200, 28, { font: 'Noto700', size: 18, color: C.ivory });
line('Window/HeadLine', [0, 212], 930, C.line2, 0.6);

// ── #7 효과 띠 (기본) ──
S.newBox(b, 'Window/EffectBand', { pos: [0, 172], size: [930, 48] });
img('Window/EffectBand/Bg', 'plate_dark', [0, 0], [930, 48]);
b.sprite('Window/EffectBand/Bar', { anchor: 'middle-center', pos: [-462, 0], rect_size: [3, 36], pivot: [0.5, 0.5], color: C.gold, alpha: 1, sprite_type: 0, raycast: false });
img('Window/EffectBand/Chip', 'chip_gold', [-423, 0], [48, 24]);
txt('Window/EffectBand/Chip/Label', '효과', [0, 0], [48, 24], { font: 'Noto700', size: 13 });
leftTxt('Window/EffectBand/Text', '이용권 하나로 <b>두 가지가 함께</b> 2배', -390, 0, 520, 28, { font: 'Noto500', size: 16, color: C.ivory });
rich('Window/EffectBand/Text');
img('Window/EffectBand/ExpIcon', 'icon_account_exp', [220, 0], [22, 22]);
leftTxt('Window/EffectBand/ExpLabel', '계정 경험치', 236, 0, 100, 26, { font: 'Noto500', size: 16, color: C.ivory });
img('Window/EffectBand/HeartIcon', 'icon_balrog_heart', [347, 0], [22, 22]);
leftTxt('Window/EffectBand/HeartLabel', '발록의 심장', 364, 0, 100, 26, { font: 'Noto500', size: 16, color: C.ivory });

// ── #16 사용 중 띠 (효과 띠 자리 · 스크립트가 둘 중 하나만 켠다) ──
S.newBox(b, 'Window/UseBand', { pos: [0, 172], size: [930, 48], enable: false });
img('Window/UseBand/Bg', 'plate_dark', [0, 0], [930, 48]);
b.sprite('Window/UseBand/Bar', { anchor: 'middle-center', pos: [-462, 0], rect_size: [3, 36], pivot: [0.5, 0.5], color: C.green, alpha: 1, sprite_type: 0, raycast: false });
img('Window/UseBand/Chip', 'chip_green', [-415, 0], [62, 24]);
txt('Window/UseBand/Chip/Label', '사용 중', [0, 0], [62, 24], { font: 'Noto700', size: 13 });
leftTxt('Window/UseBand/Title', '계정 경험치 · 발록의 심장 2배', -376, 0, 270, 28, { font: 'Maple', size: 18, color: C.ivory });
leftTxt('Window/UseBand/LeftLabel', '남은 시간', -96, 0, 80, 26, { font: 'Noto500', size: 16, color: C.sub });
leftTxt('Window/UseBand/LeftValue', '', -12, 0, 200, 30, { font: 'FootballB', size: 22, color: C.green });
img('Window/UseBand/Gauge', 'gauge_track', [347, 0], [196, 18]);
b.sprite('Window/UseBand/Gauge/Fill', { anchor: 'middle-center', pos: [0, 0], rect_size: [184, 10], pivot: [0.5, 0.5], image_ruid: S.R('gauge_fill_green'), sprite_type: 3, fill_method: 0, color: C.white, alpha: 1, raycast: false });
b.patchComponent('Window/UseBand/Gauge/Fill', S.SPR, { Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 1 });

// ── #8~#14 이용권 카드 3장 (1 · 3 · 7일 · 표 순서대로 스크립트가 채운다) ──
S.newBox(b, 'Window/Cards', { pos: [0, -68], size: [945, 392] });
const DAYS = [1, 3, 7];
const PRICES = [200, 400, 600];
for (let i = 1; i <= 3; i++) {
  const c = `Window/Cards/Card_${i}`;
  img(c, 'panel_row', [(i - 2) * 315, 0], [300, 392], { raycast: true });
  b.addComponent(c, 'MOD.Core.ButtonComponent');
  S.button(b, c, { normal: 'panel_row', hover: 'panel_row_hover' });   // 마우스 올림 = 빛나는 금테
  b.sprite(`${c}/Coupon`, { anchor: 'middle-center', pos: [0, 128], rect_size: [160, 112], pivot: [0.5, 0.5], image_ruid: coupon(DAYS[i - 1]), sprite_type: 0, color: C.white, alpha: 1, raycast: false });
  img(`${c}/Best`, 'chip_red', [93, 170], [72, 24], { enable: i === 3 });
  txt(`${c}/Best/Label`, '가장 이득', [0, 0], [72, 24], { font: 'Noto700', size: 13 });
  txt(`${c}/Name`, `${DAYS[i - 1]}일 이용권`, [0, 54], [260, 34], { font: 'Maple', size: 24, color: C.title, shadow: true });
  img(`${c}/ExpIcon`, 'icon_account_exp', [-66, 18], [22, 22]);
  leftTxt(`${c}/ExpLine`, '계정 경험치 <color=#7FD6A4>2배</color>', -50, 18, 170, 26, { font: 'Noto500', size: 16, color: C.ivory });
  rich(`${c}/ExpLine`);
  img(`${c}/HeartIcon`, 'icon_balrog_heart', [-66, -13], [22, 22]);
  leftTxt(`${c}/HeartLine`, '발록의 심장 <color=#7FD6A4>2배</color>', -50, -13, 170, 26, { font: 'Noto500', size: 16, color: C.ivory });
  rich(`${c}/HeartLine`);
  txt(`${c}/Daily`, '', [0, -43], [260, 24], { font: 'Noto400', size: 14, color: C.faint });
  line(`${c}/Divider`, [0, -65], 250, C.line2, 0.6);
  S.newBox(b, `${c}/Price`, { pos: [0, -95], size: [200, 42] });
  img(`${c}/Price/Coin`, 'ico_coin', [-34, 0], [28, 28]);
  leftTxt(`${c}/Price/Value`, String(PRICES[i - 1]), -16, 0, 120, 42, { font: 'FootballB', size: 30, color: C.gold });
  btn(`${c}/BtnBuy`, '구매', [0, -152], [252, 50], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed' }, { color: C.goldInk });
}

// ── #15 안내 문구 (시안 문구에서 "부족 → 충전" 은 뺀다 · 지급 시점은 순위 보상) ──
leftTxt('Window/Note1', '· 산 순간부터 <b>실제 시간</b>으로 줄어요(접속하지 않아도 줄어듦) · 사용 중에 또 사면 남은 기간에 더해져요', -463, -305, 930, 24, { font: 'Noto400', size: 14, color: C.faint });
rich('Window/Note1');
leftTxt('Window/Note2', '· 계정 경험치 · 발록의 심장은 매치가 끝난 뒤 순위 보상에서 2배로 받아요 · 월드코인은 MSW 유료 화폐', -463, -330, 930, 24, { font: 'Noto400', size: 14, color: C.faint });

// ── #17 구매 확인 창 (간이판 · 잔액 줄 대신 가격 줄) ──
b.sprite('ConfirmDim', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080], color: C.veil, alpha: 0.5, sprite_type: 1, raycast: true, enable: false });
img('Confirm', 'panel_window', [0, -10], [580, 420], { enable: false });
img('Confirm/Crest', 'deco_crest', [0, 226], [260, 76]);
img('Confirm/Band', 'panel_title_bar', [0, 153], [420, 52]);
txt('Confirm/Title', '구매 확인', [0, 153], [240, 40], { font: 'Maple', size: 28, color: C.title, shadow: true });
img('Confirm/SparkleL', 'deco_sparkle', [-80, 153], [16, 16]);
img('Confirm/SparkleR', 'deco_sparkle', [80, 153], [16, 16]);
b.sprite('Confirm/Coupon', { anchor: 'middle-center', pos: [-112, 60], rect_size: [114, 80], pivot: [0.5, 0.5], image_ruid: coupon(7), sprite_type: 0, color: C.white, alpha: 1, raycast: false });
leftTxt('Confirm/Name', '7일 이용권', -40, 74, 280, 32, { font: 'Maple', size: 24, color: C.title });
leftTxt('Confirm/Desc', '계정 경험치 · 발록의 심장 2배 · 7일', -40, 43, 300, 24, { font: 'Noto500', size: 14, color: C.sub });
img('Confirm/Strip', 'panel_inner', [0, -25], [504, 56]);
img('Confirm/Strip/Coin', 'ico_coin', [-62, 0], [28, 28]);
leftTxt('Confirm/Strip/Value', '600', -42, 0, 90, 40, { font: 'FootballB', size: 24, color: C.gold });
leftTxt('Confirm/Strip/Unit', '월드코인', 40, 0, 120, 28, { font: 'Noto500', size: 16, color: C.sub });
txt('Confirm/Msg', '사면 바로 시작되고, 산 뒤에는 되돌릴 수 없어요.', [0, -84], [500, 26], { font: 'Noto500', size: 16, color: C.ivory });
btn('Confirm/BtnCancel', '취소', [-107, -160], [165, 52], { normal: 'btn_blue_default', pressed: 'btn_blue_pressed' }, { color: C.ivory });
btn('Confirm/BtnBuy', '구매', [92, -160], [190, 52], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed' }, { color: C.goldInk });

// ── #20 시작 알림 (2초) ──
img('Toast', 'panel_tooltip', [0, -426], [494, 52], { enable: false });
img('Toast/Icon', 'icon_check_ok', [-215, 0], [30, 30]);
leftTxt('Toast/Text', '', -192, 0, 420, 28, { font: 'Noto700', size: 16, color: C.ivory });

// 칩 위 글자 대비 규칙(밝은 칩 = 잉크 · 보석 칩 = 흰 글자 + 외곽선)
const chips = S.chipText(b);
console.log('chip text rule', chips.length, chips.map((x) => x.path.split('/').slice(-2).join('/') + ':' + x.kind).join(' '));

b.write(UI_PATH, {
  bind: {
    mlua: MLUA,
    props: {
      dimmer: 'Dimmer', window: 'Window', btnClose: 'Window/BtnClose',
      effectBand: 'Window/EffectBand', useBand: 'Window/UseBand', useLeft: 'Window/UseBand/LeftValue', useFill: 'Window/UseBand/Gauge/Fill',
      cardRoot: 'Window/Cards',
      confirmDim: 'ConfirmDim', confirm: 'Confirm', confirmCoupon: 'Confirm/Coupon', confirmName: 'Confirm/Name', confirmDesc: 'Confirm/Desc',
      confirmPrice: 'Confirm/Strip/Value', btnCancel: 'Confirm/BtnCancel', btnBuy: 'Confirm/BtnBuy',
      toast: 'Toast', toastText: 'Toast/Text',
    },
  },
});
console.log('written BoostShopGroup entities=' + b.listEntities().length);
