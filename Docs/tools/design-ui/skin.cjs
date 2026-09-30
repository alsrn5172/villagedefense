// 디자이너 시안 적용 공용 헬퍼 (UIBuilder 위에 얹는다).
// - 그림은 이름으로 쓴다: R('panel_window') → ruid-map.json 의 RUID. 표에 없으면 바로 실패한다.
// - 기존 엔티티는 patch / patchComponent 로만 바꾼다(creator 를 다시 부르면 컴포넌트가 통째로 갈려 버튼·글자가 날아간다).
// - 좌표는 부모 중심 기준 anchoredPosition(y 위가 +), 크기는 1920x1080 기준 px.
const fs = require('fs');
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const SPR = 'MOD.Core.SpriteGUIRendererComponent';
const TXT = 'MOD.Core.TextGUIRendererComponent';
const BTN = 'MOD.Core.ButtonComponent';

// design_tokens.json 의 16색
const COLOR = {
  navy900: '#0E1628', navy800: '#16213A', navy700: '#1C2A48', line2: '#3E5282', gold: '#E8B64C', goldInk: '#1C1405',
  title: '#F7E4B5', ivory: '#F3EEE2', sub: '#AEB8CF', faint: '#7C88A4', off: '#56637F', coral: '#F0806F',
  green: '#7FD6A4', blue: '#86B3F2', gem: '#C3A6FF', heart: '#E9566F', veil: '#060A14', white: '#FFFFFF',
};
// 시안 글꼴 → MSW 내장 글꼴 (굵기는 FontStyle 1)
const FONT = { Maple: ['Maple', 1], FootballB: ['Football', 1], FootballL: ['Football', 0], Noto700: ['Default', 1], Noto500: ['Default', 0], Noto400: ['Default', 0], Bazzi: ['Bazzi', 0] };
const H = { left: 1, center: 2, right: 4 };
const V = { top: 256, middle: 512, bottom: 1024 };

function R(key) { const m = MAP[key]; if (!m) throw new Error(`ruid-map 에 없는 그림: ${key}`); return m.ruid; }
function isSliced(key) { return (MAP[key] || {}).mode === 'sliced'; }
function C(hex, a) { const h = hex.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: a == null ? 1 : a }; }

function open(world, name) { const quiet = console.log; console.log = () => {}; const b = UIBuilder.read(path.join(world, 'ui', name + '.ui')); console.log = quiet; return b; }
function has(b, p) { return !!b.find(p); }

// ── 기존 엔티티 ──
function place(b, p, o) { const u = {}; if (o.pos) u.pos = o.pos; if (o.size) u.rect_size = o.size; if (o.anchor) u.anchor = o.anchor; if (o.pivot) u.pivot = o.pivot; if (o.order != null) u.display_order = o.order; if (o.enable != null) u.enable = o.enable; b.patch(p, u); return b; }
function image(b, p, key, o) { o = o || {}; b.patchComponent(p, SPR, { ImageRUID: { DataId: R(key) }, Type: o.type != null ? o.type : (isSliced(key) ? 1 : 0), Color: C(o.color || COLOR.white, o.alpha) }); return b; }
function tint(b, p, hex, a) { b.patchComponent(p, SPR, { Color: C(hex, a) }); return b; }
function font(b, p, o) {
  const u = {}; const f = o.font ? FONT[o.font] : null;
  if (f) { u.Font = f[0]; u.FontStyle = f[1]; }
  if (o.size) u.FontSize = o.size;
  if (o.color) u.FontColor = C(o.color, o.alpha);
  if (o.h) u.HorizontalAlignment = H[o.h];
  if (o.v) u.VerticalAlignment = V[o.v];
  if (o.text != null) u.Text = o.text;
  if (o.overflow != null) u.Overflow = o.overflow; // 0 넘침 · 1 말줄임 · 2 자름 · 3 페이지 (TextOverflowMode)
  if (o.outline === false) u.OutlineWidth = 0;
  if (o.shadow) { u.Underlay = true; u.UnderlayColor = C('#070B16', 1); u.UnderlayOffsetX = 0; u.UnderlayOffsetY = -1; }
  b.patchComponent(p, TXT, u);
  // 말줄임/자름(overflow 1·2)은 상자 높이가 한 줄 높이(글자 크기 ×1.6)보다 작으면 글자가 통째로 사라진다 → 높이를 올려 준다.
  if ((o.overflow === 1 || o.overflow === 2)) {
    const t = b.getComponent(p, 'MOD.Core.UITransformComponent'); const fs0 = o.size || (b.getComponent(p, TXT) || {}).FontSize || 24; const need = Math.ceil(fs0 * 1.6);
    if (t && t.RectSize && t.RectSize.y < need) b.patch(p, { rect_size: [t.RectSize.x, need] });
  }
  return b;
}
// 버튼: 기본 그림 + 상태 그림(올림 · 누름 · 비활성)을 ButtonComponent 전환으로.
function button(b, p, s) {
  image(b, p, s.normal);
  const ref = (k) => (k ? { DataId: R(k) } : null);
  b.patchComponent(p, BTN, { Transition: 2, ImageRUIDs: { HighlightedSprite: ref(s.hover || s.normal), PressedSprite: ref(s.pressed || s.normal), SelectedSprite: ref(s.hover || s.normal), DisabledSprite: ref(s.disabled || s.normal) } });
  return b;
}

// ── 새 엔티티 (이미 있으면 같은 값으로 다시 맞춘다 · 다시 돌려도 안전) ──
function newImage(b, p, key, o) {
  b.sprite(p, { anchor: o.anchor || 'middle-center', pos: o.pos || [0, 0], rect_size: o.size, pivot: o.pivot || [0.5, 0.5], image_ruid: R(key), sprite_type: o.type != null ? o.type : (isSliced(key) ? 1 : 0), color: o.color || COLOR.white, alpha: o.alpha == null ? 1 : o.alpha, raycast: !!o.raycast, enable: o.enable !== false });
  if (o.type === 3) b.patchComponent(p, SPR, { Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 1 });
  if (o.order != null) b.patch(p, { display_order: o.order });
  return b;
}
function newText(b, p, text, o) {
  // 🔴 말줄임/자름(overflow 1·2)은 상자 높이가 한 줄 높이(글자 크기 ×1.6)보다 작으면 글자가 통째로 사라진다(실측 · 18px 글자 + 높이 25) → 높이를 올려 준다.
  const rect0 = o.rect || o.rectSize || o.size_wh;
  if (rect0 && (o.overflow === 1 || o.overflow === 2) && rect0[1] < Math.ceil((o.size || 24) * 1.6)) o = Object.assign({}, o, { rect: [rect0[0], Math.ceil((o.size || 24) * 1.6)] });
  const al = { left: 0, center: 1, right: 2 }[o.h || 'center'] + { top: 0, middle: 3, bottom: 6 }[o.v || 'middle'];
  b.text(p, text, { size: o.size, color: o.color || COLOR.ivory, alignment: al, anchor: o.anchor || 'middle-center', pos: o.pos || [0, 0], rect_size: o.rect || o.rectSize || o.size_wh, pivot: o.pivot || [0.5, 0.5], enable: o.enable !== false });
  font(b, p, { font: o.font, overflow: o.overflow, shadow: o.shadow });
  if (o.order != null) b.patch(p, { display_order: o.order });
  return b;
}
function newBox(b, p, o) { b.empty(p, { anchor: o.anchor || 'middle-center', pos: o.pos || [0, 0], rect_size: o.size, pivot: o.pivot || [0.5, 0.5], enable: o.enable !== false }); if (o.order != null) b.patch(p, { display_order: o.order }); return b; }

// ── 형제 그리기 순서 ──
// 🔴 Maker 는 형제를 "파일 안 배열 순서"대로 그린다(뒤에 있을수록 앞에 보인다). displayOrder 값만 바꿔서는 안 움직인다
//    (2026-10-01 부활 팝업에서 실측: 새 띠가 기존 제목 글자를 덮음). 그래서 배열에서 블록째 옮기고 displayOrder 도 맞춰 적는다.
function absPath(b, p) { const e = b.find(p); if (!e) throw new Error('없는 엔티티: ' + p); return e.path; }
function blockOf(b, abs) { return b.entities.filter((e) => e.path === abs || e.path.startsWith(abs + '/')); }
function renumber(b, parentAbs) {
  let n = 0;
  for (const e of b.entities) { const pp = e.path.slice(0, e.path.lastIndexOf('/')); if (pp === parentAbs) b._entityJson(e).displayOrder = n++; }
}
function moveBlock(b, abs, index) {
  const block = blockOf(b, abs); const rest = b.entities.filter((e) => !block.includes(e));
  const anchor = index(rest);
  rest.splice(anchor, 0, ...block);
  b.entities.length = 0; b.entities.push(...rest);
  renumber(b, abs.slice(0, abs.lastIndexOf('/')));
}
// p 를 ref 바로 뒤(=ref 보다 먼저 그려짐)로
function before(b, p, ref) { const a = absPath(b, p), r = absPath(b, ref); moveBlock(b, a, (rest) => rest.findIndex((e) => e.path === r)); return b; }
// p 를 형제 중 맨 뒤(가장 먼저 그려짐)로
function back(b, p) { const a = absPath(b, p); const parent = a.slice(0, a.lastIndexOf('/')); moveBlock(b, a, (rest) => { const i = rest.findIndex((e) => e.path.startsWith(parent + '/')); return i < 0 ? rest.length : i; }); return b; }
// p 를 형제 중 맨 앞(가장 나중에 그려짐)으로
function front(b, p) { const a = absPath(b, p); moveBlock(b, a, (rest) => rest.length); return b; }

// 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) → 부모 상자(같은 좌표계 px,py,pw,ph) 중심 기준 위치
function at(x, y, w, h, parent) { return [Math.round((x + w / 2 - (parent[0] + parent[2] / 2)) * 2) / 2, Math.round(-((y + h / 2) - (parent[1] + parent[3] / 2)) * 2) / 2]; }

module.exports = { UIBuilder, R, C, COLOR, FONT, SPR, TXT, BTN, open, has, place, image, tint, font, button, newImage, newText, newBox, at, isSliced, before, back, front };
