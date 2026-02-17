import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock complex dependencies before importing components
jest.mock('../lib/fight-engine', () => ({
  FightEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    restart: jest.fn(),
  })),
}));

jest.mock('../lib/market-engine', () => ({
  MarketEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    updateBasedOnFightState: jest.fn(),
    settleMarket: jest.fn(),
    placeTrade: jest.fn().mockReturnValue({ status: 'filled' }),
  })),
}));

jest.mock('../lib/sound-manager', () => {
  const mock = { play: jest.fn(), stop: jest.fn(), setVolume: jest.fn(), mute: jest.fn(), unmute: jest.fn() };
  return { __esModule: true, default: mock, soundManager: mock };
});

jest.mock('../lib/store', () => ({
  useGameStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: { credits: 5000 },
      placeBetAndDeduct: jest.fn().mockReturnValue(true),
      fetchCredits: jest.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

jest.mock('../lib/evolution-engine', () => ({
  FighterEvolutionEngine: {
    createNewEvolution: jest.fn().mockReturnValue({
      traits: { aggressive: 50, defensive: 50, showboat: 50, technical: 50 },
      signatureMoves: [],
      age: 28,
      peakAgeStart: 25,
      peakAgeEnd: 32,
      fightHistory: [],
      evolutionLevel: 1,
      totalFights: 0,
      winStreak: 0,
      careerHighlights: [],
    }),
    updateAfterFight: jest.fn((f: unknown) => f),
  },
}));

// Mock child components that LiveFightSection depends on
jest.mock('../components/EnhancedFightCanvas', () => {
  return function MockEnhancedFightCanvas() {
    return <div data-testid="fight-canvas">Fight Canvas</div>;
  };
});

jest.mock('../components/MarketSidebar', () => {
  return function MockMarketSidebar() {
    return <div data-testid="market-sidebar">Market Sidebar</div>;
  };
});

jest.mock('../components/FightCard', () => {
  return function MockFightCard() {
    return <div data-testid="fight-card">Fight Card</div>;
  };
});

jest.mock('../components/CommentaryBar', () => {
  return function MockCommentaryBar() {
    return <div data-testid="commentary-bar">Commentary Bar</div>;
  };
});

jest.mock('../components/LiveBettingInterface', () => {
  return function MockLiveBettingInterface() {
    return <div data-testid="live-betting">Live Betting</div>;
  };
});

// Mock components that ArenaPage depends on
jest.mock('../components/TopBar', () => {
  return function MockTopBar() {
    return <div data-testid="top-bar">Top Bar</div>;
  };
});

jest.mock('../components/FightersSection', () => {
  return function MockFightersSection() {
    return <div data-testid="fighters-section">Fighters Section</div>;
  };
});

jest.mock('../components/RankingsSection', () => {
  return function MockRankingsSection() {
    return <div data-testid="rankings-section">Rankings Section</div>;
  };
});

jest.mock('../components/LiveFightSection', () => {
  return function MockLiveFightSection() {
    return <div data-testid="live-fight-section">Live Fight Section</div>;
  };
});

import ArenaPage from '../components/ArenaPage';

const defaultArenaProps = {
  currentSection: 'live' as const,
  onSectionChange: jest.fn(),
  onGoHome: jest.fn(),
};

describe('Fight Components Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ArenaPage component renders without crashing', () => {
    expect(() => {
      render(<ArenaPage {...defaultArenaProps} />);
    }).not.toThrow();
  });

  test('ArenaPage contains fight-related content', () => {
    const { container } = render(<ArenaPage {...defaultArenaProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('ArenaPage renders the TopBar', () => {
    render(<ArenaPage {...defaultArenaProps} />);
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
  });

  test('ArenaPage renders the LiveFightSection by default', () => {
    render(<ArenaPage {...defaultArenaProps} />);
    expect(screen.getByTestId('live-fight-section')).toBeInTheDocument();
  });

  test('fight components have proper DOM structure', () => {
    const { container } = render(<ArenaPage {...defaultArenaProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('fight components render with styling', () => {
    const { container } = render(<ArenaPage {...defaultArenaProps} />);
    const styledElement = container.querySelector('[class]');
    expect(styledElement).toBeInTheDocument();
  });
});
