import type { User } from "@packages/shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Shield, Key, Smartphone, AlertTriangle } from "lucide-react";


export default function SecuritySettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toggle state for security preferences
  const [twoFactorSMS, setTwoFactorSMS] = useState(false);
  const [twoFactorAuthenticator, setTwoFactorAuthenticator] = useState(false);
  const [loginAlertsEmail, setLoginAlertsEmail] = useState(true);
  const [loginAlertsSuspicious, setLoginAlertsSuspicious] = useState(true);

  // Security questions state
  const [securityQuestions, setSecurityQuestions] = useState({
    question1: "What was your first pet's name?",
    answer1: '',
    question2: "What city were you born in?",
    answer2: ''
  });

  // Snapshot for cancel/reset
  const [savedPrefs, setSavedPrefs] = useState({
    twoFactorSMS: false,
    twoFactorAuthenticator: false,
    loginAlertsEmail: true,
    loginAlertsSuspicious: true,
  });

  // Load existing preferences on mount
  const { data: prefs } = useQuery<any>({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const res = await authenticatedFetch('/api/user/preferences');
      if (!res.ok) return null;
      return res.json();
    }
  });

  // Initialize toggles from prefs
  useEffect(() => {
    if (prefs) {
      const sec = prefs.securityPreferences || {};
      const notif = prefs.notificationPreferences || {};
      const initial = {
        twoFactorSMS: sec.twoFactorSMS ?? false,
        twoFactorAuthenticator: sec.twoFactorAuthenticator ?? false,
        loginAlertsEmail: notif.loginAlertsEmail ?? true,
        loginAlertsSuspicious: notif.loginAlertsSuspicious ?? true,
      };
      setTwoFactorSMS(initial.twoFactorSMS);
      setTwoFactorAuthenticator(initial.twoFactorAuthenticator);
      setLoginAlertsEmail(initial.loginAlertsEmail);
      setLoginAlertsSuspicious(initial.loginAlertsSuspicious);
      setSavedPrefs(initial);
    }
  }, [prefs]);

  const updatePreference = async (payload: Record<string, any>) => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const res = await authenticatedFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update preferences');
      }
      toast({ title: 'Success', description: 'Preferences updated' });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update preferences', variant: 'destructive' });
    }
  };

  const handleTwoFactorSMS = (value: boolean) => {
    setTwoFactorSMS(value);
    updatePreference({ securityPreferences: { twoFactorSMS: value } });
  };

  const handleTwoFactorAuthenticator = (value: boolean) => {
    setTwoFactorAuthenticator(value);
    updatePreference({ securityPreferences: { twoFactorAuthenticator: value } });
  };

  const handleLoginAlertsEmail = (value: boolean) => {
    setLoginAlertsEmail(value);
    updatePreference({ notificationPreferences: { loginAlertsEmail: value } });
  };

  const handleLoginAlertsSuspicious = (value: boolean) => {
    setLoginAlertsSuspicious(value);
    updatePreference({ notificationPreferences: { loginAlertsSuspicious: value } });
  };

  const handleUpdateSecurityQuestions = async () => {
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const res = await authenticatedFetch('/api/user/security-questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securityQuestions)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update security questions');
      }
      toast({ title: 'Success', description: 'Security questions updated' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update security questions', variant: 'destructive' });
    }
  };

  const handleSaveAll = async () => {
    await updatePreference({
      securityPreferences: { twoFactorSMS, twoFactorAuthenticator },
      notificationPreferences: { loginAlertsEmail, loginAlertsSuspicious }
    });
    setSavedPrefs({ twoFactorSMS, twoFactorAuthenticator, loginAlertsEmail, loginAlertsSuspicious });
  };

  const handleCancel = () => {
    setTwoFactorSMS(savedPrefs.twoFactorSMS);
    setTwoFactorAuthenticator(savedPrefs.twoFactorAuthenticator);
    setLoginAlertsEmail(savedPrefs.loginAlertsEmail);
    setLoginAlertsSuspicious(savedPrefs.loginAlertsSuspicious);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { authenticatedFetch } = await import('@/lib/queryClient');
      const response = await authenticatedFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Password changed successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        toast({ title: 'Error', description: data.error || 'Failed to change password', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    }
    setPasswordLoading(false);
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
                <span>Password</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                  {passwordLoading ? 'Updating...' : 'Update Password'}
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
                <Switch checked={twoFactorSMS} onCheckedChange={handleTwoFactorSMS} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Authenticator App</h3>
                  <p className="text-sm text-gray-600">Use Google Authenticator or similar</p>
                </div>
                <Switch checked={twoFactorAuthenticator} onCheckedChange={handleTwoFactorAuthenticator} />
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
                <Switch checked={loginAlertsEmail} onCheckedChange={handleLoginAlertsEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Suspicious Activity</h3>
                  <p className="text-sm text-gray-600">Alert on unusual account activity</p>
                </div>
                <Switch checked={loginAlertsSuspicious} onCheckedChange={handleLoginAlertsSuspicious} />
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
                <Input id="question1" value={securityQuestions.question1} onChange={(e) => setSecurityQuestions({ ...securityQuestions, question1: e.target.value })} />
                <Input placeholder="Your answer" className="mt-2" value={securityQuestions.answer1} onChange={(e) => setSecurityQuestions({ ...securityQuestions, answer1: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="question2">Security Question 2</Label>
                <Input id="question2" value={securityQuestions.question2} onChange={(e) => setSecurityQuestions({ ...securityQuestions, question2: e.target.value })} />
                <Input placeholder="Your answer" className="mt-2" value={securityQuestions.answer2} onChange={(e) => setSecurityQuestions({ ...securityQuestions, answer2: e.target.value })} />
              </div>
              <Button variant="outline" onClick={handleUpdateSecurityQuestions}>
                Update Security Questions
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveAll}>
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}