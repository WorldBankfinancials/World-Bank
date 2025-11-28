import { z } from 'zod';
declare const step3Schema: z.ZodObject<{
    profession: z.ZodString;
    employer: z.ZodString;
    annualIncome: z.ZodString;
    sourceOfFunds: z.ZodString;
    purposeOfAccount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    profession: string;
    annualIncome: string;
    employer: string;
    sourceOfFunds: string;
    purposeOfAccount: string;
}, {
    profession: string;
    annualIncome: string;
    employer: string;
    sourceOfFunds: string;
    purposeOfAccount: string;
}>;
type Step3Data = z.infer<typeof step3Schema>;
interface Step3Props {
    initialData?: Partial<Step3Data>;
    onNext: (data: Step3Data) => void;
    onBack: () => void;
}
export default function RegistrationStep3({ initialData, onNext, onBack }: Step3Props): import("react/jsx-runtime").JSX.Element;
export {};
