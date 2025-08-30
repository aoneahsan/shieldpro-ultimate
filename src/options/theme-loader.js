// Theme loader script for options page
(function() {
  // First check localStorage for immediate sync access
  const cachedTheme = localStorage.getItem('shieldpro_theme');
  if (cachedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  // Then check Chrome storage for saved theme
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['themeSettings'], function(result) {
      if (result.themeSettings && result.themeSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('shieldpro_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('shieldpro_theme', 'light');
      }
    });
  }
})();