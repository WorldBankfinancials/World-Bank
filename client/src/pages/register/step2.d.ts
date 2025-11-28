import { z } from 'zod';
declare const step2Schema: z.ZodObject<{
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodString;
    postalCode: z.ZodString;
    nationality: z.ZodString;
}, "strip", z.ZodTypeAny, {
    address: string;
    state: string;
    country: string;
    city: string;
    postalCode: string;
    nationality: string;
}, {
    address: string;
    state: string;
    country: string;
    city: string;
    postalCode: string;
    nationality: string;
}>;
type Step2Data = z.infer<typeof step2Schema>;
interface Step2Props {
    initialData?: Partial<Step2Data>;
    onNext: (data: Step2Data) => void;
    onBack: () => void;
}
export default function RegistrationStep2({ initialData, onNext, onBack }: Step2Props): import("react/jsx-runtime").JSX.Element;
export {};
