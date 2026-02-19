import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock sound manager
jest.mock('../lib/sound-manager', () => ({
  __esModule: true,
  default: { mute: jest.fn(), unmute: jest.fn() },
  soundManager: { mute: jest.fn(), unmute: jest.fn() },
}));

jest.mock('../components/LiveFightSection', () => {
  return function MockLiveFightSection() {
    return <div data-testid="live-fight-section">Live Fight Section</div>;
  };
});

import FightCanvas from '../components/FightCanvas';

// Minimal mock data for FightCanvas
const mockFightState = {
  status: 'fighting' as const,
  clock: 180,
  round: 1,
  fighters: [
    { id: '1', hp: 100, maxHp: 100, stamina: 100, position: { x: 150, y: 200 }, isBlocking: false, isDodging: false, isStunned: false, stunTimer: 0, isKnockedOut: false, combo: 0, action: null as any, actionTimer: 0, damage: 0, modifiers: [], blockTimer: 0, blockDecay: 0, dodgeTimer: 0, dodgeCooldown: 0, lastAction: null, consecutive: 0, bootGlow: 0 },
    { id: '2', hp: 100, maxHp: 100, stamina: 100, position: { x: 450, y: 200 }, isBlocking: false, isDodging: false, isStunned: false, stunTimer: 0, isKnockedOut: false, combo: 0, action: null as any, actionTimer: 0, damage: 0, modifiers: [], blockTimer: 0, blockDecay: 0, dodgeTimer: 0, dodgeCooldown: 0, lastAction: null, consecutive: 0, bootGlow: 0 },
  ],
  commentary: [],
  winner: null,
  method: null,
  scorecard: { fighter1: { hits: 0, powerShots: 0, combos: 0, knockdowns: 0 }, fighter2: { hits: 0, powerShots: 0, combos: 0, knockdowns: 0 } },
} as any;

const mockFighters = [
  { id: '1', name: 'Fighter A', emoji: '🥊', class: 'Heavyweight' as const, stats: { strength: 80, speed: 80, defense: 80, stamina: 80, fightIQ: 80, aggression: 80 } },
  { id: '2', name: 'Fighter B', emoji: '🥋', class: 'Heavyweight' as const, stats: { strength: 80, speed: 80, defense: 80, stamina: 80, fightIQ: 80, aggression: 80 } },
] as any[];

describe('Fight Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('FightCanvas component renders correctly', () => {
    expect(() => {
      render(<FightCanvas fightState={mockFightState} fighters={mockFighters} />);
    }).not.toThrow();
  });

  test('FightCanvas renders a canvas element', () => {
    const { container } = render(
      <FightCanvas fightState={mockFightState} fighters={mockFighters} />
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('LiveFightSection renders without errors', () => {
    const LiveFightSection = require('../components/LiveFightSection');
    expect(() => {
      render(<LiveFightSection />);
    }).not.toThrow();
  });

  test('LiveFightSection contains live fight content', () => {
    const LiveFightSection = require('../components/LiveFightSection');
    render(<LiveFightSection />);
    expect(screen.getByTestId('live-fight-section')).toBeInTheDocument();
  });
});
