interface Transaction {
    id: string;
    amount: number;
    currency: string;
    description: string;
    recipient_name?: string;
    status: string;
    transaction_type?: string;
    created_at: string;
}
interface RecentActivityProps {
    transactions?: Transaction[];
}
export default function RecentActivity({ transactions }: RecentActivityProps): import("react/jsx-runtime").JSX.Element | null;
export {};
