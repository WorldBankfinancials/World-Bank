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

export default function PinSettings() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { t } = useLanguage();
  const { user } = useAuth();
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
    if (pin.length !== 4) {
      return t('pin_must_be_4_digits');
    }
    if (!/^\d+$/.test(pin)) {
      return t('pin_must_be_numeric');
    }
    if (/^(\d)\1{3}$/.test(pin)) {
      return t('pin_cannot_be_repeated');
    }
    if (['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(pin)) {
      return t('pin_too_simple');
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPin || !newPin || !confirmPin) {
      setError(t('all_fields_required'));
      return;
    }

    const pinError = validatePin(newPin);
    if (pinError) {
      setError(pinError);
      return;
    }

    if (newPin !== confirmPin) {
      setError(t('pins_do_not_match'));
      return;
    }

    if (currentPin === newPin) {
      setError(t('new_pin_must_be_different'));
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmPinChange = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch('/api/user/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t('pin_changed_successfully'));
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          navigate('/profile-settings');
        }, 2000);
      } else {
        setError(data.message || t('pin_change_failed'));
      }
    } catch (error) {
      // console.error('PIN change error:', error);
      setError(t('network_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getPinStrength = (pin: string) => {
    if (pin.length < 4) return { level: 0, text: t('pin_too_short') };
    
    const hasRepeated = /^(\d)\1{3}$/.test(pin);
    const isSequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'].includes(pin);
    const isCommon = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'].includes(pin);
    
    if (hasRepeated || isCommon) {
      return { level: 1, text: t('pin_weak'), color: 'text-red-500' };
    }
    if (isSequential) {
      return { level: 2, text: t('pin_fair'), color: 'text-yellow-500' };
    }
    
    return { level: 3, text: t('pin_strong'), color: 'text-green-500' };
  };

  const pinStrength = getPinStrength(newPin);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/profile-settings')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('change_transfer_pin')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              {t('security_settings')}
            </CardTitle>
            <CardDescription>
              {t('pin_security_description')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPin">{t('current_pin')}</Label>
                <div className="relative">
                  <Input
                    id="currentPin"
                    type={showCurrentPin ? "text" : "password"}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={t('enter_current_pin')}
                    maxLength={4}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPin">{t('new_pin')}</Label>
                <div className="relative">
                  <Input
                    id="newPin"
                    type={showNewPin ? "text" : "password"}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={t('enter_new_pin')}
                    maxLength={4}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPin(!showNewPin)}
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {newPin && (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-8 rounded ${
                            level <= pinStrength.level
                              ? pinStrength.level === 1
                                ? 'bg-red-500'
                                : pinStrength.level === 2
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm ${pinStrength.color}`}>
                      {pinStrength.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin">{t('confirm_new_pin')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? "text" : "password"}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder={t('confirm_new_pin')}
                    maxLength={4}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {confirmPin && newPin && confirmPin !== newPin && (
                  <p className="text-sm text-red-500">{t('pins_do_not_match')}</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">{t('pin_security_tips')}</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {t('pin_tip_1')}</li>
                  <li>• {t('pin_tip_2')}</li>
                  <li>• {t('pin_tip_3')}</li>
                  <li>• {t('pin_tip_4')}</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/profile-settings')}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !currentPin || !newPin || !confirmPin || newPin !== confirmPin}
                >
                  {isLoading ? t('changing_pin') : t('change_pin')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              {t('confirm_pin_change')}
            </DialogTitle>
            <DialogDescription>
              {t('pin_change_confirmation_message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={confirmPinChange}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? t('changing_pin') : t('confirm_change')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
