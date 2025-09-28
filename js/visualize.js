// visualize.js - 26×26暗号表の描画とハイライト処理
(function (global) {
  // 26×26のビューフォート暗号表（Table B）を構築
  // 各行は前の行から1文字分左（逆方向）にシフト
  // - 0行目: ヘッダー行（列ヘッダー）
  // - 0列目: ヘッダー列（行ヘッダー）
  // - 行i、列jのセル = (i - j) mod 26
  function buildMatrix(container) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    const makeCell = (txt, cls = 'cell') => {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = txt;
      return div;
    };

    // 左上の空セル
    frag.appendChild(makeCell('', 'cell header-cell'));

    // 列ヘッダー A..Z（平文文字）
    for (let j = 0; j < 26; j++) {
      frag.appendChild(makeCell(String.fromCharCode(65 + j), 'cell header-cell'));
    }

    // 各行の構築
    for (let i = 0; i < 26; i++) {
      // 行ヘッダー（鍵文字）
      frag.appendChild(makeCell(String.fromCharCode(65 + i), 'cell row-head header-cell'));

      // 行のセル：ビューフォート暗号表 B
      // 行i（鍵）、列j（平文）のセル = (i - j) mod 26
      for (let j = 0; j < 26; j++) {
        const cipherValue = (i - j + 26) % 26;
        const val = String.fromCharCode(65 + cipherValue);
        const c = document.createElement('div');
        c.className = 'cell';
        c.dataset.row = i;
        c.dataset.col = j;
        c.textContent = val;
        frag.appendChild(c);
      }
    }

    container.appendChild(frag);
  }

  // すべてのハイライトをクリア
  function clearHighlights(container) {
    container.querySelectorAll('.hi-row').forEach(e => e.classList.remove('hi-row'));
    container.querySelectorAll('.hi-col').forEach(e => e.classList.remove('hi-col'));
    container.querySelectorAll('.hi-cell').forEach(e => e.classList.remove('hi-cell'));
  }

  // ビューフォート暗号に応じてハイライト
  // 暗号化: 行=K（鍵）、列=P（平文） → セル = C = (K - P) mod 26
  // 復号: 行=K（鍵）、列=C（暗号文） → セル = P = (K - C) mod 26
  // @param {HTMLElement} container - 表のコンテナー
  // @param {number} rowIndex - 行インデックス（鍵文字）
  // @param {number} colIndex - 列インデックス（平文/暗号文字）
  function highlight(container, { rowIndex, colIndex, cellIndex }) {
    const children = container.children;
    const rowStart = 27 + rowIndex * 27;

    // 行全体をハイライト（行ヘッダーを含む）
    for (let j = 0; j < 27; j++) {
      children[rowStart + j]?.classList.add('hi-row');
    }

    // 列全体をハイライト（列ヘッダーを含む）
    for (let r = 0; r < 27; r++) {
      const idx = r * 27 + (colIndex + 1);
      children[idx]?.classList.add('hi-col');
    }

    // 交点セルをハイライト
    const cellPos = rowStart + (colIndex + 1);
    children[cellPos]?.classList.add('hi-cell');
  }

  // セル内の文字を更新（オプション機能）
  function setCellLetter(container, letterAt, rowIndex, colIndex, letter) {
    const cellPos = 1 + (rowIndex + 1) * 27 + (colIndex + 1);
    const div = container.children[cellPos];
    if (div) div.textContent = letter;
  }

  // ステップテーブルに行を追加
  // @param {HTMLElement} tbody - テーブルのtbody要素
  // @param {Array<string>} cells - セルのテキスト配列
  function addStepRow(tbody, cells) {
    const tr = document.createElement('tr');
    cells.forEach((txt) => {
      const td = document.createElement('td');
      td.textContent = txt;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);

    // 自動スクロール（最下部へ）
    const wrap = tbody.closest('.table-wrap');
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }

  global.Viz = { buildMatrix, clearHighlights, highlight, setCellLetter, addStepRow };
})(window);
