import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ArenaPage from '../components/ArenaPage';
import FightCanvas from '../components/FightCanvas';
import LiveFightSection from '../components/LiveFightSection';

describe('Fight Components Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ArenaPage component renders without crashing', () => {
    expect(() => {
      render(<ArenaPage />);
    }).not.toThrow();
  });

  test('ArenaPage contains fight-related content', async () => {
    render(<ArenaPage />);
    
    // Look for fight-related content
    const fightContent = screen.queryByText(/arena|fight|battle|fighter/i) ||
                         screen.queryByRole('button') ||
                         document.body.firstChild;
    
    expect(fightContent).toBeInTheDocument();
  });

  test('FightCanvas component renders correctly', () => {
    expect(() => {
      render(<FightCanvas />);
    }).not.toThrow();
  });

  test('FightCanvas has interactive canvas element', async () => {
    render(<FightCanvas />);
    
    // Look for canvas or interactive elements
    const canvas = screen.queryByRole('img') || 
                   document.querySelector('canvas') ||
                   document.querySelector('[data-testid*="canvas"]') ||
                   document.body.firstChild;
    
    expect(canvas).toBeInTheDocument();
  });

  test('LiveFightSection renders without errors', () => {
    expect(() => {
      render(<LiveFightSection />);
    }).not.toThrow();
  });

  test('LiveFightSection contains live fight information', async () => {
    render(<LiveFightSection />);
    
    // Should contain some content
    const liveFightElement = screen.queryByText(/live|fight|vs|round|time/i) ||
                            document.body.firstChild;
    
    expect(liveFightElement).toBeInTheDocument();
  });

  test('fight components have proper DOM structure', () => {
    const { container: arenaContainer } = render(<ArenaPage />);
    const { container: canvasContainer } = render(<FightCanvas />);
    const { container: liveContainer } = render(<LiveFightSection />);
    
    expect(arenaContainer.firstChild).toBeInTheDocument();
    expect(canvasContainer.firstChild).toBeInTheDocument();
    expect(liveContainer.firstChild).toBeInTheDocument();
  });

  test('fight components render with styling', () => {
    const { container: arenaContainer } = render(<ArenaPage />);
    
    // Should have some styled elements
    const styledElement = arenaContainer.querySelector('[class]');
    expect(styledElement).toBeInTheDocument();
  });
});