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
import { COUNTRIES } from '@/data/countries';
import { ArrowRight, ArrowLeft, MapPin } from 'lucide-react';

const step2Schema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  nationality: z.string().min(2, 'Nationality is required'),
});

type Step2Data = z.infer<typeof step2Schema>;

interface Step2Props {
  initialData?: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

export default function RegistrationStep2({ initialData = {}, onNext, onBack }: Step2Props) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: initialData
  });

  // Remove unused variable
  // const country = watch('country');

  const onSubmit = async (data: Step2Data) => {
    setIsLoading(true);
    try {
      onNext(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <BankLogo />
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Address Information')}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('Step 2 of 4: Location Details')}
            </p>
          </div>
          <Progress value={50} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <MapPin size={20} />
            <span className="font-medium">{t('Address Details')}</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="address">{t('Street Address')} *</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="123 Main Street, Apt 4B"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">{t('City')} *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="New York"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state">{t('State/Province')} *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="NY"
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="country">{t('Country')} *</Label>
              <Select onValueChange={(value) => setValue('country', value)}>
                <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('Select your country')} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">{t('Postal Code')} *</Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="10001"
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="nationality">{t('Nationality')} *</Label>
                <Input
                  id="nationality"
                  {...register('nationality')}
                  placeholder="American"
                  className={errors.nationality ? 'border-red-500' : ''}
                />
                {errors.nationality && (
                  <p className="text-red-500 text-sm mt-1">{errors.nationality.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('Back')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? t('Processing...') : (
                  <>
                    {t('Continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
