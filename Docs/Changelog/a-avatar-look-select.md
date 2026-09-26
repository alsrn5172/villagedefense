# a/avatar-look-select — 접속 외형 선택 (A)

> PR #110 (stacked · base `a/avatar-look-reg` = 등록서 PR #109). 계획 `메월드폴더/WorkOrders/WO-032-접속-외형-선택.md`. 릴리스 때 `Docs/CHANGELOG.md` 로 합친다(협업-규칙 §11).

## 2026-09-26

### 접속할 때 1번 외형 선택 — 모험가 남 / 모험가 여 / 내 아바타
- **새 표** `RootDesk/MyDesk/AvatarLook.csv` + `.userdataset` (계약서 A-2-27): 7행 = `EXPLORER_M` · `EXPLORER_F` + 직업 행(`WARRIOR` · `MAGICIAN` · `ARCHER` · `THIEF` · `PIRATE`). RUID 는 사용자가 준 JSON 프리셋 그대로(해적은 교체본 · 원문 대조 완료). `head` 는 넣지 않음(엔진이 피부에 맞춤) · 궁수 JSON 은 피부가 없어 엘프 피부 · 도적·해적은 두손 무기만(사용자 결정).
- **새 서버** `Item/AvatarLookService.mlua` (@Logic · 룸마다): 선택 기록 = 공유 메모리 `LOOK_<userId>`(A-4 `AvatarLookRecord` · 로그인 세션 한정). 로비 입장 때 복귀 표식(`ret`)이 없으면 새 접속 → 기록을 지우고 선택창을 연다. 매치 룸은 입장 때 기록을 읽어 그대로 입힌다(1초 간격 3회 재시도). `JobChangedEvent`(B) 구독 → "전직 시 외형 변경" O 인 모험가만 직업 외형으로 다시 입힌다.
- 외형 규칙: 내 아바타 = 계정 아바타 그대로 · 장비 외형 안 보임(무기 포함). 모험가 = 프리셋 + 장착 장비(빈 칸은 프리셋). 모험가 + O + 전직 = 직업 프리셋 고정(장비·무기 안 보임). 모험가 + X = 전직해도 모험가 + 장비. 한벌옷이 있으면 상·하의 칸, 두손 무기가 있으면 한손·보조 칸은 비운다.
- **새 UI** `ui/AvatarSelectGroup` (UIBuilder · GroupOrder 16 · 딤 + 카드 3장 · 카드마다 UI 아바타 미리보기 · 모험가 카드에 작은 "전직 시 외형 변경 O/X" 토글, 기본 O) + 클라 `Item/AvatarSelectUIController.mlua` (서버가 `SetOpen` 으로 열고 닫는다 · 준비되면 `RequestSync` 로 한 번 더 물어봄).
- `Item/EquipService.mlua` `ApplyCostume`: 슬롯 쓰기 직전 `_AvatarLookService:ApplyTo(costume, userId, eq)` 분기 — 고른 외형이 있으면 거기서 17칸을 전부 입히고 끝, 없으면 옛 동작(계정 아바타 + 장비 6부위).
- `Match/MatchLobbyGateway.mlua` `ReturnToStation`: 인스턴스 룸 → 로비 이동 직전 `MarkReturn`(복귀 표식 동기 쓰기) 1줄 — 매치에서 돌아올 때 선택창이 다시 뜨지 않게.
- `Match/MatchResetService.mlua` `ResetUser`: 끝에 `ReapplyAfterReset` 1줄 — 장비 리셋이 직업 리셋보다 먼저라 전 판 직업 외형이 남는 것 방지.
- `Stat/StatUIController.mlua` `RefreshPreview`: 캐릭터 창 미리보기가 규칙을 다시 계산하지 않고 월드 아바타 `CostumeManagerComponent` @Sync 값을 복사(바로 + 0.3초 뒤 한 번 더). 쓰지 않게 된 `PreviewItemId` · `PreviewRuid` 제거.
- 계약서: A-2-27 정의 · A-4 `AvatarLookRecord` · 등록서 번호 A-2-24 → 27(23~26 은 열린 PR 이 먼저 씀) · 변경 이력. `Docs/tools/check-integrity.cjs` CANONICAL/PK 에 `AvatarLook`.
