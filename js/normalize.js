// normalize.js - テキスト正規化とアルファベット変換ユーティリティー
(function (global) {
  const A_CODE = 'A'.charCodeAt(0);
  const Z_CODE = 'Z'.charCodeAt(0);

  // 1文字がアルファベット（A-Z, a-z）かどうかを判定
  function isAlpha(ch) {
    if (!ch || ch.length !== 1) return false;
    const c = ch.toUpperCase().charCodeAt(0);
    return c >= A_CODE && c <= Z_CODE;
  }

  // 全角英字を半角に変換し、大文字化
  function toUpperAscii(s) {
    return (s || "").toUpperCase().replace(/[Ａ-Ｚａ-ｚ]/g, (m) =>
      String.fromCharCode(m.charCodeAt(0) - 65248)
    );
  }

  // テキストを正規化（大文字化、非英字の処理）
  // @param {string} text - 入力テキスト
  // @param {boolean} upper - 大文字化するかどうか
  // @param {string} nonAlpha - 非英字の扱い（'keep': 保持、'drop': 除去、'keepSpaces': 空白のみ保持）
  function normalize(text, { upper = true, nonAlpha = 'keep' } = {}) {
    let t = text || "";
    if (upper) t = toUpperAscii(t);
    switch (nonAlpha) {
      case 'drop':
        t = t.replace(/[^A-Z]/g, '');
        break;
      case 'keepSpaces':
        t = t.split('').filter(ch => isAlpha(ch) || ch === ' ').join('');
        break;
      case 'keep':
      default:
        break;
    }
    return t;
  }

  // アルファベット文字をインデックス（0-25）に変換
  function idx(ch) {
    return ch.toUpperCase().charCodeAt(0) - A_CODE;
  }

  // インデックス（0-25）をアルファベット文字に変換
  function chr(i) {
    return String.fromCharCode(A_CODE + ((i % 26 + 26) % 26));
  }

  // 正の剰余を計算（負の数にも対応）
  function mod(x, m = 26) {
    return ((x % m) + m) % m;
  }

  // 鍵キーワードを指定長に展開
  // @param {string} keyword - 鍵キーワード
  // @param {number} length - 展開する長さ
  // @param {boolean} skipOnNonAlpha - 非英字で鍵を進めないか
  // @param {string} drivingText - 鍵の進行を制御する参照テキスト（平文など）
  // @returns {object} { expanded: 展開された鍵文字列, key: 正規化された鍵, len: 長さ }
  function expandKey(keyword, length, { skipOnNonAlpha = true } = {}, drivingText = "") {
    const key = (keyword || "").toUpperCase().replace(/[^A-Z]/g, '');
    let ki = 0;
    const expanded = [];
    for (let i = 0; i < length; i++) {
      const ch = drivingText ? drivingText[i] : 'A';
      if (skipOnNonAlpha && drivingText && !/[A-Z]/.test(ch)) {
        expanded.push('·');
        continue;
      }
      if (key.length === 0) {
        expanded.push('·');
        continue;
      }
      expanded.push(key[ki % key.length]);
      ki++;
    }
    return { expanded: expanded.join(''), key, len: length };
  }

  global.Norm = { isAlpha, toUpperAscii, normalize, idx, chr, mod, expandKey };
})(window);
