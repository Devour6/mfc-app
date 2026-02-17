import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomePage from '../app/page';

// Mock the child components to avoid complex dependencies
jest.mock('../components/LiveFightSection', () => {
  return function MockLiveFightSection() {
    return <div data-testid="live-fight-section">Live Fight Section</div>;
  };
});

jest.mock('../components/LandingPage', () => {
  return function MockLandingPage({ onEnterArena }: { onEnterArena: (role: string) => void }) {
    return (
      <div data-testid="landing-page">
        <button data-testid="enter-arena" onClick={() => onEnterArena('spectator')}>
          Enter Arena
        </button>
      </div>
    );
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

  test('landing page renders without crashing', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  test('app starts in landing view', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    // Arena sections should NOT be visible in landing view
    expect(screen.queryByTestId('live-fight-section')).not.toBeInTheDocument();
  });

  test('app renders without throwing errors', () => {
    expect(() => {
      render(<HomePage />);
    }).not.toThrow();
  });

  test('can navigate to arena view', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    // Wait for isLoaded effect
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    // Click to enter arena
    await user.click(screen.getByTestId('enter-arena'));

    // Now the live fight section should appear (default arena section)
    await waitFor(() => {
      expect(screen.getByTestId('live-fight-section')).toBeInTheDocument();
    });
  });
});
