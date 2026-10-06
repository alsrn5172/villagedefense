// 디자이너 시안(10/5) 두 창 + HUD 도움말 버튼 + 2차 도움말 탭 · 알림 카드를 새 .ui 4개로 만든다 — 기존 .ui 는 건드리지 않는다.
//   ui/GameIntroGroup.ui  도움말 창 = 게임 소개(넘기는 7쪽 · 시안 WIN_INTRO) + 2차 탭(재화 · 아이템 · 마을 NPC · 조작키)   GroupOrder 17
//   ui/CoachMarkGroup.ui  처음 하는 사람 안내(클릭 유도) — 시안 WIN_COACH (spot · coach)                         GroupOrder 18
//   ui/HelpHudGroup.ui    HUD '도움말 H' 버튼 — 시안 상시 HUD 오른쪽 위 줄(H 도움말)                                GroupOrder 2
//   ui/TipGroup.ui        2차 알림 카드(화면 오른쪽 가운데 · TipController)                                         GroupOrder 5
//   ui/TutorialGroup.ui   튜토리얼(WO-051) 페이드 · 단계 칩 · 큰 설명창 · [그만두기] + 확인창(TutorialDirector)          GroupOrder 19
//   WO-051: 소개 8쪽(튜토리얼 시작 페이지) · 탭 줄 오른쪽 [튜토리얼] + [안내 켜짐/꺼짐] 토글 · 45분(매치 기본 제한 시간)
//   (그리는 순서는 런타임 /ui 형제 순서라 GroupOrder 만으로 정해지지 않는다 — 컨트롤러가 열 때 부활 팝업 바로 아래로 올린다)
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-intro-coach.cjs [intro] [coach] [hud] [tip] [tutorial]
//   🔴 인자로 고른 파일만 다시 만든다(인자 없으면 넷 다). 다시 만들면 그 파일의 UUID 가 전부 새로 나오고(스크립트 주입도 새로) Maker 에서
//   손댄 좌표 · 색(S2)이 지워진다 → 바꾼 파일만 골라서 돌린다.
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
const TIP_MLUA = path.join(WORLD, 'RootDesk/MyDesk/Onboarding/TipController.mlua');
const TUT_MLUA = path.join(WORLD, 'RootDesk/MyDesk/Onboarding/TutorialDirector.mlua');

// 틴트용 흰 9-slice(협업-규칙 6-4 · 64x64 반경 12 · border 14) — 막대 · 키 · 점처럼 모서리만 둥근 칸
const WHITE = 'f5e5fbd6dd224f2d8a5af320436b95f0';
// 전직관 NPC 그림 = RootDesk/MyDesk/Models/Npcs/VD_JOB_*.model 의 SpriteRUID (ModelBuilder.read · 2026-10-05) — 시안의 temp/npc_card_* 대신 실제 게임 그림
const NPC = {
  WARRIOR: 'ec40238056d14dc895e93767d9bf6f90', MAGICIAN: 'fb911e3df47b4b54997950df0726285a', ARCHER: '4d71a2a1d659408fbdf5dac3152134e6',
  THIEF: '4801a0f7b2664b8da9b73d2b3ea25fd4', PIRATE: 'f389034efb9b4e29bba08efad1147a24',
};
// 재화 아이콘 = RootDesk/MyDesk/ItemInfo.csv 의 IconRUID(인벤토리가 쓰는 그 그림 · 2026-10-05 2차에서 확인)
const GEMS = [
  ['다이아몬드', '공격력', '81462aeb825b4660991cef05651271cf'], ['사파이어', '마력', '9b1796a9a66d4248bcee8af6464dfb0e'],
  ['자수정', '이동속도', 'f518eba5c5c540e7b817de12a04431cf'], ['아쿠아마린', '점프력', '3a29b586ea6a445f868ffa42375ac290'],
  ['가넷', '명중률', '56ca9484dafb461894d9ad107a41473e'], ['오팔', '회피율', 'b244baf75a1c4e2981b06ab6530934a4'],
  ['토파즈', '최대 HP', 'e19dfdcf384f4e168b286672bc785a72'], ['에메랄드', '최대 MP', '63240b9ee954422f90ef7073a97ccb75'],
  ['힘의 결정', 'STR', '4b60ee9773414c509ba7748ceb56588e'], ['민첩의 결정', 'DEX', '876cdb6781c346fb9c50be399deeae1f'],
  ['행운의 결정', 'LUK', '5eb30ccc201e44b3ba824b973bf5af29'], ['지력의 결정', 'INT', '6b14adcac7c1488d96e2c6d746ca6b56'],
];
const REGIONS = [
  ['헤네시스 포자', '헤네시스', 'ca8302951ab946f38fd1356c6c05aa0c'], ['도둑 주화', '커닝시티', '2944213d2ae24c6e832bb4e5ddcfec83'],
  ['정령 가루', '엘리니아', '76ccbef909b8489f883036729c71ac18'], ['해적 주화', '노틸러스', '162c79878ef54f0db85101b160ade8d0'],
  ['전사의 증표', '페리온', '89af078f94b14eac81056015922efb0b'],
];
const MATS = [
  ['주황버섯', 'a95cfed2c8fe4d2cb64cbb62db051f92'], ['파란버섯', '37f823d5d9ad4468a6502ba195317ac1'], ['다크 스톤골렘', '87eea551f4aa4a44a5c83d17717f1a08'],
  ['이블아이', '81f20348f7c24712922569a2ea4eb0db'], ['커즈아이', '39701cc34097421bb4254e857a57076f'], ['콜드아이', 'd2526bc21cab4ce8b083393bed6b3841'],
  ['옥토퍼스', 'd8f014043ce8418f96700c2b6c9ebf6c'], ['주니어 네키', '03865bd69ec24123a1f06107768bf3c4'], ['주니어 부기', '5a7096472ffd4ac388fa826071a435a5'],
  ['스텀프', 'cf2a470436cd4b2aa265648e15198c45'], ['와일드보어', 'af64c62c1dcf427998c3c52f0a060fec'], ['돼지', '528a8638b12f41b8b5781a05360d2949'],
  ['리본 돼지', '6a699b8c31b94474bb795c7394c3af3b'], ['파란 리본돼지', 'cba2695db0034210a59cd88b5894457b'],
];
const ITEM = {
  dream: '1598d8d8bd2e4068b5b555f47645df7d', soul: 'a1e0a94017b54c78a5fa70e466d75187', core: '4570b3929b524c19b1f4c60d4a4c7c95', seal: 'fb3f1fc1249847de82d6c86727dd5014',
  gem: GEMS[0][2], region: REGIONS[0][2], mat: MATS[0][1],
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
// 2차: 제목 띠 아래 탭 줄(56)을 넣느라 창을 840 → 910 으로 늘렸다(위로 35 · 아래로 35). 1차 쪽 내용은 PY 만큼 내려간다.
const WIN = [320, 85, 1280, 910];        // 창(가운데) — 시안 frame({x:60,y:70,w:1280,h:840}) 를 1920 캔버스 가운데로 + 탭 줄
const TOP = WIN[1];
const PY = 27;                             // 1차 쪽 상자 y 220 → 247
const BODY_X = 352; const BODY_W = 1216;  // 몸통 좌우 여백 32
const ILLU_Y = 282 + PY;                   // 그림 판 위 = 머리줄 + 14
const KEY = [352, 782 + PY, 1216, 56];     // 핵심 한 줄(창 아래 띠 위 18)
const FOOT = [324, 856 + PY, 1272, 100];   // 아래 띠(창 안쪽 · 아래 12 띄움)
const PANE = [324, 220 + PY, 1272, 636];   // 탭 내용 상자(소개 쪽 · 재화 · NPC · 조작키 공통) y 247 ~ 883
const TABS = [348, 181, 1224, 56];         // 탭 줄(디자인 시스템 '창 탭' 56 · 계정 창 apply-account.cjs:62-74 조립)

// 쪽 제목 · 핵심 한 줄 (시안 INTRO_T · INTRO_M) — 고친 곳: 4쪽 제목의 긴 줄표(메이플체에 없음) · 4 · 5 · 7쪽 핵심
const TITLES = ['어떤 게임인가요?', '45분의 흐름', '레벨업 길잡이', '전직 · Lv 10 · 20 · 30', '내 마을 차지하고 지키기', '이기는 법', '조작키'];
const KEYLINES = [
  'Lv 30까지 키우고, 내 마을을 지키면서, 발록을 가장 먼저 쓰러뜨리면 이겨요.',
  '1페이즈(4:30) 전까지는 사냥에 집중하고, Lv 10이 되면 바로 전직 → 마을 차지.',
  '레벨이 오르면 C(능력치) · K(스킬)에 빨간 알림이 없는지 꼭 확인해요.',
  'Lv 10 → 전직관 5명 중 한 명을 클릭 → 전직 → 바로 마을 정하러.',            // 시안: 한 명에게 Space
  '넥서스가 부서지면 끝. 웨이브 사이사이 마을 NPC에게서 시설을 강화해요.',      // 시안: V(내 마을)에서
  '3페이즈에는 마을을 버티면서 발록에게 먼저 가는 사람이 이겨요.',
  '모르는 키나 재화가 나오면 H → 도움말의 탭에서 찾아봐요.',                  // 시안: F1, 이 소개는 H · 2차: 도움말 탭
];
const GOLD = '#E8B64C'; const CORAL = '#FF8A7A';
const g = (t) => `<color=${GOLD}><b>${t}</b></color>`;
const r = (t) => `<color=${CORAL}><b>${t}</b></color>`;
// 설명 줄 (시안 p1~p7 의 pt) — 고친 곳: 4쪽 1줄(Space → 클릭) · 5쪽 2줄(V → 마을 NPC) · 7쪽 전부(F1 · 조작키 버튼 없음)
//   2차(실제 게임에 맞춤): 2쪽 1 · 2페이즈(파병은 1페이즈부터 · DispatchRule.csv · 2페이즈 = 부활 비용 · PlayerRespawnService)
//   4쪽 3줄(2 · 3차는 Lv 20 · 30 에 저절로 · PlayerSkillState.TryAdvanceTier) · 5쪽 2 · 3줄(주화 = 엘리트 · 시설 = 방어 시설 관리인 · 수비대 = 몬스터 재료)
const BULLETS = [
  [`<b>5명</b>이 빅토리아 아일랜드에서 <b>45분</b> 동안 겨루는 생존 게임이에요.`,
    `다섯 마을(헤네시스 · 페리온 · 엘리니아 · 커닝시티 · 노틸러스) 중 <b>하나를 먼저 차지</b>해 내 마을로 키워요.`,
    `직업(전사 · 마법사 · 궁수 · 도적 · 해적)은 마을과 상관없이 <b>자유롭게</b> 골라요.`,
    `${g('가장 먼저 발록을 쓰러뜨리면 즉시 승리')}. 넥서스가 부서지면 탈락이에요.`],
  [`<b>0 · 0.5페이즈 (0:00 ~ 4:30)</b> 사냥으로 레벨을 올려요. Lv 10이 되면 전직하고 마을을 차지해요.`,
    `<b>1페이즈 성장 (4:30~)</b> 7:30에 미니언이 생기고 11:00 · 14:30에 웨이브가 마을을 공격해요. 파병도 이때부터.`,
    `<b>2페이즈 견제 (16:30~)</b> 웨이브가 더 강해져요. 쓰러지면 언제든 메소 5,000이나 경험치를 내고 내 마을에서 부활해요.`,
    `${r('3페이즈 결전 (24:30~)')} 웨이브가 1분마다 와요. 넥서스가 버틸 때 서둘러 발록에게!`],
  [`몬스터를 잡으면 경험치가 올라요. <b>레벨이 오르면 AP</b>(능력치)와 <b>SP</b>(스킬)가 생겨요. <b>C</b> 캐릭터 창 · <b>K</b> 스킬 창에서 찍어요.`,
    `빨간 알림이 붙은 버튼은 찍을 게 남았다는 뜻이에요. 레벨업 AP 는 <b>자동 분배</b>(기본 켜짐)가 직업에 맞게 찍어 줘요.`,
    `사냥터 위치와 몬스터 레벨은 <b>M</b> 월드맵에서 볼 수 있어요.`],
  [`<b>Lv 10</b>이 되면 전직관 <b>5명</b>이 서 있는 곳으로 가요. 원하는 직업의 전직관을 <b>클릭</b>해 말을 걸면 전직할 수 있어요.`,
    `직업은 <b>마음대로</b> 골라요. 어느 마을을 차지할지와 상관없어요. 한 번 고르면 바꿀 수 없어요.`,
    `<b>Lv 20 · 30</b>이 되면 2차 · 3차 전직은 <b>저절로</b> 돼요(새 스킬 · 궁극기).`,
    `전직을 마치면 바로 <b>마을을 정하러</b> 가요.`],
  [`전직 뒤 <b>빈 마을의 넥서스</b>를 누르면 내 마을이 돼요(Lv 10부터 · 먼저 누른 사람이 주인).`,
    `웨이브는 <b>포탑 → 억제기 → 넥서스</b> 순서로 와요. 시설 강화 · 수리는 <b>방어 시설 관리인</b>(빅토리아 주화).`,
    `수비대: <b>도감 관리인</b>에게서 해금 → <b>몬스터 모집관</b>에게 그 몬스터 재료 8개로 5마리 모집해요.`,
    `${r('넥서스가 부서지면 탈락')}이고, 남은 판은 관전해요.`],
  [`발록은 <b>혼자 들어가는 방</b>에서 1 : 1로 싸워요. 가장 먼저 쓰러뜨린 사람이 나오면 모두에게 알림이 뜨고 바로 끝나요.`,
    `3페이즈에는 웨이브가 1분마다 와요. <b>마을을 버틸 수 있을 때</b> 발록에게 가는 게 핵심이에요.`,
    `결과 창에서 순위 보상(발록의 심장 · 계정 경험치)을 받아요.`],
  [`색이 칠해진 키만 써요. <b>어두운 키</b>는 지금 게임에서 쓰지 않아요.`,
    `이 창(<b>도움말</b>)은 오른쪽 위 버튼이나 <b>H</b> 키로 언제든 열어요. 재화 · 마을 NPC · 조작키 탭도 있어요.`],
];
const ILLU_H = [290, 290, 300, 340, 340, 290, 400]; // 5쪽 260 → 340: 방어선 아래에 마을 문장 5개 줄(WO-050 §4)

function buildIntro() {
  const b = new UIBuilder('GameIntroGroup', 17, true);
  const K = kit(b);
  K.root('Root', false);
  // 막: 마을(게임) 화면 위 남색 70% — 시안 E1 (temp/town_bg 는 시안용 · 게임에서는 실제 화면이 비친다)
  K.solid('Root/Dimmer', C.veil, 0.7, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true });
  // 창 판 · 문장 · 제목 띠 · 제목 · 닫기 (_npc-frame 과 같은 순서: 문장 → 띠 → 글자)
  K.img('Root/Window', 'panel_window', WIN, { raycast: true });
  K.img('Root/Window/Crest', 'deco_crest', [810, TOP - 52, 300, 88]);
  K.img('Root/Window/Band', 'panel_title_bar', [408, TOP + 22, 1104, 64]);
  // 제목 = 창 이름 '도움말'(2차 · 어느 탭이든 같은 창) — 반짝이 · 선은 글자 폭에 맞춰 양옆 22 에 둔다(1차 '게임 소개' 때 값과 같은 식)
  const TITLE = '도움말';
  const tw = estW(TITLE, 30); const tl = 960 - tw / 2; const tr = 960 + tw / 2;
  K.text('Root/Window/Title', TITLE, [810, TOP + 33, 300, 42], { font: 'Maple', size: 30, color: C.title, shadow: true });
  K.img('Root/Window/Title/SparkleL', 'deco_sparkle', [Math.round(tl - 40), TOP + 45, 18, 18]);
  K.img('Root/Window/Title/SparkleR', 'deco_sparkle', [Math.round(tr + 22), TOP + 45, 18, 18]);
  K.solid('Root/Window/Title/LineL', '#E9B24A', 0.75, [Math.round(tl - 40 - 12 - 70), TOP + 53, 70, 2]);
  K.solid('Root/Window/Title/LineR', '#E9B24A', 0.75, [Math.round(tr + 22 + 18 + 12), TOP + 53, 70, 2]);
  K.btn('Root/Window/BtnClose', '', [1528, TOP + 28, 52, 52], { normal: 'btn_close_default', hover: 'btn_close_hover', pressed: 'btn_close_hover' });
  buildTabs(K);

  K.box('Root/Window/Pages', PANE);
  const PAGE = (i) => `Root/Window/Pages/P${i + 1}`;
  for (let i = 0; i < 7; i++) {
    const P = PAGE(i);
    K.box(P, PANE, { enable: i === 0 });
    // 머리줄: 금색 "n / 7" + 큰 쪽 제목 (시안 K5)
    K.text(P + '/Num', `${i + 1} / 8`, [BODY_X, 240 + PY, 48, 24], { font: 'Maple', size: 16, color: C.gold, h: 'left' });
    K.text(P + '/Title', TITLES[i], [BODY_X + 54, 226 + PY, 1100, 42], { font: 'Maple', size: 30, color: C.title, h: 'left', shadow: true });
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
    K.img(P + '/KeyLine/Chip', 'chip_gold', [372, 798 + PY, 54, 24]);
    K.text(P + '/KeyLine/Chip/Text', '핵심', [372, 798 + PY, 54, 24], { font: 'Maple', size: 14, color: C.goldInk });
    K.text(P + '/KeyLine/Text', KEYLINES[i], [440, 795 + PY, 1110, 30], { font: 'Noto700', size: 18, color: C.ivory, h: 'left' });
  }
  buildTutorialPage(K);

  // 2차 탭 내용(재화 · 아이템 / 마을 NPC / 조작키) — 처음엔 꺼 둔다(GameIntroController.GoTab)
  buildCur(K);
  buildNpc(K);
  buildKeys(K);

  // 아래 띠: 금 윗선 · 쪽 표시 점 · 건너뛰기 · 이전 · 다음 (시안 K6~K9)
  K.box('Root/Window/Foot', FOOT);
  K.solid('Root/Window/Foot/Bg', C.navy900, 0.3, [324, 857 + PY, 1272, 99]);
  K.solid('Root/Window/Foot/TopLine', '#E9B24A', 0.35, [324, 856 + PY, 1272, 1]);
  K.box('Root/Window/Foot/Dots', [350, 901 + PY, 140, 10]);
  for (let d = 0; d < 8; d++) {
    // 왼쪽 끝 기준(middle-left) — 스크립트(LayoutDots)가 쪽마다 폭 · 색 · 위치를 다시 준다
    const w = d === 0 ? 28 : 10; const x = d === 0 ? 14 : 28 + 6 + (d - 1) * 16 + 5;
    b.sprite(`Root/Window/Foot/Dots/D${d + 1}`, { anchor: 'middle-left', pivot: [0.5, 0.5], pos: [x, 0], rect_size: [w, 10], image_ruid: WHITE, sprite_type: 1, color: d === 0 ? C.gold : '#3E5282', alpha: 1, raycast: false });
  }
  K.textBtn('Root/Window/Foot/BtnSkip', '건너뛰기', [1080, 891 + PY, 88, 30], { font: 'Noto700', size: 16, color: C.faint, h: 'right', v: 'middle' });
  K.btn('Root/Window/Foot/BtnPrev', '이전', [1184, 875 + PY, 170, 62], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' }, { font: 'Maple', size: 20, color: C.ivory, shadow: true });
  // 다음: 피벗 오른쪽 — 마지막 쪽에 폭 240 으로 늘려도 오른쪽 끝(1570)이 그대로
  b.button('Root/Window/Foot/BtnNext', '다음', { anchor: 'middle-center', pos: [1570 - 960, 0], rect_size: [200, 62], pivot: [1, 0.5], image_ruid: S.R('btn_gold_default') });
  S.button(b, 'Root/Window/Foot/BtnNext', { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' });
  S.font(b, 'Root/Window/Foot/BtnNext', { text: '다음', font: 'Maple', size: 20, color: C.goldInk, h: 'center', v: 'middle', outline: false });

  // 2차: 소개 말고 다른 탭의 아래 띠 = 안내 문구(탭마다 GameIntroController 가 바꿈) + 닫기
  K.box('Root/Window/FootAlt', FOOT, { enable: false });
  K.solid('Root/Window/FootAlt/Bg', C.navy900, 0.3, [324, 857 + PY, 1272, 99]);
  K.solid('Root/Window/FootAlt/TopLine', '#E9B24A', 0.35, [324, 856 + PY, 1272, 1]);
  K.img('Root/Window/FootAlt/HintIcon', 'icon_info', [352, FOOT[1] + 38, 24, 24]);
  K.text('Root/Window/FootAlt/Hint', '왼쪽 목록에서 고르면 얻는 곳 · 쓰는 곳이 나와요', [386, FOOT[1] + 30, 980, 40], { font: 'Noto500', size: 16, color: C.sub, h: 'left' });
  K.btn('Root/Window/FootAlt/BtnClose', '닫기', [1400, FOOT[1] + 19, 170, 62], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' }, { font: 'Maple', size: 20, color: C.goldInk });

  const touched = S.chipText(b);
  console.log('[intro] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'GameIntroGroup.ui'), {
    lint_verbose: !!process.env.LINT_V,
    bind: {
      mlua: INTRO_MLUA,
      props: {
        root: 'Root', pagesRoot: 'Root/Window/Pages', dotsRoot: 'Root/Window/Foot/Dots',
        btnPrev: 'Root/Window/Foot/BtnPrev', btnNext: 'Root/Window/Foot/BtnNext', btnSkip: 'Root/Window/Foot/BtnSkip', btnClose: 'Root/Window/BtnClose',
        footIntro: 'Root/Window/Foot', footAlt: 'Root/Window/FootAlt', footHint: 'Root/Window/FootAlt/Hint', btnClose2: 'Root/Window/FootAlt/BtnClose',
        tabsRoot: 'Root/Window/Tabs', tab1: 'Root/Window/Tabs/Tab1', tab2: 'Root/Window/Tabs/Tab2', tab3: 'Root/Window/Tabs/Tab3', tab4: 'Root/Window/Tabs/Tab4',
        btnTutTab: 'Root/Window/Tabs/BtnTutorial', btnGuideToggle: 'Root/Window/Tabs/BtnGuide',
        guideToggleText: 'Root/Window/Tabs/BtnGuide/Label', guideToggleOn: 'Root/Window/Tabs/BtnGuide/SelBg',
        tutAskText: 'Root/Window/Pages/P8/Ask', btnTutStart: 'Root/Window/Pages/P8/BtnStart', btnTutNo: 'Root/Window/Pages/P8/BtnNo', tutNoteText: 'Root/Window/Pages/P8/Note',
        paneCur: 'Root/Window/TabCur', paneNpc: 'Root/Window/TabNpc', paneKeys: 'Root/Window/TabKey',
        curList: 'Root/Window/TabCur/List', curDetail: 'Root/Window/TabCur/Detail',
      },
    },
  });
}

// ─────────────────────────────────────────── 2차: 탭 줄 ───────────────────────────────────────────
// 계정 창(apply-account.cjs:62-74)과 같은 조립: 파랑 버튼(바탕) + 고른 탭만 켜는 금 바탕(SelBg) + 아이콘 + 글자(Label).
// 시안 디자인 시스템 '탭 3단계' 중 '창 탭'(금 · 파랑 버튼 56 · 글자 24). 오른쪽 끝은 '안내 다시 보기'(시안 WIN_COACH: 이후 도움말에서 다시 본다).
const TAB_DEFS = [['게임 소개', 'ico_book'], ['재화 · 아이템', 'ico_coin'], ['마을 NPC', 'ico_home'], ['조작키', 'ico_gear']];
function buildTabs(K) {
  const TW = 230; const GAP = 8;   // WO-051: 250 → 230 — 오른쪽에 [튜토리얼] · [안내] 토글 두 칸
  K.box('Root/Window/Tabs', TABS);
  TAB_DEFS.forEach((t, i) => {
    const R = [TABS[0] + i * (TW + GAP), TABS[1], TW, TABS[3]];
    const P = `Root/Window/Tabs/Tab${i + 1}`;
    K.btn(P, '', R, { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' });
    K.img(P + '/SelBg', 'btn_gold_default', R, { enable: i === 0 });
    const lw = Math.ceil(estW(t[0], 24)); const total = 26 + 8 + lw; const x0 = R[0] + (R[2] - total) / 2;
    K.img(P + '/Icon', t[1], [x0, R[1] + 15, 26, 26]);
    K.text(P + '/Label', t[0], [x0 + 34, R[1], lw + 12, R[3]], { font: 'Maple', size: 24, color: i === 0 ? C.goldInk : C.ivory, h: 'left' });
  });
  // WO-051: '안내 다시 보기' 자리 → [튜토리얼](소개 8쪽짜리를 1쪽부터) + [안내 켜짐/꺼짐] 토글(켜짐 = 금 바탕 SelBg · 스크립트가 바꾼다)
  const x = TABS[0] + 4 * (TW + GAP); const W2 = TABS[0] + TABS[2] - x;
  const RT = [x, TABS[1], Math.floor((W2 - GAP) * 0.48), TABS[3]];
  const RG = [RT[0] + RT[2] + GAP, TABS[1], TABS[0] + TABS[2] - (RT[0] + RT[2] + GAP), TABS[3]];
  K.btn('Root/Window/Tabs/BtnTutorial', '', RT, { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' });
  { const lw = Math.ceil(estW('튜토리얼', 17)); const total = 22 + 6 + lw; const x0 = RT[0] + (RT[2] - total) / 2;
    K.img('Root/Window/Tabs/BtnTutorial/Icon', 'ico_book', [x0, RT[1] + 17, 22, 22]);
    K.text('Root/Window/Tabs/BtnTutorial/Label', '튜토리얼', [x0 + 28, RT[1], lw + 10, RT[3]], { font: 'Noto700', size: 17, color: C.ivory, h: 'left' }); }
  K.btn('Root/Window/Tabs/BtnGuide', '', RG, { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' });
  K.img('Root/Window/Tabs/BtnGuide/SelBg', 'btn_gold_default', RG);
  { const lw = Math.ceil(estW('안내 켜짐', 17)); const total = 22 + 6 + lw; const x0 = RG[0] + (RG[2] - total) / 2;
    K.img('Root/Window/Tabs/BtnGuide/Icon', 'icon_help', [x0, RG[1] + 17, 22, 22]);
    K.text('Root/Window/Tabs/BtnGuide/Label', '안내 켜짐', [x0 + 28, RG[1], lw + 12, RG[3]], { font: 'Noto700', size: 17, color: C.goldInk, h: 'left' }); }
}

// ── 8쪽: 튜토리얼 시작 (WO-051 · 사용자 2026-10-06 "맨 마지막에 튜토리얼 시작하기! 대문짝만하게 · 예 아니오") ──
function buildTutorialPage(K) {
  const P = 'Root/Window/Pages/P8';
  K.box(P, PANE, { enable: false });
  K.text(P + '/Num', '8 / 8', [BODY_X, 240 + PY, 48, 24], { font: 'Maple', size: 16, color: C.gold, h: 'left' });
  K.text(P + '/Title', '튜토리얼', [BODY_X + 54, 226 + PY, 1100, 42], { font: 'Maple', size: 30, color: C.title, h: 'left', shadow: true });
  const IL = [BODY_X, ILLU_Y, BODY_W, 440];
  K.img(P + '/Illu', 'panel_inner', IL);
  K.img(P + '/Illu/Crest', 'deco_crest', [810, IL[1] + 26, 300, 88]);
  // 문구는 스크립트가 처음 하는 사람 · 매치 중에 맞게 바꾼다(RefreshTutorialPage)
  K.text(P + '/Ask', '처음 오셨군요!\n튜토리얼을 진행하시겠습니까?', [BODY_X, IL[1] + 120, BODY_W, 110], { font: 'Maple', size: 38, color: C.title, shadow: true });
  K.text(P + '/Note', '혼자 들어가는 연습 판에서 한 판의 흐름을 직접 해 봐요 · 결과는 계정에 남지 않아요', [BODY_X, IL[1] + 236, BODY_W, 34], { font: 'Noto500', size: 19, color: C.sub });
  K.btn(P + '/BtnStart', '튜토리얼 시작하기', [660, IL[1] + 286, 600, 104], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' }, { font: 'Maple', size: 36, color: C.goldInk });
  K.btn(P + '/BtnNo', '아니오', [860, IL[1] + 400, 200, 56], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' }, { font: 'Maple', size: 20, color: C.ivory, shadow: true });
  K.fill(P + '/KeyLine', C.gold, 0.16, KEY);
  K.solid(P + '/KeyLine/Bar', C.gold, 1, [KEY[0], KEY[1], 3, KEY[3]]);
  K.img(P + '/KeyLine/Chip', 'chip_gold', [372, 798 + PY, 54, 24]);
  K.text(P + '/KeyLine/Chip/Text', '핵심', [372, 798 + PY, 54, 24], { font: 'Maple', size: 14, color: C.goldInk });
  K.text(P + '/KeyLine/Text', '튜토리얼은 도움말(H) 위쪽 [튜토리얼] 버튼으로 언제든 다시 할 수 있어요.', [440, 795 + PY, 1110, 30], { font: 'Noto700', size: 18, color: C.ivory, h: 'left' });
}

// ─────────────────────────────────────────── 튜토리얼 화면 (WO-051) ───────────────────────────────────────────
// 페이드(검은 막 · 스크립트가 알파) · 위 가운데 단계 칩(매치 시계 자리) · 오른쪽 위 [그만두기](MSW 기본 메뉴 아래) · 큰 설명창 · 그만두기 확인창.
// 강조 막(CoachMarkGroup) 위에 그려야 해서 TutorialDirector 가 장면마다 부활 팝업 바로 아래로 올린다.
const ELLINIA_EMBLEM = 'a67009c937104506b1f2d178e6477c1b';
function buildTutorial() {
  const b = new UIBuilder('TutorialGroup', 19, true);
  const K = kit(b);
  K.root('Root', false);
  K.solid('Root/Fade', '#000000', 1, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true, enable: false });
  K.box('Root/Step', [690, 14, 540, 52]);
  K.img('Root/Step/Bg', 'panel_tooltip', [690, 14, 540, 52]);
  K.text('Root/Step/Text', '1단계 · 전직과 마을 차지', [690, 14, 540, 52], { font: 'Maple', size: 22, color: C.title, shadow: true });
  K.btn('Root/BtnQuit', '그만두기', [1756, 120, 144, 52], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' }, { font: 'Maple', size: 20, color: C.ivory, shadow: true });
  // 큰 설명창: 창 [540, 250, 840, 560] · 몸은 창 가운데 기준(스크립트가 문장 아이콘 유무로 x 0 / 70 · 폭 760 / 620)
  K.box('Root/Card', [0, 0, 1920, 1080], { enable: false });
  K.solid('Root/Card/Dimmer', C.veil, 0.55, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true });
  K.img('Root/Card/Window', 'panel_window', [540, 250, 840, 560], { raycast: true });
  K.img('Root/Card/Window/Chip', 'chip_gold', [580, 292, 160, 30]);
  K.text('Root/Card/Window/Chip/Text', '튜토리얼', [580, 292, 160, 30], { font: 'Maple', size: 15, color: C.goldInk });
  K.text('Root/Card/Window/Title', '이 게임은 이렇게 이겨요', [580, 332, 760, 50], { font: 'Maple', size: 32, color: C.title, h: 'left', shadow: true });
  K.raw('Root/Card/Window/Emblem', ELLINIA_EMBLEM, [580, 400, 120, 120], { enable: false });
  K.text('Root/Card/Window/Body', '', [580, 400, 760, 236], { font: 'Noto500', size: 21, color: C.ivory, h: 'left', v: 'top' });
  K.box('Root/Card/Window/Hp', [720, 642, 600, 52], { enable: false });
  K.text('Root/Card/Window/Hp/Text', '엘리니아 넥서스 18%', [740, 642, 560, 24], { font: 'Noto700', size: 16, color: C.coral, h: 'left' });
  K.solid('Root/Card/Window/Hp/Track', '#1A2238', 1, [740, 670, 560, 16]);
  // 체력 채움: 왼쪽 끝 고정(피벗 왼쪽) — 스크립트가 폭만 바꾼다(560 × 비율)
  b.sprite('Root/Card/Window/Hp/Fill', { anchor: 'middle-left', pivot: [0, 0.5], pos: [20, -10], rect_size: [560, 16], color: '#E0484E', alpha: 1, sprite_type: 1, raycast: false });
  b.patchComponent('Root/Card/Window/Hp/Fill', S.SPR, { ImageRUID: { DataId: '' }, Type: 1 });
  K.btn('Root/Card/Window/BtnNext', '다음', [1140, 718, 200, 62], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' }, { font: 'Maple', size: 22, color: C.goldInk });
  // 그만두기 확인창
  K.box('Root/Confirm', [0, 0, 1920, 1080], { enable: false });
  K.solid('Root/Confirm/Dimmer', C.veil, 0.6, [0, 0, 1920, 1080], { anchor: 'stretch', raycast: true });
  K.img('Root/Confirm/Window', 'panel_window', [660, 380, 600, 320], { raycast: true });
  K.text('Root/Confirm/Window/Title', '튜토리얼을 그만둘까요?', [700, 420, 520, 50], { font: 'Maple', size: 28, color: C.title, shadow: true });
  K.text('Root/Confirm/Window/Body', '진행한 내용은 남지 않고 로비로 돌아가요.', [700, 484, 520, 60], { font: 'Noto500', size: 19, color: C.ivory });
  K.btn('Root/Confirm/Window/BtnYes', '그만두기', [720, 592, 220, 62], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' }, { font: 'Maple', size: 22, color: C.ivory, shadow: true });
  K.btn('Root/Confirm/Window/BtnNo', '계속하기', [980, 592, 220, 62], { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' }, { font: 'Maple', size: 22, color: C.goldInk });
  const touched = S.chipText(b, { extra: { 'Root/Card/Window/Chip': ['Root/Card/Window/Chip/Text'] } });
  console.log('[tutorial] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'TutorialGroup.ui'), {
    lint_verbose: !!process.env.LINT_V,
    bind: {
      mlua: TUT_MLUA,
      props: {
        root: 'Root', fade: 'Root/Fade', stepRoot: 'Root/Step', stepText: 'Root/Step/Text', btnQuit: 'Root/BtnQuit',
        card: 'Root/Card', cardChip: 'Root/Card/Window/Chip/Text', cardTitle: 'Root/Card/Window/Title', cardBody: 'Root/Card/Window/Body',
        cardEmblem: 'Root/Card/Window/Emblem', cardHp: 'Root/Card/Window/Hp', cardHpFill: 'Root/Card/Window/Hp/Fill', cardHpText: 'Root/Card/Window/Hp/Text',
        btnCardNext: 'Root/Card/Window/BtnNext',
        confirm: 'Root/Confirm', btnConfirmYes: 'Root/Confirm/Window/BtnYes', btnConfirmNo: 'Root/Confirm/Window/BtnNo',
      },
    },
  });
}

// ── 쪽 그림 (시안 p1 ~ p7 · 판 안쪽 사각형 IN = 판 - 여백 22) ──
// 카드 3장(1쪽 · 6쪽) 공통 칸 위치: 안쪽 폭 1172 · 간격 18 → 378 x 3
const card3 = (IN) => [0, 1, 2].map((c) => [IN[0] + c * (378 + 18), IN[1], 378, IN[3]]);

function p1(K, base, IN) {
  const cards = [['intro_grow', '키우기', '사냥으로 Lv 1 → 30. 10 · 20 · 30에 전직해 새 스킬'], ['intro_defend', '지키기', '마을 하나를 차지하고 포탑 → 억제기 → 넥서스를 지킨다'], ['icon_balrog_heart', '쓰러뜨리기', '가장 먼저 발록을 쓰러뜨린 사람이 바로 승리']];
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
  const cy = IN[1] + 90; let x = IN[0] + (IN[2] - 834) / 2; // 방어선은 위쪽 168 칸에 · 아래 줄에 마을 문장
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
  // 마을 문장 5개(WO-050 §4 · 새 앰블럼): 한 줄 · 문장 72 + 아래 마을 이름. 방어선 아래 빈 자리.
  const TOWNS = [['emblem_henesys', '헤네시스'], ['emblem_kerning', '커닝시티'], ['emblem_ellinia', '엘리니아'], ['emblem_nautilus', '노틸러스'], ['emblem_perion', '페리온']];
  const GAP = 64; const EW = 72; const total = TOWNS.length * EW + (TOWNS.length - 1) * GAP;
  const ex0 = IN[0] + (IN[2] - total) / 2; const ey = IN[1] + 192;
  TOWNS.forEach((t, i) => {
    const ex = ex0 + i * (EW + GAP);
    K.img(`${base}/Town${i + 1}`, t[0], [ex, ey, EW, EW]);
    K.text(`${base}/TownName${i + 1}`, t[1], [ex - 14, ey + EW + 4, EW + 28, 20], { font: 'Noto700', size: 14, color: C.sub });
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

// ─────────────────────────────────────────── 2차: 재화 · 아이템 탭 ───────────────────────────────────────────
// 실제 게임 기준(2026-10-05 코드 · 표 확인 — 디자이너 표와 다른 점은 보고서 대조표). 숫자 근거:
//   TowerConfig · BossReward · DifficultyRule(BALROG_TICKET) · DifficultyConfig · MonsterRecruit · MonsterTraining · EnhanceTable · ShopItem ·
//   EliteMonsterInfo(CoinDrop · DreamDrop · SoulstoneDrop) · PortalNetwork.BossEntryCost(25) · SkillCaster.UltimateStoneCount(5) · PlayerRespawnService.MesoPenalty
// 🔴 게임 글꼴에 긴 줄표(—)가 없다(1차 실측) → 'NPC: 설명' 처럼 쌍점을 쓴다. 한글은 글자 단위로 꺾여 줄바꿈은 직접 넣는다(\n).
const CHIPK = { '공통 재화': 'chip_gold', '지역 재화': 'chip_green', '특수 재화': 'chip_blue', '계정 재화': 'chip_red', '한눈에': 'chip_gray' };
const CUR = [
  { name: '메소', cat: '공통 재화', icon: { key: 'icon_meso' }, sum: '어디서나 버는 기본 돈 · 매치가 끝나면 사라져요(시작 100)',
    get: ['사냥터 몬스터: 땅에 떨어진 동전', '미니언 웨이브: 잡으면 바로 들어와요', '엘리트 몬스터 · 마노(처음 잡은 사람 500)'],
    use: ['물약 상인: 물약 9가지(30 ~ 900)', '강화 장인: 강화 850 · 2,550 · 6,800', '제작 장인: 장비 만들기(지역 재화와 함께)', '쓰러졌을 때 부활: 5,000(메소) 또는 경험치'],
    key: '시설 강화 · 수리는 메소가 아니라 빅토리아 주화예요' },
  { name: '보석 (12종)', cat: '공통 재화', icon: { ruid: GEMS[0][2] }, sum: '장비 강화 재료 · 보석마다 오르는 능력치가 달라요',
    get: ['사냥터 몬스터: 사냥터 2 · 3일수록 잘 나와요', '엘리트 몬스터'],
    use: ['강화 장인: +1 · +2 · +3 에 1 · 2 · 3개 + 메소', '다이아몬드 · 사파이어는 무기에만', '도감 관리인: 몬스터 해금에 다이아몬드 8개'],
    extra: 'gems', key: '넣은 보석 = 오르는 능력치(다이아몬드 = 공격력)' },
  { name: '빅토리아 주화', cat: '공통 재화', icon: { key: 'icon_victoria_coin' }, sum: '마을 방어 시설 전용 재화 · 엘리트 몬스터와 웨이브 미니언이 줘요',
    get: ['엘리트 몬스터: 20 · 40 · 60개(사냥터 1 · 2 · 3)', '엘리트는 한 맵에서 25마리 잡을 때마다', '웨이브 미니언: 20 ~ 30% 확률로 10개'],
    use: ['방어 시설 관리인에게서 써요', '포탑 강화 20 · 40 / 억제기 강화 30 · 60', '재건: 포탑 30 · 억제기 50', '수리: 다 고치면 약 40 · 넥서스는 재건 불가'],
    key: '엘리트를 잡아 모아요 · 리스항구에는 엘리트가 없어요' },
  { name: '지역 재화 (5종)', cat: '지역 재화', icon: { ruid: REGIONS[0][2] }, sum: '그 지역 사냥터에서만 나오는 재화 · 리스항구에는 없어요',
    get: ['그 지역 사냥터 몬스터(사냥터 3에서 많이)', '엘리트 몬스터'],
    use: ['지역 보스 입장: 보스 포탈에서 ↑ 두 번 · 25개', '제작 장인: 장비 만들기 3 ~ 20개 + 메소', '차원 관문: 준비 중'],
    extra: 'regions', key: '25개 모이면 그 지역 보스에 도전 → 영혼석 · 꿈의 조각' },
  { name: '몬스터 재료 (14종)', cat: '지역 재화', icon: { ruid: MATS[0][1] }, sum: '몬스터마다 다른 재료 · 수비대를 모집할 때 써요',
    get: ['그 몬스터: 사냥터 1 · 2 · 3 = 25 · 35 · 50%'],
    use: ['몬스터 모집관: 같은 재료 8개 = 수비대 5마리', '먼저 도감 관리인 해금(다이아몬드 8개)'],
    extra: 'mats', key: '해금(도감 관리인) → 모집(모집관) → 훈련(조련사)' },
  { name: '꿈의 조각', cat: '특수 재화', icon: { ruid: ITEM.dream }, sum: '수비대를 훈련시키는 재료',
    get: ['지역 보스 5종: 가장 많이 때린 사람 60개', '엘리트 몬스터: 8 · 16 · 24개'],
    use: ['몬스터 조련사: 훈련 Lv 2 · 3 · 4 · 5', '꿈의 조각 3 · 5 · 10 · 15개', '능력 1.5 · 2.2 · 3.3 · 5배'],
    key: '훈련은 그 뒤에 모집하는 수비대부터 세져요' },
  { name: '낙인의 영혼석', cat: '특수 재화', icon: { ruid: ITEM.soul }, sum: '주니어 발록 입장권 · 궁극기 재료',
    get: ['지역 보스 5종: 가장 많이 때린 사람', '★1 20 · ★3 30 · ★5 60개', '엘리트 몬스터: 1개', '마노 · 주니어 발록은 주지 않아요'],
    use: ['주니어 발록 도전: 도전할 때마다', '★1 5 · ★3 30 · ★5 200개', '궁극기(3차): 쓸 때마다 5개'],
    key: '주니어 발록은 슬리피우드(여섯갈래길에서) · 먼저 잡으면 우승!' },
  { name: '에너지 코어', cat: '특수 재화', icon: { ruid: ITEM.core }, sum: '차원 관문에서 쓸 코어 · 지금은 준비 중이에요',
    get: ['지역 보스 5종: 가장 많이 때린 사람 1개'],
    use: ['차원 관문(여섯갈래길): 다른 지역으로 이동', '지금은 준비 중 · 모아 두기만 하세요'],
    key: '준비 중인 기능이에요' },
  { name: '단풍 봉인석', cat: '특수 재화', icon: { ruid: ITEM.seal }, sum: '강한 앱솔랩스 장비와 바꾸는 돌',
    get: ['지역 보스 5종: 처음 잡을 때', '가장 많이 때린 사람 1개'],
    use: ['제작 장인: 앱솔랩스 장비 하나와 1 : 1 교환'],
    key: '보스를 먼저 잡으면 강한 장비!' },
  { name: '발록의 심장', cat: '계정 재화', icon: { key: 'icon_balrog_heart' }, sum: '계정에 남는 재화 · 매치가 끝나도 사라지지 않아요',
    get: ['매치 순위 보상(결과 창)'],
    use: ['로비: 매치 입장료', '★1 1 · ★3 3 · ★5 5개', '혼자면 ★1 무료 · ★3 2 · ★5 4개'],
    key: '★1 은 무료 심장으로도 들어갈 수 있어요' },
  { name: '누가 무엇을 주나', cat: '한눈에', icon: { key: 'icon_info' }, sum: '몬스터마다 주는 재화를 한눈에',
    extra: 'table', key: '엘리트 · 보스 보상은 마지막 타격 · 가장 많이 때린 사람에게' },
];
// 누가 무엇을 주나: [이름, 설명, [[아이콘, 글], ...]] — 아이콘 = ruid-map 키 또는 { ruid }
const WHO = [
  ['사냥터 몬스터', '마지막에 때린 사람', [['icon_meso', '메소'], [{ ruid: ITEM.gem }, '보석'], [{ ruid: ITEM.region }, '지역 재화'], [{ ruid: ITEM.mat }, '몬스터 재료']]],
  ['웨이브 미니언', '잡으면 바로', [['icon_meso', '메소'], ['icon_info_exp', '경험치'], ['icon_victoria_coin', '주화 · 가끔']]],
  ['엘리트 몬스터', '25마리마다 · 마지막 타격', [['icon_meso', '메소'], [{ ruid: ITEM.gem }, '보석'], [{ ruid: ITEM.region }, '지역'], [{ ruid: ITEM.mat }, '재료'], ['icon_victoria_coin', '주화'], [{ ruid: ITEM.dream }, '꿈의 조각'], [{ ruid: ITEM.soul }, '영혼석']]],
  ['지역 보스 5종', '가장 많이 때린 1명', [[{ ruid: ITEM.soul }, '영혼석 20 ~ 60'], [{ ruid: ITEM.dream }, '꿈의 조각 60'], [{ ruid: ITEM.core }, '코어 1'], [{ ruid: ITEM.seal }, '봉인석(처음)']]],
  ['마노', '처음 잡은 사람', [['icon_meso', '메소 500'], ['ico_shield', '체력 갑옷']]],
  ['주니어 발록', '먼저 잡으면 우승', [['icon_balrog_heart', '순위 보상: 발록의 심장']]],
];
// 🔴 아이템 그림(ItemInfo.IconRUID)은 PreserveSprite 0(칸에 맞춰 채움). 1(비율 유지)이면 그림 피벗을 따라 칸 위쪽으로 밀려
//   목록 · 격자의 이름을 덮었다(2026-10-05 2차 Play 캡처) — 인벤토리 · 퀵슬롯 · 월드맵(apply-worldmap.cjs:167)과 같은 규칙.
const ITEM_FIT = { PreserveSprite: 0 };
function iconAt(K, P, icon, r) {
  // 아이콘 하나: ruid-map 키면 디자인 그림, { ruid } 면 아이템 그림(칸에 맞춤)
  if (typeof icon === 'string') { K.img(P, icon, r); return; }
  if (icon.key) { K.img(P, icon.key, r); return; }
  K.raw(P, icon.ruid, r); K.b.patchComponent(P, S.SPR, ITEM_FIT);
}
function buildCur(K) {
  const T = 'Root/Window/TabCur';
  K.box(T, PANE, { enable: false });
  // 왼쪽 목록 11칸: 파란 줄 판 + 고른 줄 금테(Sel) + 아이콘 + 이름 + 분류
  K.box(T + '/List', [348, 255, 340, 620]);
  CUR.forEach((e, i) => {
    const y = 255 + i * 56; const R = [348, y, 340, 52]; const P = `${T}/List/Row${i + 1}`;
    K.btn(P, '', R, { normal: 'panel_row', hover: 'panel_row_hover', pressed: 'panel_row_hover' });
    K.img(P + '/Sel', 'panel_row_selected', R, { enable: i === 0 });
    iconAt(K, P + '/Icon', e.icon, [362, y + 8, 36, 36]);
    K.text(P + '/Name', e.name, [408, y, 170, 52], { font: 'Maple', size: 18, color: C.ivory, h: 'left' });   // 가장 긴 '몬스터 재료 (14종)' 실측 약 147
    K.text(P + '/Cat', e.cat, [580, y, 80, 52], { font: 'Noto700', size: 12, color: C.faint, h: 'right' });   // 오른쪽 끝 장식(약 20)에 '화'가 걸려 16 당김(Play 캡처)
  });
  // 오른쪽 설명 판: 항목마다 하나(D1 ~ D11) — 컨트롤러가 고른 것만 켠다
  K.img(T + '/Detail', 'panel_inner', [704, 255, 868, 620]);
  CUR.forEach((e, i) => curDetail(K, `${T}/Detail/D${i + 1}`, e, i === 0));
}
function curDetail(K, P, e, on) {
  const X = 728; const W = 820;
  K.box(P, [704, 255, 868, 620], { enable: on });
  K.img(P + '/Frame', 'slot_frame', [X, 279, 96, 96]);
  iconAt(K, P + '/Frame/Icon', e.icon, [X + 12, 291, 72, 72]);
  K.text(P + '/Name', e.name, [X + 112, 281, 690, 40], { font: 'Maple', size: 30, color: C.title, h: 'left', shadow: true });
  const cw = Math.ceil(estW(e.cat, 14)) + 28;
  K.img(P + '/Chip', CHIPK[e.cat], [X + 112, 327, cw, 26]);
  K.text(P + '/Chip/Text', e.cat, [X + 112, 327, cw, 26], { font: 'Noto700', size: 14, color: C.white });
  K.text(P + '/Sum', e.sum, [X + 112, 359, W - 112, 28], { font: 'Noto700', size: 17, color: C.ivory, h: 'left' });
  K.solid(P + '/Line', C.gold, 0.3, [X, 399, W, 1]);
  let yEnd = 405;
  if (e.extra !== 'table') {
    const col = (name, title, lines, x) => {
      K.text(`${P}/${name}`, title, [x, 411, 300, 28], { font: 'Maple', size: 20, color: C.gold, h: 'left' });
      let y = 447;
      lines.forEach((t, j) => {
        const n = (t.match(/\n/g) || []).length + 1; const h = n * 24;
        if (nLines(t, 15, 380) > n) console.log(`  · 재화 '${e.name}' ${title} ${j + 1}줄은 어림으로 넘칠 수 있음: ${t}`);
        K.diamond(`${P}/${name}/D${j + 1}`, x + 5, y + 12, 4.95, C.gold, 1);
        K.text(`${P}/${name}/T${j + 1}`, t, [x + 16, y, 380, h], { font: 'Noto500', size: 15, color: C.ivory, h: 'left', v: 'top' });
        y += h + 6;
      });
      return y;
    };
    yEnd = Math.max(col('Get', '얻는 곳', e.get, X), col('Use', '쓰는 곳', e.use, X + 424));
  }
  const y0 = yEnd + 12;
  if (e.extra === 'gems') {
    const cw2 = W / 6;
    GEMS.forEach((g, i) => {
      const cx = X + (i % 6) * cw2; const cy = y0 + Math.floor(i / 6) * 64;
      K.raw(`${P}/Gem${i + 1}`, g[2], [cx + cw2 / 2 - 18, cy, 36, 36]); K.b.patchComponent(`${P}/Gem${i + 1}`, S.SPR, ITEM_FIT);
      K.text(`${P}/GemName${i + 1}`, `${g[0]} · ${g[1]}`, [cx, cy + 40, cw2, 18], { font: 'Noto700', size: 12, color: C.sub });
    });
  } else if (e.extra === 'regions') {
    const cw2 = W / 5;
    REGIONS.forEach((g, i) => {
      const cx = X + i * cw2;
      K.raw(`${P}/Reg${i + 1}`, g[2], [cx + cw2 / 2 - 20, y0, 40, 40]); K.b.patchComponent(`${P}/Reg${i + 1}`, S.SPR, ITEM_FIT);
      K.text(`${P}/RegName${i + 1}`, g[0], [cx, y0 + 44, cw2, 18], { font: 'Noto700', size: 13, color: C.ivory });
      K.text(`${P}/RegArea${i + 1}`, g[1], [cx, y0 + 62, cw2, 16], { font: 'Noto500', size: 12, color: C.sub });
    });
  } else if (e.extra === 'mats') {
    const cw2 = W / 7;
    MATS.forEach((g, i) => {
      const cx = X + (i % 7) * cw2; const cy = y0 + Math.floor(i / 7) * 58;
      K.raw(`${P}/Mat${i + 1}`, g[1], [cx + cw2 / 2 - 16, cy, 32, 32]); K.b.patchComponent(`${P}/Mat${i + 1}`, S.SPR, ITEM_FIT);
      K.text(`${P}/MatName${i + 1}`, g[0], [cx, cy + 36, cw2, 16], { font: 'Noto700', size: 12, color: C.sub });
    });
  } else if (e.extra === 'table') {
    WHO.forEach((w, i) => {
      const y = 411 + i * 66; const R = [X, y, W, 60]; const Q = `${P}/Who${i + 1}`;
      K.fill(Q, C.navy900, 0.45, R);
      K.text(Q + '/Name', w[0], [X + 14, y + 6, 190, 26], { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
      K.text(Q + '/Desc', w[1], [X + 14, y + 32, 190, 20], { font: 'Noto500', size: 13, color: C.sub, h: 'left' });
      let x = X + 214;
      w[2].forEach((it, j) => {
        const lw = Math.ceil(estW(it[1], 13));
        iconAt(K, `${Q}/I${j + 1}`, it[0], [x, y + 16, 28, 28]);
        K.text(`${Q}/L${j + 1}`, it[1], [x + 31, y + 16, lw + 6, 28], { font: 'Noto700', size: 13, color: C.ivory, h: 'left' });
        x += 31 + lw + 14;
      });
      if (x > X + W) console.log(`⚠ 누가 무엇을 주나 '${w[0]}' 줄이 판을 넘음: ${x} > ${X + W}`);
    });
  }
  // 핵심 한 줄(소개 쪽과 같은 모양)
  const KR = [X, 819, W, 44];
  K.fill(P + '/KeyLine', C.gold, 0.16, KR);
  K.solid(P + '/KeyLine/Bar', C.gold, 1, [KR[0], KR[1], 3, KR[3]]);
  K.img(P + '/KeyLine/Chip', 'chip_gold', [X + 16, 829, 50, 24]);
  K.text(P + '/KeyLine/Chip/Text', '핵심', [X + 16, 829, 50, 24], { font: 'Maple', size: 13, color: C.goldInk });
  K.text(P + '/KeyLine/Text', e.key, [X + 78, 826, W - 92, 30], { font: 'Noto700', size: 16, color: C.ivory, h: 'left' });
}

// ─────────────────────────────────────────── 2차: 마을 NPC 탭 ───────────────────────────────────────────
// FunctionalNpcCatalog.csv(이름 · 구역 · OWNER_ONLY) + 각 서비스 코드에서 확인한 하는 일. 아이콘 = 각 NPC 창 제목 아이콘 계열(ruid-map).
const USE = { meso: { key: 'icon_meso' }, coin: { key: 'icon_victoria_coin' }, gem: { ruid: ITEM.gem }, region: { ruid: ITEM.region }, mat: { ruid: ITEM.mat }, dream: { ruid: ITEM.dream }, seal: { ruid: ITEM.seal } };
const NPCZ = [
  ['공방', '장비 · 물약', [
    ['제작 장인', 'ico_sword', '장비 만들기: 지역 재화 + 메소\n단풍 봉인석 → 앱솔랩스 장비', ['region', 'meso', 'seal']],
    ['강화 장인', 'ico_gem', '장비 강화 +1 · +2 · +3\n보석 1 · 2 · 3개 + 메소', ['gem', 'meso']],
    ['물약 상인', 'ico_potion', '물약 9가지를 메소로 사요\n빨간 · 파란 포션은 30', ['meso']]]],
  ['생활', '창고 · 수비대', [
    ['창고지기', 'ico_bag', '마을 창고에 아이템을 맡겨요\n(마을 주인 공용)', []],
    ['몬스터 모집관', 'ico_party', '수비대 5마리 = 재료 8개\n도감에서 해금한 몬스터만', ['mat']],
    ['몬스터 조련사', 'ico_star', '수비대 훈련 Lv 2 ~ 5\n꿈의 조각 3 · 5 · 10 · 15개', ['dream']]]],
  ['기록', '도감 · 통계', [
    ['도감 관리인', 'ico_book', '몬스터 해금: 다이아몬드 8개\n해금해야 모집할 수 있어요', ['gem']],
    ['통계 분석관', 'ico_trophy', '살아 있는 플레이어들의\n요약을 볼 수 있어요', []]]],
  ['방어', '시설 · 파병', [
    ['방어 시설 관리인', 'ico_shield', '포탑 · 억제기 강화 · 재건 · 수리\n빅토리아 주화를 써요', ['coin']],
    ['파병 담당관', 'icon_flag', '수비대를 다른 마을로 보내요\n1페이즈부터 · 비용 없음', []]]],
];
const NPCB = [
  ['전직관 5명 · 리스항구', 'job_warrior', 'Lv 10에 클릭해 1차 전직\n2 · 3차(Lv 20 · 30)는 저절로'],
  ['물약 상인 · 리스항구', 'ico_potion', '빨간 · 파란 포션 30 메소\n누구나 쓸 수 있어요'],
  ['매치 안내원 · 로비', 'ico_map', '매치 만들기 · 들어가기\n처음이면 ★1 입문'],
];
function buildNpc(K) {
  const T = 'Root/Window/TabNpc';
  K.box(T, PANE, { enable: false });
  // 위 띠: 주인만 · 수비대 순서
  K.fill(T + '/Note', C.navy900, 0.55, [348, 255, 1224, 64]);
  K.solid(T + '/Note/Bar', C.gold, 1, [348, 255, 3, 64]);
  K.img(T + '/Note/Icon', 'icon_info', [366, 275, 24, 24]);
  K.text(T + '/Note/Line1', '마을 NPC는 그 마을 <color=#E8B64C><b>주인만</b></color> 쓸 수 있어요. 빈 마을의 <b>넥서스</b>를 누르면 내 마을이 돼요.', [402, 259, 1150, 28], { font: 'Noto700', size: 16, color: C.ivory, h: 'left' });
  K.text(T + '/Note/Line2', '수비대: 도감 관리인(해금) → 몬스터 모집관(모집) → 몬스터 조련사(훈련) · 파병 담당관(다른 마을로)', [402, 287, 1150, 26], { font: 'Noto500', size: 15, color: C.sub, h: 'left' });
  // 구역 4칸
  NPCZ.forEach((z, zi) => {
    const x = 348 + zi * 308; const Z = `${T}/Zone${zi + 1}`;
    K.img(Z, 'panel_inner', [x, 331, 300, 440]);
    K.text(Z + '/Name', `${z[0]} 구역`, [x + 16, 343, 120, 28], { font: 'Maple', size: 20, color: C.title, h: 'left', shadow: true });
    K.text(Z + '/Sub', z[1], [x + 140, 343, 144, 28], { font: 'Noto500', size: 13, color: C.sub, h: 'right' });
    z[2].forEach((n, ni) => {
      const y = 381 + ni * 126; const N = `${Z}/Npc${ni + 1}`;
      K.fill(N, C.navy900, 0.4, [x + 10, y, 280, 118]);
      K.img(N + '/Slot', 'slot_frame', [x + 18, y + 8, 40, 40]);
      K.img(N + '/Slot/Icon', n[1], [x + 24, y + 14, 28, 28]);
      K.text(N + '/Name', n[0], [x + 66, y + 8, 216, 40], { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
      K.text(N + '/Role', n[2], [x + 18, y + 52, 268, 40], { font: 'Noto500', size: 13, color: C.sub, h: 'left', v: 'top' });
      n[3].forEach((u, ui) => iconAt(K, `${N}/Use${ui + 1}`, USE[u], [x + 18 + ui * 28, y + 94, 22, 22]));
    });
  });
  // 아래 띠: 리스항구 · 로비 NPC
  NPCB.forEach((n, i) => {
    const x = 348 + i * 412; const B = `${T}/Other${i + 1}`;
    K.fill(B, C.navy900, 0.45, [x, 779, 400, 92]);
    K.img(B + '/Slot', 'slot_frame', [x + 12, 791, 56, 56]);
    K.img(B + '/Slot/Icon', n[1], [x + 20, 799, 40, 40]);
    K.text(B + '/Name', n[0], [x + 80, 785, 312, 28], { font: 'Maple', size: 18, color: C.ivory, h: 'left' });
    K.text(B + '/Role', n[2], [x + 80, 813, 312, 44], { font: 'Noto500', size: 13, color: C.sub, h: 'left', v: 'top' });
  });
}

// ─────────────────────────────────────────── 2차: 조작키 탭 ───────────────────────────────────────────
// 2026-10-05 런타임 GetActionName 과 코드에서 확인한 키(1차 보고서 '조작 정리'와 같음). 색 = 소개 7쪽 키보드 5색 + 회색(마우스 · 자동).
const KEYCOL = Object.assign({}, KEYG, { ms: ['#56637F', '마우스 · 자동'] });
const KEYTAB = [
  [['mv', [[['←', '→'], '걷기'], [['↑'], '사다리 · 밧줄 오르기 · 포탈 들어가기'], [['↓'], '내려가기 · ↓ + 점프 = 아래 점프'], [['Space', '왼쪽 Alt'], '점프 · 공중에서 Space = 2단 점프']]],
   ['at', [[['왼쪽 Ctrl'], '기본 공격(무기 없이도 돼요)']]],
   ['sk', [[['Q', 'W', 'E', 'R', 'Shift'], '스킬(직업마다 · 초보자는 Q)'], [['1', '2'], '물약 칸(가방에서 끌어다 놓기)']]]],
  [['ui', [[['C'], '캐릭터(스탯 · 장비 · 인벤토리)'], [['K'], '스킬 창'], [['M'], '월드맵'], [['H'], '도움말(이 창)']]],
   ['et', [[['Esc'], '창 닫기'], [['Enter'], '채팅']]],
   ['ms', [[['클릭'], 'NPC 말 걸기 · 넥서스 차지 · 버튼'], [['자동'], '아이템 · 메소 줍기(가까이 가면)'], [['↑ ↑'], '보스 포탈: 8초 안에 두 번 · 지역 재화 25'], [['방향키'], '탈락 뒤 관전(WASD 도 돼요)']]]],
];
function buildKeys(K) {
  const T = 'Root/Window/TabKey';
  K.box(T, PANE, { enable: false });
  KEYTAB.forEach((colGroups, ci) => {
    const x = 348 + ci * 624; let y = 263;
    colGroups.forEach((g, gi) => {
      const G = `${T}/C${ci + 1}G${gi + 1}`; const col = KEYCOL[g[0]];
      K.box(G, [x, y, 600, 36]);
      K.fill(G + '/Swatch', col[0], 1, [x, y + 10, 16, 16]);
      K.text(G + '/Name', col[1], [x + 24, y, 300, 36], { font: 'Maple', size: 20, color: C.title, h: 'left' });
      y += 40;
      g[1].forEach((row, ri) => {
        const R = `${G}/Row${ri + 1}`; let kx = x + 8;
        row[0].forEach((k, ki) => {
          const kw = Math.max(40, Math.ceil(estW(k, 14)) + 20);
          K.fill(`${R}K${ki + 1}`, col[0], 1, [kx, y + 4, kw, 30]);
          K.text(`${R}K${ki + 1}/Text`, k, [kx, y + 4, kw, 30], { font: /^[A-Z]$/.test(k) ? 'Maple' : 'FootballB', size: 14, color: C.white });
          kx += kw + 6;
        });
        const dx = Math.max(kx + 8, x + 8 + 200);
        K.text(`${R}Desc`, row[1], [dx, y, x + 600 - dx, 38], { font: 'Noto500', size: 16, color: C.ivory, h: 'left' });
        if (nLines(row[1], 16, x + 600 - dx) > 1) console.log(`  · 조작키 '${row[1]}' 한 줄을 넘을 수 있음`);
        y += 42;
      });
      y += 14;
    });
    if (y > 875) console.log(`⚠ 조작키 ${ci + 1}열이 판을 넘음: ${y}`);
  });
}

// ─────────────────────────────────────────── 2차: 알림 카드 ───────────────────────────────────────────
// 화면 오른쪽 가운데(HUD · 목표 바 · 레벨업 알림 · 스킬 · 상태창을 피함 · 설계 검토 [1510,360]) · 글자 · 아이콘은 TipController 가 알림마다 넣는다.
function buildTip() {
  const b = new UIBuilder('TipGroup', 5, true);
  const K = kit(b);
  K.root('Root', false);
  const CD = [1420, 352, 480, 172];
  K.img('Root/Card', 'panel_tooltip', CD, { raycast: true });
  K.solid('Root/Card/Accent', C.gold, 1, [CD[0] + 10, CD[1] + 18, 3, CD[3] - 36]);
  K.img('Root/Card/IconSlot', 'slot_frame', [CD[0] + 22, CD[1] + 18, 56, 56]);
  K.raw('Root/Card/IconSlot/Icon', S.R('icon_info'), [CD[0] + 30, CD[1] + 26, 40, 40]);
  K.text('Root/Card/Title', '알림', [CD[0] + 90, CD[1] + 16, 330, 30], { font: 'Maple', size: 18, color: C.title, h: 'left' });
  K.btn('Root/Card/BtnClose', '', [CD[0] + CD[2] - 42, CD[1] + 14, 28, 28], { normal: 'icon_close' });
  K.text('Root/Card/Body', '내용', [CD[0] + 90, CD[1] + 50, 370, 66], { font: 'Noto500', size: 14, color: C.ivory, h: 'left', v: 'top' });
  K.text('Root/Card/Hint', '★1 안내 · 끄려면 목표 바의 [안내 끄기]', [CD[0] + 22, CD[1] + CD[3] - 42, 250, 28], { font: 'Noto500', size: 12, color: C.faint, h: 'left' });
  K.btn('Root/Card/BtnMore', '자세히 보기', [CD[0] + CD[2] - 148, CD[1] + CD[3] - 46, 132, 34], { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed' }, { font: 'Noto700', size: 14, color: C.ivory });
  const touched = S.chipText(b);
  console.log('[tip] chipText', touched.length, '· entities', b.listEntities().length);
  b.write(path.join(WORLD, 'ui', 'TipGroup.ui'), {
    lint_verbose: !!process.env.LINT_V,
    bind: {
      mlua: TIP_MLUA,
      props: { root: 'Root', card: 'Root/Card', icon: 'Root/Card/IconSlot/Icon', titleText: 'Root/Card/Title', bodyText: 'Root/Card/Body', btnMore: 'Root/Card/BtnMore', btnClose: 'Root/Card/BtnClose' },
    },
  });
}

// ─────────────────────────────────────────── 실행 ───────────────────────────────────────────
const ARGS = process.argv.slice(2).map((a) => a.toLowerCase());
const want = (k) => ARGS.length === 0 || ARGS.includes(k);
if (ARGS.length === 0) console.log('⚠ 인자 없음 → 네 파일 전부 다시 만든다(UUID 새로 · Maker 에서 손댄 값 지워짐). 하나만: intro | coach | hud | tip');
if (want('intro')) buildIntro();
if (want('coach')) buildCoach();
if (want('hud') || want('help')) buildHelp();
if (want('tip')) buildTip();
if (want('tutorial')) buildTutorial();
console.log('끝 — ' + (ARGS.length ? ARGS.join(' · ') : 'intro · coach · hud · tip · tutorial'));
