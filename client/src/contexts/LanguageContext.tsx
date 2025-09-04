import { useState, createContext, ReactNode, useContext } from "react";

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Login & Auth
    'world_bank': 'WORLD BANK',
    'international_banking_solutions': 'International Banking Solutions',
    'sign_in': 'Sign In',
    'access_your_secure_banking_portal': 'Access your secure banking portal',
    'email_address': 'Email Address',
    'user_id_or_email': 'User ID or Email',
    'id_placeholder': 'Enter your ID or email',
    'password': 'Password',
    'enter_password': 'Enter your password',
    'login_failed': 'Login Failed',
    'login_successful': 'Login Successful',
    'welcome_back': 'Welcome back to World Bank',
    'invalid_pin': 'Invalid PIN. Please try again.',
    'verification_failed': 'Verification failed. Please try again.',
    'enter_pin': 'Enter PIN',
    'pin_verification': 'PIN Verification',
    'enter_4_digit_pin': 'Enter your 4-digit PIN to continue',
    'signing_in': 'Signing In...',
    'security_center': 'Security Center',
    'new_customer': 'New customer?',
    'create_account': 'Create Account',
    
    // Dashboard
    'dashboard': 'Dashboard',
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
    'balance': 'Balance',
    'account': 'Account',
    'total_balance': 'Total Balance',
    'available_balance': 'Available Balance',
    'quick_actions': 'Quick Actions',
    'send_money': 'Send Money',
    'add_money': 'Add Money',
    'pay_bill': 'Pay Bill',
    'recent_activity': 'Recent Activity',
    'view_all': 'View All',
    
    // Transfer
    'transfer': 'Transfer',
    'transfer.title': 'Transfer Money',
    'transfer.amount': 'Amount',
    'transfer.recipient': 'Recipient',
    'transfer.account': 'Account Number',
    'transfer.submit': 'Send Transfer',
    'transfer.processing': 'Processing',
    'transfer.success': 'Transfer Successful',
    'international_transfer': 'International Transfer',
    'international_transfer_title': 'International Wire Transfer', 
    'international_transfer_desc': 'SWIFT Network • Bank Grade Security • Global Coverage',
    'domestic_transfer': 'Domestic Transfer',
    'domestic_transfer_title': 'Domestic Transfer',
    'domestic_transfer_desc': 'Instant delivery • No fees • 24/7 service',
    'card_transfer_title': 'Card Transfer',
    'card_transfer_desc': 'Debit/Credit cards • Instant delivery',
    'mobile_money_title': 'Mobile Money', 
    'mobile_money_desc': 'Fast & convenient • Mobile wallets',
    'same_day': 'Same day',
    'instant': 'Instant',
    'minutes_to_hours': 'Minutes to hours',
    'account_number': 'Account Number',
    'account_id': 'Account ID',
    'my_accounts': 'My Accounts',
    'amount': 'Amount',
    'recipient': 'Recipient',
    'welcome': 'Welcome to World Bank Digital Services',
    'available': 'Available Balance',
    'checking_account': 'Primary Checking Account',
    'savings_account': 'High-Yield Savings Account', 
    'investment_account': 'Investment Portfolio Account',
    'send_money_worldwide': 'International Wire Transfer Services',
    'request_money': 'Payment Request Service',
    'fund_account': 'Account Funding Options',
    'customer_support': 'Premium Customer Support',
    'banking_alerts': 'Security & Transaction Alerts',
    'new_notifications': 'unread notifications',
    'download_reports': 'Financial Statement Download',
    'currency_rates': 'Real-Time Exchange Rates',
    'portfolio_view': 'Investment Portfolio Analysis',
    'recent_transactions': 'Transaction History',
    'salary_payment': 'Salary Direct Deposit',
    'grocery_store': 'Retail Purchase Transaction',
    'investment_return': 'Investment Portfolio Return',
    'processing': 'Transaction Processing',
    'completed': 'Successfully Completed',
    'pending': 'Awaiting Approval',
    'failed': 'Transaction Declined',
    
    // Navigation
    'nav.home': 'Home',
    'nav.transfer': 'Transfer',
    'nav.cards': 'Cards',
    'nav.profile': 'Profile',
    'nav.support': 'Support',
    'home': 'Home',
    'cards': 'Cards',
    'profile': 'Profile',
    'support': 'Support',
    'history': 'History',
    
    // Cards
    'my_cards': 'My Cards',
    'manage_cards': 'Manage your credit and debit cards',
    'add_card': 'Add Card',
    'card_settings': 'Card Settings',
    'lock_card': 'Lock Card',
    'unlock_card': 'Unlock Card',
    'view_details': 'View Details',
    'manage': 'Manage',
    
    // Common
    'loading': 'Loading...',
    'common.loading': 'Loading...',
    'pin_verification_required': 'PIN Verification Required',
    'enter_pin_complete_login': 'Enter your PIN to complete login',
    'security_pin': 'Security PIN',
    'cancel': 'Cancel',
    'verify_pin': 'Verify PIN',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'save': 'Save',
    'edit': 'Edit',
    'delete': 'Delete',
    'close': 'Close',
    'confirm': 'Confirm',
    'continue': 'Continue',
    'back': 'Back',
    'next': 'Next',
    'submit': 'Submit',
    'error': 'Error',
    'success': 'Success',
    'warning': 'Warning',
    'info': 'Information',
    
    // International Banking
    'international_banking': 'International Banking',
    'international_transfers': 'International Transfers',
    'currency_exchange': 'Currency Exchange',
    'cross_border_payments': 'Cross-Border Payments',
    'swift_transfers': 'SWIFT Transfers',
    'correspondent_banking': 'Correspondent Banking',
    'foreign_exchange': 'Foreign Exchange',
    'trade_finance': 'Trade Finance',
    'letter_of_credit': 'Letter of Credit',
    'wire_transfers': 'Wire Transfers',
    'multi_currency_accounts': 'Multi-Currency Accounts',
    'exchange_rates': 'Exchange Rates',
    'international_compliance': 'International Compliance',
    'anti_money_laundering': 'Anti-Money Laundering (AML)',
    'know_your_customer': 'Know Your Customer (KYC)',
    'sanctions_screening': 'Sanctions Screening',
    'regulatory_reporting': 'Regulatory Reporting',
    
    // Missing translations
    'verified_account': 'Verified Account',
    'online': 'Online',
    'authenticated': 'Authenticated',
    'no_credit_cards': 'No Credit Cards',
    'you_dont_have_any_credit_cards_yet': "You don't have any credit cards yet.",
    'apply_for_card': 'Apply for Card',
    'mobile_pay': 'Mobile Pay',
    'pay_bill': 'Pay Bill',
    'no_recent_transactions_available': 'No recent transactions available',
    'prof': 'Profile',
    'receive': 'Receive',
    'live_chat': 'Live Chat',
    'statements': 'Statements',
    'exchange': 'Exchange',
    'investments': 'Investments',
    'vs_last_month': 'vs last month',
    'processing_transfer': 'Processing transfer',
    'send_amount': 'Send Amount',
    'profile_settings': 'Profile Settings',
    'view_your_profile_information_and_account_details': 'View your profile information and account details',
    'profile_information': 'Profile Information',
    'secure_profile': 'Secure Profile',
    'address_information': 'Address Information',
    'address': 'Address',
    'postal_code': 'Postal Code',
    'transfer_pin_settings': 'Transfer PIN Settings',
    'contact_customer_support_to_request_pin_changes': 'Contact customer support to request PIN changes',
    'admin_only': 'Admin Only',
    'two_factor_authentication': 'Two-Factor Authentication',
    'add_an_extra_layer_of_security': 'Add an extra layer of security',
    'enabled': 'Enabled',
    'session_security': 'Session Security',
    'automatic_logout_and_session_management': 'Automatic logout and session management',
    'active': 'Active',
    'account_actions': 'Account Actions',
    'verification_center': 'Verification Center',
    'need_to_update_your_profile_information': 'Need to update your profile information? Contact our customer support team for assistance.',
    'contact_support': 'Contact Support',
    'full_name': 'Full Name',
    'nationality': 'Nationality',
    'annual_income': 'Annual Income'
  },
  zh: {
    // Login & Auth
    'world_bank': '世界银行',
    'international_banking_solutions': '国际银行解决方案',
    'sign_in': '登录',
    'access_your_secure_banking_portal': '访问您的安全银行门户',
    'email_address': '电子邮箱',
    'user_id_or_email': '用户ID或邮箱',
    'id_placeholder': '输入您的ID或邮箱',
    'password': '密码',
    'enter_password': '输入您的密码',
    'login_failed': '登录失败',
    'login_successful': '登录成功',
    'welcome_back': '欢迎回到世界银行',
    'invalid_pin': '无效的PIN。请重试。',
    'verification_failed': '验证失败。请重试。',
    'enter_pin': '输入PIN',
    'pin_verification': 'PIN验证',
    'enter_4_digit_pin': '输入您的4位PIN以继续',
    'signing_in': '登录中...',
    'security_center': '安全中心',
    'new_customer': '新客户？',
    'create_account': '创建账户',
    
    // Dashboard
    'dashboard': '仪表板',
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
    'balance': '余额',
    'account': '账户',
    'available_balance': '可用余额',
    'send_money': '转账',
    'add_money': '存款',
    'pay_bill': '缴费',
    'recent_activity': '最近活动',
    'view_all': '查看全部',
    
    // Transfer
    'transfer': '转账',
    'transfer.title': '转账',
    'transfer.amount': '金额',
    'transfer.recipient': '收款人',
    'transfer.account': '账号',
    'transfer.submit': '发送转账',
    'transfer.processing': '处理中',
    'transfer.success': '转账成功',
    'international_transfer': '国际转账',
    'domestic_transfer': '国内转账',
    'amount': '金额',
    'recipient': '收款人',
    'processing': '处理中',
    'completed': '已完成',
    'pending': '待处理',
    'failed': '失败',
    
    // Navigation
    'nav.home': '首页',
    'nav.transfer': '转账',
    'nav.cards': '卡片',
    'nav.profile': '个人资料',
    'nav.support': '客服',
    'home': '首页',
    'cards': '卡片',
    'profile': '个人资料',
    'support': '客服',
    'history': '历史记录',
    
    // Cards
    'my_cards': '我的卡片',
    'manage_cards': '管理您的信用卡和借记卡',
    'add_card': '添加卡片',
    'card_settings': '卡片设置',
    'lock_card': '锁定卡片',
    'unlock_card': '解锁卡片',
    'view_details': '查看详情',
    'manage': '管理',
    
    // Common
    'loading': '加载中...',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.delete': '删除',
    'save': '保存',
    'cancel': '取消',
    'edit': '编辑',
    'delete': '删除',
    'close': '关闭',
    'confirm': '确认',
    'continue': '继续',
    'back': '返回',
    'next': '下一步',
    'submit': '提交',
    'error': '错误',
    'success': '成功',
    'warning': '警告',
    'info': '信息',
    
    // International Banking (Chinese)
    'international_banking': '国际银行',
    'international_transfers': '国际转账',
    'currency_exchange': '外汇兑换',
    'cross_border_payments': '跨境支付',
    'swift_transfers': 'SWIFT转账',
    'correspondent_banking': '代理银行',
    'foreign_exchange': '外汇',
    'trade_finance': '贸易融资',
    'letter_of_credit': '信用证',
    'wire_transfers': '电汇',
    'multi_currency_accounts': '多币种账户',
    'exchange_rates': '汇率',
    'international_compliance': '国际合规',
    'anti_money_laundering': '反洗钱 (AML)',
    'know_your_customer': '了解您的客户 (KYC)',
    'sanctions_screening': '制裁筛查',
    'regulatory_reporting': '监管报告',
    
    // Missing translations Chinese
    'verified_account': '已验证账户',
    'online': '在线',
    'authenticated': '已认证',
    'no_credit_cards': '无信用卡',
    'you_dont_have_any_credit_cards_yet': '您尚未拥有任何信用卡。',
    'apply_for_card': '申请卡片',
    'mobile_pay': '移动支付',
    'pay_bill': '缴费',
    'no_recent_transactions_available': '暂无最近交易',
    'prof': '个人',
    'receive': '接收',
    'live_chat': '在线客服',
    'statements': '对账单',
    'exchange': '外汇',
    'investments': '投资',
    'vs_last_month': '与上月相比',
    'processing_transfer': '转账处理中',
    'send_amount': '发送金额',
    'profile_settings': '个人资料设置',
    'view_your_profile_information_and_account_details': '查看您的个人资料信息和账户详情',
    'profile_information': '个人信息',
    'secure_profile': '安全资料',
    'address_information': '地址信息',
    'postal_code': '邮政编码',
    'transfer_pin_settings': '转账PIN设置',
    'contact_customer_support_to_request_pin_changes': '联系客户支持请求PIN更改',
    'admin_only': '仅限管理员',
    'two_factor_authentication': '双重身份验证',
    'add_an_extra_layer_of_security': '添加额外的安全层',
    'enabled': '已启用',
    'session_security': '会话安全',
    'automatic_logout_and_session_management': '自动注销和会话管理',
    'active': '活跃',
    'account_actions': '账户操作',
    'verification_center': '验证中心',
    'need_to_update_your_profile_information': '需要更新您的个人资料信息？请联系我们的客户支持团队寻求帮助。',
    'contact_support': '联系支持',
    'full_name': '全名',
    'nationality': '国籍',
    'annual_income': '年收入'
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

// Auto-detect user's region and language
function detectUserLanguage(): Language {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang === 'zh' || urlLang === 'en') {
    return urlLang as Language;
  }

  // Check localStorage
  const savedLang = localStorage.getItem('worldbank_language');
  if (savedLang === 'zh' || savedLang === 'en') {
    return savedLang as Language;
  }

  // Auto-detect based on browser/timezone/IP
  const browserLang = navigator.language.toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // China regions and Chinese language detection
  if (browserLang.includes('zh') || 
      timezone.includes('Shanghai') || 
      timezone.includes('Beijing') || 
      timezone.includes('Chongqing') ||
      timezone.includes('Hong_Kong') ||
      timezone.includes('Macau') ||
      timezone.includes('Asia/Shanghai') ||
      timezone.includes('Asia/Hong_Kong')) {
    return 'zh';
  }
  
  // Default to English for other regions
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => detectUserLanguage());
  
  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('worldbank_language', newLang);
  };
  
  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
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
