# a/item-look-meso — 궁수 외형 활 교체 · 메소 동전 금액별 4단계 그림 (A)

> PR #121. 계획 `메월드폴더/WorkOrders/WO-034-몬스터무적제거-은신추격-활교체-메소그림.md` ②. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §13-1).

## 2026-09-29

### 궁수 외형 활 — 섬광 없는 활로 (#40 5872746094 · 답 5884389364)
- `AvatarLook.csv` ARCHER 행 `OneHandWeapon` 한 칸: 모험가 보우마스터 활 `7061d571…`(shoot1/shoot2/shootF 에 큰 파란 섬광 내장 · B 실측) → **바람의 기사 활 `d5f46671a25a4ef490822d410b34b699`**(onehandedweapon-2636). `#Note` 의 활 이름만 갱신 · 다른 칸 · 다른 행 · BOM · CRLF 그대로.
- 섬광 유무는 눈으로만 판정된다 — 안 맞으면 후보: 고구려 활 `4702d0b6ee494402a201f0b3492ea619` · 아르칸시엘 `17b257ae500b475e8bcbfce86a1dde93` · 커스드 보우 `2c4314fbb8b34eee89794c04c46aaa5d`.

### 메소 동전 금액별 4단계 그림 (#40 5849781728 2번 · 답 5884390073 · 원작 구간)
- `Farm/MesoCoin.mlua`: 새 `TierSprites`("최소 메소:RUID" 목록) · 첫 서버 틱에 `ApplyTierSprite()` 가 `Value` 로 SpriteRUID 를 고른다(Value 는 스폰 직후 대입되므로 OnBeginPlay 가 아님) · 로그 `[MesoCoin] value … -> tier …`.
  - 1~49 동 메소 `a724200c…` · 50~99 금 메소 `5c78b56b…` · 100~999 지폐 뭉치 `c3fe3ffa…` · 1000~ 돈 주머니 `f0aa7764…` — 원작 메소 드랍 그림 · 전부 4프레임 회전 animationclip(리소스 API 확인).
  - 지금 몹 드랍(총액 60/180/450 ÷ 최대 3개 → 개당 약 20/60/150)이면 동 · 금 · 지폐가 섞여 보인다. 픽파켓 동전(B · 1~2메소)은 코드 변경 없이 동 메소.
- `Global/MesoCoin.model` 기본 SpriteRUID: 마일리지 알림 "M" 토큰 `3b88d8df…` → 동 메소(ModelBuilder · 스폰 첫 프레임에 보이는 그림 · CRLF 보존 · 한 줄만 바뀜).
- 드랍 클립은 아이템 원점 규칙이라 pivot 이 그림 왼쪽 아래 쪽 — 동전 바닥이 발판에 닿는다(예전 40×40 중심 그림은 절반이 박혔다). 가로 약 0.1 치우침은 눈으로 확인.

### 검증
- (대기) Maker Play — 워크트리를 개인 월드에 물려 Reimport All(허브 CLAUDE §1-2). 활 섬광 · 동전 그림 · 발판 위치는 사용자 눈.
