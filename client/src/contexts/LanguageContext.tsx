import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.balance': 'Total Balance',
    'dashboard.available': 'Available Balance',
    'dashboard.pending': 'Pending Transactions',
    'dashboard.accounts': 'My Accounts',
    'dashboard.recent': 'Recent Transactions',
    'dashboard.transfer': 'Transfer',
    'dashboard.deposit': 'Deposit',
    'dashboard.withdraw': 'Withdraw',
    'dashboard.pay': 'Pay Bills',
    
    // Transfer
    'transfer.title': 'Transfer Money',
    'transfer.amount': 'Amount',
    'transfer.recipient': 'Recipient',
    'transfer.account': 'Account Number',
    'transfer.submit': 'Send Transfer',
    'transfer.processing': 'Processing',
    'transfer.success': 'Transfer Successful',
    
    // Navigation
    'nav.home': 'Home',
    'nav.transfer': 'Transfer',
    'nav.cards': 'Cards',
    'nav.profile': 'Profile',
    'nav.support': 'Support',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete'
  },
  zh: {
    // Dashboard
    'dashboard.title': '仪表板',
    'dashboard.balance': '总余额',
    'dashboard.available': '可用余额',
    'dashboard.pending': '待处理交易',
    'dashboard.accounts': '我的账户',
    'dashboard.recent': '最近交易',
    'dashboard.transfer': '转账',
    'dashboard.deposit': '存款',
    'dashboard.withdraw': '取款',
    'dashboard.pay': '缴费',
    
    // Transfer
    'transfer.title': '转账',
    'transfer.amount': '金额',
    'transfer.recipient': '收款人',
    'transfer.account': '账号',
    'transfer.submit': '发送转账',
    'transfer.processing': '处理中',
    'transfer.success': '转账成功',
    
    // Navigation
    'nav.home': '首页',
    'nav.transfer': '转账',
    'nav.cards': '卡片',
    'nav.profile': '个人资料',
    'nav.support': '客服',
    
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.delete': '删除'
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  
  const t = (key: string): string => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}