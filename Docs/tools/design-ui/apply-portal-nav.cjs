// 월드맵 더블클릭 길안내 화면(PortalNavGroup)을 새로 만든다 — 사용자 2026-10-06. 컨트롤러 = RootDesk/MyDesk/WorldMap/PortalNav.mlua.
// 실행(월드 루트에서): node Docs/tools/design-ui/apply-portal-nav.cjs
// 🔴 다시 돌리면 UUID 가 새로 나오고 바인딩도 새로 넣는다(Maker 에서 손댄 자리는 지워진다) — 처음 한 번 뒤에는 고칠 것만 S.open 으로 고친다.
//
// 구조: Root(화면 전체 · 그림 없음 · 클릭 안 막음) / Nav(머리 위 따라다니는 묶음 · 컨트롤러가 매 프레임 자리)
//   Nav/Left · Right · Up · Down(56x56) · Portal(56x84 · 키캡이 위 56 · 아래 "포탈" 글씨) · Close([X] 버튼 · 키캡 오른쪽 위)
// 그림 = MSW 공식 "범용 리소스 모음"(크리에이터 센터 postId=936)의 화살표 · 포탈 안내 애니메이션 첫 장(공식 리소스 · 업로드 아님).
//   다섯 장 다 파일에 박아 두고 컨트롤러는 Enable 만 켜고 끈다 — 그림 RUID 가 스크립트 문자열로만 있으면 출시본에서 빠질 수 있다(이름표 판 사례).
//   "아래쪽 화살표"(13266cc4…) 는 실제로는 → 그림이다(썸네일로 확인).
const path = require('path');
const S = require('./skin.cjs');
const WORLD = path.resolve(__dirname, '..', '..', '..');

const KEY = {
  left: 'b77db7e7821f4117af03fe1d57ed6641',   // 왼쪽 화살표 cdfde5ae… 첫 장 56x56
  right: '7b2205b5338d4c198cba9605cf97eb6c',  // "아래쪽 화살표"(실제 →) 13266cc4… 첫 장 56x56
  up: '22df1b281b9145f6b6ede732c02ba2fb',     // 위 화살표 621d0abe… 첫 장 56x56
  down: '595835e6712f4ad39b1c29f620051f0e',   // 아래 화살표 69701c2a… 첫 장 56x56
  portal: 'c2da5ad754cb47058f84bece86be93ae', // 포탈 안내 d6811607… 첫 장 56x84
};
const CLOSE = S.R('btn_close_default');        // 창 닫기 버튼과 같은 그림(104x104 → 34x34)

const b = new S.UIBuilder('PortalNavGroup', 2, true);
b.empty('Root', { anchor: 'stretch', pos: [0, 0], rect_size: [1920, 1080] });
b.empty('Root/Nav', { anchor: 'middle-center', pos: [0, 0], rect_size: [56, 84], pivot: [0.5, 0.5] });
const key = (name, ruid, size, pos) => b.sprite('Root/Nav/' + name, {
  anchor: 'middle-center', pivot: [0.5, 0.5], pos, rect_size: size, image_ruid: ruid,
  sprite_type: 0, color: '#FFFFFF', alpha: 1, raycast: false, enable: false,
});
key('Left', KEY.left, [56, 56], [0, 0]);
key('Right', KEY.right, [56, 56], [0, 0]);
key('Up', KEY.up, [56, 56], [0, 0]);
key('Down', KEY.down, [56, 56], [0, 0]);
key('Portal', KEY.portal, [56, 84], [0, -14]);   // 키캡(위 56px) 가운데가 다른 화살표 가운데와 같게
b.button('Root/Nav/Close', '', {
  anchor: 'middle-center', pivot: [0.5, 0.5], pos: [46, 24], rect_size: [34, 34],
  image_ruid: CLOSE, sprite_type: 0, bg_color: '#FFFFFF',
});

b.write(path.join(WORLD, 'ui', 'PortalNavGroup.ui'), {
  lint_verbose: !!process.env.LINT_V,
  bind: {
    mlua: path.join(WORLD, 'RootDesk/MyDesk/WorldMap/PortalNav.mlua'),
    props: {
      root: 'Root',
      nav: 'Root/Nav',
      arrowLeft: 'Root/Nav/Left',
      arrowRight: 'Root/Nav/Right',
      arrowUp: 'Root/Nav/Up',
      arrowDown: 'Root/Nav/Down',
      arrowPortal: 'Root/Nav/Portal',
      btnClose: 'Root/Nav/Close',
    },
  },
});
console.log('PortalNavGroup 만듦');
