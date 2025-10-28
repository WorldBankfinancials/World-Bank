interface BankLogoProps {
  className?: string;
}

export function BankLogo({ className = "w-10 h-10" }: BankLogoProps) {
  return (
    <img 
      src="/apex-banking-logo.jpeg" 
      alt="Apex Banking Corporation Logo" 
      className={`${className} object-contain`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://via.placeholder.com/120x120/3B82F6/FFFFFF?text=APEX";
      }}
    />
  );
}
