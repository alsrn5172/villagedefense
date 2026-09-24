# b/skill-unarmed-refusal

## 2026-09-24 — 맨손이면 공격 스킬 거절 + 토스트

PR #92. **출처: #40 5813570100 (A 결정 · 사용자 확정 2026-09-24)** — 맨손 하한을 올리지도 몬스터 HP 를 낮추지도 않고, 대신 무기가 없으면 공격을 못 하게 한다. 이 PR 은 **스킬 쪽**만. 기본 공격 쪽은 `PlayerAttack.mlua` 담당 이관(규칙 PR #88) 머지 뒤 PlayerAttack PR 에서 같은 문구로 한다.

**헤더 변경 없음 · 새 CSV 열 · 이벤트 · RPC 없음.** A 파일 수정 없음 — `Item/EquipService`(`EnsureUser` · `EquippedItemId` `:249`) · `UIToast`(`ShowMessage`) 는 호출만.

### 규칙

| 시전 | 맨손일 때 |
|---|---|
| `MELEE_ARC` · `PROJECTILE` · `AOE` | 거절 + 토스트 "무기를 장착해야 공격할 수 있습니다" |
| `ORIGIN` 중 피해 궁(`EffectUnit` `ATK_PCT` / `STACK_PCT` — 대마법 · 폭풍의 화살 · 메소 익스플로전 · 함포 사격) | 거절 + 토스트 |
| 에너지 차지 변신 중 재시전(주먹) | 거절 + 토스트 (행은 `BUFF_SELF` 지만 재시전은 공격) |
| 버프(`BUFF_SELF` · 불굴의 진 `ORIGIN`/`SEC`) · 이동(`BLINK`) · 도발(`TAUNT`) | **그대로 시전** |

거절은 MP(6) · 쿨다운 · 사용 횟수 · 영혼석 게이트 앞(4-2)이라 아무것도 소모하지 않는다.

### 수정 — `Skill/SkillCaster.mlua`

| 위치 | 변경 |
|---|---|
| `:79` | `UnarmedToast` 속성(토스트 문구) |
| `:157` `IsDamagingCast(skill, isRecast)` | 신규 — 위 표 |
| `:171` `HasWeapon(userId)` | 신규 — `EquippedItemId(uid, e, "WEAPON") ~= ""` · `_EquipService` 가 없으면 막지 않는다 |
| `:407-414` `RequestCast` 게이트 4-2 | 시전 락(4-1) 뒤 · 사용 제한(5) 앞. 로그 `[Skill] unarmed — <skill> refused` · `CastResult(false, "no weapon equipped")` |

- 정상 흐름에서는 맨손이 안 생긴다(매치 시작 킷에 몽둥이 · `InventoryService.mlua:50`) — 플레이어가 무기를 직접 뺐을 때뿐. **Maker 에서 매치 없이 로비에서 시험하면 무기가 없을 수 있다** — 공격 스킬 시험 전에 무기를 장착한다.
- 계약서 스킬 등록서 8번에 `EquipService` 호출을 한 줄 적어야 한다 — 같은 칸을 #86 이 고치고 있어 #86 머지 뒤 이 브랜치에서 추가한다.

### Play 검증

(재입장 · Reimport All 뒤 추가) — 맨손: 파워 스트라이크 · 에너지볼트 거절 + 토스트 · MP/쿨다운 그대로 · 하이퍼 바디 · 텔레포트는 시전됨 / 무기 장착: 전부 정상 · 빌드 경고 N → N
