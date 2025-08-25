/**
 * Privacy Protection Content Script - Tier 4 Features
 * Handles canvas fingerprinting, WebRTC leak protection, and advanced privacy features
 */

class PrivacyProtection {
  private enabled: boolean = true;
  private canvasProtectionEnabled: boolean = true;
  private webrtcProtectionEnabled: boolean = true;
  private audioFingerprintProtectionEnabled: boolean = true;
  private fontFingerprintProtectionEnabled: boolean = true;
  private originalMethods: Map<string, Function> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load settings
    const settings = await chrome.storage.local.get(['privacySettings', 'tierLevel']);
    const privacySettings = settings.privacySettings || {};
    const tierLevel = settings.tierLevel || 1;

    // Only enable for Tier 4+
    if (tierLevel < 4) {
      return;
    }

    this.canvasProtectionEnabled = privacySettings.canvasProtection !== false;
    this.webrtcProtectionEnabled = privacySettings.webrtcProtection !== false;
    this.audioFingerprintProtectionEnabled = privacySettings.audioFingerprintProtection !== false;
    this.fontFingerprintProtectionEnabled = privacySettings.fontFingerprintProtection !== false;

    // Apply protections
    if (this.canvasProtectionEnabled) {
      this.protectCanvasFingerprinting();
    }
    if (this.webrtcProtectionEnabled) {
      this.protectWebRTC();
    }
    if (this.audioFingerprintProtectionEnabled) {
      this.protectAudioFingerprinting();
    }
    if (this.fontFingerprintProtectionEnabled) {
      this.protectFontFingerprinting();
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.privacySettings) {
        this.updateSettings(changes.privacySettings.newValue);
      }
    });

    console.log('Privacy protection initialized');
  }

  /**
   * Protect against canvas fingerprinting
   */
  private protectCanvasFingerprinting(): void {
    const canvas2DContext = CanvasRenderingContext2D.prototype;
    const webglContext = WebGLRenderingContext.prototype;
    const webgl2Context = WebGL2RenderingContext?.prototype;

    // Store original methods
    this.originalMethods.set('getImageData', canvas2DContext.getImageData);
    this.originalMethods.set('toDataURL', HTMLCanvasElement.prototype.toDataURL);
    this.originalMethods.set('toBlob', HTMLCanvasElement.prototype.toBlob);

    // Override Canvas 2D methods
    const addNoise = (imageData: ImageData) => {
      const data = imageData.data;
      // Add minimal random noise to prevent fingerprinting
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.001) { // Very low chance to maintain visual quality
          data[i] = Math.min(255, Math.max(0, data[i] + (Math.random() * 2 - 1)));     // Red
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (Math.random() * 2 - 1))); // Green  
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (Math.random() * 2 - 1))); // Blue
        }
      }
      return imageData;
    };

    // Override getImageData
    canvas2DContext.getImageData = function(sx: number, sy: number, sw: number, sh: number) {
      const imageData = (PrivacyProtection.prototype.originalMethods.get('getImageData') as Function).call(this, sx, sy, sw, sh);
      return addNoise(imageData);
    };

    // Override toDataURL
    HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: number) {
      // Add slight randomness to canvas output
      const context = this.getContext('2d');
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        context.putImageData(addNoise(imageData), 0, 0);
      }
      return (PrivacyProtection.prototype.originalMethods.get('toDataURL') as Function).call(this, type, quality);
    };

    // Override toBlob
    HTMLCanvasElement.prototype.toBlob = function(callback: BlobCallback, type?: string, quality?: number) {
      const context = this.getContext('2d');
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        context.putImageData(addNoise(imageData), 0, 0);
      }
      return (PrivacyProtection.prototype.originalMethods.get('toBlob') as Function).call(this, callback, type, quality);
    };

    // WebGL fingerprint protection
    if (webglContext) {
      const originalGetParameter = webglContext.getParameter;
      webglContext.getParameter = function(pname: number) {
        // Spoof common fingerprinting parameters
        switch (pname) {
          case this.VENDOR:
            return 'Google Inc. (Generic)';
          case this.RENDERER:
            return 'ANGLE (Generic GPU, D3D11)';
          case this.VERSION:
            return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
          case (this as any).UNMASKED_VENDOR_WEBGL:
            return 'Google Inc. (Generic)';
          case (this as any).UNMASKED_RENDERER_WEBGL:
            return 'ANGLE (Generic GPU, D3D11)';
          default:
            return originalGetParameter.call(this, pname);
        }
      };
    }

    if (webgl2Context) {
      const originalGetParameter = webgl2Context.getParameter;
      webgl2Context.getParameter = function(pname: number) {
        switch (pname) {
          case this.VENDOR:
            return 'Google Inc. (Generic)';
          case this.RENDERER:
            return 'ANGLE (Generic GPU, D3D11)';
          case this.VERSION:
            return 'WebGL 2.0 (OpenGL ES 3.0 Chromium)';
          case (this as any).UNMASKED_VENDOR_WEBGL:
            return 'Google Inc. (Generic)';
          case (this as any).UNMASKED_RENDERER_WEBGL:
            return 'ANGLE (Generic GPU, D3D11)';
          default:
            return originalGetParameter.call(this, pname);
        }
      };
    }

    console.log('Canvas fingerprint protection activated');
  }

  /**
   * Protect against WebRTC IP leak
   */
  private protectWebRTC(): void {
    // Block access to RTCPeerConnection
    const originalRTCPeerConnection = (window as any).RTCPeerConnection;
    const originalWebkitRTCPeerConnection = (window as any).webkitRTCPeerConnection;
    const originalMozRTCPeerConnection = (window as any).mozRTCPeerConnection;

    // Store originals
    this.originalMethods.set('RTCPeerConnection', originalRTCPeerConnection);
    this.originalMethods.set('webkitRTCPeerConnection', originalWebkitRTCPeerConnection);
    this.originalMethods.set('mozRTCPeerConnection', originalMozRTCPeerConnection);

    // Create proxy that filters out IP-revealing methods
    const createRTCProxy = (OriginalRTC: any) => {
      return new Proxy(OriginalRTC, {
        construct(target, args) {
          const instance = new target(...args);
          
          // Override createDataChannel to prevent IP leaks
          const originalCreateDataChannel = instance.createDataChannel;
          instance.createDataChannel = function(...args: any[]) {
            // Allow data channels but with restrictions
            return originalCreateDataChannel.apply(this, args);
          };

          // Override createOffer to filter out IP-revealing candidates
          const originalCreateOffer = instance.createOffer;
          instance.createOffer = function(options?: RTCOfferOptions) {
            return originalCreateOffer.call(this, {
              ...options,
              offerToReceiveAudio: false,
              offerToReceiveVideo: false
            });
          };

          // Override setLocalDescription to filter SDP
          const originalSetLocalDescription = instance.setLocalDescription;
          instance.setLocalDescription = function(description: RTCSessionDescriptionInit) {
            if (description.sdp) {
              // Remove IP addresses from SDP
              description.sdp = description.sdp.replace(
                /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]*:[a-f0-9]*:[a-f0-9]*:[a-f0-9]*:[a-f0-9]*:[a-f0-9]*:[a-f0-9]*:[a-f0-9]*)/g,
                '0.0.0.0'
              );
            }
            return originalSetLocalDescription.call(this, description);
          };

          return instance;
        }
      });
    };

    // Replace WebRTC constructors
    if (originalRTCPeerConnection) {
      (window as any).RTCPeerConnection = createRTCProxy(originalRTCPeerConnection);
    }
    if (originalWebkitRTCPeerConnection) {
      (window as any).webkitRTCPeerConnection = createRTCProxy(originalWebkitRTCPeerConnection);
    }
    if (originalMozRTCPeerConnection) {
      (window as any).mozRTCPeerConnection = createRTCProxy(originalMozRTCPeerConnection);
    }

    console.log('WebRTC leak protection activated');
  }

  /**
   * Protect against audio fingerprinting
   */
  private protectAudioFingerprinting(): void {
    const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    
    if (audioContext) {
      const originalCreateAnalyser = audioContext.prototype.createAnalyser;
      const originalCreateDynamicsCompressor = audioContext.prototype.createDynamicsCompressor;
      // const originalCreateOscillator = audioContext.prototype.createOscillator;

      // Override createAnalyser to add noise
      audioContext.prototype.createAnalyser = function() {
        const analyser = originalCreateAnalyser.call(this);
        const originalGetFrequencyData = analyser.getFloatFrequencyData;
        
        analyser.getFloatFrequencyData = function(array: Float32Array) {
          originalGetFrequencyData.call(this, array);
          // Add minimal noise to frequency data
          for (let i = 0; i < array.length; i++) {
            if (array[i] !== undefined) {
              array[i] += (Math.random() - 0.5) * 0.0001;
            }
          }
        };
        
        return analyser;
      };

      // Override createDynamicsCompressor to randomize parameters
      audioContext.prototype.createDynamicsCompressor = function() {
        const compressor = originalCreateDynamicsCompressor.call(this);
        
        // Add slight randomness to compressor parameters
        const originalThreshold = Object.getOwnPropertyDescriptor(compressor, 'threshold') || 
                                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(compressor), 'threshold');
        
        if (originalThreshold && originalThreshold.get) {
          Object.defineProperty(compressor, 'threshold', {
            get: function() {
              const value = originalThreshold.get!.call(this);
              return { ...value, value: value.value + (Math.random() - 0.5) * 0.001 };
            },
            configurable: true
          });
        }
        
        return compressor;
      };

      console.log('Audio fingerprint protection activated');
    }
  }

  /**
   * Protect against font fingerprinting
   */
  private protectFontFingerprinting(): void {
    // Override font detection methods
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      const originalMeasureText = context.measureText;
      
      context.measureText = function(text: string) {
        const metrics = originalMeasureText.call(this, text);
        
        // Add slight randomness to text metrics
        return {
          ...metrics,
          width: metrics.width + (Math.random() - 0.5) * 0.1,
          actualBoundingBoxLeft: (metrics.actualBoundingBoxLeft || 0) + (Math.random() - 0.5) * 0.1,
          actualBoundingBoxRight: (metrics.actualBoundingBoxRight || 0) + (Math.random() - 0.5) * 0.1
        };
      };
    }

    // Spoof font availability
    const originalOffscreenCanvas = (window as any).OffscreenCanvas;
    if (originalOffscreenCanvas) {
      (window as any).OffscreenCanvas = function(...args: any[]) {
        const canvas = new originalOffscreenCanvas(...args);
        const context = canvas.getContext('2d');
        
        if (context && context.measureText) {
          const originalMeasureText = context.measureText;
          context.measureText = function(text: string) {
            const metrics = originalMeasureText.call(this, text);
            return {
              ...metrics,
              width: metrics.width + (Math.random() - 0.5) * 0.1
            };
          };
        }
        
        return canvas;
      };
    }

    console.log('Font fingerprint protection activated');
  }

  /**
   * Update privacy settings
   */
  private updateSettings(newSettings: any): void {
    this.canvasProtectionEnabled = newSettings.canvasProtection !== false;
    this.webrtcProtectionEnabled = newSettings.webrtcProtection !== false;
    this.audioFingerprintProtectionEnabled = newSettings.audioFingerprintProtection !== false;
    this.fontFingerprintProtectionEnabled = newSettings.fontFingerprintProtection !== false;

    // Re-initialize protections if enabled
    if (this.canvasProtectionEnabled) {
      this.protectCanvasFingerprinting();
    }
    if (this.webrtcProtectionEnabled) {
      this.protectWebRTC();
    }
    if (this.audioFingerprintProtectionEnabled) {
      this.protectAudioFingerprinting();
    }
    if (this.fontFingerprintProtectionEnabled) {
      this.protectFontFingerprinting();
    }
  }

  /**
   * Enable basic tracking protection (Tier 2)
   */
  public enableTrackingProtection(): void {
    // Basic tracking protection is handled by declarativeNetRequest
    // This method is for additional protections
    console.log('Basic tracking protection enabled');
  }

  /**
   * Enable advanced protection features (Tier 4)
   */
  public enableAdvancedProtection(): void {
    this.enabled = true;
    // Advanced protections are initialized in constructor
    console.log('Advanced privacy protection enabled');
  }

  /**
   * Enable element picker functionality (Tier 3)
   */
  public enable(): void {
    this.enabled = true;
    console.log('Privacy protection enabled');
  }

  /**
   * Disable all privacy protections
   */
  public disable(): void {
    this.enabled = false;
    
    // Restore original methods
    if (this.originalMethods.has('getImageData')) {
      CanvasRenderingContext2D.prototype.getImageData = this.originalMethods.get('getImageData') as any;
    }
    if (this.originalMethods.has('toDataURL')) {
      HTMLCanvasElement.prototype.toDataURL = this.originalMethods.get('toDataURL') as any;
    }
    if (this.originalMethods.has('toBlob')) {
      HTMLCanvasElement.prototype.toBlob = this.originalMethods.get('toBlob') as any;
    }
    if (this.originalMethods.has('RTCPeerConnection')) {
      (window as any).RTCPeerConnection = this.originalMethods.get('RTCPeerConnection');
    }
    
    console.log('Privacy protection disabled');
  }

  /**
   * Get protection status
   */
  public getStatus(): any {
    return {
      enabled: this.enabled,
      canvasProtection: this.canvasProtectionEnabled,
      webrtcProtection: this.webrtcProtectionEnabled,
      audioFingerprintProtection: this.audioFingerprintProtectionEnabled,
      fontFingerprintProtection: this.fontFingerprintProtectionEnabled
    };
  }
}

// Initialize privacy protection
const privacyProtection = new PrivacyProtection();

// Export for debugging
(window as any).shieldProPrivacy = privacyProtection;

// Export the class
export { PrivacyProtection };
// Also export with the name used in imports
export { PrivacyProtection as PrivacyProtector };