// toaster.js - トースト通知の表示
(function (global) {
  // トースト要素を取得
  const el = () => document.getElementById('toast');

  // トースト通知を表示
  // @param {string} msg - 表示するメッセージ
  // @param {number} ms - 表示時間（ミリ秒）
  function showToast(msg, ms = 1600) {
    const t = el();
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
    }, ms);
  }

  global.Toast = { show: showToast };
})(window);
