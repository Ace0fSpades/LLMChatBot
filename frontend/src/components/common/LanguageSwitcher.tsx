import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.scss';

/**
 * Language switcher component with dropdown
 */
export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle language change
   */
  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLanguage = i18n.language === 'ru' ? 'ru' : 'en';
  const languages = [
    { code: 'ru', name: t('language.russian') },
    { code: 'en', name: t('language.english') },
  ];

  return (
    <div className={styles['language-switcher']} ref={dropdownRef}>
      <button
        className={styles['language-button']}
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.switch')}
        aria-label={t('language.switch')}
      >
        <span className={styles['language-icon']}>🌐</span>
        <span className={styles['language-code']}>
          {currentLanguage.toUpperCase()}
        </span>
      </button>
      {isOpen && (
        <div className={styles['language-dropdown']}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles['language-option']} ${
                currentLanguage === lang.code ? styles.active : ''
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

