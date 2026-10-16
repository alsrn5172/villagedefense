'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const here = __dirname;
const moduleAt = process.argv.indexOf('--lua-module');
assert(moduleAt >= 0 && process.argv[moduleAt + 1], 'Usage: node Docs/tools/check-lobby-kick.cjs --lua-module <fengari module directory>');
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require(path.resolve(process.argv[moduleAt + 1]));
const script = fs.readFileSync(path.join(here, '../../RootDesk/MyDesk/Match/MatchLobbyGateway.mlua'));
const cases = fs.readFileSync(path.join(here, 'lobby-kick-cases.lua'));
for (const [name, buffer] of [['MatchLobbyGateway', script], ['cases', cases]]) {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  assert(!decoded.includes('\uFFFD'), name + ' invalid Korean text');
}
function transpile(source) {
  const name = source.match(/script\s+(\w+)\s+extends/)[1];
  const args = text => text.split(',').map(s => s.trim().split(/\s+/).at(-1)).filter(Boolean).join(',');
  return name + '={}\n' + source.replace(/\r\n/g, '\n').replace(/^\s*@[^\n]*$/gm, '')
    .replace(/script\s+\w+\s+extends\s+\w+/, 'do\nlocal self=' + name + '\n')
    .replace(/^\s*property\s+\w+\s+(\w+)\s*=\s*/gm, name + '.$1 = ')
    .replace(/^\s*method\s+\w+\s+(\w+)\(([^)]*)\)/gm, (_, method, a) => 'function ' + name + ':' + method + '(' + args(a) + ')')
    .replace(/^\s*handler\s+(\w+)\(([^)]*)\)/gm, (_, method, a) => 'function ' + name + ':' + method + '(' + args(a) + ')');
}
const prelude = 'log=function()end log_warning=log log_error=log\nisvalid=function(v)return v~=nil and v~=false end\nVector2=function(x,y)return {x=x,y=y}end\n';
const L = lauxlib.luaL_newstate();
try {
  lualib.luaL_openlibs(L);
  const code = prelude + transpile(script.toString('utf8')) + '\n' + cases.toString('utf8');
  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  assert.equal(status, lua.LUA_OK, to_jsstring(lua.lua_tostring(L, -1)));
  console.log('PASS: ' + to_jsstring(lua.lua_tostring(L, -1)));
} finally { lua.lua_close(L); }
