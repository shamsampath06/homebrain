import React from 'react';

export const InitialAvatar: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => (
  <span className={`inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold ${className}`}>
    {(name.trim()[0] || '?').toUpperCase()}
  </span>
);
