import { StorageManager } from '../shared/utils/storage';

export class PopupBlocker {
  private storage = StorageManager.getInstance();
  private originalOpen = window.open;
  private blockedPopups = 0;
  private tier = 1;

  async init(): Promise<void> {
    const settings = await this.storage.getSettings();
    this.tier = settings.tier?.level || 1;

    // Activate for Tier 1+ (basic popup blocking)
    if (this.tier >= 1 && settings.enabled) {
      this.startBlocking();
      this.injectProtection();
    }

    // Listen for tier updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'tierUpdated') {
        this.tier = message.tier;
      }
    });
  }

  private startBlocking(): void {
    // Override window.open
    this.overrideWindowOpen();
    
    // Block popup triggers
    this.blockPopupTriggers();
    
    // Prevent new window/tab creation
    this.preventNewWindows();
    
    // Block notification popups for Tier 2+
    if (this.tier >= 2) {
      this.blockNotifications();
    }
  }

  private overrideWindowOpen(): void {
    // Store original window.open
    const self = this;
    
    window.open = function(...args: any[]): Window | null {
      const url = args[0] || '';
      const target = args[1] || '_blank';
      const features = args[2] || '';
      
      // Check if it's a popup
      const isPopup = self.isLikelyPopup(url, target, features);
      
      if (isPopup) {
        self.blockedPopups++;
        console.log('ShieldPro: Blocked popup:', url);
        
        // Send message to background
        chrome.runtime.sendMessage({
          action: 'adBlocked',
          category: 'other',
          domain: window.location.hostname
        });
        
        return null;
      }
      
      // Allow legitimate window.open calls
      return self.originalOpen.apply(window, args);
    };
  }

  private isLikelyPopup(url: string, target: string, features: string): boolean {
    // Empty URL is often a popup
    if (!url || url === 'about:blank') {
      return true;
    }
    
    // Check for popup features
    const popupFeatures = [
      'toolbar=no',
      'location=no',
      'directories=no',
      'status=no',
      'menubar=no',
      'scrollbars=no',
      'resizable=no',
      'width=',
      'height=',
      'top=',
      'left='
    ];
    
    if (popupFeatures.some(feature => features.toLowerCase().includes(feature))) {
      return true;
    }
    
    // Check for known ad/popup domains
    const popupDomains = [
      'doubleclick.net',
      'googleadservices.com',
      'googlesyndication.com',
      'popads.net',
      'popcash.net',
      'popunder.net',
      'propellerads.com',
      'adcash.com',
      'adskeeper.com',
      'adsrvr.org',
      'amazon-adsystem.com',
      'taboola.com',
      'outbrain.com',
      'mgid.com',
      'revcontent.com'
    ];
    
    if (popupDomains.some(domain => url.includes(domain))) {
      return true;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\/apu\.php/,
      /\/pup\.php/,
      /pop\.php/,
      /popup/i,
      /popunder/i,
      /click\.php/,
      /banner/i,
      /redirect/i,
      /track/i,
      /\/ad\//,
      /\/ads\//,
      /\/advertisement\//
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return true;
    }
    
    // Advanced checks for Tier 2+
    if (this.tier >= 2) {
      // Block all new windows with specific dimensions (common popup sizes)
      if (features.includes('width=') && features.includes('height=')) {
        const width = parseInt(features.match(/width=(\d+)/)?.[1] || '0');
        const height = parseInt(features.match(/height=(\d+)/)?.[1] || '0');
        
        // Common popup ad sizes
        const popupSizes = [
          { w: 720, h: 300 },
          { w: 320, h: 50 },
          { w: 300, h: 250 },
          { w: 336, h: 280 },
          { w: 728, h: 90 },
          { w: 468, h: 60 },
          { w: 234, h: 60 },
          { w: 88, h: 31 }
        ];
        
        if (popupSizes.some(size => Math.abs(width - size.w) < 50 && Math.abs(height - size.h) < 50)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private blockPopupTriggers(): void {
    // Block onclick popups
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Check for onclick attributes that might open popups
      if (target.onclick || target.getAttribute('onclick')) {
        const onclickStr = (target.onclick?.toString() || target.getAttribute('onclick') || '').toLowerCase();
        
        if (onclickStr.includes('window.open') || 
            onclickStr.includes('popup') || 
            onclickStr.includes('popunder')) {
          e.preventDefault();
          e.stopPropagation();
          this.blockedPopups++;
          console.log('ShieldPro: Blocked onclick popup');
        }
      }
      
      // Check for links that open in new windows suspiciously
      if (target.tagName === 'A' || target.closest('a')) {
        const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
        
        if (link.target === '_blank' && this.isSuspiciousLink(link.href)) {
          e.preventDefault();
          e.stopPropagation();
          this.blockedPopups++;
          console.log('ShieldPro: Blocked suspicious link popup');
        }
      }
    }, true);
    
    // Block popunders
    let popunderAttempt = false;
    window.addEventListener('blur', () => {
      popunderAttempt = true;
      setTimeout(() => { popunderAttempt = false; }, 1000);
    });
    
    window.addEventListener('focus', () => {
      if (popunderAttempt) {
        // Likely a popunder attempt
        console.log('ShieldPro: Detected potential popunder');
        window.focus();
      }
    });
  }

  private isSuspiciousLink(href: string): boolean {
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'short.link',
      'adf.ly', 'adfoc.us', 'shrink.me', 'shorte.st'
    ];
    
    return suspiciousDomains.some(domain => href.includes(domain));
  }

  private preventNewWindows(): void {
    // Override (window as any).showModalDialog (deprecated but still used)
    if ((window as any).showModalDialog) {
      (window as any).showModalDialog = () => {
        console.log('ShieldPro: Blocked showModalDialog');
        return undefined;
      };
    }
    
    // Block form submissions to new windows
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      
      if (form.target === '_blank') {
        const action = form.action || '';
        
        if (this.isSuspiciousLink(action)) {
          e.preventDefault();
          console.log('ShieldPro: Blocked form popup submission');
          this.blockedPopups++;
        }
      }
    }, true);
  }

  private blockNotifications(): void {
    // Override Notification API for Tier 2+
    const originalNotification = window.Notification;
    
    // Replace Notification constructor
    window.Notification = new Proxy(originalNotification, {
      construct(target, args) {
        console.log('ShieldPro: Blocked notification popup');
        return {} as Notification;
      }
    });
    
    // Override permission request
    Object.defineProperty(Notification, 'permission', {
      get: () => 'denied',
      configurable: false
    });
    
    Notification.requestPermission = async () => {
      console.log('ShieldPro: Blocked notification permission request');
      return 'denied';
    };
  }

  private injectProtection(): void {
    // Inject early protection script
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        // Store original functions
        const originalOpen = window.open;
        const originalAlert = window.alert;
        const originalConfirm = window.confirm;
        const originalPrompt = window.prompt;
        
        // Track popup attempts
        let popupAttempts = 0;
        const maxPopupsPerMinute = 2;
        const resetInterval = 60000; // 1 minute
        
        setInterval(() => {
          popupAttempts = 0;
        }, resetInterval);
        
        // Override window.open with rate limiting
        window.open = function(...args) {
          popupAttempts++;
          
          if (popupAttempts > maxPopupsPerMinute) {
            console.log('ShieldPro: Rate limit exceeded for popups');
            return null;
          }
          
          const url = args[0] || '';
          
          // Block suspicious URLs
          if (!url || url === 'about:blank' || url.includes('popup') || url.includes('ad')) {
            console.log('ShieldPro: Blocked suspicious popup:', url);
            return null;
          }
          
          return originalOpen.apply(window, args);
        };
        
        // For Tier 2+: Block annoying dialogs
        if (${this.tier} >= 2) {
          let dialogCount = 0;
          const maxDialogs = 1;
          
          window.alert = function(msg) {
            dialogCount++;
            if (dialogCount > maxDialogs) {
              console.log('ShieldPro: Blocked excessive alert');
              return;
            }
            return originalAlert.call(window, msg);
          };
          
          window.confirm = function(msg) {
            dialogCount++;
            if (dialogCount > maxDialogs) {
              console.log('ShieldPro: Blocked excessive confirm');
              return false;
            }
            return originalConfirm.call(window, msg);
          };
          
          window.prompt = function(msg, defaultText) {
            dialogCount++;
            if (dialogCount > maxDialogs) {
              console.log('ShieldPro: Blocked excessive prompt');
              return null;
            }
            return originalPrompt.call(window, msg, defaultText);
          };
          
          // Reset dialog count periodically
          setInterval(() => {
            dialogCount = 0;
          }, resetInterval);
        }
        
        // Prevent right-click popups
        document.addEventListener('contextmenu', function(e) {
          const target = e.target as HTMLElement;
          if (target.onclick || target.getAttribute('onclick')) {
            e.stopPropagation();
          }
        }, true);
        
        // Block beforeunload popups for Tier 2+
        if (${this.tier} >= 2) {
          window.addEventListener('beforeunload', function(e) {
            delete e.returnValue;
          }, true);
        }
      })();
    `;
    
    // Inject as early as possible
    if (document.documentElement) {
      document.documentElement.appendChild(script);
      script.remove();
    }
  }

  public getBlockedCount(): number {
    return this.blockedPopups;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const blocker = new PopupBlocker();
    blocker.init();
  });
} else {
  const blocker = new PopupBlocker();
  blocker.init();
}

export default PopupBlocker;