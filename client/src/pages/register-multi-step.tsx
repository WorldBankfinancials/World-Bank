import { useState } from 'react';
import { useLocation } from 'wouter';
import RegistrationStep1 from '@/pages/register/step1';
import RegistrationStep2 from '@/pages/register/step2';
import RegistrationStep3 from '@/pages/register/step3';
import RegistrationStep4 from '@/pages/register/step4';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { publicPost } from '@/lib/queryClient';

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  nationality: string;
  profession: string;
  employer: string;
  annualIncome: string;
  sourceOfFunds: string;
  purposeOfAccount: string;
  idType: string;
  idNumber: string;
  password: string;
  confirmPassword: string;
  transferPin: string;
  agreeToTerms: boolean;
};

export default function MultiStepRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleStep1Next = (data: any) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: any) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Next = (data: any) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleStep4Submit = async (data: any, idCardFile?: File) => {
    setIsSubmitting(true);
    try {
      const completeData = { ...registrationData, ...data };
      let idCardUrl = null;
      if (idCardFile) {
        try {
          const uploadResponse = await publicPost('/api/objects/upload', {});
          if (uploadResponse.ok) {
            const { uploadURL } = await uploadResponse.json();
            const uploadFileResponse = await fetch(uploadURL, {
              method: 'PUT',
              body: idCardFile,
              headers: { 'Content-Type': idCardFile.type },
            });
            if (uploadFileResponse.ok) {
              idCardUrl = uploadURL.split('?')[0];
            }
          }
        } catch (error) {
          toast({
            title: 'Upload Warning',
            description: 'ID card upload failed, but registration will continue',
            variant: 'destructive',
          });
        }
      }

      const response = await publicPost('/api/auth/register-complete', {
          email: completeData.email,
          password: completeData.password,
          firstName: completeData.firstName,
          lastName: completeData.lastName,
          phone: completeData.phone,
          dateOfBirth: completeData.dateOfBirth,
          address: completeData.address,
          city: completeData.city,
          state: completeData.state,
          country: completeData.country,
          postalCode: completeData.postalCode,
          nationality: completeData.nationality,
          profession: completeData.profession,
          employer: completeData.employer,
          annualIncome: completeData.annualIncome,
          sourceOfFunds: completeData.sourceOfFunds,
          purposeOfAccount: completeData.purposeOfAccount,
          idType: completeData.idType,
          idNumber: completeData.idNumber,
          transferPin: completeData.transferPin,
          idCardUrl: idCardUrl,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Registration failed');
      }

      toast({
        title: 'Registration Submitted Successfully!',
        description: 'Your application is being reviewed by our customer support team. You will be able to login once approved.',
        duration: 5000,
      });

      setLocation('/login?status=pending');

    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RegistrationStep1
            initialData={{
              firstName: registrationData.firstName,
              lastName: registrationData.lastName,
              email: registrationData.email,
              phone: registrationData.phone,
              dateOfBirth: registrationData.dateOfBirth,
            }}
            onNext={handleStep1Next}
          />
        );
      case 2:
        return (
          <RegistrationStep2
            initialData={{
              address: registrationData.address,
              city: registrationData.city,
              state: registrationData.state,
              country: registrationData.country,
              postalCode: registrationData.postalCode,
              nationality: registrationData.nationality,
            }}
            onNext={handleStep2Next}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <RegistrationStep3
            initialData={{
              profession: registrationData.profession,
              employer: registrationData.employer,
              annualIncome: registrationData.annualIncome,
              sourceOfFunds: registrationData.sourceOfFunds,
              purposeOfAccount: registrationData.purposeOfAccount,
            }}
            onNext={handleStep3Next}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <RegistrationStep4
            initialData={{
              idType: registrationData.idType,
              idNumber: registrationData.idNumber,
              password: registrationData.password,
              confirmPassword: registrationData.confirmPassword,
              transferPin: registrationData.transferPin,
              agreeToTerms: registrationData.agreeToTerms,
            }}
            onSubmit={handleStep4Submit}
            onBack={handleBack}
            isLoading={isSubmitting}
          />
        );
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-4">Invalid registration step. Please refresh the page.</p>
              <button onClick={() => setCurrentStep(1)} className="px-4 py-2 bg-blue-600 text-white rounded">
                Start Over
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="registration-container">
      {renderCurrentStep()}
    </div>
  );
}
