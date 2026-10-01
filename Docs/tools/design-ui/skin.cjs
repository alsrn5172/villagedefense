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
  // 🔴 o.overflow 를 안 줘도 기존 엔티티가 이미 말줄임(1)·자름(2)일 수 있다(2차 묶음 실측: 계정 창 도감 칸 이름 · 칭호 칸 설명이 통째로 안 보였다) → 지금 값으로 판단한다.
  const cur = b.getComponent(p, TXT) || {};
  const ov = (o.overflow != null) ? o.overflow : cur.Overflow;
  if (ov === 1 || ov === 2) {
    const t = b.getComponent(p, 'MOD.Core.UITransformComponent'); const fs0 = o.size || cur.FontSize || 24; const need = Math.ceil(fs0 * 1.6);
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

// ── Football 큰 숫자 기준선 ──
// 🔴 비용 칩의 "라벨(Noto 14) + 큰 숫자(Football 20) + 보유 N(Noto 14)": 시안은 숫자 상자를 라벨 상자보다 5px 위에 둔다(숫자 y 753.5 · 라벨 758.5).
//    게임 글꼴은 가운데 정렬이면 숫자 바닥선이 옆 글자 바닥선과 같아서(실측 · 공방 "89,050 / 300" 줄은 0px) 그 5px 가 그대로 솟음이 됐다(캡처 실측 6px · 사용자 2026-10-02).
//    → 숫자 상자를 아래로 FOOTBALL_NUM_DROP 내린다. 라벨과 같은 가운데에 두는 창(모집 · 관문 · 방어 · 도감 칩)은 이미 맞아서 안 쓴다.
//    런타임에 칩을 다시 배치하는 Item/WorkshopUIController.mlua ShowFootChips 의 numY(-3)와 같은 값이다.
const FOOTBALL_NUM_DROP = 6;
function dropNum(y) { return y + FOOTBALL_NUM_DROP; } // 시안 캔버스 y(위가 작다) → 내린 y


// ── 칩 위 글자 대비 규칙 (디자이너 시안 1790844637-7b1e · 2026-10-02) ──
// 밝은 칩(chip_gold · chip_gray)은 어두운 잉크 글자, 보석 칩(chip_green · chip_blue · chip_red)은 흰 글자 + 짙은 외곽선.
// 키에서 _sm/_lg 를 떼고 판정한다. chip_*_dark · plate_* 는 규칙 대상이 아니다.
// 🔴 이 규칙은 글자를 "다시 쓰는" 것이므로 각 apply 스크립트에서 S.font 로 글자를 다 맞춘 "뒤에" 부른다(안 그러면 덮어써진다).
const CHIP_INK = '#1C1405';      // 시안 chip-ink 글자색
const CHIP_OUTLINE = '#050A16';  // 시안 chip-glow 외곽선색
// 시안 외곽선 = 상하좌우 1px + 0 0 2px. TextGUIRenderer.OutlineWidth 는 TMP 식 상대값이라(기존 글자 0.2 · 기본값 0.2) 1px 에 해당하는 0.25 로 두고, Maker 에서 눈으로 확인해 조정한다.
const CHIP_OUTLINE_WIDTH = 0.25;
// 작은 글자(크기 ≤ 13)는 같은 외곽선이면 획이 뭉친다(확대 사진 · 방어 "최전방") → 얇게. 등급 기준 = 글자 크기 13 이하. Match/UiChipText.mlua 의 outlineWidthSm 과 같은 값.
const CHIP_OUTLINE_WIDTH_SM = 0.15;
const CHIP_OUTLINE_SMALL_MAX = 13;
const INK_SHADOW = { color: '#FFFFFF', alpha: 0.45, ox: 0, oy: -1, soft: 0 };   // 시안 0 1px 0 rgba(255,255,255,.45)
const GLOW_SHADOW = { color: '#000000', alpha: 0.6, ox: 0, oy: -2, soft: 0.1 }; // 시안 0 2px 2px rgba(0,0,0,.6)
const UIT = 'MOD.Core.UITransformComponent';

// 그림 키 → 'ink' | 'glow' | null
function chipKind(key) {
  if (!key || /_dark/.test(key)) return null;
  const base = key.replace(/_(sm|lg)$/, '');
  if (base === 'chip_gold' || base === 'chip_gray') return 'ink';
  if (base === 'chip_green' || base === 'chip_blue' || base === 'chip_red') return 'glow';
  return null;
}
const RUID_KEY = {}; Object.keys(MAP).forEach((k) => { RUID_KEY[MAP[k].ruid] = k; });
function chipKeyOf(b, abs) {
  const c = b.getComponent(abs, SPR); if (!c || !c.ImageRUID) return null;
  const id = c.ImageRUID.DataId || c.ImageRUID; return RUID_KEY[id] || null;
}
function isChipKey(key) { return !!key && /^(chip_|plate_)/.test(key); }
function applyChipRule(b, abs, kind, chipKey, chipAbs, fit) {
  const sh = kind === 'ink' ? INK_SHADOW : GLOW_SHADOW;
  const u = { Underlay: true, UnderlayColor: C(sh.color, sh.alpha), UnderlayOffsetX: sh.ox, UnderlayOffsetY: sh.oy, UnderlaySoftness: sh.soft, UnderlayDilate: 0 };
  if (kind === 'ink') { u.FontColor = C(CHIP_INK); u.OutlineWidth = 0; }
  else { const fsz = (b.getComponent(abs, TXT) || {}).FontSize || 14; u.FontColor = C('#FFFFFF'); u.OutlineColor = C(CHIP_OUTLINE); u.OutlineWidth = fsz <= CHIP_OUTLINE_SMALL_MAX ? CHIP_OUTLINE_WIDTH_SM : CHIP_OUTLINE_WIDTH; }
  // 좌우 여백 ≥ 테두리 두께 + 1px: 글자 상자가 칩 안쪽 폭을 넘으면 줄이고, 칩 자신이 글자를 들고 있으면 Padding 으로 민다.
  const mk = MAP[(chipKey || '')];
  const bd = mk && mk.border_trbl ? Math.max(mk.border_trbl[1], mk.border_trbl[3]) : 0;
  const need = bd + 1;
  const chipT = b.getComponent(chipAbs, UIT);
  const chipW = chipT && chipT.RectSize ? chipT.RectSize.x : 0;
  if (need > 0 && chipW > 0) {
    if (abs === chipAbs) {
      const cur = (b.getComponent(abs, TXT) || {}).Padding || {};
      u.Padding = { left: Math.max(cur.left || 0, need), right: Math.max(cur.right || 0, need), top: cur.top || 0, bottom: cur.bottom || 0 };
    } else {
      const t = b.getComponent(abs, UIT);
      if (fit && t && t.RectSize && t.AnchorsMin && t.AnchorsMax && Math.abs(t.AnchorsMin.x - t.AnchorsMax.x) < 1e-6 && t.RectSize.x > chipW - 2 * need && chipW - 2 * need > 0) {
        b.patchComponent(abs, UIT, { RectSize: { x: chipW - 2 * need, y: t.RectSize.y } });
      }
    }
  }
  b.patchComponent(abs, TXT, u);
}
// b 의 모든 엔티티를 훑어 칩(밝은/보석) 위 글자에 규칙을 건다. 두 번 돌려도 같은 결과.
// - 칩 = SpriteGUIRenderer.ImageRUID 가 ruid-map 의 chip_* 인 엔티티. 글자는 "가장 가까운 칩 조상(또는 자신)"에 속한 TextGUIRenderer 엔티티 전부(자손 글자 포함 · 아이콘은 손대지 않음).
// - opts.skip: 건너뛸 경로 정규식(절대경로 '/ui/<그룹>/...' 에 적용)
// - opts.extra: { '<칩 경로>': ['<글자 경로>', ...] } 글자가 칩의 형제인 경우(칩 그림 엔티티와 글자 엔티티가 따로 있을 때) 칩 규칙을 그 글자에도 건다
// - opts.fit: true 면 칩 안 글자 상자를 칩 폭 − 2×(테두리+1) 로 줄인다(기본 꺼짐 · 게임 글꼴이 시안보다 10~15% 넓어 줄이면 꺾이거나 잘림 → 여백은 칩 폭을 늘려서 맞춘다)
// - opts.dry: true 면 patch 없이 목록만
// 반환: [{ path, kind: 'ink'|'glow', chip: 그림 키 }]  (스크립트가 길이/목록을 로그로 찍는다)
function chipText(b, opts) {
  const quiet = console.log; console.log = () => {}; // 빌더의 "Patched component" 줄을 숨긴다(칩이 많으면 수백 줄)
  try { return chipTextInner(b, opts || {}); } finally { console.log = quiet; }
}
function chipTextInner(b, opts) {
  const skip = opts.skip || null;
  const ents = b.entities.map((e) => e.path);
  const chips = []; // [abs, key, kind]
  for (const abs of ents) { const k = chipKeyOf(b, abs); if (isChipKey(k)) chips.push([abs, k, chipKind(k)]); }
  chips.sort((x, y) => y[0].length - x[0].length); // 깊은 칩이 먼저 = 가장 가까운 칩 조상 판정용
  const owner = (abs) => { for (const c of chips) { if (abs === c[0] || abs.startsWith(c[0] + '/')) return c; } return null; };
  const out = []; const done = new Set();
  const doText = (abs, c) => {
    if (done.has(abs) || !c[2] || (skip && skip.test(abs)) || !b.hasComponent(abs, TXT)) return;
    done.add(abs); if (!opts.dry) applyChipRule(b, abs, c[2], c[1], c[0], !!opts.fit); out.push({ path: abs, kind: c[2], chip: c[1] });
  };
  for (const abs of ents) { const c = owner(abs); if (c) doText(abs, c); }
  for (const chipPath of Object.keys(opts.extra || {})) {
    const cAbs = absPath(b, chipPath); const key = chipKeyOf(b, cAbs); const kind = chipKind(key);
    for (const tp of opts.extra[chipPath]) doText(absPath(b, tp), [cAbs, key, kind]);
  }
  return out;
}

// ── 칩 크기 규칙 (사용자 지시 2026-10-02 · 5차: 칸 폭을 넓히고 전 창을 한 규칙으로 통일) ──
// 게임 글꼴은 시안보다 10~15% 넓어 시안 폭을 그대로 쓰면 글자가 칩 테두리(장식)를 덮는다(최전방 · 재료 부족 · MAX · 꿈의 조각 14).
// 칩 폭 = 글자 실측 폭 + 2 × (테두리 두께 + 안쪽 여백) → 짝수로 올림. 안쪽 여백은 칩 "높이 등급"별로 하나의 값이다(등급 안에서는 반드시 같다).
//   높이 ≤ 22 → 4 · 23~28 → 5 · ≥ 29 → 6
// 글자 폭 = Docs/tools/design-ui/chip-text-width.json (Play 중 TextGUIRendererComponent:GetPreferredWidth 로 잰 실측 · 굵게).
// 런타임에 폭을 계산하는 칩은 Match/UiChipText.mlua 의 Width() 가 같은 식을 쓴다(한쪽을 바꾸면 다른 쪽도).
const CWJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'chip-text-width.json'), 'utf8')).w;
function textW(fontKey, size, text) {
  const f = FONT[fontKey] ? FONT[fontKey][0] : fontKey;
  const v = CWJSON[`${f}|${size}|${text}`];
  if (v == null) throw new Error(`chip-text-width.json 에 실측 없음: ${f}|${size}|${text} (Play 에서 GetPreferredWidth 로 재서 추가)`);
  return v;
}
function chipPad(h) { return h <= 22 ? 4 : (h <= 28 ? 5 : 6); }
function chipBorder(key) { const m = MAP[key]; return m && m.border_trbl ? Math.max(m.border_trbl[1], m.border_trbl[3]) : 0; }
function evenCeil(x) { return Math.ceil(x / 2 - 1e-9) * 2; }
// 칩 폭: key = 칩 그림 키, h = 칩 높이, tw = 글자 실측 폭, extra = 글자 말고 칩 안에 넣는 것(아이콘 등)의 폭
function chipWidth(key, h, tw, extra) { return evenCeil(tw + 2 * (chipBorder(key) + chipPad(h)) + (extra || 0)); }

// 역할표: 같은 글자 · 같은 역할의 칩은 어느 창에서나 같은 글꼴 · 크기 · 높이 → 같은 w×h. 글자는 "가장 긴 값"(숫자는 최대 자릿수).
// text 는 칩에 들어가는 글 중 가장 넓은 것(texts 가 있으면 그 중 최대). key 는 칩 그림.
const CHIP = {
  max:      { key: 'chip_gold',  font: 'Maple',    size: 16, h: 30, text: 'MAX' },                       // 방어 노드/카드/버튼 · 조련 줄 · 공방 강화 · 강화 미리보기
  front:    { key: 'chip_blue',  font: 'Noto700',  size: 13, h: 22, text: '최전방' },                    // 방어 카드
  lack:     { key: 'chip_red',   font: 'Noto700',  size: 13, h: 22, text: '재료 부족' },                 // 모집 카드
  equip:    { key: 'chip_blue',  font: 'Noto700',  size: 13, h: 22, text: '착용' },                      // 공방 선택 · 범례
  boss:     { key: 'chip_red',   font: 'Noto700',  size: 13, h: 22, text: '보스' },                      // 월드맵 툴팁
  exch:     { key: 'chip_gold',  font: 'Maple',    size: 13, h: 22, text: '교환' },                      // 공방 제작 카드
  rec:      { key: 'chip_gold',  font: 'Noto700',  size: 14, h: 25, text: '추천' },                      // 로비 난이도 카드
  me:       { key: 'chip_blue',  font: 'Noto700',  size: 14, h: 21, text: '나' },                        // 방 · 결과 줄
  elim:     { key: 'chip_red',   font: 'Noto700',  size: 14, h: 25, text: '탈락' },                      // 결과 줄
  act:      { key: 'chip_blue',  font: 'Noto700',  size: 14, h: 25, text: '액티브' },                    // 스킬 줄
  pas:      { key: 'chip_green', font: 'Noto700',  size: 14, h: 25, text: '패시브' },                    // 스킬 줄
  full:     { key: 'chip_gray_dark', font: 'Noto700', size: 14, h: 21, text: '가득 참' },               // 로비 매치 줄
  key1:     { key: 'chip_gold_sm', font: 'Maple',  size: 13, h: 22, text: 'W' },                          // HUD 키 칩 한 글자(스킬 Q W E R · 상태 C K F · 퀵슬롯 1 2) — 가장 넓은 글자 W 기준으로 전부 같은 폭
  keyShift: { key: 'chip_gold_sm', font: 'Maple',  size: 13, h: 22, text: 'Shift' },                      // 스킬 HUD Shift
  job:      { key: 'chip_blue',  font: 'Noto700',  size: 13, h: 22, text: '마법사 30' },                 // 공방 카드 직업 태그("전사 10") — 직업 6색 칩 그림 전부 이 크기
  jobName:  { key: 'chip_blue',  font: 'Noto700',  size: 13, h: 22, text: '마법사' },                    // 공방 상세 요구 칩(직업 이름만 · "전사" · "마법사" · "전직업") — 직업 6색 칩 그림 전부 이 크기
  // 레벨 배지(어두운 작은 칩) — 방어 시설 · 월드맵 몬스터 · 마을 기록 플레이어 전부 같은 크기(두 자리 "Lv 99"까지 · 방어 시설은 한 자리뿐이지만 같은 칩이라 같게)
  lvBadge:  { key: 'chip_blue_dark_sm', font: 'FootballB', size: 14, h: 21, text: 'Lv 99' },
};
function roleBox(role, extra) { const r = CHIP[role]; if (!r) throw new Error('없는 칩 역할: ' + role); const tw = textW(r.font, r.size, r.text); return [chipWidth(r.key, r.h, tw, extra), r.h]; }

// 칩 하나를 글자에 맞춰 키운다. 위치는 한쪽 끝(keep: 'left' | 'right' | 'center')을 고정하고 폭만 바꾼다(피벗 · 앵커 무관).
// spec = { key?, font, size, text, h?, extra? } 또는 역할 이름. 글자 자식(칩 안을 꽉 채우는 것)도 새 폭으로 맞춘다. 돌려주는 값 = { w, h, dw }.
function fitChip(b, chipPath, specOrRole, opts) {
  opts = opts || {};
  const spec = typeof specOrRole === 'string' ? CHIP[specOrRole] : specOrRole;
  if (!spec) throw new Error('칩 규칙 없음: ' + specOrRole);
  const abs = absPath(b, chipPath);
  const t = b.getComponent(abs, UIT);
  const key = spec.key || chipKeyOf(b, abs);
  const h = spec.h != null ? spec.h : t.RectSize.y;
  const tw = spec.tw != null ? spec.tw : textW(spec.font, spec.size, spec.text);
  const w = chipWidth(key, h, tw, spec.extra || opts.extra);
  const oldW = t.RectSize.x; const px = t.Pivot ? t.Pivot.x : 0.5;
  const pos = t.anchoredPosition || { x: 0, y: 0 };
  const keep = opts.keep || 'center';
  let nx = pos.x;
  if (keep === 'left') nx = (pos.x - px * oldW) + px * w;
  else if (keep === 'right') nx = (pos.x + (1 - px) * oldW) - (1 - px) * w;
  else nx = (pos.x + (0.5 - px) * oldW) - (0.5 - px) * w;
  b.patch(abs, { pos: [nx, pos.y], rect_size: [w, h] });
  // 글자 자식: 칩을 꽉 채우던 것(가운데 앵커 · 가운데 정렬)은 새 크기로
  if (opts.kids !== false) {
    for (const e of b.entities) {
      if (!e.path.startsWith(abs + '/')) continue;
      if (e.path.slice(abs.length + 1).includes('/')) continue;
      const ct = b.getComponent(e.path, UIT); if (!ct || !b.hasComponent(e.path, TXT)) continue;
      if (ct.AnchorsMin && ct.AnchorsMax && (Math.abs(ct.AnchorsMin.x - ct.AnchorsMax.x) > 1e-6)) continue;
      if (Math.abs(ct.RectSize.x - oldW) < 0.51 || opts.forceKids) {
        const cp = ct.anchoredPosition || { x: 0, y: 0 };
        b.patch(e.path, { pos: [(opts.kidDx || 0), cp.y], rect_size: [w - (opts.kidInset || 0), h] });
      }
    }
  }
  return { w, h, dw: w - oldW, key, tw };
}
// 위치만 옮긴다(가로). 앵커 · 피벗 무관. dx 만큼.
function nudgeX(b, p, dx) { const abs = absPath(b, p); const pos = b.getComponent(abs, UIT).anchoredPosition; b.patch(abs, { pos: [pos.x + dx, pos.y] }); }
function setX(b, p, x) { const abs = absPath(b, p); const pos = b.getComponent(abs, UIT).anchoredPosition; b.patch(abs, { pos: [x, pos.y] }); }
function setSize(b, p, w, h) { const abs = absPath(b, p); const t = b.getComponent(abs, UIT); b.patch(abs, { rect_size: [w, h != null ? h : t.RectSize.y] }); }
function sizeOf(b, p) { const t = b.getComponent(absPath(b, p), UIT); return [t.RectSize.x, t.RectSize.y]; }
function posOf(b, p) { const t = b.getComponent(absPath(b, p), UIT); return [t.anchoredPosition.x, t.anchoredPosition.y]; }

// 시안 캔버스 좌표(왼쪽 위 기준 x,y,w,h) → 부모 상자(같은 좌표계 px,py,pw,ph) 중심 기준 위치
function at(x, y, w, h, parent) { return [Math.round((x + w / 2 - (parent[0] + parent[2] / 2)) * 2) / 2, Math.round(-((y + h / 2) - (parent[1] + parent[3] / 2)) * 2) / 2]; }

module.exports = { UIBuilder, R, C, COLOR, FONT, SPR, TXT, BTN, open, has, place, image, tint, font, button, newImage, newText, newBox, at, isSliced, before, back, front, FOOTBALL_NUM_DROP, dropNum, chipText, chipKind, CHIP_INK, CHIP_OUTLINE, CHIP_OUTLINE_WIDTH, CHIP_OUTLINE_WIDTH_SM, textW, chipPad, chipBorder, evenCeil, chipWidth, CHIP, roleBox, fitChip, nudgeX, setX, setSize, sizeOf, posOf };
