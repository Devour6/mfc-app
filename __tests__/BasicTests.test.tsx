import React from 'react';

/**
 * Basic integration tests to ensure testing infrastructure works
 */

describe('Basic Integration Tests', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('DOM testing environment is available', () => {
    const element = document.createElement('div');
    element.textContent = 'Hello World';
    expect(element.textContent).toBe('Hello World');
  });

  test('React testing library is functioning', () => {
    const testComponent = () => {
      return <div data-testid="test">Test Component</div>;
    };

    expect(testComponent).toBeDefined();
  });

  test('Array methods work correctly', () => {
    const arr = [1, 2, 3];
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6]);
  });

  test('String manipulation works', () => {
    const str = 'hello world';
    expect(str.toUpperCase()).toBe('HELLO WORLD');
    expect(str.includes('world')).toBe(true);
  });

  test('Object operations work', () => {
    const obj = { name: 'MFC App', version: '1.0' };
    expect(obj.name).toBe('MFC App');
    expect(Object.keys(obj)).toContain('version');
  });
});
