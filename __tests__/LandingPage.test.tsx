import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../components/LandingPage';

describe('LandingPage Component Tests', () => {
  const mockOnEnterArena = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('landing page renders without errors', () => {
    expect(() => {
      render(<LandingPage onEnterArena={mockOnEnterArena} />);
    }).not.toThrow();
  });

  test('landing page contains main content', () => {
    render(<LandingPage onEnterArena={mockOnEnterArena} />);
    expect(screen.getByText('MFC')).toBeInTheDocument();
  });

  test('landing page has interactive elements', () => {
    render(<LandingPage onEnterArena={mockOnEnterArena} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('landing page structure is valid', () => {
    const { container } = render(<LandingPage onEnterArena={mockOnEnterArena} />);
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('landing page renders with proper styling classes', () => {
    const { container } = render(<LandingPage onEnterArena={mockOnEnterArena} />);
    const elementWithClasses = container.querySelector('[class]');
    expect(elementWithClasses).toBeInTheDocument();
  });
});
