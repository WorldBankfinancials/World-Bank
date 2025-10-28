import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankLogo } from '@/components/BankLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const getSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables not configured');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  profession: z.string().min(2, 'Profession is required'),
  annualIncome: z.string().min(1, 'Annual income is required'),
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(5, 'ID number is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'pending' | 'success'>('form');
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      profession: '',
      annualIncome: '',
      idType: '',
      idNumber: '',
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      let supabaseUserId = null;

      // CRITICAL: Create user in Supabase Auth FIRST
      if (!supabase) {
        throw new Error('Authentication service unavailable. Please try again later.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
          }
        }
      });

      // SECURITY: Fail immediately if Supabase auth fails
      if (authError) {
        console.error('Supabase authentication failed:', authError.message);
        throw new Error(authError.message || 'Failed to create authentication account. User may already exist.');
      }

      if (!authData.user) {
        throw new Error('Authentication account creation failed. Please try again.');
      }

      supabaseUserId = authData.user.id;

      // SECURITY: NEVER send password to backend - Supabase handles it
      const userProfile = {
        username: data.email.split('@')[0],
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        profession: data.profession,
        annualIncome: data.annualIncome,
        idType: data.idType,
        idNumber: data.idNumber,
        supabaseUserId: supabaseUserId,
        role: 'customer',
        isVerified: false,
        isActive: false,
        balance: 0,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to create user profile');
      }

      setRegistrationStep('pending');

      toast({
        title: t('registration_submitted'),
        description: t('admin_review_pending'),
      });

    } catch (error: any) {
      // console.error('Registration error:', error);
      toast({
        title: t('registration_failed'),
        description: error.message || t('try_again_later'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationStep === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BankLogo className="w-16 h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">{t('registration_submitted')}</CardTitle>
            <CardDescription>{t('admin_review_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">{t('next_steps')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('admin_review_process')}</li>
                <li>• {t('email_notification_sent')}</li>
                <li>• {t('account_activation_follows')}</li>
              </ul>
            </div>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full"
            >
              {t('return_to_login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="wb-login-card w-full max-w-2xl wb-fade-in">
        <CardHeader className="text-center">
          <BankLogo className="w-16 h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl">{t('create_account')}</CardTitle>
          <CardDescription>{t('join_world_bank_today')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('personal_information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('first_name')}</Label>
                  <Input
                    id="firstName"
                    {...form.register('firstName')}
                    placeholder={t('enter_first_name')}
                    className="wb-input"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">{t('last_name')}</Label>
                  <Input
                    id="lastName"
                    {...form.register('lastName')}
                    placeholder={t('enter_last_name')}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">{t('date_of_birth')}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...form.register('dateOfBirth')}
                />
                {form.formState.errors.dateOfBirth && (
                  <p className="text-sm text-red-600">{form.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('contact_information')}</h3>
              <div>
                <Label htmlFor="email">{t('email_address')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder={t('enter_email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">{t('phone_number')}</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder={t('enter_phone')}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('address_information')}</h3>
              <div>
                <Label htmlFor="address">{t('street_address')}</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder={t('enter_address')}
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder={t('enter_city')}
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="state">{t('state_province')}</Label>
                  <Input
                    id="state"
                    {...form.register('state')}
                    placeholder={t('enter_state')}
                  />
                  {form.formState.errors.state && (
                    <p className="text-sm text-red-600">{form.formState.errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="postalCode">{t('postal_code')}</Label>
                  <Input
                    id="postalCode"
                    {...form.register('postalCode')}
                    placeholder={t('enter_postal_code')}
                  />
                  {form.formState.errors.postalCode && (
                    <p className="text-sm text-red-600">{form.formState.errors.postalCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="country">{t('country')}</Label>
                <Select onValueChange={(value) => form.setValue('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_country')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="China">{t('china')}</SelectItem>
                    <SelectItem value="United States">{t('united_states')}</SelectItem>
                    <SelectItem value="United Kingdom">{t('united_kingdom')}</SelectItem>
                    <SelectItem value="Canada">{t('canada')}</SelectItem>
                    <SelectItem value="Australia">{t('australia')}</SelectItem>
                    <SelectItem value="Germany">{t('germany')}</SelectItem>
                    <SelectItem value="France">{t('france')}</SelectItem>
                    <SelectItem value="Japan">{t('japan')}</SelectItem>
                    <SelectItem value="Other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('professional_information')}</h3>
              <div>
                <Label htmlFor="profession">{t('profession')}</Label>
                <Input
                  id="profession"
                  {...form.register('profession')}
                  placeholder={t('enter_profession')}
                />
                {form.formState.errors.profession && (
                  <p className="text-sm text-red-600">{form.formState.errors.profession.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="annualIncome">{t('annual_income')}</Label>
                <Select onValueChange={(value) => form.setValue('annualIncome', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_income_range')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $25,000">{t('under_25k')}</SelectItem>
                    <SelectItem value="$25,000 - $50,000">{t('25k_50k')}</SelectItem>
                    <SelectItem value="$50,000 - $75,000">{t('50k_75k')}</SelectItem>
                    <SelectItem value="$75,000 - $100,000">{t('75k_100k')}</SelectItem>
                    <SelectItem value="$100,000 - $150,000">{t('100k_150k')}</SelectItem>
                    <SelectItem value="Over $150,000">{t('over_150k')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.annualIncome && (
                  <p className="text-sm text-red-600">{form.formState.errors.annualIncome.message}</p>
                )}
              </div>
            </div>

            {/* Identification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('identification')}</h3>
              <div>
                <Label htmlFor="idType">{t('id_type')}</Label>
                <Select onValueChange={(value) => form.setValue('idType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_id_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National ID">{t('national_id')}</SelectItem>
                    <SelectItem value="Passport">{t('passport')}</SelectItem>
                    <SelectItem value="Driver's License">{t('drivers_license')}</SelectItem>
                    <SelectItem value="Other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.idType && (
                  <p className="text-sm text-red-600">{form.formState.errors.idType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="idNumber">{t('id_number')}</Label>
                <Input
                  id="idNumber"
                  {...form.register('idNumber')}
                  placeholder={t('enter_id_number')}
                />
                {form.formState.errors.idNumber && (
                  <p className="text-sm text-red-600">{form.formState.errors.idNumber.message}</p>
                )}
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('account_security')}</h3>
              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder={t('enter_password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register('confirmPassword')}
                  placeholder={t('confirm_your_password')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? t('creating_account') : t('create_account')}
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {t('already_have_account')} 
                  <Link href="/login" className="text-blue-600 hover:underline ml-1">
                    {t('sign_in_here')}
                  </Link>
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
