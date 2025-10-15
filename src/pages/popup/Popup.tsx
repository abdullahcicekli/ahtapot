import React from 'react';
import { Settings, Search, Info } from 'lucide-react';

const Popup: React.FC = () => {
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
      title: 'IOC Analizi',
      description: 'Yan paneli aç ve IOC analizi yap',
      onClick: handleOpenSidePanel,
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'API Ayarları',
      description: 'API anahtarlarını yönet',
      onClick: handleOpenOptions,
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: 'Hakkında',
      description: 'Ahtapot Extension v1.0.0',
      onClick: () => {
        chrome.tabs.create({
          url: 'https://github.com/yourusername/ahtapot-extension'
        });
      },
    },
  ];

  return (
    <div className="popup-container">
      <div className="popup-header">
        <img
          src="/icons/logo-white.png"
          alt="Ahtapot Logo"
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
          Metin seçerek veya sağ tıklayarak IOC analizi yapabilirsiniz
        </p>
      </div>
    </div>
  );
};

export default Popup;
