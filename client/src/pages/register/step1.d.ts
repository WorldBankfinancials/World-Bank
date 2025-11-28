import { z } from 'zod';
declare const step1Schema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    dateOfBirth: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone: string;
    dateOfBirth: string;
    firstName: string;
    lastName: string;
}, {
    email: string;
    phone: string;
    dateOfBirth: string;
    firstName: string;
    lastName: string;
}>;
type Step1Data = z.infer<typeof step1Schema>;
interface Step1Props {
    initialData?: Partial<Step1Data>;
    onNext: (data: Step1Data) => void;
}
export default function RegistrationStep1({ initialData, onNext }: Step1Props): import("react/jsx-runtime").JSX.Element;
export {};
