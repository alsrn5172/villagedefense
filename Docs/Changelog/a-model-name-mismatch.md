## 2026-09-08 — 세션 시작 시 뜨던 `LEA-3018` 4건 제거 · 브랜치 `a/model-name-mismatch` (main `c23a2af` 에서)

### 배경
월드를 열 때마다 콘솔에 `[LEA-3018] InvalidData : 파일 이름과 데이터 정보가 일치하지 않아 정상적으로 동작하지 않을 수 있습니다` 가 **4건** 떴다.
`Docs/Changelog/a-map-monster-portal.md:110` 에 *"정체 미확인 — 별도 조사 필요"* 로 기록만 남아 있던 항목이다. 이번에 원인을 잡았다.

### 원인 — 이름이 아니라 **파일명**이 규격에서 벗어나 있었다
`RootDesk/MyDesk/Models/Monsters/` 의 파일명 규격은 **`"한글명 (English Name).model"`** 이다 (83개 중 73개가 그렇다).
문제의 4개는 `ContentProto.Json.Name` 은 이미 규격에 맞는데(`주황버섯 (Orange Mushroom)`) **파일명만 영문**으로 남아 있어 둘이 어긋났다.

| 파일명(전) | `Json.Name` | → 파일명(후) |
|---|---|---|
| `JrNecki` | `주니어 네키 (Jr. Necki)` | `주니어 네키 (Jr. Necki)` |
| `Octopus` | `옥토퍼스 (Octopus)` | `옥토퍼스 (Octopus)` |
| `OrangeMushroom` | `주황버섯 (Orange Mushroom)` | `주황버섯 (Orange Mushroom)` |
| `Shroom` | `스포아 (Shroom)` | `스포아 (Shroom)` |

> 영문 파일명이 남은 나머지 6개(`monster2220000` 등 자동 임포트 잔재)는 `Json.Name` 도 같은 값이라 경고가 나지 않는다. 그대로 둔다.

### 고친 방법 — 파일명만 변경(내용 무수정)
- 모델 참조는 전부 `MonsterInfo.csv` 의 `ModelId`(= `EntryKey` GUID)이고, 파일명으로 모델을 찾는 코드는 없다
  (`MonsterSpawner.mlua` 의 한글 문자열은 주석이었다). 확인함
- `Models/Monsters.directory` 는 폴더 메타데이터일 뿐 **파일명 목록을 들고 있지 않다.** 확인함
- 따라서 파일명 변경만으로 충분하고 `.model` 내용은 한 글자도 바꾸지 않았다

### 검증
- 전수 재검사: **83개 모델 중 `Json.Name` ≠ 파일명 = 0건**
- 🟡 **런타임 미검증** — Maker 를 열고 refresh 한 뒤 콘솔에 `LEA-3018` 이 사라졌는지 확인 필요
