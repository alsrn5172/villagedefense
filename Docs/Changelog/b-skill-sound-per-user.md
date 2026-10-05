# b/skill-sound-per-user — 스킬 소리를 그 맵 유저에게만

## 1차 (2026-10-01 · #116 머지 뒤에 올린다)

- **문제**: 스킬 소리 5곳이 전부 서버에서 `_SoundService:PlaySoundAtPos` 를 **대상 유저 없이** 불렀다. MSW 에서 Client 함수를 서버가 UserId 없이 부르면 **모든 클라**에서 실행된다(문서 *Effective MSW 1* "Sending Responses to Specific Clients Only"). 듣는 사람(listener)도 시전자라 거리 감쇠가 시전자 기준이었다 → 매치 룸의 다른 맵에 있는 사람도 동료의 스킬 소리를 시전자 볼륨으로 들었다.
- **고침**(`Skill/` 만 · A 파일 없음): `SkillExecutors` 에 서버 도우미 하나.
  - `PlaySkillSoundToMap(ruid, pos, source, volume)` (ServerOnly) — `source`(시전자 · 투사체 · 맞은 몬스터)가 있는 맵의 유저(`_UserService:GetUsersByMapComponent`)마다 `PlaySkillSoundLocal(..., targetUserId)`.
  - `PlaySkillSoundLocal(ruid, volume, x, y, z)` (Client) — 받는 클라가 **자기 캐릭터**(`_UserService.LocalPlayer`)를 듣는 사람으로 `PlaySoundAtPos`. 인자는 원시 타입만.
  - A 의 `Monster.PlaySoundToMap` / `PlaySoundLocal` · #134 `PlayerAttack.PlayWeaponAttackSound` 와 같은 방식이다.
- **바꾼 호출 5곳**:

| 소리 | 곳 | 맵 기준(source) |
|---|---|---|
| 시전음(castSounds) | `SkillExecutors.PlayCastSound` | 시전자 |
| 주먹 · 폭격 파 · 보호막 끝 등(extraSounds) | `SkillExecutors.PlaySoundRuid` | 시전자 |
| 근접 · 범위 명중음(PendingHitSound) | `SkillAttack.OnAttack` | 시전자(SkillAttack 엔티티) |
| 투사체 명중음(HitSoundRUID) | `SkillProjectile.OnAttack` | 투사체 |
| 픽파켓 동전 소리 | `SkillBuffs` 픽파켓 드랍 | 맞은 몬스터 |

- **로그 스위치**: `SkillExecutors.SkillSoundLog`(기본 false — 타격마다 한 줄이라). 켜면 소리마다 `[Skill] sound <ruid 앞 8자> from <source> on <맵> -> N user(s)`.
- 소리 RUID · 볼륨 · 재생 시점은 그대로다. 맵은 소리를 **부르는 그 순간에** `source.CurrentMap` 으로 읽는다(동기 · 저장 없음). 지워지는 순서를 코드로 확인했다(2026-10-01):
  - **막타**: `Monster.Dead` 는 피격 판정만 바로 끄고 숨김 · `Destroy` 는 `DestroyDelay`(≥0.6s) 뒤 타이머다(`Monster.mlua:318-349`). 명중음은 source = 시전자 · 투사체라 몬스터 제거와 무관하고, 픽파켓 소리는 같은 호출 안에서 동전을 그 몬스터 맵에 스폰한 직후에 난다 → 난다.
  - **투사체 명중**: `OnAttack` 은 `AttackFast` 안에서 동기로 불리고(폭발 로그 `hit=` 가 `AttackFast` 직후 이미 세어져 있다) 소리 → 그다음 `Destroy(0.05)` 순서다(`SkillProjectile.mlua` OnAttack) → 난다.
  - **시전자가 도중에 나감 · 죽음**(함포 사격 파 · 피스트인레인지 타 · 쉴드 끝): 지연 소리는 피해와 같은 타이머 안에서 `isvalid(casterEntity)` 검사 뒤에 난다. 죽어도 플레이어 엔티티는 남아 파 · 소리가 계속되고, 월드를 떠나 엔티티가 없어지면 그 파의 피해도 소리도 같이 없다(예전과 같다). 맵을 옮기면 파가 떨어지는 그 맵(시전자의 지금 맵)으로 간다.
  - 건너뛰는 경우는 `source` 가 소리를 부르는 순간 이미 없을 때뿐이고, 위 경로에선 생기지 않는다.
- 그대로 둔 것: #134 `PlayerAttack` 의 기본 공격 소리(같은 방식으로 이미 따로 보낸다) · A 의 몬스터 · 보스 · 시설 소리.

### Play 체크리스트 (2 클라)

MSW Maker Play 창의 **Adding Virtual Players**(테스트 중 가상 클라 최대 10개 · 테스트가 끝나면 전부 닫힘 — MSW 문서 *Play* › "Play when Testing").

1. Play → 서버 Lua: `_SkillExecutors.SkillSoundLog = true`.
2. 가상 플레이어 1명 추가 → 두 클라 모두 시작 맵(`/maps/Orbis_Lobby_VictoriaStation`)에 들어온다(같은 정적 룸).
3. **같은 맵**: 내 클라에서 스킬 시전(예: 해적 Q · 명중까지) → `[Skill] sound … from <내 캐릭터> on Orbis_Lobby_VictoriaStation -> 2 user(s)` · 명중음도 `-> 2`. 두 클라가 같은 PC 라 소리가 두 번(겹쳐) 들릴 수 있다.
4. **다른 맵**: 가상 플레이어를 다른 맵으로(서버 Lua: 두 번째 유저 `PlayerComponent:MoveToMapPosition("Orbis_Lobby_VictoriaShip", Vector2(0, 0))` · 또는 `pirate-check/p134_server.lua` 의 `moveOther`) → 같은 스킬 → `-> 1 user(s)` · 한 번만 들린다.
5. 픽파켓(도적 · 동전이 떨어질 때) · 투사체 명중(에너지볼트 · 더블 샷)도 같은 규칙인지 한 번씩: `-> 2` / `-> 1`.
6. `_SkillExecutors.SkillSoundLog = false` 로 되돌린다 · 빌드 경고 N → N.

## 2026-10-05 — main 1d518c6 합침

- 충돌 1곳: `SkillProjectile.mlua` `OnAttack` 명중 소리 — main(#102)의 조건(볼리 발은 발마다 한 번 · `soundDone`)에 이 브랜치의 재생(`SkillExecutors.PlaySkillSoundToMap` · 그 맵 유저에게만)을 붙였다.
- main 이 새로 넣은 스킬 소리 호출 중 `_SoundService` 를 바로 부르는 곳은 없다(Skill 폴더 검색 · 남은 두 줄은 이 브랜치의 클라 재생 함수 안).
- 점검: LSP(바뀐 .mlua 4개) 오류 0 · `check-integrity` 전부 통과(경고 3 = main) · SkillInfo 중복 id 0. Play 안 함.
