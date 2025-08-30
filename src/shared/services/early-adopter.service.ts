/**
 * Early Adopter Management Service
 * Tracks and manages benefits for first 100,000 users
 */

import { MARKETING_CONFIG, EarlyAdopterStatus, UserPriority } from '../constants/marketing';

class EarlyAdopterService {
  private static instance: EarlyAdopterService;
  private globalUserCount: number = 0;
  private userStatus: EarlyAdopterStatus | null = null;

  private constructor() {}

  static getInstance(): EarlyAdopterService {
    if (!EarlyAdopterService.instance) {
      EarlyAdopterService.instance = new EarlyAdopterService();
    }
    return EarlyAdopterService.instance;
  }

  /**
   * Initialize early adopter tracking on extension install
   */
  async initializeUser(): Promise<EarlyAdopterStatus> {
    const storage = await chrome.storage.local.get([
      MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY,
      MARKETING_CONFIG.USER_ID_KEY,
      MARKETING_CONFIG.INSTALL_DATE_KEY,
    ]);

    // Check if user already initialized
    if (storage[MARKETING_CONFIG.USER_ID_KEY]) {
      this.userStatus = storage[MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY];
      return this.userStatus!;
    }

    // Generate unique user ID
    const userId = this.generateUserId();
    const installDate = new Date().toISOString();

    // Fetch global user count from Firebase (simulated for now)
    const userNumber = await this.fetchAndIncrementGlobalUserCount();

    // Determine if user is an early adopter
    const isEarlyAdopter = userNumber <= MARKETING_CONFIG.EARLY_ADOPTER_LIMIT;

    // Early adopters get Tier 5 immediately, others get calculated tier
    const initialTier = isEarlyAdopter ? 5 : this.calculateInitialTier(userNumber, false);

    // Create user status
    this.userStatus = {
      isEarlyAdopter,
      userId,
      installDate,
      userNumber,
      hasAccount: false,
      currentTier: initialTier, // Tier 5 for early adopters!
      lockedTier: isEarlyAdopter ? 5 : initialTier,
      benefits: this.getBenefitsForUser(userNumber, false),
    };

    // Save to storage
    await chrome.storage.local.set({
      [MARKETING_CONFIG.USER_ID_KEY]: userId,
      [MARKETING_CONFIG.INSTALL_DATE_KEY]: installDate,
      [MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY]: this.userStatus,
    });

    // Track analytics
    this.trackUserInitialization(this.userStatus);

    return this.userStatus;
  }

  /**
   * Update user status when they create an account
   */
  async onAccountCreated(userEmail: string): Promise<EarlyAdopterStatus> {
    const storage = await chrome.storage.local.get([
      MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY,
      MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY,
    ]);

    const status = storage[MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY] as EarlyAdopterStatus;
    const currentGlobalCount = storage[MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY] || 0;

    if (!status) {
      throw new Error('User status not initialized');
    }

    // Update status
    status.hasAccount = true;
    status.accountCreatedDate = new Date().toISOString();

    // Early adopters with accounts get permanent Tier 5
    if (status.isEarlyAdopter) {
      status.currentTier = 5;
      status.lockedTier = 5;
      status.benefits = [
        ...MARKETING_CONFIG.PHASES.EARLY_ADOPTER.benefits,
        'Account secured - lifetime premium access confirmed',
      ];
    } else {
      // Calculate tier based on current phase
      status.currentTier = this.calculateAccountTier(currentGlobalCount);
      status.benefits = this.getBenefitsForUser(currentGlobalCount, true);
    }

    this.userStatus = status;

    // Save updated status
    await chrome.storage.local.set({
      [MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY]: status,
    });

    // Track analytics
    this.trackAccountCreation(status);

    return status;
  }

  /**
   * Check and update tier based on global user growth
   */
  async checkTierEligibility(): Promise<number> {
    const storage = await chrome.storage.local.get([
      MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY,
      MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY,
    ]);

    const status = storage[MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY] as EarlyAdopterStatus;
    const currentGlobalCount = await this.fetchGlobalUserCount();

    if (!status) {
      // Initialize if not exists
      const newStatus = await this.initializeUser();
      return newStatus.currentTier;
    }

    // Early adopters with accounts always get Tier 5
    if (status.isEarlyAdopter && status.hasAccount) {
      return 5;
    }

    // Early adopters without accounts may face tier reduction
    if (status.isEarlyAdopter && !status.hasAccount) {
      const reducedTier = this.calculateReducedTier(currentGlobalCount);

      if (reducedTier < status.lockedTier) {
        // Show warning to create account
        this.showAccountCreationWarning(status, reducedTier);
      }

      status.currentTier = reducedTier;
    } else {
      // Regular users
      status.currentTier = status.hasAccount
        ? this.calculateAccountTier(currentGlobalCount)
        : this.calculateInitialTier(currentGlobalCount, false);
    }

    // Update storage
    await chrome.storage.local.set({
      [MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY]: status,
      [MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY]: currentGlobalCount,
    });

    return status.currentTier;
  }

  /**
   * Get user priority level for feature access
   */
  async getUserPriority(): Promise<UserPriority> {
    const status = await this.getUserStatus();

    if (!status) {
      return {
        level: 'limited',
        reason: 'User not initialized',
        tierAccess: 1,
        requiresAction: true,
        actionMessage: 'Initialize extension to access features',
      };
    }

    // Early adopter with account - highest priority
    if (status.isEarlyAdopter && status.hasAccount) {
      return {
        level: 'early_adopter',
        reason: 'Early adopter with secured account',
        tierAccess: 5,
        requiresAction: false,
      };
    }

    // Early adopter without account - at risk
    if (status.isEarlyAdopter && !status.hasAccount) {
      const currentGlobalCount = await this.fetchGlobalUserCount();
      const nextReduction = this.getNextTierReduction(currentGlobalCount);

      return {
        level: 'priority',
        reason: 'Early adopter - account needed to secure benefits',
        tierAccess: status.currentTier,
        requiresAction: true,
        actionMessage: nextReduction
          ? `Create account before ${nextReduction.afterUsers} users to maintain Tier ${status.currentTier}`
          : 'Create account to secure lifetime premium access',
      };
    }

    // Regular user with account
    if (status.hasAccount) {
      return {
        level: 'standard',
        reason: 'Registered user',
        tierAccess: status.currentTier,
        requiresAction: false,
      };
    }

    // Regular user without account
    return {
      level: 'limited',
      reason: 'Unregistered user',
      tierAccess: status.currentTier,
      requiresAction: true,
      actionMessage: 'Create account to unlock more features',
    };
  }

  /**
   * Private helper methods
   */

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fetchAndIncrementGlobalUserCount(): Promise<number> {
    // In production, this would call Firebase Cloud Function
    // For now, simulate with local storage
    const storage = await chrome.storage.local.get(MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY);
    const currentCount = storage[MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY] || 0;
    const newCount = currentCount + 1;

    await chrome.storage.local.set({
      [MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY]: newCount,
    });

    this.globalUserCount = newCount;
    return newCount;
  }

  private async fetchGlobalUserCount(): Promise<number> {
    // In production, fetch from Firebase
    const storage = await chrome.storage.local.get(MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY);
    return storage[MARKETING_CONFIG.GLOBAL_USER_COUNT_KEY] || 1;
  }

  private calculateInitialTier(userNumber: number, hasAccount: boolean): number {
    // Find applicable phase
    for (const [phaseName, phase] of Object.entries(MARKETING_CONFIG.PHASES)) {
      if (userNumber >= phase.userRange[0] && userNumber <= phase.userRange[1]) {
        if (hasAccount && phase.accountBenefitTier) {
          return phase.accountBenefitTier;
        }
        return phase.defaultTier;
      }
    }
    return 1; // Default to Tier 1
  }

  private calculateAccountTier(globalUserCount: number): number {
    // Find applicable phase based on global count
    for (const [phaseName, phase] of Object.entries(MARKETING_CONFIG.PHASES)) {
      if (globalUserCount >= phase.userRange[0] && globalUserCount <= phase.userRange[1]) {
        return phase.accountBenefitTier || phase.defaultTier;
      }
    }
    return 2; // Default for accounts
  }

  private calculateReducedTier(globalUserCount: number): number {
    // Check tier reduction schedule for early adopters without accounts
    const schedule = MARKETING_CONFIG.TRANSITION_RULES.TIER_REDUCTION_SCHEDULE;

    for (const rule of schedule) {
      if (globalUserCount >= rule.afterUsers) {
        return rule.reduceTo;
      }
    }

    return 5; // No reduction yet
  }

  private getNextTierReduction(
    currentCount: number
  ): { afterUsers: number; reduceTo: number } | null {
    const schedule = MARKETING_CONFIG.TRANSITION_RULES.TIER_REDUCTION_SCHEDULE;

    for (const rule of schedule) {
      if (currentCount < rule.afterUsers) {
        return rule;
      }
    }

    return null;
  }

  private getBenefitsForUser(userNumber: number, hasAccount: boolean): string[] {
    for (const [phaseName, phase] of Object.entries(MARKETING_CONFIG.PHASES)) {
      if (userNumber >= phase.userRange[0] && userNumber <= phase.userRange[1]) {
        return phase.benefits;
      }
    }
    return [];
  }

  private async getUserStatus(): Promise<EarlyAdopterStatus | null> {
    if (this.userStatus) {
      return this.userStatus;
    }

    const storage = await chrome.storage.local.get(MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY);
    this.userStatus = storage[MARKETING_CONFIG.EARLY_ADOPTER_STORAGE_KEY];
    return this.userStatus;
  }

  private showAccountCreationWarning(status: EarlyAdopterStatus, newTier: number): void {
    // Send notification to user
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
      title: 'Secure Your Early Adopter Benefits!',
      message: `Your tier will be reduced from ${status.lockedTier} to ${newTier}. Create an account now to keep all premium features forever!`,
      buttons: [{ title: 'Create Account Now' }, { title: 'Remind Me Later' }],
      priority: 2,
    });
  }

  private trackUserInitialization(status: EarlyAdopterStatus): void {
    // Analytics tracking
    chrome.runtime
      .sendMessage({
        action: 'analytics',
        event: 'user_initialized',
        data: {
          isEarlyAdopter: status.isEarlyAdopter,
          userNumber: status.userNumber,
          tier: status.currentTier,
        },
      })
      .catch(() => {});
  }

  private trackAccountCreation(status: EarlyAdopterStatus): void {
    // Analytics tracking
    chrome.runtime
      .sendMessage({
        action: 'analytics',
        event: 'account_created',
        data: {
          isEarlyAdopter: status.isEarlyAdopter,
          userNumber: status.userNumber,
          daysAfterInstall: this.daysBetween(new Date(status.installDate), new Date()),
          tier: status.currentTier,
        },
      })
      .catch(() => {});
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const earlyAdopterService = EarlyAdopterService.getInstance();
