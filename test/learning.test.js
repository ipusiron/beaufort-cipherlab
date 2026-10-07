const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const scope = vm.createContext({}); scope.window = scope;
for (const name of ['normalize', 'beaufort', 'learning']) vm.runInContext(fs.readFileSync(path.join(__dirname, `../js/${name}.js`), 'utf8'), scope);
const { Learning, Norm, Beaufort } = scope;
test('normalization preview reports overlapping conversions and code-point removal', () => {
  const p = Learning.preview('Ａb c!🙂', 'ＢＣ', { upper: true, nonAlpha: 'drop' });
  assert.equal(p.normalized, 'ABC'); assert.equal(p.key, 'BC');
  assert.equal(p.width, 1); assert.equal(p.upper, 2); assert.equal(p.removed, 3); assert.equal(p.count, 3);
  assert.equal(Learning.preview('ａ', 'A').upper, 1);
  assert.equal(Learning.preview('ａ', 'A').width, 1);
});
test('preview matches cipher input for every setting combination', () => {
  for (const upper of [true,false]) for (const nonAlpha of ['keep','drop','keepSpaces']) for (const skipOnNonAlpha of [true,false]) {
    const opts = { text:'Ａb c\n\t🙂ßZ',key:'ＢＣ',upper,nonAlpha,skipOnNonAlpha };
    const p = Learning.preview(opts.text, opts.key, opts);
    const enc = Beaufort.encrypt(opts);
    assert.equal(p.normalized, enc.input);
    const actual = Beaufort.decrypt({ ...opts, text: enc.output }).output;
    assert.equal(Learning.compare(p.normalized, actual).equal, true);
  }
});
test('preview limits each input without truncation', () => {
  assert.equal(Learning.preview('🙂'.repeat(10000), 'A').count, 10000);
  for (const [text,key] of [['A'.repeat(10001),'B'],['A','B'.repeat(10001)]]) assert.throws(() => Learning.preview(text,key), /inputTooLong/);
  assert.equal(Learning.preview('', '').count, 0);
});
test('trace windows include boundary positions with no more than 300 rows', () => {
  for (const [done, start] of [[0,0],[1,0],[299,0],[300,0],[301,300],[600,300],[601,600],[10000,9900]]) {
    const w = Learning.windowFor(done);
    assert.equal(w.start, start); assert.equal(w.end, done); assert.ok(w.end-w.start <= 300);
  }
});
test('comparison handles code points, insertion, deletion, empty and surrounding context', () => {
  assert.equal(Learning.compare('', '').equal, true);
  for (const [a,b,pos,expected,actual] of [['A🙂Z','A🙂X',3,'Z','X'],['AB','A',2,'B',null],['A','AB',2,null,'B'],['','A',1,null,'A'],['AB C','AB\nC',3,' ','\n']]) {
    const diff = Learning.compare(a,b);
    assert.equal(diff.equal,false); assert.equal(diff.position,pos);
    assert.equal(diff.expected.at,expected); assert.equal(diff.actual.at,actual);
  }
  const diff = Learning.compare('0123456789Xabcdefghij','0123456789Yabcdefghij');
  assert.equal(diff.expected.before,'23456789'); assert.equal(diff.expected.after,'abcdefgh');
});
test('samples use published or independently calculated expected values', () => {
  assert.equal(Learning.samples.length,3);
  for (const sample of Learning.samples) {
    const result = Beaufort.encrypt(sample);
    assert.equal(result.output,sample.expected,sample.id);
    assert.equal(Beaufort.decrypt({...sample,text:result.output}).output,Norm.normalize(sample.text,sample));
  }
});
test('mismatched keys and key advancement produce a first difference', () => {
  const text = 'A A', key = 'BC';
  const encrypted = Beaufort.encrypt({text,key}).output;
  for (const opts of [{key:'ZZ'}, {key,skipOnNonAlpha:false}]) {
    assert.equal(Learning.compare(text,Beaufort.decrypt({text:encrypted,...opts}).output).equal,false);
  }
});
