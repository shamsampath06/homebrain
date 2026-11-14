import React from 'react';

interface SpatialGlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverGlow?: boolean;
}

export const SpatialGlassCard: React.FC<SpatialGlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverGlow = true
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } bg-white/80 dark:bg-space-850/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-card dark:shadow-spatial ${
        hoverGlow
          ? 'hover:border-brand-400 dark:hover:border-brand-500/50 hover:shadow-lg dark:hover:shadow-glass-glow hover:-translate-y-1'
          : ''
      } ${className}`}
    >
      {/* Specular Top Shimmer Reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent pointer-events-none rounded-t-3xl" />
      {children}
    </div>
  );
};

