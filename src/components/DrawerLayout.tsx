'use client';

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
  footer?: ReactNode;
  headerRight?: ReactNode;
}

const WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl'
};

export default function DrawerLayout({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  width = 'lg',
  children,
  footer,
  headerRight
}: DrawerLayoutProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm overflow-hidden animate-fadeIn">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container: Strict Flexbox Column */}
      <div className={`w-full ${WIDTH_MAP[width] || 'max-w-lg'} bg-white h-full shadow-2xl border-l border-slate-200 text-slate-900 flex flex-col min-h-0 overflow-hidden relative animate-slideInRight`}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-900 truncate tracking-tight">
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
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
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
    </div>
  );
}
