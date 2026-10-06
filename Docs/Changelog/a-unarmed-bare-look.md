# a/unarmed-bare-look — 맨손 기본 공격 피해 0 + 토스트 · 장착 해제 시 맨손맨발 외형 (Draft PR #189)

## 2026-10-06

사용자 지시: "몽둥이 · 장화 같은 초보자 템은 기본 장착, 장착 해제하면 맨손맨발" · "맨손일 때 공격 X, 공격키 누르면 UI" → "맨손 기본 공격은 피해 0 + 토스트".

- `Item/AvatarLookService.Overlay`: 손(무기 · 보조 · 장갑)과 발(신발) 칸은 모험가 프리셋 값을 쓰지 않는다. 장착한 것만 보이고 해제하면 비운다. 프리셋 행(`AvatarLook.csv`)은 그대로(MY 모드 초보자 무기 대체값으로도 쓰인다) · 속옷(상의 · 하의) · 머리 · 얼굴은 프리셋 그대로.
  - 원인: 프리셋 EXPLORER_M · F 에 몽둥이(`ce073997…`)와 신발(F = 시작 킷 빨간 고무장화와 같은 `8fadf886…`)이 들어 있어, 해제하면 프리셋 값으로 되돌아갔다.
  - 결과: 로비(장비 없음)에서도 모험가는 맨손 · 맨발로 보인다. 매치가 시작되면 시작 킷이 자동 착용되어(`AutoEquipMatchKit`) 몽둥이 · 장화가 보인다.
- `Stat/StatService`: `IsUnarmed(userId)`(무기 칸 비었나 · `SkillCaster.HasWeapon` 과 같은 판정) · `NoteUnarmed(userId)`(토스트 · 2초에 한 번 · `UnarmedToastGap` · `UnarmedToastText`). `CalcPlayerDamage` 는 맨손이고 대상이 있으면 **피해 0** + 토스트.
- `PlayerMotion.PlaySkill`: 맨손 기본 공격이면 모션 재생 대신 `NoteUnarmed`. 허공에 눌러도 토스트가 뜬다.

## 안 한 것

- **스킬 키 안내**: B 의 `SkillCaster.RequestCast` 가 무기 없이 피해 스킬을 이미 거절한다(`no weapon equipped`). 클라 `CastResult` 는 로그만 남기고 화면 표시가 없다 → B 파일에 토스트 한 줄이 필요(요청은 PR 에서).
- `MY`(내 아바타) 모드는 계정 아바타를 그대로 보여 주므로 외형은 장비와 무관하다. 피해 0 은 장착 기준이라 MY 모드도 같이 걸린다.

## 확인 (Maker Play)

- [ ] 장착 해제 시 손 · 발이 비어 보인다 · 다시 장착하면 돌아온다.
- [ ] 맨손으로 공격키를 누르면 토스트가 뜨고 몬스터 피해가 0 이다(허공에 눌러도 토스트).
- [ ] 매치 시작 1초 뒤 시작 킷이 자동 착용되어 몽둥이 · 장화가 보인다(기존 동작).
