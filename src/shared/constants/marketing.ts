/**
 * Marketing Strategy Configuration
 * First 100,000 users get all features free
 * Gradual transition to account-based access as user base grows
 */

export const MARKETING_CONFIG = {
  EARLY_ADOPTER_LIMIT: 100000,
  
  // Phases of user onboarding
  PHASES: {
    // Phase 1: First 100k users - all features free
    EARLY_ADOPTER: {
      userRange: [0, 100000],
      defaultTier: 5, // All features unlocked
      requiresAccount: false,
      benefits: [
        'All premium features free forever',
        'No account required initially',
        'Early adopter badge',
        'Priority support',
        'Lifetime updates'
      ]
    },
    
    // Phase 2: 100k-250k users - gentle nudge to create account
    GROWTH: {
      userRange: [100001, 250000],
      defaultTier: 3, // Mid-tier features
      requiresAccount: false,
      accountBenefitTier: 5,
      benefits: [
        'Create account for all features',
        'Non-registered users get Tier 3',
        'Account holders get Tier 5'
      ]
    },
    
    // Phase 3: 250k-500k users - account strongly encouraged
    EXPANSION: {
      userRange: [250001, 500000],
      defaultTier: 2, // Basic features only
      requiresAccount: false,
      accountBenefitTier: 4,
      benefits: [
        'Account required for advanced features',
        'Non-registered users get Tier 2',
        'Account holders get Tier 4'
      ]
    },
    
    // Phase 4: 500k+ users - full tier system active
    MATURITY: {
      userRange: [500001, Infinity],
      defaultTier: 1, // Minimal features
      requiresAccount: true,
      benefits: [
        'Full tier progression system active',
        'Account required for features beyond Tier 1',
        'Referral system for tier upgrades'
      ]
    }
  },
  
  // Early adopter tracking
  EARLY_ADOPTER_STORAGE_KEY: 'earlyAdopterStatus',
  USER_ID_KEY: 'uniqueUserId',
  INSTALL_DATE_KEY: 'installDate',
  GLOBAL_USER_COUNT_KEY: 'globalUserCount',
  
  // Messages for different user types
  MESSAGES: {
    EARLY_ADOPTER_WELCOME: 'Welcome, Early Adopter! You have lifetime access to all premium features.',
    EARLY_ADOPTER_REMINDER: 'As an early adopter, secure your lifetime benefits by creating an account.',
    ACCOUNT_BENEFIT: 'Create an account to unlock additional features and secure your access.',
    TIER_RESTRICTION: 'Some features are now limited. Create an account to restore full access.',
    PRIORITY_USER: 'Priority User: Your account gives you enhanced features and benefits.'
  },
  
  // Transition rules for early adopters
  TRANSITION_RULES: {
    // When to start showing account creation prompts
    PROMPT_AFTER_USERS: 80000, // Start prompting at 80k users
    
    // Grace period for early adopters to create accounts
    GRACE_PERIOD_DAYS: 30,
    
    // Tier reduction for non-registered early adopters
    TIER_REDUCTION_SCHEDULE: [
      { afterUsers: 110000, reduceTo: 4 }, // After 110k total users
      { afterUsers: 125000, reduceTo: 3 }, // After 125k total users
      { afterUsers: 150000, reduceTo: 2 }, // After 150k total users
      { afterUsers: 200000, reduceTo: 1 }  // After 200k total users
    ]
  }
};

export interface EarlyAdopterStatus {
  isEarlyAdopter: boolean;
  userId: string;
  installDate: string;
  userNumber: number; // Their position in the first 100k
  hasAccount: boolean;
  accountCreatedDate?: string;
  currentTier: number;
  lockedTier: number; // Tier they're guaranteed
  benefits: string[];
}

export interface UserPriority {
  level: 'early_adopter' | 'priority' | 'standard' | 'limited';
  reason: string;
  tierAccess: number;
  requiresAction: boolean;
  actionMessage?: string;
}