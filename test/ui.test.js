const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('translation entries have both languages and no duplicate source strings', () => {
  const scope = vm.createContext({ document: { documentElement: { lang: 'en' } } });
  scope.window = scope;
  vm.runInContext(read('js/messages.js'), scope);
  const { text, dynamic } = scope.Messages;
  assert.equal(new Set(text.map(pair => pair[0])).size, text.length);
  for (const pair of [...text, ...Object.values(dynamic)]) {
    assert.equal(pair.length, 2);
    assert.ok(pair.every(s => typeof s === 'string' && s.length));
    assert.deepEqual(pair[0].match(/\{\w+\}/g) || [], pair[1].match(/\{\w+\}/g) || []);
  }
  const translated = new Set(text.map(pair => pair[0]));
  const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
  for (const part of html.split(/<[^>]+>/).map(s => s.trim()).filter(s => /[ぁ-んァ-ヶ一-龯]/u.test(s))) {
    assert.ok(translated.has(part), 'Missing translation: ' + part);
  }
});
test('CSP prohibits network and inline code; assets are local', () => {
  const html = read('index.html');
  for (const directive of ["connect-src 'none'", "object-src 'none'", "script-src 'self'", "style-src 'self'"]) assert.ok(html.includes(directive));
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval|X-Frame-Options|X-Content-Type-Options|\sstyle=|\son\w+=/);
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    assert.doesNotMatch(src, /^https?:/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', src)));
  }
});
test('inputs have visible labels or explicit names', () => {
  const html = read('index.html');
  for (const id of ['kgKeyword','kgPlain','kgExpanded','encPlain','encKey','encCipher','decCipher','decKey','decPlain']) {
    assert.ok(html.includes(`for="${id}"`), id);
  }
});
test('app user-facing Japanese is centralized in messages', () => {
  const app = read('js/app.js').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(app, /[ぁ-んァ-ヶ一-龯]/u);
});
