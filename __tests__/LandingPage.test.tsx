import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../components/LandingPage';

const mockOnEnterArena = jest.fn();

describe('LandingPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('landing page renders without errors', () => {
    expect(() => {
      render(<LandingPage onEnterArena={mockOnEnterArena} />);
    }).not.toThrow();
  });

  test('landing page contains MFC-related content', () => {
    render(<LandingPage onEnterArena={mockOnEnterArena} />);
    const mfcContent = screen.queryAllByText(/MFC|fight|Fighter|Champion|arena/i);
    expect(mfcContent.length).toBeGreaterThan(0);
  });

  test('landing page has interactive elements', () => {
    render(<LandingPage onEnterArena={mockOnEnterArena} />);
    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');
    expect(buttons.length + links.length).toBeGreaterThan(0);
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
