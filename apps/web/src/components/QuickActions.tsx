import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeftRight, 
  CreditCard, 
  Download, 
  PiggyBank,
  HelpCircle,
  type LucideIcon
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickAction {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { id: "transfer", labelKey: "send_money", icon: ArrowLeftRight, href: "/transfer-funds", color: "bg-blue-500" },
  { id: "cards", labelKey: "my_cards", icon: CreditCard, href: "/cards", color: "bg-purple-500" },
  { id: "statements", labelKey: "statements", icon: Download, href: "/statements-reports", color: "bg-green-500" },
  { id: "savings", labelKey: "add_money", icon: PiggyBank, href: "/savings", color: "bg-orange-500" },
  { id: "support", labelKey: "live_chat", icon: HelpCircle, href: "/support", color: "bg-red-500" },
];

export default function QuickActions() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="grid grid-cols-5 gap-2 sm:gap-4"
      role="navigation"
      aria-label={t("quick_actions")}
    >
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <a
            key={action.id}
            href={action.href}
            className={`
              flex flex-col items-center justify-center gap-2 p-3 sm:p-4
              rounded-xl bg-white shadow-sm border border-gray-100
              hover:shadow-md hover:border-gray-200 transition-all
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
            style={{ transitionDelay: `${index * 50}ms` }}
            aria-label={t(action.labelKey)}
            role="button"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${action.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
              {t(action.labelKey)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
