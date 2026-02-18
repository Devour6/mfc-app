import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Solana wallet hook before importing ArenaTopBar
jest.mock('@/lib/solana/use-wallet', () => ({
  useSolanaWallet: () => ({
    connected: false,
    publicKey: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn().mockResolvedValue(0),
    signAndSend: jest.fn(),
  }),
}));

import ArenaTopBar from '../components/ArenaTopBar';

describe('ArenaTopBar Navigation Tests', () => {
  const defaultProps = {
    credits: 1000,
    soundEnabled: true,
    onToggleSound: jest.fn(),
    onGoHome: jest.fn(),
    onOpenSection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ArenaTopBar renders without crashing', () => {
    expect(() => {
      render(<ArenaTopBar {...defaultProps} />);
    }).not.toThrow();
  });

  test('displays MFC logo and LIVE indicator', () => {
    render(<ArenaTopBar {...defaultProps} />);
    expect(screen.getByText('MFC')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('displays credit balance', () => {
    render(<ArenaTopBar {...defaultProps} />);
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  test('calls onGoHome when MFC logo is clicked', async () => {
    const user = userEvent.setup();
    render(<ArenaTopBar {...defaultProps} />);
    await user.click(screen.getByText('MFC'));
    expect(defaultProps.onGoHome).toHaveBeenCalled();
  });

  test('calls onToggleSound when sound button is clicked', async () => {
    const user = userEvent.setup();
    render(<ArenaTopBar {...defaultProps} />);
    await user.click(screen.getByText('SND'));
    expect(defaultProps.onToggleSound).toHaveBeenCalled();
  });

  test('shows MUTE label when sound is disabled', () => {
    render(<ArenaTopBar {...defaultProps} soundEnabled={false} />);
    expect(screen.getByText('MUTE')).toBeInTheDocument();
  });

  test('opens dropdown and calls onOpenSection', async () => {
    const user = userEvent.setup();
    render(<ArenaTopBar {...defaultProps} />);

    // Open the MORE dropdown
    await user.click(screen.getByText('MORE'));

    // All sections should be visible
    expect(screen.getByText('RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('FIGHTERS')).toBeInTheDocument();
    expect(screen.getByText('TOURNAMENTS')).toBeInTheDocument();
    expect(screen.getByText('REWARDS')).toBeInTheDocument();
    expect(screen.getByText('ACHIEVEMENTS')).toBeInTheDocument();

    // Click a section
    await user.click(screen.getByText('RANKINGS'));
    expect(defaultProps.onOpenSection).toHaveBeenCalledWith('rankings');
  });

  test('navigation has proper accessibility structure', () => {
    const { container } = render(<ArenaTopBar {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
