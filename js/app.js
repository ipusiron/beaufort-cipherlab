// app.js - メインアプリケーションロジック（タブ切替、イベント管理、暗号化/復号処理）
(function () {
  // DOM操作のショートカット
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ===== テーマ切替 =====
  const themeToggle = $('#themeToggle');
  const themeLabel = $('.theme-label');
  let storedTheme;
  try { storedTheme = localStorage.getItem('beaufort.theme'); } catch { /* storage is optional */ }
  const isDark = storedTheme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
    themeLabel.textContent = 'Light';
  }
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    themeLabel.textContent = isDark ? 'Light' : 'Dark';
    try { localStorage.setItem('beaufort.theme', isDark ? 'dark' : 'light'); } catch { /* storage is optional */ }
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
      encStop(); decStop();
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
    expandBtn: $('#kgExpandBtn'),
    copyBtn: $('#kgCopyBtn'),
    clearBtn: $('#kgClearBtn'),
    expanded: $('#kgExpanded'),
    table: $('#kgTable tbody')
  };

  // 鍵文字列に展開ボタン
  kg.expandBtn.addEventListener('click', () => {
    const keyword = kg.keyword.value;
    if (!Norm.normalizeKey(keyword)) {
      Toast.show('鍵キーワードに英字がありません');
      return;
    }
    const plain = kg.plain.value;
    if (Array.from(plain).length > 10000 || Array.from(keyword).length > 10000) {
      Toast.show('入力は各欄10,000文字以内にしてください');
      return;
    }
    const normPlain = Norm.normalize(plain, { upper: kg.upper.checked, nonAlpha: kg.nonAlpha.value });
    const chars = Array.from(normPlain);
    const keyLength = Norm.normalizeKey(keyword).length;
    const length = kg.repeat.checked ? chars.length || keyLength : keyLength;
    const exp = Norm.expandKey(keyword, length, { skipOnNonAlpha: kg.skipNonAlpha.checked }, normPlain);
    const expandedKey = exp.expanded.replace(/·/g, '');

    kg.expanded.value = expandedKey;

    // 位置対応テーブルを構築
    kg.table.innerHTML = '';
    const L = Math.min(300, Math.max(length, chars.length));
    for (let i = 0; i < L; i++) {
      const tr = document.createElement('tr');
      const tdI = document.createElement('td'); tdI.textContent = (i + 1).toString();
      const tdP = document.createElement('td'); tdP.textContent = chars[i] ?? '';
      const tdK = document.createElement('td'); tdK.textContent = exp.expanded[i] === '·' ? '' : (exp.expanded[i] ?? '');
      tr.append(tdI, tdP, tdK);
      kg.table.appendChild(tr);
    }

    Toast.show('鍵文字列に展開しました');
  });

  // コピーボタン
  kg.copyBtn.addEventListener('click', async () => {
    await copyText(kg.expanded.value || '');
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
    invalidate('enc');
    Toast.show('鍵文字列を同期');
  });
  decSyncBtn?.addEventListener('click', () => {
    const keyText = kg.expanded.value;
    if (!keyText) {
      Toast.show('鍵生成タブで鍵文字列を生成してください');
      return;
    }
    dec.key.value = keyText;
    invalidate('dec');
    Toast.show('鍵文字列を同期');
  });
  decSyncCipherBtn?.addEventListener('click', () => {
    const cipherText = enc.out.value;
    if (!cipherText) {
      Toast.show('暗号化タブで暗号文を生成してください');
      return;
    }
    dec.cipher.value = cipherText;
    invalidate('dec');
    Toast.show('暗号文を同期');
  });

  // 暗号化/復号のオプションを取得
  function getEncOpts(prefix) {
    const upper = $(`#${prefix}Upper`)?.checked ?? true;
    const nonAlpha = $(`#${prefix}NonAlpha`)?.value ?? 'keep';
    const skipNonAlpha = $(`#${prefix}SkipNonAlpha`)?.checked ?? true;
    return { upper, nonAlpha, skipOnNonAlpha: skipNonAlpha };
  }

  // Shared calculation: bulk and stepping consume the same immutable trace.
  function prepare(state, prefix, text, key) {
    state.i = 0;
    state.input = '';
    state.key = '';
    state.steps = [];
    state.output = '';
    state.opts = getEncOpts(prefix);
    try {
      const result = Beaufort[prefix === 'enc' ? 'encrypt' : 'decrypt']({
        text, key, ...state.opts, stepCb: step => state.steps.push(step)
      });
      state.input = Array.from(result.input);
      state.key = Norm.normalizeKey(key);
      state.output = result.output;
      return true;
    } catch (error) {
      Toast.show(error.message === 'inputTooLong'
        ? '入力は各欄10,000文字以内にしてください' : '鍵に英字が含まれていません');
      return false;
    }
  }

  function renderStep(panel, step) {
    Viz.clearHighlights(panel.matrix);
    if (step.raw) {
      Viz.highlight(panel.matrix, { rowIndex: step.raw.k, colIndex: Norm.idx(step.inCh) });
    }
    if (step.i < 300) Viz.addStepRow(panel.stepsBody, [
      String(step.i + 1), step.inCh, step.keyCh, step.formula, step.numeric, step.outCh
    ]);
  }

  // ===== 暗号化タブ =====
  const enc = {
    plain: $('#encPlain'),
    key: $('#encKey'),
    nonAlpha: $('#encNonAlpha'),
    upper: $('#encUpper'),
    skipNonAlpha: $('#encSkipNonAlpha'),
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
  let encState = { i: 0, input: [], key: '', opts: null, steps: [], output: '', playing: false, timer: null };

  // 暗号化をリセット
  function encReset() {
    encStop();
    enc.out.value = '';
    enc.stepsBody.innerHTML = '';
    Viz.clearHighlights(enc.matrix);
    const valid = prepare(encState, 'enc', enc.plain.value, enc.key.value);
    updateEncProgress();
    return valid;
  }

  // 1文字だけ暗号化を進める
  function encStepOnce() {
    if (encState.i >= encState.input.length) {
      updateEncProgress();
      return false;
    }

    const step = encState.steps[encState.i];
    enc.out.value += step.outCh;
    renderStep(enc, step);

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
    enc.playBtn.textContent = '▶ アニメーション';
    if (encState.timer) clearTimeout(encState.timer);
    encState.timer = null;
  }

  // すべて暗号化ボタン（一括実行）
  enc.runBtn.addEventListener('click', () => {
    if (!encReset()) return;
    const startTime = performance.now();
    const steps = encState.steps;
    for (const step of steps.slice(0, 300)) renderStep(enc, step);
    if (steps.length > 300) renderStep(enc, steps[steps.length - 1]);
    enc.out.value = encState.output;
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    encState.i = encState.input.length;
    updateEncProgress();
    Toast.show(`暗号化完了 (${elapsed}秒)`);
  });

  // 次の1文字ボタン
  enc.stepBtn.addEventListener('click', () => {
    if (encState.i === 0) {
      if (!encReset()) return;
    }
    encStepOnce();
  });

  // アニメーションボタン
  enc.playBtn.addEventListener('click', () => {
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
    await copyText(enc.out.value || '');
  });

  // クリアボタン
  enc.clearBtn.addEventListener('click', () => {
    encStop();
    enc.plain.value = '';
    enc.key.value = '';
    invalidate('enc');
  });

  // ===== 復号タブ =====
  const dec = {
    cipher: $('#decCipher'),
    key: $('#decKey'),
    nonAlpha: $('#decNonAlpha'),
    upper: $('#decUpper'),
    skipNonAlpha: $('#decSkipNonAlpha'),
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
  let decState = { i: 0, input: [], key: '', opts: null, steps: [], output: '', playing: false, timer: null };

  // 復号をリセット
  function decReset() {
    decStop();
    dec.out.value = '';
    dec.stepsBody.innerHTML = '';
    Viz.clearHighlights(dec.matrix);
    const valid = prepare(decState, 'dec', dec.cipher.value, dec.key.value);
    updateDecProgress();
    return valid;
  }

  // 1文字だけ復号を進める
  function decStepOnce() {
    if (decState.i >= decState.input.length) {
      updateDecProgress();
      return false;
    }

    const step = decState.steps[decState.i];
    dec.out.value += step.outCh;
    renderStep(dec, step);

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
    dec.playBtn.textContent = '▶ アニメーション';
    if (decState.timer) clearTimeout(decState.timer);
    decState.timer = null;
  }

  // すべて復号ボタン（一括実行）
  dec.runBtn.addEventListener('click', () => {
    if (!decReset()) return;
    const startTime = performance.now();
    const steps = decState.steps;
    for (const step of steps.slice(0, 300)) renderStep(dec, step);
    if (steps.length > 300) renderStep(dec, steps[steps.length - 1]);
    dec.out.value = decState.output;
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    decState.i = decState.input.length;
    updateDecProgress();
    Toast.show(`復号完了 (${elapsed}秒)`);
  });

  // 次の1文字ボタン
  dec.stepBtn.addEventListener('click', () => {
    if (decState.i === 0) {
      if (!decReset()) return;
    }
    decStepOnce();
  });

  // アニメーションボタン
  dec.playBtn.addEventListener('click', () => {
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
    await copyText(dec.out.value || '');
  });

  // クリアボタン
  dec.clearBtn.addEventListener('click', () => {
    decStop();
    dec.cipher.value = '';
    dec.key.value = '';
    invalidate('dec');
  });

  function invalidate(prefix) {
    const panel = prefix === 'enc' ? enc : dec;
    const state = prefix === 'enc' ? encState : decState;
    (prefix === 'enc' ? encStop : decStop)();
    Object.assign(state, { i: 0, input: [], key: '', opts: null, steps: [], output: '' });
    panel.out.value = '';
    panel.stepsBody.innerHTML = '';
    Viz.clearHighlights(panel.matrix);
    (prefix === 'enc' ? updateEncProgress : updateDecProgress)();
  }

  for (const [prefix, inputs] of [
    ['enc', [enc.plain, enc.key, enc.nonAlpha, enc.upper, enc.skipNonAlpha]],
    ['dec', [dec.cipher, dec.key, dec.nonAlpha, dec.upper, dec.skipNonAlpha]]
  ]) for (const input of inputs) {
    input.addEventListener('input', () => invalidate(prefix));
    input.addEventListener('change', () => invalidate(prefix));
  }
  for (const input of [kg.keyword, kg.plain, kg.repeat, kg.skipNonAlpha, kg.upper, kg.nonAlpha]) {
    input.addEventListener('input', () => { kg.expanded.value = ''; kg.table.innerHTML = ''; });
    input.addEventListener('change', () => { kg.expanded.value = ''; kg.table.innerHTML = ''; });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { encStop(); decStop(); }
  });
  window.addEventListener('pagehide', () => { encStop(); decStop(); });

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      Toast.show('コピーしました');
    } catch {
      Toast.show('コピーできません。結果欄を選択して手動でコピーしてください');
    }
  }

  // ===== キーボードショートカット =====
  document.addEventListener('keydown', (e) => {
    const active = $('.panel.active')?.id || '';
    if (e.isComposing || e.repeat) return;
    if (helpModal.style.display === 'flex' && e.key !== 'Escape') return;
    // Ctrl+Enter: 一括実行
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (active === 'tab-encrypt') enc.runBtn.click();
      if (active === 'tab-decrypt') dec.runBtn.click();
    }
    // Space: 再生/一時停止
    if (e.key === ' ' && !document.activeElement.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) {
      e.preventDefault();
      if (active === 'tab-encrypt') enc.playBtn.click();
      if (active === 'tab-decrypt') dec.playBtn.click();
    }
    // →: 次の1文字
    if (e.key === 'ArrowRight' && !document.activeElement.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) {
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
    if (e.key === '?' && !document.activeElement.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) {
      e.preventDefault();
      $('#helpToggle')?.click();
    }
  });
})();
