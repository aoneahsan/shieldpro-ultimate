// Theme loader - Apply saved theme before React loads to prevent flash
(function() {
  try {
    // Check if we're in extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['theme'], function(result) {
        const theme = result.theme || 'system';
        applyTheme(theme);
      });
    } else {
      // Fallback to localStorage for development
      const theme = localStorage.getItem('theme') || 'system';
      applyTheme(theme);
    }
  } catch (e) {
    console.error('Theme loader error:', e);
    applyTheme('system');
  }

  function applyTheme(theme) {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
})();