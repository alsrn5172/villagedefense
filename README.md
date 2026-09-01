# 강화하고살아남기

MapleStory Worlds 그룹 프로젝트. **LocalWorkspace + git** 으로 협업한다.

## 처음 왔다면 이 순서로 읽는다

1. **[`Docs/협업-규칙.md`](Docs/협업-규칙.md)** — 어떻게 같이 작업하나. 소유권 · 브랜치 · 동기화 · 충돌 복구 · 합류 절차
2. **[`Docs/스키마-계약.md`](Docs/스키마-계약.md)** — 어떤 모양으로 만드나. 표 · 열 · 열거값 · 이벤트 · **신규 시스템 등록 절차**
3. **[`Docs/VillageDefense-M1-GDD.md`](Docs/VillageDefense-M1-GDD.md)** — 담당 도메인 절만
4. [`Docs/VillageDefense-Roadmap.md`](Docs/VillageDefense-Roadmap.md) — 마일스톤 · 미정 항목

## 합류 절차 (요약)

전체는 [`Docs/협업-규칙.md` §14](Docs/협업-규칙.md).

1. MSW 그룹 가입 → 등급 배정
2. **짧은 경로**에 clone (전체 경로 255자 제한)
3. 🔴 **`.gitattributes` 작동 확인** — 이게 안 먹으면 `.map` 이 조용히 자동 머지된다

```bash
git check-attr merge -- map/map01.map
```

   → `merge: unset` 이 나와야 한다

4. `.mcp.json.example` → `.mcp.json` 복사 후 **자기 토큰** 입력
5. Maker에서 이 월드 최초 입장 → 폴더 선택창에서 clone 폴더 지정
6. `Reimport All` → 빌드 로그 기준선 기록

## `main` 보호

**서버에서 막습니다 — 예외 없습니다.** `main` 직접 push 금지, PR 필수(승인 0), force push·삭제 차단.
그룹장도 막힙니다. 로컬 훅은 서버에 닿기 전에 잡아주므로 함께 설치합니다.

```bash
git config core.hooksPath .githooks
```

## 🔴 자주 밟는 함정 3개

| 함정 | 결과 |
|---|---|
| **git 조작 전에 Maker를 안 껐다** | Maker가 메모리 내용으로 디스크를 되쓴다 → 받아온 변경이 사라진다 |
| **`git checkout --ours/--theirs` 를 썼다** | rebase 중에는 의미가 뒤집힌다. `.map` 은 통째로 고르는 파일이라 **하루치가 날아간다.** 브랜치명을 명시할 것 |
| **`.mcp.json` 을 커밋했다** | API 토큰 유출. 히스토리를 지워도 **재발급해야 한다** |

## 이름이 세 개인 이유

셋은 **일부러 다르다.** 게임 이름은 플레이어에게 보이므로 한글, 코드·경로·URL 식별자는 영어를 쓴다.

| 무엇 | 이름 | 성격 |
|---|---|---|
| 게임 / MSW 월드 | **강화하고살아남기** | 플레이어에게 보이는 이름 |
| 로컬 폴더 | `강화하고살아남기` | LocalWorkspace 저장 위치일 뿐. Maker는 **경로만** 기억한다 |
| GitHub 저장소 | `villagedefense` | URL·clone 경로에 안전한 영문 |
| 문서 파일명 | `VillageDefense-*` | 좌동 |

> 🔴 **폴더 이름을 바꾸지 마세요.** 바꾸면 Maker가 LocalWorkspace 경로를 잃고 재지정이 필요해집니다 — 동기화 사고가 나기 쉬운 구간입니다. 게임 이름을 바꾸고 싶으면 **Maker/홈페이지에서 월드 이름만** 바꾸면 되고, 폴더는 그대로 두면 됩니다.

## 담당

| | 이름 | 소유 폴더 |
|---|---|---|
| **A** | 강민구 (그룹장·개발책임자) | `Core` `Match` `Village` `Lane` `Dispatch` `Monster` `Boss` `Map` `Npc` `Economy` `Progression` |
| **B** | 박승현 (개발자) | `Skill` `Job` |

## 폴더

| | 무엇 | 편집 |
|---|---|---|
| `Global/` | 엔진 기본 템플릿 · 월드 설정 | 기존 `.model` 만 `ModelBuilder` 로. **새 파일 금지** |
| `map/` | `.map` | `MapBuilder` |
| `RootDesk/MyDesk/` | `.mlua` `.model` `.csv` — **주 작업 영역** | 직접 |
| `ui/` | `.ui` | `UIBuilder` 만 |
| `Environment/` | 엔진 API 정의 `.d.mlua` | **읽기 전용** |
| `Docs/` | 기획 · 계약 · 규칙 | 계약서는 공지 후 단독 |
| `Mislocated/` | 위치가 어긋난 스크립트 — 정리 대상 | |
