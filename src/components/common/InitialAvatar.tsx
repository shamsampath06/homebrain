import React from 'react';

export const InitialAvatar: React.FC<{ name?: string | null; className?: string }> = ({ name, className = '' }) => {
  const cleanName = String(name || '').trim();
  const initial = (cleanName[0] || '?').toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold ${className}`}>
      {initial}
    </span>
  );
};
