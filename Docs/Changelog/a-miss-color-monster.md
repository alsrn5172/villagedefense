# a/miss-color-monster — MISS 글자 색: 몬스터는 빨강 · 플레이어는 보라 (Draft PR #193)

## 2026-10-06

사용자 지시: "몬스터한테서 뜨는 miss 가 보라색으로 뜸. 보라색 miss 는 플레이어가 뜨는 색깔이고 몬스터는 빨간색으로 떠야함"

- `Stat/DamageFormula.mlua` `ShowMiss` — 대상에 따라 스킨을 고른다. 대상이 플레이어(`PlayerComponent` 있음)면 지금 그대로 `MissSkinId`(`02c22d93…` · 몬스터 공격 스킨 · 보라), 그 외(몬스터 · 수비대 · 미니언)는 새 속성 `MissSkinMonsterId`(기본 `3271c3e7…` = `DefaultPlayer` 의 플레이어 기본 데미지 스킨 · 빨강 계열).
- 전에는 대상이 누구든 `MissSkinId` 하나를 써서 플레이어 공격이 빗나갔을 때 몬스터 머리 위 MISS 도 보라였다. 호출하는 쪽(`StatService` 기본 공격 · `SkillDatabase` 스킬 · `MonsterAttack` · `FactionAttack` 회피)은 안 바꿨다.

## 확인

- [x] mLua 진단 이슈 0.
- [ ] Maker Play: 몬스터에게 빗나가는 공격 → MISS 빨강 / 플레이어가 몬스터 공격 회피 → MISS 보라. 데미지 스킨은 리소스 검색 API 로 색을 못 봐서 `3271c3e7…` 의 MISS 가 빨강이라는 건 **추정**이다(플레이어가 몬스터를 때릴 때 숫자를 그리는 스킨). 다른 색이면 `MissSkinMonsterId` 값만 교체.
