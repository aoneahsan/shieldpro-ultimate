import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Star,
  Zap,
  Crown,
  CheckCircle,
  Users,
  Globe,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import authService from '../services/auth.service';
import { StorageManager } from '../shared/utils/storage';

interface TierInfo {
  level: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
  requirement: string;
  features: string[];
  unlocked: boolean;
  current: boolean;
}

const TiersPage: React.FC = () => {
  const [currentTier, setCurrentTier] = useState(1);
  const [userProfile, setUserProfile] = useState<{ displayName?: string; email?: string } | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [weeklyEngagement, setWeeklyEngagement] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storage = StorageManager.getInstance();
      const settings = await storage.getSettings();
      setCurrentTier(settings.tier?.level || 1);

      const user = authService.getCurrentUser();
      const profile = authService.getUserProfile();

      if (user && profile) {
        setIsLoggedIn(true);
        setUserProfile(profile);
        setReferralCount(profile.stats?.referralCount || 0);
        setWeeklyEngagement(profile.stats?.weeklyEngagement?.length || 0);
      }
    } catch {
      console.error('Error loading user data:', error);
    }
  };

  const tiers: TierInfo[] = [
    {
      level: 1,
      name: 'Basic Shield',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-gray-500 to-gray-600',
      progress: 20,
      requirement: 'No account required - Available to everyone',
      features: [
        '✓ Block 50+ major ad networks',
        '✓ Remove banner & display ads',
        '✓ Block popups and popunders',
        '✓ Auto-reject cookie consent',
        '✓ Basic tracker blocking',
        '✓ Whitelist management',
        '✓ Real-time blocking counter',
        '✓ On/off toggle',
      ],
      unlocked: true,
      current: currentTier === 1,
    },
    {
      level: 2,
      name: 'Enhanced Protection',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      progress: 40,
      requirement: 'Create a free account',
      features: [
        '✓ Everything from Tier 1',
        '✓ Complete YouTube ad blocking',
        '✓ Block 40+ advanced trackers',
        '✓ Remove social media widgets',
        '✓ Advanced analytics blocking',
        '✓ Session recording prevention',
        '✓ Enhanced popup blocking',
        '✓ Notification blocking',
        '✓ Cross-device sync ready',
        '✓ Referral code system',
      ],
      unlocked: currentTier >= 2,
      current: currentTier === 2,
    },
    {
      level: 3,
      name: 'Professional Suite',
      icon: <Star className="w-8 h-8" />,
      color: 'from-blue-500 to-indigo-600',
      progress: 60,
      requirement: 'Complete your profile (name, photo, preferences)',
      features: [
        '✓ Everything from Tier 2',
        '✓ Custom filter list editor',
        '✓ Element picker tool',
        '✓ Import/export settings',
        '✓ Advanced whitelist patterns',
        '✓ Scheduled blocking rules',
        '✓ Custom CSS injection',
        '✓ RegEx filter support',
        '✓ Backup & restore',
        '✓ Advanced statistics dashboard',
        '✓ 100+ additional blocking rules',
      ],
      unlocked: currentTier >= 3,
      current: currentTier === 3,
    },
    {
      level: 4,
      name: 'Premium Power',
      icon: <Award className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-600',
      progress: 80,
      requirement: 'Invite 30 friends using your referral code',
      features: [
        '✓ Everything from Tier 3',
        '✓ Malware domain blocking',
        '✓ Phishing protection',
        '✓ Advanced privacy tools',
        '✓ Cookie management',
        '✓ Canvas fingerprint blocking',
        '✓ WebRTC leak protection',
        '✓ DNS-over-HTTPS',
        '✓ Script control panel',
        '✓ Network request logger',
        '✓ Premium filter lists',
        '✓ Priority support',
      ],
      unlocked: currentTier >= 4,
      current: currentTier === 4,
    },
    {
      level: 5,
      name: 'Ultimate Guardian',
      icon: <Crown className="w-8 h-8" />,
      color: 'from-yellow-400 via-orange-500 to-red-500',
      progress: 100,
      requirement: 'Use extension actively for 7 days each week',
      features: [
        '✓ Everything from Tier 4',
        '✓ AI-powered ad detection',
        '✓ Real-time threat analysis',
        '✓ Zero-day protection',
        '✓ Advanced machine learning filters',
        '✓ Custom AI training',
        '✓ VPN integration ready',
        '✓ Blockchain-based filter sharing',
        '✓ Community filter voting',
        '✓ Beta features access',
        '✓ Lifetime updates',
        '✓ All future features',
      ],
      unlocked: currentTier >= 5,
      current: currentTier === 5,
    },
  ];

  const getProgressToNextTier = () => {
    if (currentTier === 1 && !isLoggedIn) {
      return { message: 'Create an account to unlock Tier 2', progress: 0 };
    }
    if (currentTier === 2) {
      return {
        message: 'Complete your profile to unlock Tier 3',
        progress: userProfile?.displayName && userProfile?.photoURL ? 100 : 50,
      };
    }
    if (currentTier === 3) {
      const progress = Math.min((referralCount / 30) * 100, 100);
      return {
        message: `${referralCount}/30 referrals to unlock Tier 4`,
        progress,
      };
    }
    if (currentTier === 4) {
      const progress = (weeklyEngagement / 7) * 100;
      return {
        message: `${weeklyEngagement}/7 days active this week for Tier 5`,
        progress,
      };
    }
    return { message: 'Maximum tier reached!', progress: 100 };
  };

  const progressInfo = getProgressToNextTier();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ShieldPro Ultimate</h1>
                <p className="text-sm text-gray-600">Progressive Protection Tiers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn && userProfile ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{userProfile.email}</p>
                    <p className="text-xs text-gray-600">
                      Tier {currentTier} - {tiers[currentTier - 1].name}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {currentTier}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => chrome.runtime.openOptionsPage()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign In to Unlock More
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      {currentTier < 5 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Progress to Next Tier</h2>
                <span className="text-sm text-gray-600">{progressInfo.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressInfo.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{progressInfo.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tiers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.level}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                tier.current ? 'ring-4 ring-primary-500 scale-105' : ''
              } ${!tier.unlocked ? 'opacity-75' : ''}`}
            >
              {/* Tier Header */}
              <div className={`bg-gradient-to-r ${tier.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {tier.icon}
                    <div>
                      <h3 className="text-xl font-bold">Tier {tier.level}</h3>
                      <p className="text-sm opacity-90">{tier.name}</p>
                    </div>
                  </div>
                  {tier.unlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{tier.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ width: `${tier.unlocked ? 100 : tier.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Current Tier Badge */}
              {tier.current && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>ACTIVE</span>
                </div>
              )}

              {/* Requirement */}
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-sm font-medium text-gray-700">
                  {tier.unlocked ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-600">
                      <Lock className="w-4 h-4 mr-1" />
                      {tier.requirement}
                    </span>
                  )}
                </p>
              </div>

              {/* Features */}
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {tier.features.map((feature, index) => (
                  <div
                    key={index}
                    className={`text-sm ${tier.unlocked ? 'text-gray-700' : 'text-gray-500'}`}
                  >
                    {feature}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="p-4 bg-gray-50 border-t">
                {tier.current ? (
                  <button className="w-full py-2 bg-green-500 text-white rounded-lg font-medium">
                    Currently Active
                  </button>
                ) : tier.unlocked ? (
                  <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">
                    Unlocked
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (tier.level === 2) {
                        chrome.runtime.openOptionsPage();
                      }
                    }}
                    className="w-full py-2 bg-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    {tier.level === 2 ? 'Sign Up to Unlock' : 'Locked'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How the Tier System Works</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Progressive Unlocking</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Start with Tier 1</p>
                    <p className="text-sm text-gray-600">
                      Basic protection available to everyone immediately
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Create Account for Tier 2</p>
                    <p className="text-sm text-gray-600">
                      Sign up to unlock YouTube blocking and advanced features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Complete Profile for Tier 3</p>
                    <p className="text-sm text-gray-600">
                      Add your name and photo to unlock custom filters
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Share for Tier 4</p>
                    <p className="text-sm text-gray-600">
                      Invite 30 friends to unlock premium features
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Stay Active for Tier 5</p>
                    <p className="text-sm text-gray-600">
                      Use the extension 7 days a week for ultimate features
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Progressive Protection</p>
                    <p className="text-sm text-gray-600">
                      Start with basic protection and unlock more as you engage
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Community Driven</p>
                    <p className="text-sm text-gray-600">
                      Help others discover better browsing by sharing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Continuous Improvement</p>
                    <p className="text-sm text-gray-600">
                      New features added regularly to higher tiers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Privacy First</p>
                    <p className="text-sm text-gray-600">
                      Your data stays private, no tracking or selling
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code Section */}
          {isLoggedIn && userProfile?.stats?.referralCode && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Referral Code</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg">
                    <code className="text-lg font-mono font-bold text-primary-600">
                      {userProfile.stats.referralCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.stats.referralCode);
                        alert('Referral code copied!');
                      }}
                      className="ml-auto px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Share this code with friends. You need {Math.max(0, 30 - referralCount)} more
                    referrals for Tier 4!
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{referralCount}</div>
                  <div className="text-sm text-gray-600">Referrals</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TiersPage;
