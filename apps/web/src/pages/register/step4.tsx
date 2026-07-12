import React from "react";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankLogo } from '@/components/BankLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Shield, Upload, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const step4Schema = z.object({
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(5, 'ID number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  transferPin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step4Data = z.infer<typeof step4Schema>;

interface Step4Props {
  initialData?: Partial<Step4Data>;
  onSubmit: (data: Step4Data, idCardFile?: File) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function RegistrationStep4({ initialData = {}, onSubmit, onBack, isLoading = false }: Step4Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // watch - removed unused import
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: initialData
  });

  const handleIdCardUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('File Too Large'),
          description: t('Please select an image under 5MB'),
          variant: 'destructive',
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('Invalid File Type'),
          description: t('Please select an image file'),
          variant: 'destructive',
        });
        return;
      }

      setIdCardFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setIdCardPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (data: Step4Data) => {
    onSubmit(data, idCardFile || undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <BankLogo />
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Security & Verification')}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('Step 4 of 4: Complete Your Registration')}
            </p>
          </div>
          <Progress value={100} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Shield size={20} />
            <span className="font-medium">{t('Security & Identity')}</span>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* ID Verification Section */}
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <FileImage size={18} />
                <span className="font-medium">{t('Identity Verification')}</span>
              </div>
              
              <div>
                <Label htmlFor="idType">{t('ID Document Type')} *</Label>
                <Select onValueChange={(value) => setValue('idType', value)}>
                  <SelectTrigger className={errors.idType ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('Select ID type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">{t('Passport')}</SelectItem>
                    <SelectItem value="national-id">{t('National ID Card')}</SelectItem>
                    <SelectItem value="drivers-license">{t("Driver's License")}</SelectItem>
                    <SelectItem value="state-id">{t('State ID Card')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.idType && (
                  <p className="text-red-500 text-sm mt-1">{errors.idType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="idNumber">{t('ID Number')} *</Label>
                <Input
                  id="idNumber"
                  {...register('idNumber')}
                  placeholder="Enter your ID number"
                  className={errors.idNumber ? 'border-red-500' : ''}
                />
                {errors.idNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.idNumber.message}</p>
                )}
              </div>

              {/* ID Card Upload */}
              <div>
                <Label>{t('Upload ID Card Photo')} ({t('Optional')})</Label>
                <div className="mt-2">
                  <input
                    id="idCardUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleIdCardUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="idCardUpload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    {idCardPreview ? (
                      <img
                        src={idCardPreview}
                        alt="ID Card Preview"
                        className="h-full w-auto object-contain rounded"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {t('Click to upload ID card photo')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {t('Max 5MB, JPG/PNG only')}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {idCardFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ {idCardFile.name} ({Math.round(idCardFile.size / 1024)}KB)
                  </p>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">{t('Password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Create a secure password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('Confirm Password')} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="transferPin">{t('4-Digit Transfer PIN')} *</Label>
                <Input
                  id="transferPin"
                  type="password"
                  {...register('transferPin')}
                  placeholder="0000"
                  maxLength={4}
                  className={errors.transferPin ? 'border-red-500' : ''}
                />
                {errors.transferPin && (
                  <p className="text-red-500 text-sm mt-1">{errors.transferPin.message}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('This PIN will be required for all transfers')}
                </p>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agreeToTerms"
                {...register('agreeToTerms')}
                className="mt-1"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-600 dark:text-gray-300">
                {t('I agree to the')}{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  {t('Terms and Conditions')}
                </a>{' '}
                {t('and')}{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  {t('Privacy Policy')}
                </a>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-sm">{errors.agreeToTerms.message}</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Back')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? t('Creating Account...') : t('Complete Registration')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
