import React, { useState, useEffect } from 'react';
import { StorageManager } from '../../shared/utils/storage';
import authService from '../../services/auth.service';
import { User } from 'firebase/auth';

interface AccountManagerProps {
  currentTier: number;
  onTierUpgrade: (tier: number) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ currentTier, onTierUpgrade }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true); // Add loading state for auth check

  useEffect(() => {
    // Check auth state asynchronously
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        // Wait for Firebase auth to initialize first
        await authService.waitForAuth();
        
        // Now get the actual auth state
        const user = authService.getCurrentUser();
        const profile = authService.getUserProfile();
        
        setCurrentUser(user);
        setUserProfile(profile);
        
        if (user && profile?.tier?.level) {
          onTierUpgrade(profile.tier.level);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, [onTierUpgrade]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create account with Firebase Auth
      const user = await authService.signUp(email, password, displayName, referralCode);
      
      if (user) {
        setSuccess('Account created successfully! Tier 2 features unlocked!');
        setCurrentUser(user);
        onTierUpgrade(2);
        
        // Update local storage
        const storage = StorageManager.getInstance();
        await storage.setSettings({
          tier: {
            level: 2,
            name: 'Enhanced',
            unlockedAt: Date.now(),
            progress: 20
          }
        });
        
        // Send message to background to update tier rules
        await chrome.runtime.sendMessage({ 
          action: 'tierUpgraded', 
          tier: 2,
          userId: user.uid 
        });
        
        setTimeout(() => {
          setShowSignup(false);
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = await authService.signIn(email, password);
      
      if (user) {
        const profile = authService.getUserProfile();
        const tierLevel = profile?.tier?.level || 2;
        
        setSuccess(`Welcome back! Tier ${tierLevel} features active.`);
        setCurrentUser(user);
        setUserProfile(profile);
        onTierUpgrade(tierLevel);
        
        // Update local storage
        const storage = StorageManager.getInstance();
        await storage.setSettings({
          tier: profile?.tier || {
            level: 2,
            name: 'Enhanced',
            unlockedAt: Date.now(),
            progress: 20
          }
        });
        
        // Send message to background to update tier rules
        await chrome.runtime.sendMessage({ 
          action: 'tierUpgraded', 
          tier: tierLevel,
          userId: user.uid 
        });
        
        setTimeout(() => {
          setShowLogin(false);
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      
      // Update local state immediately
      setCurrentUser(null);
      setUserProfile(null);
      onTierUpgrade(1);
      
      // Force component to show signup form
      setShowSignup(false);
      setShowLogin(false);
      
      // Update local storage
      const storage = StorageManager.getInstance();
      await storage.setSettings({
        tier: {
          level: 1,
          name: 'Basic',
          unlockedAt: Date.now(),
          progress: 0
        }
      });
      
      // Send message to background to update tier rules
      await chrome.runtime.sendMessage({ 
        action: 'tierUpgraded', 
        tier: 1
      });
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  // Show loading skeleton while checking auth
  if (authLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (currentUser && currentTier >= 2) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Account Active</h3>
            <p className="text-sm opacity-90">Tier {currentTier} - {userProfile?.tier?.name || 'Enhanced'}</p>
            <p className="text-xs opacity-75 mt-1">{currentUser.email}</p>
            {userProfile?.stats?.referralCode && (
              <p className="text-xs opacity-75 mt-1">Referral Code: {userProfile.stats.referralCode}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (showSignup) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-3">Create Account for Tier 2</h3>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-2 rounded mb-3 text-sm">
            {success}
          </div>
        )}
        
        <form onSubmit={showLogin ? handleLogin : handleSignup}>
          {!showLogin && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
                disabled={loading}
              />
            </div>
          )}
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Min 6 characters"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          {!showLogin && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter if you have one"
                disabled={loading}
              />
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (showLogin ? 'Signing In...' : 'Creating...') : (showLogin ? 'Sign In' : 'Create Account')}
            </button>
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => {
              setShowLogin(!showLogin);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm mb-2">Tier 2 Features:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ YouTube ad blocking</li>
            <li>✓ Advanced tracker blocking</li>
            <li>✓ Social media trackers removal</li>
            <li>✓ Analytics blocking</li>
            <li>✓ 40+ additional blocking rules</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Unlock Tier 2</h3>
          <p className="text-sm text-gray-600 mb-3">
            Create a free account to unlock YouTube ad blocking and advanced features
          </p>
          <button
            onClick={() => setShowSignup(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-sm font-medium"
          >
            Create Free Account
          </button>
        </div>
        <div className="ml-3">
          <div className="bg-white rounded-full p-2">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};