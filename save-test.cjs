const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/pixel-collect.html', 'utf8');
const box = {};
vm.createContext(box);
for (const id of ['model', 'saves']) {
  const script = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  if (script) vm.runInContext(script[1], box);
}
const M = box.PixelModel, S = box.PixelSaves;
const ids = ['first-heart', 'workshop-sun', 'garden-butterfly', 'tiny-rocket', 'delivery-home'];
const plain = value => JSON.parse(JSON.stringify(value));
function storage(entries = {}) {
  const data = new Map(Object.entries(entries)), reads = [], writes = [];
  return {data, reads, writes, getItem(key) { reads.push(key); return data.get(key) ?? null; },
    setItem(key, value) { writes.push(key); data.set(key, value); }};
}
assert.deepEqual(plain(M.levels.map(l => l.id)), ids, 'levels need explicit permanent IDs');
const legacy = JSON.stringify({completed: [0, 3], level: 2});
const store = storage({'pixel-collect-v1': legacy});
const loaded = S.load(store, '/pixel-collect/', M.levels);
assert.deepEqual(plain(loaded.saved), {version: 2, completed: [ids[0], ids[3]], level: ids[2]});
assert.equal(store.data.get('pixel-collect-v1'), legacy, 'legacy backup must remain byte-for-byte intact');
assert.deepEqual(JSON.parse(store.data.get('pixel-collect-v2')), plain(loaded.saved));
const stable = {version: 2, completed: [ids[3], 'future-level'], level: ids[3]};
const reordered = [M.levels[4], {id: 'new-level'}, ...M.levels.slice(0, 4)];
const existing = storage({'pixel-collect-v2': JSON.stringify(stable), 'pixel-collect-v1': legacy});
assert.deepEqual(plain(S.load(existing, '/pixel-collect/', reordered).saved), stable);
assert.deepEqual(existing.reads, ['pixel-collect-v2'], 'new schema must take precedence over legacy');
const remigrate = storage({'pixel-collect-v1': legacy});
assert.deepEqual(plain(S.load(remigrate, '/pixel-collect/', reordered).saved), plain(loaded.saved), 'historical indices cannot follow current order');
for (const path of ['/pixel-collect/preview/', '/pixel-collect/preview/index.html']) {
  const preview = storage({'pixel-collect-v2': JSON.stringify(stable), 'pixel-collect-v1': legacy});
  const result = S.load(preview, path, M.levels);
  assert.equal(result.key, 'pixel-collect-preview-v2');
  assert.deepEqual(plain(result.saved), {version: 2, completed: [], level: ids[0]});
  assert(preview.reads.every(k => k === 'pixel-collect-preview-v2'));
  assert(preview.writes.every(k => k === 'pixel-collect-preview-v2'));
  assert.equal(preview.data.get('pixel-collect-v1'), legacy);
  assert.equal(preview.data.get('pixel-collect-v2'), JSON.stringify(stable));
}
for (const invalid of ['{broken', 'null', '[]', '42', JSON.stringify({completed: [ids[0], ids[0], 0, null, '', 'future-level'], level: 2})]) {
  const bad = storage({'pixel-collect-v2': invalid, 'pixel-collect-v1': legacy});
  const result = S.load(bad, '/', M.levels);
  assert.equal(result.saved.version, 2);
  assert(Array.isArray(result.saved.completed));
  assert(result.saved.completed.every(id => typeof id === 'string' && id.length));
  assert.equal(new Set(result.saved.completed).size, result.saved.completed.length);
  assert.equal(result.saved.level, ids[0]);
  assert.equal(bad.reads.includes('pixel-collect-v1'), false, 'malformed new data must not resurrect stale legacy data');
}
const unversioned = storage({'pixel-collect-v2': JSON.stringify({completed: [ids[1]], level: ids[1]})});
assert.deepEqual(plain(S.load(unversioned, '/', M.levels).saved), {version: 2, completed: [ids[1]], level: ids[1]});
const malformedLegacy = storage({'pixel-collect-v1': JSON.stringify({completed: [0, 0, -1, 5, 1.2, '2', null, 4], level: '3'})});
assert.deepEqual(plain(S.load(malformedLegacy, '/', M.levels).saved), {version: 2, completed: [ids[0], ids[4]], level: ids[0]});
const future = storage({'pixel-collect-v2': JSON.stringify({version: 99, completed: [ids[0]], level: ids[0]})});
assert.equal(S.load(future, '/', M.levels).writable, false, 'unknown schemas must not be overwritten');
const denied = {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}};
assert.equal(S.load(denied, '/', M.levels).writable, false);
const quota = storage({'pixel-collect-v1': legacy});
quota.setItem = () => {throw Error('quota');};
const inMemory = S.load(quota, '/', M.levels);
assert.deepEqual(plain(inMemory.saved), plain(loaded.saved), 'failed migration write must still restore progress for this session');
assert.equal(inMemory.writable, false);
console.log('Stable IDs, migration, reorder, insertion, isolation, validation, and unavailable storage passed.');
