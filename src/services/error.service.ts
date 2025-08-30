import { auth } from '../utils/firebase';

export enum ErrorCode {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Tier Errors
  TIER_UPGRADE_FAILED = 'TIER_UPGRADE_FAILED',
  TIER_REQUIREMENTS_NOT_MET = 'TIER_REQUIREMENTS_NOT_MET',
  TIER_INVALID_LEVEL = 'TIER_INVALID_LEVEL',
  
  // Network Errors
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  
  // Storage Errors
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
  
  // Extension Errors
  EXTENSION_NOT_INSTALLED = 'EXTENSION_NOT_INSTALLED',
  EXTENSION_DISABLED = 'EXTENSION_DISABLED',
  EXTENSION_UPDATE_REQUIRED = 'EXTENSION_UPDATE_REQUIRED',
  
  // Firebase Errors
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',
  FIREBASE_ALREADY_EXISTS = 'FIREBASE_ALREADY_EXISTS',
  FIREBASE_RATE_LIMITED = 'FIREBASE_RATE_LIMITED',
  
  // General Errors
  INVALID_INPUT = 'INVALID_INPUT',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: number;
  userId?: string;
  action?: string;
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
}

class ErrorService {
  private errorLog: ErrorDetails[] = [];
  private maxLogSize = 100;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.loadErrorLog();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (_event) => {
      this.handleError(new Error(event.reason), 'UNHANDLED_PROMISE');
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (_event) => {
      this.handleError(event.error, 'GLOBAL_ERROR');
      event.preventDefault();
    });
  }

  private async loadErrorLog() {
    try {
      const stored = await chrome.storage.local.get('errorLog');
      if (stored.errorLog) {
        this.errorLog = stored.errorLog;
      }
    } catch (_error) {
      console.error('Failed to load error log:', error);
    }
  }

  private async saveErrorLog() {
    try {
      // Keep only recent errors
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog = this.errorLog.slice(-this.maxLogSize);
      }
      await chrome.storage.local.set({ errorLog: this.errorLog });
    } catch (_error) {
      console.error('Failed to save error log:', error);
    }
  }

  public handleError(error: any, action?: string): ErrorDetails {
    const errorDetails = this.parseError(error, action);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', _errorDetails);
    }

    // Add to error log
    this.errorLog.push(_errorDetails);
    this.saveErrorLog();

    // Send to analytics if available
    this.reportToAnalytics(_errorDetails);

    // Show user notification if critical
    if (this.isCriticalError(_errorDetails)) {
      this.showUserNotification(_errorDetails);
    }

    return errorDetails;
  }

  private parseError(error: any, action?: string): ErrorDetails {
    let code = ErrorCode.UNKNOWN_ERROR;
    let message = 'An unexpected error occurred';
    let recoverable = true;
    let retryable = false;
    let userMessage = 'Something went wrong. Please try again.';

    // Parse Firebase auth errors
    if (error?.code?.startsWith('auth/')) {
      const authError = this.parseAuthError(error);
      code = authError.code;
      message = authError.message;
      userMessage = authError.userMessage;
      recoverable = authError.recoverable;
      retryable = authError.retryable;
    }
    // Parse Firebase Firestore errors
    else if (error?.code?.startsWith('firestore/')) {
      const firestoreError = this.parseFirestoreError(error);
      code = firestoreError.code;
      message = firestoreError.message;
      userMessage = firestoreError.userMessage;
      recoverable = firestoreError.recoverable;
      retryable = firestoreError.retryable;
    }
    // Parse network errors
    else if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
      code = ErrorCode.NETWORK_REQUEST_FAILED;
      message = 'Network request failed';
      userMessage = 'Please check your internet connection and try again.';
      retryable = true;
    }
    // Parse storage errors
    else if (error?.name === 'QuotaExceededError') {
      code = ErrorCode.STORAGE_QUOTA_EXCEEDED;
      message = 'Storage quota exceeded';
      userMessage = 'Storage is full. Please clear some data and try again.';
      recoverable = false;
    }
    // Generic error
    else if (error?.message) {
      message = error.message;
    }

    return {
      code,
      message,
      details: error,
      timestamp: Date.now(),
      userId: auth.currentUser?.uid,
      action,
      recoverable,
      retryable,
      userMessage
    };
  }

  private parseAuthError(error: any): Partial<ErrorDetails> {
    const errorMap: Record<string, Partial<ErrorDetails>> = {
      'auth/user-not-found': {
        code: ErrorCode.AUTH_USER_NOT_FOUND,
        message: 'User account not found',
        userMessage: 'No account found with this email. Please sign up first.',
        recoverable: true,
        retryable: false
      },
      'auth/wrong-password': {
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid password',
        userMessage: 'Incorrect password. Please try again.',
        recoverable: true,
        retryable: true
      },
      'auth/email-already-in-use': {
        code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
        message: 'Email already registered',
        userMessage: 'This email is already registered. Please sign in instead.',
        recoverable: true,
        retryable: false
      },
      'auth/weak-password': {
        code: ErrorCode.AUTH_WEAK_PASSWORD,
        message: 'Password too weak',
        userMessage: 'Password must be at least 6 characters long.',
        recoverable: true,
        retryable: false
      },
      'auth/expired-action-code': {
        code: ErrorCode.AUTH_EXPIRED_TOKEN,
        message: 'Action code expired',
        userMessage: 'This link has expired. Please request a new one.',
        recoverable: true,
        retryable: false
      },
      'auth/unauthorized': {
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: 'Unauthorized access',
        userMessage: 'You are not authorized to perform this action.',
        recoverable: false,
        retryable: false
      }
    };

    return errorMap[error.code] || {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'Authentication failed. Please try again.',
      recoverable: true,
      retryable: true
    };
  }

  private parseFirestoreError(error: any): Partial<ErrorDetails> {
    const errorMap: Record<string, Partial<ErrorDetails>> = {
      'permission-denied': {
        code: ErrorCode.FIREBASE_PERMISSION_DENIED,
        message: 'Permission denied',
        userMessage: 'You do not have permission to perform this action.',
        recoverable: false,
        retryable: false
      },
      'not-found': {
        code: ErrorCode.FIREBASE_NOT_FOUND,
        message: 'Document not found',
        userMessage: 'The requested data was not found.',
        recoverable: true,
        retryable: false
      },
      'already-exists': {
        code: ErrorCode.FIREBASE_ALREADY_EXISTS,
        message: 'Document already exists',
        userMessage: 'This item already exists.',
        recoverable: true,
        retryable: false
      },
      'resource-exhausted': {
        code: ErrorCode.FIREBASE_RATE_LIMITED,
        message: 'Rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment and try again.',
        recoverable: true,
        retryable: true
      }
    };

    return errorMap[error.code] || {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'Database operation failed. Please try again.',
      recoverable: true,
      retryable: true
    };
  }

  private isCriticalError(error: ErrorDetails): boolean {
    const criticalCodes = [
      ErrorCode.STORAGE_QUOTA_EXCEEDED,
      ErrorCode.EXTENSION_NOT_INSTALLED,
      ErrorCode.EXTENSION_DISABLED,
      ErrorCode.AUTH_UNAUTHORIZED,
      ErrorCode.FIREBASE_PERMISSION_DENIED
    ];
    
    return criticalCodes.includes(error.code) || !error.recoverable;
  }

  private showUserNotification(error: ErrorDetails) {
    if (chrome?.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: 'ShieldPro Error',
        message: error.userMessage,
        priority: 2
      });
    }
  }

  private reportToAnalytics(error: ErrorDetails) {
    // Send to analytics service if configured
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: !error.recoverable
      });
    }
  }

  public async retry<T>(
    operation: () => Promise<T>,
    errorCode: string,
    maxAttempts = this.maxRetries
  ): Promise<T> {
    const attempts = this.retryAttempts.get(_errorCode) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(_errorCode);
      return result;
    } catch (_error) {
      const errorDetails = this.handleError(error, errorCode);
      
      if (errorDetails.retryable && attempts < maxAttempts) {
        this.retryAttempts.set(_errorCode, attempts + 1);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, _attempts), 10000);
        await new Promise(resolve => setTimeout(_resolve, delay));
        
        return this.retry(_operation, errorCode, _maxAttempts);
      }
      
      this.retryAttempts.delete(_errorCode);
      throw error;
    }
  }

  public clearErrorLog() {
    this.errorLog = [];
    this.saveErrorLog();
  }

  public getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public getRecentErrors(count = 10): ErrorDetails[] {
    return this.errorLog.slice(-count);
  }

  public getErrorsByCode(code: ErrorCode): ErrorDetails[] {
    return this.errorLog.filter(error => error.code === code);
  }

  public async reportBug(
    description: string,
    category: 'bug' | 'feature' | 'other',
    includeErrorLog = true
  ) {
    const report = {
      description,
      category,
      timestamp: Date.now(),
      userId: auth.currentUser?.uid,
      browser: navigator.userAgent,
      version: chrome.runtime.getManifest().version,
      errorLog: includeErrorLog ? this.getRecentErrors() : []
    };

    try {
      // Send to Firebase or bug tracking service
      console.log('Bug report:', _report);
      return { success: true };
    } catch (_error) {
      this.handleError(error, 'BUG_REPORT');
      return { success: false };
    }
  }
}

export default new ErrorService();