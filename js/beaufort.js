// beaufort.js - ビューフォート暗号（純正版）の実装
(function (global) {

  // 1文字の暗号化を実行（Pure Beaufort Cipher）
  // C = (K - P) mod 26
  // @param {string} Pch - 平文文字
  // @param {string} Kch - 鍵文字
  // @returns {object} { out: 暗号文字, formula: 数式, numeric: 数値計算式, raw: 生データ }
  function stepEncryptChar(Pch, Kch) {
    const { idx, chr, mod, isAlpha } = Norm;
    if (!isAlpha(Pch)) return { out: Pch, formula: '', numeric: '', raw: null };
    if (!isAlpha(Kch)) return { out: Pch, formula: '', numeric: '', raw: null };

    const p = idx(Pch);
    const k = idx(Kch);
    const cVal = Norm.mod(k - p, 26);
    const formula = 'C = (K − P) mod 26';
    const numeric = `(${k} − ${p}) mod 26 = ${cVal}`;

    return { out: Norm.chr(cVal), formula, numeric, raw: { p, k, c: cVal } };
  }

  // 1文字の復号を実行（Pure Beaufort Cipher）
  // P = (K - C) mod 26
  // @param {string} Cch - 暗号文字
  // @param {string} Kch - 鍵文字
  // @returns {object} { out: 平文文字, formula: 数式, numeric: 数値計算式, raw: 生データ }
  function stepDecryptChar(Cch, Kch) {
    const { idx, chr, mod, isAlpha } = Norm;
    if (!isAlpha(Cch)) return { out: Cch, formula: '', numeric: '', raw: null };
    if (!isAlpha(Kch)) return { out: Cch, formula: '', numeric: '', raw: null };

    const c = idx(Cch);
    const k = idx(Kch);
    const pVal = Norm.mod(k - c, 26);
    const formula = 'P = (K − C) mod 26';
    const numeric = `(${k} − ${c}) mod 26 = ${pVal}`;

    return { out: Norm.chr(pVal), formula, numeric, raw: { p: pVal, k, c } };
  }

  // テキスト全体を処理（暗号化または復号）
  // @param {string} text - 入力テキスト（平文または暗号文）
  // @param {string} key - 鍵
  // @param {string} nonAlpha - 非英字の扱い
  // @param {boolean} upper - 大文字化
  // @param {boolean} skipOnNonAlpha - 非英字で鍵を進めないか
  // @param {boolean} forDecrypt - 復号モードかどうか
  // @param {function} stepCb - 各ステップのコールバック関数
  // @returns {object} { input: 正規化された入力, output: 出力 }
  function processText({ text, key, nonAlpha = 'keep', upper = true, skipOnNonAlpha = true, forDecrypt = false, stepCb }) {
    const inText = Norm.normalize(text, { upper, nonAlpha });
    const keyNorm = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyNorm.length) throw new Error('鍵に英字が含まれていません。');

    const driving = inText;
    const EXP = Norm.expandKey(keyNorm, inText.length, { skipOnNonAlpha }, driving);

    let out = '';
    let kIdx = 0;
    for (let i = 0; i < inText.length; i++) {
      const ch = inText[i];
      let kch = '·';

      if (Norm.isAlpha(ch)) {
        kch = keyNorm[kIdx % keyNorm.length];
        kIdx++;
      } else if (!skipOnNonAlpha) {
        kch = keyNorm[kIdx % keyNorm.length];
        kIdx++;
      }

      let step;
      if (forDecrypt) step = stepDecryptChar(ch, kch);
      else step = stepEncryptChar(ch, kch);

      out += step.out;

      if (typeof stepCb === 'function') {
        stepCb({
          i,
          inCh: ch,
          keyCh: /[A-Z]/.test(kch) ? kch : '',
          outCh: step.out,
          formula: step.formula,
          numeric: step.numeric,
          raw: step.raw
        });
      }
    }

    return { input: inText, output: out };
  }

  // 暗号化の公開API
  function encrypt(opts) {
    return processText({ ...opts, forDecrypt: false });
  }

  // 復号の公開API
  function decrypt(opts) {
    return processText({ ...opts, forDecrypt: true });
  }

  global.Beaufort = { encrypt, decrypt, stepEncryptChar, stepDecryptChar };
})(window);
