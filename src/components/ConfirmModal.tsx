/**
 * ConfirmModal — native confirm() yerine tasarım diline uygun onay diyaloğu.
 * InfoModal ile aynı modal chrome'unu (options.css .modal-*) kullanır.
 */

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-container confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <div className={`modal-header-icon ${danger ? 'confirm-modal-icon-danger' : ''}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2>{title}</h2>
            </div>
          </div>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="modal-reset-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`modal-done-btn ${danger ? 'confirm-modal-danger' : ''}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
