// app.js - メインアプリケーションロジック（タブ切替、イベント管理、暗号化/復号処理）
(function () {
  // DOM操作のショートカット
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const t = Messages.t;
  let comparisonSource = null;
  let activeSample = null;

  // ===== テーマ切替 =====
  const themeToggle = $('#themeToggle');
  const themeLabel = $('.theme-label');
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    updateThemeLabel();
    try { localStorage.setItem('beaufort.theme', isDark ? 'dark' : 'light'); } catch { /* storage is optional */ }
  });

  function updateThemeLabel() {
    themeLabel.textContent = t(document.documentElement.classList.contains('dark') ? 'themeLight' : 'themeDark');
    themeToggle.setAttribute('aria-label', themeLabel.textContent);
  }

  // ===== ヘルプモーダル（キーボードショートカット）=====
  const helpToggle = $('#helpToggle');
  const helpModal = $('#helpModal');
  const helpClose = $('#helpClose');
  let returnFocus = null;
  function closeHelp() {
    helpModal.hidden = true;
    for (const el of document.querySelectorAll('header, nav, main, .toolbar')) el.inert = false;
    returnFocus?.focus();
  }
  helpToggle?.addEventListener('click', () => {
    encStop(); decStop();
    returnFocus = document.activeElement;
    helpModal.hidden = false;
    for (const el of document.querySelectorAll('header, nav, main, .toolbar')) el.inert = true;
    helpClose.focus();
  });
  helpClose?.addEventListener('click', () => {
    closeHelp();
  });
  helpModal?.addEventListener('click', (e) => {
    if (e.target === helpModal) closeHelp();
  });

  // ===== タブ切替 =====
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      encStop(); decStop();
      $$('.tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', String(b === btn));
        b.tabIndex = b === btn ? 0 : -1;
      });
      btn.classList.add('active');
      const id = btn.dataset.tab;
      $$('.panel').forEach(p => p.classList.remove('active'));
      $('#' + id)?.classList.add('active');
    });
  });

  const tabs = $$('.tab');
  tabs.forEach((tab, index) => {
    tab.id = 'tab-button-' + index;
    tab.setAttribute('aria-controls', tab.dataset.tab);
    tab.tabIndex = index === 0 ? 0 : -1;
    $('#' + tab.dataset.tab).setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        tabs[next].click();
        tabs[next].focus();
      }
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
      Toast.show(t('invalidKey'));
      return;
    }
    const plain = kg.plain.value;
    if (Array.from(plain).length > 10000 || Array.from(keyword).length > 10000) {
      Toast.show(t('inputTooLong'));
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
    kg.table.textContent = '';
    const L = Math.min(300, Math.max(length, chars.length));
    for (let i = 0; i < L; i++) {
      const tr = document.createElement('tr');
      const tdI = document.createElement('td'); tdI.textContent = (i + 1).toString();
      const tdP = document.createElement('td'); tdP.textContent = chars[i] ?? '';
      const tdK = document.createElement('td'); tdK.textContent = exp.expanded[i] === '·' ? '' : (exp.expanded[i] ?? '');
      tr.append(tdI, tdP, tdK);
      kg.table.appendChild(tr);
    }

    Toast.show(t('expanded'));
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
    kg.table.textContent = '';
    updatePreview('kg');
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
      Toast.show(t('needKey'));
      return;
    }
    enc.key.value = keyText;
    invalidate('enc');
    Toast.show(t('syncedKey'));
  });
  decSyncBtn?.addEventListener('click', () => {
    const keyText = kg.expanded.value;
    if (!keyText) {
      Toast.show(t('needKey'));
      return;
    }
    dec.key.value = keyText;
    invalidate('dec');
    Toast.show(t('syncedKey'));
  });
  decSyncCipherBtn?.addEventListener('click', () => {
    const cipherText = enc.out.value;
    if (!cipherText) {
      Toast.show(t('needCipher'));
      return;
    }
    dec.cipher.value = cipherText;
    invalidate('dec');
    Toast.show(t('syncedCipher'));
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
        ? t('inputTooLong') : t('invalidKey'));
      return false;
    }
  }

  function highlightStep(panel, step) {
    Viz.clearHighlights(panel.matrix);
    if (step?.raw) {
      Viz.highlight(panel.matrix, { rowIndex: step.raw.k, colIndex: Norm.idx(step.inCh) });
    }
  }

  function renderRows(prefix) {
    const panel = prefix === 'enc' ? enc : dec;
    const state = prefix === 'enc' ? encState : decState;
    const start = state.pageStart || 0;
    const end = Math.min(start + Learning.PAGE_SIZE, state.i);
    panel.stepsBody.textContent = '';
    for (const step of state.steps.slice(start, end)) Viz.addStepRow(panel.stepsBody, [
      String(step.i + 1), step.inCh, step.keyCh, step.formula, step.numeric, step.outCh
    ]);
    const range = $(`#${prefix}Rows`);
    if (range) {
      range.textContent = state.i ? t('rows', { start: start + 1, end, done: state.i }) : t('noRows');
      $(`#${prefix}PagePrev`).disabled = start === 0;
      $(`#${prefix}PageNext`).disabled = end >= state.i;
    }
  }

  function renderPosition(prefix, position) {
    const panel = prefix === 'enc' ? enc : dec;
    const state = prefix === 'enc' ? encState : decState;
    state.i = position;
    state.pageStart = Learning.windowFor(position).start;
    panel.out.value = state.steps.slice(0, position).map(step => step.outCh).join('');
    highlightStep(panel, state.steps[position - 1]);
    renderRows(prefix);
    (prefix === 'enc' ? updateEncProgress : updateDecProgress)();
    $(`#${prefix}Position`).value = position;
    $(`#${prefix}Position`).max = state.input.length;
    $(`#${prefix}BackBtn`).disabled = position === 0;
    if (prefix === 'dec') renderComparison();
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
    enc.stepsBody.textContent = '';
    Viz.clearHighlights(enc.matrix);
    const valid = prepare(encState, 'enc', enc.plain.value, enc.key.value);
    renderPosition('enc', 0);
    return valid;
  }

  // 1文字だけ暗号化を進める
  function encStepOnce() {
    if (encState.i >= encState.input.length) {
      updateEncProgress();
      return false;
    }

    renderPosition('enc', encState.i + 1);
    return encState.i < encState.input.length;
  }

  // アニメーション再生
  function encPlay() {
    if (encState.playing) return;
    encState.playing = true;
    enc.playBtn.textContent = t('pause');
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
    enc.playBtn.textContent = t('play');
    if (encState.timer) clearTimeout(encState.timer);
    encState.timer = null;
  }

  // すべて暗号化ボタン（一括実行）
  enc.runBtn.addEventListener('click', () => {
    if (!encReset()) return;
    const startTime = performance.now();
    renderPosition('enc', encState.input.length);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    encState.i = encState.input.length;
    updateEncProgress();
    Toast.show(t('encrypted', { seconds: elapsed }));
  });

  // 次の1文字ボタン
  enc.stepBtn.addEventListener('click', () => {
    encStop();
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
      textDiv.textContent = t('progress', { done: encState.i, total: encState.input.length, percent });
      const barDiv = document.createElement('div');
      barDiv.className = 'progress-bar';
      const fillDiv = document.createElement('div');
      fillDiv.className = 'progress-bar-fill';
      fillDiv.style.width = `${percent}%`;
      barDiv.appendChild(fillDiv);
      progress.appendChild(textDiv);
      progress.appendChild(barDiv);
      progress.hidden = false;
    } else {
      progress.hidden = true;
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
    dec.stepsBody.textContent = '';
    Viz.clearHighlights(dec.matrix);
    const valid = prepare(decState, 'dec', dec.cipher.value, dec.key.value);
    renderPosition('dec', 0);
    return valid;
  }

  // 1文字だけ復号を進める
  function decStepOnce() {
    if (decState.i >= decState.input.length) {
      updateDecProgress();
      return false;
    }

    renderPosition('dec', decState.i + 1);
    return decState.i < decState.input.length;
  }

  // アニメーション再生
  function decPlay() {
    if (decState.playing) return;
    decState.playing = true;
    dec.playBtn.textContent = t('pause');
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
    dec.playBtn.textContent = t('play');
    if (decState.timer) clearTimeout(decState.timer);
    decState.timer = null;
  }

  // すべて復号ボタン（一括実行）
  dec.runBtn.addEventListener('click', () => {
    if (!decReset()) return;
    const startTime = performance.now();
    renderPosition('dec', decState.input.length);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
    decState.i = decState.input.length;
    updateDecProgress();
    Toast.show(t('decrypted', { seconds: elapsed }));
  });

  // 次の1文字ボタン
  dec.stepBtn.addEventListener('click', () => {
    decStop();
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
      textDiv.textContent = t('progress', { done: decState.i, total: decState.input.length, percent });
      const barDiv = document.createElement('div');
      barDiv.className = 'progress-bar';
      const fillDiv = document.createElement('div');
      fillDiv.className = 'progress-bar-fill';
      fillDiv.style.width = `${percent}%`;
      barDiv.appendChild(fillDiv);
      progress.appendChild(textDiv);
      progress.appendChild(barDiv);
      progress.hidden = false;
    } else {
      progress.hidden = true;
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
    comparisonSource = null;
    invalidate('dec');
  });

  function invalidate(prefix) {
    const panel = prefix === 'enc' ? enc : dec;
    const state = prefix === 'enc' ? encState : decState;
    (prefix === 'enc' ? encStop : decStop)();
    Object.assign(state, { i: 0, input: [], key: '', opts: null, steps: [], output: '' });
    panel.out.value = '';
    panel.stepsBody.textContent = '';
    Viz.clearHighlights(panel.matrix);
    if (prefix === 'enc') {
      comparisonSource = null;
      activeSample = null;
      $('#sampleHint').textContent = '';
    }
    renderPosition(prefix, 0);
    updatePreview(prefix);
    renderComparison();
  }

  for (const [prefix, inputs] of [
    ['enc', [enc.plain, enc.key, enc.nonAlpha, enc.upper, enc.skipNonAlpha]],
    ['dec', [dec.cipher, dec.key, dec.nonAlpha, dec.upper, dec.skipNonAlpha]]
  ]) for (const input of inputs) {
    input.addEventListener('input', () => invalidate(prefix));
    input.addEventListener('change', () => invalidate(prefix));
  }
  for (const input of [kg.keyword, kg.plain, kg.repeat, kg.skipNonAlpha, kg.upper, kg.nonAlpha]) {
    input.addEventListener('input', () => { kg.expanded.value = ''; kg.table.textContent = ''; updatePreview('kg'); });
    input.addEventListener('change', () => { kg.expanded.value = ''; kg.table.textContent = ''; updatePreview('kg'); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { encStop(); decStop(); }
  });
  window.addEventListener('pagehide', () => { encStop(); decStop(); });

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      Toast.show(t('copied'));
    } catch {
      Toast.show(t('copyFailed'));
    }
  }

  // Build learning controls without parsing HTML or interpolating user text.
  function element(tag, parent, id, message) {
    const node = document.createElement(tag);
    if (id) node.id = id;
    if (message) { node.dataset.message = message; node.textContent = t(message); }
    parent.appendChild(node);
    return node;
  }
  function button(parent, id, message, handler) {
    const node = element('button', parent, id, message);
    node.type = 'button'; node.className = 'btn';
    node.addEventListener('click', handler);
    return node;
  }
  function readonlyField(parent, id, message) {
    element('label', parent, null, message).htmlFor = id;
    const node = element('textarea', parent, id);
    node.readOnly = true; node.rows = 2;
    return node;
  }
  function updatePreview(prefix) {
    const text = prefix === 'kg' ? kg.plain.value : prefix === 'enc' ? enc.plain.value : dec.cipher.value;
    const key = prefix === 'kg' ? kg.keyword.value : prefix === 'enc' ? enc.key.value : dec.key.value;
    try {
      const info = Learning.preview(text, key, getEncOpts(prefix));
      $(`#${prefix}Normalized`).value = info.normalized;
      $(`#${prefix}NormalizedKey`).value = info.key;
      $(`#${prefix}NormalizationCounts`).textContent = t('normalizationCounts', info);
    } catch {
      $(`#${prefix}Normalized`).value = '';
      $(`#${prefix}NormalizedKey`).value = '';
      $(`#${prefix}NormalizationCounts`).textContent = t('inputTooLong');
    }
  }
  for (const prefix of ['kg', 'enc', 'dec']) {
    const anchor = $(`#${prefix}Upper`).closest('.options');
    const preview = document.createElement('details');
    preview.className = 'learning-box'; preview.open = true;
    anchor.after(preview);
    element('summary', preview, null, 'preview');
    readonlyField(preview, `${prefix}Normalized`, 'normalized');
    readonlyField(preview, `${prefix}NormalizedKey`, 'normalizedKey');
    element('p', preview, `${prefix}NormalizationCounts`);
    element('p', preview, null, 'normalizationNote');
  }
  for (const prefix of ['enc', 'dec']) {
    const panel = prefix === 'enc' ? enc : dec;
    const state = prefix === 'enc' ? encState : decState;
    const reset = prefix === 'enc' ? encReset : decReset;
    const stop = prefix === 'enc' ? encStop : decStop;
    const nav = document.createElement('div'); nav.className = 'learning-box';
    $(`#${prefix}Progress`).before(nav);
    const actions = element('div', nav); actions.className = 'actions';
    button(actions, `${prefix}BackBtn`, 'back', () => { stop(); renderPosition(prefix, Math.max(0, state.i - 1)); });
    button(actions, `${prefix}FirstBtn`, 'first', () => { reset(); });
    element('label', nav, null, 'jumpLabel').htmlFor = `${prefix}Position`;
    const jumpRow = element('div', nav); jumpRow.className = 'actions';
    const input = element('input', jumpRow, `${prefix}Position`);
    input.type = 'number'; input.min = 0; input.max = 10000; input.step = 1; input.value = 0;
    const go = () => {
      stop();
      const value = input.value.trim();
      const position = Number(value);
      if (!state.opts && !reset()) return;
      if (!value || !Number.isInteger(position) || position < 0 || position > state.input.length) {
        input.value = value;
        Toast.show(t('invalidPosition', { total: state.input.length })); return;
      }
      renderPosition(prefix, position);
    };
    button(jumpRow, `${prefix}JumpBtn`, 'jump', go);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.isComposing) { event.preventDefault(); go(); }
    });
    const pages = document.createElement('div'); pages.className = 'actions table-pages';
    panel.stepsBody.closest('.table-wrap').before(pages);
    button(pages, `${prefix}PagePrev`, 'pagePrev', () => {
      stop(); state.pageStart = Math.max(0, (state.pageStart || 0) - Learning.PAGE_SIZE); renderRows(prefix);
    });
    button(pages, `${prefix}PageNext`, 'pageNext', () => {
      stop(); state.pageStart = Math.min(Learning.windowFor(state.i).start, (state.pageStart || 0) + Learning.PAGE_SIZE); renderRows(prefix);
    });
    element('p', pages, `${prefix}Rows`).setAttribute('aria-live', 'polite');
  }

  const sampleBox = document.createElement('details'); sampleBox.className = 'learning-box';
  $('[for="encPlain"]').before(sampleBox);
  element('summary', sampleBox, null, 'samples');
  const sampleButtons = element('div', sampleBox); sampleButtons.className = 'actions';
  for (const sample of Learning.samples) button(sampleButtons, `sample-${sample.id}`, `sample_${sample.id}`, () => {
    enc.plain.value = sample.text; enc.key.value = sample.key;
    enc.upper.checked = sample.upper; enc.nonAlpha.value = sample.nonAlpha; enc.skipNonAlpha.checked = sample.skipOnNonAlpha;
    invalidate('enc');
    activeSample = sample.id;
    $('#sampleHint').textContent = t(`sampleHint_${activeSample}`);
  });
  element('p', sampleBox, 'sampleHint');
  const source = element('a', sampleBox, null, 'sampleSource');
  source.href = 'https://www.cryptogram.org/downloads/aca.info/ciphers/Beaufort.pdf';
  source.target = '_blank'; source.rel = 'noopener noreferrer';

  const roundTrip = document.createElement('div'); roundTrip.className = 'learning-box';
  enc.out.parentElement.appendChild(roundTrip);
  button(roundTrip, 'roundTripBtn', 'roundTrip', () => {
    if (!encReset()) return;
    renderPosition('enc', encState.input.length);
    dec.cipher.value = encState.output; dec.key.value = enc.key.value;
    dec.upper.checked = enc.upper.checked; dec.nonAlpha.value = enc.nonAlpha.value; dec.skipNonAlpha.checked = enc.skipNonAlpha.checked;
    invalidate('dec');
    comparisonSource = { original: enc.plain.value, expected: encState.input.join('') };
    if (!decReset()) return;
    renderPosition('dec', decState.input.length);
    $('[data-tab="tab-decrypt"]').click();
  });
  element('p', roundTrip, null, 'roundTripNote');
  const comparison = document.createElement('section'); comparison.className = 'learning-box';
  dec.out.parentElement.appendChild(comparison);
  element('h3', comparison, null, 'comparison');
  element('p', comparison, 'comparisonStatus').setAttribute('role', 'status');
  const comparisonDetails = element('div', comparison, 'comparisonDetails');
  readonlyField(comparisonDetails, 'comparisonOriginal', 'original');
  readonlyField(comparisonDetails, 'comparisonExpected', 'expected');
  readonlyField(comparisonDetails, 'comparisonActual', 'actual');
  const difference = element('div', comparisonDetails, 'comparisonDifference');
  for (const [id, label] of [['Expected', 'contextExpected'], ['Actual', 'contextActual']]) {
    element('p', difference, null, label);
    element('pre', difference, `context${id}`);
  }
  element('p', comparison, null, 'normalizationNote');
  element('p', comparison, null, 'roundTripNote');

  function renderComparison() {
    const status = $('#comparisonStatus');
    if (!status) return;
    $('#comparisonDetails').hidden = !comparisonSource;
    $('#comparisonDifference').hidden = true;
    for (const id of ['comparisonOriginal', 'comparisonExpected', 'comparisonActual']) $('#' + id).value = '';
    for (const id of ['contextExpected', 'contextActual']) $('#' + id).textContent = '';
    if (!comparisonSource) { status.textContent = t('noComparison'); return; }
    $('#comparisonOriginal').value = comparisonSource.original;
    $('#comparisonExpected').value = comparisonSource.expected;
    if (!decState.opts || !decState.key || decState.i !== decState.input.length) { status.textContent = t('pending'); return; }
    $('#comparisonActual').value = dec.out.value;
    const result = Learning.compare(comparisonSource.expected, dec.out.value);
    status.textContent = t(result.equal ? 'match' : 'mismatch', result);
    if (!result.equal) {
      $('#comparisonDifference').hidden = false;
      for (const [id, part] of [['Expected', result.expected], ['Actual', result.actual]]) {
        // JSON notation makes whitespace/control characters and literal brackets unambiguous.
        $(`#context${id}`).textContent = JSON.stringify(part.before) + ' → [' +
          (part.at === null ? t('endOfText') : JSON.stringify(part.at)) + '] ← ' + JSON.stringify(part.after);
      }
    }
  }

  document.addEventListener('languagechange', () => {
    encStop(); decStop();
    updateEncProgress(); updateDecProgress(); updateThemeLabel();
    $('#toast').classList.remove('show');
    $('#toast').textContent = '';
    $('#encMatrix').setAttribute('aria-label', t('matrixEnc'));
    $('#decMatrix').setAttribute('aria-label', t('matrixDec'));
    for (const el of [enc.speed, dec.speed]) el.setAttribute('aria-label', t('speed'));
    $('.tabs').setAttribute('aria-label', t('tabs'));
    helpToggle.setAttribute('aria-label', t('help'));
    helpClose.setAttribute('aria-label', t('close'));
    for (const prefix of ['kg', 'enc', 'dec']) updatePreview(prefix);
    for (const prefix of ['enc', 'dec']) renderRows(prefix);
    renderComparison();
    if (activeSample) $('#sampleHint').textContent = t(`sampleHint_${activeSample}`);
  });
  renderPosition('enc', 0); renderPosition('dec', 0);
  Messages.init();

  // ===== キーボードショートカット =====
  document.addEventListener('keydown', (e) => {
    const active = $('.panel.active')?.id || '';
    if (e.isComposing || e.repeat) return;
    if (!helpModal.hidden && e.key !== 'Escape') {
      if (e.key === 'Tab') { e.preventDefault(); helpClose.focus(); }
      return;
    }
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
      if (!helpModal.hidden) {
        closeHelp();
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
