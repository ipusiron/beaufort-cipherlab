const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ja = read('README.md'), en = read('README.en.md');
const ctx = vm.createContext({}); ctx.window = ctx;
for (const name of ['normalize','beaufort']) vm.runInContext(read(`js/${name}.js`), ctx);
const headings = text => [...text.matchAll(/^(#{1,6}) (.+)$/gm)].map(m => [m[1].length, m[2]]);
const correspondence = [
  ['Beaufort CipherLab - ビューフォート暗号ツール','Beaufort CipherLab - Beaufort Cipher Learning Tool'],
  ['🌐 デモページ','🌐 Demo'], ['📸 スクリーンショット','📸 Screenshots'],
  ['🔐 ビューフォート暗号','🔐 The Beaufort cipher'], ['歴史的背景','Historical background'],
  ['ビューフォート vs. ボーフォート','Japanese spellings of Beaufort'],
  ['⚙️ ビューフォート暗号の仕組み','⚙️ How the Beaufort cipher works'],
  ['表Aを使った説明','Using Table A'], ['表Bを使った説明','Using Table B'],
  ['ヴィジュネル暗号表（参考）','Vigenère table (reference)'], ['数式のみ','Formulas'],
  ['🔢 多表式暗号とビューフォート暗号','🔢 Polyalphabetic substitution and Beaufort'],
  ['📐 ビューフォート暗号の数式','📐 Beaufort formulas'],
  ['ヴィジュネル暗号とビューフォート暗号','Vigenère and Beaufort'],
  ['ヴィジュネル暗号の特徴','Vigenère characteristics'], ['ビューフォート暗号の特徴','Beaufort characteristics'],
  ['実用面での差異','Practical differences'], ['🖥️ 画面構成（タブ）','🖥️ Interface tabs'],
  ['📋 仕様詳細','📋 Detailed specifications'], ['共通仕様','Common behavior'],
  ['可視化','Visualization'], ['UI/UX','UI/UX'], ['🎓 教育的ポイント','🎓 Learning points'],
  ['活用例','Use cases'], ['検算用の例','Known-answer examples'], ['🔒 安全性と限界','🔒 Security and limitations'],
  ['📚 学術的根拠','📚 References'], ['🔗 関連資料','🔗 Related resources'],
  ['📁 ディレクトリー構造','📁 Directory structure'], ['💻 動作環境とテスト','💻 Running and testing'],
  ['📄 ライセンス','📄 License'], ['🛠️ このツールについて','🛠️ About this tool']
];
test('complete heading correspondence and identical hierarchy', () => {
  assert.deepEqual(headings(ja).map(h => h[1]), correspondence.map(p => p[0]));
  assert.deepEqual(headings(en).map(h => h[1]), correspondence.map(p => p[1]));
  assert.deepEqual(headings(ja).map(h => h[0]), headings(en).map(h => h[0]));
});
for (const [name, doc] of [['ja',ja],['en',en]]) {
  test(`${name}: table A, B and Vigenere every cell`, () => {
    const tables = doc.match(/^\|[^\n]*\n(?:\|[^\n]*\n)+/gm);
    assert.ok(tables.length >= 5);
    const a = tables[0].trim().split('\n');
    const aRows = [a[0], ...a.slice(2)];
    assert.equal(aRows.length, 27);
    for (let row = 0; row < 27; row++) {
      const cells = aRows[row].split('|').slice(1,-1).map(s => s.trim());
      assert.equal(cells.length, 27);
      for (let col = 0; col < 27; col++) assert.equal(cells[col], String.fromCharCode(65+(row+col)%26));
    }
    for (const index of [1,2]) {
      const rows = tables[index].trim().split('\n').slice(2);
      assert.equal(rows.length, 26);
      for (let k = 0; k < 26; k++) {
        const cells = rows[k].split('|').slice(2,-1).map(s=>s.trim());
        assert.equal(cells.length, 26);
        for (let p = 0; p < 26; p++) {
          const expected = String.fromCharCode(65+((index===1?k-p:k+p)+26)%26);
          assert.equal(cells[p], expected, `${name} table ${index} ${k},${p}`);
        }
      }
    }
  });
  test(`${name}: documented vectors execute correctly`, () => {
    const rows = doc.match(/^\|[^\n]*\n(?:\|[^\n]*\n)+/gm).at(-1).trim().split('\n').slice(2);
    assert.equal(rows.length, 5);
    for (const row of rows) {
      const [text,key,expected] = row.split('|').slice(1,-1).map(s=>s.trim());
      assert.equal(ctx.Beaufort.encrypt({text,key,nonAlpha:'drop'}).output, expected);
    }
    assert.ok(doc.includes(ctx.Norm.expandKey('PACIFIC',20).expanded));
  });
  test(`${name}: local links and screenshot files exist`, () => {
    const images = [...doc.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]).filter(s=>!s.startsWith('http'));
    assert.equal(images.length, 3);
    for (const [,link] of doc.matchAll(/\]\(([^)]+)\)/g)) {
      if (!/^https?:|^#/.test(link)) assert.ok(fs.existsSync(path.join(root, link)), link);
    }
  });
}
test('language links, table values, sources and image inventory match', () => {
  assert.ok(ja.includes('[English](README.en.md)'));
  assert.ok(en.startsWith('English · [日本語](README.md)'));
  assert.deepEqual(ja.match(/^\|.*$/gm).slice(0,84), en.match(/^\|.*$/gm).slice(0,84));
  const urls = doc => [...new Set([...doc.matchAll(/\]\((https?:[^)]+)\)/g)].map(m=>m[1].replace('?lang=en','')))].sort();
  assert.deepEqual(urls(ja), urls(en));
  for (const file of fs.readdirSync(path.join(root,'assets'))) {
    if (file.endsWith('.png')) assert.ok(ja.includes(`assets/${file}`));
  }
  assert.ok(ja.startsWith('<!--\n---\nid: day078\nslug: beaufort-cipherlab'));
});

test('ユースケースの「このツールならではの使い方」を beaufort.js で再計算（日英）', () => {
  const scope = vm.createContext({});
  scope.window = scope;
  for (const name of ['normalize', 'beaufort']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), scope);
  }
  const B = scope.Beaufort;
  assert.equal(B.encrypt({ text: 'HELLO', key: 'KEY' }).output, 'DANZQ');
  assert.equal(B.encrypt({ text: 'DANZQ', key: 'KEY' }).output, 'HELLO');
  let allMatch = true;
  for (let p = 0; p < 26; p++) for (let k = 0; k < 26; k++) {
    const c = B.encrypt({ text: String.fromCharCode(65 + p), key: String.fromCharCode(65 + k) }).output;
    if (c !== String.fromCharCode(65 + (k - p + 26) % 26)) allMatch = false;
  }
  assert.ok(allMatch);
  for (const md of [ja, en]) {
    assert.ok(md.includes('DANZQ') && md.includes('676'));
  }
});
