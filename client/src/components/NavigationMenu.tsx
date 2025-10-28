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
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from '@/contexts/AuthContext';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
  if (!isOpen) return null;
  
  const { userProfile } = useAuth();

  const menuSections = [
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
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg overflow-y-auto transform transition-transform duration-300 ease-in-out" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col items-center">
              <img 
                src="/world-bank-logo.jpeg" 
                alt="Apex Banking Corporation Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                }}
              />
              <span className="font-bold text-gray-900 text-sm mt-1">APEX BANKING CORPORATION</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* User Info Section */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center ring-2 ring-white ring-opacity-30 relative">
                  <span className="text-lg font-medium text-white">
                    {userProfile?.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{userProfile?.fullName || 'User'}</h3>
                  <p className="text-sm text-blue-100">{userProfile?.profession || 'Customer'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-blue-100">Verified Account</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {menuSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <div className="text-xs font-semibold text-gray-500 mb-3 tracking-wider">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <Link key={itemIndex} href={item.href}>
                        <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                          <item.icon className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-900">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex items-center space-x-3 p-3 hover:bg-red-50 rounded-lg cursor-pointer text-red-600">
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
