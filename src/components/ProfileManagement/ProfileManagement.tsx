import React, { useState } from 'react';
import { 
  Download, 
  Upload,
  Trash2,
  LogOut,
  Key,
  Bell,
  Globe,
  Palette,
  ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ProfileCard } from './ProfileCard';
import { SyncSettings } from './SyncSettings';
import { UserProfile } from '../../services/firebase.service';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from '../ui/use-toast';

export const ProfileManagement: React.FC = () => {
  const { user, profile, loading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const firebaseService = FirebaseService.getInstance();
  const authService = AuthService.getInstance();

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    try {
      await firebaseService.updateUserProfile(user!.uid, updates);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = {
        profile: profile,
        settings: await chrome.storage.local.get(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shieldpro-profile-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your profile data has been exported successfully.',
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
      setShowExportDialog(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.profile || !data.settings || !data.version) {
        throw new Error('Invalid data format');
      }

      // Import settings
      await chrome.storage.local.set(data.settings);

      // Update profile if needed
      if (data.profile && user) {
        await firebaseService.updateUserProfile(user.uid, data.profile);
      }

      toast({
        title: 'Data Imported',
        description: 'Your profile data has been imported successfully.',
      });

      // Reload to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to import data:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import your data. Please check the file format.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete user data from Firestore
      if (user) {
        await firebaseService.deleteUserData(user.uid);
      }

      // Delete authentication account
      await authService.deleteAccount();

      // Clear local storage
      await chrome.storage.local.clear();
      localStorage.clear();

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Redirect to login
      window.location.href = '/popup.html';
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully.',
      });
      window.location.href = '/popup.html';
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'Failed to sign you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to manage your profile
            </p>
            <Button 
              className="w-full mt-4"
              onClick={() => window.location.href = '/popup.html'}
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and sync preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileCard 
            profile={profile} 
            loading={loading}
            onUpdate={handleProfileUpdate}
          />

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Notification Preferences</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Language Settings</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Theme Preferences</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Change Password</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <SyncSettings profile={profile} onUpdate={handleProfileUpdate} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control how your data is collected and used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Help improve ShieldPro by sharing anonymous usage data
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Crash Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically send crash reports to help fix issues
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Sharing</p>
                    <p className="text-sm text-muted-foreground">
                      Control what data is shared with third parties
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or import your profile data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">
                    Download all your profile data and settings
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-muted-foreground">
                    Restore your profile from a backup file
                  </p>
                </div>
                <label htmlFor="import-file">
                  <Button variant="outline" as="span">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportData}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Danger Zone</AlertTitle>
            <AlertDescription>
              These actions are permanent and cannot be undone. Please proceed with caution.
            </AlertDescription>
          </Alert>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Account Actions</CardTitle>
              <CardDescription>
                Permanent actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">
                    Sign out from all devices
                  </p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your data, settings, and progress will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Profile Data</DialogTitle>
            <DialogDescription>
              Your profile data will be exported as a JSON file. This includes your profile
              information, settings, and preferences. Keep this file safe as it contains
              sensitive information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};