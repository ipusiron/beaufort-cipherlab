// Pure helpers for normalization previews, trace windows and comparisons.
(function (global) {
  const LIMIT = 10000;
  const PAGE_SIZE = 300;
  function preview(text, key, opts = {}) {
    const original = Array.from(text);
    if (original.length > LIMIT || Array.from(key).length > LIMIT) throw new Error('inputTooLong');
    const normalized = Norm.normalize(text, opts);
    const width = original.filter(ch => Norm.toAscii(ch) !== ch).length;
    const upper = opts.upper === false ? 0 : original.filter(ch => /^[a-z]$/.test(Norm.toAscii(ch))).length;
    const removed = original.length - Array.from(normalized).length;
    return { original: text, normalized, key: Norm.normalizeKey(key), width, upper, removed,
      count: Array.from(normalized).length, changed: text !== normalized };
  }
  function windowFor(done) {
    const start = done ? Math.floor((done - 1) / PAGE_SIZE) * PAGE_SIZE : 0;
    return { start, end: done };
  }
  function compare(expected, actual) {
    const a = Array.from(expected), b = Array.from(actual);
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (i === a.length && i === b.length) return { equal: true, count: a.length };
    const context = chars => ({ before: chars.slice(Math.max(0, i - 8), i).join(''),
      at: chars[i] ?? null, after: chars.slice(i + 1, i + 9).join('') });
    return { equal: false, position: i + 1, expected: context(a), actual: context(b) };
  }
  function displayTokens(text) {
    const names = { ' ': 'space', '\n': 'lineBreak', '\r': 'carriageReturn', '\t': 'tabChar', '\u00a0': 'noBreakSpace', '\u3000': 'wideSpace' };
    return Array.from(text, ch => {
      const code = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      if (names[ch]) return { kind: names[ch], code };
      if (/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(ch)) return { kind: 'controlChar', code };
      return { kind: 'text', text: ch };
    });
  }
  const samples = [
    { id: 'aca', text: 'CEQUALSKMINUSP', key: 'RECIPROCAL', upper: true, nonAlpha: 'keep', skipOnNonAlpha: true, expected: 'PAMOPGWSODEKKT' },
    { id: 'wrap', text: 'Z A', key: 'BC', upper: true, nonAlpha: 'keep', skipOnNonAlpha: true, expected: 'C C' },
    { id: 'normalize', text: 'Ａb c!🙂', key: 'ＢＣ', upper: true, nonAlpha: 'drop', skipOnNonAlpha: true, expected: 'BBZ' }
  ];
  global.Learning = { preview, windowFor, compare, displayTokens, samples, PAGE_SIZE };
})(window);
