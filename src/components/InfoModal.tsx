/**
 * InfoModal — provider info in an overlay dialog, styled by the existing
 * modal chrome (options.css .modal-*). Closes on overlay click and Escape.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, subtitle, icon, onClose, children }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container info-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-content">
            {icon && <div className="modal-header-icon">{icon}</div>}
            <div>
              <h2>{title}</h2>
              {subtitle && <p className="modal-header-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="info-modal-body">{children}</div>
      </div>
    </div>
  );
};
