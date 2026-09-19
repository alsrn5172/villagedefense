# b/skill-flame-sprite-layer

## 2026-09-19 — 에너지 차지 불꽃을 자식 sprite 엔티티로 (#64)

base `b/skill-pirate-energy-charge`(PR #61) 위에 쌓은 스택이다 — 바꾼 불꽃 코드가 #61 에만 있다. #61 이 main 에 들어가면 base 를 main 으로 바꾼다.

### 연출

- 불꽃 기둥(`loopFlame` · 팩 `effect/2`)의 정렬 층이 **플레이어의 층을 따라간다**. 예전에는 시전한 발판의 `SortingLayer` 에 고정돼(`EffectService` 는 재생 중 옵션을 못 바꾼다), 층이 다른 발판으로 옮기면 불꽃만 옛 층에 남아 캐릭터 앞으로 올라왔다(#64). 연출만이고 피해 · 판정 · 상태는 그대로다.
- 이펙트 대신 `model://skillprojectile` 을 플레이어 **자식**으로 스폰하고(`SkillExecutors.SpawnChargeFlame` · VisualOnly · Speed 0) `SpriteRUID` 에 티어의 불꽃 클립을 넣는다(엔진이 스스로 루프 · 새 모델 · 등록 없음). `SortingLayer` 는 스폰 때 아바타의 현재 층 + `OrderInLayer 2`(`ShadowOrderInLayer` · 플레이어 3/4 보다 뒤)로 두고, 그 뒤로는 플레이어의 `SortingLayerChangedEvent`(서버에서 온다)마다 같은 층으로 옮긴다 — 다시 걸지 않으므로 클립이 첫 프레임으로 되감기지 않는다.
- 정리는 `RemoveBuffLoop` 한 곳 — 구독 해제(`DisconnectEvent`) + `Destroy`. 안전망으로 `MaxLifetime = duration + 2`(이펙트 루프에는 없던 것). 불꽃 전용 지속 타이머는 없앴다 — 만료는 `SkillBuffs.ExpireBuff → OnBuffEnded → StopBuffLoop → RemoveBuffLoop` 로 온다.
- 시작 층을 발판 레이캐스트(`ApplyShadowSorting`)가 아니라 아바타 자신의 층에서 읽으므로, **공중 시전 때 착지할 때까지 앞 층이던 한계도 사라졌다**(#61 조각의 ⚠).
- `sortBehind` 플래그는 그대로 층 따라가기를 가른다(세 티어 전부 `true`).
- 오라(`affected`) · 진입 이펙트 · 주먹 · 분신 · `ApplyShadowSorting` · 티어 표는 그대로다. `ApplyShadowSorting` 을 부르는 곳은 셋 → 둘(분신 · 분신 따라하기).

### 이 PR 로 고치지 않는 것

- `PlayChargeLoop` 의 오라(loop) 경로가 `spec.sortBehind` 를 읽지 않는 비대칭(#61 `4ebbabb` 의 주석) — 이 PR 은 불꽃만 다룬다. 오라는 지금도 플레이어 앞에 그려진다.
- `ApplyShadowSorting` 이 발판이 아니라 플레이어 자신의 층을 먼저 보게 하는 정리(#64 "함께 볼 것") — 분신 쪽이라 별 PR.

## 검증

- **Play 통과** (2026-09-19 · 사용자 · Maker 클론 — 테스트한 `SkillExecutors.mlua` 가 `22859c0` 의 blob `dfb37ff` 와 같다): 층이 다른 발판으로 옮겨도(`MapLayer5 → MapLayer3`) 불꽃이 캐릭터 뒤에 남고, 차지가 끝나면 엔티티가 지워지고 구독이 풀린다.
  ```
  [23:03:07] [SERVER] SkillExecutors: CHARGE flame sprite SK_P21 ruid=99f81b03d17046728ccc3c463313d361 scale=1.0 layer=MapLayer5/2 follow=true
  [23:03:11] [SERVER] SkillExecutors: CHARGE flame layer 'MapLayer5' -> 'MapLayer3'
  [23:03:37] [SERVER] SkillExecutors: CHARGE flame removed ENERGY_CHARGE destroyed=true unhooked=true
  ```
- **build warnings: 0 before → 0 after** (Maker Build Console · 이전 = #61 검증 `7e6a367` · 이후 = 새 `SkillExecutors.mlua` 를 넣은 뒤)
- `node Docs/tools/check-integrity.cjs` — 전부 통과(경고 4건 = C5 NPC 박제 3 + C6 MonsterInfo 모델 없는 2행 1 · 브랜치 전과 동일)
- `SkillExecutors.mlua` 는 CRLF 2401행 · BOM 없음(원래 없다) — 바이트로 확인. 🔴 이 파일은 CRLF 이고 `.gitattributes` 가 `* -text` 라 git 이 변환하지 않는다
