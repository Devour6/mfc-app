import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  return function MockLandingPage() {
    return <div data-testid="landing-page">Landing Page</div>;
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
    // Reset any mocks before each test
    jest.clearAllMocks();
  });

  test('landing page renders without crashing', async () => {
    render(<HomePage />);
    
    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  test('app renders main components correctly', async () => {
    render(<HomePage />);
    
    // Check that all major sections are present
    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('live-fight-section')).toBeInTheDocument();
      expect(screen.getByTestId('daily-rewards')).toBeInTheDocument();
      expect(screen.getByTestId('rankings-section')).toBeInTheDocument();
      expect(screen.getByTestId('tournament-bracket')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-system')).toBeInTheDocument();
      expect(screen.getByTestId('fighters-section')).toBeInTheDocument();
    });
  });

  test('app renders without throwing errors', () => {
    // This test ensures the app can render without any JavaScript errors
    expect(() => {
      render(<HomePage />);
    }).not.toThrow();
  });

  test('main page contains expected content structure', async () => {
    render(<HomePage />);
    
    // Verify the app structure is rendered
    const appContainer = screen.getByTestId('landing-page').parentElement;
    expect(appContainer).toBeInTheDocument();
    
    // Check that multiple components are rendered
    const components = [
      'landing-page',
      'live-fight-section', 
      'daily-rewards',
      'rankings-section',
      'tournament-bracket',
      'achievement-system',
      'fighters-section'
    ];
    
    for (const componentTestId of components) {
      await waitFor(() => {
        expect(screen.getByTestId(componentTestId)).toBeInTheDocument();
      });
    }
  });
});