// 1.1-J02 · J04: 공방 창(VillageWorkshopGroup) 제작 블록에 레벨제 일괄 구매 판을 더하고, 물약 수량 줄에 +5 · +10 버튼을 더한다.
//   실행: node apply-workshop-bulk.cjs [--dry]   (--dry = 저장 없이 바뀔 것만 보여 준다)
//   글자 · 칸 상태는 Item/WorkshopUIController.mlua 가 채운다(이름 경로로 GetChildByName). 아래 이름을 바꾸면 안 된다:
//     Craft/Slot_BULK · Craft/BulkPanel/{Title Hint PartsLabel Part_WEAPON Part_CLOTH Part_HAT Part_GLOVES Part_SHOES Tier_10 Tier_15 Tier_20 Tier_25 Tier_30}
//     Potion/Detail/{BtnPlus5 BtnPlus10}
//   다시 돌려도 같은 결과(이미 있는 칸은 같은 값으로 다시 맞춘다). 설계 근거 = 패치내용/명세/1.1/J.md [1.1-J02] · [1.1-J04].
//   위치: Docs/tools/design-ui/ 로 옮겨도 그대로 돈다(skin.cjs 가 옆에 있으면 그것을 쓰고, 없으면 워크트리의 것을 쓴다).
const fs = require('fs')
const path = require('path')
const DESIGN_DIR = fs.existsSync(path.join(__dirname, 'skin.cjs')) ? __dirname : 'C:/Users/mingu/메월드폴더/villagedefense-worktrees/a-patch-110/Docs/tools/design-ui'
const S = require(path.join(DESIGN_DIR, 'skin.cjs'))
const WORLD = path.resolve(DESIGN_DIR, '..', '..', '..')
const DRY = process.argv.includes('--dry')
const b = S.open(WORLD, 'VillageWorkshopGroup')
const C = S.COLOR
const snap = JSON.parse(JSON.stringify(b.entities))   // 바뀐 곳 점검용 원본

// 엔티티 한 개를 컴포넌트째 복제한다(자식은 cloneTree 가). sprite() 로 바탕을 깔고 원본 컴포넌트를 깊은 복사로 덮은 뒤, 원본에 없는 컴포넌트는 뺀다.
function cloneOne(src, dst) {
  const se = b.find(src)
  if (!se) throw new Error('복제 원본 없음: ' + src)
  const sj = se.jsonString
  b.sprite(dst, {})
  const dj = b.find(dst).jsonString
  for (const c of sj['@components']) b.upsertComponent(dst, c['@type'], JSON.parse(JSON.stringify(c)))
  for (const c of (dj['@components'] || []).slice()) {
    if (!sj['@components'].some((x) => x['@type'] === c['@type'])) b.removeComponent(dst, c['@type'])
  }
  dj.modelId = sj.modelId
  dj.origin = JSON.parse(JSON.stringify(sj.origin))
  dj.enable = sj.enable
}
// src 와 그 자식들(배열 순서 그대로, skip 이름은 건너뜀)을 dst 아래로 복제한다.
function cloneTree(src, dst, skip) {
  skip = skip || []
  cloneOne(src, dst)
  const srcAbs = b.find(src).path
  for (const e of b.entities.slice()) {
    if (!e.path.startsWith(srcAbs + '/')) continue
    const rest = e.path.slice(srcAbs.length + 1)
    if (rest.includes('/')) continue               // 직계 자식만(손자는 재귀가 맡는다)
    if (skip.includes(rest)) continue
    cloneTree(src + '/' + rest, dst + '/' + rest, skip)
  }
}

const CR = 'Window/Content/Craft'

// ═══ 1) 부위 칩 7개를 폭 76 → 64 로 줄이고 한 칸 비워 둔다(오른쪽 끝에 "일괄" 칩 자리) ═══
// 중심 x = −434 + 73·i : 전체 −434 · 무기 −361 · 모자 −288 · 옷 −215 · 장갑 −142 · 신발 −69 · 특수 4 · 일괄 77. y 235 그대로.
const SLOTS = ['ALL', 'WEAPON', 'HAT', 'CLOTH', 'GLOVES', 'SHOES', 'SPECIAL']
SLOTS.forEach((id, i) => {
  const P = `${CR}/Slot_${id}`
  S.place(b, P, { pos: [-434 + 73 * i, 235], size: [64, 26] })
  S.place(b, P + '/On', { size: [64, 26] })
  S.place(b, P + '/Label', { size: [64, 26] })
})

// ═══ 2) "일괄" 칩: 특수 칩을 본보기로(자식 On · Label 포함) ═══
if (!S.has(b, `${CR}/Slot_BULK`)) cloneTree(`${CR}/Slot_SPECIAL`, `${CR}/Slot_BULK`)
S.place(b, `${CR}/Slot_BULK`, { pos: [77, 235], size: [64, 26] })
S.place(b, `${CR}/Slot_BULK/On`, { size: [64, 26] })
S.place(b, `${CR}/Slot_BULK/Label`, { size: [64, 26] })
S.font(b, `${CR}/Slot_BULK/Label`, { text: '일괄' })

// ═══ 3) 일괄 판(BulkPanel): 목록 판(ListPane)과 같은 사각형 · 같은 판 그림 · 클릭 막기(raycast) · 처음엔 꺼 둠 ═══
const BP = `${CR}/BulkPanel`
S.newImage(b, BP, 'panel_inner', { pos: [-173, 14], size: [586, 404], raycast: true, enable: false })
S.newText(b, BP + '/Title', '레벨제 일괄 구매', { font: 'Maple', size: 24, color: C.title, pos: [0, 160], rect: [400, 34] })
S.newText(b, BP + '/Hint', '버튼 하나로 켜 둔 부위를 무기 → 옷 → 모자 → 장갑 → 신발 순서로 사요\n재화가 모자라면 거기서 멈춰요', { font: 'Noto700', size: 15, color: C.sub, pos: [0, 118], rect: [540, 44] })
S.newText(b, BP + '/PartsLabel', '살 부위 (눌러서 빼기)', { font: 'Noto700', size: 14, color: C.faint, pos: [0, 86], rect: [300, 22] })

// 부위 토글 5개: 부위 칩(Slot_ALL)을 본보기로 96x38. 켜짐 = 금 칩 + 진한 글자 · 꺼짐 = 짙은 파랑 칩(컨트롤러가 On 을 켜고 끈다).
const PARTS = [['WEAPON', '무기'], ['CLOTH', '옷'], ['HAT', '모자'], ['GLOVES', '장갑'], ['SHOES', '신발']]
PARTS.forEach(([id, label], i) => {
  const P = `${BP}/Part_${id}`
  if (!S.has(b, P)) cloneTree(`${CR}/Slot_ALL`, P)
  S.place(b, P, { pos: [-208 + 104 * i, 50], size: [96, 38] })
  S.place(b, P + '/On', { size: [96, 38] })
  S.place(b, P + '/Label', { size: [96, 38] })
  S.font(b, P + '/Label', { size: 16, text: label })
})

// 렙제 버튼 5개: 직업 칩(Job_WARRIOR)을 본보기로 104x150 · 직업 아이콘(Icon)은 뺀다. 글자는 가운데 큼직하게.
const TIERS = [10, 15, 20, 25, 30]
TIERS.forEach((t, i) => {
  const P = `${BP}/Tier_${t}`
  if (!S.has(b, P)) cloneTree(`${CR}/Job_WARRIOR`, P, ['Icon'])
  S.place(b, P, { pos: [-224 + 112 * i, -70], size: [104, 150] })
  S.place(b, P + '/On', { size: [104, 150] })
  S.place(b, P + '/Label', { pos: [0, 0], size: [104, 150] })
  S.font(b, P + '/Label', { size: 22, text: `${t}렙제` })
})
S.front(b, BP)   // 형제 중 맨 앞(= Slot_BULK 뒤 · 목록 · 스크롤 막대를 덮는다)

// ═══ 4) 물약 수량 +5 · +10 (J04): 수량 줄 아래 빈 자리(y −51 ~ −155)에 둔다. +1 은 기존 BtnPlus 그대로 ═══
const PD = 'Window/Content/Potion/Detail'
;[['BtnPlus5', -56, '+5'], ['BtnPlus10', 56, '+10']].forEach(([n, x, label]) => {
  const P = `${PD}/${n}`
  if (!S.has(b, P)) cloneTree(`${PD}/BtnPlus`, P, ['Icon'])
  S.place(b, P, { pos: [x, -95], size: [100, 50] })
  S.font(b, P, { font: 'Maple', size: 26, color: '#FFFFFF', text: label, h: 'center', v: 'middle', outline: false })
})

// ═══ 점검: 원본과 달라진 엔티티 ═══
const nowByPath = new Map(b.entities.map((e) => [e.path, e]))
const oldByPath = new Map(snap.map((e) => [e.path, e]))
const added = [...nowByPath.keys()].filter((p) => !oldByPath.has(p))
const removed = [...oldByPath.keys()].filter((p) => !nowByPath.has(p))
const changed = []
for (const [p, e] of nowByPath) {
  const o = oldByPath.get(p)
  if (!o) continue
  if (JSON.stringify(o.jsonString) !== JSON.stringify(e.jsonString) || o.componentNames !== e.componentNames) changed.push(p)
}
const short = (p) => p.replace(/^\/ui\/[^/]+\//, '')
console.log(`엔티티 ${snap.length} → ${b.entities.length} · 새 ${added.length} · 지움 ${removed.length} · 바뀜 ${changed.length}`)
console.log('바뀜:', changed.map(short).join(' | '))
if (removed.length) console.log('지움:', removed.map(short).join(' | '))
console.log('새:', added.map(short).join(' | '))
if (DRY) { console.log('(--dry: 저장 안 함)'); process.exit(0) }
b.write(WORLD + '/ui/VillageWorkshopGroup' + '.ui', { lint_verbose: !!process.env.LINT_V })
console.log('저장 끝')
