import {
  X,
  User,
  CreditCard,
  FileText,
  Shield,
  LifeBuoy,
  TrendingUp,
  PiggyBank,
  Phone,
  LogOut,
  Home,
  ArrowUpRight,
  Building2
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from '@/contexts/AuthContext';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  const { userProfile, signOut } = useAuth();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  const menuSections = [
    {
      title: "QUICK LINKS",
      items: [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: ArrowUpRight, label: "Transfer Funds", href: "/transfer-funds" },
        { icon: Building2, label: "Banking Services", href: "/banking-services" }
      ]
    },
    {
      title: "ACCOUNT MANAGEMENT",
      items: [
        { icon: User, label: "Profile Settings", href: "/profile-settings" },
        { icon: Shield, label: "Security Settings", href: "/security-settings" }
      ]
    },
    {
      title: "BANKING SERVICES",
      items: [
        { icon: CreditCard, label: "Credit Cards", href: "/credit-cards" },
        { icon: FileText, label: "Transaction History", href: "/transaction-history" },
        { icon: FileText, label: "Statements & Reports", href: "/statements-reports" }
      ]
    },
    {
      title: "INVESTMENT & WEALTH",
      items: [
        { icon: TrendingUp, label: "Investment Portfolio", href: "/investment-portfolio" },
        { icon: PiggyBank, label: "Wealth Management", href: "/wealth-management" }
      ]
    },
    {
      title: "SUPPORT & HELP",
      items: [
        { icon: LifeBuoy, label: "Support Center", href: "/support-center" },
        { icon: Phone, label: "Customer Support", href: "/customer-support" }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center ring-2 ring-white ring-opacity-30">
                <span className="text-lg font-medium text-white">
                  {userProfile?.fullName
                    ? userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{userProfile?.fullName || 'User'}</p>
                <p className="text-xs text-blue-100">{userProfile?.profession || 'Customer'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Menu sections */}
        <div className="p-4 space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="text-xs font-semibold text-gray-500 mb-3 tracking-wider">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <Link key={itemIndex} href={item.href}>
                    <div
                      onClick={onClose}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <item.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900 text-sm">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
