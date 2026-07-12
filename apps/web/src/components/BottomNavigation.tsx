import { Home, CreditCard, ArrowLeftRight, FileText, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navigationItems = [
    { icon: Home, label: t('home') || 'Home', href: "/dashboard" },
    { icon: CreditCard, label: t('cards') || 'Cards', href: "/credit-cards" },
    { icon: ArrowLeftRight, label: t('transfer') || 'Transfer', href: "/transfer-funds" },
    { icon: FileText, label: t('history') || 'History', href: "/transaction-history" },
    { icon: User, label: t('profile') || 'Profile', href: "/profile-settings" }
  ];

  return (
    <div className="wb-nav fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`wb-nav-item flex flex-col items-center ${isActive ? 'active' : 'text-gray-500'}`}>
                <item.icon className="w-6 h-6 mb-1 icon" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
