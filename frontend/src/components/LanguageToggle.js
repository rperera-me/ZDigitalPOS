import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'si' : 'en';
    i18n.changeLanguage(newLang);
  };

  const isEnglish = i18n.language === 'en';

  return (
    <button
      onClick={toggleLanguage}
      aria-label={`Switch to ${isEnglish ? 'Sinhala' : 'English'}`}
      className="relative inline-flex items-center gap-1 min-w-[100px] px-2 py-1.5 
                 bg-gray-100 border-2 border-gray-200 rounded-full cursor-pointer 
                 text-sm font-semibold text-gray-800 shadow-sm
                 transition-all duration-300 ease-in-out
                 hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-100"
    >      
      <span className={isEnglish ? 'text-indigo-600 font-bold transition-all duration-200' : 'text-gray-500 font-medium transition-all duration-200'}>
        EN
      </span>
      
      <div className="relative w-8 h-[18px] rounded-xl flex-shrink-0 transition-colors duration-300">
        <div className={isEnglish ? 'absolute inset-0 bg-indigo-600 rounded-xl' : 'absolute inset-0 bg-emerald-500 rounded-xl'} />
        <span className={isEnglish ? 'absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-300' : 'absolute top-0.5 left-[14px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-300'} />
      </div>
      
      <span className={!isEnglish ? 'text-emerald-500 font-bold transition-all duration-200' : 'text-gray-500 font-medium transition-all duration-200'}>
        සිං
      </span>
    </button>
  );
}
