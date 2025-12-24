import React, { useEffect, memo, useCallback, useMemo, useState } from 'react';
import { Settings, Search, Info, MessageSquare, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { storage, runtime, tabs, Platform } from '@/platform';
import { SidePanel } from '@/platform/sidepanel';
import '@/i18n/config';


const Popup: React.FC = memo(() => {
  const { t, i18n } = useTranslation(['popup']);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    storage.local.get('language').then((result: Record<string, unknown>) => {
      if (result.language) {
        i18n.changeLanguage(result.language as string);
      }
    });

    const manifest = runtime.getManifest();
    setVersion(manifest.version);
  }, [i18n]);

  const handleOpenOptions = useCallback(() => {
    tabs.create({
      url: runtime.getURL('src/pages/options/index.html')
    });
    window.close();
  }, []);

  const handleOpenSidePanel = useCallback(async () => {
    const [tab] = await tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await SidePanel.open({ tabId: tab.id });
      window.close();
    }
  }, []);

  const handleOpenAbout = useCallback(() => {
    tabs.create({ url: 'https://ahtapot.me' });
  }, []);

  const handleOpenFeedback = useCallback(() => {
    tabs.create({ url: 'https://ahtapot.me/#feedback' });
  }, []);

  const handleOpenStore = useCallback(() => {
    // Open the appropriate store based on browser
    const storeUrls = {
      chrome: 'https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg',
      firefox: 'https://addons.mozilla.org/firefox/addon/ahtapot-ioc-analysis/',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/ahtapot-ioc-analysis/placeholder',
    };
    tabs.create({ url: storeUrls[Platform.browser] || storeUrls.chrome });
  }, []);

  const menuItems = useMemo(() => [
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
      description: `${t('menu.about.description', { ns: 'popup' })} ${version ? `v${version}` : ''}`,
      onClick: handleOpenAbout,
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: t('menu.feedback.title', { ns: 'popup' }),
      description: t('menu.feedback.description', { ns: 'popup' }),
      onClick: handleOpenFeedback,
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: t('menu.rateUs.title', { ns: 'popup' }),
      description: t('menu.rateUs.description', { ns: 'popup' }),
      onClick: handleOpenStore,
    },
  ], [t, version, handleOpenSidePanel, handleOpenOptions, handleOpenAbout, handleOpenFeedback, handleOpenStore]);

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
          {t('footer.text', { ns: 'popup' })} {version && `v${version}`}
        </p>
      </div>
    </div>
  );
});

Popup.displayName = 'Popup';

export default Popup;