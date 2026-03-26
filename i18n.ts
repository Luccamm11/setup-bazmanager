import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// EN locales
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enSkills from './locales/en/skills.json';
import enGoals from './locales/en/goals.json';
import enStore from './locales/en/store.json';
import enChat from './locales/en/chat.json';
import enSettings from './locales/en/settings.json';
import enAnalytics from './locales/en/analytics.json';
import enConstants from './locales/en/constants.json';

// PT-BR locales
import ptCommon from './locales/pt-BR/common.json';
import ptDashboard from './locales/pt-BR/dashboard.json';
import ptSkills from './locales/pt-BR/skills.json';
import ptGoals from './locales/pt-BR/goals.json';
import ptStore from './locales/pt-BR/store.json';
import ptChat from './locales/pt-BR/chat.json';
import ptSettings from './locales/pt-BR/settings.json';
import ptAnalytics from './locales/pt-BR/analytics.json';
import ptConstants from './locales/pt-BR/constants.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        dashboard: enDashboard,
        skills: enSkills,
        goals: enGoals,
        store: enStore,
        chat: enChat,
        settings: enSettings,
        analytics: enAnalytics,
        constants: enConstants,
      },
      'pt-BR': {
        common: ptCommon,
        dashboard: ptDashboard,
        skills: ptSkills,
        goals: ptGoals,
        store: ptStore,
        chat: ptChat,
        settings: ptSettings,
        analytics: ptAnalytics,
        constants: ptConstants,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'levelUpLanguage',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
