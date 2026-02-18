import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from '../app/page';

// Mock sound manager
jest.mock('../lib/sound-manager', () => ({
  __esModule: true,
  default: { mute: jest.fn(), unmute: jest.fn() },
}));

// Mock Zustand store
jest.mock('../lib/store', () => ({
  useGameStore: (selector: any) => selector({ user: { credits: 1000 } }),
}));

// Mock child components — LandingPage exposes a button to trigger view switch
jest.mock('../components/LandingPage', () => {
  return function MockLandingPage({ onEnterArena }: { onEnterArena: (role: 'spectator' | 'fighter') => void }) {
    return (
      <div data-testid="landing-page">
        <button onClick={() => onEnterArena('spectator')}>Enter Arena</button>
      </div>
    );
  };
});

jest.mock('../components/LiveFightSection', () => {
  return function MockLiveFightSection() {
    return <div data-testid="live-fight-section">Live Fight Section</div>;
  };
});

jest.mock('../components/ArenaTopBar', () => {
  const MockArenaTopBar = (props: any) => (
    <div data-testid="arena-top-bar">
      <button onClick={props.onGoHome}>MFC</button>
      <button onClick={() => props.onOpenSection('rankings')}>Rankings</button>
    </div>
  );
  return {
    __esModule: true,
    default: MockArenaTopBar,
  };
});

jest.mock('../components/DailyRewards', () => {
  return function MockDailyRewards() {
    return <div data-testid="daily-rewards">Daily Rewards</div>;
  };
});

jest.mock('../components/RankingsSection', () => {
  return function MockRankingsSection() {
    return <div data-testid="rankings-section">Rankings Section</div>;
  };
});

jest.mock('../components/TournamentBracket', () => {
  return function MockTournamentBracket() {
    return <div data-testid="tournament-bracket">Tournament Bracket</div>;
  };
});

jest.mock('../components/AchievementSystem', () => {
  return function MockAchievementSystem() {
    return <div data-testid="achievement-system">Achievement System</div>;
  };
});

jest.mock('../components/FightersSection', () => {
  return function MockFightersSection() {
    return <div data-testid="fighters-section">Fighters Section</div>;
  };
});

describe('MFC App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('landing page renders on initial load', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  test('arena components are not visible on landing view', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('arena-top-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('live-fight-section')).not.toBeInTheDocument();
  });

  test('entering arena shows ArenaTopBar and LiveFightSection', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Enter Arena'));

    await waitFor(() => {
      expect(screen.getByTestId('arena-top-bar')).toBeInTheDocument();
      expect(screen.getByTestId('live-fight-section')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
  });

  test('app renders without throwing errors', () => {
    expect(() => {
      render(<HomePage />);
    }).not.toThrow();
  });

  test('drawer sections render when opened from arena', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    // Enter the arena
    await user.click(screen.getByText('Enter Arena'));
    await waitFor(() => {
      expect(screen.getByTestId('arena-top-bar')).toBeInTheDocument();
    });

    // Open the rankings drawer
    await user.click(screen.getByText('Rankings'));
    await waitFor(() => {
      expect(screen.getByTestId('rankings-section')).toBeInTheDocument();
    });
  });
});
