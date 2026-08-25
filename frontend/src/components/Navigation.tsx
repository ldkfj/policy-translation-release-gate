import React from 'react';

export type JourneyTab =
  | 'overview'
  | 'publisher'
  | 'localizer'
  | 'assess'
  | 'publish'
  | 'consumer'
  | 'audit';

interface NavigationProps {
  activeTab: JourneyTab;
  onSelectTab: (tab: JourneyTab) => void;
}

const TABS: Array<{ id: JourneyTab; label: string; number?: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'publisher', label: '1. Publisher' },
  { id: 'localizer', label: '2. Localizer' },
  { id: 'assess', label: '3. Assess' },
  { id: 'publish', label: '4. Publish' },
  { id: 'consumer', label: '5. Consumer' },
  { id: 'audit', label: '6. Public Audit' },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="app-nav" aria-label="Main Navigation" role="tablist">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
