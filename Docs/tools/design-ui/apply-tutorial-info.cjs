// 튜토리얼 새 안내창 3개를 ui/TutorialGroup.ui 에 더한다 (1.0.6-20-01 · 1.0.6-2-01 · 1.0.6-4-01 · 2026-10-13 · 2차 E).
//   Root/NameTagInfo  몬스터 이름표 창(장면 1-1c)  — 몬스터 그림 1장 + 이름표 색 5단계와 한 줄 설명
//   Root/JobInfo      직업 소개(장면 1-2j)         — 탭 5개(전사 마법사 궁수 도적 해적) · 직업마다 주/부 능력치 · 무기 · 특징 · 스킬 줄 4개(Q W E R / 마법사는 Q Shift E R)
//   Root/TownInfo     마을별 시설 특징(장면 1-4v)  — 탭 5개(헤네시스 엘리니아 커닝시티 페리온 노틸러스) · 카드 3장(포탑 억제기 넥서스) · 특징 줄 3개
//   🔴 새 UI 는 기존 스킨 재활용(사용자 2026-10-13): 판 panel_window · 칩 chip_gold · 금 버튼 btn_gold_* · 탭 btn_blue/btn_gold(계정 창 탭 패턴) · 줄 panel_row · 슬롯 slot_frame · 전직관 그림 thumbnail://NPC.
//   기존 엔티티(Card · Confirm · Fade · Step · BtnQuit)는 건드리지 않는다 — 새 창 3개만 지우고 다시 만든다(다시 돌려도 같은 결과 · 새 창의 UUID 는 바뀌고 .mlua 에 다시 주입된다).
//   창 안 글은 직업 소개 · 마을 특징이 런타임에 TutorialInfoUI.mlua 가 SkillInfo.csv · JobInfo.csv · VillageFacilityTrait.csv · FacilitySprite.csv 에서 다시 쓴다.
//   여기 박는 값은 Maker 에서 열었을 때 보이는 첫 모습(전사 탭 · 헤네시스 탭)과 같은 값이다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-tutorial-info.cjs
const fs = require('fs');
const path = require('path');
const Module = require('module');

const WORLD = path.resolve(__dirname, '..', '..', '..');
// skin.cjs 는 A PC 의 절대 경로로 빌더를 require 한다. 그 경로가 없는 PC 에서는 이 저장소의 .claude 사본으로 돌린다(apply-intro-coach.cjs 와 같다).
const LOCAL_BUILDER = path.join(WORLD, '.claude', 'skills', 'msw-ui-system', 'scripts', 'msw_ui_builder.cjs');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (/msw-ui-system[\\/]scripts[\\/]msw_ui_builder\.cjs$/.test(request) && !fs.existsSync(request) && fs.existsSync(LOCAL_BUILDER)) return LOCAL_BUILDER;
  return origResolve.call(this, request, parent, ...rest);
};
const S = require('./skin.cjs');
const C = S.COLOR;
const MLUA = path.join(WORLD, 'RootDesk/MyDesk/Onboarding/TutorialInfoUI.mlua');

// ── CSV (BOM · 따옴표 · CRLF) ──
function readCsv(rel) {
  const txt = fs.readFileSync(path.join(WORLD, rel), 'utf8').replace(/^﻿/, '');
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
}
const SKILL = {}; readCsv('RootDesk/MyDesk/SkillInfo.csv').forEach((r) => { SKILL[r.SkillId] = r; });
const FIRST = (s) => { const i = s.indexOf('. '); return i < 0 ? s : s.slice(0, i + 1); };   // TutorialInfoUI.FirstSentence 와 같다
const FAC = {}; readCsv('RootDesk/MyDesk/FacilitySprite.csv').forEach((r) => { FAC[r.VillageId + '|' + r.Stage] = r; });

// ── 도구: apply-intro-coach.cjs 의 kit 과 같은 방식(캔버스 [x, y, w, h] → 부모 가운데 기준) ──
function kit(b) {
  const RECT = { '': [0, 0, 1920, 1080], Root: [0, 0, 1920, 1080] };
  const par = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const pos = (p, r) => { const pr = RECT[par(p)]; if (!pr) throw new Error('부모 사각형 없음: ' + p); return S.at(r[0], r[1], r[2], r[3], pr); };
  const quiet = (fn) => { const q = console.log; console.log = () => {}; try { return fn(); } finally { console.log = q; } };
  const k = {
    RECT, b, quiet,
    box(p, r, o = {}) { quiet(() => S.newBox(b, p, Object.assign({ pos: pos(p, r), size: [r[2], r[3]] }, o))); RECT[p] = r; },
    img(p, key, r, o = {}) { quiet(() => S.newImage(b, p, key, Object.assign({ pos: pos(p, r), size: [r[2], r[3]] }, o))); RECT[p] = r; },
    raw(p, ruid, r, o = {}) {
      quiet(() => b.sprite(p, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ruid, sprite_type: o.type != null ? o.type : 0, color: o.color || C.white, alpha: o.alpha == null ? 1 : o.alpha, raycast: !!o.raycast, enable: o.enable !== false }));
      RECT[p] = r;
    },
    solid(p, hex, a, r, o = {}) {
      quiet(() => b.sprite(p, { anchor: o.anchor || 'middle-center', pos: o.anchor === 'stretch' ? [0, 0] : pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], color: hex, alpha: a, sprite_type: 1, raycast: !!o.raycast, enable: o.enable !== false }));
      quiet(() => b.patchComponent(p, S.SPR, { ImageRUID: { DataId: '' }, Type: 1 }));
      RECT[p] = r;
    },
    text(p, t, r, o = {}) {
      quiet(() => S.newText(b, p, t, Object.assign({ pos: pos(p, r), rect: [r[2], r[3]] }, o))); RECT[p] = r;
      if (o.fit) quiet(() => b.patchComponent(p, S.TXT, { BestFit: true, MinSize: o.fit, MaxSize: o.size || 24 }));   // 긴 글자는 BestFit 자동 축소(사용자 2026-10-01)
    },
    btn(p, label, r, s, f) {
      quiet(() => b.button(p, label, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: S.R(s.normal) }));
      quiet(() => S.button(b, p, s));
      quiet(() => S.font(b, p, Object.assign({ text: label, h: 'center', v: 'middle', outline: false }, f || {})));
      RECT[p] = r;
    },
  };
  return k;
}

const b = S.open(WORLD, 'TutorialGroup');
const K = kit(b);
['NameTagInfo', 'JobInfo', 'TownInfo'].forEach((n) => { if (b.find('Root/' + n)) K.quiet(() => b.remove('Root/' + n)); });

// ── 창 틀: 막(Dimmer) + 판(Window) + 칩 + 제목 + 금 버튼 — 큰 설명창(Root/Card)과 같은 크기 규칙(칩 260x46 · 제목 32 · 버튼 200x62 · 창 가장자리 40) ──
function shell(base, rect, chip, title, btnLabel) {
  const [x, y, w, h] = rect;
  K.box(base, [0, 0, 1920, 1080], { enable: false });
  K.solid(base + '/Dimmer', C.veil, 0.55, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true });
  K.img(base + '/Window', 'panel_window', rect, { raycast: true });
  const chipR = [x + w / 2 - 130, y + 32, 260, 46];
  K.img(base + '/Window/Chip', 'chip_gold', chipR);
  K.text(base + '/Window/Chip/Text', chip, chipR, { font: 'Maple', size: 24, color: C.goldInk });
  K.text(base + '/Window/Title', title, [x + 44, y + 100, w - 84, 50], { font: 'Maple', size: 32, color: C.title, h: 'left', shadow: true });
  K.btn(base + '/Window/BtnNext', btnLabel, [x + w - 40 - 200, y + h - 92, 200, 62], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' }, { font: 'Maple', size: 22, color: C.goldInk });
}

// 탭 줄(계정 창 탭 패턴): 파랑 버튼 + 고르면 켜지는 금 판(SelBg) + 글자(Label) [+ 마을 문장]. 탭 5개 폭 200 · 간격 8 · 줄 폭 안에서 가운데.
function tabs(base, rect, names, emblems) {
  K.box(base, rect);
  const total = names.length * 200 + (names.length - 1) * 8;
  const x0 = rect[0] + (rect[2] - total) / 2;
  names.forEach((n, i) => {
    const r = [x0 + i * 208, rect[1], 200, 56];
    const p = `${base}/Tab${i}`;
    K.btn(p, '', r, { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' }, { font: 'Maple', size: 24, color: C.ivory });
    K.img(p + '/SelBg', 'btn_gold_default', r, { enable: i === 0 });
    if (emblems) {
      K.img(p + '/Icon', emblems[i], [r[0] + 30, r[1] + 13, 30, 30]);
      K.text(p + '/Label', n, [r[0] + 66, r[1], 128, 56], { font: 'Maple', size: 24, color: i === 0 ? C.goldInk : C.ivory });
    } else {
      K.text(p + '/Label', n, r, { font: 'Maple', size: 24, color: i === 0 ? C.goldInk : C.ivory });
    }
  });
}

// ═════════ 1) 몬스터 이름표 창 (1-1c) ═════════
// 이름표 색은 S.md [1.0.6-17-01] 의 값(MonsterNameTag.mlua 와 같다): 회색 #B8B8B8 · 흰색 #FFFFFF · 주황 #FF9A3C · 빨강 #FF4A4A · 초록 #6BE36B. 숫자는 넣지 않는다(경계가 바뀌어도 맞게 · 사용자 문구).
{
  const NT = [540, 210, 840, 660];
  const base = 'Root/NameTagInfo';
  shell(base, NT, '몬스터 이름표', '이름표 색을 알아 둬요', '다음');
  const SNAIL = '2db94405cf0445f5be2b60a02c21dda5';   // MonsterInfo.csv 100000(달팽이) IconRUID — 도감 칸이 쓰는 그림
  K.img(base + '/Window/PicBg', 'panel_inner', [890, 382, 140, 112]);
  K.raw(base + '/Window/PicBg/Pic', SNAIL, [912, 390, 96, 96]);
  const ROWS = [
    ['회색', '#B8B8B8', 'Lv.?? 달팽이', '나보다 약해요'],
    ['흰색', '#FFFFFF', 'Lv.?? 달팽이', '나와 비슷해서 잡을 만해요'],
    ['주황', '#FF9A3C', 'Lv.?? 달팽이', '조금 더 세고, 경험치를 조금 덜 줘요'],
    ['빨강', '#FF4A4A', 'Lv.?? 달팽이', '나보다 훨씬 강하고, 경험치를 덜 줘요'],
    ['초록', '#6BE36B', 'Lv.?? 수비대', '나와 적대하지 않아요 (수비대 · 파병 등)'],
  ];
  ROWS.forEach((r, i) => {
    const top = 506 + 54 * i;
    const p = `${base}/Window/Row${i}`;
    K.box(p, [584, top, 752, 46]);
    K.img(p + '/Tag', 'plate_dark_sm', [592, top, 232, 46], { color: '#000000', alpha: 0.8 });   // NPC 이름표처럼 검은 반투명 판
    K.text(p + '/Tag/Text', r[2], [592, top, 232, 46], { font: 'Noto700', size: 22, color: r[1] });
    K.text(p + '/Desc', `<color=${r[1]}><b>${r[0]}</b></color>  ${r[3]}`, [840, top, 488, 46], { font: 'Noto500', size: 21, color: C.ivory, h: 'left', wrap: false, fit: 14 });
  });
}

// ═════════ 2) 직업 소개 (1-2j) ═════════
{
  const JW = [380, 150, 1160, 780];
  const base = 'Root/JobInfo';
  const W = base + '/Window';
  shell(base, JW, '직업 소개', '직업과 스킬을 알아 둬요', '확인');
  tabs(W + '/Tabs', [424, 316, 1072, 56], ['전사', '마법사', '궁수', '도적', '해적']);
  // 첫 모습 = 전사 탭. 전직관 그림은 apply-intro-coach.cjs 의 NPC 표와 같은 RUID(thumbnail:// 로 쓴다).
  const WARRIOR_NPC = 'ec40238056d14dc895e93767d9bf6f90';
  // 왼쪽 정보 판: 전직관 그림 140x200 · 직업 이름 · 주 능력치 · 부 능력치 · 무기
  K.img(W + '/Left', 'panel_inner', [424, 388, 270, 420]);
  K.raw(W + '/Left/Portrait', 'thumbnail://' + WARRIOR_NPC, [489, 404, 140, 200]);
  K.text(W + '/Left/Name', '전사', [434, 612, 250, 46], { font: 'Maple', size: 34, color: C.title, shadow: true });
  const STAT = { STR: '9cb53a68ded14f48aa0aa66bbb3b1fb3', DEX: 'cf2c1cc02e0f4b37bfccb883d02514ad' };   // ruid-map icon_stat_str · icon_stat_dex
  [['PriRow', '주 능력치', 'STR', 668], ['SecRow', '부 능력치', 'DEX', 704], ['WeaponRow', '무기', '한손검', 740]].forEach(([n, label, value, y]) => {
    const p = `${W}/Left/${n}`;
    K.box(p, [438, y, 242, 32]);
    K.text(p + '/Label', label, [438, y, 100, 32], { font: 'Maple', size: 18, color: C.sub, h: 'left' });
    if (n !== 'WeaponRow') K.raw(p + '/Icon', STAT[value], [542, y + 4, 24, 24]);
    K.text(p + '/Value', value, [574, y, 106, 32], { font: 'Maple', size: 22, color: C.ivory, h: 'left', fit: 14 });
  });
  // 오른쪽: 한 줄 특징 띠 + 스킬 줄 4개(키 칩 · 슬롯 · 이름 · 설명 첫 문장 · 오른쪽 위 전직 단계 / 레벨)
  K.box(W + '/Right', [706, 388, 790, 420]);
  K.img(W + '/Right/Trait', 'plate_dark', [706, 388, 790, 48]);
  K.text(W + '/Right/Trait/Text', '가까이서 강하게 싸워요', [722, 388, 758, 48], { font: 'Maple', size: 22, color: C.title, h: 'left', fit: 14 });
  const WARRIOR = [['Q', 'SK_W11'], ['W', 'SK_W21'], ['E', 'SK_W22'], ['R', 'SK_W31']];
  const key1 = S.roleBox('key1'); const keyShift = S.roleBox('keyShift');   // [34, 22] · [58, 22] — 전 창 한 규칙(HUD 키 칩)
  WARRIOR.forEach(([key, id], i) => {
    const sk = SKILL[id];
    const top = 446 + 92 * i;
    const p = `${W}/Right/Row${i}`;
    K.img(p, 'panel_row', [706, top, 790, 86]);
    K.img(p + '/KeyChip', 'chip_gold_sm', [722, top + 32, key1[0], key1[1]]);
    K.text(p + '/KeyChip/Text', key, [722, top + 32, key1[0], key1[1]], { font: 'Maple', size: 13, color: C.goldInk });
    K.img(p + '/KeyShiftChip', 'chip_gold_sm', [722, top + 32, keyShift[0], keyShift[1]], { enable: false });
    K.text(p + '/KeyShiftChip/Text', 'Shift', [722, top + 32, keyShift[0], keyShift[1]], { font: 'Maple', size: 13, color: C.goldInk });
    K.img(p + '/Slot', 'slot_frame', [792, top + 10, 66, 66]);
    K.raw(p + '/Icon', sk.IconRUID, [802, top + 20, 46, 46]);
    K.text(p + '/Name', sk.SkillName, [874, top + 8, 300, 30], { font: 'Maple', size: 24, color: C.ivory, h: 'left', fit: 16 });
    K.text(p + '/Desc', FIRST(sk.Description), [874, top + 40, 606, 42], { font: 'Noto500', size: 17, color: C.sub, h: 'left', v: 'top', wrap: false, fit: 12 });
    const tag = `${key === 'R' ? '궁극기 · ' : ''}${sk.ReqTier}차 전직 · Lv.${sk.ReqLevel}`;
    K.text(p + '/Tag', tag, [1180, top + 8, 300, 28], { font: 'Noto700', size: 16, color: C.gold, h: 'right', fit: 12 });
  });
  // 전사 탭에만 보이는 한 줄(튜토리얼에서 전사로 전직한다)
  K.text(W + '/Note', '이번 튜토리얼에서는 전사로 전직해 볼게요.', [424, 818, 860, 30], { font: 'Maple', size: 22, color: C.gold, h: 'left', shadow: true });
}

// ═════════ 3) 마을별 시설 특징 (1-4v) ═════════
{
  const TW = [380, 150, 1160, 780];
  const base = 'Root/TownInfo';
  const W = base + '/Window';
  shell(base, TW, '마을 시설', '마을마다 시설 특징이 달라요', '다음');
  tabs(W + '/Tabs', [424, 316, 1072, 56], ['헤네시스', '엘리니아', '커닝시티', '페리온', '노틸러스'], ['emblem_henesys', 'emblem_ellinia', 'emblem_kerning', 'emblem_perion', 'emblem_nautilus']);
  K.box(W + '/Cards', [424, 388, 1072, 420]);
  const STAGES = [['TOWER', '포탑', 'fac_tower'], ['SUPPRESSOR', '억제기', 'fac_inhibitor'], ['CORE', '넥서스', 'fac_nexus']];
  // 첫 모습 = 헤네시스(억제기가 직접 공격 · 포탑 피해 ×2 · 가까운 3마리 — VillageFacilityTrait.csv HENESYS 행)
  const FIRST_LINES = { SUPPRESSOR: [['직접 공격', '포탑 피해 ×2'], ['공격 대상', '가까운 3마리']] };
  STAGES.forEach(([stage, name, defKey], i) => {
    const x = 436 + 354 * i;
    const p = `${W}/Cards/Card${i}`;
    K.img(p, 'panel_row', [x, 388, 340, 410]);
    K.text(p + '/Name', name, [x + 20, 406, 300, 40], { font: 'Maple', size: 28, color: C.title, shadow: true });
    K.img(p + '/Divider', 'deco_divider', [x + 26, 452, 288, 14]);
    const fac = FAC['HENESYS|' + stage];
    if (fac && fac.IconRuid) K.raw(p + '/Icon', fac.IconRuid, [x + 112, 474, 116, 116], { type: 0 });
    else K.img(p + '/Icon', defKey, [x + 112, 474, 116, 116]);
    const lines = FIRST_LINES[stage] || [];
    for (let j = 0; j < 3; j++) {
      const top = 610 + 62 * j;
      const rp = `${p}/Row${j}`;
      K.img(rp, 'plate_dark', [x + 16, top, 308, 52], { enable: j < lines.length });
      K.text(rp + '/Label', lines[j] ? lines[j][0] : '특징', [x + 30, top, 128, 52], { font: 'Maple', size: 19, color: C.gold, h: 'left', fit: 12 });
      K.text(rp + '/Value', lines[j] ? lines[j][1] : '값', [x + 160, top, 146, 52], { font: 'Noto700', size: 18, color: C.ivory, h: 'right', fit: 11 });
    }
    K.text(p + '/None', '마을 특성이 없어요', [x + 16, 610, 308, 52], { font: 'Noto700', size: 19, color: C.sub, enable: lines.length === 0 });
  });
  K.text(W + '/Foot', '숫자가 셋이면 시설 Lv1 · Lv2 · Lv3 순서 값이에요.', [424, 814, 860, 26], { font: 'Noto500', size: 18, color: C.sub, h: 'left', enable: false });
}

// 칩 글자 규칙(밝은 칩 = 어두운 글자 + 흰 밑줄) — 새 창 3개 안에서만
const touched = S.chipText(b, { skip: /^(?!\/ui\/TutorialGroup\/Root\/(NameTagInfo|JobInfo|TownInfo)\/)/ });
console.log('[tutorial-info] chipText', touched.length);

// 그리기 순서: 큰 설명창(Card) 위 · 그만두기 확인창(Confirm) 아래 — 확인창이 늘 맨 위에 와야 한다
S.before(b, 'Root/NameTagInfo', 'Root/Confirm');
S.before(b, 'Root/JobInfo', 'Root/Confirm');
S.before(b, 'Root/TownInfo', 'Root/Confirm');

console.log('[tutorial-info] entities', b.listEntities().length);
b.write(path.join(WORLD, 'ui', 'TutorialGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
  bind: {
    mlua: MLUA,
    props: {
      root: 'Root', nameWin: 'Root/NameTagInfo', jobWin: 'Root/JobInfo', townWin: 'Root/TownInfo',
      btnNameNext: 'Root/NameTagInfo/Window/BtnNext', btnJobNext: 'Root/JobInfo/Window/BtnNext', btnTownNext: 'Root/TownInfo/Window/BtnNext',
      jobTabs: 'Root/JobInfo/Window/Tabs', jobLeft: 'Root/JobInfo/Window/Left', jobRight: 'Root/JobInfo/Window/Right', jobNote: 'Root/JobInfo/Window/Note',
      townTabs: 'Root/TownInfo/Window/Tabs', townCards: 'Root/TownInfo/Window/Cards', townFoot: 'Root/TownInfo/Window/Foot',
    },
  },
});
