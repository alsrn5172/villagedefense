#!/usr/bin/env node
/*
 * WO-048 — 시설 오라 띠 애니메이션 표 값 채우기 (생성 스크립트 · 다시 돌려도 같은 결과)
 *
 *   node Docs/tools/aura-anim/gen-rows.cjs          # RootDesk/MyDesk/AuraBandArt.csv 를 다시 쓴다
 *   node Docs/tools/aura-anim/gen-rows.cjs --dry    # 쓰지 않고 행만 보여 준다
 *
 * 입력: Docs/tools/aura-anim/ruid-map.json (upload.cjs 결과 · 종류 4개 × 24프레임)
 * 출력: RootDesk/MyDesk/AuraBandArt.csv — 행 4개(BASE · SPEED · ATTACK · HEAL) · Frames = RUID 24개를 | 로 · FrameSec 0.1(10fps · 2.4초 반복)
 *       짝 RootDesk/MyDesk/AuraBandArt.userdataset 은 없을 때만 한 번 만든다(id 를 바꾸지 않는다).
 * BOM + CRLF. 같은 입력이면 같은 출력(멱등). Play 중에는 돌리지 않는다(Maker 가 메모리 사본으로 되써서 수정이 조용히 사라진다).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CSV = path.join(ROOT, 'RootDesk', 'MyDesk', 'AuraBandArt.csv');
const DS = path.join(ROOT, 'RootDesk', 'MyDesk', 'AuraBandArt.userdataset');
const DRY = process.argv.includes('--dry');
const FRAMES = 24;
const FRAME_SEC = '0.1';

const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'ruid-map.json'), 'utf8'));
const KINDS = [
  ['BASE', 'base', '흰 원본(특성 값이 들어오기 전)'],
  ['SPEED', 'speed', '이동속도 · 하늘'],
  ['ATTACK', 'attack', '공격력 · 주황'],
  ['HEAL', 'heal', '회복 · 초록'],
];
const HEADER = 'Kind,Frames,FrameSec,Enabled,#Note';
const lines = [HEADER];
for (const [kind, key, what] of KINDS) {
  const ruids = [];
  for (let i = 0; i < FRAMES; i++) {
    const e = map[`aura_mist_${key}_${String(i).padStart(2, '0')}`];
    if (!e || !/^[0-9a-f]{32}$/.test(e.ruid)) throw new Error(`ruid-map 에 aura_mist_${key}_${i} 없음 — upload.cjs 먼저`);
    ruids.push(e.ruid);
  }
  lines.push([kind, ruids.join('|'), FRAME_SEC, 'true', `WO-048 떠오르는 안개 ${what} · 정지 띠 0.9 + 겹 합성 1200x600 가운데 피벗 · ${FRAMES}프레임 2.4초 반복`].join(','));
}
const text = '﻿' + lines.join('\r\n') + '\r\n';
if (DRY) { for (const l of lines) console.log(l.slice(0, 120)); process.exit(0); }
fs.writeFileSync(CSV, text, 'utf8');
console.log('wrote', path.relative(ROOT, CSV), lines.length - 1, 'rows');

if (!fs.existsSync(DS)) {
  const id = crypto.randomUUID();
  const ds = {
    Id: '', GameId: '', EntryKey: `userdataset://${id}`, ContentType: 'x-mod/userdataset', Content: '',
    Usage: 0, UsePublish: 1, UseService: 0, CoreVersion: '26.7.0.0', StudioVersion: '0.1.0.0', DynamicLoading: 0,
    ContentProto: { Use: 'Json', Json: { name: 'AuraBandArt', id, serveronly: false, syncDataSetWebUrl: '', dynamicloading: 0 } },
  };
  fs.writeFileSync(DS, JSON.stringify(ds, null, 2).replace(/\n/g, '\r\n'), 'utf8');
  console.log('wrote', path.relative(ROOT, DS), id);
}
