# a/skill-hud (base `main` · Draft PR #118 · WO-033 ②)

우하단 스킬 HUD(포션 퀵슬롯 모양) + 모바일 스킬 버튼.

## 바뀐 것

| 무엇 | 어떻게 | 파일 |
|---|---|---|
| 스킬 HUD (PC) | 우하단 바에 72px 칸 5개 **Q · W · E · R · Shift**(PC 전용 · `ActivePlatform` 1) · 칸 = 틀 + 아이콘 + 7단계 쿨 오버레이 + 남은 초(금색 · 검은 테두리) + 키 글자 | `ui/SkillHudGroup.ui`(신규 · GroupOrder 2 = 퀵슬롯과 같음) |
| 스킬 HUD (모바일) | 기본 공격 버튼 둘레에 96px 둥근사각 5개(모바일 전용 · 점프 버튼과 안 겹침) · 탭 = 시전 | 〃 |
| 컨트롤러 | 칸 스킬 = B `SkillHotbar.slots` 를 `ResolveSlotSkillId` 로 읽기만(키 배치 단일 출처) · **배운(Lv>0) 액티브만 아이콘** · 안 배운 칸 = 빈 틀 + 키 글자 · 패시브 안 뜸 · 텔레포트 = Shift 칸(강화 배우면 같은 칸이 SK_M21 로) · Shift 매핑 없는 직업은 Shift 칸 숨김 · 쿨 = `LocalCooldownRemaining` ÷ `CooldownAt` · 클릭/탭 = `SkillCaster:Cast` · 0.1초 폴링(`SkillStateChangedEvent` 는 B 내부라 구독 안 함) · `[SkillHud]` 로그 | `Stat/SkillHudController.mlua`(신규) |
| 계약서 | B 등록서 1번에 예외 한 줄 — 스킬 HUD 표시 = A · 키 배치·시전 = B (#40 comment 5875058714 공지) | `Docs/스키마-계약.md` |

## 남은 것 (B)

- 초보자 "달팽이 세마리" — NOVICE 스킬 행 · 실행기 · 초보자 자동 습득 · `SkillHotbar` byJob `NOVICE` Q (#40 comment 5875058360 요청). 들어오면 HUD Q 칸에 저절로 뜬다.

## 검증

- LSP clean · ui_lint 경고 10(PC 72px 칸 · 키 글자/쿨 숫자 겹침 — 퀵슬롯과 같은 의도된 모양).
- Maker 검증: 아래 표(예정).
