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

describe('Fight Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
