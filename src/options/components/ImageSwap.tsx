import React, { useState, useEffect } from 'react';
import { Image, Cat, Dog, Trees, Mountain, Coffee, Heart, Star, Sparkles, Upload, X } from 'lucide-react';
import { StorageManager } from '../../shared/utils/storage';

interface ImageCategory {
  id: string;
  name: string;
  icon: any;
  images: string[];
  requiredTier: number;
}

const imageCategories: ImageCategory[] = [
  {
    id: 'cats',
    name: 'Cats',
    icon: Cat,
    images: [
      'https://cataas.com/cat',
      'https://cataas.com/cat/cute',
      'https://cataas.com/cat/gif'
    ],
    requiredTier: 3
  },
  {
    id: 'dogs',
    name: 'Dogs',
    icon: Dog,
    images: [
      'https://random.dog/woof.json',
      'https://dog.ceo/api/breeds/image/random'
    ],
    requiredTier: 3
  },
  {
    id: 'nature',
    name: 'Nature',
    icon: Trees,
    images: [
      'https://picsum.photos/300/250?nature',
      'https://source.unsplash.com/300x250/?nature'
    ],
    requiredTier: 3
  },
  {
    id: 'mountains',
    name: 'Mountains',
    icon: Mountain,
    images: [
      'https://picsum.photos/300/250?mountain',
      'https://source.unsplash.com/300x250/?mountain'
    ],
    requiredTier: 3
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: Coffee,
    images: [
      'https://coffee.alexflipnote.dev/random',
      'https://source.unsplash.com/300x250/?coffee'
    ],
    requiredTier: 4
  },
  {
    id: 'inspirational',
    name: 'Quotes',
    icon: Heart,
    images: [
      'https://source.unsplash.com/300x250/?inspiration',
      'https://picsum.photos/300/250?grayscale'
    ],
    requiredTier: 4
  },
  {
    id: 'space',
    name: 'Space',
    icon: Star,
    images: [
      'https://source.unsplash.com/300x250/?space',
      'https://source.unsplash.com/300x250/?galaxy'
    ],
    requiredTier: 5
  },
  {
    id: 'abstract',
    name: 'Abstract',
    icon: Sparkles,
    images: [
      'https://source.unsplash.com/300x250/?abstract',
      'https://picsum.photos/300/250?blur'
    ],
    requiredTier: 5
  }
];

interface ImageSwapProps {
  currentTier: number;
}

export const ImageSwap: React.FC<ImageSwapProps> = ({ currentTier }) => {
  const [enabled, setEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['cats']);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [replaceFrequency, setReplaceFrequency] = useState(25); // percentage
  const [imageSize, setImageSize] = useState('original');
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    if (settings.imageSwap) {
      setEnabled(settings.imageSwap.enabled || false);
      setSelectedCategories(settings.imageSwap.categories || ['cats']);
      setCustomImages(settings.imageSwap.customImages || []);
      setReplaceFrequency(settings.imageSwap.frequency || 25);
      setImageSize(settings.imageSwap.size || 'original');
    }
  };

  const saveSettings = async () => {
    const storage = StorageManager.getInstance();
    await storage.setSettings({
      imageSwap: {
        enabled,
        categories: selectedCategories,
        customImages,
        frequency: replaceFrequency,
        size: imageSize
      }
    });

    // Send message to content scripts to update image swap
    chrome.runtime.sendMessage({
      action: 'updateImageSwap',
      settings: {
        enabled,
        categories: selectedCategories,
        customImages,
        frequency: replaceFrequency,
        size: imageSize
      }
    });
  };

  const toggleEnabled = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    saveSettings();
  };

  const toggleCategory = (categoryId: string) => {
    const category = imageCategories.find(c => c.id === categoryId);
    if (!category || currentTier < category.requiredTier) return;

    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newCategories);
    saveSettings();
  };

  const addCustomImage = () => {
    if (newImageUrl && !customImages.includes(newImageUrl)) {
      const newImages = [...customImages, newImageUrl];
      setCustomImages(newImages);
      setNewImageUrl('');
      saveSettings();
    }
  };

  const removeCustomImage = (url: string) => {
    const newImages = customImages.filter(img => img !== url);
    setCustomImages(newImages);
    saveSettings();
  };

  const getRandomReplacementImage = () => {
    const allImages: string[] = [];
    
    // Add images from selected categories
    selectedCategories.forEach(catId => {
      const category = imageCategories.find(c => c.id === catId);
      if (category) {
        allImages.push(...category.images);
      }
    });
    
    // Add custom images
    allImages.push(...customImages);
    
    if (allImages.length === 0) {
      return 'https://cataas.com/cat'; // Default fallback
    }
    
    return allImages[Math.floor(Math.random() * allImages.length)];
  };

  const handlePreview = () => {
    const image = getRandomReplacementImage();
    setPreviewImage(image);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Image Swap</h3>
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                AdBlock Premium Feature - FREE Here!
              </span>
            </div>
            <button
              onClick={toggleEnabled}
              disabled={currentTier < 3}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${currentTier < 3 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform top-0.5 ${
                enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Replace blocked ads with beautiful images instead of blank spaces
          </p>
          {currentTier < 3 && (
            <p className="text-sm text-amber-600 mt-2">
              ⚡ Unlock at Tier 3 by completing your profile
            </p>
          )}
        </div>

        {enabled && currentTier >= 3 && (
          <div className="p-4 space-y-4">
            {/* Replacement Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Replacement Frequency: {replaceFrequency}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={replaceFrequency}
                onChange={(e) => {
                  setReplaceFrequency(Number(e.target.value));
                  saveSettings();
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10% (Subtle)</span>
                <span>50% (Balanced)</span>
                <span>100% (All ads)</span>
              </div>
            </div>

            {/* Image Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Size
              </label>
              <div className="flex space-x-2">
                {['original', 'small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setImageSize(size);
                      saveSettings();
                    }}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      imageSize === size
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Categories */}
      {enabled && currentTier >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium">Image Categories</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose what types of images to display
            </p>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageCategories.map(category => {
                const Icon = category.icon;
                const isLocked = currentTier < category.requiredTier;
                const isSelected = selectedCategories.includes(category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    disabled={isLocked}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      isSelected ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium">{category.name}</div>
                    {isLocked && (
                      <div className="text-xs text-gray-500 mt-1">
                        Tier {category.requiredTier}+
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom Images */}
      {enabled && currentTier >= 4 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Custom Images</span>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                Tier 4+
              </span>
            </h4>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex space-x-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <button
                onClick={addCustomImage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            
            {customImages.length > 0 && (
              <div className="space-y-2">
                {customImages.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm truncate flex-1">{url}</span>
                    <button
                      onClick={() => removeCustomImage(url)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {enabled && currentTier >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <button
              onClick={handlePreview}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700"
            >
              Preview Random Replacement Image
            </button>
            
            {showPreview && previewImage && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="mx-auto rounded-lg shadow-lg"
                  style={{ maxWidth: '300px', maxHeight: '250px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x250?text=Image+Not+Found';
                  }}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  This image would replace blocked ads
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};