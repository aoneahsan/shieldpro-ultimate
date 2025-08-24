/**
 * Comprehensive Tiers Information Page
 * Explains all tiers, features, and unlock requirements
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { firebaseService } from '../services/firebase.service';

interface TierInfo {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  unlockRequirement: string;
  unlockProgress: string;
  features: string[];
  color: string;
  icon: string;
}

interface UserTierData {
  currentTier: number;
  profileCompletion: number;
  referralsCount: number;
  weeklyEngagement: number;
  isAuthenticated: boolean;
}

const TiersInfo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tierData, setTierData] = useState<UserTierData>({
    currentTier: 1,
    profileCompletion: 0,
    referralsCount: 0,
    weeklyEngagement: 0,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(true);

  const tiers: TierInfo[] = [
    {
      id: 1,
      name: "Basic Shield",
      subtitle: "Essential Ad Blocking",
      description: "Get started with fundamental ad blocking and popup protection. Perfect for everyday browsing without distractions.",
      unlockRequirement: "Available immediately - no login required",
      unlockProgress: "Active",
      features: [
        "Advanced Filter Engine with 1,000+ blocking rules",
        "50+ Ad Networks blocked (Google AdSense, DoubleClick, Facebook Ads)",
        "Smart Popup Management with rate limiting",
        "Cookie Consent Auto-Rejection for 40+ platforms",
        "Network-level blocking (<1ms response time)",
        "Per-site whitelist management",
        "Real-time blocking counter",
        "Lightweight operation (<5MB RAM)"
      ],
      color: "bg-blue-500",
      icon: "🛡️"
    },
    {
      id: 2,
      name: "Enhanced Protection",
      subtitle: "Account-Based Features",
      description: "Unlock advanced tracking protection and YouTube ad blocking by creating a free account. Includes cloud sync across devices.",
      unlockRequirement: "Create a free account (Google, Email, or GitHub)",
      unlockProgress: "Complete account creation",
      features: [
        "Complete YouTube Ad Blocking (pre-roll, mid-roll, banners)",
        "Advanced Tracking Protection (40+ tracker networks)",
        "Social Media Filtering (Facebook, Twitter widgets)",
        "Session Recording Prevention (Hotjar, FullStory)",
        "Third-party Cookie Blocking",
        "Firebase Cloud Sync across devices",
        "Personal Dashboard with detailed statistics",
        "Referral System for sharing"
      ],
      color: "bg-green-500",
      icon: "⚡"
    },
    {
      id: 3,
      name: "Professional Suite",
      subtitle: "Custom Filtering Power",
      description: "Professional-grade tools for power users. Create custom filters, use element picker, and advanced whitelist management.",
      unlockRequirement: "Complete your profile (display name, photo, preferences)",
      unlockProgress: "Fill profile completion",
      features: [
        "Visual CSS Selector Builder with point-and-click",
        "Element Picker Tool for blocking specific elements",
        "Custom Filter Editor with RegEx support",
        "Advanced Whitelist Management (patterns, wildcards)",
        "100+ Additional Professional Rules",
        "Custom CSS Injection capabilities",
        "Basic JavaScript Control",
        "Import/Export filters and settings",
        "Scheduled Blocking with time-based rules",
        "Comprehensive backup and restore"
      ],
      color: "bg-purple-500",
      icon: "⭐"
    },
    {
      id: 4,
      name: "Premium Power",
      subtitle: "Ultimate Security Suite",
      description: "Enterprise-level security with malware protection, privacy features, and advanced cookie management. Requires community engagement.",
      unlockRequirement: "Generate 30 referrals through sharing",
      unlockProgress: "Share with friends and family",
      features: [
        "Real-time Malware Domain Blocking",
        "Advanced Phishing Protection with URL reputation",
        "Canvas Fingerprinting Protection",
        "WebRTC Leak Protection for IP privacy",
        "Advanced Cookie Management with categories",
        "Audio Fingerprinting Prevention",
        "Font Fingerprinting Protection",
        "Security Threat Dashboard",
        "Custom Security Rules",
        "Encrypted DNS-over-HTTPS (DoH)",
        "Granular Script Control Panel",
        "Network Request Logger for developers"
      ],
      color: "bg-red-500",
      icon: "🔥"
    },
    {
      id: 5,
      name: "Ultimate Champion",
      subtitle: "Elite Features & Priority",
      description: "The ultimate ad blocking experience with AI-powered features, priority support, and exclusive access to beta features.",
      unlockRequirement: "Maintain weekly engagement (visit 5 times per week)",
      unlockProgress: "Stay active to maintain access",
      features: [
        "AI-Powered Content Analysis",
        "Intelligent Ad Pattern Recognition",
        "Predictive Blocking Technology",
        "Advanced Behavioral Analytics",
        "Custom AI Filter Generation",
        "Priority Customer Support",
        "Beta Feature Access",
        "Advanced Reporting Dashboard",
        "API Access for developers",
        "White-label Options",
        "Enterprise-grade Performance",
        "24/7 Monitoring and Updates"
      ],
      color: "bg-gradient-to-r from-yellow-400 to-orange-500",
      icon: "👑"
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = firebaseService.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const profile = await firebaseService.getUserProfile(currentUser.uid);
        if (profile) {
          setTierData({
            currentTier: profile.tier?.level || 1,
            profileCompletion: calculateProfileCompletion(profile),
            referralsCount: (profile as any).referrals?.totalReferrals || 0,
            weeklyEngagement: (profile as any).engagement?.weeklyVisits || 0,
            isAuthenticated: true
          });
        }
      } else {
        setTierData(prev => ({ ...prev, isAuthenticated: false }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: any): number => {
    let completion = 0;
    if (profile.displayName) completion += 33;
    if (profile.photoURL) completion += 33;
    if (profile.settings?.notifications !== undefined) completion += 34;
    return completion;
  };

  const getTierStatus = (tier: TierInfo): 'active' | 'available' | 'locked' => {
    if (tier.id <= tierData.currentTier) return 'active';
    
    switch (tier.id) {
      case 2:
        return tierData.isAuthenticated ? 'active' : 'available';
      case 3:
        return tierData.profileCompletion >= 100 ? 'active' : 'available';
      case 4:
        return tierData.referralsCount >= 30 ? 'active' : 'available';
      case 5:
        return tierData.weeklyEngagement >= 5 ? 'active' : 'available';
      default:
        return 'locked';
    }
  };

  const getProgressInfo = (tier: TierInfo) => {
    switch (tier.id) {
      case 2:
        return {
          current: tierData.isAuthenticated ? 1 : 0,
          total: 1,
          label: tierData.isAuthenticated ? "Account Created" : "Create Account"
        };
      case 3:
        return {
          current: tierData.profileCompletion,
          total: 100,
          label: `Profile ${tierData.profileCompletion}% Complete`
        };
      case 4:
        return {
          current: tierData.referralsCount,
          total: 30,
          label: `${tierData.referralsCount}/30 Referrals`
        };
      case 5:
        return {
          current: tierData.weeklyEngagement,
          total: 5,
          label: `${tierData.weeklyEngagement}/5 Weekly Visits`
        };
      default:
        return { current: 1, total: 1, label: "Active" };
    }
  };

  const handleUnlockAction = async (tier: TierInfo) => {
    switch (tier.id) {
      case 2:
        // Redirect to sign-in
        window.open(chrome.runtime.getURL('/popup.html#/auth'), '_blank');
        break;
      case 3:
        // Redirect to profile completion
        window.open(chrome.runtime.getURL('/options.html#/profile'), '_blank');
        break;
      case 4:
        // Show referral information
        window.open(chrome.runtime.getURL('/options.html#/referrals'), '_blank');
        break;
      case 5:
        // Show engagement tips
        alert("Keep using ShieldPro regularly! Visit at least 5 times per week to maintain Tier 5 access.");
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tier information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🛡️ ShieldPro Ultimate - Tier System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Progressive feature unlocking system with 5 tiers of ad blocking power. 
            Each tier builds upon the previous one, giving you more control and protection.
          </p>
          {user && (
            <div className="mt-6 inline-flex items-center px-4 py-2 bg-white rounded-lg shadow">
              <span className="text-sm text-gray-600 mr-2">Current Tier:</span>
              <span className={`px-3 py-1 rounded-full text-white font-medium ${tiers[tierData.currentTier - 1]?.color}`}>
                Tier {tierData.currentTier}: {tiers[tierData.currentTier - 1]?.name}
              </span>
            </div>
          )}
        </div>

        {/* Tier Cards */}
        <div className="space-y-8">
          {tiers.map((tier) => {
            const status = getTierStatus(tier);
            const progress = getProgressInfo(tier);
            
            return (
              <div
                key={tier.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                  status === 'active' ? 'border-green-500' : 
                  status === 'available' ? 'border-blue-500' : 'border-gray-300'
                } transition-all hover:shadow-xl`}
              >
                <div className="flex">
                  {/* Left Panel - Tier Info */}
                  <div className="flex-1 p-8">
                    <div className="flex items-center mb-4">
                      <span className="text-4xl mr-4">{tier.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Tier {tier.id}: {tier.name}
                        </h2>
                        <p className="text-lg text-gray-600">{tier.subtitle}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status === 'active' ? 'bg-green-100 text-green-800' :
                          status === 'available' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status === 'active' ? 'ACTIVE' : 
                           status === 'available' ? 'AVAILABLE' : 'LOCKED'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-6">{tier.description}</p>

                    {/* Unlock Requirement */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Unlock Requirement:</h3>
                      <p className="text-gray-600">{tier.unlockRequirement}</p>
                      
                      {tier.id > 1 && status !== 'active' && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>{progress.label}</span>
                            <span>{progress.current}/{progress.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${tier.color.replace('bg-', 'bg-')}`}
                              style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                          </div>
                          {status === 'available' && (
                            <button
                              onClick={() => handleUnlockAction(tier)}
                              className={`mt-3 px-4 py-2 rounded-lg text-white font-medium ${tier.color} hover:opacity-90 transition-opacity`}
                            >
                              {tier.id === 2 ? 'Sign In' : 
                               tier.id === 3 ? 'Complete Profile' :
                               tier.id === 4 ? 'View Referrals' : 'Learn More'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Features Included:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tier.features.map((feature, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎯 How the Tier System Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progressive Unlocking</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">1.</span>
                  <span><strong>Start Free:</strong> Tier 1 is available immediately with no registration required</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">2.</span>
                  <span><strong>Account Benefits:</strong> Create an account to unlock Tier 2 YouTube blocking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">3.</span>
                  <span><strong>Profile Power:</strong> Complete your profile for Tier 3 professional tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">4.</span>
                  <span><strong>Community Sharing:</strong> Refer 30 friends for Tier 4 security features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">5.</span>
                  <span><strong>Stay Active:</strong> Regular usage maintains Tier 5 elite status</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Benefits</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>No Payment Required:</strong> All features unlock through engagement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Cumulative Features:</strong> Higher tiers include all previous tier features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Cloud Sync:</strong> Settings sync across devices for account holders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Regular Updates:</strong> New features added to existing tiers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Privacy First:</strong> Your data stays secure and private</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ❓ Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Can I lose access to higher tiers?</h3>
                <p className="text-gray-600">Only Tier 5 requires ongoing engagement. Tiers 2-4 are permanent once unlocked.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Do I need to pay for any features?</h3>
                <p className="text-gray-600">No! All tiers unlock through free actions like account creation and sharing.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">How long does it take to unlock all tiers?</h3>
                <p className="text-gray-600">Tiers 1-3 can be unlocked in minutes. Tier 4 depends on referral success, Tier 5 on usage.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">What data do you collect?</h3>
                <p className="text-gray-600">Only basic usage statistics and tier progression. No browsing data or personal information.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Can I use ShieldPro on multiple devices?</h3>
                <p className="text-gray-600">Yes! Account holders get cloud sync across unlimited devices.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Is my referral information private?</h3>
                <p className="text-gray-600">Absolutely. We only track referral counts, not personal information of referred users.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p>Have questions? Contact us through the extension popup or visit our support page.</p>
          <p className="mt-2 text-sm">ShieldPro Ultimate - Your Privacy, Your Control, Your Choice</p>
        </div>
      </div>
    </div>
  );
};

export default TiersInfo;