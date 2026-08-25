import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import { Header } from './components/Header';
import { Navigation, JourneyTab } from './components/Navigation';
import { ContractConfigBanner } from './components/ContractConfigBanner';
import { RpcMetricsBar } from './components/RpcMetricsBar';
import { WalletModal } from './components/WalletModal';
import { TxStatusModal } from './components/TxStatusModal';
import { rpcExecutor } from './services/rpcBudget';

import { OverviewView } from './views/OverviewView';
import { PublisherView } from './views/PublisherView';
import { LocalizerView } from './views/LocalizerView';
import { AssessView } from './views/AssessView';
import { PublishView } from './views/PublishView';
import { ConsumerView } from './views/ConsumerView';
import { PublicAuditView } from './views/PublicAuditView';

import './styles/app.css';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<JourneyTab>('overview');

  const selectTab = (nextTab: JourneyTab) => {
    if (nextTab !== activeTab) {
      rpcExecutor.cancelJourney(activeTab);
      setActiveTab(nextTab);
    }
  };

  return (
    <div className="app-container">
      <Header />
      <Navigation activeTab={activeTab} onSelectTab={selectTab} />

      <main className="main-content">
        <ContractConfigBanner />
        <RpcMetricsBar />

        {activeTab === 'overview' && <OverviewView onNavigate={selectTab} />}
        {activeTab === 'publisher' && <PublisherView />}
        {activeTab === 'localizer' && <LocalizerView />}
        {activeTab === 'assess' && <AssessView />}
        {activeTab === 'publish' && <PublishView />}
        {activeTab === 'consumer' && <ConsumerView />}
        {activeTab === 'audit' && <PublicAuditView />}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <span>
          Policy Translation Release Gate &bull; Powered by GenLayer Intelligent Consensus
        </span>
      </footer>

      <WalletModal />
      <TxStatusModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
};

export default App;
