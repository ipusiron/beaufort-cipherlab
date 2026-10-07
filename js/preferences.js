// Apply preferences before the stylesheet to avoid a light/dark flash.
(function () {
  let theme, language;
  try {
    theme = localStorage.getItem('beaufort.theme');
    language = localStorage.getItem('beaufort.language');
  } catch { /* Preferences are optional. */ }
  document.documentElement.classList.toggle('dark', theme === 'dark' ||
    (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches));
  const query = new URLSearchParams(location.search).get('lang');
  document.documentElement.lang = ['ja', 'en'].includes(query) ? query :
    ['ja', 'en'].includes(language) ? language : navigator.language.startsWith('ja') ? 'ja' : 'en';
})();
