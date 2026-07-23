import React from "react";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Shield, Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import type { User } from '@packages/shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/queryClient';

export default function PinSettings() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const validatePin = (pin: string) => {
    if (!/^\d{4,6}$/.test(pin)) {
      return 'PIN must be 4-6 digits';
    }
    if (/^(\d)\1+$/.test(pin)) {
      return 'PIN cannot be all the same digit';
    }
    const sequential = '0123456789';
    const reversed = '9876543210';
    if (sequential.includes(pin) || reversed.includes(pin)) {
      return 'PIN cannot be sequential digits';
    }
    return '';
  };

  const handleChangePin = async () => {
    const pinError = validatePin(newPin);
    if (pinError) {
      setError(pinError);
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (newPin === currentPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/user/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to change PIN');
      }
      setSuccess('PIN changed successfully');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ title: 'PIN Changed', description: 'Your transfer PIN has been updated.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user as any} />
      <div className="container mx-auto px-4 py-6 max-w-md pb-20">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Transfer PIN
            </CardTitle>
            <CardDescription>Update your 4-6 digit transfer PIN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="currentPin">Current PIN</Label>
              <div className="relative">
                <Input
                  id="currentPin"
                  type={showCurrentPin ? "text" : "password"}
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  className="pr-10"
                  placeholder="Enter current PIN"
                />
                <button type="button" onClick={() => setShowCurrentPin(!showCurrentPin)} className="absolute right-3 top-3 text-gray-400">
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPin">New PIN</Label>
              <div className="relative">
                <Input
                  id="newPin"
                  type={showNewPin ? "text" : "password"}
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="pr-10"
                  placeholder="4-6 digits"
                />
                <button type="button" onClick={() => setShowNewPin(!showNewPin)} className="absolute right-3 top-3 text-gray-400">
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm New PIN</Label>
              <div className="relative">
                <Input
                  id="confirmPin"
                  type={showConfirmPin ? "text" : "password"}
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="pr-10"
                  placeholder="Re-enter new PIN"
                />
                <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-3 top-3 text-gray-400">
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!currentPin || !newPin || !confirmPin || isLoading}
              className="w-full bg-blue-600 text-white"
            >
              {isLoading ? "Changing..." : "Change PIN"}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm PIN Change</DialogTitle>
              <DialogDescription>Are you sure you want to change your transfer PIN?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
              <Button onClick={() => { setShowConfirmDialog(false); handleChangePin(); }} className="bg-blue-600 text-white">Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
