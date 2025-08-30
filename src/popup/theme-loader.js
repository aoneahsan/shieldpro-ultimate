// Theme loader script for popup
(function() {
  // First check localStorage for immediate sync access
  const cachedTheme = localStorage.getItem('shieldpro_theme');
  if (cachedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }
  
  // Then load from Chrome storage to ensure it's up to date
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['themeSettings'], function(result) {
      if (result.themeSettings) {
        const { theme } = result.themeSettings;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('shieldpro_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          localStorage.setItem('shieldpro_theme', theme || 'light');
        }
      } else {
        // Check system preference as fallback
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          localStorage.setItem('shieldpro_theme', 'dark');
        }
      }
      // Show body after theme is loaded
      document.body.classList.add('theme-loaded');
    });
  } else {
    // If chrome storage not available, show body anyway
    document.body.classList.add('theme-loaded');
  }
})();