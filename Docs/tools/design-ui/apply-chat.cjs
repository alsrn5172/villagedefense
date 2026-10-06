// WO-043 — 우리 채팅 창(ChatGroup) · 디자이너 시안 04-hud #1(왼쪽 위 72 칸 버튼 + 420×40 마지막 한 줄 판)을 그대로 쓰고,
// 펼친 모양(기록 판 · 입력 줄)은 같은 plate_dark 판으로 만든다(시안엔 펼친 모양이 없다 — 엔진 채팅이라 그리지 않았음).
// 엔진 채팅(DefaultGroup/UIChat)은 끈다. 컨트롤러 = RootDesk/MyDesk/Chat/ChatService.mlua(UUID 는 bind 로 주입).
// 좌표 = 시안 캔버스(1920×1080 · 왼쪽 위 기준 px). 다시 돌려도 같은 결과.
// 실행: node Docs/tools/design-ui/apply-chat.cjs
const path = require('path');
const { UIBuilder } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const S = require('./skin.cjs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'ui', 'ChatGroup.ui');
// 시안 좌표(왼쪽 위 x,y · 크기) → 왼쪽 위 앵커 + 가운데 피벗 pos
const at = (x, y, w, h) => ({ anchor: 'top-left', pos: [x + w / 2, -(y + h / 2)], size: [w, h] });

const b = new UIBuilder('ChatGroup');
b.group('ChatGroup', { default_show: true, group_order: 9 });
// 화면 전체 크기 빈 상자(왼쪽 위 기준 좌표를 쓰려고) — 클릭은 자식 판 · 버튼만 받는다.
b.empty('Chat', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080] });

// 시안 #1: 칸 버튼 72×72(slot_frame) + 안내 아이콘 40×34
S.newImage(b, 'Chat/Btn', 'slot_frame', at(24, 20, 72, 72));
b.addComponent('Chat/Btn', 'MOD.Core.ButtonComponent');
S.button(b, 'Chat/Btn', { normal: 'slot_frame', hover: 'slot_frame_hover', pressed: 'slot_frame_hover' });
b.patchComponent('Chat/Btn', 'MOD.Core.SpriteGUIRendererComponent', { RaycastTarget: true });
S.newImage(b, 'Chat/Btn/Icon', 'icon_info', { pos: [0, 0], size: [40, 34] });

// 접힘: 마지막 한 줄 판 356×40(2026-10-06 420 → 356 · ★ 안내 바와 안 겹치게)(plate_dark · 알파 0.92) — 닉네임 금색 · 말 아이보리(Default 16)
S.newImage(b, 'Chat/Line', 'plate_dark', Object.assign(at(24, 100, 356, 40), { alpha: 0.92 }));
S.newText(b, 'Chat/Line/Text', '', { font: 'Noto400', size: 16, color: S.COLOR ? S.COLOR.ivory : '#F3EEE2', h: 'left', v: 'middle', rect: [332, 40], overflow: 1 });

// 펼침: 기록 판 356×300(최근 12줄 · 아래 정렬) + 입력 줄 356×44
S.newImage(b, 'Chat/Log', 'plate_dark', Object.assign(at(24, 100, 356, 300), { alpha: 0.92 }));
S.newText(b, 'Chat/Log/Text', '', { font: 'Noto400', size: 16, color: '#F3EEE2', h: 'left', v: 'bottom', rect: [332, 280], overflow: 0 });
S.newImage(b, 'Chat/Input', 'plate_dark', Object.assign(at(24, 408, 356, 44), { alpha: 0.92 }));
b.textInput('Chat/Input/Field', { placeholder: 'Enter 로 보내기 · ESC 취소', char_limit: 80, line_type: 0, font_size: 16, color: '#F3EEE2', anchor: 'middle-center', pos: [0, 0], rect_size: [332, 36] });
b.patchComponent('Chat/Input/Field', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0, g: 0, b: 0, a: 0 } });
b.patch('Chat/Log', { enable: false });
b.patch('Chat/Input', { enable: false });

b.write(OUT, {
  bind: {
    mlua: path.join(ROOT, 'RootDesk', 'MyDesk', 'Chat', 'ChatService.mlua'),
    props: {
      chatRoot: 'Chat', btnChat: 'Chat/Btn', lineBox: 'Chat/Line', lineText: 'Chat/Line/Text',
      logBox: 'Chat/Log', logText: 'Chat/Log/Text', inputBox: 'Chat/Input', inputField: 'Chat/Input/Field',
    },
  },
});

// 엔진 채팅 끄기(파일 기본값 · ChatService 도 런타임에 한 번 더 끈다)
const D = path.join(ROOT, 'ui', 'DefaultGroup.ui');
const d = UIBuilder.load(D);
d.patch('UIChat', { enable: false });
d.write(D);
console.log('wrote', OUT, '+ DefaultGroup UIChat off');
