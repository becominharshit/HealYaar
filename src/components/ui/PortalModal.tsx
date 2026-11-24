import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  backdropClassName?: string;
  children: React.ReactNode;
}

/**
 * Accessible Portal Modal rendered directly into document.body at z-[100].
 * Guarantees modals never clip beneath fixed sidebars or ancestor stacking contexts,
 * and always support Escape-to-close and backdrop click dismissal.
 */
export const PortalModal: React.FC<PortalModalProps> = ({
  isOpen,
  onClose,
  ariaLabelledBy,
  ariaLabel,
  backdropClassName = 'bg-slate-900/60',
  children
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${backdropClassName} backdrop-blur-sm animate-fade-in`}
    >
      {children}
    </div>,
    document.body
  );
};
