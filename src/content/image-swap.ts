/**
 * Image Swap - Replaces blocked ads with beautiful images
 * Tier 3+ Feature
 */

interface ImageSwapSettings {
  enabled: boolean;
  categories: string[];
  customImages: string[];
  frequency: number;
  size: string;
}

class ImageSwapper {
  private settings: ImageSwapSettings = {
    enabled: false,
    categories: ['cats'],
    customImages: [],
    frequency: 25,
    size: 'original'
  };

  private imageProviders: Record<string, string[]> = {
    cats: [
      'https://cataas.com/cat',
      'https://cataas.com/cat/cute',
      'https://placekitten.com/300/250',
      'https://source.unsplash.com/300x250/?cat'
    ],
    dogs: [
      'https://placedog.net/300/250',
      'https://source.unsplash.com/300x250/?dog',
      'https://picsum.photos/300/250?random=dog'
    ],
    nature: [
      'https://picsum.photos/300/250?nature',
      'https://source.unsplash.com/300x250/?nature,landscape',
      'https://source.unsplash.com/300x250/?forest',
      'https://source.unsplash.com/300x250/?ocean'
    ],
    mountains: [
      'https://source.unsplash.com/300x250/?mountain',
      'https://source.unsplash.com/300x250/?alps',
      'https://picsum.photos/300/250?mountain'
    ],
    coffee: [
      'https://source.unsplash.com/300x250/?coffee',
      'https://source.unsplash.com/300x250/?cafe',
      'https://picsum.photos/300/250?coffee'
    ],
    space: [
      'https://source.unsplash.com/300x250/?space',
      'https://source.unsplash.com/300x250/?galaxy',
      'https://source.unsplash.com/300x250/?stars',
      'https://source.unsplash.com/300x250/?nebula'
    ],
    abstract: [
      'https://source.unsplash.com/300x250/?abstract',
      'https://source.unsplash.com/300x250/?pattern',
      'https://picsum.photos/300/250?blur=2'
    ],
    inspirational: [
      'https://source.unsplash.com/300x250/?inspiration',
      'https://source.unsplash.com/300x250/?motivation',
      'https://picsum.photos/300/250?grayscale'
    ]
  };

  private processedElements = new WeakSet<HTMLElement>();
  private observer: MutationObserver | null = null;

  constructor() {
    this.loadSettings();
    this.setupMessageListener();
  }

  private async loadSettings() {
    const result = await chrome.storage.local.get('settings');
    if (result.settings?.imageSwap) {
      this.settings = { ...this.settings, ...result.settings.imageSwap };
      
      if (this.settings.enabled) {
        this.startObserving();
      }
    }
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((_request, sender, _sendResponse) => {
      if (request.action === 'updateImageSwap') {
        this.settings = request.settings;
        if (this.settings.enabled) {
          this.startObserving();
          this.replaceBlockedElements();
        } else {
          this.stopObserving();
        }
        sendResponse({ success: true });
      }
      return true;
    });
  }

  private startObserving() {
    if (this.observer) return;

    this.observer = new MutationObserver((_mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement) {
              this.checkAndReplaceElement(_node);
            }
          });
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Process existing elements
    this.replaceBlockedElements();
  }

  private stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private replaceBlockedElements() {
    // Common ad container selectors
    const adSelectors = [
      // Generic ad containers
      '[class*="ad-"]:not([class*="add"]):not([class*="load"])',
      '[class*="ads-"]:not([class*="loads"])',
      '[id*="ad-"]:not([id*="add"]):not([id*="load"])',
      '[id*="ads-"]',
      '.advertisement',
      '.advertising',
      '.ad-container',
      '.ad-wrapper',
      '.ad-unit',
      '.banner-ad',
      '.display-ad',
      
      // Specific ad networks
      '.google-ads',
      '.googleads',
      '.doubleclick',
      '.adsense',
      
      // Hidden or blocked elements
      '[style*="display: none !important"]',
      '[style*="display:none!important"]',
      '[style*="visibility: hidden"]',
      '.blocked-element',
      
      // Empty containers that might have contained ads
      'div:empty:not([class]):not([id])',
      'iframe[src="about:blank"]',
      'iframe[src=""]'
    ];

    adSelectors.forEach(_selector => {
      try {
        const elements = document.querySelectorAll(_selector);
        elements.forEach(_element => {
          if (element instanceof HTMLElement && this.shouldReplaceElement(_element)) {
            this.replaceWithImage(_element);
          }
        });
      } catch (error) {
        console.error('Error with selector:', _selector, error);
      }
    });

    // Also check for elements hidden by ad blockers
    this.checkForBlockedElements();
  }

  private checkForBlockedElements() {
    // Look for elements that were likely hidden by ad blocking
    const allElements = document.querySelectorAll('div, _iframe, ins');
    
    allElements.forEach(_element => {
      if (element instanceof HTMLElement) {
        const computed = window.getComputedStyle(_element);
        const rect = element.getBoundingClientRect();
        
        // Check if element is hidden or has ad-like dimensions
        if (
          (computed.display === 'none' || 
           computed.visibility === 'hidden' ||
           rect.width === 0 || 
           rect.height === 0) &&
          this.isLikelyAdContainer(_element)
        ) {
          this.replaceWithImage(_element);
        }
      }
    });
  }

  private checkAndReplaceElement(element: HTMLElement) {
    if (this.shouldReplaceElement(_element)) {
      this.replaceWithImage(_element);
    }

    // Check child elements
    element.querySelectorAll('*').forEach(child => {
      if (child instanceof HTMLElement && this.shouldReplaceElement(_child)) {
        this.replaceWithImage(_child);
      }
    });
  }

  private shouldReplaceElement(element: HTMLElement): boolean {
    // Don't process the same element twice
    if (this.processedElements.has(_element)) {
      return false;
    }

    // Check replacement frequency
    if (Math.random() * 100 > this.settings.frequency) {
      return false;
    }

    // Check if it's likely an ad container
    return this.isLikelyAdContainer(_element);
  }

  private isLikelyAdContainer(element: HTMLElement): boolean {
    const classNames = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const tagName = element.tagName?.toLowerCase() || '';

    // Common ad indicators
    const adKeywords = [
      'ad', 'ads', 'adsense', 'doubleclick', 'banner',
      'sponsor', 'promoted', 'advertisement', 'marketing',
      'promo', 'commercial', 'widget'
    ];

    // Check for ad keywords
    const hasAdKeyword = adKeywords.some(keyword => {
      return (classNames.includes(_keyword) || id.includes(_keyword)) &&
             !classNames.includes('add') &&
             !classNames.includes('load') &&
             !id.includes('add') &&
             !id.includes('load');
    });

    // Check for iframe (common for ads)
    if (tagName === 'iframe' && !element.src) {
      return true;
    }

    // Check for specific ad network elements
    if (tagName === 'ins' && classNames.includes('adsbygoogle')) {
      return true;
    }

    // Check dimensions (common ad sizes)
    const rect = element.getBoundingClientRect();
    const commonAdSizes = [
      { w: 728, h: 90 },   // Leaderboard
      { w: 300, h: 250 },  // Medium Rectangle
      { w: 336, h: 280 },  // Large Rectangle
      { w: 300, h: 600 },  // Half Page
      { w: 320, h: 50 },   // Mobile Banner
      { w: 320, h: 100 },  // Large Mobile Banner
      { w: 250, h: 250 },  // Square
      { w: 200, h: 200 },  // Small Square
      { w: 468, h: 60 },   // Banner
      { w: 120, h: 600 },  // Skyscraper
      { w: 160, h: 600 },  // Wide Skyscraper
      { w: 300, h: 1050 }, // Portrait
      { w: 970, h: 90 },   // Large Leaderboard
      { w: 970, h: 250 },  // Billboard
      { w: 980, h: 120 },  // Panorama
      { w: 240, h: 400 },  // Vertical Rectangle
    ];

    const hasAdDimensions = commonAdSizes.some(size => {
      return Math.abs(rect.width - size.w) < 10 && Math.abs(rect.height - size.h) < 10;
    });

    return hasAdKeyword || hasAdDimensions;
  }

  private replaceWithImage(element: HTMLElement) {
    // Mark as processed
    this.processedElements.add(_element);

    // Get random image URL
    const imageUrl = this.getRandomImageUrl();
    if (!imageUrl) return;

    // Get element dimensions
    const rect = element.getBoundingClientRect();
    let width = rect.width || 300;
    let height = rect.height || 250;

    // Apply size settings
    if (this.settings.size === 'small') {
      width = Math.min(_width, 200);
      height = Math.min(_height, 150);
    } else if (this.settings.size === 'large') {
      width = Math.min(_width, 500);
      height = Math.min(_height, 400);
    }

    // Create replacement image
    const img = document.createElement('img');
    img.src = `${imageUrl}?w=${Math.round(_width)}&h=${Math.round(_height)}`;
    img.style.cssText = `
      width: ${width}px;
      height: ${height}px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: block;
      margin: 0 auto;
    `;
    img.alt = 'ShieldPro Image';
    img.loading = 'lazy';

    // Add ShieldPro watermark
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: ${width}px;
      height: ${height}px;
      margin: 0 auto;
    `;
    
    container.appendChild(_img);

    // Add subtle watermark
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      position: absolute;
      bottom: 5px;
      right: 5px;
      background: rgba(0,0,0,0.5);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: none;
    `;
    watermark.textContent = '🛡️ ShieldPro';
    container.appendChild(_watermark);

    // Replace or show the element
    if (element.parentNode) {
      // Make element visible first
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      
      // Clear content and add image
      element.innerHTML = '';
      element.appendChild(_container);
    }
  }

  private getRandomImageUrl(): string {
    const allImages: string[] = [];

    // Add images from selected categories
    this.settings.categories.forEach(category => {
      if (this.imageProviders[category]) {
        allImages.push(...this.imageProviders[category]);
      }
    });

    // Add custom images
    allImages.push(...this.settings.customImages);

    // Return random image
    if (allImages.length === 0) {
      // Default fallback
      return 'https://picsum.photos/300/250';
    }

    return allImages[Math.floor(Math.random() * allImages.length)];
  }
}

// Initialize image swapper
const imageSwapper = new ImageSwapper();

// Export for use in other modules
export { imageSwapper };