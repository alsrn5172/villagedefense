# b/skill-pirate-energy-charge

## 2026-09-17 — `SkillInfo` 제3 효과 열 + 해적 2차 C 교체

**`SkillInfo.csv` 헤더 변경 포함** (§0-1 9 공지 = PR #61 본문 맨 위).

### 스키마

- `SkillInfo` 에 `TertiaryEffect` · `TertiaryPerLevel` 두 열 추가. 자리는 `SecondaryPerLevel` 뒤 · `DurationPerLevel` 앞(§0-1 3·4 — `#Note` 앞 · 뒤에 추가만).
- 기존 26행은 전부 `0` = 미사용.
- 레벨 공식은 부효과와 **같은 꼴** — `TertiaryEffect + TertiaryPerLevel × (레벨−1)`. 한 표 안에 레벨 규칙이 둘 생기지 않게 맞췄고(`BaseEffect`/`EffectPerLevel` 도 같은 꼴), 그래서 저장된 수치가 곧 **레벨 1 값**이라 행만 봐도 lv1 이 읽힌다.
- 왜 필요한가: 부효과 한 쌍으로는 레벨별 값이 하나뿐이라, 한 스킬이 레벨마다 서로 다른 값 2개를 가질 수 없었다. 첫 사용자는 에너지 차지(이동속도·점프력이 각각 다른 기울기). 두 열은 **독립**이며 한쪽에서 다른 쪽을 유도하지 않는다.
- **등록 PR 없이 이 구현 PR 안에서** 계약서 헤더 정의와 `Docs/tools/check-integrity.cjs` `CANONICAL.SkillInfo` 를 같이 고쳤다 — 2026-09-17 A 결정(#40 comment 5700352071 → PR #63 `50f320b`)으로 **기존 표에 열 추가는 등록 대상이 아니다**. 원래 별도 스키마 PR(#62)로 냈다가 이 결정에 따라 닫고 여기로 접었다.

### 스킬

- 해적 2차 C 슬롯 **슈퍼 트랜스폼 → 에너지 차지** 교체. `SkillId`(`SK_P21`) · `Tab` · `SlotOrder` 유지 → 핫바(W)·스킬 창 슬롯·전직 조건·`WeaponMotion` `MOTION_SK_P21_*` 행 전부 그대로.
- `StatService` BUFF 레이어를 **단일 기록자**로 정리 — `SetLayerCsv` 가 레이어를 통째로 교체해서 스탯 버프가 둘 이상이면 서로를 조용히 지웠다. 태그별 기여분을 모아 `SkillBuffs.PushStatLayer` 한 곳에서만 쓴다.
- 에너지 쉴드(`SK_P22`)의 `whileTransformed` 크기 보정 제거 — 몸을 바꾸는 변신이 없어지면서 보정 대상 자체가 사라졌다. 함께 쓰이던 `AdjustSpecForForm` · `IsFormActive` · `ReplayShieldLoop` 도 삭제.

## 검증

- `node Docs/tools/check-integrity.cjs` — 전부 통과 (`C1 SkillInfo` OK · `C3 SkillInfo` 중복 키 없음)
- CSV 열 삽입이 **순수 삽입**임을 바이트로 확인 — 삽입한 두 필드를 도로 빼면 원본과 바이트 단위로 일치(CRLF 27행 · UTF-8 BOM · 따옴표 표기 유지). 🔴 이 표들은 **CRLF** 이고 `.gitattributes` 가 `* -text` 라 git 이 변환하지 않는다. LF 로 다시 쓰면 27행 전부가 조용히 재포맷된다 — Git-Bash `sed` 는 `\r` 를 감춰 LF 처럼 보이게 하니 `sed` 로 판단하지 말 것
- `RootDesk/MyDesk/SkillInfo.userdataset` **미변경** — 파일을 열어 확인했다(538 B). 데이터셋 이름·id·EntryKey 뿐이고 **열 목록이 없다**(§2-1 "열은 CSV 헤더에서 읽힌다" 의 근거). 받는 쪽은 Maker `Reimport All` 한 번
- BUFF 레이어 정리 검증: `StatService.CsvToTable`/`Recalculate` 합산식을 그대로 옮겨 하이퍼 바디 단독 시나리오(적용 200 · 재시전 400 · 보너스 0 · 만료)의 **최종 13개 스탯**을 옛 경로와 비교 — 전부 동일
- `git diff --check` — `Docs/` 변경분 깨끗. **`SkillInfo.csv` 는 바뀐 줄마다 `trailing whitespace` 가 뜨는데 이건 CRLF 의 `\r` 을 그렇게 보는 것이고 이 표의 고질이다** — A 의 예전 CSV 커밋(`25e6262`)도 88줄, 행 하나만 고친 커밋도 1줄 뜬다. 이 검사로는 CSV 를 판정하지 않고 위의 바이트 비교로 판정한다
