console.log('ShieldPro Ultimate - Injector Script Loaded');

const script = document.createElement('script');
script.textContent = `
  (function() {
    const originalOpen = window.open;
    window.open = function(...args) {
      console.log('Popup blocked:', args[0]);
      return null;
    };
    
    const originalAlert = window.alert;
    window.alert = function(message) {
      console.log('Alert blocked:', message);
    };
    
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
      console.log('Confirm blocked:', message);
      return false;
    };
    
    Object.defineProperty(document, 'oncontextmenu', {
      set: function() {
        console.log('Context menu blocking attempt prevented');
      }
    });
  })();
`;

if (document.documentElement) {
  document.documentElement.appendChild(script);
  script.remove();
}

export {};