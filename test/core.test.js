const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const scope = vm.createContext({});
scope.window = scope;
for (const name of ['normalize', 'beaufort']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8'), scope);
}
const { Norm, Beaufort } = scope;

test('676 pairs match independent subtraction and reciprocal transformation', () => {
  for (let p = 0; p < 26; p++) for (let k = 0; k < 26; k++) {
    const plain = String.fromCharCode(65 + p), key = String.fromCharCode(65 + k);
    const expected = String.fromCharCode(65 + (k - p + 26) % 26);
    assert.equal(Beaufort.encrypt({ text: plain, key }).output, expected);
    assert.equal(Beaufort.decrypt({ text: expected, key }).output, plain);
  }
});
for (const [text, key, expected] of [
  ['DCODE', 'KEY', 'HCKHA'], ['akademeia', 'NAVY', 'NQVVJORQN'], ['C', 'P', 'N'],
  ['CEQUALSKMINUSP', 'RECIPROCAL', 'PAMOPGWSODEKKT'],
  ['SENDSUPPLIES', 'COMET', 'KKZBBIZXTLYW']
]) test('known answer ' + text, () => {
  assert.equal(Beaufort.encrypt({ text, key }).output, expected);
});
test('only ASCII letters are cipher symbols, width conversion is explicit', () => {
  assert.equal(Norm.isAlpha('ß'), false);
  assert.equal(Norm.isAlpha('ſ'), false);
  assert.equal(Norm.toUpperAscii('ａｂＣßſ'), 'ABCßſ');
  assert.equal(Norm.normalizeKey('ＮａＶｙ!ß'), 'NAVY');
});
test('lowercase is not removed and fullwidth keys work', () => {
  assert.equal(Norm.normalize('hello', { upper: false, nonAlpha: 'drop' }), 'hello');
  assert.equal(Beaufort.encrypt({ text: 'akademeia', key: 'ＮＡＶＹ', upper: false }).output, 'nqvvjorqn');
  assert.equal(Norm.expandKey('NAVY', 5, {}, 'hello').expanded, 'NAVYN');
});
test('key positions include gaps and Unicode code points', () => {
  assert.equal(Norm.expandKey('NAVY', 11, {}, 'HELLO WORLD').expanded, 'NAVYN·AVYNA');
  assert.equal(Norm.expandKey('BC', 3, {}, 'A😀A').expanded, 'B·C');
  assert.equal(Beaufort.encrypt({ text: 'A😀A', key: 'BC', skipOnNonAlpha: false }).output, 'B😀B');
});
for (const upper of [true, false]) for (const nonAlpha of ['keep', 'drop', 'keepSpaces']) {
  for (const skipOnNonAlpha of [true, false]) test(`round trip ${upper}/${nonAlpha}/${skipOnNonAlpha}`, () => {
    const opts = { key: 'ＮａVＹ', upper, nonAlpha, skipOnNonAlpha };
    const text = 'Hello WORLD!　全角 ａｂ 😀 ß\nTab\t';
    const cipher = Beaufort.encrypt({ ...opts, text }).output;
    assert.equal(Beaufort.decrypt({ ...opts, text: cipher }).output, Norm.normalize(text, opts));
    const steps = [];
    Beaufort.encrypt({ ...opts, text, stepCb: s => steps.push(s) });
    assert.equal(steps.map(s => s.outCh).join(''), cipher);
    assert.equal(steps.length, Array.from(Norm.normalize(text, opts)).length);
  });
}
test('invalid and oversized inputs fail without truncation', () => {
  for (const key of ['', '日本語', 'ß']) assert.throws(() => Beaufort.encrypt({ text: 'ABC', key }), /invalidKey/);
  assert.throws(() => Beaufort.encrypt({ text: 'A'.repeat(10001), key: 'A' }), /inputTooLong/);
  assert.equal(Beaufort.encrypt({ text: 'A'.repeat(10000), key: 'A' }).output.length, 10000);
});
