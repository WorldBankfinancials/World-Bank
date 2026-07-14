import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Shield, MapPin, Check, Eye, Lock, KeyRound, Pencil } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import LiveChat from "@/components/LiveChat";
import { useToast } from "@/hooks/use-toast";

import { useLanguage } from "@/contexts/LanguageContext";
import { CustomerData } from "@/types";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    profession: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { data: user, isLoading } = useQuery<CustomerData>({
    queryKey: ['/api/user'],
  });
  const displayUser: CustomerData = user || { id: '' };
  const loading = isLoading;

  // Initialize edit form when user data loads or editing starts
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: (user as any).fullName || (user as any).firstName || '',
        phone: (user as any).phone || '',
        profession: (user as any).profession || '',
        address: (user as any).address || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
        postalCode: (user as any).postalCode || '',
      });
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current user values
    if (user) {
      setEditForm({
        fullName: (user as any).fullName || (user as any).firstName || '',
        phone: (user as any).phone || '',
        profession: (user as any).profession || '',
        address: (user as any).address || '',
        city: (user as any).city || '',
        country: (user as any).country || '',
        postalCode: (user as any).postalCode || '',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const res = await authenticatedFetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update profile');
      }
      toast({ title: 'Success', description: 'Profile updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditing(false);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={(displayUser as any) || undefined} />

      <div className="px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">View your profile information and account details</p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-4">
                {displayUser && 'avatarUrl' in displayUser && (displayUser as any).avatarUrl ? (
                  <img
                    src={(displayUser as any).avatarUrl}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : (
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                      border: '4px solid #DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      position: 'relative'
                    }}
                  >
                    {(displayUser?.firstName || displayUser?.fullName || 'U')?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#10B981',
                        borderRadius: '50%',
                        border: '2px solid white'
                      }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{displayUser?.firstName || displayUser?.fullName || 'User'}</h3>
                  <p className="text-gray-600">{(displayUser as any)?.profession ? (displayUser as any).profession : 'Customer'}</p>
                  <Badge className="bg-green-100 text-green-800 mt-1">
                    <Check className="w-3 h-3 mr-1" />
                    {(displayUser as any)?.isVerified ? t('verified_account') : 'Account'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('full_name')}</label>
                  <p className="text-gray-900 font-medium">{displayUser?.firstName || displayUser?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('email_address')}</label>
                  <p className="text-gray-900">{(displayUser as any)?.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('phone')}</label>
                  <p className="text-gray-900">{(displayUser as any)?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('profession')}</label>
                  <p className="text-gray-900">{(displayUser as any)?.profession || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('nationality')}</label>
                  <p className="text-gray-900">{(displayUser as any)?.nationality || (displayUser as any)?.country || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('annual_income')}</label>
                  <p className="text-gray-900">{(displayUser as any)?.annualIncome || 'Not provided'}</p>
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-fullName">Full Name</Label>
                      <Input id="edit-fullName" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-profession">Profession</Label>
                      <Input id="edit-profession" value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-address">Address</Label>
                      <Input id="edit-address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-city">City</Label>
                      <Input id="edit-city" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-country">Country</Label>
                      <Input id="edit-country" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="edit-postalCode">Postal Code</Label>
                      <Input id="edit-postalCode" value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure Profile
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Number</label>
                  <p className="text-gray-900 font-mono">{(displayUser as any)?.accountNumber || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account ID</label>
                  <p className="text-gray-900 font-mono">{(displayUser as any)?.accountId || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{(displayUser as any)?.address || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-gray-900">{(displayUser as any)?.city || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-gray-900">{(displayUser as any)?.country || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Postal Code</label>
                  <p className="text-gray-900">{(displayUser as any)?.postalCode || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Transfer PIN Settings</p>
                  <p className="text-sm text-gray-500">Change your transfer PIN</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/pin-settings')}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change PIN
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Session Security</p>
                    <p className="text-sm text-gray-500">Automatic logout and session management</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/verification')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Verification Center
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">
                  Need to update your profile information? Contact our customer support team for assistance.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowLiveChat(true)}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LiveChat 
        isOpen={showLiveChat} 
        onClose={() => setShowLiveChat(false)} 
      />

      <BottomNavigation />
    </div>
  );
}