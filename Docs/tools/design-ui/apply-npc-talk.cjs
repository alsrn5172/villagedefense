// 전직관 NPC 대화창(CommonNpcGroup/NpcTalk)을 디자이너 시안 "NPC 대화창 · 전직"(2026-10-07 인계 · 1440×470)대로 입힌다 (WO-054).
//   좌표 = 시안 HTML(dlgWin · lvBar · skillPrev) 의 CSS 를 그대로 계산한 창 안 좌표(왼쪽 위 기준). 창 = 캔버스 (240,560) 1440×470 · 아래 50 띄움.
//   기존 엔티티(NpcTalk · PortraitBg · NamePlate · Portrait · TextBg · Line · BtnEnd · BtnYes)는 지우지 않고 patch — 스크립트 UUID 바인딩 보존.
//   새 노드: 초상 무대 안쪽 · 역할 칩 · 스킬 칸 2 · 왼쪽 정보(레벨 게이지 · 다음 할 일) · 아래 윗선 · [다른 직업 보기] 버튼 · 직업 아이콘 · 전직 완료 연출(JobNotice).
//   UUID 는 write({bind}) 로 Npc/NpcTalkController.mlua 에 넣는다.
// 실행(월드 루트): node Docs/tools/design-ui/apply-npc-talk.cjs   → 그 뒤 Maker refresh
const path = require('path');
const S = require('./skin.cjs');
const C = S.COLOR;
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'CommonNpcGroup');

const ROUND = 'f5e5fbd6dd224f2d8a5af320436b95f0';   // 흰 둥근사각 9-slice(64×64 · 반경 12 · 테두리 14) — 틴트용 공용
const JOBS = ['WARRIOR', 'MAGICIAN', 'ARCHER', 'THIEF', 'PIRATE'];

// 시안 좌표(창 왼쪽 위 기준 x,y,w,h)
const WIN = [0, 0, 1440, 470];
const STAGE = [34, 30, 320, 290];
const PANE = [378, 30, 1028, 340];
const INFO = [30, 388, 700, 60];
const SKILLS = [408, 143, 968, 84];
const BTN_Y = -183.5;       // 푸터 가운데(창 아래에서 4 + 48)

const ctr = (p, r, parent) => S.place(b, p, { anchor: 'middle-center', pivot: [0.5, 0.5], pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] });
const img = (p, key, r, parent, o) => S.newImage(b, p, key, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
const txt = (p, text, r, parent, o) => S.newText(b, p, text, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), rect: [r[2], r[3]] }, o || {}));
const box = (p, r, parent, o) => S.newBox(b, p, Object.assign({ pos: S.at(r[0], r[1], r[2], r[3], parent), size: [r[2], r[3]] }, o || {}));
// 흰 둥근사각 틴트 판(새 노드)
const round = (p, r, parent, color, alpha) => b.sprite(p, { anchor: 'middle-center', pos: S.at(r[0], r[1], r[2], r[3], parent), rect_size: [r[2], r[3]], pivot: [0.5, 0.5], image_ruid: ROUND, sprite_type: 1, color, alpha, raycast: false });
const roundStyle = (p, color, alpha) => { b.patchComponent(p, S.SPR, { ImageRUID: { DataId: ROUND }, Type: 1, Color: S.C(color, alpha) }); };
const ivoryFont = (p, o) => S.font(b, p, Object.assign({ font: 'Noto500', size: 14, color: C.ivory, h: 'left', v: 'middle', outline: false, shadow: true }, o || {}));

// ── 1. 창 틀 ──
S.place(b, 'NpcTalk', { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [0, -255], size: [1440, 470] });
S.image(b, 'NpcTalk', 'panel_window');
b.patchComponent('NpcTalk', S.SPR, { RaycastTarget: true });      // 대화창 뒤 월드가 눌리지 않게
b.patch('NpcTalk/Title', { enable: false });                      // 옛 제목 · 안내 줄은 끈다(지우면 UUID 바인딩이 깨질 수 있다)
b.patch('NpcTalk/NextHint', { enable: false });

// ── 2. 왼쪽: 초상 무대 · 이름 판 ──
ctr('NpcTalk/PortraitBg', STAGE, WIN);
roundStyle('NpcTalk/PortraitBg', C.gold, 0.45);                   // 금 안쪽 테두리 2px(시안 inset 0 0 0 2px)
round('NpcTalk/PortraitBg/Fill', [36, 32, 316, 286], STAGE, '#203868', 1);
S.back(b, 'NpcTalk/PortraitBg/Fill');
// NPC 그림: 폭 220 · 바닥에서 8 띄움(바닥 가운데 피벗 · 비율 유지)
S.place(b, 'NpcTalk/PortraitBg/Portrait', { anchor: 'middle-center', pivot: [0.5, 0], pos: [0, -137], size: [220, 220] });
ctr('NpcTalk/PortraitBg/NamePlate', [34, 330, 320, 40], STAGE);
S.image(b, 'NpcTalk/PortraitBg/NamePlate', 'plate_dark');
S.font(b, 'NpcTalk/PortraitBg/NamePlate', { font: 'Maple', size: 18, color: C.ivory, h: 'center', v: 'middle', outline: false, shadow: true });
for (const j of JOBS) {
  img(`NpcTalk/PortraitBg/NamePlate/Icon_${j}`, 'job_' + j.toLowerCase(), [0, 0, 22, 22], [0, 0, 320, 40], { pos: [-70, 0], size: [22, 22], enable: false });
}

// ── 3. 오른쪽: 대사 판 · 역할 칩 · 대사 · 스킬 칸 ──
ctr('NpcTalk/TextBg', PANE, WIN);
S.image(b, 'NpcTalk/TextBg', 'panel_inner');
img('NpcTalk/TextBg/Role', 'chip_red_dark', [408, 56, 100, 23], PANE);
txt('NpcTalk/TextBg/Role/Label', '전사 전직관', [408, 56, 100, 23], [408, 56, 100, 23], { font: 'Noto700', size: 14, color: '#FFFFFF', h: 'center', shadow: true });
ctr('NpcTalk/TextBg/Line', [408, 93, 968, 96], PANE);
S.font(b, 'NpcTalk/TextBg/Line', { font: 'Noto500', size: 20, color: C.ivory, h: 'left', v: 'top', outline: false, shadow: true, text: '' });
// 줄 간격 1.6(시안) — 글자 기본 줄 높이에 더하는 값. Maker 에서 눈으로 맞춘다.
b.patchComponent('NpcTalk/TextBg/Line', S.TXT, { IsRichText: true, SpacingOption: { Character: 0, Line: 6, Paragraph: 0, Word: 0 } });

box('NpcTalk/TextBg/Skills', SKILLS, PANE, { enable: false });
[0, 1].forEach((i) => {
  const x0 = SKILLS[0] + i * 490;
  const CARD = [x0, SKILLS[1], 478, 84];
  const cp = `NpcTalk/TextBg/Skills/S${i + 1}`;
  img(cp, 'panel_row', CARD, SKILLS);
  img(cp + '/Slot', 'slot_frame', [x0 + 18, SKILLS[1] + 12, 60, 60], CARD);
  img(cp + '/Icon', 'ico_star', [x0 + 27, SKILLS[1] + 21, 42, 42], CARD);
  txt(cp + '/Name', '스킬 이름', [x0 + 92, SKILLS[1] + 19, 368, 26], CARD, { font: 'Maple', size: 18, color: C.ivory, h: 'left', shadow: true, overflow: 1 });
  txt(cp + '/Desc', 'Q · 한 줄 설명', [x0 + 92, SKILLS[1] + 47, 368, 20], CARD, { font: 'Noto500', size: 14, color: C.sub, h: 'left', overflow: 1 });
});

// ── 4. 푸터: 윗선 · 왼쪽 정보 · 버튼 ──
b.sprite('NpcTalk/FootLine', { anchor: 'middle-center', pos: [0, -135.5], rect_size: [1432, 1], pivot: [0.5, 0.5], color: '#E9B24A', alpha: 0.35, sprite_type: 0, raycast: false });
S.back(b, 'NpcTalk/FootLine');

box('NpcTalk/Info', INFO, WIN);
// (a) 전직까지 레벨 게이지
box('NpcTalk/Info/Lv', INFO, INFO, { enable: false });
txt('NpcTalk/Info/Lv/Label', '전직까지', [30, 406, 80, 24], INFO, { font: 'Noto700', size: 16, color: C.sub, h: 'left', shadow: true });
img('NpcTalk/Info/Lv/Gauge', 'gauge_track', [118, 407, 220, 22], INFO);
img('NpcTalk/Info/Lv/Gauge/Fill', 'gauge_fill_gold', [0, 0, 188, 10], [0, 0, 220, 22], { pos: [0, 0], size: [188, 10], type: 0 });
txt('NpcTalk/Info/Lv/Num', 'Lv 9 / 10', [350, 406, 140, 24], INFO, { font: 'FootballB', size: 18, color: C.gold, h: 'left', shadow: true });
// (b) 다음 할 일 칩 + 글
box('NpcTalk/Info/Next', INFO, INFO, { enable: false });
img('NpcTalk/Info/Next/Chip', 'chip_gold', [30, 406, 84, 24], INFO);
txt('NpcTalk/Info/Next/Chip/Label', '다음 할 일', [30, 406, 84, 24], [30, 406, 84, 24], { font: 'Noto700', size: 14, color: C.goldInk, h: 'center' });
txt('NpcTalk/Info/Next/Text', '마을 차지하기', [124, 405, 300, 26], INFO, { font: 'Noto700', size: 18, color: C.ivory, h: 'left', shadow: true });

// 버튼: 파랑 = 빠지는 쪽 · 금 = 하는 쪽. 폭 · 위치는 스크립트가 글 길이로 정한다(오른쪽 끝 690 부터 왼쪽으로).
const BLUE = { normal: 'btn_blue_default', hover: 'btn_blue_hover', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled' };
const GOLD = { normal: 'btn_gold_default', pressed: 'btn_gold_pressed', disabled: 'btn_gold_disabled' };
b.button('NpcTalk/BtnMid', '다른 직업 보기', { anchor: 'middle-center', pos: [351, BTN_Y], rect_size: [210, 60], pivot: [0.5, 0.5], font_size: 20 });
for (const [p, look, ink, text, x, w] of [
  ['NpcTalk/BtnEnd', BLUE, C.ivory, '대화 그만하기', 127, 210],
  ['NpcTalk/BtnMid', BLUE, C.ivory, '다른 직업 보기', 351, 210],
  ['NpcTalk/BtnYes', GOLD, C.goldInk, '전직하기', 580, 220],
]) {
  S.place(b, p, { anchor: 'middle-center', pivot: [0.5, 0.5], pos: [x, BTN_Y], size: [w, 60] });
  S.button(b, p, look);
  S.font(b, p, { font: 'Maple', size: 20, color: ink, h: 'center', v: 'middle', outline: false, shadow: ink === C.ivory, text });
}
for (const j of JOBS.concat(['MAP'])) {
  img(`NpcTalk/BtnYes/Icon_${j}`, j === 'MAP' ? 'ico_map' : 'job_' + j.toLowerCase(), [0, 0, 30, 30], [0, 0, 220, 60], { pos: [-70, 0], size: [30, 30], enable: false });
}

// ── 5. 전직 완료 연출(시안 12번 · 레벨업 알림과 같은 모양 · 600×84) ──
box('JobNotice', [0, 0, 600, 190], [0, 0, 600, 190], { anchor: 'top-center', pivot: [0.5, 1], pos: [0, -63], enable: false });
img('JobNotice/Bar', 'bar_goal', [0, 0, 600, 84], [0, 0, 600, 190], { pos: [0, -9], size: [600, 84] });
txt('JobNotice/Bar/Title', '전직 완료!', [0, 0, 440, 62], [0, 0, 440, 62], { font: 'Bazzi', size: 44, color: '#FFF3C4', h: 'center', shadow: true });
img('JobNotice/Crest', 'deco_crest', [0, 0, 300, 88], [0, 0, 600, 190], { pos: [0, 51], size: [300, 88] });
img('JobNotice/Pill', 'plate_dark', [0, 0, 220, 40], [0, 0, 600, 190], { pos: [0, -78], size: [220, 40] });
txt('JobNotice/Pill/Label', '초보자 → 전사', [0, 0, 400, 40], [0, 0, 400, 40], { font: 'Maple', size: 24, color: '#FFFFFF', h: 'center', shadow: true });

b.write(path.join(WORLD, 'ui', 'CommonNpcGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
  bind: {
    mlua: path.join(WORLD, 'RootDesk', 'MyDesk', 'Npc', 'NpcTalkController.mlua'),
    props: {
      talkRoot: 'NpcTalk',
      talkPortrait: 'NpcTalk/PortraitBg/Portrait',
      talkName: 'NpcTalk/PortraitBg/NamePlate',
      nameIcons: 'NpcTalk/PortraitBg/NamePlate',
      roleChip: 'NpcTalk/TextBg/Role',
      roleLabel: 'NpcTalk/TextBg/Role/Label',
      talkLine: 'NpcTalk/TextBg/Line',
      skillsRoot: 'NpcTalk/TextBg/Skills',
      infoLv: 'NpcTalk/Info/Lv',
      lvNum: 'NpcTalk/Info/Lv/Num',
      lvFill: 'NpcTalk/Info/Lv/Gauge/Fill',
      infoNext: 'NpcTalk/Info/Next',
      nextText: 'NpcTalk/Info/Next/Text',
      btnEnd: 'NpcTalk/BtnEnd',
      btnMid: 'NpcTalk/BtnMid',
      btnYes: 'NpcTalk/BtnYes',
      notice: 'JobNotice',
      noticePill: 'JobNotice/Pill/Label',
    },
  },
});
console.log('npc talk applied');
