import React, { useState } from 'react';
import { StorageManager } from '../../shared/utils/storage';

interface AccountManagerProps {
  currentTier: number;
  onTierUpgrade: (tier: number) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ currentTier, onTierUpgrade }) => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate account creation (in real app, this would connect to Firebase Auth)
      if (email && password && password.length >= 6) {
        // Send message to background to upgrade tier
        const response = await chrome.runtime.sendMessage({ action: 'accountCreated' });
        
        if (response.success) {
          setSuccess('Account created successfully! Tier 2 features unlocked!');
          onTierUpgrade(2);
          
          // Store account info locally (in real app, use Firebase)
          const storage = StorageManager.getInstance();
          await storage.setSettings({
            tier: {
              level: 2,
              name: 'Enhanced',
              unlockedAt: Date.now(),
              progress: 20
            }
          });
          
          setTimeout(() => {
            setShowSignup(false);
            setSuccess('');
          }, 2000);
        } else {
          setError(response.message || 'Failed to create account');
        }
      } else {
        setError('Please enter a valid email and password (min 6 characters)');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (currentTier >= 2) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Account Active</h3>
            <p className="text-sm opacity-90">Tier {currentTier} Features Unlocked</p>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
        
        <form onSubmit={handleSignup}>
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
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
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