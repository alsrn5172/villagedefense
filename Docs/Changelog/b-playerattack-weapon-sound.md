# b/playerattack-weapon-sound — 기본 공격 무기별 소리

## 1차 (2026-10-01 · 사용자 결정 "기본 공격이 무음 → B 쪽 표를 PlayerAttack 에 · WeaponMotion.csv 는 안 바꿈")

- **문제**: 기본 공격은 어떤 무기로도 소리가 없었다. `PlayerAttack.AttackNormal` 은 모션(`_PlayerMotion:PlayAttack`)과 판정만 했고, `WeaponMotion.csv` 에도 소리 열이 없다.
- **바꾼 것**(`RootDesk/MyDesk/PlayerAttack.mlua` 만):
  - `WeaponAttackSounds` 표(무기 종류 → 원작 `sound/weapon.img/<sfx>/Attack`)를 `OnBeginPlay` 에서 채운다(`BuildWeaponAttackSounds`).
  - `AttackNormal` 이 휘두르는 순간 `PlayWeaponAttackSound(시전자 위치)` 를 부른다. 맞았는지와 무관하다.
  - 소리는 서버가 그 맵의 유저마다 Client RPC(`PlayWeaponAttackSoundLocal` · targetUserId)로 낸다. 듣는 사람 = 각자 자기 캐릭터. A 의 `Monster.PlaySoundToMap` / `PlaySoundLocal` 과 같은 방식이다(스킬 소리 쪽은 아직 모든 클라로 가는 옛 방식 · 따로 B PR 예정).
  - 로그: `[PlayerAttack] attack sound weaponType=[BOW] ruid=4346b64f -> 1 user(s) (<uid>)`. 표에 없는 무기 종류면 경고 한 줄 후 무음.
- **표** — 무기 종류마다 원작 무기의 `info/sfx`(maplestory.io `KMS/389/Character/Weapon/<id>.img/info/sfx`)를 우리 `ItemInfo.csv` 무기 42종(방패 제외)마다 확인했다. 원작 아이템은 아바타 이름으로 찾았다. 한 종류 안에서 갈리면 다수를 골랐다.

| WeaponType | 원작 sfx | RUID | 근거 |
|---|---|---|---|
| SWORD_1H | swordS/Attack | `59a1b76d…` | 8종 중 6종 swordS · 사브르 = swordL · 몽둥이 = mace |
| SWORD_2H | swordL/Attack | `b5660397…` | 5종 중 4종 · 목검 = swordS |
| DAGGER | swordS/Attack | `59a1b76d…` | 5종 중 3종 · 삼각 자마다르 · 신기타 = swordL |
| WAND | mace/Attack | `2ac47382…` | 전부 |
| BOW | bow/Attack | `4346b64f…` | 전부 |
| CLAW | tGlove/Attack | `c295ef20…` | 전부 |
| KNUCKLE | knuckle/Attack | `4b8b139a…` | 전부 |
| 맨손 ("") | barehands/Attack | `69ef5a95…` | 원작 맨손. 모션은 안 나오지만 판정은 그대로라 소리는 낸다 |

- RUID 는 전부 라이브러리 태그 `path = sound/weapon.img` 로 확인했다(`msw_resource_api.cjs tags`). 원작 `weapon.img` 소리 23개는 검색 색인에서 `effect` · category `etc` 에 있다.
- `Attack2`(bow · tGlove · knuckle · barehands 에 있음)는 쓰지 않았다.
- 그대로 둔 것: `WeaponMotion.csv`(A 의 기본 공격 행 · 소리 열 없음) · `PlayerMotion.mlua`(A) · 피해 · 크리 · 대상 선택.

### Play 체크리스트

1. 무기 종류마다(한손검 · 두손검 · 단검 · 완드 · 활 · 아대 · 너클 · 맨손) 기본 공격 한 번에 그 소리가 한 번 난다. 서버 로그 `attack sound weaponType=[…]` 가 공격마다 한 줄.
2. 빗맞아도(대상 없음) 소리는 난다. 몬스터를 맞히면 피해 · 모션은 예전과 같다.
3. 두 클라: 같은 맵의 다른 유저가 공격하면 들리고(`-> 2 user(s)`), 다른 맵이면 안 들린다.
4. 빌드 경고 N → N.

## 2차 (2026-10-04 · 사용자 결정 "무기별 볼륨 · 목표 −15.6 LUFS")

- **문제**: 볼륨이 무기 종류와 무관하게 `WeaponAttackSoundVolume = 1.0` 하나였다. 원본 소리 크기가 무기마다 달라(−18.3 ~ −24.9 LUFS) 합동 Play 에서 작게 들렸다(F4 = 단검 +6 dB).
- **바꾼 것**(`RootDesk/MyDesk/PlayerAttack.mlua` 만):
  - `WeaponAttackSoundVolumes` 표(키 = `WeaponAttackSounds` 와 같음)를 `BuildWeaponAttackSounds` 에서 같이 채운다.
  - `PlayWeaponAttackSound` 는 무기 종류의 값을 쓰고, 표에 없으면 `WeaponAttackSoundVolume`(1.0 · 그대로 둠)을 쓴다.
  - 로그에 볼륨을 붙였다: `[PlayerAttack] attack sound weaponType=[BOW] ruid=4346b64f vol=2 -> 1 user(s) (<uid>)`.
- **목표 −15.6 LUFS**(사용자 결정 2026-10-04 · 합동 Play F4 = 단검 +6 dB). 볼륨 = 10^((−15.6 − 원본 LUFS)/20). 원본 LUFS = ffmpeg `ebur128`(0.4 s 보다 짧은 클립은 0.4 s 로 패딩 · PR #156 과 같은 방법).
- **엔진 상한 ×2.0**: 포커스 둔 루프백 녹음 실측으로 요청 ×2.92 → ×1.94 · ×4.00 → ×2.05 였다. ×2.0 까지는 선형이고 찌그러짐이 없다. 그래서 두손검은 ×2.0 = −18.9 LUFS(목표보다 3.3 dB 낮음).
- 단검 소리 = swordS(사용자 선택 2026-10-04, P15) — 1차 표 그대로.

| WeaponType | 소리 RUID | 원본 LUFS | 볼륨 | 결과 LUFS |
|---|---|---|---|---|
| SWORD_1H | `59a1b76d…` | −21.6 | 2.0 | −15.6 |
| DAGGER | `59a1b76d…` | −21.6 | 2.0 | −15.6 |
| BOW | `4346b64f…` | −21.6 | 2.0 | −15.6 |
| 맨손 ("") | `69ef5a95…` | −21.6 | 2.0 | −15.6 |
| CLAW | `c295ef20…` | −19.3 | 1.53 | −15.6 |
| KNUCKLE | `4b8b139a…` | −19.3 | 1.53 | −15.6 |
| WAND | `2ac47382…` | −18.3 | 1.36 | −15.6 |
| SWORD_2H | `b5660397…` | −24.9 | 2.0 | −18.9 (엔진 상한) |

### Play

- P14–P17 합동 Play 2026-10-04 통과(소리 1회/스윙 · 2명 같은 맵 → 2 user(s) · 다른 맵 → 1 user(s) · 서로 듣기는 로그로 확인: 한 PC 에서는 포커스 창만 소리를 냄).
- 무기별 볼륨 표 자체는 이 커밋 뒤 Play 로 아직 확인하지 않았다.
