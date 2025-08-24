import { StorageManager } from '../shared/utils/storage';

export class ElementPicker {
  private isActive = false;
  private overlay: HTMLElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private highlightBox: HTMLElement | null = null;
  private toolbar: HTMLElement | null = null;
  private storage = StorageManager.getInstance();
  private customFilters: string[] = [];
  private tier = 1;

  async init(): Promise<void> {
    const settings = await this.storage.getSettings();
    this.tier = settings.tier?.level || 1;

    // Only available for Tier 3+
    if (this.tier < 3) {
      return;
    }

    // Listen for activation message
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'activateElementPicker') {
        this.activate();
      } else if (message.action === 'deactivateElementPicker') {
        this.deactivate();
      }
    });

    // Load custom filters
    this.loadCustomFilters();
  }

  private async loadCustomFilters(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('customFilters');
      this.customFilters = result.customFilters || [];
    } catch (error) {
      console.error('Failed to load custom filters:', error);
    }
  }

  private async saveCustomFilter(selector: string): Promise<void> {
    try {
      this.customFilters.push(selector);
      await chrome.storage.local.set({ customFilters: this.customFilters });
      
      // Apply the filter immediately
      this.applyCustomFilter(selector);
      
      // Send message to background
      chrome.runtime.sendMessage({
        action: 'customFilterAdded',
        selector: selector
      });
    } catch (error) {
      console.error('Failed to save custom filter:', error);
    }
  }

  private applyCustomFilter(selector: string): void {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    } catch (error) {
      console.error('Invalid selector:', selector);
    }
  }

  activate(): void {
    if (this.isActive || this.tier < 3) return;
    
    this.isActive = true;
    this.createOverlay();
    this.createToolbar();
    this.attachEventListeners();
    document.body.style.cursor = 'crosshair';
  }

  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.removeToolbar();
    this.removeHighlight();
    document.body.style.cursor = '';
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'shieldpro-element-picker-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483646;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.1);
    `;
    document.body.appendChild(this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'shieldpro-picker-toolbar';
    this.toolbar.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 16px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        min-width: 320px;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <svg style="width: 24px; height: 24px; margin-right: 8px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Element Picker</h3>
          <button id="shieldpro-picker-close" style="
            margin-left: auto;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
          ">
            <svg style="width: 20px; height: 20px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
            Hover over an element and click to block it
          </p>
          <div id="shieldpro-picker-info" style="
            background: #f3f4f6;
            border-radius: 8px;
            padding: 12px;
            min-height: 60px;
          ">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">Selected Element:</p>
            <code id="shieldpro-picker-selector" style="
              font-size: 12px;
              color: #1f2937;
              word-break: break-all;
            ">None</code>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="shieldpro-picker-block" style="
            flex: 1;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            disabled: true;
          " disabled>
            Block Element
          </button>
          <button id="shieldpro-picker-block-similar" style="
            flex: 1;
            background: #8b5cf6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            disabled: true;
          " disabled>
            Block Similar
          </button>
        </div>
        
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Tier 3 Feature • Custom Filters: <span id="shieldpro-filter-count">${this.customFilters.length}</span>
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.toolbar);
    
    // Add toolbar event listeners
    const closeBtn = this.toolbar.querySelector('#shieldpro-picker-close');
    const blockBtn = this.toolbar.querySelector('#shieldpro-picker-block') as HTMLButtonElement;
    const blockSimilarBtn = this.toolbar.querySelector('#shieldpro-picker-block-similar') as HTMLButtonElement;
    
    closeBtn?.addEventListener('click', () => this.deactivate());
    blockBtn?.addEventListener('click', () => this.blockSelected());
    blockSimilarBtn?.addEventListener('click', () => this.blockSimilar());
  }

  private removeToolbar(): void {
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
  }

  private attachEventListeners(): void {
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    const target = e.target as HTMLElement;
    if (this.isToolbarElement(target)) return;
    
    this.highlightElement(target);
  };

  private handleMouseOut = (e: MouseEvent): void => {
    if (!this.isActive) return;
    this.removeHighlight();
  };

  private handleClick = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    if (this.isToolbarElement(target)) return;
    
    this.selectElement(target);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isActive) return;
    
    if (e.key === 'Escape') {
      this.deactivate();
    }
  };

  private isToolbarElement(element: HTMLElement): boolean {
    return element.closest('#shieldpro-picker-toolbar') !== null ||
           element.closest('#shieldpro-element-highlight') !== null;
  }

  private highlightElement(element: HTMLElement): void {
    this.removeHighlight();
    
    const rect = element.getBoundingClientRect();
    
    this.highlightBox = document.createElement('div');
    this.highlightBox.id = 'shieldpro-element-highlight';
    this.highlightBox.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(59, 130, 246, 0.3);
      border: 2px solid #3b82f6;
      pointer-events: none;
      z-index: 2147483645;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    `;
    
    document.body.appendChild(this.highlightBox);
  }

  private removeHighlight(): void {
    if (this.highlightBox) {
      this.highlightBox.remove();
      this.highlightBox = null;
    }
  }

  private selectElement(element: HTMLElement): void {
    this.selectedElement = element;
    
    // Update toolbar info
    const selector = this.generateSelector(element);
    const selectorDisplay = this.toolbar?.querySelector('#shieldpro-picker-selector');
    const blockBtn = this.toolbar?.querySelector('#shieldpro-picker-block') as HTMLButtonElement;
    const blockSimilarBtn = this.toolbar?.querySelector('#shieldpro-picker-block-similar') as HTMLButtonElement;
    
    if (selectorDisplay) {
      selectorDisplay.textContent = selector;
    }
    
    if (blockBtn) {
      blockBtn.disabled = false;
      blockBtn.style.opacity = '1';
      blockBtn.style.cursor = 'pointer';
    }
    
    if (blockSimilarBtn) {
      blockSimilarBtn.disabled = false;
      blockSimilarBtn.style.opacity = '1';
      blockSimilarBtn.style.cursor = 'pointer';
    }
    
    // Highlight selected element
    const rect = element.getBoundingClientRect();
    if (this.highlightBox) {
      this.highlightBox.style.background = 'rgba(239, 68, 68, 0.3)';
      this.highlightBox.style.borderColor = '#ef4444';
      this.highlightBox.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
    }
  }

  private generateSelector(element: HTMLElement): string {
    // Try to generate a unique selector
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Generate a path selector
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c.length > 0);
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  private blockSelected(): void {
    if (!this.selectedElement) return;
    
    const selector = this.generateSelector(this.selectedElement);
    this.saveCustomFilter(selector);
    
    // Hide the element immediately
    this.selectedElement.style.display = 'none';
    
    // Update filter count
    const filterCount = this.toolbar?.querySelector('#shieldpro-filter-count');
    if (filterCount) {
      filterCount.textContent = String(this.customFilters.length);
    }
    
    // Show confirmation
    this.showNotification('Element blocked successfully!');
    
    // Reset selection
    this.selectedElement = null;
    this.removeHighlight();
  }

  private blockSimilar(): void {
    if (!this.selectedElement) return;
    
    // Generate a more generic selector for similar elements
    let selector = '';
    
    if (this.selectedElement.className && typeof this.selectedElement.className === 'string') {
      const classes = this.selectedElement.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        selector = `.${classes[0]}`;
      }
    } else {
      selector = this.selectedElement.tagName.toLowerCase();
    }
    
    // Find and block all similar elements
    const similarElements = document.querySelectorAll(selector);
    let blockedCount = 0;
    
    similarElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
      blockedCount++;
    });
    
    // Save the filter
    this.saveCustomFilter(selector);
    
    // Update filter count
    const filterCount = this.toolbar?.querySelector('#shieldpro-filter-count');
    if (filterCount) {
      filterCount.textContent = String(this.customFilters.length);
    }
    
    // Show confirmation
    this.showNotification(`Blocked ${blockedCount} similar elements!`);
    
    // Reset selection
    this.selectedElement = null;
    this.removeHighlight();
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const picker = new ElementPicker();
    picker.init();
  });
} else {
  const picker = new ElementPicker();
  picker.init();
}

export default ElementPicker;