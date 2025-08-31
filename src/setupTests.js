// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.confirm and window.alert
global.confirm = jest.fn();
global.alert = jest.fn();

// Mock window.URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(),
  onload: null,
  onerror: null
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to see console.log in tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
