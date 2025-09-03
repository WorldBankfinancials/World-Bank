import { useState } from 'react';
import { useLocation } from 'wouter';
import RegistrationStep1 from './register/step1';
import RegistrationStep2 from './register/step2';
import RegistrationStep3 from './register/step3';
import RegistrationStep4 from './register/step4';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type RegistrationData = {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  // Step 2
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  nationality: string;
  // Step 3
  profession: string;
  employer: string;
  annualIncome: string;
  sourceOfFunds: string;
  purposeOfAccount: string;
  // Step 4
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
      console.log('Registration data:', completeData);
      
      // Upload ID card first if provided
      let idCardUrl = null;
      if (idCardFile) {
        try {
          // Get upload URL from server
          const uploadResponse = await fetch('/api/objects/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (uploadResponse.ok) {
            const { uploadURL } = await uploadResponse.json();
            
            // Upload file to object storage
            const uploadFileResponse = await fetch(uploadURL, {
              method: 'PUT',
              body: idCardFile,
              headers: {
                'Content-Type': idCardFile.type
              }
            });
            
            if (uploadFileResponse.ok) {
              idCardUrl = uploadURL.split('?')[0]; // Remove query params to get file URL
              console.log('ID card uploaded successfully:', idCardUrl);
            }
          }
        } catch (error) {
          console.error('Failed to upload ID card:', error);
          toast({
            title: 'Upload Warning',
            description: 'ID card upload failed, but registration will continue',
            variant: 'destructive',
          });
        }
      }

      // Create Supabase account
      const { error } = await signUp(completeData.email, completeData.password, {
        full_name: `${completeData.firstName} ${completeData.lastName}`,
        phone: completeData.phone,
        date_of_birth: completeData.dateOfBirth,
        address: completeData.address,
        city: completeData.city,
        state: completeData.state,
        country: completeData.country,
        postal_code: completeData.postalCode,
        nationality: completeData.nationality,
        profession: completeData.profession,
        employer: completeData.employer,
        annual_income: completeData.annualIncome,
        source_of_funds: completeData.sourceOfFunds,
        purpose_of_account: completeData.purposeOfAccount,
        id_type: completeData.idType,
        id_number: completeData.idNumber,
        transfer_pin: completeData.transferPin,
        id_card_url: idCardUrl
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. Please check your email to verify your account.',
      });

      // Redirect to login or dashboard
      setLocation('/login');

    } catch (error) {
      console.error('Registration error:', error);
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
        return null;
    }
  };

  return (
    <div className="registration-container">
      {renderCurrentStep()}
    </div>
  );
}