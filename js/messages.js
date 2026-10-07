(function (global) {
  const text = [
    ['Beaufort CipherLab - ビューフォート暗号ツール', 'Beaufort CipherLab - Beaufort Cipher Learning Tool'],
    ['ビューフォート暗号（純正版）を学習・体験できるインタラクティブツール', 'Explore the Beaufort cipher through letters, keys, and calculations'],
    ['⌨️ キーボードショートカット', '⌨️ Keyboard shortcuts'],
    ['一括実行（暗号化/復号）', 'Process all text (encrypt/decrypt)'],
    ['アニメーションの再生/一時停止', 'Play/pause animation'],
    ['次の1文字を処理', 'Process the next character'],
    ['リセット', 'Reset'], ['鍵生成', 'Key expansion'], ['暗号化', 'Encrypt'], ['復号', 'Decrypt'], ['座学', 'Learn'],
    ['鍵キーワード', 'Keyword'], ['平文（長さ参照用）', 'Plaintext (for alignment)'],
    ['平文長に合わせて繰り返し展開', 'Repeat the keyword to match the text'],
    ['非英字で鍵を進めない', 'Do not advance the key for non-letters'],
    ['大文字化', 'Convert to uppercase'], ['非英字の扱い', 'Non-letter handling'],
    ['保持', 'Keep'], ['除去', 'Remove'], ['空白のみ保持', 'Keep ASCII spaces only'],
    ['鍵文字列に拡張', 'Expand key'], ['コピー', 'Copy'], ['クリア', 'Clear'], ['鍵文字列', 'Expanded key'],
    ['位置対応テーブル（Index / Plain / Key）', 'Alignment table (Index / Plain / Key)'],
    ['平文', 'Plaintext'], ['鍵（鍵文字列）', 'Key (keyword or expanded key)'], ['🔄 同期', '🔄 Sync'],
    ['→ 次の1文字', '→ Next character'], ['▶ アニメーション', '▶ Animate'],
    ['🐌 遅い', '🐌 Slow'], ['🐾 通常', '🐾 Normal'], ['🐇 速い', '🐇 Fast'],
    ['⟲ リセット', '⟲ Reset'], ['⏩ すべて暗号化', '⏩ Encrypt all'], ['暗号文', 'Ciphertext'],
    ['26×26 表（行と列をハイライト）', '26×26 table (highlighted row and column)'],
    ['ステップテーブル', 'Step table'], ['式', 'Formula'], ['数値', 'Calculation'], ['⏩ すべて復号', '⏩ Decrypt all'],
    ['📚 ビューフォート暗号とは', '📚 About the Beaufort cipher'],
    ['ビューフォート暗号は、多表式の古典暗号です。同じ鍵と設定なら、暗号化と復号に同じ計算を使えます。',
      'The Beaufort cipher is a classical polyalphabetic cipher. With the same key and settings, encryption and decryption use the same calculation.'],
    ['🔢 数式', '🔢 Formulas'], ['暗号化:', 'Encryption:'], ['復号:', 'Decryption:'],
    ['🔍 例題で理解', '🔍 Worked example'], ['平文:', 'Plaintext:'], ['鍵:', 'Key:'], ['計算:', 'Calculation:'], ['暗号文:', 'Ciphertext:'],
    ['⚖️ ヴィジュネル暗号との比較', '⚖️ Comparison with Vigenère'], ['ヴィジュネル暗号', 'Vigenère cipher'],
    ['加算ベース、', 'Addition: '], ['暗号化と復号で異なる操作', 'different operations for encryption and decryption'],
    ['ビューフォート暗号', 'Beaufort cipher'], ['減算ベース、', 'Subtraction: '], ['暗号化と復号が同一操作', 'the same operation for encryption and decryption'],
    ['⚠️ 弱点', '⚠️ Limitations'], ['頻度分析やカシスキー法で解析可能', 'Repeating keys can be attacked using frequency analysis and the Kasiski method'],
    ['現代の暗号としては不十分（教育目的のみ）', 'For education only; not suitable for protecting secrets'],
    ['詳細な歴史や追加情報は', 'See '], ['をご参照ください。', ' for history and further information.'],
    ['🔗 GitHubリポジトリー（', '🔗 GitHub repository ('], ['）', ')'],
    ['例: NAVY', 'Example: NAVY'], ['展開長の参考に使います（未入力でもOK）', 'Used for alignment; may be left empty'],
    ['鍵生成タブの鍵文字列を取得', 'Use the expanded key from Key expansion'],
    ['暗号化タブの暗号文を取得', 'Use the result from Encrypt'],
    ['入力は各欄10,000文字まで。鍵の対応表は先頭300行、手順表は300行ごとに表示します。結果は全文です。',
      'Up to 10,000 characters per field. Key alignment shows the first 300 rows; step tables use 300-row pages. Results include the full text.'],
    ['全角英字は半角に変換します。大文字化OFFでは英字の大小を保ちます。非英字は暗号化しません。',
      'Fullwidth Latin letters are converted to ASCII. With uppercase conversion off, letter case is preserved. Non-letters are not encrypted.'],
    ['入力や設定を変えると結果と進行を消します。同期するのは欄の文字列だけで、設定は移しません。',
      'Changing input or settings clears the result and progress. Sync copies only the field text, not its settings.'],
    ['表は枠の中を縦横にスクロールできます。選んだ文字と計算は手順表でも確認できます。',
      'Scroll within the table in either direction. The step table also lists the selected letters and calculations.'],
    ['安全な通信や秘密の保管には使えません。鍵と文章は送信せず、このページ内で処理します。',
      'Do not use this cipher for secure communication or secret storage. Keys and text are processed on this page without being sent.'],
    ['Main Tabs', 'Main Tabs'], ['Toggle theme', 'Toggle theme'], ['Show keyboard shortcuts', 'Show keyboard shortcuts'], ['Close', 'Close']
  ];
  const dynamic = {
    preview: ['処理前の確認（正規化）', 'Input preview (normalization)'],
    normalized: ['実際に処理する文字列', 'Text used for processing'],
    normalizedKey: ['実際に使う鍵', 'Key used for processing'],
    normalizationCounts: ['処理対象 {count}文字／全角英字→半角 {width}文字／小文字→大文字 {upper}文字／除去 {removed}文字', 'Processed text: {count} characters / width conversions: {width} / uppercase conversions: {upper} / removed: {removed}'],
    normalizationNote: ['変換数は重複します。変換・除去した文字は、復号しても原文の表記には戻りません。空白・改行も文字数に含みます。', 'Conversion counts may overlap. Decryption does not restore original spelling or removed characters. Spaces and line breaks count as characters.'],
    back: ['← 1文字戻る', '← Previous character'],
    first: ['先頭へ戻る', 'Go to start'],
    jumpLabel: ['処理済み文字数（0＝先頭）', 'Processed characters (0 = start)'],
    jump: ['指定位置へ移動', 'Go to position'],
    invalidPosition: ['0から{total}までの整数を指定してください', 'Enter an integer from 0 to {total}.'],
    pagePrev: ['前の300行', 'Previous 300 rows'],
    pageNext: ['次の300行', 'Next 300 rows'],
    rows: ['表示行: {start}–{end}／処理済み {done}文字', 'Rows: {start}–{end} / {done} characters processed'],
    noRows: ['処理済みの行はありません', 'No processed rows yet.'],
    roundTrip: ['同じ鍵・設定で復号して照合', 'Decrypt with the same key/settings and compare'],
    roundTripNote: ['暗号化を最後まで実行し、復号タブの入力・鍵・設定を置き換えます。照合対象は正規化後の平文です。一致しても安全性や改ざんがないことの証明にはなりません。', 'Processes all plaintext and replaces the Decrypt input, key and settings. Comparison uses normalized plaintext. A match does not prove security or the absence of tampering.'],
    comparison: ['暗号化前との照合', 'Comparison with the encryption input'],
    original: ['入力原文', 'Original input'],
    expected: ['正規化後の平文（比較対象）', 'Normalized plaintext (expected)'],
    actual: ['復号結果', 'Decrypted text'],
    match: ['一致: 正規化後の平文 {count}文字に戻りました', 'Match: recovered all {count} characters of normalized plaintext.'],
    mismatch: ['不一致: 最初の相違は{position}文字目です（コードポイント単位）', 'Mismatch: first difference at character {position} (counted by code point).'],
    pending: ['復号を最後まで実行すると照合できます', 'Complete decryption to compare.'],
    noComparison: ['暗号化タブの「同じ鍵・設定で復号して照合」から開始してください', 'Start with “Decrypt with the same key/settings and compare” in Encrypt.'],
    contextExpected: ['比較対象の前後', 'Expected context'],
    contextActual: ['復号結果の前後', 'Decrypted context'],
    endOfText: ['〈末尾〉', '<end of text>'],
    samples: ['学習用サンプル（平文・鍵・設定を置換）', 'Learning samples (replace plaintext, key and settings)'],
    sample_aca: ['基本例（ACA）', 'Basic example (ACA)'],
    sample_wrap: ['折り返しと空白', 'Wraparound and spaces'],
    sample_normalize: ['全角・小文字・記号', 'Fullwidth, lowercase and symbols'],
    sampleHint_aca: ['ACAの既知例。暗号文は PAMOPGWSODEKKT です。', 'ACA known-answer example. Expected ciphertext: PAMOPGWSODEKKT.'],
    sampleHint_wrap: ['Zと鍵Bは (1−25) mod 26 = 2 → C。空白で鍵を進める設定も試せます。', 'Z with key B gives (1−25) mod 26 = 2 → C. Try advancing the key at spaces too.'],
    sampleHint_normalize: ['処理対象は ABC、鍵は BC、暗号文は BBZ。除去と大文字化の設定を変えて比較できます。', 'Processed text: ABC; key: BC; ciphertext: BBZ. Compare different removal and uppercase settings.'],
    sampleSource: ['ACAの出典', 'ACA source'],
    invalidKey: ['鍵に英字が含まれていません', 'The key contains no Latin letters.'],
    inputTooLong: ['入力は各欄10,000文字以内にしてください', 'Limit each field to 10,000 characters.'],
    expanded: ['鍵文字列に展開しました', 'Key expanded.'],
    needKey: ['鍵生成タブで鍵文字列を生成してください', 'Expand a key in the Key expansion tab first.'],
    syncedKey: ['鍵文字列を同期', 'Key copied across.'],
    needCipher: ['暗号化タブで暗号文を生成してください', 'Encrypt text in the Encrypt tab first.'],
    syncedCipher: ['暗号文を同期', 'Ciphertext copied across.'],
    pause: ['一時停止 ⏸', 'Pause ⏸'], play: ['▶ アニメーション', '▶ Animate'],
    copied: ['コピーしました', 'Copied.'],
    copyFailed: ['コピーできません。結果欄を選択して手動でコピーしてください', 'Copy failed. Select the result and copy it manually.'],
    encrypted: ['暗号化完了 ({seconds}秒)', 'Encryption complete ({seconds} s).'],
    decrypted: ['復号完了 ({seconds}秒)', 'Decryption complete ({seconds} s).'],
    progress: ['進行状況: {done} / {total} 文字 ({percent}%)', 'Progress: {done} / {total} characters ({percent}%)'],
    themeLight: ['☀ ライトに切替', '☀ Light mode'], themeDark: ['☾ ダークに切替', '☾ Dark mode'],
    matrixEnc: ['暗号表。行は鍵、列は平文、交点は暗号文', 'Cipher table: key row, plaintext column, ciphertext intersection'],
    matrixDec: ['暗号表。行は鍵、列は暗号文、交点は平文', 'Cipher table: key row, ciphertext column, plaintext intersection'],
    speed: ['再生速度', 'Animation speed'],
    language: ['English', '日本語'],
    readmeFile: ['README.md', 'README.en.md'],
    tabs: ['メインタブ', 'Main tabs'], help: ['キーボードショートカット', 'Keyboard shortcuts'], close: ['閉じる', 'Close']
  };
  let language = document.documentElement.lang;
  const nodes = [], attrs = [];
  function t(key, values = {}) {
    return dynamic[key][language === 'ja' ? 0 : 1].replace(/\{(\w+)\}/g, (_, name) => values[name]);
  }
  function apply() {
    const column = language === 'ja' ? 0 : 1;
    for (const [node, pair] of nodes) node.textContent = pair[column];
    for (const [element, attribute, pair] of attrs) element.setAttribute(attribute, pair[column]);
    for (const element of document.querySelectorAll('[data-message]')) element.textContent = t(element.dataset.message);
    document.documentElement.lang = language;
    document.querySelector('#languageToggle').textContent = t('language');
    const readmeLink = document.querySelector('#readmeLink');
    readmeLink.textContent = t('readmeFile');
    readmeLink.href = 'https://github.com/ipusiron/beaufort-cipherlab/blob/main/' + t('readmeFile');
    document.dispatchEvent(new Event('languagechange'));
  }
  function init() {
    const byJapanese = new Map(text.map(pair => [pair[0], pair]));
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const pair = byJapanese.get(node.textContent.trim());
      if (pair) nodes.push([node, pair]);
    }
    for (const element of document.querySelectorAll('[placeholder], [title]')) {
      for (const attribute of ['placeholder', 'title']) {
        const pair = byJapanese.get(element.getAttribute(attribute));
        if (pair) attrs.push([element, attribute, pair]);
      }
    }
    document.querySelector('#languageToggle').addEventListener('click', () => {
      language = language === 'ja' ? 'en' : 'ja';
      try { localStorage.setItem('beaufort.language', language); } catch { /* optional */ }
      apply();
    });
    apply();
  }
  global.Messages = { t, init, text, dynamic };
})(window);
