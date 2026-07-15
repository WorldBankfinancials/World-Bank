import { Settings, User, LogOut, Shield, Check, Download, Building2, RotateCcw, TrendingUp, HelpCircle, CreditCard, ArrowUpRight, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from "wouter";
import type { User as UserType } from "@packages/shared/schema";
import NavigationMenu from "./NavigationMenu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar } from './Avatar';

interface HeaderProps {
  user?: UserType;
}

export default function Header({}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { userProfile, signOut } = useAuth();
  const { t } = useLanguage();
  const [displayBalance, setDisplayBalance] = useState<string | number>(userProfile?.balance || '0');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkBalance = () => {
      try {
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          if (profile.balance !== undefined) {
            setDisplayBalance(profile.balance);
          }
        }
      } catch (e) {}
    };

    checkBalance();
    return () => {};
  }, []);

  useEffect(() => {
    if (userProfile?.balance !== undefined) {
      setDisplayBalance(userProfile.balance);
    }
  }, [userProfile?.balance]);

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOut();
  };

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
        { icon: Building2, label: "Loans", href: "/loans" },
        { icon: TrendingUp, label: "Investment Trading", href: "/investment-trading" },
        { icon: Building2, label: "Business Banking", href: "/business-banking" }
      ]
    },
    {
      category: "DIGITAL SERVICES",
      items: [
        { icon: CreditCard, label: t('digital_wallet'), href: "/digital-wallet" },
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
        { icon: Building2, label: "Find Branches", href: "/find-branches" }
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

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {displayBalance !== null && displayBalance !== undefined && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">Balance</span>
                <span className="text-sm font-bold text-blue-900">${(() => { const balanceNum = parseFloat(String(displayBalance)); return isNaN(balanceNum) ? '0.00' : balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2 }); })()}</span>
              </div>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
                aria-controls="profile-dropdown"
                aria-label="Toggle profile menu"
              >
                <Avatar size={40} />
              </button>

              {showProfileMenu && (
                <div id="profile-dropdown" className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar size={64} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{userProfile?.fullName || 'Banking Customer'}</div>
                        <div className="text-sm text-gray-600">{userProfile?.profession || 'Account Holder'}</div>
                        <div className="text-sm text-gray-600">{userProfile?.email || ''}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Verified Account</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

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

                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">
                        Account ID: {userProfile?.accountId || 'Loading...'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: Active
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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