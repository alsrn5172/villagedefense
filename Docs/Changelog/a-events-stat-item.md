# a/events-stat-item — 오류보고서

작성일: 2026-09-03

## 결과

이벤트 선행 PR은 완료하지 못했다. 유효한 이벤트 소스·`.codeblock`은 이 브랜치에 커밋하지 않았다.

## 발생 경위

1. 등록 문서 PR #13 병합 뒤 이벤트 4종(`StatRecalculatedEvent`, `ApAllocatedEvent`, `SpSpentEvent`, `EquipChangedEvent`)을 준비했다.
2. `.mlua`만 먼저 만든 뒤 Maker Refresh를 실행하자, 4개 모두 `[LEA-3015] CannotLoad / Sequence contains no elements`로 로드에 실패했다.
3. 원인은 커스텀 `EventType`이 Maker의 `Create Scripts > Create EventType`으로 등록되어야 하며, 이 과정이 `.codeblock` 메타데이터를 생성하기 때문이다. 수동 `.mlua`는 제거했다.
4. 콘솔을 비우고 Refresh한 결과 일반·빌드 로그는 0건이 되었다.
5. Maker에서 EventType 4종을 생성·저장하자, Maker가 만든 `.mlua`·`.codeblock` 8개가 계약 경로 `RootDesk/MyDesk/{Stat,Item}/`가 아니라 `Mislocated/`에 기록되었다.

## 중단 사유

LocalWorkspace 공식 안내는 엔트리의 고유 메타데이터를 직접 복사·편집하지 말라고 한다. 따라서 `Mislocated/`의 Maker 생성 `.codeblock`을 수동 이동·수정하지 않고 중단했다.

## 작업 폴더에서 관찰된 비의도 변경

- Refresh 때 `RootDesk/MyDesk/Models/{Effects,Farm,Structures,Terrain}.directory`가 삭제 상태가 됨.
- `ui/PopupGroup.ui`가 수정 상태가 됨. 이 파일은 이번 작업의 수정 금지 대상이다.
- `map/map01.map`, `Item.directory`, `Stat.directory`, `.claude/`, `.codex/config.toml`, `CLAUDE.md`가 추적되지 않은 변경으로 나타남.

위 항목과 `Mislocated/`의 생성물은 의도적으로 커밋하지 않는다.

## 재개 조건

Maker LocalWorkspace를 깨끗한 상태로 복구한 뒤, Maker에서 EventType을 먼저 만들고 저장했을 때 생성 파일이 `Mislocated/`가 아닌 `RootDesk/MyDesk/...`에 기록되는지 확인한다. 그 전에는 `.codeblock`을 수동 이동·수정하지 않는다.
