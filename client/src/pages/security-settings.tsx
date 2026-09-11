import { useState } from "react";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Smartphone, AlertTriangle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SecuritySettings() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
      return apiRequest('POST', '/api/user/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || "Failed to update password";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({ title: "All fields required", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account security and authentication preferences</p>
        </div>

        <div className="space-y-6">
          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Authentication</h3>
                  <p className="text-sm text-gray-600">Receive codes via SMS</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Authenticator App</h3>
                  <p className="text-sm text-gray-600">Use Google Authenticator or similar</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline">
                Setup Authenticator App
              </Button>
            </CardContent>
          </Card>

          {/* Login Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Login Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Get notified of new logins</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Suspicious Activity</h3>
                  <p className="text-sm text-gray-600">Alert on unusual account activity</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Security Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Questions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question1">Security Question 1</Label>
                <Input id="question1" defaultValue="What was your first pet's name?" disabled />
                <Input placeholder="Your answer" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="question2">Security Question 2</Label>
                <Input id="question2" defaultValue="What city were you born in?" disabled />
                <Input placeholder="Your answer" className="mt-2" />
              </div>
              <Button variant="outline">
                Update Security Questions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
