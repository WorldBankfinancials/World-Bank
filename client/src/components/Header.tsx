import { Settings, User, LogOut, Search, ChevronDown, Menu, X, Globe, Home, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Shield, Check, Download, Building2, RotateCcw, TrendingUp, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from "wouter";
import type { User as UserType } from "../../../shared/schema";
import NavigationMenu from "./NavigationMenu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from './Avatar';

interface HeaderProps {
  user?: UserType | any;
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { userProfile } = useAuth();
  const [freshUserData, setFreshUserData] = useState<any>(null);

  // Fetch fresh user data once only
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setFreshUserData(userData);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    fetchFreshUserData();
  }, []);

  const profileMenuItems = [
    { 
      category: "ACCOUNT MANAGEMENT",
      items: [
        { icon: User, label: "Profile Settings", href: "/profile-settings" },
        { icon: Shield, label: "Security Settings", href: "/security-settings" },
        { icon: Settings, label: "Account Preferences", href: "/account-preferences" },
        { icon: Check, label: "Verification Center", href: "/verification" }
      ]
    },
    {
      category: "BANKING SERVICES", 
      items: [
        { icon: CreditCard, label: "Credit Cards", href: "/credit-cards" },
        { icon: ArrowUpRight, label: "Transaction History", href: "/transaction-history" },
        { icon: Download, label: "Statements & Reports", href: "/statements-reports" },
        { icon: Building2, label: "Banking Services", href: "/banking-services" },
        { icon: RotateCcw, label: "Transfer Funds", href: "/transfer-funds" }
      ]
    },
    {
      category: "INVESTMENT & WEALTH",
      items: [
        { icon: TrendingUp, label: "Investment Portfolio", href: "/investment-portfolio" },
        { icon: Building2, label: "Wealth Management", href: "/wealth-management" },
        { icon: TrendingUp, label: "Investment Trading", href: "/investment-trading" },
        { icon: Building2, label: "Business Banking", href: "/business-banking" }
      ]
    },
    {
      category: "DIGITAL SERVICES",
      items: [
        { icon: CreditCard, label: "Digital Wallet", href: "/digital-wallet" },
        { icon: User, label: "Mobile Pay", href: "/mobile-pay" },
        { icon: ArrowUpRight, label: "International Transfer", href: "/international-transfer" }
      ]
    },
    {
      category: "SUPPORT & HELP",
      items: [
        { icon: HelpCircle, label: "Support Center", href: "/support-center" },        
        { icon: User, label: "Customer Support", href: "/customer-support" },
        { icon: Shield, label: "Security Center", href: "/security-center" },
        { icon: Building2, label: "Find Branches", href: "/find-branches" },
        { icon: LogOut, label: "Sign Out", href: "/login" }
      ]
    }
  ];

  return (
    <div className="relative">
      <header className="bg-white px-4 py-4 relative z-40">
        <div className="flex items-center justify-between mb-0">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <img 
                src="/world-bank-logo.jpeg" 
                alt="World Bank Logo" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/World_Bank_Group_logo.svg/1200px-World_Bank_Group_logo.svg.png";
                }}
              />
              <div className="text-gray-900 font-bold text-sm tracking-wide">WORLD BANK</div>
            </div>
          </Link>

          {/* Profile Icon with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Avatar size={40} />
            </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {/* Profile Header in Dropdown */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar size={64} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{freshUserData?.fullName || userProfile?.fullName || 'Liu Wei'}</div>
                        <div className="text-sm text-gray-600">{freshUserData?.profession || userProfile?.profession || 'Marine Engineer'}</div>
                        <div className="text-sm text-gray-600">{freshUserData?.email || userProfile?.email || 'bankmanagerworld5@gmail.com'}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Verified Account</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Menu Items */}
                  <div className="max-h-64 overflow-y-auto">
                    {profileMenuItems.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-4">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {section.category}
                        </div>
                        {section.items.map((item, itemIndex) => (
                          <Link key={itemIndex} href={item.href}>
                            <div 
                              onClick={() => setShowProfileMenu(false)}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <item.icon className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-700">{item.label}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Account Info Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Account ID: WB-2024-7829
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Login: Dec 15, 2024
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </header>

      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </div>
  );
}