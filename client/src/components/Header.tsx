
import { Settings, User, LogOut, Shield, Check, Download, Building2, RotateCcw, TrendingUp, HelpCircle, CreditCard, ArrowUpRight, Bell, MessageSquare, FileText, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import type { User as UserType } from "../../../shared/schema";
import NavigationMenu from "./NavigationMenu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from './Avatar';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
import RealtimeAlerts from "./RealtimeAlerts";
import LiveChat from "./LiveChat";

interface HeaderProps {
  user?: UserType;
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [location] = useLocation();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const notifications = [
    {
      id: 1,
      type: 'transaction',
      title: 'Transfer Completed',
      message: 'Your transfer of $1,000 to Zhang Wei has been completed successfully.',
      timestamp: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'security',
      title: 'Login Alert',
      message: 'New login detected from Beijing, China',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      title: 'Account Verification',
      message: 'Your account verification has been approved.',
      timestamp: '3 hours ago',
      read: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard">
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
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-blue-900">WORLD BANK</h1>
                <p className="text-xs text-gray-600">Digital Banking Platform</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Center Section - Quick Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link href="/dashboard">
            <Button variant={location === '/dashboard' ? 'default' : 'ghost'} size="sm">
              Dashboard
            </Button>
          </Link>
          <Link href="/transfer">
            <Button variant={location === '/transfer' ? 'default' : 'ghost'} size="sm">
              Transfer
            </Button>
          </Link>
          <Link href="/cards">
            <Button variant={location === '/cards' ? 'default' : 'ghost'} size="sm">
              Cards
            </Button>
          </Link>
          <Link href="/history">
            <Button variant={location === '/history' ? 'default' : 'ghost'} size="sm">
              History
            </Button>
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Live Chat */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowLiveChat(true)}
            className="relative"
          >
            <MessageSquare className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user.fullName || 'User'}</p>
                <p className="text-xs text-gray-600">{user.accountNumber}</p>
              </div>
            )}
            <Avatar user={user} />
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* Live Chat */}
      {showLiveChat && (
        <LiveChat onClose={() => setShowLiveChat(false)} />
      )}

      {/* Realtime Alerts */}
      <RealtimeAlerts />
    </header>
  );
}
