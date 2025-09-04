// client/src/pages/profile-settings.tsx
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User as UserType } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Button } from "@/components/ui/button";
import { User, Shield, MapPin, Check, Eye, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();

  // Fetch logged-in user profile from Supabase
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .single();
      if (error) throw error;
      return data as UserType;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <div className="px-4 py-6 pb-20">
        {/* Page Header */}
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
            <div className="flex items-center space-x-4 mb-4">
              {(user as any)?.avatarUrl ? (
                <img
                  src={(user as any)?.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 border-4 border-blue-100 flex items-center justify-center text-white font-bold relative">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'LW'}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                <p className="text-gray-600">{(user as any)?.profession}</p>
                <Badge className="bg-green-100 text-green-800 mt-1">
                  <Check className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900 font-medium">{user?.fullName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{(user as any)?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Profession</label>
                <p className="text-gray-900">{(user as any)?.profession || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Nationality</label>
                <p className="text-gray-900">{(user as any)?.country || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Annual Income</label>
                <p className="text-gray-900">{(user as any)?.annualIncome || 'Not provided'}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Number</label>
                <p className="text-gray-900 font-mono">{user?.accountNumber || 'Not assigned'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account ID</label>
                <p className="text-gray-900 font-mono">{(user as any)?.accountId || 'Not assigned'}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{(user as any)?.address || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <p className="text-gray-900">{(user as any)?.city || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <p className="text-gray-900">{(user as any)?.country || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Postal Code</label>
                <p className="text-gray-900">{(user as any)?.postalCode || 'Not provided'}</p>
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
              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Extra layer of security</p>
                </div>
                <Badge className="bg-green-100 text-green-800">{(user as any)?.twoFA ? 'Enabled' : 'Disabled'}</Badge>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Session Security</p>
                  <p className="text-sm text-gray-500">Automatic logout and session management</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{(user as any)?.sessionActive ? 'Active' : 'Inactive'}</Badge>
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
                className="
