import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  Mail, 
  Shield, 
  Calendar,
  Award,
  RefreshCw,
  LogOut,
  Save,
  Upload,
  Download,
  Trash2,
  Check,
  X,
  Edit2,
  Camera
} from 'lucide-react';
import { SignIn } from './SignIn';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: {
    level: number;
    name: string;
    unlockedAt: number;
    progress: number;
  };
  stats?: {
    joinedAt: number;
    lastActive: number;
    referralCode?: string;
    referralCount?: number;
    totalBlocked?: number;
  };
}

export const ProfileManagement: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Check if user is logged in via chrome storage
      const result = await chrome.storage.local.get(['authUser', 'authProfile']);
      
      if (result.authUser && result.authProfile) {
        setUser({
          uid: result.authUser.uid,
          email: result.authUser.email,
          displayName: result.authUser.displayName || result.authProfile.displayName,
          photoURL: result.authUser.photoURL,
          tier: result.authProfile.tier || { level: 1, name: 'Basic', unlockedAt: Date.now(), progress: 0 },
          stats: result.authProfile.stats
        });
        setDisplayName(result.authUser.displayName || result.authProfile.displayName || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Send message to background script to update profile
      const response = await chrome.runtime.sendMessage({
        action: 'updateProfile',
        displayName: displayName
      });
      
      if (response?.success) {
        setUser(prev => prev ? { ...prev, displayName } : null);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update local storage
        const result = await chrome.storage.local.get(['authUser']);
        if (result.authUser) {
          result.authUser.displayName = displayName;
          await chrome.storage.local.set({ authUser: result.authUser });
        }
      } else {
        setMessage({ type: 'error', text: response?.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await chrome.runtime.sendMessage({ action: 'signout' });
        await chrome.storage.local.remove(['authUser', 'authProfile']);
        setUser(null);
        setMessage({ type: 'success', text: 'Signed out successfully' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to sign out' });
      }
    }
  };

  const handleExportData = async () => {
    try {
      const data = await chrome.storage.local.get(null);
      const exportData = {
        profile: user,
        settings: data.settings,
        customFilters: data.customFilters,
        whitelist: data.whitelist,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shieldpro-profile-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Profile data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export profile data' });
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        try {
          await chrome.runtime.sendMessage({ action: 'deleteAccount' });
          await chrome.storage.local.clear();
          setUser(null);
          setMessage({ type: 'success', text: 'Account deleted successfully' });
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to delete account' });
        }
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-1 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none text-gray-900 dark:text-white"
                  placeholder="Enter your name"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.displayName || 'Anonymous User'}
                </h2>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setDisplayName(user.displayName || '');
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-primary-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Tier</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.tier.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Level {user.tier.level}</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Joined</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.stats?.joinedAt ? formatDate(user.stats.joinedAt) : 'Unknown'}
            </p>
          </div>

          {user.stats?.referralCode && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Referral Code</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.stats.referralCode}
              </p>
            </div>
          )}

          {user.stats?.totalBlocked !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Blocked</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.stats.totalBlocked.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Export Profile Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download all your settings and data</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sign out of your account</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Permanently delete your account and data</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};