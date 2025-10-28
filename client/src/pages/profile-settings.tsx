import type { User as UserType } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User, Shield, MapPin, Check, Eye, Lock, KeyRound } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [displayUser, setDisplayUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setLocation('/login');
          return;
        }

        const { data: bankUser, error } = await supabase
          .from('bank_users')
          .select('*')
          .eq('supabase_user_id', authUser.id)
          .single();

        if (error) throw error;
        
        setDisplayUser(bankUser);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [setLocation]);


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
      <Header user={displayUser} />

      <div className="px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">View your profile information and account details</p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-4">
                {(displayUser as any)?.avatarUrl ? (
                  <img
                    src={(displayUser as any)?.avatarUrl}
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
                    {displayUser?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
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
                  <h3 className="text-lg font-semibold text-gray-900">{displayUser?.fullName || 'User'}</h3>
                  <p className="text-gray-600">{(displayUser as any)?.profession || 'Customer'}</p>
                  <Badge className="bg-green-100 text-green-800 mt-1">
                    <Check className="w-3 h-3 mr-1" />
                    {(displayUser as any)?.isVerified ? t('verified_account') : 'Account'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('full_name')}</label>
                  <p className="text-gray-900 font-medium">{displayUser?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('email_address')}</label>
                  <p className="text-gray-900">{displayUser?.email || 'Not provided'}</p>
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
                  <p className="text-gray-900 font-mono">{displayUser?.accountNumber || 'Not assigned'}</p>
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
                  <p className="text-sm text-gray-500">Contact customer support to request PIN changes</p>
                </div>
                <Badge className="bg-gray-100 text-gray-600">Admin Only</Badge>
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
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}