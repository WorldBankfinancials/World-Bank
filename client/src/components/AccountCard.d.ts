interface Account {
    id: string;
    account_number: string;
    account_name?: string;
    account_type: string;
    balance: number;
    currency: string;
    is_active: boolean;
}
interface Transaction {
    id: string;
    amount: number;
    description: string;
    created_at: string;
}
interface AccountCardProps {
    account?: Account;
    transactions?: Transaction[];
    showBalance?: boolean;
    onToggleBalance?: () => void;
}
export default function AccountCard({ account, transactions, showBalance, onToggleBalance, }: AccountCardProps): import("react/jsx-runtime").JSX.Element;
export {};
