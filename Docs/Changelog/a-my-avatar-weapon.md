# a/my-avatar-weapon — 내 아바타(MY) 외형: 계정 무기가 없으면 직업 무기 (WO-042)

> 배경: B 질문(#40 5979709371) — 접속 외형 "내 아바타"를 고르면 계정 아바타에 무기가 없을 때 맨손(활 쏘기도 맨손). 사용자 결정(#40 5988186039 · 2026-10-05): 계정 아바타 그대로, **무기가 없을 때만 직업 무기**. 장착한 게임 장비는 지금처럼 안 보인다.

## 2026-10-05

### `Item/AvatarLookService.mlua`
- `ApplyTo` MY 분기: 계정 무기 상태(`weaponState` · 룸마다)가 `none` 이면 무기 칸(한손 · 두손 · 보조)만 지금 직업 행 무기로 채운다(초보자 · 행 없는 직업 = `EXPLORER_M` 행 무기). 나머지 칸은 비운 채 `UseCustomEquipOnly=false` 그대로(계정 아바타 모습 유지).
- 처음(상태 모름)에는 무기 칸을 비운 채 입히고 그 클라에 묻는다: `CheckAccountWeapon`(Client RPC · 1초 뒤 `CostumeManagerComponent:GetEquip(OneHanded/TwoHandedWeapon)` · 머리까지 비었으면 아바타가 덜 실린 것 → 1초씩 두 번 더) → `ReportAccountWeapon(hasWeapon)`(Server RPC · `senderUserId` · 물어본 사람의 답만) → 없으면 다시 입힌다. 채운 뒤에는 다시 묻지 않는다(채운 무기를 계정 무기로 잘못 읽지 않게).
- `OnJobChanged`: MY 이고 직업 무기를 채운 사람만 새 직업 무기로 다시 입힌다(예전엔 MY 는 건너뛰었다).
- 로그: `[Look] applied MY weapon=<nil|asking|has|none>` · `[Look] account weapon check one=… two=…` · `[Look] MY account weapon=<bool>` · `[Look] MY job weapon -> <직업>`.

### `Item/AvatarSelectUIController.mlua` (사용자 2026-10-05 "로비 캐릭터 외형 무기")
- 로비의 내 캐릭터는 위 `ApplyTo` 가 룸 구분 없이 처리한다. 따로 그리는 **접속 외형 고르기 창의 "내 아바타" 미리보기 카드**도 같은 규칙: 1초 뒤 그 카드의 `GetEquip` 으로 계정 무기를 보고(머리까지 비었으면 1초씩 두 번 더) 없으면 모험가 무기를 쥐여 준다. 로그 `[LookUI] MY preview: no account weapon -> explorer weapon`.

### Codex 검토 반영
- `CheckAccountWeapon`: 내 아바타 컴포넌트가 늦게 생기면 10초까지 기다리고, 그래도 없으면 "무기 없음"으로 답한다(예전엔 3번 만에 답 없이 끝나 서버가 "확인 중"에 멈춰 직업 무기를 못 받았다).

### 문서
- 계약서 A-2-27 `MY` 설명 한 줄(A 자기 항목 · 새 표 · 열 · 이벤트 없음).

### 로그 확인 (Maker Play) — TODO
- [ ] 내 아바타 · 계정 무기 있음 → `account weapon=true` · 무기 그대로.
- [ ] 계정 무기 없음 → `account weapon=false` → 모험가 무기(초보자) · 전직하면 그 직업 무기 · 다른 칸은 계정 아바타 그대로.
- [ ] 로비(승강장 · 배)에서도 같은지 · 접속 외형 고르기 창 "내 아바타" 카드에도 무기.
