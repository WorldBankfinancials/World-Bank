
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';

export function LanguageSelector() {
  const { currentLanguage, languages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Safe fallback if language context is not available
  if (!currentLanguage || !languages) {
    return (
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-600">EN</span>
      </div>
    );
  }

  const handleLanguageSelect = (languageCode: string) => {
    try {
      changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.warn('Error selecting language:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-2 hover:bg-gray-100"
        >
          <span className="text-lg">{currentLanguage.flag || '🇺🇸'}</span>
          <span className="hidden sm:inline text-sm font-medium">
            {currentLanguage.name || 'English'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`flex items-center space-x-3 cursor-pointer ${
              currentLanguage.code === language.code 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="text-sm">{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSelector;
