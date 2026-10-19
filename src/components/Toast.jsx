import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast.visible) return null;

  const icon = toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info';
  const bg =
    toast.type === 'success'
      ? 'bg-tertiary-container text-on-tertiary-container border-tertiary'
      : toast.type === 'error'
      ? 'bg-error-container text-on-error-container border-error'
      : 'bg-surface-container-highest text-on-surface border-primary';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 pointer-events-auto ${bg}`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
