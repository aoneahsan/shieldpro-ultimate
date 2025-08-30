import React, { useState, useRef } from 'react';
import { Camera, Edit2, Check, X, Upload, User } from 'lucide-react';
import { UserProfile } from '../../services/firebase.service';
import { uploadProfileImage } from '../../services/storage.service';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

interface ProfileCardProps {
  profile: UserProfile | null;
  loading?: boolean;
  onUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  loading = false, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      await onUpdate({ displayName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.displayName || '');
    setIsEditing(false);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const photoURL = await uploadProfileImage(profile.uid, file);
      await onUpdate({ photoURL });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  // Removed unused initials variable - using User icon instead in AvatarFallback

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profile Information</span>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {profile.photoURL ? (
                <AvatarImage src={profile.photoURL} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <User className="h-10 w-10 text-primary" />
                </AvatarFallback>
              )}
            </Avatar>
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h3 className="text-lg font-semibold">
                {profile.displayName || 'Anonymous User'}
              </h3>
            )}
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                Tier {profile.tier.level} - {profile.tier.name}
              </Badge>
              <Badge variant="outline">
                {profile.tier.progress}% Progress
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Blocked</p>
            <p className="text-2xl font-bold">{profile.stats.totalBlocked.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Referrals</p>
            <p className="text-2xl font-bold">{profile.referralCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="text-sm font-medium">
              {profile.stats.installDate.toDate().toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Active</p>
            <p className="text-sm font-medium">
              {profile.stats.lastActive.toDate().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
              {profile.referralCode}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(profile.referralCode)}
            >
              Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};