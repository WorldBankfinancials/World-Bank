// client/src/pages/profile-settings.tsx
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User as UserType } from "@/lib/schema";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Shield, MapPin, Check, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfileSettings() {
  const [, setLocation] = useLocation();

  // fetch logged-in user's profile securely
  const { data: user, isLoading, error } = useQuery<UserType>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // normalize fields in case schema uses snake_case
      return {
        ...data,
        fullName: data.fullName ?? data.full_name,
        accountId: data.accountId ?? data.account_id,
        accountNumber: data.accountNumber ?? data.account_number,
        annualIncome: data.annualIncome ?? data.annual_income,
        twoFA: data.twoFA ?? data.two_fa,
        sessionActive: data.sessionActive ?? data.session_active,
        avatarUrl: data.avatarUrl ?? data.avatar_url,
      } as UserType;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Failed to load profile. {String(error)}</div>
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
          <p className="text-gray-600 mt-1">
            View your profile information and account details
          </p>
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
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 border-4 border-blue-100 flex items-center justify-center text-white font-bold relative">
                  {(user?.fullName || "LW")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.fullName}
                </h3>
                <p className="text-gray-600">{user?.profession}</p>
                <Badge className="bg-green-100 text-green-800 mt-1">
                  <Check className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info label="Full Name" value={user?.fullName} />
              <Info label="Email" value={user?.email} />
              <Info label="Phone" value={user?.phone} />
              <Info label="Profession" value={user?.profession} />
              <Info label="Nationality" value={user?.country} />
              <Info label="Annual Income" value={user?.annualIncome} />
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
              <Info label="Account Number" value={user?.accountNumber} mono />
              <Info label="Account ID" value={user?.accountId} mono />
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
              <Info label="Address" value={user?.address} />
              <Info label="City" value={user?.city} />
              <Info label="Country" value={user?.country} />
              <Info label="Postal Code" value={user?.postalCode} />
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
              <Setting
                title="Transfer PIN Settings"
                desc="Contact customer support to request PIN changes"
                value="Admin Only"
              />
              <Setting
                title="Two-Factor Authentication"
                desc="Extra layer of security"
                value={user?.twoFA ? "Enabled" : "Disabled"}
              />
              <Setting
                title="Session Security"
                desc="Automatic logout and session management"
                value={user?.sessionActive ? "Active" : "Inactive"}
              />
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
                onClick={async () => {
                  await supabase.auth.signOut();
                  setLocation("/login");
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

// Helper components
function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <p className={`text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function Setting({
  title,
  desc,
  value,
}: {
  title: string;
  desc: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 border-t first:border-0 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <Badge className="bg-gray-100 text-gray-800">{value}</Badge>
    </div>
  );
}
