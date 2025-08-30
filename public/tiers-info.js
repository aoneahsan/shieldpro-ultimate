// Show the main content after a brief loading period
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const loadingElement = document.getElementById('loading');
    const mainContent = document.getElementById('main-content');
    
    if (loadingElement && mainContent) {
      loadingElement.style.display = 'none';
      mainContent.style.display = 'block';
    }
  }, 1000);
});

function openExtension() {
  // Try to open the extension popup
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.action.openPopup();
    });
  } else {
    // Fallback message
    alert('Please click on the ShieldPro extension icon in your browser toolbar to get started!');
  }
}

// Track page view for analytics
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.sendMessage({
    action: 'tierPageVisited',
    timestamp: Date.now()
  }).catch(() => {
    // Ignore if extension context not available
  });
}

// Make openExtension available globally
window.openExtension = openExtension;