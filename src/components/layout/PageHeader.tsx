import React from 'react';
import { useHomeBrain, MainTab, SubScreen } from '../../context/HomeBrainContext';
import { buildBreadcrumbs } from '../../lib/navigation';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  showBack = true,
  onBack,
  badge
}) => {
  const { activeTab, activeSubScreen, setActiveTab, navigateToSubScreen, goBack } = useHomeBrain();

  const breadcrumbs = buildBreadcrumbs(activeTab, activeSubScreen);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const handleBreadcrumbClick = (tab: MainTab, sub: SubScreen) => {
    if (sub === 'none') {
      setActiveTab(tab);
      navigateToSubScreen('none');
    } else {
      setActiveTab(tab);
      navigateToSubScreen(sub);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Breadcrumb row & Back button */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap text-slate-500 dark:text-slate-400">
          {showBack && (
            <button
              onClick={handleBack}
              className="mr-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors shadow-sm"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={() => handleBreadcrumbClick('dashboard', 'none')}
            className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-xs">
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.tab, crumb.sub)}
                    className="hover:text-brand-600 dark:hover:text-brand-400 truncate max-w-[120px] sm:max-w-xs"
                  >
                    {crumb.label}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {badge && <div>{badge}</div>}
      </div>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
