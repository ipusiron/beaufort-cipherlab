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
    ['入力は各欄10,000文字まで。対応表と手順表は先頭300行、結果は全文です。',
      'Up to 10,000 characters per field. Alignment and step tables show the first 300 rows; results include the full text.'],
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
    document.documentElement.lang = language;
    document.querySelector('#languageToggle').textContent = t('language');
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
