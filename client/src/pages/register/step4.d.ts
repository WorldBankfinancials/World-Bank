import { z } from 'zod';
declare const step4Schema: z.ZodEffects<z.ZodObject<{
    idType: z.ZodString;
    idNumber: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    transferPin: z.ZodString;
    agreeToTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    idType: string;
    idNumber: string;
    transferPin: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}, {
    password: string;
    idType: string;
    idNumber: string;
    transferPin: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}>, {
    password: string;
    idType: string;
    idNumber: string;
    transferPin: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}, {
    password: string;
    idType: string;
    idNumber: string;
    transferPin: string;
    confirmPassword: string;
    agreeToTerms: boolean;
}>;
type Step4Data = z.infer<typeof step4Schema>;
interface Step4Props {
    initialData?: Partial<Step4Data>;
    onSubmit: (data: Step4Data, idCardFile?: File) => void;
    onBack: () => void;
    isLoading?: boolean;
}
export default function RegistrationStep4({ initialData, onSubmit, onBack, isLoading }: Step4Props): import("react/jsx-runtime").JSX.Element;
export {};
