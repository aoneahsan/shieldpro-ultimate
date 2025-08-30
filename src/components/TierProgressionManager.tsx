import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { functions } from '../utils/firebase';
import { httpsCallable } from 'firebase/functions';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';
import authService from '../services/auth.service';

interface EngagementResponse {
  tierUpgraded: boolean;
  message: string;
}

interface TierUpgradeResponse {
  upgraded: boolean;
  message: string;
  newTier: number;
}

interface TierProgressionManagerProps {
  currentUser: User | null;
  currentTier: number;
  onTierUpdate: (tier: number) => void;
}

interface TierProgress {
  currentTier: number;
  nextTier: number;
  requirements: Record<string, unknown>;
  progress: Record<string, unknown>;
  canUpgrade: boolean;
}

export const TierProgressionManager: React.FC<TierProgressionManagerProps> = ({
  currentUser,
  currentTier,
  onTierUpdate,
}) => {
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    photoURL: currentUser?.photoURL || '',
    bio: '',
    website: '',
    location: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [_weeklyEngagement, _setWeeklyEngagement] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadTierProgress();
      trackDailyEngagement();
    }
  }, [currentUser, currentTier, trackDailyEngagement]);

  const loadTierProgress = async () => {
    try {
      const getTierProgress = httpsCallable(functions, 'getTierProgress');
      const result = await getTierProgress();
      setTierProgress(result.data as TierProgress);
    } catch {
      console.error('Failed to load tier progress:', error);
    }
  };

  const trackDailyEngagement = useCallback(async () => {
    if (currentTier >= 4) {
      try {
        const trackEngagement = httpsCallable(functions, 'trackDailyEngagement');
        const result = await trackEngagement();
        const data = result.data as EngagementResponse;

        if (data.tierUpgraded) {
          setSuccess(data.message);
          onTierUpdate(5);
        }
      } catch {
        console.error('Failed to track engagement:', error);
      }
    }
  }, [currentTier, onTierUpdate]);

  const handleProfileUpdate = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload photo if selected
      let photoURL = profileData.photoURL;
      if (photoFile) {
        const storageRef = ref(storage, `profiles/${currentUser.uid}/avatar`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: profileData.displayName,
        photoURL: photoURL,
      });

      // Update Firestore profile
      await authService.updateUserProfile({
        displayName: profileData.displayName,
        photoURL: photoURL,
      });

      // Check for tier upgrade
      const checkTierUpgrade = httpsCallable(functions, 'checkTierUpgrade');
      const result = await checkTierUpgrade();
      const upgradeResult = result.data as TierUpgradeResponse;

      if (upgradeResult.upgraded) {
        setSuccess(upgradeResult.message);
        onTierUpdate(upgradeResult.newTier);
      } else {
        setSuccess('Profile updated successfully!');
      }

      await loadTierProgress();
    } catch {
      setError((err as Error)?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new window.FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const _handleReferralSubmit = async () => {
    if (!referralCode.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const processReferral = httpsCallable(functions, 'processReferral');
      await processReferral({ referralCode: referralCode.trim() });

      setSuccess('Referral processed successfully!');
      setReferralCode('');

      // The referrer will be notified and potentially upgraded
      await loadTierProgress();
    } catch {
      setError((err as Error)?.message || 'Invalid referral code');
    } finally {
      setLoading(false);
    }
  };

  const renderTier2Progression = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Complete Your Profile - Unlock Tier 3</h3>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
          <div className="flex items-center space-x-4">
            {profileData.photoURL ? (
              <img
                src={profileData.photoURL}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={profileData.displayName}
            onChange={(e) => setProfileData((prev) => ({ ...prev, displayName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Your name"
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Profile Completion Status:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Display Name</span>
              <span
                className={`text-sm font-medium ${profileData.displayName ? 'text-green-600' : 'text-gray-400'}`}
              >
                {profileData.displayName ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Profile Photo</span>
              <span
                className={`text-sm font-medium ${profileData.photoURL ? 'text-green-600' : 'text-gray-400'}`}
              >
                {profileData.photoURL ? '✓ Complete' : 'Incomplete'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Verified</span>
              <span
                className={`text-sm font-medium ${currentUser?.emailVerified ? 'text-green-600' : 'text-amber-600'}`}
              >
                {currentUser?.emailVerified ? '✓ Verified' : 'Pending verification'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleProfileUpdate}
          disabled={loading || (!profileData.displayName && !profileData.photoURL)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm mb-2">Tier 3 Benefits:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Custom filter creation</li>
            <li>✓ Import/Export filters</li>
            <li>✓ Element picker tool</li>
            <li>✓ Advanced whitelist management</li>
            <li>✓ 60+ additional blocking rules</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTier3Progression = () => {
    const referralCount = tierProgress?.progress?.referrals || 0;
    const percentage = tierProgress?.progress?.percentage || 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Referral Program - Unlock Tier 4</h3>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Referral Progress</span>
            <span className="text-sm text-gray-600">{referralCount} / 30</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-sm mb-2">Your Referral Code:</h4>
          <div className="flex items-center space-x-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 font-mono text-sm">
              {authService.getUserProfile()?.stats.referralCode || 'Loading...'}
            </code>
            <button
              onClick={() => {
                const code = authService.getUserProfile()?.stats.referralCode;
                if (code) {
                  navigator.clipboard.writeText(code);
                  setSuccess('Referral code copied!');
                  setTimeout(() => setSuccess(''), 2000);
                }
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              const code = authService.getUserProfile()?.stats.referralCode;
              const url = `https://shieldpro.app/ref/${code}`;
              navigator.clipboard.writeText(url);
              setSuccess('Referral link copied!');
              setTimeout(() => setSuccess(''), 2000);
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
          >
            Copy Referral Link
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
          </div>
        </div>

        {success && (
          <div className="mt-4 bg-green-50 text-green-600 p-3 rounded-lg text-sm">{success}</div>
        )}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm mb-2">Tier 4 Benefits:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ DNS-over-HTTPS (DoH)</li>
            <li>✓ Advanced privacy protection</li>
            <li>✓ Script blocking controls</li>
            <li>✓ Network request logger</li>
            <li>✓ 80+ premium blocking rules</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderTier4Progression = () => {
    const engagementDays = tierProgress?.progress?.engagementDays || 0;
    const percentage = tierProgress?.progress?.percentage || 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Engagement - Unlock Tier 5</h3>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Engagement Progress</span>
            <span className="text-sm text-gray-600">{engagementDays} / 7 days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const today = new Date().getDay();
            const isEngaged = index < engagementDays;
            const isToday = index === today;

            return (
              <div
                key={index}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                  ${isEngaged ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-100'}
                  ${isToday ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">How to Unlock Tier 5:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use ShieldPro for 7 consecutive days</li>
            <li>• Extension must be active each day</li>
            <li>• Progress resets if you miss a day</li>
            <li>• Tier 5 requires weekly maintenance</li>
          </ul>
        </div>

        {engagementDays >= 7 && (
          <div className="mt-4 bg-green-50 text-green-600 p-3 rounded-lg text-sm">
            🎉 Congratulations! You've unlocked Tier 5 - Ultimate!
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm mb-2">Tier 5 Benefits:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ AI-powered blocking</li>
            <li>✓ Real-time threat detection</li>
            <li>✓ Custom regex patterns</li>
            <li>✓ Advanced analytics dashboard</li>
            <li>✓ 100+ ultimate blocking rules</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderTier5Maintenance = () => {
    const weeklyEngagement = tierProgress?.progress?.weeklyEngagement || 0;

    return (
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Tier 5 - Ultimate Active</h3>

        <div className="bg-white/20 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">Weekly Engagement Status</h4>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
              const today = new Date().getDay();
              const isEngaged = index < weeklyEngagement;
              const isToday = index === today;

              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    ${isEngaged ? 'bg-white text-purple-600' : 'bg-white/30'}
                    ${isToday ? 'ring-2 ring-white' : ''}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
          {weeklyEngagement < 7 && (
            <p className="text-xs mt-2 opacity-90">
              ⚠️ Use ShieldPro {7 - weeklyEngagement} more days this week to maintain Tier 5
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
            <span className="text-sm">AI Blocking</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
            <span className="text-sm">Real-time Protection</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
            <span className="text-sm">Premium Support</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs opacity-90">
            You have access to all ShieldPro features. Keep using the extension daily to maintain
            your Ultimate tier status.
          </p>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-4">
      {currentTier === 2 && renderTier2Progression()}
      {currentTier === 3 && renderTier3Progression()}
      {currentTier === 4 && renderTier4Progression()}
      {currentTier === 5 && renderTier5Maintenance()}
    </div>
  );
};

export default TierProgressionManager;
