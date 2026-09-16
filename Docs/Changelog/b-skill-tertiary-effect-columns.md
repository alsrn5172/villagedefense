# b/skill-tertiary-effect-columns

## 2026-09-16 — `SkillInfo` 제3 효과 열 등록

- `SkillInfo` 에 `TertiaryEffect` · `TertiaryPerLevel` 두 열을 추가했다. 자리는 `SecondaryPerLevel` 뒤 · `DurationPerLevel` 앞(계약서 §0-1 "열 추가는 `#Note` 앞에만").
- 기존 26행은 전부 `0` = 미사용이라 지금 동작은 바뀌지 않는다.
- 레벨 공식은 부효과와 **같은 꼴**을 쓴다 — `TertiaryEffect + TertiaryPerLevel × (레벨−1)`. 한 CSV 안에 서로 다른 레벨 규칙이 두 개 생기지 않게 하려는 것이고(`BaseEffect`/`EffectPerLevel` 도 같은 꼴), 덕분에 저장된 수치가 곧 **레벨 1 값**이라 행만 봐도 lv1 이 얼마인지 읽힌다.
- 왜 필요한가: 부효과 한 쌍으로는 레벨별 값이 하나뿐이라, 한 스킬이 레벨마다 **서로 다른 값 2개**를 가질 수 없었다. 첫 사용자는 해적 2차 C 에너지 차지(이동속도·점프력이 각각 다른 기울기). 두 열은 부효과와 **독립**이며 한쪽에서 다른 쪽을 유도하지 않는다.
- 계약서 정본을 두 군데 같이 고쳤다 — 사람이 읽는 `Docs/스키마-계약.md`(A-2-16 헤더 블록 · 열 설명 · 변경 이력)와 정합성 검사가 글자 단위로 비교하는 `Docs/tools/check-integrity.cjs` 의 `CANONICAL.SkillInfo`. 후자를 빠뜨리면 C1 이 실패해 Actions 가 머지를 막는다.
- 이 PR 에는 읽는 코드가 없다. `SkillDatabase.TertiaryAt` 과 SK_P21 값 입력은 후속 브랜치(`b/skill-pirate-energy-charge` · PR #61).

## 검증

- `node Docs/tools/check-integrity.cjs` — 전부 통과 (`C1 SkillInfo` OK · `C3 SkillInfo` 중복 키 없음 · 경고 4건은 C5 NPC 박제 3 · C6 MonsterInfo 2 로 브랜치 전과 동일)
- CSV 변경이 **순수 삽입**임을 바이트로 확인 — 삽입한 두 필드를 도로 빼면 원본과 바이트 단위로 일치(CRLF 27행 · UTF-8 BOM · 따옴표 표기 유지)
- `RootDesk/MyDesk/SkillInfo.userdataset` **미변경** — 내용을 열어 확인했다. 데이터셋 이름·id·EntryKey 뿐이고 **열 목록이 없다**(협업-규칙 §2-1 "열은 CSV 헤더에서 읽힌다"의 근거). 받는 쪽은 Maker `Reimport All` 한 번만 하면 된다.
- `git diff --check`
