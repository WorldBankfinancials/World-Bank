import React from "react";
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
        target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
      }}
    />
  );
}