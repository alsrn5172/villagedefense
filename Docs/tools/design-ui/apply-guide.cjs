// ★1 안내(GuideGroup)에 디자이너 시안(05-guide)을 입힌다.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-guide.cjs
// 다시 돌려도 같은 결과가 나온다. 기존 엔티티는 지우지 않고 값만 바꾼다.
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');
const b = S.open(WORLD, 'GuideGroup');

const BAR = [40, 84, 1120, 64];          // 시안 캔버스에서 목표 바 상자
const PLATE = [784, 101, 176, 30.5];     // 게이지 받침(폭 176 고정 · 오른쪽 끝 960)
const CP = [100, 160, 1000, 348.5];      // 체크리스트 판
const r2 = (v) => Math.round(v * 2) / 2;
// 왼쪽 끝 기준(피벗 0,0.5)으로 놓을 글자: x = 왼쪽 끝, 세로는 중심
const atL = (x, y, h, par) => [r2(x - (par[0] + par[2] / 2)), r2(-((y + h / 2) - (par[1] + par[3] / 2)))];
// 오른쪽 끝 기준(피벗 1,0.5)
const atR = (xr, y, h, par) => atL(xr, y, h, par);

// ── 목표 바 ──
S.place(b, 'Bar', { pos: [0, -84], size: [1120, 64] });
S.image(b, 'Bar', 'bar_goal');              // 바 전체가 눌림(ButtonComponent 그대로 · 색 전환)
S.font(b, 'Bar', { text: '', outline: false });   // 예전 글자는 비움(문구는 GoalText 가 맡는다)

// 급한 목표(꺼 둠 · 서버 데이터는 2단계): 붉은 바 · 붉은 깃발
S.newImage(b, 'Bar/BarWarn', 'bar_goal_warn', { pos: [0, 0], size: [1120, 64], enable: false });
S.newImage(b, 'Bar/Flag', 'icon_flag', { pos: S.at(80, 102, 28, 28, BAR), size: [28, 28] });
S.newImage(b, 'Bar/FlagWarn', 'icon_flag_warn', { pos: S.at(80, 102, 28, 28, BAR), size: [28, 28], enable: false });
S.newText(b, 'Bar/GoalText', '', { font: 'Maple', size: 20, color: S.COLOR.ivory, h: 'left', pivot: [0, 0.5], pos: atL(120, 102, 28, BAR), rect: [652, 28], overflow: 1 });

// 진행 게이지: 받침 + "Lv n/max" + 마름모 4칸(빈 칸 4개 위에 찬 칸 4개를 겹쳐 두고 Enable 로 켠다)
S.newImage(b, 'Bar/GaugePlate', 'plate_dark_sm', { pos: S.at(...PLATE, BAR), size: [176, 30.5] });
S.newText(b, 'Bar/GaugePlate/Lv', 'Lv 1/4', { font: 'FootballB', size: 16, color: S.COLOR.gold, h: 'left', pivot: [0, 0.5], pos: atL(798, 101, 30.5, PLATE), rect: [70, 30.5] });
for (let i = 0; i < 4; i++) S.newImage(b, `Bar/GaugePlate/Seg${i + 1}Off`, 'gauge_seg_off', { pos: S.at(870 + 20 * i, 107, 18, 18, PLATE), size: [18, 18] });
for (let i = 0; i < 4; i++) S.newImage(b, `Bar/GaugePlate/Seg${i + 1}On`, 'gauge_seg_on', { pos: S.at(870 + 20 * i, 107, 18, 18, PLATE), size: [18, 18], enable: i === 0 });

// 펼침 표시(▼ 접힘 / ▲ 펼침 · 바 전체가 눌리므로 받침은 장식)
S.newImage(b, 'Bar/Chevron', 'plate_dark_sm', { pos: S.at(972, 98, 36, 36, BAR), size: [36, 36] });
S.newImage(b, 'Bar/Chevron/IconDown', 'icon_chevron_down', { pos: S.at(981, 107, 18, 18, [972, 98, 36, 36]), size: [18, 18] });
S.newImage(b, 'Bar/Chevron/IconUp', 'icon_chevron_up', { pos: S.at(981, 107, 18, 18, [972, 98, 36, 36]), size: [18, 18], enable: false });

// 안내 끄기(기존 버튼)
S.place(b, 'Bar/BtnOff', { pos: [-36, 0], size: [104, 40] });
S.button(b, 'Bar/BtnOff', { normal: 'btn_blue_default_sm', pressed: 'btn_blue_pressed', disabled: 'btn_blue_disabled_sm' });
S.font(b, 'Bar/BtnOff', { font: 'Noto700', size: 16, color: S.COLOR.ivory, h: 'center', v: 'middle', outline: false });

// 그리기 순서: 붉은 바는 바 그림 바로 위 · 다른 새 노드보다 뒤
S.back(b, 'Bar/BarWarn');

// ── 체크리스트 판 ──
S.place(b, 'CheckPanel', { pos: [0, -160], size: [1000, 348.5] });
S.image(b, 'CheckPanel', 'panel_tooltip');
S.place(b, 'CheckPanel/Text', { enable: false });   // 한 덩어리 글자는 끔(스크립트가 잡고 있어 지우지 않는다)
S.place(b, 'CheckPanel/Title', { anchor: 'middle-center', pivot: [0, 0.5], pos: atL(122, 176, 33.5, CP), size: [190, 34] });
S.font(b, 'CheckPanel/Title', { font: 'Maple', size: 24, color: S.COLOR.title, h: 'left', v: 'middle', text: '초보자 체크리스트', outline: false });
S.newText(b, 'CheckPanel/Hint', '완료 표시만', { font: 'Noto700', size: 16, color: S.COLOR.faint, h: 'left', pivot: [0, 0.5], pos: atL(315.5, 185, 22.5, CP), rect: [110, 24] });
S.newText(b, 'CheckPanel/Count', '0 / 13', { font: 'FootballB', size: 20, color: S.COLOR.gold, h: 'right', pivot: [1, 0.5], pos: atR(1078, 181, 28, CP), rect: [110, 28] });
// 13줄 2열(왼쪽 7 · 오른쪽 6): 줄 = 464x30 묶음 + 체크박스(빈/찬) + 글자
for (let i = 1; i <= 13; i++) {
  const col = i > 7 ? 1 : 0;
  const k = (i - 1) % 7;
  const box = [col ? 614 : 122, 232.5 + 38 * k, 464, 30];
  const p = 'CheckPanel/Row' + String(i).padStart(2, '0');
  S.newBox(b, p, { pos: S.at(...box, CP), size: [464, 30], enable: false });
  S.newImage(b, p + '/CheckOff', 'check_off', { pos: S.at(box[0], box[1] + 1, 28, 28, box), size: [28, 28] });
  S.newImage(b, p + '/CheckOn', 'check_on', { pos: S.at(box[0], box[1] + 1, 28, 28, box), size: [28, 28], enable: false });
  S.newText(b, p + '/Label', '', { font: 'Noto700', size: 18, color: S.COLOR.ivory, h: 'left', pivot: [0, 0.5], pos: atL(box[0] + 38, box[1] + 2.5, 25, box), rect: [426, 25], overflow: 1 });
}

// ── 안내 켜기 칩(시안 실측 폭 그대로 · 시안은 가운데보다 16 왼쪽) ──
S.place(b, 'Chip', { pos: [-16, -84], size: [118, 40] });
S.image(b, 'Chip', 'plate_dark');
S.font(b, 'Chip', { font: 'Noto700', size: 16, color: S.COLOR.sub, h: 'center', v: 'middle', outline: false });
b.patchComponent('Chip', S.TXT, { Padding: { left: 36, right: 8, top: 0, bottom: 0 } });   // 깃발 자리 비움
S.newImage(b, 'Chip/Icon', 'icon_flag', { pos: [-36, 0], size: [18, 18] });

b.write(path.join(WORLD, 'ui', 'GuideGroup.ui'), {
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/Guide/GuideUIController.mlua'),
    props: {
      goalText: 'Bar/GoalText', barWarn: 'Bar/BarWarn', flag: 'Bar/Flag', flagWarn: 'Bar/FlagWarn',
      gaugePlate: 'Bar/GaugePlate', lvText: 'Bar/GaugePlate/Lv',
      seg1On: 'Bar/GaugePlate/Seg1On', seg2On: 'Bar/GaugePlate/Seg2On', seg3On: 'Bar/GaugePlate/Seg3On', seg4On: 'Bar/GaugePlate/Seg4On',
      chevDown: 'Bar/Chevron/IconDown', chevUp: 'Bar/Chevron/IconUp', countText: 'CheckPanel/Count',
    },
  },
});
console.log('GuideGroup 적용 끝');
