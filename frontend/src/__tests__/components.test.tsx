import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { ContractConfigBanner } from '../components/ContractConfigBanner';
import { RpcMetricsBar } from '../components/RpcMetricsBar';
import { WalletModal } from '../components/WalletModal';
import { TxStatusModal } from '../components/TxStatusModal';
import { WalletProvider } from '../context/WalletContext';

describe('UI Components', () => {
  describe('Header', () => {
    it('renders header with brand and connect wallet button', () => {
      render(
        <WalletProvider>
          <Header />
        </WalletProvider>
      );
      expect(screen.getByText(/Policy Translation Release Gate/i)).toBeDefined();
      expect(screen.getByText(/Connect Wallet/i)).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('renders all 7 tabs and fires onSelectTab callback', () => {
      const onSelect = vi.fn();
      render(<Navigation activeTab="overview" onSelectTab={onSelect} />);

      expect(screen.getByText('Overview')).toBeDefined();
      expect(screen.getByText('1. Publisher')).toBeDefined();
      expect(screen.getByText('2. Localizer')).toBeDefined();
      expect(screen.getByText('3. Assess')).toBeDefined();
      expect(screen.getByText('4. Publish')).toBeDefined();
      expect(screen.getByText('5. Consumer')).toBeDefined();
      expect(screen.getByText('6. Public Audit')).toBeDefined();

      fireEvent.click(screen.getByText('1. Publisher'));
      expect(onSelect).toHaveBeenCalledWith('publisher');

      fireEvent.click(screen.getByText('6. Public Audit'));
      expect(onSelect).toHaveBeenCalledWith('audit');
    });
  });

  describe('ContractConfigBanner', () => {
    it('renders contract configuration details', () => {
      render(<ContractConfigBanner />);
      expect(screen.getByText(/Contract Address Not Configured/i)).toBeDefined();
      expect(screen.getByText(/VITE_GENLAYER_CONTRACT_ADDRESS/i)).toBeDefined();
    });
  });

  describe('RpcMetricsBar', () => {
    it('renders metric counters and clear cache action', () => {
      render(<RpcMetricsBar />);
      expect(screen.getByText(/RPC Requests:/i)).toBeDefined();
      expect(screen.getByText(/Cache Hits:/i)).toBeDefined();
      expect(screen.getByText(/Clear Cache/i)).toBeDefined();
    });
  });

  describe('WalletModal', () => {
    it('remains closed when isOpen is false', () => {
      render(
        <WalletProvider>
          <WalletModal />
        </WalletProvider>
      );
      expect(screen.queryByText('Connect Authorized Wallet')).toBeNull();
    });
  });

  describe('TxStatusModal', () => {
    it('remains hidden when phase is idle', () => {
      render(<TxStatusModal />);
      expect(screen.queryByText(/Processing Transaction/i)).toBeNull();
    });
  });
});
