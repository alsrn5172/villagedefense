// 디자이너 시안(10/5) 두 창 + HUD 도움말 버튼을 새 .ui 3개로 만든다 — 기존 .ui 는 건드리지 않는다.
//   ui/GameIntroGroup.ui  게임 소개(넘기는 7쪽) — 시안 WIN_INTRO (introWin · p1~p7)        GroupOrder 17 (외형 선택 16 위)
//   ui/CoachMarkGroup.ui  처음 하는 사람 안내(클릭 유도) — 시안 WIN_COACH (spot · coach) GroupOrder 18 (월드맵 15 위 · 부활 20 아래)
//   ui/HelpHudGroup.ui    HUD '도움말 H' 버튼 — 시안 상시 HUD 오른쪽 위 줄(H 도움말)          GroupOrder 2 (상태창과 같은 층)
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-intro-coach.cjs
// 다시 돌려도 같은 결과가 나온다(세 파일을 통째로 새로 만든다 · 스크립트 UUID 도 다시 주입한다).
// 좌표 = 1920x1080 캔버스 왼쪽 위 기준 [x, y, w, h] (시안 px 그대로) → skin.cjs 의 at() 로 부모 가운데 기준 위치로 바꾼다.
// 글자는 전부 .ui 에 둔다(Maker 에서 S2 로 바로 고칠 수 있게) — 시안과 실제 조작이 다른 문구는 실제에 맞췄다(아래 '문구 고침').
const fs = require('fs');
const path = require('path');
const Module = require('module');

const WORLD = path.resolve(__dirname, '..', '..', '..');
// skin.cjs 는 A PC 의 절대 경로(skin.cjs 7행)로 빌더를 require 한다. 그 경로가 없는 PC 에서는 이 저장소의 .claude 사본으로 돌린다
// (skin.cjs 는 고치지 않는다 · A PC 에서는 원래 경로가 있으므로 그대로 쓴다).
const LOCAL_BUILDER = path.join(WORLD, '.claude', 'skills', 'msw-ui-system', 'scripts', 'msw_ui_builder.cjs');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (/msw-ui-system[\\/]scripts[\\/]msw_ui_builder\.cjs$/.test(request) && !fs.existsSync(request) && fs.existsSync(LOCAL_BUILDER)) return LOCAL_BUILDER;
  return origResolve.call(this, request, parent, ...rest);
};
const S = require('./skin.cjs');
const { UIBuilder } = S;
const C = S.COLOR;

const INTRO_MLUA = path.join(WORLD, 'RootDesk/MyDesk/Onboarding/GameIntroController.mlua');
const COACH_MLUA = path.join(WORLD, 'RootDesk/MyDesk/Onboarding/CoachMarkController.mlua');

// 틴트용 흰 9-slice(협업-규칙 6-4 · 64x64 반경 12 · border 14) — 막대 · 키 · 점처럼 모서리만 둥근 칸
const WHITE = 'f5e5fbd6dd224f2d8a5af320436b95f0';
// 전직관 NPC 그림 = RootDesk/MyDesk/Models/Npcs/VD_JOB_*.model 의 SpriteRUID (ModelBuilder.read · 2026-10-05) — 시안의 temp/npc_card_* 대신 실제 게임 그림
const NPC = {
  WARRIOR: 'ec40238056d14dc895e93767d9bf6f90', MAGICIAN: 'fb911e3df47b4b54997950df0726285a', ARCHER: '4d71a2a1d659408fbdf5dac3152134e6',
  THIEF: '4801a0f7b2664b8da9b73d2b3ea25fd4', PIRATE: 'f389034efb9b4e29bba08efad1147a24',
};

// ─────────────────────────────────────────────── 공용 도구 ───────────────────────────────────────────────
// 빌더 하나에 붙는 "캔버스 사각형 → 부모 가운데 기준" 도구. RECT 에 경로별 캔버스 사각형을 기억해 자식 위치를 계산한다.
function kit(b) {
  const RECT = { '': [0, 0, 1920, 1080] };
  const par = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const pos = (p, r) => {
    const pr = RECT[par(p)];
    if (!pr) throw new Error('부모 사각형 없음: ' + p);
    return S.at(r[0], r[1], r[2], r[3], pr);
  };
  const quiet = (fn) => { const q = console.log; console.log = () => {}; try { return fn(); } finally { console.log = q; } };
  const k = {
    RECT,
    b,
    root(p, enable) { quiet(() => b.empty(p, { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080], enable })); RECT[p] = [0, 0, 1920, 1080]; },
    box(p, r, o = {}) { quiet(() => S.newBox(b, p, Object.assign({ pos: pos(p, r), size: [r[2], r[3]] }, o))); RECT[p] = r; },
    img(p, key, r, o = {}) { quiet(() => S.newImage(b, p, key, Object.assign({ pos: pos(p, r), size: [r[2], r[3]] }, o))); RECT[p] = r; },
    // RUID 로 바로(NPC 그림 · 새 안내 그림)
    raw(p, ruid, r, o = {}) {
      quiet(() => b.sprite(p, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ruid, sprite_type: o.type != null ? o.type : 0, color: o.color || C.white, alpha: o.alpha == null ? 1 : o.alpha, raycast: !!o.raycast, enable: o.enable !== false }));
      RECT[p] = r;
    },
    // 흰 9-slice 를 색칠한 둥근 칸
    fill(p, hex, a, r, o = {}) {
      quiet(() => b.sprite(p, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: WHITE, sprite_type: o.type != null ? o.type : 1, color: hex, alpha: a, raycast: !!o.raycast, enable: o.enable !== false }));
      RECT[p] = r;
    },
    // 그림 없는 단색 사각형(모서리 각진) — PopupGroup/PopupBack 과 같은 방식(ImageRUID 빈 값 · Sliced 여야 그려진다)
    solid(p, hex, a, r, o = {}) {
      quiet(() => b.sprite(p, { anchor: o.anchor || 'middle-center', pos: o.anchor === 'stretch' ? [0, 0] : pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], color: hex, alpha: a, sprite_type: 1, raycast: !!o.raycast, enable: o.enable !== false }));
      quiet(() => b.patchComponent(p, S.SPR, { ImageRUID: { DataId: '' }, Type: 1 }));
      RECT[p] = r;
    },
    text(p, t, r, o = {}) { quiet(() => S.newText(b, p, t, Object.assign({ pos: pos(p, r), rect: [r[2], r[3]] }, o))); RECT[p] = r; },
    // 45° 돌리기(UIRotation z 45 = QuaternionRotation 0,0,0.383,0.924 · Play 실측)
    rot45(p) { quiet(() => b.patchComponent(p, 'MOD.Core.UITransformComponent', { QuaternionRotation: { x: 0, y: 0, z: 0.38268343, w: 0.92387953 } })); },
    // 마름모 = 단색 칸을 45° 돌린 것. half = 가운데에서 꼭짓점까지(대각선 절반) → 칸 한 변 = half × √2
    //   (다각형 PolygonGUIRenderer · 선 LineGUIRenderer 는 Play 에서 그려지지 않았다 · 2026-10-05 실측 → 쓰지 않는다)
    diamond(p, cx, cy, half, hex, a) { const s = half * Math.SQRT2; k.solid(p, hex, a == null ? 1 : a, [cx - s / 2, cy - s / 2, s, s]); k.rot45(p); },
    // 가로 그라데이션 띠: 단색 칸(모서리 각진)을 잘게 이어 붙인다 — stops = [[0~1 위치, '#색'], ...]
    hgrad(p, r, stops, n) {
      k.box(p, r);
      const lerp = (t) => { let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++; const [t0, c0] = stops[i]; const [t1, c1] = stops[i + 1]; const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); const h = (c, j) => parseInt(c.slice(1 + j * 2, 3 + j * 2), 16); return '#' + [0, 1, 2].map((j) => Math.round(h(c0, j) + (h(c1, j) - h(c0, j)) * u).toString(16).padStart(2, '0')).join(''); };
      const w = r[2] / n;
      for (let i = 0; i < n; i++) k.solid(`${p}/S${i + 1}`, lerp((i + 0.5) / n), 1, [r[0] + i * w - 0.5, r[1], w + 1, r[3]]);
    },
    btn(p, label, r, s, f) {
      quiet(() => b.button(p, label, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: S.R(s.normal) }));
      quiet(() => S.button(b, p, s));
      quiet(() => S.font(b, p, Object.assign({ text: label, h: 'center', v: 'middle', outline: false }, f || {})));
      RECT[p] = r;
    },
    // 그림 없는 글자 버튼(건너뛰기)
    textBtn(p, label, r, f) {
      quiet(() => b.button(p, label, { anchor: 'middle-center', pos: pos(p, r), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], bg_color: { r: 0, g: 0, b: 0, a: 0 } }));
      quiet(() => S.font(b, p, Object.assign({ text: label, outline: false }, f || {})));
      RECT[p] = r;
    },
  };
  return k;
}

// 게임 기본 글꼴 폭 어림(줄 수 · 상자 높이용). 한글 1em · 공백 0.3em · 그 밖 0.55em, 게임 글꼴이 시안보다 넓어 ×1.08.
function estW(s, size) {
  const plain = String(s).replace(/<[^>]+>/g, '');
  let w = 0;
  for (const ch of plain) { const c = ch.codePointAt(0); w += (c >= 0x1100 ? 1.0 : (ch === ' ' ? 0.3 : 0.55)) * size; }
  return w * 1.08;
}
const nLines = (s, size, width) => Math.max(1, Math.ceil(estW(s, size) / width));

// ─────────────────────────────────────────────── 게임 소개 ───────────────────────────────────────────────
const WIN = [320, 120, 1280, 840];       // 창(가운데) — 시안 frame({x:60,y:70,w:1280,h:840}) 를 1920 캔버스 가운데로
const BODY_X = 352; const BODY_W = 1216;  // 몸통 좌우 여백 32
const ILLU_Y = 282;                        // 그림 판 위 = 머리줄(226~268) + 14
const KEY = [352, 782, 1216, 56];          // 핵심 한 줄(창 아래 띠 위 18)
const FOOT = [324, 856, 1272, 100];        // 아래 띠(창 안쪽 · 아래 4 띄움)

// 쪽 제목 · 핵심 한 줄 (시안 INTRO_T · INTRO_M) — 고친 곳: 4쪽 제목의 긴 줄표(메이플체에 없음) · 4 · 5 · 7쪽 핵심
const TITLES = ['어떤 게임인가요?', '30분의 흐름', '레벨업 길잡이', '전직 · Lv 10 · 20 · 30', '내 마을 차지하고 지키기', '이기는 법', '조작키'];
const KEYLINES = [
  'Lv 30까지 키우고, 내 마을을 지키면서, 발록을 가장 먼저 쓰러뜨리면 이겨요.',
  '1페이즈(4:30) 전까지는 사냥에 집중하고, Lv 10이 되면 바로 전직 → 마을 차지.',
  '레벨이 오르면 C(능력치) · K(스킬)에 빨간 알림이 없는지 꼭 확인해요.',
  'Lv 10 → 전직관 5명 중 한 명을 클릭 → 전직 → 바로 마을 정하러.',            // 시안: 한 명에게 Space
  '넥서스가 부서지면 끝. 웨이브 사이사이 마을 NPC에게서 시설을 강화해요.',      // 시안: V(내 마을)에서
  '3페이즈에는 마을을 버티면서 발록에게 먼저 가는 사람이 이겨요.',
  '모르는 키가 있으면 H 로 이 소개를 언제든 다시 볼 수 있어요.',              // 시안: F1, 이 소개는 H
];
const GOLD = '#E8B64C'; const CORAL = '#FF8A7A';
const g = (t) => `<color=${GOLD}><b>${t}</b></color>`;
const r = (t) => `<color=${CORAL}><b>${t}</b></color>`;
// 설명 줄 (시안 p1~p7 의 pt) — 고친 곳: 4쪽 1줄(Space → 클릭) · 5쪽 2줄(V → 마을 NPC) · 7쪽 전부(F1 · 조작키 버튼 없음)
const BULLETS = [
  [`<b>5명</b>이 빅토리아 아일랜드에서 <b>30분</b> 동안 겨루는 생존 게임이에요.`,
    `다섯 마을(헤네시스 · 페리온 · 엘리니아 · 커닝시티 · 노틸러스) 중 <b>하나를 먼저 차지</b>해 내 마을로 키워요.`,
    `직업(전사 · 마법사 · 궁수 · 도적 · 해적)은 마을과 상관없이 <b>자유롭게</b> 골라요.`,
    `${g('가장 먼저 발록을 쓰러뜨리면 즉시 승리')}. 넥서스가 부서지면 탈락이에요.`],
  [`<b>0 · 0.5페이즈 (0:00 ~ 4:30)</b> 사냥으로 레벨을 올려요. Lv 10이 되면 전직하고 마을을 차지해요.`,
    `<b>1페이즈 성장 (4:30~)</b> 7:30에 미니언이 생기고 11:00 · 14:30에 웨이브가 마을을 공격해요.`,
    `<b>2페이즈 견제 (16:30~)</b> 다른 마을에 몬스터를 보낼 수 있고(파병), 쓰러지면 내 마을에서 부활해요.`,
    `${r('3페이즈 결전 (24:30~)')} 웨이브가 1분마다 와요. 넥서스가 버틸 때 서둘러 발록에게!`],
  [`몬스터를 잡으면 경험치가 올라요. <b>레벨이 오르면 AP</b>(능력치)와 <b>SP</b>(스킬)가 생겨요. <b>C</b> 캐릭터 창 · <b>K</b> 스킬 창에서 찍어요.`,
    `빨간 알림이 붙은 버튼은 찍을 게 남았다는 뜻이에요. 잘 모르겠으면 <b>자동 분배</b>를 눌러요.`,
    `사냥터 위치와 몬스터 레벨은 <b>M</b> 월드맵에서 볼 수 있어요.`],
  [`<b>Lv 10</b>이 되면 전직관 <b>5명</b>이 서 있는 곳으로 가요. 원하는 직업의 전직관을 <b>클릭</b>해 말을 걸면 전직할 수 있어요.`,
    `직업은 <b>마음대로</b> 골라요. 어느 마을을 차지할지와 상관없어요. 한 번 고르면 바꿀 수 없어요.`,
    `<b>Lv 20 · 30</b>이 되면 같은 전직관에게 다시 가서 2차 · 3차 전직(새 스킬 · 궁극기).`,
    `전직을 마치면 바로 <b>마을을 정하러</b> 가요.`],
  [`전직 뒤 <b>빈 마을의 넥서스</b>를 누르면 내 마을이 돼요(Lv 10부터 · 먼저 누른 사람이 주인).`,
    `웨이브는 <b>포탑 → 억제기 → 넥서스</b> 순서로 밀고 와요. <b>마을 NPC</b>에게서 시설을 강화 · 수리하고, 몬스터 모집관에게서 수비대를 모아요.`,
    `웨이브를 막으면 <b>빅토리아 주화</b>, 마을 필드에서는 <b>지역 재화</b>를 얻어요. 시설 · 수비대에 써요.`,
    `${r('넥서스가 부서지면 탈락')}이고, 남은 판은 관전해요.`],
  [`발록은 <b>혼자 들어가는 방</b>에서 1 : 1로 싸워요. 가장 먼저 쓰러뜨린 사람이 나오면 모두에게 알림이 뜨고 바로 끝나요.`,
    `3페이즈에는 웨이브가 1분마다 와요. <b>마을을 버틸 수 있을 때</b> 발록에게 가는 게 핵심이에요.`,
    `결과 창에서 순위 보상(발록의 심장 · 계정 경험치)을 받아요.`],
  [`색이 칠해진 키만 써요. <b>어두운 키</b>는 지금 게임에서 쓰지 않아요.`,
    `이 소개는 오른쪽 위 <b>도움말</b> 버튼이나 <b>H</b> 키로 언제든 다시 열 수 있어요.`],
];
const ILLU_H = [290, 290, 300, 340, 260, 290, 400];

function buildIntro() {
  const b = new UIBuilder('GameIntroGroup', 17, true);
  const K = kit(b);
  K.root('Root', false);
  // 막: 마을(게임) 화면 위 남색 70% — 시안 E1 (temp/town_bg 는 시안용 · 게임에서는 실제 화면이 비친다)
  K.solid('Root/Dimmer', C.veil, 0.7, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true });
  // 창 판 · 문장 · 제목 띠 · 제목 · 닫기 (_npc-frame 과 같은 순서: 문장 → 띠 → 글자)
  K.img('Root/Window', 'panel_window', WIN, { raycast: true });
  K.img('Root/Window/Crest', 'deco_crest', [810, 68, 300, 88]);
  K.img('Root/Window/Band', 'panel_title_bar', [408, 142, 1104, 64]);
  K.text('Root/Window/Title', '게임 소개', [810, 153, 300, 42], { font: 'Maple', size: 30, color: C.title, shadow: true });
  K.img('Root/Window/Title/SparkleL', 'deco_sparkle', [850, 165, 18, 18]);
  K.img('Root/Window/Title/SparkleR', 'deco_sparkle', [1052, 165, 18, 18]);
  K.solid('Root/Window/Title/LineL', '#E9B24A', 0.75, [768, 173, 70, 2]);
  K.solid('Root/Window/Title/LineR', '#E9B24A', 0.75, [1082, 173, 70, 2]);
  K.btn('Root/Window/BtnClose', '', [1528, 148, 52, 52], { normal: 'btn_close_default', hover: 'btn_close_hover', pressed: 'btn_close_hover' });

  K.box('Root/Window/Pages', [324, 220, 1272, 636]);
  const PAGE = (i) => `Root/Window/Pages/P${i + 1}`;
  for (let i = 0; i < 7; i++) {
    const P = PAGE(i);
    K.box(P, [324, 220, 1272, 636], { enable: i === 0 });
    // 머리줄: 금색 "n / 7" + 큰 쪽 제목 (시안 K5)
    K.text(P + '/Num', `${i + 1} / 7`, [BODY_X, 240, 48, 24], { font: 'Maple', size: 16, color: C.gold, h: 'left' });
    K.text(P + '/Title', TITLES[i], [BODY_X + 54, 226, 1100, 42], { font: 'Maple', size: 30, color: C.title, h: 'left', shadow: true });
    // 그림 판 (시안 K10)
    const IL = [BODY_X, ILLU_Y, BODY_W, ILLU_H[i]];
    K.img(P + '/Illu', 'panel_inner', IL);
    PAGES[i](K, P + '/Illu', [IL[0] + 22, IL[1] + 22, IL[2] - 44, IL[3] - 44]);
    // 설명 목록 (시안 K11) — 금 마름모 + 한 줄(넘치면 두 줄)
    let y = IL[1] + IL[3] + 14;
    K.box(P + '/Bullets', [BODY_X, y, BODY_W, KEY[1] - y]);
    BULLETS[i].forEach((t, j) => {
      // 줄 수 = 직접 넣은 줄바꿈 + 1 (게임 글꼴로 1216 폭 안에 전부 한 줄로 들어갔다 · Play 실측. 어림값 nLines 는 경고용)
      const lines = (t.match(/\n/g) || []).length + 1;
      if (nLines(t, 18, BODY_W - 18) > lines) console.log(`  · ${i + 1}쪽 ${j + 1}줄은 어림으로 넘칠 수 있음 — 화면으로 확인`);
      const h = lines * 28;
      K.diamond(`${P}/Bullets/D${j + 1}`, BODY_X + 4, y + 14, 5.66, C.gold, 1);
      K.text(`${P}/Bullets/T${j + 1}`, t, [BODY_X + 18, y, BODY_W - 18, h], { font: 'Noto500', size: 18, color: C.ivory, h: 'left', v: 'top' });
      y += h + 10;
    });
    if (y - 10 > KEY[1]) console.log(`⚠ ${i + 1}쪽 설명이 핵심 줄(${KEY[1]})을 넘을 수 있음: 끝 y ${y - 10}`);
    // 이 쪽 핵심 한 줄 (시안 K13) — 금빛 띠 + 왼쪽 금 선 + '핵심' 칩
    K.fill(P + '/KeyLine', C.gold, 0.16, KEY);
    K.solid(P + '/KeyLine/Bar', C.gold, 1, [KEY[0], KEY[1], 3, KEY[3]]);
    K.img(P + '/KeyLine/Chip', 'chip_gold', [372, 798, 54, 24]);
    K.text(P + '/KeyLine/Chip/Text', '핵심', [372, 798, 54, 24], { font: 'Maple', size: 14, color: C.goldInk });
    K.text(P + '/KeyLine/Text', KEYLINES[i], [440, 795, 1110, 30], { font: 'Noto700', size: 18, color: C.ivory, h: 'left' });
  }

  // 아래 띠: 금 윗선 · 쪽 표시 점 · 건너뛰기 · 이전 · 다음 (시안 K6~K9)
  K.box('Root/Window/Foot', FOOT);
  K.solid('Root/Window/Foot/Bg', C.navy900, 0.3, [324, 857, 1272, 99]);
  K.solid('Root/Window/Foot/TopLine', '#E9B24A', 0.35, [324, 856, 1272, 1]);
  K.box('Root/Window/Foot/Dots', [350, 901, 140, 10]);
  for (let d = 0; d < 7; d++) {
    // 왼쪽 끝 기준(middle-left) — 스크립트(LayoutDots)가 쪽마다 폭 · 색 · 위치를 다시 준다
    const w = d === 0 ? 28 : 10; const x = d === 0 ? 14 : 28 + 6 + (d - 1) * 16 + 5;
    b.sprite(`Root/Window/Foot/Dots/D${d + 1}`, { anchor: 'middle-left', pivot: [0.5, 0.5], pos: [x, 0], rect_size: [w, 10], image_ruid: WHITE, sprite_type: 1, color: d === 0 ? C.gold : '#3E5282', alpha: 1, raycast: false });
  }
  K.textBtn('Root/Window/Foot/BtnSkip', '건너뛰기', [1080, 891, 88, 30], { font: 'Noto700', size: 16, color: C.faint, h: 'right', v: 'middle' });
  K.btn('Root/Window/Foot/BtnPrev', '이전', [1184, 875, 170, 62], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' }, { font: 'Maple', size: 20, color: C.ivory, shadow: true });
  // 다음: 피벗 오른쪽 — 마지막 쪽에 폭 240 으로 늘려도 오른쪽 끝(1570)이 그대로
  b.button('Root/Window/Foot/BtnNext', '다음', { anchor: 'middle-center', pos: [1570 - 960, 0], rect_size: [200, 62], pivot: [1, 0.5], image_ruid: S.R('btn_gold_default') });
  S.button(b, 'Root/Window/Foot/BtnNext', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
  S.font(b, 'Root/Window/Foot/BtnNext', { text: '다음', font: 'Maple', size: 20, color: C.goldInk, h: 'center', v: 'middle', outline: false });

  const touched = S.chipText(b);
  console.log('[intro] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'GameIntroGroup.ui'), {
    lint_verbose: !!process.env.LINT_V,
    bind: {
      mlua: INTRO_MLUA,
      props: {
        root: 'Root', pagesRoot: 'Root/Window/Pages', dotsRoot: 'Root/Window/Foot/Dots',
        btnPrev: 'Root/Window/Foot/BtnPrev', btnNext: 'Root/Window/Foot/BtnNext', btnSkip: 'Root/Window/Foot/BtnSkip', btnClose: 'Root/Window/BtnClose',
      },
    },
  });
}

// ── 쪽 그림 (시안 p1 ~ p7 · 판 안쪽 사각형 IN = 판 - 여백 22) ──
// 카드 3장(1쪽 · 6쪽) 공통 칸 위치: 안쪽 폭 1172 · 간격 18 → 378 x 3
const card3 = (IN) => [0, 1, 2].map((c) => [IN[0] + c * (378 + 18), IN[1], 378, IN[3]]);

function p1(K, base, IN) {
  const cards = [['ico_sword', '키우기', '사냥으로 Lv 1 → 30. 10 · 20 · 30에 전직해 새 스킬'], ['ico_home', '지키기', '마을 하나를 차지하고 포탑 → 억제기 → 넥서스를 지킨다'], ['icon_balrog_heart', '쓰러뜨리기', '가장 먼저 발록을 쓰러뜨린 사람이 바로 승리']];
  card3(IN).forEach((R, i) => {
    const P = `${base}/Card${i + 1}`; const cx = R[0] + R[2] / 2; const t = R[1] + 18;
    K.img(P, 'panel_row', R);
    K.text(P + '/Num', String(i + 1), [cx - 20, t, 40, 20], { font: 'Maple', size: 14, color: C.gold });
    K.img(P + '/Icon', cards[i][0], [cx - 36, t + 32, 72, 72]);
    K.text(P + '/Name', cards[i][1], [cx - 170, t + 116, 340, 34], { font: 'Maple', size: 24, color: C.ivory });
    K.text(P + '/Desc', cards[i][2], [cx - 160, t + 160, 320, 50], { font: 'Noto500', size: 16, color: C.sub });
  });
}

function p2(K, base, IN) {
  // 30분 타임라인 — 시안 timeline(): x(m) = 30 + m/30 * 1040 (안쪽 왼쪽 기준)
  const X = (m) => IN[0] + 30 + (m / 30) * 1040;
  const T = IN[1];
  // 범례: 빨간 마름모 + 두 글
  K.diamond(`${base}/LegendDiaW`, IN[0] + 37, T + 30, 12.7, '#FFFFFF');
  K.diamond(`${base}/LegendDia`, IN[0] + 37, T + 30, 9.9, '#F0564E');
  K.text(`${base}/Legend1`, '미니언 웨이브(모든 마을 동시 공격)', [IN[0] + 54, T + 20, 300, 20], { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  K.text(`${base}/Legend2`, '3페이즈 = 1분마다 웨이브 · 2분마다 좀비머쉬맘 +1', [IN[0] + 54 + 304, T + 20, 470, 20], { font: 'Noto700', size: 14, color: C.sub, h: 'left' });
  // 페이즈 막대 4개
  // 첫 칸(4.5분 = 153px)은 시안 글('0 · 0.5페이즈 개척 · 전직')이 두 줄로 꺾여(Play 실측) '페이즈'를 뺀다 — 시안도 칸 밖은 잘린다
  const seg = [[0, 4.5, '#1F9E6A', '0 · 0.5 개척 · 전직'], [4.5, 16.5, '#2F6FE0', '1페이즈 성장'], [16.5, 24.5, '#B8861E', '2페이즈 견제'], [24.5, 30, '#C23A48', '3페이즈 결전']];
  seg.forEach((s, i) => {
    const R = [X(s[0]), T + 96, X(s[1]) - X(s[0]) - 3, 36];
    K.fill(`${base}/Seg${i + 1}`, s[2], 1, R);
    K.text(`${base}/Seg${i + 1}/Text`, s[3], R, { font: 'Noto700', size: i === 0 ? 13 : 14, color: C.white, shadow: true });
  });
  // 웨이브 마름모(빨강 + 흰 테) · 3페이즈 작은 마름모
  [11, 14.5, 17, 20, 23].forEach((m, i) => { K.diamond(`${base}/WaveW${i + 1}`, X(m), T + 81, 15.6, '#FFFFFF'); K.diamond(`${base}/Wave${i + 1}`, X(m), T + 81, 12.7, '#F0564E'); });
  [25.5, 26.5, 27.5, 28.5, 29.5].forEach((m, i) => { K.diamond(`${base}/MiniW${i + 1}`, X(m), T + 82, 10.6, '#FFFFFF', 0.85); K.diamond(`${base}/Mini${i + 1}`, X(m), T + 82, 8.5, '#F0564E', 0.85); });
  // 시각 · 이름 11개 (짝수 = 위줄 · 홀수 = 아랫줄 + 연결선)
  const TL = [[0, '0:00', '매치 시작 · 사냥 시작'], [4.5, '4:30', '1페이즈 성장'], [7.5, '7:30', '미니언 생성'], [11, '11:00', '1웨이브'], [14.5, '14:30', '2웨이브'], [16.5, '16:30', '2페이즈 견제'], [17, '17:00', '1웨이브'], [20, '20:00', '2웨이브'], [23, '23:00', '3웨이브'], [24.5, '24:30', '3페이즈 결전'], [30, '30:00', '시간 종료']];
  TL.forEach((t, i) => {
    const left = Math.max(IN[0], Math.min(IN[0] + 1100 - 120, X(t[0]) - 60)); const cx = left + 60;
    const top = i % 2 ? T + 196 : T + 146;
    if (i % 2) K.solid(`${base}/Tick${i + 1}`, C.gold, 0.5, [cx - 1, T + 150, 2, 44]);
    K.text(`${base}/Time${i + 1}`, t[1], [left, top, 120, 22], { font: 'FootballB', size: 16, color: C.gold });
    K.text(`${base}/Label${i + 1}`, t[2], [left - 10, top + 22, 140, 20], { font: 'Noto700', size: 13, color: C.ivory });
  });
}

function p3(K, base, IN) {
  // 레벨 로드맵: 색 띠(초록 → 파랑 45% → 금 75% → 빨강) + 5 정거장
  const BAR = [IN[0] + 40, IN[1] + 60, IN[2] - 80, 10];
  K.hgrad(`${base}/Bar`, BAR, [[0, '#1F9E6A'], [0.45, '#2F6FE0'], [0.75, '#B8861E'], [1, '#C23A48']], 48);
  const LV = [[1, '시작', '마을 근처 사냥터에서 사냥. 노란 점이 사냥터예요.', 'ico_sword'], [10, '1차 전직 · 마을 차지', '전직관에게 전직 → 빈 마을의 넥서스를 눌러 내 마을로', 'job_warrior'], [17, '사냥터 2', '더 센 몬스터 · 경험치가 많은 사냥터가 열려요', 'map_dot_hunt'], [20, '2차 전직', '새 스킬 2개가 열려요', 'ico_star'], [30, '만렙 · 3차 전직', '궁극기 · 발록에 도전할 때예요', 'icon_balrog_heart']];
  LV.forEach((l, i) => {
    const last = i === LV.length - 1;
    const colX = last ? IN[0] + IN[2] - 220 : IN[0] + 8 + i * 238; const colW = 220;
    const slotX = last ? IN[0] + IN[2] - 72 : colX; const h = last ? 'right' : 'left';
    const P = `${base}/Stop${i + 1}`;
    K.img(P, 'slot_frame', [slotX, IN[1] + 16, 72, 72]);
    K.img(P + '/Icon', l[3], [slotX + 16, IN[1] + 32, 40, 40]);
    K.text(`${base}/StopLv${i + 1}`, `Lv ${l[0]}`, [colX, IN[1] + 96, colW, 34], { font: 'FootballB', size: 24, color: C.gold, h });
    K.text(`${base}/StopName${i + 1}`, l[1], [colX, IN[1] + 134, colW, 26], { font: 'Maple', size: 18, color: C.ivory, h });
    K.text(`${base}/StopDesc${i + 1}`, l[2], [colX, IN[1] + 164, 200 + (last ? 20 : 0), 44], { font: 'Noto500', size: 14, color: C.sub, h, v: 'top' });
  });
}
const JOBS5 = [['전사', 'job_warrior', '주먹펴고 일어서', 'WARRIOR'], ['마법사', 'job_magician', '하인즈', 'MAGICIAN'], ['궁수', 'job_archer', '헬레나', 'ARCHER'], ['도적', 'job_thief', '다크로드', 'THIEF'], ['해적', 'job_pirate', '카이린', 'PIRATE']];
function p4(K, base, IN) {
  // 전직관 5명 카드: 칸 그림(금테 짙은 칸) + 실제 NPC 그림 + 직업 아이콘 · 이름 + "직업 전직관"
  const colW = (IN[2] - 64) / 5;
  JOBS5.forEach((j, i) => {
    const cx = IN[0] + i * (colW + 16) + colW / 2; const top = IN[1] + 8;
    const P = `${base}/Npc${i + 1}`;
    K.img(P, 'slot_frame', [cx - 80, top, 160, 228]);
    // NPC 그림: 애니메이션 RUID 를 그대로 넣으면 클립 자체 피벗(발밑) 기준으로 원래 크기로 그려져 카드 밖 · 쪽 제목까지 덮었다(2026-10-05 Play 실측)
    //   → 'thumbnail://' 정지 그림으로 넣고 비율 유지(AspectOnly)로 카드 안에 맞춘다(msw-sprite-ruid).
    K.raw(P + '/Art', 'thumbnail://' + NPC[j[3]], [cx - 70, top + 14, 140, 200]);
    K.b.patchComponent(P + '/Art', S.SPR, { PreserveSprite: 1 });
    const nw = Math.ceil(estW(j[2], 16)); const total = 22 + 6 + nw; const x0 = cx - total / 2;
    K.img(`${base}/NpcJob${i + 1}`, j[1], [x0, top + 236, 22, 22]);
    K.text(`${base}/NpcName${i + 1}`, j[2], [x0 + 28, top + 233, nw + 12, 28], { font: 'Noto700', size: 16, color: C.ivory, h: 'left' });
    K.text(`${base}/NpcRole${i + 1}`, `${j[0]} 전직관`, [cx - 100, top + 262, 200, 20], { font: 'Noto500', size: 13, color: C.sub });
  });
}

function p5(K, base, IN) {
  // 방어선: 미니언 웨이브 → 포탑 → 억제기 → 넥서스(부서지면 탈락)
  const cy = IN[1] + IN[3] / 2; let x = IN[0] + (IN[2] - 834) / 2;
  K.img(`${base}/Mon1`, 'mon_unknown', [x + 3, cy - 36, 44, 44]);
  K.img(`${base}/Mon2`, 'mon_unknown', [x + 53, cy - 36, 44, 44]);
  K.text(`${base}/MonLabel`, '미니언 웨이브', [x - 10, cy + 14, 120, 20], { font: 'Noto700', size: 14, color: CORAL });
  x += 100 + 28;
  K.img(`${base}/Arrow1`, 'icon_arrow_right', [x, cy - 22, 44, 44]);
  x += 44 + 28;
  const FAC = [['fac_tower', '포탑', '1번째'], ['fac_inhibitor', '억제기', '2번째'], ['fac_nexus', '넥서스', '부서지면 탈락']];
  FAC.forEach((f, i) => {
    const P = `${base}/Fac${i + 1}`; const R = [x, cy - 84, 150, 168];
    K.img(P, 'panel_row', R, i === 2 ? { color: '#FFD9D4' } : {});
    K.img(P + '/Icon', f[0], [x + 39, R[1] + 18, 72, 72]);
    K.text(P + '/Name', f[1], [x, R[1] + 96, 150, 28], { font: 'Maple', size: 20, color: C.ivory });
    K.text(P + '/Sub', f[2], [x, R[1] + 128, 150, 20], { font: 'Noto700', size: 14, color: i === 2 ? CORAL : C.sub });
    x += 150;
    if (i < 2) { x += 28; K.img(`${base}/ArrowS${i + 1}`, 'icon_arrow_right', [x, cy - 18, 36, 36], { alpha: 0.7 }); x += 36 + 28; }
  });
}

function p6(K, base, IN) {
  const c = [['chip_gold', '승리', '가장 먼저 발록을 쓰러뜨림', '즉시 매치 종료 · 1위', 'icon_balrog_heart'], ['chip_gray', '시간 종료', '30:00까지 아무도 못 잡음', '기록으로 순위: 발록 피해 → 넥서스 HP → 레벨 → 처치', 'icon_clock'], ['chip_red', '탈락', '내 넥서스가 부서짐', '바로 탈락 · 관전으로', 'fac_nexus_broken']];
  card3(IN).forEach((R, i) => {
    const P = `${base}/Card${i + 1}`; const cx = R[0] + R[2] / 2; const t = R[1] + 22;
    K.img(P, 'panel_row', R);
    K.img(P + '/Icon', c[i][4], [cx - 32, t, 64, 64]);
    const cw = Math.ceil(estW(c[i][1], 16)) + 36;
    K.img(P + '/Chip', c[i][0], [cx - cw / 2, t + 74, cw, 28]);
    K.text(P + '/Chip/Text', c[i][1], [cx - cw / 2, t + 74, cw, 28], { font: 'Maple', size: 16, color: C.goldInk });
    K.text(P + '/Name', c[i][2], [cx - 170, t + 110, 340, 26], { font: 'Maple', size: 18, color: C.ivory });
    K.text(P + '/Desc', c[i][3], [cx - 165, t + 140, 330, 44], { font: 'Noto500', size: 14, color: C.sub });
  });
}

// 7쪽 키보드(시안 keyboard({compact:1}) · 칸 52) — 실제 조작에 맞춘 키만 색칠(종류별 5색) · 나머지는 '안 쓰는 키'(어둡게)
const KEYG = { mv: ['#2F6FE0', '이동'], at: ['#C23A48', '전투'], sk: ['#B8861E', '스킬 · 물약'], ui: ['#1F9E6A', '창 열기'], et: ['#6B4FD0', '기타'] };
// 시안: Alt 점프 · Z 줍기 · Space NPC 대화 · V 내 마을 · B 도감 · F1 조작키 → 실제: Space · 왼쪽 Alt 점프 · 줍기 자동 · NPC 클릭 · V/B/F1 없음
// 왼쪽/오른쪽은 KB 이름 끝 빈칸으로 가른다('Alt ' = 오른쪽). 2026-10-05 런타임 GetActionName: Space=Jump · LeftAlt=Jump2(점프함) · LeftControl=Attack ·
// Left/RightShift=Skill2 · RightAlt · RightControl = 없음 → 오른쪽 Alt · Ctrl 은 어둡게.
const KEYS = { '←': 'mv', '→': 'mv', '↑': 'mv', '↓': 'mv', Space: 'mv', Alt: 'mv', Ctrl: 'at', Q: 'sk', W: 'sk', E: 'sk', R: 'sk', Shift: 'sk', 'Shift ': 'sk', 1: 'sk', 2: 'sk', C: 'ui', K: 'ui', M: 'ui', H: 'ui', Esc: 'et', Enter: 'et' };
const KLAB = { '←': '이동', '→': '이동', '↑': '사다리', '↓': '아래', Space: '점프', Alt: '점프', Ctrl: '공격', Q: '스킬', W: '스킬', E: '스킬', R: '스킬', Shift: '스킬', 'Shift ': '스킬', 1: '물약 1', 2: '물약 2', C: '캐릭터', K: '스킬창', M: '월드맵', H: '도움말', Esc: '창 닫기', Enter: '채팅' };
const KB = [
  [['Esc', 1.2], ['', 0.5], ['F1', 1], ['F2', 1], ['F3', 1], ['F4', 1]],
  [['`', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['Back', 2]],
  [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
  [['Caps', 1.8], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['Enter', 2.2]],
  [['Shift', 2.3], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['Shift ', 2.7]],
  [['Ctrl', 1.5], ['', 1], ['Alt', 1.4], ['Space', 6.2], ['Alt ', 1.4], ['', 1], ['Ctrl ', 1.5]],
];
function p7(K, base, IN) {
  const U = 52; const X0 = IN[0] + (IN[2] - 960) / 2; const Y0 = IN[1] + 6;
  let n = 0;
  const cap = (label, x, y, w) => {
    // 키 하나: 칸 52 안에 6 작게(여백 3) · 쓰는 키 = 종류 색 + 위 왼쪽 키 이름 + 아래 기능 · 안 쓰는 키 = 짙은 남색 + 흐린 키 이름
    n += 1; const P = `${base}/Key${n}`; const k = label.trim(); const gk = KEYS[label];
    const R = [x + 3, y + 3, w * U - 6, U - 6];
    if (gk) {
      K.fill(P, KEYG[gk][0], 1, R);
      K.text(P + '/Name', k, [R[0] + 4, R[1] + 1, R[2] - 6, 18], { font: /^[A-Z]$/.test(k) ? 'Maple' : 'FootballB', size: 13, color: C.white, h: 'left' });
      K.text(P + '/Fn', KLAB[label], [R[0] + 1, R[1] + 23, R[2] - 2, 20], { font: 'Noto700', size: 13, color: C.white, shadow: true });
    } else {
      K.fill(P, '#182440', 1, R);
      if (k) K.text(P + '/Name', k, R, { font: /^[A-Z]$/.test(k) ? 'Maple' : 'FootballB', size: k.length > 2 ? 13 : 16, color: '#3E5282' });
    }
  };
  KB.forEach((row, ri) => {
    let x = X0;
    for (const [label, w] of row) {
      if (label === '' && w <= 0.6) { x += w * U; continue; }
      cap(label, x, Y0 + ri * U, w);
      x += w * U;
    }
  });
  // 방향키 묶음(오른쪽 아래 · 왼쪽 여백 24)
  const AX = X0 + 15 * U + 24; const AY = Y0 + 4 * U;
  cap('', AX, AY, 1); cap('↑', AX + U, AY, 1); cap('', AX + 2 * U, AY, 1);
  cap('←', AX, AY + U, 1); cap('↓', AX + U, AY + U, 1); cap('→', AX + 2 * U, AY + U, 1);
  // 범례: 5색 + "어두운 키는 쓰지 않아요"
  const LY = Y0 + 6 * U + 12; let lx = IN[0] + (IN[2] - 560) / 2;
  Object.keys(KEYG).forEach((gk, i) => {
    const tw = Math.ceil(estW(KEYG[gk][1], 14)) + 4;
    K.fill(`${base}/LegSw${i + 1}`, KEYG[gk][0], 1, [lx, LY + 3, 14, 14]);
    K.text(`${base}/LegTx${i + 1}`, KEYG[gk][1], [lx + 20, LY, tw, 20], { font: 'Noto700', size: 14, color: C.ivory, h: 'left' });
    lx += 20 + tw + 16;
  });
  K.text(`${base}/LegOff`, '· 어두운 키는 쓰지 않아요', [lx, LY, 200, 20], { font: 'Noto500', size: 14, color: C.faint, h: 'left' });
}
const PAGES = [p1, p2, p3, p4, p5, p6, p7];

// ─────────────────────────────────────────── 처음 하는 사람 안내 ───────────────────────────────────────────
function buildCoach() {
  const b = new UIBuilder('CoachMarkGroup', 18, true);
  const K = kit(b);
  K.root('Root', false);
  // 막 4장(구멍 위 · 아래 · 왼쪽 · 오른쪽) — 모서리가 각진 단색이어야 서로 맞닿은 자리에 틈이 없다. 위치 · 크기는 스크립트가 단계마다 맞춘다.
  for (const n of ['DimTop', 'DimBottom', 'DimLeft', 'DimRight']) K.solid('Root/' + n, '#050914', 0.74, [0, 0, 1920, 270], { raycast: true });
  // 금테(레벨업 금빛 테두리와 같은 그림 · 가운데 비움) · 고리 · 손가락 — 클릭은 통과(구멍 속 실제 버튼을 눌러야 함)
  K.img('Root/Frame', 'slot_frame_hover', [672, 8, 576, 76]);
  b.patchComponent('Root/Frame', S.SPR, { FillCenter: false });
  K.img('Root/Pulse', 'coach_ring', [904, 484, 112, 112], { enable: false });
  K.img('Root/Finger', 'coach_finger', [960, 540, 44, 44], { enable: false });
  // 꼬리: 금(시안 arrowTip #C99A45 · 24 x 12~14 삼각형) = 말풍선 아래에 깐 금 마름모(대각선 절반 12). 말풍선보다 먼저 만들어 밑에 그려지게 하고,
  //   스크립트가 가운데를 말풍선 가장자리에 둔다 → 바깥 절반만 삼각형으로 보인다. 위 · 아래 · 왼쪽 · 오른쪽 중 하나만 켠다.
  const TC = '#C99A45';
  for (const n of ['TailUp', 'TailDown', 'TailLeft', 'TailRight']) K.diamond('Root/' + n, 960, 440, 12, TC);
  // 말풍선(툴팁 판 · 파랑 유리) — 폭 · 높이는 단계마다 스크립트가 바꾼다
  K.img('Root/Bubble', 'panel_tooltip', [750, 452, 420, 176], { raycast: true });
  // 머리줄: n/9 칩 + 제목 (말풍선 왼쪽 위 기준 · 오른쪽 넓이는 스크립트가 맞춘다)
  b.empty('Root/Bubble/Head', { anchor: 'top-left', pivot: [0, 1], pos: [22, -18], rect_size: [376, 28] });
  b.sprite('Root/Bubble/Head/Chip', { anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], rect_size: [56, 22], image_ruid: S.R('chip_gold'), sprite_type: 1, color: C.white, alpha: 1, raycast: false });
  S.newText(b, 'Root/Bubble/Head/Chip/Text', '1 / 9', { font: 'Maple', size: 13, color: C.goldInk, rect: [56, 22] });
  S.newText(b, 'Root/Bubble/Head/Title', '지금은 개척 시간', { anchor: 'middle-left', pivot: [0, 0.5], pos: [66, 0], rect: [310, 28], font: 'Maple', size: 20, color: C.title, h: 'left' });
  // 설명(최대 3줄 · 높이는 GetPreferredHeight 로)
  S.newText(b, 'Root/Bubble/Body', '위 시계는 매치 시간이에요.', { anchor: 'top-left', pivot: [0, 1], pos: [22, -56], rect: [376, 50], font: 'Noto500', size: 16, color: C.ivory, h: 'left', v: 'top' });
  // 아래 줄: 진행 점 9 · 건너뛰기 · 다음
  b.empty('Root/Bubble/Foot', { anchor: 'bottom-left', pivot: [0, 0], pos: [22, 16], rect_size: [376, 44] });
  b.empty('Root/Bubble/Foot/Dots', { anchor: 'middle-left', pivot: [0, 0.5], pos: [0, 0], rect_size: [140, 8] });
  for (let d = 0; d < 9; d++) {
    const w = d === 0 ? 22 : 8; const x = d === 0 ? 11 : 22 + 5 + (d - 1) * 13 + 4;
    b.sprite(`Root/Bubble/Foot/Dots/D${d + 1}`, { anchor: 'middle-left', pivot: [0.5, 0.5], pos: [x, 0], rect_size: [w, 8], image_ruid: WHITE, sprite_type: 1, color: d === 0 ? C.gold : '#3E5282', alpha: 1, raycast: false });
  }
  b.button('Root/Bubble/Foot/BtnNext', '다음', { anchor: 'middle-right', pivot: [1, 0.5], pos: [0, 0], rect_size: [120, 44], image_ruid: S.R('btn_gold_default') });
  S.button(b, 'Root/Bubble/Foot/BtnNext', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
  S.font(b, 'Root/Bubble/Foot/BtnNext', { text: '다음', font: 'Maple', size: 16, color: C.goldInk, h: 'center', v: 'middle', outline: false });
  b.button('Root/Bubble/Foot/BtnSkip', '건너뛰기', { anchor: 'middle-right', pivot: [1, 0.5], pos: [-132, 0], rect_size: [72, 30], bg_color: { r: 0, g: 0, b: 0, a: 0 } });
  S.font(b, 'Root/Bubble/Foot/BtnSkip', { text: '건너뛰기', font: 'Noto700', size: 14, color: C.faint, h: 'right', v: 'middle', outline: false });

  const touched = S.chipText(b, { extra: { 'Root/Bubble/Head/Chip': ['Root/Bubble/Head/Chip/Text'] } });
  console.log('[coach] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'CoachMarkGroup.ui'), {
    lint_verbose: !!process.env.LINT_V,
    bind: {
      mlua: COACH_MLUA,
      props: {
        root: 'Root', dimTop: 'Root/DimTop', dimBottom: 'Root/DimBottom', dimLeft: 'Root/DimLeft', dimRight: 'Root/DimRight',
        frame: 'Root/Frame', pulse: 'Root/Pulse', finger: 'Root/Finger', bubble: 'Root/Bubble',
        tailUp: 'Root/TailUp', tailDown: 'Root/TailDown', tailLeft: 'Root/TailLeft', tailRight: 'Root/TailRight',
        head: 'Root/Bubble/Head', foot: 'Root/Bubble/Foot', dotsRoot: 'Root/Bubble/Foot/Dots',
        chipText: 'Root/Bubble/Head/Chip/Text', titleText: 'Root/Bubble/Head/Title', bodyText: 'Root/Bubble/Body',
        btnSkip: 'Root/Bubble/Foot/BtnSkip', btnNext: 'Root/Bubble/Foot/BtnNext',
      },
    },
  });
}

// ─────────────────────────────────────────── HUD 도움말 버튼 ───────────────────────────────────────────
// 상태창 바로가기(StatusHUD/Shortcuts · 캐릭터 C 버튼 x 1425)와 같은 조립법(apply-hud-status.cjs 96~113) · 한 칸 왼쪽(76 간격) x 1349~1413.
// StatusHUD.ui 는 건드리지 않는다(새 파일) — 누르면 GameIntroController 가 소개를 연다.
function buildHelp() {
  const b = new UIBuilder('HelpHudGroup', 2, true);
  const CONT = [1349, 20, 64, 85];
  S.newBox(b, 'Shortcut', { anchor: 'top-right', pivot: [1, 1], pos: [-(1920 - 1413), -20], size: [CONT[2], CONT[3]] });
  const BTN = [1349, 20, 64, 64]; const P = 'Shortcut/BtnHelp';
  b.button(P, '', { anchor: 'middle-center', pos: S.at(...BTN, CONT), rect_size: [64, 64], pivot: [0.5, 0.5], image_ruid: S.R('slot_frame') });
  S.button(b, P, { normal: 'slot_frame', hover: 'slot_frame_hover', pressed: 'slot_frame_hover' });
  S.font(b, P, { text: '' });
  S.newImage(b, P + '/Icon', 'icon_help', { pos: S.at(1349 + 14, 34, 36, 36, BTN), size: [36, 36] });
  const KB1 = S.roleBox('key1');
  S.newImage(b, P + '/KeyChip', 'chip_gold_sm', { pos: S.at(1349 + 70 - KB1[0], 68, KB1[0], KB1[1], BTN), size: [KB1[0], KB1[1]] });
  S.newText(b, P + '/KeyChip/Text', 'H', { font: 'Maple', size: 13, color: C.goldInk, pos: [0, 0], rect: [KB1[0], KB1[1]] });
  S.newText(b, P + '/Label', '도움말', { font: 'Noto700', size: 13, color: C.ivory, shadow: true, pos: S.at(1349 - 4, 87, 72, 18, BTN), rect: [72, 18] });
  const touched = S.chipText(b);
  console.log('[help] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'HelpHudGroup.ui'), { lint_verbose: !!process.env.LINT_V, bind: { mlua: INTRO_MLUA, props: { btnHelp: 'Shortcut/BtnHelp' } } });
}

buildIntro();
buildCoach();
buildHelp();
console.log('끝 — GameIntroGroup · CoachMarkGroup · HelpHudGroup');
