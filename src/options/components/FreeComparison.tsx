import { Shield, DollarSign, Check, X, Sparkles, TrendingUp, Gift } from 'lucide-react';

export function FreeComparison() {
  const competitors = [
    {
      name: 'AdBlock Plus',
      price: '$40/year',
      features: {
        'Cookie Consent Blocking': { available: true, premium: true },
        'Floating Video Removal': { available: true, premium: true },
        'Newsletter Popup Blocking': { available: true, premium: true },
        'YouTube Ad Blocking': { available: true, premium: false },
        'Social Media Tracking Block': { available: true, premium: false },
        'Custom Filters': { available: true, premium: false },
        'Malware Protection': { available: false },
        'AI-Powered Blocking': { available: false },
      }
    },
    {
      name: 'AdGuard',
      price: '$30-60/year',
      features: {
        'Cookie Consent Blocking': { available: true, premium: true },
        'Floating Video Removal': { available: true, premium: true },
        'Newsletter Popup Blocking': { available: true, premium: true },
        'YouTube Ad Blocking': { available: true, premium: false },
        'Social Media Tracking Block': { available: true, premium: true },
        'Custom Filters': { available: true, premium: true },
        'Malware Protection': { available: true, premium: true },
        'AI-Powered Blocking': { available: false },
      }
    },
    {
      name: 'uBlock Origin',
      price: 'Free',
      features: {
        'Cookie Consent Blocking': { available: true, premium: false, manual: true },
        'Floating Video Removal': { available: true, premium: false, manual: true },
        'Newsletter Popup Blocking': { available: true, premium: false },
        'YouTube Ad Blocking': { available: true, premium: false },
        'Social Media Tracking Block': { available: true, premium: false },
        'Custom Filters': { available: true, premium: false },
        'Malware Protection': { available: true, premium: false },
        'AI-Powered Blocking': { available: false },
      }
    }
  ];

  const ourFeatures = {
    'Cookie Consent Blocking': { tier: 1, description: 'Auto-blocks cookie popups' },
    'Floating Video Removal': { tier: 1, description: 'Removes sticky videos' },
    'Newsletter Popup Blocking': { tier: 1, description: 'Blocks signup modals' },
    'YouTube Ad Blocking': { tier: 2, description: 'Complete YouTube protection' },
    'Social Media Tracking Block': { tier: 2, description: 'Privacy protection' },
    'Custom Filters': { tier: 3, description: 'Advanced filter editor' },
    'Malware Protection': { tier: 4, description: 'Security suite' },
    'AI-Powered Blocking': { tier: 5, description: 'Machine learning detection' },
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-3 flex items-center">
              <Gift className="w-8 h-8 mr-3" />
              Everything is 100% FREE!
            </h2>
            <p className="text-xl opacity-95">
              Why pay $40-120/year when ShieldPro Ultimate offers MORE features for FREE?
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold">$0</div>
            <div className="text-lg mt-2">Forever</div>
          </div>
        </div>
      </div>

      {/* Savings Calculator */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-500">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
          Your Annual Savings
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-red-500">$40</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">vs AdBlock Plus</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-red-500">$60</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">vs AdGuard</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
            <div className="text-2xl font-bold text-green-500">$100+</div>
            <div className="text-sm text-green-600 dark:text-green-400">Total Saved!</div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h3 className="text-2xl font-bold flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            Feature Comparison
          </h3>
          <p className="mt-2 opacity-90">See what competitors charge for vs what we offer FREE</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                {competitors.map(comp => (
                  <th key={comp.name} className="px-4 py-4 text-center text-sm font-semibold">
                    <div>{comp.name}</div>
                    <div className="text-red-500 text-xs mt-1">{comp.price}</div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-semibold bg-green-50 dark:bg-green-900/20">
                  <div className="text-green-600 dark:text-green-400">ShieldPro Ultimate</div>
                  <div className="text-green-500 text-xs mt-1 font-bold">100% FREE</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(ourFeatures).map(([feature, info]) => (
                <tr key={feature} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium">{feature}</td>
                  {competitors.map(comp => {
                    const f = comp.features[feature as keyof typeof comp.features];
                    return (
                      <td key={comp.name} className="px-4 py-4 text-center">
                        {!f?.available ? (
                          <X className="w-5 h-5 text-red-500 mx-auto" />
                        ) : f.premium ? (
                          <div>
                            <DollarSign className="w-5 h-5 text-orange-500 mx-auto" />
                            <span className="text-xs text-orange-600 dark:text-orange-400">Premium</span>
                          </div>
                        ) : f.manual ? (
                          <div>
                            <Check className="w-5 h-5 text-yellow-500 mx-auto" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Manual</span>
                          </div>
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 text-center bg-green-50 dark:bg-green-900/20">
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Tier {info.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unique Features */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
          Exclusive Features Only We Offer
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🎮', title: 'Progressive Tier System', desc: 'Unlock through engagement, not payment' },
            { icon: '🤖', title: 'AI Detection', desc: 'Machine learning ad blocking' },
            { icon: '🏆', title: 'Early Adopter Rewards', desc: 'First 100k users get everything forever' },
            { icon: '☁️', title: 'Cloud Sync', desc: 'Settings sync across all devices' },
            { icon: '🛡️', title: 'Security Suite', desc: 'Built-in malware & phishing protection' },
            { icon: '📊', title: 'Advanced Analytics', desc: 'Detailed blocking statistics' },
          ].map(item => (
            <div key={item.title} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-3">Stop Paying for Ad Blocking!</h3>
        <p className="text-lg opacity-95 mb-6">
          Join thousands who've switched to truly free, powerful ad blocking
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.open('/free-vs-paid.html', '_blank')}
            className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            See Full Comparison
          </button>
          <button
            onClick={() => chrome.tabs.create({ url: 'https://chrome.google.com/webstore' })}
            className="px-6 py-3 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800 transition-colors"
          >
            Share with Friends
          </button>
        </div>
      </div>
    </div>
  );
}