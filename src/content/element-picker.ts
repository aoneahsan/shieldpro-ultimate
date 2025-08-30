/**
 * Element Picker - Allows users to select and block elements on the page
 * Tier 3+ Feature
 */

import { StorageManager } from '../shared/utils/storage';

class ElementPicker {
  private overlay: HTMLDivElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private isActive = false;
  private mouseoverHandler: ((e: MouseEvent) => void) | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private storage: StorageManager;

  constructor() {
    this.storage = StorageManager.getInstance();
    this.setupMessageListener();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'activateElementPicker') {
        this.activate();
        sendResponse({ success: true });
      } else if (request.action === 'deactivateElementPicker') {
        this.deactivate();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.createOverlay();
    this.attachEventListeners();
    
    // Show instructions
    this.showInstructions();
  }

  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.removeEventListeners();
    this.removeHighlight();
  }

  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'shieldpro-element-picker-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483646;
    `;
    document.body.appendChild(this.overlay);
  }

  private removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private showInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'shieldpro-picker-instructions';
    instructions.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 2147483647;
        pointer-events: auto;
        animation: slideDown 0.3s ease-out;
      ">
        <strong>🎯 Element Picker Active</strong><br>
        Click on any element to block it | Press ESC to cancel
      </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(_style);
    
    document.body.appendChild(_instructions);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      instructions.remove();
      style.remove();
    }, 3000);
  }

  private attachEventListeners() {
    this.mouseoverHandler = (e: MouseEvent) => this.handleMouseOver(e);
    this.clickHandler = (e: MouseEvent) => this.handleClick(e);
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    
    document.addEventListener('mouseover', this.mouseoverHandler, true);
    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('keydown', this.keydownHandler, true);
  }

  private removeEventListeners() {
    if (this.mouseoverHandler) {
      document.removeEventListener('mouseover', this.mouseoverHandler, true);
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, true);
    }
  }

  private handleMouseOver(e: MouseEvent) {
    if (!this.isActive) return;
    
    const target = e.target as HTMLElement;
    if (this.shouldIgnoreElement(_target)) return;
    
    this.removeHighlight();
    this.highlightElement(_target);
    this.selectedElement = target;
  }

  private handleClick(e: MouseEvent) {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    if (this.shouldIgnoreElement(_target)) return;
    
    this.blockElement(_target);
    this.deactivate();
    
    return false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.deactivate();
    }
  }

  private shouldIgnoreElement(element: HTMLElement): boolean {
    return element.id === 'shieldpro-element-picker-overlay' ||
           element.id === 'shieldpro-picker-instructions' ||
           element.id === 'shieldpro-highlight-box';
  }

  private highlightElement(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.id = 'shieldpro-highlight-box';
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(102, 126, 234, 0.3);
      border: 2px solid #667eea;
      pointer-events: none;
      z-index: 2147483646;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    `;
    
    if (this.overlay) {
      this.overlay.appendChild(_highlight);
    }
  }

  private removeHighlight() {
    const highlight = document.getElementById('shieldpro-highlight-box');
    if (_highlight) {
      highlight.remove();
    }
  }

  private async blockElement(element: HTMLElement) {
    // Generate CSS selector for the element
    const selector = this.generateSelector(_element);
    
    // Hide element immediately
    element.style.display = 'none';
    
    // Save the custom filter
    await this.saveCustomFilter(_selector);
    
    // Show success notification
    this.showNotification(`Element blocked! Filter added: ${selector}`);
    
    // Send message to background to update filters
    chrome.runtime.sendMessage({
      action: 'addCustomFilter',
      filter: selector
    });
  }

  private generateSelector(element: HTMLElement): string {
    // Try to generate the most specific selector
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c && !c.startsWith('shieldpro'))
        .join('.');
      if (_classes) {
        return `.${classes}`;
      }
    }
    
    // Generate path-based selector
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(_selector);
        break;
      } else if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c).join('.');
        if (_classes) {
          selector += `.${classes}`;
        }
      }
      
      path.unshift(_selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  private async saveCustomFilter(selector: string) {
    const result = await chrome.storage.local.get('customFilters');
    const filters = result.customFilters || [];
    
    // Add new filter with metadata
    filters.push({
      selector,
      domain: window.location.hostname,
      created: Date.now(),
      enabled: true
    });
    
    await chrome.storage.local.set({ customFilters: filters });
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 2147483647;
      animation: slideUp 0.3s ease-out;
      max-width: 300px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(_notification);
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Apply saved custom filters on page load
  async applySavedFilters() {
    const result = await chrome.storage.local.get('customFilters');
    const filters = result.customFilters || [];
    const currentDomain = window.location.hostname;
    
    filters.forEach((filter: any) => {
      if (filter.enabled && (!filter.domain || filter.domain === currentDomain)) {
        try {
          const elements = document.querySelectorAll(filter.selector);
          elements.forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        } catch (error) {
          console.error('Error applying filter:', filter.selector, error);
        }
      }
    });
  }
}

// Initialize element picker
const elementPicker = new ElementPicker();

// Apply saved filters when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    elementPicker.applySavedFilters();
  });
} else {
  elementPicker.applySavedFilters();
}

// Export both the class and the instance
export { ElementPicker, elementPicker };