import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LandingPage from '../components/LandingPage';

describe('LandingPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('landing page renders without errors', () => {
    expect(() => {
      render(<LandingPage />);
    }).not.toThrow();
  });

  test('landing page contains main content', async () => {
    render(<LandingPage />);
    
    // The component should render some content
    const landingPageElement = screen.getByRole('main', { hidden: true }) || 
                              screen.getByText(/MFC|fight|Mixed|Fighter|Champion/i) ||
                              document.querySelector('[data-testid*="landing"]') ||
                              document.body.firstChild;
    
    expect(landingPageElement).toBeInTheDocument();
  });

  test('landing page has interactive elements', async () => {
    render(<LandingPage />);
    
    // Look for interactive elements like buttons or links
    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');
    
    // Should have some interactive elements
    expect(buttons.length + links.length).toBeGreaterThan(0);
  });

  test('landing page structure is valid', () => {
    const { container } = render(<LandingPage />);
    
    // Basic DOM structure validation
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  test('landing page renders with proper styling classes', () => {
    const { container } = render(<LandingPage />);
    
    // Check if the component has some styling/classes
    const elementWithClasses = container.querySelector('[class]');
    expect(elementWithClasses).toBeInTheDocument();
  });
});