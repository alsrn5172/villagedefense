# b/skill-pirate-energy-charge

## 2026-09-17 — `SkillInfo` 제3 효과 열 · 재시전 MP 배율 열 + 해적 2차 C 교체

**`SkillInfo.csv` 헤더 변경 포함** (§0-1 9 공지 = PR #61 본문 맨 위).

### 스키마

- `SkillInfo` 에 `TertiaryEffect` · `TertiaryPerLevel` 두 열 추가. 자리는 `SpawnOffsetY` 뒤 = main 의 기존 29열 맨 뒤 · `#Note` 앞(§0-1 3·4 — `#Note` 마지막 · 뒤에 추가만). 처음엔 `SecondaryPerLevel` 뒤(열 중간)에 넣었다가 2026-09-18 A 리뷰(PR #61)로 옮겼다 — 로더가 열을 이름으로 읽어(`SkillDatabase` `ds:GetCell(i, "…")`) 동작은 그대로다.
- 기존 26행은 전부 `0` = 미사용.
- 레벨 공식은 부효과와 **같은 꼴** — `TertiaryEffect + TertiaryPerLevel × (레벨−1)`. 한 표 안에 레벨 규칙이 둘 생기지 않게 맞췄고(`BaseEffect`/`EffectPerLevel` 도 같은 꼴), 그래서 저장된 수치가 곧 **레벨 1 값**이라 행만 봐도 lv1 이 읽힌다.
- 왜 필요한가: 부효과 한 쌍으로는 레벨별 값이 하나뿐이라, 한 스킬이 레벨마다 서로 다른 값 2개를 가질 수 없었다. 첫 사용자는 에너지 차지(이동속도·점프력이 각각 다른 기울기). 두 열은 **독립**이며 한쪽에서 다른 쪽을 유도하지 않는다.
- `SkillInfo` 에 `RecastMpCostMul` 한 열 추가. 자리는 `TertiaryPerLevel` 뒤 · `#Note` 앞(§0-1 3·4 — `#Note` 마지막 · 뒤에 추가만).
- 기존 26행은 전부 `1` = 초기 시전과 같은 비용. 에너지 차지(`SK_P21`)만 `0.25` — `MpCost` 20 × 0.25 = 재시전 1회 **5 MP**.
- 재시전이 있는 스킬만 읽는 열이라 나머지 25행에는 런타임 영향이 **없다**(현재 재시전 스킬은 `SK_P21` 하나뿐 — `SkillExecutors.recastAttack`).
- 🔴 **기본값이 0 이 아니라 1 인 것이 이 열의 핵심.** 배율에서 0 은 "없음"이 아니라 "0 배 = 무료"라, 빈 칸을 0 으로 읽으면 열을 안 채운 **미래의** 재시전 스킬이 조용히 무료가 된다. 그래서 이 열만 `SkillDatabase.ParseNumberOr(…, 1)` 로 읽는다 — 기존 `ParseNumber` 는 빈 칸 = 0 + 경고라 그대로 두었다(다른 열은 0 이 올바른 기본값). `0` 은 "무료"라는 **의도적** 값으로 계속 쓸 수 있다.
- 왜 상수가 아니라 열인가: 재시전 시전 락이 0.78s 이고 차지 창이 30초라 한 창에 주먹이 **약 38회**다. 재시전 비용은 앞으로 돌릴 균형 손잡이지 상수가 아니다.
- 적용 순서는 **재시전 배율 먼저 · 매직 가드 배율 나중**, 내림(`math.floor`)은 마지막에 한 번. 곱셈이라 지금 값으로는 두 순서의 결과가 같지만, 중간에 내림이 끼면 갈라지므로 순서를 코드 주석과 계약서에 못 박았다.
- **등록 PR 없이 이 구현 PR 안에서** 계약서 헤더 정의와 `Docs/tools/check-integrity.cjs` `CANONICAL.SkillInfo` 를 같이 고쳤다 — 2026-09-17 A 결정(#40 comment 5700352071 → PR #63 `50f320b`)으로 **기존 표에 열 추가는 등록 대상이 아니다**. 원래 별도 스키마 PR(#62)로 냈다가 이 결정에 따라 닫고 여기로 접었다.
- 계약서 §0-2 `BuffTag` 열거값의 `SUPER_TRANSFORM` → `ENERGY_CHARGE`(1:1 교체 · 13종 유지 · 2026-09-18). `SK_P21` 의 태그를 바꾸면서 계약서 표를 안 고쳤던 것을 맞췄다 — `SUPER_TRANSFORM` 은 이제 어떤 행·코드도 쓰지 않는다(이미 머지된 브랜치 조각 속 기록은 그 시점의 것이라 그대로 둔다). B 내부용 태그라 열 추가와 같은 방식으로 이 PR 안에서 고쳤다.

### 스킬

- 해적 2차 C 슬롯 **슈퍼 트랜스폼 → 에너지 차지** 교체. `SkillId`(`SK_P21`) · `Tab` · `SlotOrder` 유지 → 핫바(W)·스킬 창 슬롯·전직 조건·`WeaponMotion` `MOTION_SK_P21_*` 행 전부 그대로.
- `StatService` BUFF 레이어를 **단일 기록자**로 정리 — `SetLayerCsv` 가 레이어를 통째로 교체해서 스탯 버프가 둘 이상이면 서로를 조용히 지웠다. 태그별 기여분을 모아 `SkillBuffs.PushStatLayer` 한 곳에서만 쓴다.
- 에너지 쉴드(`SK_P22`)의 `whileTransformed` 크기 보정 제거 — 몸을 바꾸는 변신이 없어지면서 보정 대상 자체가 사라졌다. 함께 쓰이던 `AdjustSpecForForm` · `IsFormActive` · `ReplayShieldLoop` 도 삭제.
- 클라 MP 예측 게이트의 **내림 위치를 서버와 맞춤**(`d99e24b`) — 클라 `Cast` 는 내림 없이 비교하고 서버 `RequestCast` 는 `math.floor` 한 값으로 비교·차감해서, 필요 MP 가 소수가 되는 구간에 클라와 서버 판정이 갈릴 수 있었다(비용이 정수인 동안은 드러나지 않는다). 클라에도 `math.floor` 를 넣어 같은 꼴로 만들었다 — `RecastMpCostMul`(배율 → 소수 비용)이 이 구간을 실제로 밟는다.

### 연출

피해 · 판정 · 상태 기계에는 손대지 않는다. 값은 Play 로 눌러 보며 정했고 커밋마다 단독으로 되돌릴 수 있다.

- 2단 주먹 이펙트를 바라보는 쪽 앞으로 `offsetX 1.0`(`e734b3c`) — `PlayStageEffect` 가 `offsetX × facing` 으로 두므로 좌우가 알아서 뒤집힌다. 피해 상자는 그대로(앞쪽 Range 3 · `ExecuteMeleeArc` 와 같은 식).
- 차지 오라(`affected` 루프) 세 티어 `scale 1.15`(`61771fc`) → Play 확인 뒤 **1.08** 로 내림(`a9ac92f`). 진입 이펙트(`cast`) 세 티어는 `scale 1.15`(`bba7df7`) 그대로 — 두 값이 일부러 갈린다(근거는 주석).
- **불꽃 기둥 `effect/2`** 를 세 티어 두 번째 루프로(`db4e1fc`) — 팩 GIF 로 확인한 원작의 주 시각(`effect/0` 이 자라서 도달하는 끊김 없는 루프). 하위 키 `태그 .. "#flame"` 에 따로 담아 `RemoveBuffLoop` 이 같이 지운다(버프 만료 · 재시전 · 매치 초기화 전부).
- 불꽃을 캐릭터 **뒤 층**으로(`533eae1`) — `loopFlame.sortBehind` → `ApplyShadowSorting`(밟은 발판의 `SortingLayer` + `OrderInLayer 2` · 분신과 같은 길). ⚠ 공중 시전은 착지할 때까지 앞 층이다(발 아래 3유닛 안에 발판이 없으면 정렬 옵션이 안 들어간다).

### 알려진 문제 (이 PR 로 고치지 않는다)

- **불꽃 겹의 정렬 층이 시전한 발판의 층에 고정된다 → #64.** 시전 뒤 층이 다른 발판으로 옮기면 불꽃이 캐릭터 앞으로 올라온다(그 층에서 시전하면 재현되지 않는다). 연출만이고 피해 · 판정 · 상태에는 영향이 없다. 원인은 측정으로 확정했다(임시 probe `4ca925b` → `b0e418d` 로 되돌림 · 트리가 측정 직전 `4ebbabb` 와 동일): 바뀌는 것은 `SortingLayer` 뿐이고, `EffectService` 는 재생 중 옵션을 못 바꾸며, 층 변화가 잦아(움직이기만 해도 1초 안에 `MapLayer5 → 3 → 5 → 6 → 5`) 다시 걸기로는 풀 수 없다 → 자식 sprite 엔티티로 바꾸는 별도 PR.
- `PlayChargeLoop` 의 오라(loop) 경로는 `spec.sortBehind` 를 읽지 않는다 — 적어도 무효고 오류도 안 난다(범용 경로 `PlayBuffLoop` 은 지킨다). 주석으로만 표시했고(`4ebbabb`) #64 에서 같이 정리한다.

## 검증

- `node Docs/tools/check-integrity.cjs` — 전부 통과 (`C1 SkillInfo` OK · `C3 SkillInfo` 중복 키 없음)
- CSV 열 추가가 **순수 뒤 추가**임을 바이트로 확인 — 헤더와 25행의 앞 29열이 `origin/main` 과 바이트 단위로 같고(SK_P21 은 이 브랜치가 일부러 바꾼 9칸만 다르다 · SkillId 순서 동일) 새 3열은 전부 그 뒤 · `#Note` 앞이다. 열을 옮길 때는 필드 토큰만 통째로 옮겨 값 · 따옴표 표기 · UTF-8 BOM · CRLF 27행이 그대로다(파일 길이 20257 B 불변). 🔴 이 표들은 **CRLF** 이고 `.gitattributes` 가 `* -text` 라 git 이 변환하지 않는다. LF 로 다시 쓰면 27행 전부가 조용히 재포맷된다 — Git-Bash `sed` 는 `\r` 를 감춰 LF 처럼 보이게 하니 `sed` 로 판단하지 말 것
- `RootDesk/MyDesk/SkillInfo.userdataset` **미변경** — 파일을 열어 확인했다(538 B). 데이터셋 이름·id·EntryKey 뿐이고 **열 목록이 없다**(§2-1 "열은 CSV 헤더에서 읽힌다" 의 근거). 받는 쪽은 Maker `Reimport All` 한 번
- BUFF 레이어 정리 검증: `StatService.CsvToTable`/`Recalculate` 합산식을 그대로 옮겨 하이퍼 바디 단독 시나리오(적용 200 · 재시전 400 · 보너스 0 · 만료)의 **최종 13개 스탯**을 옛 경로와 비교 — 전부 동일
- `git diff --check` — `Docs/` 변경분 깨끗. **`SkillInfo.csv` 는 바뀐 줄마다 `trailing whitespace` 가 뜨는데 이건 CRLF 의 `\r` 을 그렇게 보는 것이고 이 표의 고질이다** — A 의 예전 CSV 커밋(`25e6262`)도 88줄, 행 하나만 고친 커밋도 1줄 뜬다. 이 검사로는 CSV 를 판정하지 않고 위의 바이트 비교로 판정한다
