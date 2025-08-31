import React from 'react';
import { Shield, Lock, Unlock, Star, Trophy, Gift, Users, Calendar, Target, Zap } from 'lucide-react';

const tiers = [
  {
    level: 1,
    name: 'Basic Shield',
    percentage: '0-20%',
    icon: Shield,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    features: [
      'Basic ad blocking',
      'Popup blocking',
      'Tracker protection',
      'No account required'
    ],
    requirement: 'Available to everyone',
    unlocked: true
  },
  {
    level: 2,
    name: 'Bronze Guardian',
    percentage: '20-40%',
    icon: Lock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    features: [
      'YouTube ad blocking',
      'Advanced tracker blocking',
      'Custom filter lists',
      'Sync across devices'
    ],
    requirement: 'Create an account',
    unlocked: false
  },
  {
    level: 3,
    name: 'Silver Defender',
    percentage: '40-60%',
    icon: Star,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    features: [
      'Custom domain blocking',
      'Whitelist management',
      'Advanced statistics',
      'Priority filter updates'
    ],
    requirement: 'Complete your profile',
    unlocked: false
  },
  {
    level: 4,
    name: 'Gold Champion',
    percentage: '60-80%',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    features: [
      'Element picker tool',
      'Custom CSS injection',
      'Script blocking',
      'API access'
    ],
    requirement: 'Refer 30 friends',
    unlocked: false
  },
  {
    level: 5,
    name: 'Ultimate Master',
    percentage: '80-100%',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'AI-powered ad detection',
      'Zero-day filter updates',
      'Advanced debugging tools',
      'Premium support',
      'All future features'
    ],
    requirement: 'Weekly engagement',
    unlocked: false
  }
];

export function TiersInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ShieldPro Ultimate Tiers
          </h1>
          <p className="text-xl text-gray-600">
            Unlock powerful features as you progress through our tier system
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.level}
                className={`
                  relative rounded-2xl p-6 transition-all duration-300
                  ${tier.bgColor} ${tier.borderColor}
                  border-2 hover:shadow-xl hover:scale-105
                  ${!tier.unlocked ? 'opacity-90' : ''}
                `}
              >
                {tier.unlocked && (
                  <div className="absolute -top-3 -right-3">
                    <Unlock className="w-6 h-6 text-green-500" />
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${tier.bgColor}`}>
                    <Icon className={`w-8 h-8 ${tier.color}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Tier {tier.level}
                    </h2>
                    <p className={`text-sm font-medium ${tier.color}`}>
                      {tier.name}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-gray-800">{tier.percentage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        tier.level === 1 ? 'bg-gray-500' :
                        tier.level === 2 ? 'bg-amber-500' :
                        tier.level === 3 ? 'bg-gray-400' :
                        tier.level === 4 ? 'bg-yellow-500' :
                        'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: tier.unlocked ? '100%' : '0%' }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Features:</h3>
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`mt-1 ${tier.color}`}>✓</span>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`
                  mt-4 pt-4 border-t ${tier.borderColor}
                `}>
                  <div className="flex items-center gap-2">
                    {tier.level === 2 && <Users className="w-4 h-4 text-gray-500" />}
                    {tier.level === 3 && <Target className="w-4 h-4 text-gray-500" />}
                    {tier.level === 4 && <Gift className="w-4 h-4 text-gray-500" />}
                    {tier.level === 5 && <Calendar className="w-4 h-4 text-gray-500" />}
                    <span className="text-sm font-medium text-gray-700">
                      {tier.requirement}
                    </span>
                  </div>
                </div>

                {!tier.unlocked && (
                  <div className="absolute inset-0 bg-gray-900/5 rounded-2xl flex items-center justify-center">
                    <Lock className={`w-12 h-12 ${tier.color} opacity-20`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Your current tier determines which features are available to you.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.close()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
            >
              Get Started
            </button>
            <button 
              onClick={() => {
                if (chrome?.tabs) {
                  chrome.tabs.create({ url: 'https://shieldpro.example.com/learn-more' });
                }
              }}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold border border-gray-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}