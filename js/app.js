// app.js - メインアプリケーションロジック（タブ切替、イベント管理、暗号化/復号処理）
(function () {
  // DOM操作のショートカット
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ===== テーマ切替 =====
  const themeToggle = $('#themeToggle');
  const themeLabel = $('.theme-label');
  const storedTheme = localStorage.getItem('beaufort.theme');
  const isDark = storedTheme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    themeLabel.textContent = 'Light';
  }
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    themeLabel.textContent = isDark ? 'Light' : 'Dark';
    localStorage.setItem('beaufort.theme', isDark ? 'dark' : 'light');
  });

  // ===== ヘルプモーダル（キーボードショートカット）=====
  const helpToggle = $('#helpToggle');
  const helpModal = $('#helpModal');
  const helpClose = $('#helpClose');
  helpToggle?.addEventListener('click', () => {
    helpModal.style.display = 'flex';
  });
  helpClose?.addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
  helpModal?.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.style.display = 'none';
  });

  // ===== タブ切替 =====
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.tab;
      $$('.panel').forEach(p => p.classList.remove('active'));
      $('#' + id)?.classList.add('active');
    });
  });

  // ===== 鍵生成タブ =====
  const kg = {
    keyword: $('#kgKeyword'),
    plain: $('#kgPlain'),
    repeat: $('#kgRepeat'),
    skipNonAlpha: $('#kgSkipNonAlpha'),
    upper: $('#kgUpper'),
    nonAlpha: $('#kgNonAlpha'),
    showVig: $('#kgShowVig'),
    expandBtn: $('#kgExpandBtn'),
    copyBtn: $('#kgCopyBtn'),
    clearBtn: $('#kgClearBtn'),
    expanded: $('#kgExpanded'),
    table: $('#kgTable tbody')
  };

  // 鍵文字列に展開ボタン
  kg.expandBtn.addEventListener('click', () => {
    const keyword = kg.keyword.value;
    if (!/[A-Za-z]/.test(keyword)) {
      Toast.show('鍵キーワードに英字がありません');
      return;
    }
    const plain = kg.plain.value;
    const normPlain = Norm.normalize(plain, { upper: kg.upper.checked, nonAlpha: kg.nonAlpha.value });
    const length = kg.repeat.checked ? normPlain.length || keyword.length : keyword.length;
    const exp = Norm.expandKey(keyword, length, { skipOnNonAlpha: kg.skipNonAlpha.checked }, normPlain);
    const expandedKey = exp.expanded.replace(/·/g, '');

    kg.expanded.value = expandedKey;

    // 位置対応テーブルを構築
    kg.table.innerHTML = '';
    const L = Math.max(length, normPlain.length);
    for (let i = 0; i < L; i++) {
      const tr = document.createElement('tr');
      const tdI = document.createElement('td'); tdI.textContent = (i + 1).toString();
      const tdP = document.createElement('td'); tdP.textContent = normPlain[i] ?? '';
      const tdK = document.createElement('td'); tdK.textContent = expandedKey[i] ?? '';
      tr.append(tdI, tdP, tdK);
      kg.table.appendChild(tr);
    }

    Toast.show('鍵文字列に展開しました');
  });

  // コピーボタン
  kg.copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(kg.expanded.value || '');
    Toast.show('鍵文字列をコピーしました');
  });

  // クリアボタン
  kg.clearBtn.addEventListener('click', () => {
    kg.keyword.value = '';
    kg.plain.value = '';
    kg.expanded.value = '';
    kg.table.innerHTML = '';
  });

  // ===== 暗号化/復号共通ヘルパー =====
  // 26×26表を描画
  function attachMatrix(el) {
    Viz.buildMatrix(el);
  }
  attachMatrix($('#encMatrix'));
  attachMatrix($('#decMatrix'));

  // 同期ボタン：鍵生成タブから鍵をコピー、暗号化タブから暗号文をコピー
  const encSyncBtn = $('#encSyncBtn');
  const decSyncBtn = $('#decSyncBtn');
  const decSyncCipherBtn = $('#decSyncCipherBtn');
  encSyncBtn?.addEventListener('click', () => {
    const keyText = kg.expanded.value;
    if (!keyText) {
      Toast.show('鍵生成タブで鍵文字列を生成してください');
      return;
    }
    enc.key.value = keyText;
    Toast.show('鍵文字列を同期');
  });
  decSyncBtn?.addEventListener('click', () => {
    const keyText = kg.expanded.value;
    if (!keyText) {
      Toast.show('鍵生成タブで鍵文字列を生成してください');
      return;
    }
    dec.key.value = keyText;
    Toast.show('鍵文字列を同期');
  });
  decSyncCipherBtn?.addEventListener('click', () => {
    const cipherText = enc.out.value;
    if (!cipherText) {
      Toast.show('暗号化タブで暗号文を生成してください');
      return;
    }
    dec.cipher.value = cipherText;
    Toast.show('暗号文を同期');
  });

  // 暗号化/復号のオプションを取得
  function getEncOpts(prefix) {
    const upper = $(`#${prefix}Upper`)?.checked ?? true;
    const nonAlpha = $(`#${prefix}NonAlpha`)?.value ?? 'keep';
    const skipNonAlpha = $(`#${prefix}SkipNonAlpha`)?.checked ?? true;
    return { upper, nonAlpha, skipOnNonAlpha: skipNonAlpha };
  }

  // ===== 暗号化タブ =====
  const enc = {
    plain: $('#encPlain'),
    key: $('#encKey'),
    nonAlpha: $('#encNonAlpha'),
    upper: $('#encUpper'),
    skipNonAlpha: $('#encSkipNonAlpha'),
    showVig: $('#encShowVig'),
    speed: $('#encSpeed'),
    runBtn: $('#encRunBtn'),
    stepBtn: $('#encStepBtn'),
    playBtn: $('#encPlayBtn'),
    resetBtn: $('#encResetBtn'),
    out: $('#encCipher'),
    copyBtn: $('#encCopyBtn'),
    clearBtn: $('#encClearBtn'),
    stepsBody: $('#encSteps tbody'),
    matrix: $('#encMatrix'),
  };

  // 暗号化の状態管理
  let encState = { i: 0, input: '', key: '', opts: null, playing: false, timer: null };

  // 暗号化をリセット
  function encReset() {
    encState.i = 0;
    encState.input = Norm.normalize(enc.plain.value, { upper: enc.upper.checked, nonAlpha: enc.nonAlpha.value });
    encState.key = enc.key.value.toUpperCase().replace(/[^A-Z]/g, '');
    enc.out.value = '';
    enc.stepsBody.innerHTML = '';
    Viz.clearHighlights(enc.matrix);
    if (!encState.key.length) {
      Toast.show('鍵（鍵文字列）に英字が含まれていません');
      return false;
    }
    return true;
  }

  // 1文字だけ暗号化を進める
  function encStepOnce() {
    if (encState.i >= encState.input.length) {
      updateEncProgress();
      return false;
    }

    const ch = encState.input[encState.i];
    const opts = encState.opts;

    // 鍵文字の進行を決定
    let consumeKey = Norm.isAlpha(ch) || !opts.skipOnNonAlpha;
    const keyIndex = countKeyConsumes(encState.input.slice(0, encState.i), opts.skipOnNonAlpha);
    const kch = encState.key.length ? encState.key[keyIndex % encState.key.length] : '';

    let step;
    if (Norm.isAlpha(ch)) {
      step = Beaufort.stepEncryptChar(ch, kch);
      const row = Norm.idx(kch);
      const col = Norm.idx(ch);
      Viz.clearHighlights(enc.matrix);
      Viz.highlight(enc.matrix, { rowIndex: row, colIndex: col });
    } else {
      step = { out: ch, formula: '', numeric: '', raw: null };
      Viz.clearHighlights(enc.matrix);
    }

    enc.out.value += step.out;

    const rowCells = [
      (encState.i + 1).toString(),
      ch,
      Norm.isAlpha(ch) || !opts.skipOnNonAlpha ? (kch || '') : '',
      step.formula,
      step.numeric,
      step.out
    ];
    Viz.addStepRow(enc.stepsBody, rowCells);

    encState.i++;
    updateEncProgress();
    return encState.i < encState.input.length;
  }

  // アニメーション再生
  function encPlay() {
    if (encState.playing) return;
    encState.playing = true;
    enc.playBtn.textContent = '一時停止 ⏸';
    const tick = () => {
      const cont = encStepOnce();
      if (!cont) { encStop(); return; }
      encState.timer = setTimeout(tick, parseInt(enc.speed.value, 10));
    };
    encState.timer = setTimeout(tick, parseInt(enc.speed.value, 10));
  }

  // アニメーション停止
  function encStop() {
    encState.playing = false;
    enc.playBtn.textContent = '再生 ▶';
    if (encState.timer) clearTimeout(encState.timer);
    encState.timer = null;
  }

  // 鍵が消費された回数をカウント
  function countKeyConsumes(s, skipOnNonAlpha) {
    let n = 0;
    for (const ch of s) {
      if (Norm.isAlpha(ch) || !skipOnNonAlpha) n++;
    }
    return n;
    }

  // すべて暗号化ボタン（一括実行）
  enc.runBtn.addEventListener('click', () => {
    if (!encReset()) return;
    encState.opts = { ...getEncOpts('enc') };
    const startTime = performance.now();
    const res = Beaufort.encrypt({
      text: enc.plain.value,
      key: enc.key.value,
      nonAlpha: enc.nonAlpha.value,
      upper: enc.upper.checked,
      skipOnNonAlpha: enc.skipNonAlpha.checked,
      stepCb: (s) => {
        if (!s.raw) {
          Viz.clearHighlights(enc.matrix);
        } else {
          const row = s.raw.k;
          const col = s.raw.p;
          Viz.clearHighlights(enc.matrix);
          Viz.highlight(enc.matrix, { rowIndex: row, colIndex: col });
        }
        Viz.addStepRow(enc.stepsBody, [
          (s.i + 1).toString(),
          s.inCh,
          s.keyCh,
          s.formula,
          s.numeric,
          s.outCh
        ]);
      }
    });
    enc.out.value = res.output;
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    encState.i = encState.input.length;
    updateEncProgress();
    Toast.show(`暗号化完了 (${elapsed}秒)`);
  });

  // 次の1文字ボタン
  enc.stepBtn.addEventListener('click', () => {
    if (!encState.opts) encState.opts = { ...getEncOpts('enc') };
    if (encState.i === 0) {
      if (!encReset()) return;
    }
    encStepOnce();
  });

  // アニメーションボタン
  enc.playBtn.addEventListener('click', () => {
    if (!encState.opts) encState.opts = { ...getEncOpts('enc') };
    if (encState.i === 0) {
      if (!encReset()) return;
    }
    if (encState.playing) encStop();
    else encPlay();
  });

  // 進行状況表示を更新
  function updateEncProgress() {
    const progress = $('#encProgress');
    if (encState.input.length > 0) {
      const percent = Math.round((encState.i / encState.input.length) * 100);
      progress.textContent = '';
      const textDiv = document.createElement('div');
      textDiv.textContent = `進行状況: ${encState.i} / ${encState.input.length} 文字 (${percent}%)`;
      const barDiv = document.createElement('div');
      barDiv.className = 'progress-bar';
      const fillDiv = document.createElement('div');
      fillDiv.className = 'progress-bar-fill';
      fillDiv.style.width = `${percent}%`;
      barDiv.appendChild(fillDiv);
      progress.appendChild(textDiv);
      progress.appendChild(barDiv);
      progress.style.display = 'block';
    } else {
      progress.style.display = 'none';
    }
  }

  // リセットボタン
  enc.resetBtn.addEventListener('click', () => {
    encStop();
    encReset();
  });

  // コピーボタン
  enc.copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(enc.out.value || '');
    Toast.show('暗号文をコピー');
  });

  // クリアボタン
  enc.clearBtn.addEventListener('click', () => {
    encStop();
    enc.plain.value = '';
    enc.key.value = '';
    enc.out.value = '';
    enc.stepsBody.innerHTML = '';
    Viz.clearHighlights(enc.matrix);
  });

  // ===== 復号タブ =====
  const dec = {
    cipher: $('#decCipher'),
    key: $('#decKey'),
    nonAlpha: $('#decNonAlpha'),
    upper: $('#decUpper'),
    skipNonAlpha: $('#decSkipNonAlpha'),
    showVig: $('#decShowVig'),
    speed: $('#decSpeed'),
    runBtn: $('#decRunBtn'),
    stepBtn: $('#decStepBtn'),
    playBtn: $('#decPlayBtn'),
    resetBtn: $('#decResetBtn'),
    out: $('#decPlain'),
    copyBtn: $('#decCopyBtn'),
    clearBtn: $('#decClearBtn'),
    stepsBody: $('#decSteps tbody'),
    matrix: $('#decMatrix'),
  };

  // 復号の状態管理
  let decState = { i: 0, input: '', key: '', opts: null, playing: false, timer: null };

  // 復号をリセット
  function decReset() {
    decState.i = 0;
    decState.input = Norm.normalize(dec.cipher.value, { upper: dec.upper.checked, nonAlpha: dec.nonAlpha.value });
    decState.key = dec.key.value.toUpperCase().replace(/[^A-Z]/g, '');
    dec.out.value = '';
    dec.stepsBody.innerHTML = '';
    Viz.clearHighlights(dec.matrix);
    if (!decState.key.length) {
      Toast.show('鍵（鍵文字列）に英字が含まれていません');
      return false;
    }
    return true;
  }

  // 復号用の鍵消費カウント（共通関数を再利用）
  function countKeyConsumesDec(s, skipOnNonAlpha) {
    return countKeyConsumes(s, skipOnNonAlpha);
  }

  // 1文字だけ復号を進める
  function decStepOnce() {
    if (decState.i >= decState.input.length) {
      updateDecProgress();
      return false;
    }

    const ch = decState.input[decState.i];
    const opts = decState.opts;

    const keyIndex = countKeyConsumes(decState.input.slice(0, decState.i), opts.skipOnNonAlpha);
    const kch = decState.key.length ? decState.key[keyIndex % decState.key.length] : '';

    let step;
    if (Norm.isAlpha(ch)) {
      step = Beaufort.stepDecryptChar(ch, kch);
      const row = Norm.idx(kch);
      const col = Norm.idx(ch);
      Viz.clearHighlights(dec.matrix);
      Viz.highlight(dec.matrix, { rowIndex: row, colIndex: col });
    } else {
      step = { out: ch, formula: '', numeric: '', raw: null };
      Viz.clearHighlights(dec.matrix);
    }

    dec.out.value += step.out;

    Viz.addStepRow(dec.stepsBody, [
      (decState.i + 1).toString(),
      ch,
      Norm.isAlpha(ch) || !opts.skipOnNonAlpha ? (kch || '') : '',
      step.formula,
      step.numeric,
      step.out
    ]);

    decState.i++;
    updateDecProgress();
    return decState.i < decState.input.length;
  }

  // アニメーション再生
  function decPlay() {
    if (decState.playing) return;
    decState.playing = true;
    dec.playBtn.textContent = '一時停止 ⏸';
    const tick = () => {
      const cont = decStepOnce();
      if (!cont) { decStop(); return; }
      decState.timer = setTimeout(tick, parseInt(dec.speed.value, 10));
    };
    decState.timer = setTimeout(tick, parseInt(dec.speed.value, 10));
  }

  // アニメーション停止
  function decStop() {
    decState.playing = false;
    dec.playBtn.textContent = '再生 ▶';
    if (decState.timer) clearTimeout(decState.timer);
    decState.timer = null;
  }

  // すべて復号ボタン（一括実行）
  dec.runBtn.addEventListener('click', () => {
    if (!decReset()) return;
    decState.opts = { ...getEncOpts('dec') };
    const startTime = performance.now();
    const res = Beaufort.decrypt({
      text: dec.cipher.value,
      key: dec.key.value,
      nonAlpha: dec.nonAlpha.value,
      upper: dec.upper.checked,
      skipOnNonAlpha: dec.skipNonAlpha.checked,
      stepCb: (s) => {
        if (!s.raw) {
          Viz.clearHighlights(dec.matrix);
        } else {
          const row = s.raw.k;
          const col = s.raw.c;
          Viz.clearHighlights(dec.matrix);
          Viz.highlight(dec.matrix, { rowIndex: row, colIndex: col });
        }
        Viz.addStepRow(dec.stepsBody, [
          (s.i + 1).toString(),
          s.inCh,
          s.keyCh,
          s.formula,
          s.numeric,
          s.outCh
        ]);
      }
    });
    dec.out.value = res.output;
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    decState.i = decState.input.length;
    updateDecProgress();
    Toast.show(`復号完了 (${elapsed}秒)`);
  });

  // 次の1文字ボタン
  dec.stepBtn.addEventListener('click', () => {
    if (!decState.opts) decState.opts = { ...getEncOpts('dec') };
    if (decState.i === 0) {
      if (!decReset()) return;
    }
    decStepOnce();
  });

  // アニメーションボタン
  dec.playBtn.addEventListener('click', () => {
    if (!decState.opts) decState.opts = { ...getEncOpts('dec') };
    if (decState.i === 0) {
      if (!decReset()) return;
    }
    if (decState.playing) decStop();
    else decPlay();
  });

  // 進行状況表示を更新
  function updateDecProgress() {
    const progress = $('#decProgress');
    if (decState.input.length > 0) {
      const percent = Math.round((decState.i / decState.input.length) * 100);
      progress.textContent = '';
      const textDiv = document.createElement('div');
      textDiv.textContent = `進行状況: ${decState.i} / ${decState.input.length} 文字 (${percent}%)`;
      const barDiv = document.createElement('div');
      barDiv.className = 'progress-bar';
      const fillDiv = document.createElement('div');
      fillDiv.className = 'progress-bar-fill';
      fillDiv.style.width = `${percent}%`;
      barDiv.appendChild(fillDiv);
      progress.appendChild(textDiv);
      progress.appendChild(barDiv);
      progress.style.display = 'block';
    } else {
      progress.style.display = 'none';
    }
  }

  // リセットボタン
  dec.resetBtn.addEventListener('click', () => {
    decStop();
    decReset();
  });

  // コピーボタン
  dec.copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(dec.out.value || '');
    Toast.show('平文をコピー');
  });

  // クリアボタン
  dec.clearBtn.addEventListener('click', () => {
    decStop();
    dec.cipher.value = '';
    dec.key.value = '';
    dec.out.value = '';
    dec.stepsBody.innerHTML = '';
    Viz.clearHighlights(dec.matrix);
  });

  // ===== キーボードショートカット =====
  document.addEventListener('keydown', (e) => {
    const active = $('.panel.active')?.id || '';
    // Ctrl+Enter: 一括実行
    if (e.ctrlKey && e.key === 'Enter') {
      if (active === 'tab-encrypt') enc.runBtn.click();
      if (active === 'tab-decrypt') dec.runBtn.click();
    }
    // Space: 再生/一時停止
    if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (active === 'tab-encrypt') enc.playBtn.click();
      if (active === 'tab-decrypt') dec.playBtn.click();
    }
    // →: 次の1文字
    if (e.key === 'ArrowRight' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (active === 'tab-encrypt') enc.stepBtn.click();
      if (active === 'tab-decrypt') dec.stepBtn.click();
    }
    // Esc: リセットまたはモーダルを閉じる
    if (e.key === 'Escape') {
      const helpModal = $('#helpModal');
      if (helpModal.style.display === 'flex') {
        helpModal.style.display = 'none';
        return;
      }
      if (active === 'tab-encrypt') enc.resetBtn.click();
      if (active === 'tab-decrypt') dec.resetBtn.click();
    }
    // ?: ヘルプを表示
    if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      $('#helpToggle')?.click();
    }
  });
})();
