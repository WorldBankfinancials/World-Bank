interface BankLogoProps {
  className?: string;
}

export function BankLogo({ className = "w-10 h-10" }: BankLogoProps) {
  return (
    <img 
      src="/world-bank-logo.jpeg" 
      alt="World Bank Logo" 
      className={`${className} object-contain`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect fill='%233B82F6' width='120' height='120'/%3E%3Ctext x='60' y='60' font-size='48' font-weight='bold' fill='%23FFFFFF' text-anchor='middle' dominant-baseline='central'%3EWB%3C/text%3E%3C/svg%3E";
      }}
    />
  );
}
