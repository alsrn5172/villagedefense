# b/skill-flame-haze-range — 플레임 헤이즈 사거리 3 → 4.5 (잠정)

## 2026-10-05

- 요청: A "플레임 헤이즈 사거리가 짧다" · 사용자: 이것만 바꾸는 작은 PR · 원작이 기준 · 값은 잠정(사용자 Play 뒤 두 번째 PR 에서 조정).
- 어디: 플레임 헤이즈는 에너지볼트(SK_M11)의 변형이라 `SkillInfo.csv` SK_M11 Range(3)를 그대로 썼다. CSV 는 건드리지 않고 `effectOverrides.SK_M11_FH.range` 를 새로 두어 플레임 헤이즈만 바꾼다(에너지볼트 3 그대로).
- 값 4.5 의 근거:
  - 원작 WZ `Skill/212.img/skill/2121011/common/range` = **450 px**(KMS 359 · 389 같음 · maplestory.io) — 에너지볼트 2001008 도 450. 1 유닛 = 100 px → 4.5.
  - 사용자 영상 「불탄 집『파이어 데몬』의 변화」 9.4 s(레드 2013): 시전자 중심 → 맞은 대상 중심 ≈425 영상 px · 캐릭터 키 ≈83 px → 키의 5.1배 ≈ 3.3–3.6 유닛(캐릭터 0.65–0.7 유닛). 영상은 그 거리의 대상을 맞히는 장면뿐(최대 사거리는 안 보인다) → 4.5 와 어긋나지 않는다.
- 이 값이 정하는 것: 투사체 탐색 상자 길이(앞쪽 range) · 비행 시간(range ÷ 속도 8) — `SkillAttack.SpawnProjectile` 한 인자. 폭발 상자 · 배율 · 속도 · 다른 스킬 그대로.

| 파일 | 내용 |
|---|---|
| `RootDesk/MyDesk/Skill/SkillExecutors.mlua` | `effectOverrides.SK_M11_FH.range = 4.5` · `ExecuteFlameHaze` 가 그 값을 `SpawnProjectile` 에 넘김(없으면 에너지볼트 Range) · 로그 `FLAME HAZE … range=4.5 (energy bolt 3)` |

- 점검: LSP · `check-integrity` — 로그 `villagedefense-harness/pirate-check/after-maker-free/fh-range-*.txt`. **Play 안 함** — RELOOK R22 · 숫자 N9.
