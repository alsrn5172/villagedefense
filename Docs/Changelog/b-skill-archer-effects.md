# b/skill-archer-effects — 궁수 스킬 정리 (PR #102)

## 1차 — 궁수 로직 3건 (2026-09-26 · 사용자 지시 · origin/main `3b6c972` 합친 뒤)

궁수 스펙 대조(2026-09-26 · 원장 "Archer prep A0")에서 나온 B 쪽 어긋남 3개.

| # | 무엇 | 어떻게 |
|---|---|---|
| 1 | **더블 샷 피해가 첫 화살에만** 실려 있었다(첫 발 ×2 · 둘째 발은 `VisualOnly` — 첫 발이 빗나가면 0 · 둘째 발이 대상 주위를 돌며 좌우로 뒤집힘) | 두 발이 **같은 볼리를 공유**(`SkillAttack.IsSharedVolley` = SK_A11 · `SkillProjectile.Volley { dealt, aim }`). 두 발 모두 실제 투사체 · 피해 ×2 · 표시 2타 · 명중 이펙트/사운드. **먼저 맞힌 발이 피해를 내고**(`[SkillProjectile] volley SK_A11 dealt …`), 나머지 발은 판정 없이 대상(없으면 먼저 맞은 자리)에 닿으면 이펙트만 내고 사라진다(`FinishVolleyFollower` · `volley follower … arrived`). 한 발당 60~100% × 2타 그대로. 럭키 세븐(SK_T11)은 예전 그대로 |
| 2 | **스나이핑이 단일 대상이 아니었다**(0.8×0.8 판정 상자에 겹친 몬스터 전부) | `SkillProjectile.SingleTargetOnly`(`SkillAttack.IsSingleTargetProjectile` = SK_A21) — 유도 대상(보스 우선)만 `IsAttackTarget` 통과. 대상이 사라져 유도가 풀리면 제한 없음 |
| 3 | 툴팁 "지속 1초"(스나이핑) · "지속 1.5초"(폭풍의 화살) — CSV Duration 이 지속이 아니라 발사 시점 | `SkillWindowLogic.DurationIsDelayLabels` → **"선딜 1초"** · **"시전 1.5초 뒤 발사"**. 다른 스킬은 그대로 "지속 N초" |

- 왜 "두 발이 따로 한 번씩" 이 아닌가: 둘째 발은 첫 발 0.1~0.12s 뒤에 닿는데, 몬스터 피격 무적(`Faction/MonsterHit.mlua:5` `ImmuneCooldown = 0.4` · A 파일)이 그 사이 피해를 막는다. 그래서 피해 2타는 한 번에 내고, 먼저 닿은 쪽이 낸다. 따로 두 번 내려면 A 의 무적 규칙에 예외가 필요하다(요청은 사용자 확인 뒤).
- `SkillInfo.csv` SK_A11 `#Note` 문구만 갱신(BOM · CRLF 유지 · 열 변경 없음).
- LSP: 에러 · 경고 0 (남은 info 는 원래 있던 것). `check-integrity` 통과. **Play 확인 전 → Draft.**

### Play 체크리스트 (다음 라운드)

1. 더블 샷 · 달팽이 1마리: `volley SK_A11 dealt by this arrow x2` 1번 + `volley follower SK_A11 arrived` 1번 · 피해 표시 2타 · 둘째 화살이 대상 주위를 돌지 않음.
2. 더블 샷 · 첫 발이 먼저 맞은 대상이 죽는 경우(HP 낮은 몹): 둘째 발은 그 자리(`Volley.aim`)에서 이펙트만.
3. ⚠ `property any Volley` 에 넣은 테이블이 두 투사체 사이에서 **같은 참조로 공유되는지** 이 라운드에서 처음 확인한다 — 복사되면 둘째 발이 follower 로 안 바뀌고 무적시간에 막혀 계속 날아간다(로그 `volley follower` 없음).
4. 스나이핑 · 달팽이 3마리 겹침 + 보스 없음: 맞는 건 유도 대상 1마리뿐(HP 로그). 보스 있음: 보스만.
5. 스킬 창: 스나이핑 "선딜 1초" · 폭풍의 화살 "시전 1.5초 뒤 발사" · 나머지 스킬은 그대로.
6. 럭키 세븐 회귀 없음(첫 발 피해 · 둘째 발 연출).
