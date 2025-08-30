import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';

interface FirebaseUserStats {
  referralCount: number;
  tier: number;
  totalEarnings?: number;
  conversionRate?: number;
}

interface ReferralSystemProps {
  _userId: string;
  referralCode: string;
  referralCount: number;
  _onReferralSuccess?: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({
  _userId,
  referralCode,
  referralCount,
  _onReferralSuccess
}) => {
  const [shareMethod, setShareMethod] = useState<'link' | 'qr' | 'email'>('link');
  const [emailTo, setEmailTo] = useState('');
  const [copied, setCopied] = useState(false);
  const [_loading, _setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: referralCount,
    pendingRewards: 0,
    tier4Progress: Math.min(100, (referralCount / 30) * 100)
  });

  const referralUrl = `https://shieldpro.app/ref/${referralCode}`;
  const shareMessage = `🛡️ Block ads like a pro with ShieldPro Ultimate!\n\n✨ Use my referral code: ${referralCode}\n\n🎁 We both get rewards when you sign up!\n\n👉 ${referralUrl}`;

  const generateQRCode = React.useCallback(async () => {
    // Using qr-server.com API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`;
    setQrCodeUrl(qrUrl);
  }, [referralUrl]);

  const loadReferralStats = React.useCallback(async () => {
    try {
      const getUserStatistics = httpsCallable(functions, 'getUserStatistics');
      const result = await getUserStatistics();
      const stats = result.data as FirebaseUserStats;
      
      setReferralStats({
        totalReferrals: stats.referralCount || referralCount,
        pendingRewards: Math.max(0, 30 - (stats.referralCount || referralCount)),
        tier4Progress: Math.min(100, ((stats.referralCount || referralCount) / 30) * 100)
      });
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  }, [referralCount]);

  useEffect(() => {
    generateQRCode();
    loadReferralStats();
  }, [generateQRCode, loadReferralStats]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Try ShieldPro Ultimate - Advanced Ad Blocker');
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`);
  };

  const handleSocialShare = (platform: string) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(referralUrl);
    const encodedMessage = encodeURIComponent(`Block ads like a pro! Use my code: ${referralCode}`);

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedMessage}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Referral Program</h2>
        <p className="text-sm text-gray-600">
          Share ShieldPro and unlock Tier 4 Premium features when you reach 30 referrals!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress to Tier 4</span>
          <span className="text-sm text-gray-600">
            {referralStats.totalReferrals} / 30 referrals
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${referralStats.tier4Progress}%` }}
          />
        </div>
        {referralStats.pendingRewards > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {referralStats.pendingRewards} more referrals needed for Tier 4!
          </p>
        )}
      </div>

      {/* Referral Code Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Your Referral Code</span>
          {copied && (
            <span className="text-xs text-green-600 animate-fade-in">Copied!</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-white px-4 py-3 rounded-lg border border-blue-200 font-mono text-lg font-bold text-blue-600">
            {referralCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Copy code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Share Methods Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setShareMethod('link')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            shareMethod === 'link' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Share Link
        </button>
        <button
          onClick={() => setShareMethod('qr')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            shareMethod === 'qr' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          QR Code
        </button>
        <button
          onClick={() => setShareMethod('email')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            shareMethod === 'email' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Email
        </button>
      </div>

      {/* Share Link Tab */}
      {shareMethod === 'link' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Message
            </label>
            <textarea
              value={shareMessage}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 h-24 resize-none"
            />
            <button
              onClick={handleCopyMessage}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Copy Message
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSocialShare('twitter')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-5 h-5 mx-auto text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialShare('facebook')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on Facebook"
              >
                <svg className="w-5 h-5 mx-auto text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialShare('linkedin')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on LinkedIn"
              >
                <svg className="w-5 h-5 mx-auto text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on WhatsApp"
              >
                <svg className="w-5 h-5 mx-auto text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialShare('telegram')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on Telegram"
              >
                <svg className="w-5 h-5 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialShare('reddit')}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Share on Reddit"
              >
                <svg className="w-5 h-5 mx-auto text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Tab */}
      {shareMethod === 'qr' && (
        <div className="text-center">
          <div className="mb-4">
            <img 
              src={qrCodeUrl} 
              alt="Referral QR Code" 
              className="mx-auto border-4 border-gray-200 rounded-lg"
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Scan this QR code to share your referral link
          </p>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrCodeUrl;
              link.download = `shieldpro-referral-${referralCode}.png`;
              link.click();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Download QR Code
          </button>
        </div>
      )}

      {/* Email Tab */}
      {shareMethod === 'email' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleEmailShare}
            disabled={!emailTo}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Send Email Invitation
          </button>
        </div>
      )}

      {/* Referral Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Referral Statistics</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {referralStats.totalReferrals}
            </div>
            <div className="text-xs text-gray-500">Total Referrals</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {referralStats.pendingRewards}
            </div>
            <div className="text-xs text-gray-500">Needed for Tier 4</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {referralStats.tier4Progress}%
            </div>
            <div className="text-xs text-gray-500">Progress</div>
          </div>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <h4 className="text-sm font-medium text-amber-900 mb-2">
          🎁 Referral Rewards
        </h4>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• 5 referrals: Extended whitelist capacity</li>
          <li>• 10 referrals: Custom filter templates</li>
          <li>• 20 referrals: Priority support access</li>
          <li>• 30 referrals: Unlock Tier 4 Premium!</li>
        </ul>
      </div>
    </div>
  );
};

export default ReferralSystem;