import React, { useEffect } from 'react';
import { Settings, Search, Info, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n/config';

const Popup: React.FC = () => {
  const { t, i18n } = useTranslation(['popup']);

  useEffect(() => {
    // Load language setting from storage
    chrome.storage.local.get('language').then((result) => {
      if (result.language) {
        i18n.changeLanguage(result.language);
      }
    });
  }, [i18n]);
  const handleOpenOptions = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html')
    });
    window.close();
  };

  const handleOpenSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const menuItems = [
    {
      icon: <Search className="w-5 h-5" />,
      title: t('menu.iocAnalysis.title', { ns: 'popup' }),
      description: t('menu.iocAnalysis.description', { ns: 'popup' }),
      onClick: handleOpenSidePanel,
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: t('menu.apiSettings.title', { ns: 'popup' }),
      description: t('menu.apiSettings.description', { ns: 'popup' }),
      onClick: handleOpenOptions,
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: t('menu.about.title', { ns: 'popup' }),
      description: t('menu.about.description', { ns: 'popup' }),
      onClick: () => {
        chrome.tabs.create({
          url: 'https://ahtapot.me'
        });
      },
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: t('menu.feedback.title', { ns: 'popup' }),
      description: t('menu.feedback.description', { ns: 'popup' }),
      onClick: () => {
        chrome.tabs.create({
          url: 'https://ahtapot.me/#feedback'
        });
      },
    },
  ];

  return (
    <div className="popup-container">
      <div className="popup-header">
        <img
          src="/icons/logo-white.png"
          alt={t('header.logoAlt', { ns: 'popup' })}
          className="popup-logo"
        />
      </div>

      <div className="popup-menu">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="menu-item"
            onClick={item.onClick}
          >
            <div className="menu-item-icon">{item.icon}</div>
            <div className="menu-item-content">
              <div className="menu-item-title">{item.title}</div>
              <div className="menu-item-description">{item.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="popup-footer">
        <p className="popup-footer-text">
          {t('footer.text', { ns: 'popup' })}
        </p>
      </div>
    </div>
  );
};

export default Popup;
