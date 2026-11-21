'use client';

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  headerRight?: ReactNode;
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full'
};

export default function ModalLayout({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = '2xl',
  children,
  footer,
  onSubmit,
  headerRight
}: ModalLayoutProps) {
  if (!isOpen) return null;

  const content = (
    <div className={`bg-white rounded-3xl ${MAX_WIDTH_MAP[maxWidth] || 'max-w-2xl'} w-full border border-slate-200 shadow-2xl text-slate-900 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn relative`}>
      {/* Fixed Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-black text-slate-900 truncate tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerRight}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body Container */}
      <div className="overflow-y-auto flex-1 p-6 space-y-5">
        {children}
      </div>

      {/* Fixed Footer */}
      {footer && (
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/95 backdrop-blur-sm shrink-0 z-10">
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      {onSubmit ? (
        <form onSubmit={onSubmit} className="flex flex-col flex-1 max-w-full items-center justify-center min-h-0">
          {content}
        </form>
      ) : (
        content
      )}
    </div>
  );
}
