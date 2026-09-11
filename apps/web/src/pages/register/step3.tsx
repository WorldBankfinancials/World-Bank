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
import { ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';

const step3Schema = z.object({
  profession: z.string().min(2, 'Profession is required'),
  employer: z.string().min(2, 'Employer name is required'),
  annualIncome: z.string().min(1, 'Annual income is required'),
  sourceOfFunds: z.string().min(1, 'Source of funds is required'),
  purposeOfAccount: z.string().min(1, 'Purpose of account is required'),
});

type Step3Data = z.infer<typeof step3Schema>;

interface Step3Props {
  initialData?: Partial<Step3Data>;
  onNext: (data: Step3Data) => void;
  onBack: () => void;
}

export default function RegistrationStep3({ initialData = {}, onNext, onBack }: Step3Props) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // watch - removed unused import
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: initialData
  });

  const onSubmit = async (data: Step3Data) => {
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
              {t('Professional Information')}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {t('Step 3 of 4: Employment & Financial Details')}
            </p>
          </div>
          <Progress value={75} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Briefcase size={20} />
            <span className="font-medium">{t('Professional Details')}</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="profession">{t('Profession/Occupation')} *</Label>
              <Input
                id="profession"
                {...register('profession')}
                placeholder="Software Engineer"
                className={errors.profession ? 'border-red-500' : ''}
              />
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employer">{t('Employer/Company')} *</Label>
              <Input
                id="employer"
                {...register('employer')}
                placeholder="Tech Corp Inc."
                className={errors.employer ? 'border-red-500' : ''}
              />
              {errors.employer && (
                <p className="text-red-500 text-sm mt-1">{errors.employer.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="annualIncome">{t('Annual Income')} *</Label>
              <Select onValueChange={(value) => setValue('annualIncome', value)}>
                <SelectTrigger className={errors.annualIncome ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('Select income range')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-25000">{t('Under $25,000')}</SelectItem>
                  <SelectItem value="25000-50000">{t('$25,000 - $50,000')}</SelectItem>
                  <SelectItem value="50000-100000">{t('$50,000 - $100,000')}</SelectItem>
                  <SelectItem value="100000-250000">{t('$100,000 - $250,000')}</SelectItem>
                  <SelectItem value="250000-500000">{t('$250,000 - $500,000')}</SelectItem>
                  <SelectItem value="500000-plus">{t('$500,000+')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.annualIncome && (
                <p className="text-red-500 text-sm mt-1">{errors.annualIncome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sourceOfFunds">{t('Primary Source of Funds')} *</Label>
              <Select onValueChange={(value) => setValue('sourceOfFunds', value)}>
                <SelectTrigger className={errors.sourceOfFunds ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('Select source of funds')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment">{t('Employment Income')}</SelectItem>
                  <SelectItem value="business">{t('Business Income')}</SelectItem>
                  <SelectItem value="investments">{t('Investment Returns')}</SelectItem>
                  <SelectItem value="inheritance">{t('Inheritance')}</SelectItem>
                  <SelectItem value="savings">{t('Personal Savings')}</SelectItem>
                  <SelectItem value="other">{t('Other')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.sourceOfFunds && (
                <p className="text-red-500 text-sm mt-1">{errors.sourceOfFunds.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="purposeOfAccount">{t('Purpose of Account')} *</Label>
              <Select onValueChange={(value) => setValue('purposeOfAccount', value)}>
                <SelectTrigger className={errors.purposeOfAccount ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('Select account purpose')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">{t('Personal Banking')}</SelectItem>
                  <SelectItem value="business">{t('Business Banking')}</SelectItem>
                  <SelectItem value="investment">{t('Investment Activities')}</SelectItem>
                  <SelectItem value="savings">{t('Savings & Deposits')}</SelectItem>
                  <SelectItem value="international">{t('International Transfers')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.purposeOfAccount && (
                <p className="text-red-500 text-sm mt-1">{errors.purposeOfAccount.message}</p>
              )}
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
